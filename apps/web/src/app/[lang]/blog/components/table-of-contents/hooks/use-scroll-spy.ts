"use client";

import { useEffect, useState } from "react";

import {
  extractTOCItems,
  findActiveHeadingId,
  type TOCItem,
} from "../utils/toc";

export function useScrollSpy() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const headingElements = Array.from(
      article.querySelectorAll<HTMLElement>("h2, h3"),
    );

    const items = extractTOCItems(headingElements);

    const timer = setTimeout(() => {
      setHeadings(items);
    }, 0);

    const headingStates = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          headingStates.set(entry.target.id, entry.isIntersecting);
        });

        const active = findActiveHeadingId(headingElements, headingStates);
        if (active) {
          setActiveId(active);
        }
      },
      {
        rootMargin: "-100px 0px -60% 0px",
      },
    );

    headingElements.forEach((el) => {
      if (el.id) observer.observe(el);
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return {
    headings,
    activeId,
    setActiveId,
  };
}
