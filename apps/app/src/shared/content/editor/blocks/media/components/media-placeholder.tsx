"use client";

import type { NodeViewProps } from "@tiptap/core";

import Icon from "@scibly/ui/components/icon";
import { Popover, PopoverTrigger } from "@scibly/ui/components/popover";
import { WifiOff } from "lucide-react";
import { memo, useEffect, useState } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { type MediaTypes } from "@/lib/media-types";
import {
  getMediaAttributes,
  updateMediaAttributes,
} from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import FileUploadInput from "@/shared/content/editor/media/components/file-upload-input-popover";
import {
  getMediaLabels,
  handleMediaPlaceholderFileDrop,
} from "@/shared/content/editor/media/utils/media";
import { useEditorCapabilities } from "@/shared/content/editor/runtime/context/editor-capabilities-context";
import shouldRenderBlock from "@/shared/content/editor/runtime/should-render-block";

type MediaPlaceholderProps = {
  nodeViewProps: NodeViewProps;
  mediaType: MediaTypes;
  className?: string;
  networkError?: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

type DefaultDataType = null;
const defaultData: DefaultDataType = null;

const MediaPlaceholderComponent: React.FC<MediaPlaceholderProps> = memo(
  ({
    mediaType,
    networkError,
    nodeViewProps,
    setLoading,
  }: MediaPlaceholderProps) => {
    const { translations } = useTranslation("editorUi");
    const { mediaUploads } = useEditorCapabilities();
    const uploadsDisabled = mediaUploads === "disabled";
    const [isOpen, setIsOpen] = useState(false);
    const { upload: uploadLabel, embed: embedLabel } = getMediaLabels(
      mediaType,
      translations.media,
    );

    useEffect(() => {
      setTimeout(() => setIsOpen(true));
    }, []);

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger className="w-full">
          <div
            className="flex h-16 w-full items-center justify-start gap-4 overflow-hidden rounded-xl border border-neutral-200/60 bg-neutral-50 px-5 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800/60 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50"
            onDrop={async (e) => {
              if (networkError || uploadsDisabled) return;

              void handleMediaPlaceholderFileDrop(e, mediaType, nodeViewProps);
            }}
          >
            {networkError ? (
              <WifiOff className="h-8 w-8 stroke-1 text-gray-500" />
            ) : (
              <Icon
                name={
                  mediaType === "image"
                    ? "Image"
                    : mediaType === "audio"
                      ? "AudioLines"
                      : "Video"
                }
                className="h-6 w-6 stroke-1 text-gray-500"
              />
            )}
            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {networkError
                ? translations.media.noInternetConnection
                : uploadsDisabled
                  ? embedLabel
                  : uploadLabel}
            </div>
          </div>
        </PopoverTrigger>
        {!networkError && (
          <FileUploadInput
            mediaType={mediaType}
            setLoading={setLoading}
            useEditorBucket={true}
            hideUploadTab={uploadsDisabled}
            setNewUrl={(url) =>
              updateMediaAttributes(nodeViewProps, {
                src: url,
                width: "100%",
                height: "auto",
              })
            }
          />
        )}
      </Popover>
    );
  },
);

MediaPlaceholderComponent.displayName = "MediaPlaceholderComponent";

export const MediaPlaceholder: React.FC<MediaPlaceholderProps> = memo(
  (props) => {
    const mediaAttributes = getMediaAttributes(props.nodeViewProps.node);
    return shouldRenderBlock<
      DefaultDataType,
      string | null,
      MediaPlaceholderProps
    >(defaultData, mediaAttributes.src, props, MediaPlaceholderComponent);
  },
);

MediaPlaceholder.displayName = "MediaPlaceholder";

export default MediaPlaceholder;
