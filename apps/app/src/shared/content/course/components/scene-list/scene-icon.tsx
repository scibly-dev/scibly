import type { SceneListItem } from "./scene-list-item";

import Icon from "@scibly/ui/components/icon";

export function SceneIcon({
  kind,
  className,
}: {
  kind?: SceneListItem["kind"];
  className?: string;
}) {
  return (
    <Icon
      name={kind === "PRACTICE" ? "FlaskConical" : "FileText"}
      className={className}
    />
  );
}
