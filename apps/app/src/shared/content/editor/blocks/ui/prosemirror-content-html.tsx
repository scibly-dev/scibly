"use client";

import type { Node as PMNode, Schema } from "@tiptap/pm/model";

import { DOMSerializer } from "@tiptap/pm/model";
import { memo, useMemo } from "react";

const serializeCache = new Map<string, string>();

function getContentCacheKey(node: PMNode): string {
  return `${node.nodeSize}:${node.textContent}`;
}

export function serializeProseMirrorFragment(
  node: PMNode,
  schema: Schema,
): string {
  const cacheKey = getContentCacheKey(node);
  const cached = serializeCache.get(cacheKey);
  if (cached !== undefined) return cached;

  if (typeof document === "undefined") return "";

  const serializer = DOMSerializer.fromSchema(schema);
  const container = document.createElement("div");
  container.appendChild(serializer.serializeFragment(node.content));
  const html = container.innerHTML;

  serializeCache.set(cacheKey, html);
  return html;
}

type ProseMirrorContentHtmlProps = {
  node: PMNode;
  className?: string;
};

export const ProseMirrorContentHtml = memo(
  ({ node, className }: ProseMirrorContentHtmlProps) => {
    const html = useMemo(
      () => serializeProseMirrorFragment(node, node.type.schema),
      [node],
    );

    return (
      <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
    );
  },
);

ProseMirrorContentHtml.displayName = "ProseMirrorContentHtml";
