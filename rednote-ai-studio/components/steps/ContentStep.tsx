import React from "react";
import { CompletedContent } from "../../types";
import { CompletedContentsGallery } from "../CompletedContentsGallery";

interface ContentStepProps {
  completedContents: CompletedContent[];
  onBackToOutlines: () => void;
  onReset: () => void;
  onCopyCaption: (caption: string) => void;
  onDownloadImage: (imageUrl: string) => void;
}

export const ContentStep: React.FC<ContentStepProps> = ({
  completedContents,
  onBackToOutlines,
  onReset,
  onCopyCaption,
  onDownloadImage,
}) => {
  return (
    <CompletedContentsGallery
      completedContents={completedContents}
      onBackToOutlines={onBackToOutlines}
      onReset={onReset}
      onCopyCaption={onCopyCaption}
      onDownloadImage={onDownloadImage}
    />
  );
};
