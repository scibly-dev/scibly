import type { MDXComponents } from "mdx/types";

import Image from "next/image";
import * as React from "react";

import { Callout } from "@/app/[lang]/blog/components/callout";
import { CodeBlock } from "@/app/[lang]/blog/components/code-block";
import { lipShadow } from "@/app/[lang]/components/marketing-tokens";

function getHeadingText(node: React.ReactNode): string {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") {
    return node.toString();
  }
  if (Array.isArray(node)) {
    return node.map(getHeadingText).join("");
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getHeadingText(node.props.children);
  }
  return "";
}

export function slugify(node: React.ReactNode): string {
  const text = getHeadingText(node);
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-");
}

function MdxCode({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={`${className || ""} border-hairline bg-ground-soft text-ink rounded-md border px-1.5 py-0.5 font-mono text-[0.875em] font-medium`}
    >
      {children}
    </code>
  );
}

type CodeElement = React.ReactElement<{
  children?: React.ReactNode;
  className?: string;
}>;

const isCodeElement = (child: React.ReactNode): child is CodeElement =>
  React.isValidElement<CodeElement["props"]>(child) &&
  (child.type === "code" || child.type === MdxCode);

// MDX leaves whitespace-only text nodes between table tags, which React rejects as invalid table children.
function tableChildren(children: React.ReactNode) {
  return React.Children.toArray(children).filter(
    (child) => !(typeof child === "string" && child.trim() === ""),
  );
}

