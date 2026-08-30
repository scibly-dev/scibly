import type { KnowledgeTranslations } from "../../contracts";

import { Button } from "@scibly/ui/components/button";
import { Input } from "@scibly/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@scibly/ui/components/popover";
import { cn } from "@scibly/ui/utils";
import { ChevronDown, Plus, X } from "lucide-react";
import { useState } from "react";

import { api } from "@/shared/api/trpc/client";

import { isValidPathGlob, MAX_TOPIC_PATH_GLOBS } from "../../contracts";
import { Chips } from "./chips";
import { FOLDER_SUFFIX, toggle } from "./contracts";
import { Picker } from "./picker";

export function RepoScopeRow({
  t,
  orgSlug,
  id,
  label,
  stale,
  pathGlobs,
  onGlobs,
  onRemove,
  onInvalid,
}: {
  t: KnowledgeTranslations;
  orgSlug: string;
  id: string;
  label: string;
  // A topic outlives the installation it was scoped through: reconnecting under a different GitHub App leaves ids nothing reaches any more.
  stale: boolean;
  pathGlobs: string[];
  onGlobs: (globs: string[]) => void;
  onRemove: () => void;
  onInvalid: (message: string | null) => void;
}) {
  const [pattern, setPattern] = useState("");
  // Asked only once someone opens the list: each is a paginated walk of a real GitHub tree, and a topic may hold fifty repositories.
  const [browsing, setBrowsing] = useState(false);
  const folders = api.knowledge.listFolders.useQuery(
    { orgSlug, repositoryId: id },
    { enabled: browsing && !stale },
  );

  const addPattern = () => {
    const glob = pattern.trim();
    if (glob === "") return;
    if (!isValidPathGlob(glob)) {
      return onInvalid(t.form.pathsInvalid.replace("{glob}", glob));
    }
    if (!pathGlobs.includes(glob) && pathGlobs.length >= MAX_TOPIC_PATH_GLOBS) {
      return onInvalid(
        t.form.pathsMax.replace("{max}", String(MAX_TOPIC_PATH_GLOBS)),
      );
    }
    onInvalid(null);
    if (!pathGlobs.includes(glob)) onGlobs([...pathGlobs, glob]);
    setPattern("");
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "truncate text-[13px] font-medium",
            stale ? "text-destructive" : "text-ink",
          )}
          title={label}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.form.remove.replace("{name}", label)}
          className="text-ink-faint hover:text-ink shrink-0"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {stale ? (
        <p className="text-destructive text-[12px]">
          {t.form.repositoriesUnreachable}
        </p>
      ) : (
        <>
          <div className="flex gap-2">
            <Popover modal open={browsing} onOpenChange={setBrowsing}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 font-normal"
                >
                  {t.form.foldersBrowse}
                  <ChevronDown
                    className="text-ink-faint h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-80 overflow-hidden p-0"
              >
                <Picker
                  t={t}
                  options={(folders.data?.folders ?? []).map((folder) => ({
                    id: folder,
                    label: folder,
                  }))}
                  selected={pathGlobs
                    .filter((glob) => glob.endsWith(FOLDER_SUFFIX))
                    .map((glob) => glob.slice(0, -FOLDER_SUFFIX.length))}
                  onToggle={(folder) => {
                    const glob = folder + FOLDER_SUFFIX;
                    if (
                      !pathGlobs.includes(glob) &&
                      pathGlobs.length >= MAX_TOPIC_PATH_GLOBS
                    ) {
                      return onInvalid(
                        t.form.pathsMax.replace(
                          "{max}",
                          String(MAX_TOPIC_PATH_GLOBS),
                        ),
                      );
                    }
                    onInvalid(null);
                    onGlobs(toggle(pathGlobs, glob));
                  }}
                  empty={
                    folders.isPending
                      ? t.form.foldersLoading
                      : t.form.foldersEmpty
                  }
                />
              </PopoverContent>
            </Popover>
            <Input
              value={pattern}
              placeholder={t.form.pathsPlaceholder}
              onChange={(event) => setPattern(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addPattern();
                }
              }}
              className="h-8 flex-1 text-[13px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPattern}
              disabled={pattern.trim() === ""}
              className="shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t.form.add}
            </Button>
          </div>
          <Chips
            t={t}
            values={pathGlobs.map((glob) => ({ id: glob, label: glob }))}
            onRemove={(glob) =>
              onGlobs(pathGlobs.filter((each) => each !== glob))
            }
          />
        </>
      )}
    </div>
  );
}
