import {
  COURSE_HIGHLIGHT,
  COURSE_PATH_THEME,
  PATH_STEP_HEIGHT_PX,
  PATH_WIDTH_PX,
} from "../course-path-theme";

interface PathConnectorProps {
  fromOffset: number;
  toOffset: number;
  active: boolean;
}

const FOOTSTEPS = {
  fill: "none",
  strokeWidth: 10,
  strokeLinecap: "round",
  strokeDasharray: "0 18",
} as const;

export function PathConnector({
  fromOffset,
  toOffset,
  active,
}: PathConnectorProps) {
  const centerX = PATH_WIDTH_PX / 2;
  const fromX = centerX + fromOffset;
  const toX = centerX + toOffset;
  const height = PATH_STEP_HEIGHT_PX;

  return (
    <svg
      className="block shrink-0"
      width={PATH_WIDTH_PX}
      height={height}
      viewBox={`0 0 ${PATH_WIDTH_PX} ${height}`}
      aria-hidden
    >
      <path
        d={`M ${fromX} 0 C ${fromX} ${height * 0.6}, ${toX} ${height * 0.4}, ${toX} ${height}`}
        {...FOOTSTEPS}
        stroke={
          active ? COURSE_HIGHLIGHT.pathActive : COURSE_PATH_THEME.pathStroke
        }
      />
    </svg>
  );
}
