import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { CompletedContent } from "../types";
import { FinalPostPreview } from "./FinalPostPreview";

interface CompletedContentsGalleryProps {
  completedContents: CompletedContent[];
  onBackToOutlines: () => void;
  onReset: () => void;
  onCopyCaption: (caption: string) => void;
  onDownloadImage: (imageUrl: string) => void;
}

export const CompletedContentsGallery: React.FC<
  CompletedContentsGalleryProps
> = ({
  completedContents,
  onBackToOutlines,
  onReset,
  onCopyCaption,
  onDownloadImage,
}) => {
  const [currentIndex, setCurrentIndex] = useState(completedContents.length - 1);
  const currentContent = completedContents[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev < completedContents.length - 1 ? prev + 1 : prev,
    );
  };

  const currentPost = {
    id: currentContent.id,
    topic: "",
    status: "completed" as const,
    outlines: [],
    selectedOutline: currentContent.outline,
    imageUrl: currentContent.imageUrl,
    fullCaption: currentContent.caption,
    createdAt: currentContent.createdAt,
    updatedAt: currentContent.createdAt,
  };

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg";

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <CheckCircle size={18} aria-hidden="true" />
            <span className="font-medium text-sm">
              已生成 {completedContents.length} 个成品
            </span>
          </div>

          {completedContents.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`p-2 rounded-xl bg-xhs-surface border border-xhs-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-soft ${focusRing}`}
                aria-label="上一个"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <span className="text-sm text-xhs-secondary font-medium min-w-[60px] text-center">
                {currentIndex + 1} / {completedContents.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === completedContents.length - 1}
                className={`p-2 rounded-xl bg-xhs-surface border border-xhs-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-soft ${focusRing}`}
                aria-label="下一个"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBackToOutlines}
            className={`text-xhs-secondary bg-xhs-surface border border-xhs-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 hover:text-xhs-text flex items-center shadow-soft transition-colors ${focusRing}`}
          >
            <ArrowLeft size={16} className="mr-2" aria-hidden="true" /> 继续生成
          </button>
          <button
            type="button"
            onClick={onReset}
            className={`bg-xhs-text text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 shadow-soft transition-colors ${focusRing}`}
          >
            开始新创作
          </button>
        </div>
      </div>

      <FinalPostPreview
        finalPost={currentPost}
        onBackToOutlines={onBackToOutlines}
        onReset={onReset}
        onCopyCaption={() => onCopyCaption(currentContent.caption)}
        onDownloadImage={() => onDownloadImage(currentContent.imageUrl)}
        hideHeader={true}
      />

      {completedContents.length > 1 && (
        <div className="mt-6 overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {completedContents.map((content, index) => (
              <button
                key={content.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-32 h-40 rounded-2xl overflow-hidden border-2 transition-all ${focusRing} ${
                  index === currentIndex
                    ? "border-xhs-red shadow-soft-md scale-105"
                    : "border-xhs-border opacity-70 hover:opacity-100 hover:border-gray-300"
                }`}
                aria-label={`预览第 ${index + 1} 个成品`}
              >
                <img
                  src={content.imageUrl}
                  alt={content.outline.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
