export const formatChatDate = (
  dateInput: Date | string,
  lang: string,
): string => {
  const date = new Date(dateInput);
  const now = new Date();

  const dToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dYesterday = new Date(dToday);
  dYesterday.setDate(dYesterday.getDate() - 1);

  const dTime = date.getTime();

  if (dTime >= dToday.getTime()) {
    return lang === "de" ? "Heute" : "Today";
  } else if (dTime >= dYesterday.getTime()) {
    return lang === "de" ? "Gestern" : "Yesterday";
  } else {
    if (lang === "de") {
      return date
        .toLocaleDateString("de-DE", {
          day: "numeric",
          month: "short",
        })
        .replace(/\./g, "");
    } else {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });
    }
  }
};
