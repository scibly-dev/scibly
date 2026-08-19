export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function cleanHeadingText(text: string | null): string {
  if (!text) return "";
  return text.replace(/#\s*$/, "").replace(/^\s*#/, "").trim();
}

export function extractTOCItems(headingElements: HTMLElement[]): TOCItem[] {
  return headingElements
    .map((el) => ({
      id: el.id,
      text: cleanHeadingText(el.textContent),
      level: el.tagName === "H2" ? 2 : 3,
    }))
    .filter((item) => item.id);
}

export function findActiveHeadingId(
  headingElements: HTMLElement[],
  headingStates: Map<string, boolean>,
): string | null {
  let active = "";
  for (const el of headingElements) {
    if (headingStates.get(el.id)) {
      active = el.id;
    }
  }

  if (active) return active;

  const scrolledPast = headingElements.filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < 120;
  });

  if (scrolledPast.length > 0) {
    return scrolledPast[scrolledPast.length - 1].id;
  }

  if (headingElements.length > 0) {
    return headingElements[0].id;
  }

  return null;
}

export function scrollToHeading(id: string): void {
  const el = document.getElementById(id);
  if (el) {
    const yOffset = -90;
    const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}