// This is autoinjected during build time by the MDX compiler
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="font-display text-ink mt-9 mb-4 text-[30px] leading-[1.12] font-medium tracking-[-0.026em] md:text-[34px]">
        {children}
      </h1>
    ),
    h2: ({ children }) => {
      const id = slugify(children);
      return (
        <h2
          id={id}
          className="group font-display border-ground text-ink relative mt-10 mb-4 border-b-2 pb-2.5 text-[22px] leading-[1.2] font-medium tracking-[-0.022em] md:text-[26px]"
        >
          <a
            href={`#${id}`}
            className="hover:text-ink-faint absolute -left-5 pr-2 text-[#c3cbe0] no-underline opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </a>
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const id = slugify(children);
      return (
        <h3
          id={id}
          className="group font-display text-ink relative mt-8 mb-3 text-[17.5px] leading-[1.3] font-semibold tracking-[-0.016em] md:text-[19px]"
        >
          <a
            href={`#${id}`}
            className="hover:text-ink-faint absolute -left-5 pr-2 text-[#c3cbe0] no-underline opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </a>
          {children}
        </h3>
      );
    },
    p: ({ children }) => (
      <p className="text-ink-muted mt-0 mb-5 font-sans text-[15.5px] leading-[1.7] font-normal text-pretty md:text-[16.5px]">
        {children}
      </p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-link font-medium underline decoration-[#b9d7ff] decoration-2 underline-offset-[3px] transition-colors duration-200 hover:decoration-[#7ab4ff]"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="text-ink-muted mt-0 mb-5 list-disc space-y-2.5 pl-6 font-sans text-[15.5px] leading-[1.65] marker:text-[#b9c3dc] md:text-[16.5px]">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="text-ink-muted marker:text-ink-faint mt-0 mb-5 list-decimal space-y-2.5 pl-6 font-sans text-[15.5px] leading-[1.65] marker:font-semibold md:text-[16.5px]">
        {children}
      </ol>
    ),
    li: ({ children }) => {
      const isTaskItem = React.Children.toArray(children).some(
        (child) =>
          React.isValidElement<React.InputHTMLAttributes<HTMLInputElement>>(
            child,
          ) && child.props.type === "checkbox",
      );
      return (
        <li
          className="pl-1"
          style={
            isTaskItem ? { listStyle: "none", marginLeft: "-1rem" } : undefined
          }
        >
          {children}
        </li>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-hairline text-ink-muted my-7 rounded-[16px] border-2 bg-[#f9fbff] px-5 py-4 font-sans text-[15.5px] leading-[1.7] shadow-[0_4px_0_0_var(--color-lip)] [&>p:last-child]:mb-0">
        {children}
      </blockquote>
    ),
    pre: ({ children }) => {
      const childrenArray = React.Children.toArray(children);
      const codeElement = childrenArray.find(isCodeElement);

      if (codeElement) {
        let codeText = "";
        if (typeof codeElement.props.children === "string") {
          codeText = codeElement.props.children;
        } else if (Array.isArray(codeElement.props.children)) {
          codeText = codeElement.props.children
            .map((c) => (typeof c === "string" ? c : ""))
            .join("");
        } else if (codeElement.props.children) {
          codeText = codeElement.props.children.toString();
        }

        return (
          <CodeBlock className={codeElement.props.className}>
            {codeText}
          </CodeBlock>
        );
      }
      return <pre>{children}</pre>;
    },
    code: MdxCode,
    hr: () => <hr className="border-ground my-9 border-t-2" />,
    img: (props) => {
      const src = typeof props.src === "string" ? props.src : "";
      return (
        <div className="border-hairline bg-ground-soft my-9 flex w-full flex-col items-center overflow-hidden rounded-[18px] border-2 shadow-[0_4px_0_0_var(--color-lip)]">
          <Image
            src={src}
            alt={props.alt || "Image"}
            width={1200}
            height={675}
            className="h-auto max-w-full rounded-[16px] object-cover"
            unoptimized
          />
          {props.alt && (
            <span className="text-ink-faint mt-2 pb-2.5 font-sans text-[12.5px] font-medium">
              {props.alt}
            </span>
          )}
        </div>
      );
    },
    tr: ({ children }: { children?: React.ReactNode }) => (
      <tr>{tableChildren(children)}</tr>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead>{tableChildren(children)}</thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => (
      <tbody>{tableChildren(children)}</tbody>
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div
        style={{
          margin: "2.25rem 0",
          width: "100%",
          overflowX: "auto",
          borderRadius: "18px",
          border: "2px solid var(--color-hairline)",
          boxShadow: lipShadow("var(--color-lip)"),
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          {tableChildren(children)}
        </table>
      </div>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th
        style={{
          padding: "12px 20px",
          textAlign: "left",
          fontSize: "12.5px",
          fontWeight: 600,
          color: "var(--color-ink-muted)",
          borderBottom: "2px solid var(--color-lip)",
          backgroundColor: "var(--color-ground-soft)",
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td
        style={{
          padding: "13px 20px",
          fontSize: "14.5px",
          lineHeight: "1.6",
          color: "var(--color-ink-muted)",
          borderBottom: "2px solid #f4f7fc",
        }}
      >
        {children}
      </td>
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Table: ({ children }: { children?: React.ReactNode }) => (
      <div
        style={{
          margin: "2.25rem 0",
          width: "100%",
          overflowX: "auto",
          borderRadius: "18px",
          border: "2px solid var(--color-hairline)",
          boxShadow: lipShadow("var(--color-lip)"),
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          {tableChildren(children)}
        </table>
      </div>
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Th: ({ children }: { children?: React.ReactNode }) => (
      <th
        style={{
          padding: "12px 20px",
          textAlign: "left",
          fontSize: "12.5px",
          fontWeight: 600,
          color: "var(--color-ink-muted)",
          borderBottom: "2px solid var(--color-lip)",
          backgroundColor: "var(--color-ground-soft)",
        }}
      >
        {children}
      </th>
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Td: ({ children }: { children?: React.ReactNode }) => (
      <td
        style={{
          padding: "13px 20px",
          fontSize: "14.5px",
          lineHeight: "1.6",
          color: "var(--color-ink-muted)",
          borderBottom: "2px solid #f4f7fc",
        }}
      >
        {children}
      </td>
    ),
    input: ({
      type,
      checked,
      ...props
    }: React.InputHTMLAttributes<HTMLInputElement>) => {
      if (type === "checkbox") {
        return (
          <input
            type="checkbox"
            checked={checked}
            disabled
            readOnly
            {...props}
            style={{
              marginRight: "0.5em",
              accentColor: "#3b82f6",
              width: "1em",
              height: "1em",
              verticalAlign: "middle",
              cursor: "default",
            }}
          />
        );
      }
      return <input type={type} {...props} />;
    },
    Callout,
    ...components,
  };
}
