"use client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@scibly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { cn } from "@scibly/ui/utils";
import { type NodeViewProps } from "@tiptap/react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from "react-zoom-pan-pinch";

import { resolveBlockDocUrl } from "@/lib/utils";
import { getMediaAttributes } from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import MediaWrapper, {
  type MediaWrapperRef,
} from "@/shared/content/editor/blocks/media/components/media-wrapper";
import { normalizeMediaSrc } from "@/shared/content/editor/media/utils/normalize-media-src";

const IMAGE_ZOOM_WRAPPER_CLASS_NAME = "custom-image-zoom-wrapper ";

const ControlsComponent = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform space-x-2">
      <Button variant="secondary" size="icon" onClick={() => zoomOut()}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="icon" onClick={() => resetTransform()}>
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="icon" onClick={() => zoomIn()}>
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const DOC_LINK = resolveBlockDocUrl("media", "bilder");

const CustomImage: React.FC<NodeViewProps> = (props) => {
  const mediaAttributes = getMediaAttributes(props.node);
  const src = normalizeMediaSrc(mediaAttributes.src);
  const mediaRef = useRef<MediaWrapperRef>(null);
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <MediaWrapper
      ref={mediaRef}
      nodeViewProps={props}
      mediaType="image"
      docLink={DOC_LINK}
    >
      <Image
        loading="eager"
        alt="editor-image"
        src={src ?? ""}
        onLoad={() => {
          mediaRef.current?.setMediaLoaded();
        }}
        onError={() => {
          mediaRef.current?.setUnexpectedError();
        }}
        onDoubleClick={() => setIsOpen(true)}
        width={9999}
        height={9999}
        quality={75}
        className="border-hairline w-full cursor-pointer rounded-[20px] border-2 object-cover shadow-[0_4px_0_0_var(--color-lip)]"
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DialogContent
          container={
            typeof document !== "undefined" ? document.body : undefined
          }
          className={cn(
            "z-[9999] flex h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] flex-col overflow-hidden p-0 sm:rounded-2xl",
            IMAGE_ZOOM_WRAPPER_CLASS_NAME,
          )}
          ref={contentRef}
        >
          <VisuallyHidden>
            <DialogTitle>Zoomable Image</DialogTitle>
            <DialogDescription>Fullscreen View</DialogDescription>
          </VisuallyHidden>
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={3}
            centerOnInit={true}
          >
            {() => (
              <>
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                  }}
                  contentStyle={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    src={src ?? ""}
                    alt="zoomable-editor-image"
                    width={9999}
                    height={9999}
                    quality={90}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                </TransformComponent>
                <ControlsComponent />
              </>
            )}
          </TransformWrapper>
        </DialogContent>
      </Dialog>
    </MediaWrapper>
  );
};

export default CustomImage;
