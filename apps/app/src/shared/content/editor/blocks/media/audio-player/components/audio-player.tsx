import { type NodeViewProps } from "@tiptap/react";
import { memo, useCallback, useRef } from "react";

import { resolveBlockDocUrl } from "@/lib/utils";
import { getMediaAttributes } from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import AudioPlayerUI from "@/shared/content/editor/blocks/media/audio-player/components/audio-player-ui";
import MediaWrapper, {
  type MediaWrapperRef,
} from "@/shared/content/editor/blocks/media/components/media-wrapper";

export const DOC_LINK = resolveBlockDocUrl("media", "audio");

const AudioPlayer: React.FC<NodeViewProps> = memo((props) => {
  const mediaAttributes = getMediaAttributes(props.node);
  const src = mediaAttributes.src;
  const mediaRef = useRef<MediaWrapperRef>(null);

  const handleLoaded = useCallback(
    () => mediaRef.current?.setMediaLoaded(),
    [],
  );
  const handleError = useCallback(
    () => mediaRef.current?.setUnexpectedError(),
    [],
  );

  return (
    <MediaWrapper
      ref={mediaRef}
      nodeViewProps={props}
      mediaType="audio"
      docLink={DOC_LINK}
      resizable={false}
      showAlignment={false}
    >
      {src ? (
        <AudioPlayerUI
          src={src}
          onLoaded={handleLoaded}
          onError={handleError}
        />
      ) : null}
    </MediaWrapper>
  );
});

AudioPlayer.displayName = "AudioPlayer";
export default AudioPlayer;
