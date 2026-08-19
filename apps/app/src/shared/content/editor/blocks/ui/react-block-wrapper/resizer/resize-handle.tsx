import { cn } from "@scibly/ui/utils";
import { memo } from "react";

type ResizeHandleProps = {
  leftHandle?: boolean;
  setLastClientX: (x: number) => void;
  startHorizontalResize: (clientX: number, leftHandle: boolean) => void;
  stopHorizontalResize: () => void;
};

export const ResizeHandle: React.FC<ResizeHandleProps> = memo((props) => {
  const {
    leftHandle = true,
    setLastClientX,
    startHorizontalResize,
    stopHorizontalResize,
  } = props;

  return (
    <div
      className={cn(
        leftHandle ? "left-4" : "right-4",
        "absolute top-1/2 h-[25%] -translate-y-1/2 rounded-lg bg-gray-600 group-hover/resizable:w-1.5 hover:cursor-col-resize",
      )}
      onClick={({ clientX }) => setLastClientX(clientX)}
      onMouseDown={(e) => startHorizontalResize(e.clientX, leftHandle)}
      onMouseUp={stopHorizontalResize}
    />
  );
});

ResizeHandle.displayName = "ResizeHandle";
export default ResizeHandle;
