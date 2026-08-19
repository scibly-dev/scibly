"use client";
import { type NodeViewProps } from "@tiptap/react";
import { memo, useRef } from "react";
import ReactPlayer from "react-player";

import { resolveBlockDocUrl } from "@/lib/utils";
import { getMediaAttributes } from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import MediaWrapper, {
  type MediaWrapperRef,
} from "@/shared/content/editor/blocks/media/components/media-wrapper";

export const DOC_LINK = resolveBlockDocUrl("media", "videos");

const VideoPlayer: React.FC<NodeViewProps> = memo((props) => {
  const mediaAttributes = getMediaAttributes(props.node);
  const src = mediaAttributes.src;
  const mediaRef = useRef<MediaWrapperRef>(null);

  return (
    <MediaWrapper
      ref={mediaRef}
      nodeViewProps={props}
      mediaType="video"
      docLink={DOC_LINK}
    >
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        {/* ReactPlayer is position:absolute; fills the aspect-ratio container */}
        <ReactPlayer
          url={src ?? ""}
          width="100%"
          height="100%"
          onReady={() => {
            mediaRef.current?.setMediaLoaded();
          }}
          onError={() => {
            mediaRef.current?.setUnexpectedError();
          }}
          controls
          className="absolute top-0 left-0 overflow-hidden rounded-xl"
        />
      </div>
    </MediaWrapper>
  );
});

VideoPlayer.displayName = "VideoPlayer";
export default VideoPlayer;
