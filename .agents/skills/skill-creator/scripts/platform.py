"""Platform detection and optional CLI backends for skill-creator scripts.

Primary workflow: the IDE agent runs evals and trigger tests directly (see
SKILL.md). These helpers support temp skill installs and unattended CI only.
"""

from __future__ import annotations

import json
import os
import re
import select
import shutil
import subprocess
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Iterator


class AgentPlatform(str, Enum):
    CLAUDE_CODE = "claude-code"
    CURSOR = "cursor"
    UNKNOWN = "unknown"


class AgentBackend(str, Enum):
    AUTO = "auto"
    CLAUDE = "claude"
    CURSOR_SDK = "cursor-sdk"
    MANUAL = "manual"


PROJECT_MARKERS = (".claude", ".cursor", ".agents", ".git")


def find_project_root(start: Path | None = None) -> Path:
    """Walk up from cwd looking for common project / agent marker directories."""
    current = (start or Path.cwd()).resolve()
    for parent in [current, *current.parents]:
        if any((parent / marker).exists() for marker in PROJECT_MARKERS):
            return parent
    return current


def detect_platform(project_root: Path | None = None) -> AgentPlatform:
    root = project_root or find_project_root()
    if (root / ".claude").is_dir():
        return AgentPlatform.CLAUDE_CODE
    if (root / ".cursor").is_dir() or (root / ".agents").is_dir():
        return AgentPlatform.CURSOR
    if shutil.which("claude"):
        return AgentPlatform.CLAUDE_CODE
    if os.environ.get("CURSOR_API_KEY"):
        return AgentPlatform.CURSOR
    return AgentPlatform.UNKNOWN


def resolve_backend(requested: str) -> AgentBackend:
    """Resolve --backend auto|claude|cursor-sdk|manual to a concrete backend."""
    try:
        backend = AgentBackend(requested)
    except ValueError as exc:
        raise ValueError(
            f"Unknown backend {requested!r}. Use auto, claude, cursor-sdk, or manual."
        ) from exc

    if backend != AgentBackend.AUTO:
        return backend

    if shutil.which("claude"):
        return AgentBackend.CLAUDE
    if os.environ.get("CURSOR_API_KEY"):
        return AgentBackend.CURSOR_SDK
    raise RuntimeError(
        "No CLI/SDK backend available for unattended automation. "
        "In an IDE, run trigger evals with subagents instead (see SKILL.md "
        "Description Optimization and agents/trigger-eval.md). "
        "CLI options for CI: install `claude` or set CURSOR_API_KEY + cursor-sdk."
    )


def cursor_skills_dir(project_root: Path) -> Path:
    """Preferred Cursor/agents skill directory for temporary eval installs."""
    agents_skills = project_root / ".agents" / "skills"
    if agents_skills.is_dir() or (project_root / ".agents").is_dir():
        return agents_skills
    return project_root / ".cursor" / "skills"


@dataclass
class TempSkillInstall:
    platform: AgentPlatform
    skill_token: str
    skill_name: str
    install_path: Path


@contextmanager
def install_temp_skill(
    project_root: Path,
    skill_name: str,
    skill_description: str,
    platform: AgentPlatform | None = None,
) -> Iterator[TempSkillInstall]:
    """Install a temporary skill for trigger evaluation, then clean up."""
    platform = platform or detect_platform(project_root)
    unique_id = uuid.uuid4().hex[:8]
    skill_token = f"{skill_name}-skill-{unique_id}"

    if platform == AgentPlatform.CLAUDE_CODE:
        install_dir = project_root / ".claude" / "commands"
        install_dir.mkdir(parents=True, exist_ok=True)
        install_path = install_dir / f"{skill_token}.md"
        indented_desc = "\n  ".join(skill_description.split("\n"))
        install_path.write_text(
            f"---\n"
            f"description: |\n"
            f"  {indented_desc}\n"
            f"---\n\n"
            f"# {skill_name}\n\n"
            f"This skill handles: {skill_description}\n"
        )
    else:
        install_dir = cursor_skills_dir(project_root)
        install_dir.mkdir(parents=True, exist_ok=True)
        install_path = install_dir / f"_eval-{unique_id}"
        install_path.mkdir(parents=True, exist_ok=True)
        skill_md = install_path / "SKILL.md"
        indented_desc = "\n  ".join(skill_description.split("\n"))
        skill_md.write_text(
            f"---\n"
            f"name: {skill_token}\n"
            f"description: |\n"
            f"  {indented_desc}\n"
            f"---\n\n"
            f"# {skill_name}\n\n"
            f"This skill handles: {skill_description}\n"
        )
        install_path = skill_md

    install = TempSkillInstall(
        platform=platform,
        skill_token=skill_token,
        skill_name=skill_name,
        install_path=install_path,
    )
    try:
        yield install
    finally:
        if platform == AgentPlatform.CLAUDE_CODE:
            if install_path.exists():
                install_path.unlink()
        else:
            skill_dir = install_path.parent if install_path.name == "SKILL.md" else install_path
            if skill_dir.is_dir() and skill_dir.name.startswith("_eval-"):
                shutil.rmtree(skill_dir, ignore_errors=True)


def _claude_env() -> dict[str, str]:
    # Allow nesting `claude -p` inside an existing Claude Code session.
    return {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}


