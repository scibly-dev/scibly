"use client";

import type { PopoverContentProps } from "@radix-ui/react-popover";
import type { FileSelectionEvent } from "@/shared/content/editor/media/utils/media";

import { PopoverContent } from "@scibly/ui/components/popover";
import { useRef, useState } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { type MediaTypes } from "@/lib/media-types";
import {
  EmbedPanel,
  type FileUploadTab,
  RemoveAction,
  UploadPanel,
  UploadTabs,
} from "@/shared/content/editor/media/components/file-upload-input-panels";
import {
  getMediaLabels,
  handleFileUpload,
  validateUrl,
} from "@/shared/content/editor/media/utils/media";

type FileUploadInputProps = {
  mediaType: MediaTypes;
  setLoading: (loading: boolean) => void;
  setNewUrl: (url: string) => void;
  useEditorBucket: boolean;
  align?: PopoverContentProps["align"];
  onUploadSuccess?: () => void;

  hideUploadTab?: boolean;

  initialUrl?: string;

  defaultTab?: FileUploadTab;

  onRemove?: () => void;
  removeLabel?: string;
};

function useFileActions(
  props: Pick<
    FileUploadInputProps,
    | "mediaType"
    | "useEditorBucket"
    | "setLoading"
    | "setNewUrl"
    | "onUploadSuccess"
  >,
  url: string,
  setUrl: (url: string) => void,
) {
  async function handleUpload(e: FileSelectionEvent) {
    props.setLoading(true);
    const uploadedUrl = await handleFileUpload(
      e,
      props.mediaType,
      props.useEditorBucket,
    );
    if (uploadedUrl) {
      props.setNewUrl(uploadedUrl);
      setUrl("");
      props.onUploadSuccess?.();
    } else {
      props.setLoading(false);
    }
  }
  function handleEmbed() {
    if (!validateUrl(url, props.mediaType)) return;
    props.setLoading(true);
    props.setNewUrl(url);
    props.onUploadSuccess?.();
  }
  return { handleUpload, handleEmbed };
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  mediaType,
  setLoading,
  setNewUrl,
  useEditorBucket,
  align = "center",
  onUploadSuccess,
  hideUploadTab = false,
  initialUrl = "",
  defaultTab,
  onRemove,
  removeLabel,
}) => {
  const { translations } = useTranslation("editorUi");
  const [tab, setTab] = useState<FileUploadTab>(
    defaultTab || (hideUploadTab ? "embed" : "upload"),
  );
  const [url, setUrl] = useState(initialUrl);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleUpload, handleEmbed } = useFileActions(
    { mediaType, useEditorBucket, setLoading, setNewUrl, onUploadSuccess },
    url,
    setUrl,
  );

  const { upload: uploadLabel, embed: embedLabel } = getMediaLabels(
    mediaType,
    translations.media,
  );

  return (
    <PopoverContent align={align} sideOffset={8} className="z-[10000] w-80 p-0">
      {!hideUploadTab ? (
        <UploadTabs
          tab={tab}
          setTab={setTab}
          uploadLabel={uploadLabel}
          embedLabel={embedLabel}
        />
      ) : null}
      <div className="p-4">
        {tab === "upload" && !hideUploadTab ? (
          <UploadPanel
            fileInputRef={fileInputRef}
            handleUpload={handleUpload}
            isDragging={isDragging}
            mediaType={mediaType}
            setIsDragging={setIsDragging}
            uploadLabel={uploadLabel}
          />
        ) : null}
        {tab === "embed" ? (
          <EmbedPanel
            changeMediaLabel={translations.media.changeMedia}
            embedLabel={embedLabel}
            handleEmbed={handleEmbed}
            hideUploadTab={hideUploadTab}
            placeholder={translations.media.mediaLinkPlaceholder}
            setUrl={setUrl}
            url={url}
          />
        ) : null}
      </div>
      {onRemove && removeLabel ? (
        <RemoveAction label={removeLabel} onRemove={onRemove} />
      ) : null}
    </PopoverContent>
  );
};

FileUploadInput.displayName = "FileUploadInput";
export default FileUploadInput;
