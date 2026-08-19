export function createFaqOpenedSession() {
  const openedIds = new Set<string>();

  return {
    shouldCapture(faqId: string, isOpening: boolean) {
      return isOpening && !openedIds.has(faqId);
    },
    markOpened(faqId: string) {
      openedIds.add(faqId);
    },
  };
}