def call_agent_text(
    prompt: str,
    model: str | None,
    backend: AgentBackend,
    timeout: int = 300,
) -> str:
    """Send a prompt to an agent backend and return plain text."""
    backend = resolve_backend(backend.value) if backend == AgentBackend.AUTO else backend

    if backend == AgentBackend.CLAUDE:
        cmd = ["claude", "-p", "--output-format", "text"]
        if model:
            cmd.extend(["--model", model])
        result = subprocess.run(
            cmd,
            input=prompt,
            capture_output=True,
            text=True,
            env=_claude_env(),
            timeout=timeout,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"claude -p exited {result.returncode}\nstderr: {result.stderr}"
            )
        return result.stdout

    if backend == AgentBackend.CURSOR_SDK:
        api_key = os.environ.get("CURSOR_API_KEY")
        if not api_key:
            raise RuntimeError("CURSOR_API_KEY is required for cursor-sdk backend")
        try:
            from cursor_sdk import Agent, AgentOptions, LocalAgentOptions
        except ImportError as exc:
            raise RuntimeError(
                "cursor-sdk is not installed. Run: pip install cursor-sdk"
            ) from exc

        result = Agent.prompt(
            prompt,
            AgentOptions(
                api_key=api_key,
                model=model or "composer-2.5",
                local=LocalAgentOptions(cwd=str(find_project_root())),
            ),
        )
        text = getattr(result, "result", None) or getattr(result, "output", None)
        if text:
            return str(text)
        return json.dumps(getattr(result, "__dict__", {}), default=str)

    raise RuntimeError(
        f"Backend {backend.value} cannot generate text. Use claude or cursor-sdk."
    )


def _detect_claude_trigger(process: subprocess.Popen, skill_token: str, timeout: int) -> bool:
    triggered = False
    start_time = __import__("time").time()
    buffer = ""
    pending_tool_name: str | None = None
    accumulated_json = ""

    while __import__("time").time() - start_time < timeout:
        if process.poll() is not None:
            remaining = process.stdout.read() if process.stdout else b""
            if remaining:
                buffer += remaining.decode("utf-8", errors="replace")
            break

        if not process.stdout:
            break

        ready, _, _ = select.select([process.stdout], [], [], 1.0)
        if not ready:
            continue

        chunk = os.read(process.stdout.fileno(), 8192)
        if not chunk:
            break
        buffer += chunk.decode("utf-8", errors="replace")

        while "\n" in buffer:
            line, buffer = buffer.split("\n", 1)
            line = line.strip()
            if not line:
                continue

            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            if event.get("type") == "stream_event":
                se = event.get("event", {})
                se_type = se.get("type", "")

                if se_type == "content_block_start":
                    cb = se.get("content_block", {})
                    if cb.get("type") == "tool_use":
                        tool_name = cb.get("name", "")
                        if tool_name in ("Skill", "Read"):
                            pending_tool_name = tool_name
                            accumulated_json = ""
                        else:
                            return False

                elif se_type == "content_block_delta" and pending_tool_name:
                    delta = se.get("delta", {})
                    if delta.get("type") == "input_json_delta":
                        accumulated_json += delta.get("partial_json", "")
                        if skill_token in accumulated_json:
                            return True

                elif se_type in ("content_block_stop", "message_stop"):
                    if pending_tool_name:
                        return skill_token in accumulated_json
                    if se_type == "message_stop":
                        return False

            elif event.get("type") == "assistant":
                message = event.get("message", {})
                for content_item in message.get("content", []):
                    if content_item.get("type") != "tool_use":
                        continue
                    tool_name = content_item.get("name", "")
                    tool_input = content_item.get("input", {})
                    if tool_name == "Skill" and skill_token in tool_input.get("skill", ""):
                        triggered = True
                    elif tool_name == "Read" and skill_token in tool_input.get("file_path", ""):
                        triggered = True
                    return triggered

            elif event.get("type") == "result":
                return triggered

    return triggered


def _detect_cursor_sdk_trigger(
    query: str,
    skill_token: str,
    project_root: Path,
    timeout: int,
    model: str | None,
) -> bool:
    api_key = os.environ.get("CURSOR_API_KEY")
    if not api_key:
        raise RuntimeError("CURSOR_API_KEY is required for cursor-sdk backend")

    try:
        from cursor_sdk import Agent, AgentOptions, LocalAgentOptions
    except ImportError as exc:
        raise RuntimeError("cursor-sdk is not installed. Run: pip install cursor-sdk") from exc

    result = Agent.prompt(
        query,
        AgentOptions(
            api_key=api_key,
            model=model or "composer-2.5",
            local=LocalAgentOptions(cwd=str(project_root)),
        ),
    )

    serialized = json.dumps(getattr(result, "__dict__", {}), default=str)
    if skill_token in serialized:
        return True

    text = str(getattr(result, "result", "") or getattr(result, "output", "") or "")
    if skill_token in text:
        return True

    # Best-effort: skill folder or SKILL.md read
    return bool(re.search(rf"_eval-[a-f0-9]{{8}}|{re.escape(skill_token)}", serialized + text))


def run_trigger_query(
    query: str,
    skill_name: str,
    skill_description: str,
    project_root: Path,
    timeout: int,
    model: str | None,
    backend: AgentBackend,
) -> bool:
    """Run a query and detect whether the temporary eval skill was triggered."""
    resolved = resolve_backend(backend.value) if backend == AgentBackend.AUTO else backend

    with install_temp_skill(project_root, skill_name, skill_description) as install:
        if resolved == AgentBackend.CLAUDE:
            cmd = [
                "claude",
                "-p",
                query,
                "--output-format",
                "stream-json",
                "--verbose",
                "--include-partial-messages",
            ]
            if model:
                cmd.extend(["--model", model])

            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                cwd=project_root,
                env=_claude_env(),
            )
            try:
                return _detect_claude_trigger(process, install.skill_token, timeout)
            finally:
                if process.poll() is None:
                    process.kill()
                    process.wait()

        if resolved == AgentBackend.CURSOR_SDK:
            return _detect_cursor_sdk_trigger(
                query, install.skill_token, project_root, timeout, model
            )

    raise RuntimeError(f"Unsupported backend for trigger eval: {resolved.value}")
