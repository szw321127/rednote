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
  const [currentIndex, setCurrentIndex] = useState(
    completedContents.length - 1
  ); // 默认显示最新的成品

  const currentContent = completedContents[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev < completedContents.length - 1 ? prev + 1 : prev
    );
  };

  // 转换为 GeneratedPost 格式以兼容 FinalPostPreview
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

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <CheckCircle size={18} />
            <span className="font-medium text-sm">
              已生成 {completedContents.length} 个成品
            </span>
          </div>

          {completedContents.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600 font-medium min-w-[60px] text-center">
                {currentIndex + 1} / {completedContents.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex === completedContents.length - 1}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBackToOutlines}
            className="text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center shadow-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> 继续生成
          </button>
          <button
            onClick={onReset}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 shadow-lg shadow-gray-200"
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

      {/* 缩略图导航 */}
      {completedContents.length > 1 && (
        <div className="mt-6 overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {completedContents.map((content, index) => (
              <button
                key={content.id}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-32 h-40 rounded-xl overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-xhs-red shadow-lg scale-105"
                    : "border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-300"
                }`}
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
