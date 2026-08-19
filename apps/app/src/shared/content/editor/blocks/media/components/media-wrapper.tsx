"use client";

import type { icons } from "lucide-react";

import useNetworkState from "@scibly/lib/hooks/use-network-state";
import LoadingSpinner from "@scibly/ui/components/loading-spinner";
import { Popover } from "@scibly/ui/components/popover";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { type MediaTypes } from "@/lib/media-types";
import {
  getMediaAttributes,
  updateMediaAttributes,
} from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import MediaPlaceholder from "@/shared/content/editor/blocks/media/components/media-placeholder";
import ReactBlockWrapper from "@/shared/content/editor/blocks/ui/react-block-wrapper";
import { MediaOptionsMenuItem } from "@/shared/content/editor/blocks/ui/react-block-wrapper/block-options-menu";
import FileUploadInput from "@/shared/content/editor/media/components/file-upload-input-popover";
import { getMediaLabels } from "@/shared/content/editor/media/utils/media";
import { useEditorCapabilities } from "@/shared/content/editor/runtime/context/editor-capabilities-context";

const MEDIA_TYPE_ICON = {
  image: "Image",
  video: "Video",
  audio: "AudioLines",
} satisfies Record<MediaTypes, keyof typeof icons>;

type MediaWrapperProps = {
  nodeViewProps: NodeViewProps;
  children: React.ReactNode;
  mediaType: MediaTypes;
  docLink: string;

  resizable?: boolean;

  showAlignment?: boolean;
};

export type MediaWrapperRef = {
  setUnexpectedError: () => void;
  setMediaLoaded: () => void;
};

export const MediaWrapper = forwardRef<MediaWrapperRef, MediaWrapperProps>(
  (props, ref) => {
    const { translations } = useTranslation("editorUi");
    const { mediaUploads } = useEditorCapabilities();
    const [loading, setLoading] = useState(false);
    const networkState = useNetworkState();
    const mediaAttributes = getMediaAttributes(props.nodeViewProps.node);
    const resizable = props.resizable ?? true;
    const showAlignment = props.showAlignment ?? true;
    const { type: mediaTypeLabel, embed: embedLabel } = getMediaLabels(
      props.mediaType,
      translations.media,
    );

    const handleUnexpectedError = useCallback(() => {
      setLoading(false);
      toast.error(
        translations.media.unexpectedLoadError.replace(
          "{{mediaType}}",
          mediaTypeLabel,
        ),
      );
      updateMediaAttributes(props.nodeViewProps, { src: "" });
    }, [
      mediaTypeLabel,
      props.nodeViewProps,
      translations.media.unexpectedLoadError,
    ]);

    useImperativeHandle(ref, () => ({
      setUnexpectedError: () => handleUnexpectedError(),
      setMediaLoaded: () => setLoading(false),
    }));

    return (
      <NodeViewWrapper>
        {mediaAttributes.src && networkState.online ? (
          <ReactBlockWrapper
            isEditorEditable={props.nodeViewProps.editor.isEditable}
            docLink={props.docLink}
            nodeViewProps={props.nodeViewProps}
            isVideo={props.mediaType === "video"}
            mediaLoading={loading}
            resizable={resizable}
            showAlignment={showAlignment}
            blockOptionsChildren={
              <Popover>
                <MediaOptionsMenuItem
                  icon={MEDIA_TYPE_ICON[props.mediaType]}
                  tooltip={embedLabel}
                  usePopover
                  seperatorType="vertical"
                />
                <FileUploadInput
                  mediaType={props.mediaType}
                  setLoading={setLoading}
                  useEditorBucket={true}
                  hideUploadTab={mediaUploads === "disabled"}
                  initialUrl={mediaAttributes.src ?? ""}
                  defaultTab="embed"
                  setNewUrl={(url) =>
                    updateMediaAttributes(props.nodeViewProps, {
                      src: url,
                      width: "100%",
                      height: "auto",
                    })
                  }
                  align="center"
                />
              </Popover>
            }
          >
            {props.children}
          </ReactBlockWrapper>
        ) : (
          <MediaPlaceholder
            nodeViewProps={props.nodeViewProps}
            mediaType={props.mediaType}
            networkError={!networkState.online}
            setLoading={setLoading}
          />
        )}
        {loading && (
          <LoadingSpinner className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
      </NodeViewWrapper>
    );
  },
);

MediaWrapper.displayName = "MediaWrapper";
export default MediaWrapper;
