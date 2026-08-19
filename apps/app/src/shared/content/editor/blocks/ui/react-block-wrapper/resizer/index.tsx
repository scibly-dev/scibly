import type { NodeViewProps } from "@tiptap/core";
import type { Alignment } from "@/shared/content/editor/blocks/attributes/default-media-attributes";

import { useWindowSize } from "@scibly/lib/hooks/use-window-size";
import { cn } from "@scibly/ui/utils";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import {
  getMediaAttributes,
  type MediaBlock,
} from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import typedUpdateAttributes from "@/shared/content/editor/blocks/attributes/typed-update-attributes";
import ResizeHandle from "@/shared/content/editor/blocks/ui/react-block-wrapper/resizer/resize-handle";

// based on https://github.com/sereneinserenade/notitap/blob/main/src/tiptap/extensions/resizableMedia/ResizableMediaNodeView.tsx

// ! had to manage this state outside of the component because `useState` isn't fast enough and creates problem cause
// ! the function is getting old data even though new data is set by `useState` before the execution of function
let initialClientX: number;
let initialWidth: number;
let handleMouseMove: null | ((e: MouseEvent) => void) = null;

type ResizableProps = {
  isEditorEditable: boolean;
  children: React.ReactNode;
  node: NodeViewProps["node"];
  isVideo: boolean;
  updateAttributes: NodeViewProps["updateAttributes"];
  mediaLoading?: boolean;
};

type Dimensions = {
  width: number | string;
  height: number | string;
};

type DirectionOfMouseMove = "left" | "right";

const getAlignment = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} satisfies Record<Alignment, string>;

const VIDEO_ASPECT_RATIO = 16 / 9;

const setInitialClientX = (x: number) => {
  initialClientX = x;
};

const getMouseMoveDirection = (
  diff: number,
  leftHandle: boolean,
): DirectionOfMouseMove => {
  if (leftHandle) {
    return diff > 0 ? "right" : "left";
  }
  return diff > 0 ? "left" : "right";
};

const limitWidthOrHeightToFiftyPixels = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => width < 50 || height < 50;

export const Resizable = memo((props: ResizableProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(0);
  const mediaAttributes = getMediaAttributes(props.node);
  const { width: windowWidth = 0 } = useWindowSize();
  const [proseMirrorContainerWidth, setProseMirrorContainerWidth] = useState(0);
  const [localDimensions, setLocalDimensions] = useState<Dimensions>({
    width: mediaAttributes.width,
    height: mediaAttributes.height,
  });

  useEffect(() => {
    setLocalDimensions({
      width: mediaAttributes.width,
      height: mediaAttributes.height,
    });
  }, [mediaAttributes.width, mediaAttributes.height]);

  const debouncedAttrsUpdate = useDebouncedCallback(
    ({ width, height }: Dimensions) => {
      typedUpdateAttributes<MediaBlock, "mediaBlockAttributes">(
        props.updateAttributes,
        "mediaBlockAttributes",
        { ...mediaAttributes, ...{ width, height } },
      );
    },
    200,
  );

  const updateDimensions = ({ width, height }: Dimensions) => {
    setLocalDimensions({ width, height });
    debouncedAttrsUpdate({ width, height });
  };

  const mediaSetupOnLoad = useCallback(() => {
    const proseMirrorContainerDiv = document.querySelector(".ProseMirror");
    if (proseMirrorContainerDiv) {
      const computedStyle = window.getComputedStyle(proseMirrorContainerDiv);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      setProseMirrorContainerWidth(
        proseMirrorContainerDiv.clientWidth - paddingLeft - paddingRight,
      );
    }

    if (props.isVideo) {
      setAspectRatio(VIDEO_ASPECT_RATIO);
    } else if (containerRef.current) {
      const img = containerRef.current.querySelector("img");
      if (img && img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      } else {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width && height) {
          setAspectRatio(width / height);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isVideo, windowWidth, props.mediaLoading]);

  useEffect(() => {
    mediaSetupOnLoad();
  }, [mediaSetupOnLoad, props.mediaLoading]);

  const onHorizontalResize = (diff: number, leftHandle: boolean) => {
    if (!containerRef.current) return;

    const absDiff = Math.abs(diff);
    const directionOfMouseMove = getMouseMoveDirection(diff, leftHandle);

    let newWidth =
      directionOfMouseMove === "left"
        ? initialWidth - absDiff
        : initialWidth + absDiff;

    if (newWidth >= proseMirrorContainerWidth) {
      updateDimensions({ width: "100%", height: "auto" });
      return;
    }

    let newHeight: number | string = "auto";
    if (aspectRatio > 0 && isFinite(aspectRatio)) {
      newHeight = newWidth / aspectRatio;
    }

    const currentMediaDimensions = {
      width: newWidth,
      height: typeof newHeight === "number" ? newHeight : 50,
    };
    if (limitWidthOrHeightToFiftyPixels(currentMediaDimensions)) return;

    updateDimensions({
      width: `${newWidth}px`,
      height: typeof newHeight === "number" ? `${newHeight}px` : newHeight,
    });
  };

  const onHorizontalMouseMove = (e: MouseEvent, leftHandle: boolean) => {
    const { clientX } = e;
    const diff = initialClientX - clientX;

    if (diff === 0) return;

    onHorizontalResize(diff, leftHandle);
  };

  const startHorizontalResize = (clientX: number, leftHandle: boolean) => {
    initialClientX = clientX;
    initialWidth = containerRef.current?.clientWidth || 0;
    setIsResizing(true);

    handleMouseMove = (e: MouseEvent) => onHorizontalMouseMove(e, leftHandle);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopHorizontalResize);
  };

  const stopHorizontalResize = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove!);
    document.removeEventListener("mouseup", stopHorizontalResize);
  };

  return (
    <div
      className={cn(
        `inline-flex w-full max-w-full transition-all ease-in-out`,
        getAlignment[mediaAttributes.alignment],
      )}
    >
      <div
        ref={containerRef}
        style={{
          width: localDimensions.width,
          height: localDimensions.height,
          maxWidth: "100%",
        }}
        className={cn(
          "group/resizable relative max-w-full min-w-32 transform-gpu rounded-xl",
          props.node.attrs.src === null && "min-w-120 pt-[56.25%]",
        )}
      >
        {props.children}
        {props.isEditorEditable && (
          <>
            <ResizeHandle
              setLastClientX={setInitialClientX}
              startHorizontalResize={startHorizontalResize}
              stopHorizontalResize={stopHorizontalResize}
            />
            <ResizeHandle
              setLastClientX={setInitialClientX}
              startHorizontalResize={startHorizontalResize}
              stopHorizontalResize={stopHorizontalResize}
              leftHandle={false}
            />
          </>
        )}
      </div>
      {/* Needed to prevent mouse events from being triggered when hovering over the video player */}
      {isResizing && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
});

Resizable.displayName = "Resizable";
export default Resizable;
