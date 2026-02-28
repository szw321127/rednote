import { ArrowLeft, CheckCircle, Image as ImageIcon } from "lucide-react";
import React from "react";
import { GeneratedPost } from "../types";

interface FinalPostPreviewProps {
  finalPost: GeneratedPost;
  onBackToOutlines: () => void;
  onReset: () => void;
  onCopyCaption: () => void;
  onDownloadImage: () => void;
  hideHeader?: boolean;
}

export const FinalPostPreview: React.FC<FinalPostPreviewProps> = ({
  finalPost,
  onBackToOutlines,
  onReset,
  onCopyCaption,
  onDownloadImage,
  hideHeader = false,
}) => {
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg";

  return (
    <div className="animate-fade-in">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <CheckCircle size={18} aria-hidden="true" />
            <span className="font-medium text-sm">生成完成</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBackToOutlines}
              className={`text-xhs-secondary bg-xhs-surface border border-xhs-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 hover:text-xhs-text flex items-center shadow-soft transition-colors ${focusRing}`}
            >
              <ArrowLeft size={16} className="mr-2" aria-hidden="true" /> 重选大纲
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
      )}

      <div className="grid md:grid-cols-2 gap-8 bg-xhs-surface p-6 rounded-3xl shadow-soft border border-xhs-border">
        <div className="border border-xhs-border rounded-[2rem] overflow-hidden bg-gray-50 max-w-xs mx-auto md:mx-0 shadow-soft-md relative aspect-[9/16]">
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between text-white drop-shadow-md">
            <span className="text-xs font-medium">小红书</span>
          </div>

          <div className="h-2/3 w-full bg-gray-200 relative group">
            {finalPost.imageUrl ? (
              <img
                src={finalPost.imageUrl}
                alt="Generated"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon size={48} aria-hidden="true" />
              </div>
            )}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
              AI 生成
            </div>
          </div>

          <div className="p-4 bg-xhs-surface h-1/3 overflow-y-auto absolute bottom-0 w-full rounded-t-2xl border-t border-gray-100">
            <h3 className="font-bold text-xhs-text mb-2 leading-snug">
              {finalPost.selectedOutline?.title || ""}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                AI
              </div>
              <span className="text-xs text-xhs-secondary">RedNote 助手</span>
              <span className="text-xs text-gray-300 ml-auto">刚刚</span>
            </div>
            <p className="text-sm text-xhs-text whitespace-pre-line text-ellipsis leading-relaxed">
              {finalPost.fullCaption}
            </p>
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex-1 mb-6">
            <label className="text-sm font-bold text-xhs-text mb-2 block">
              生成的文案
            </label>
            <textarea
              readOnly
              value={finalPost.fullCaption}
              className="w-full h-full min-h-[300px] p-4 text-sm bg-gray-50 rounded-2xl border border-xhs-border resize-none text-xhs-text font-mono leading-relaxed"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCopyCaption}
              className={`flex-1 py-3 bg-red-50 text-xhs-red font-semibold rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center ${focusRing}`}
            >
              复制文案
            </button>
            <button
              type="button"
              onClick={onDownloadImage}
              className={`flex-1 py-3 bg-red-50 text-xhs-red font-semibold rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center ${focusRing}`}
            >
              下载图片
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
