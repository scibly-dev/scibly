export const capitalizeFirstLetter = (string?: string) => {
  if (typeof string !== "string") return "";
  if (string.length === 0) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const getInitials = (name: string) => {
  const nameParts = name.split(" ");
  return nameParts
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export const getFirstName = (name?: string | null): string => {
  if (!name) return "";
  return name.trim().split(" ")[0] ?? "";
};
