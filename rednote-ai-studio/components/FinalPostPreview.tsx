import { ArrowLeft, CheckCircle, Image as ImageIcon } from "lucide-react";
import React from "react";
import { GeneratedPost } from "../types";

interface FinalPostPreviewProps {
  finalPost: GeneratedPost;
  onBackToOutlines: () => void;
  onReset: () => void;
  onCopyCaption: () => void;
  onDownloadImage: () => void;
  hideHeader?: boolean; // 新增：是否隐藏头部
}

export const FinalPostPreview: React.FC<FinalPostPreviewProps> = ({
  finalPost,
  onBackToOutlines,
  onReset,
  onCopyCaption,
  onDownloadImage,
  hideHeader = false,
}) => {
  return (
    <div className="animate-fade-in">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <CheckCircle size={18} />
            <span className="font-medium text-sm">生成完成</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBackToOutlines}
              className="text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center shadow-sm"
            >
              <ArrowLeft size={16} className="mr-2" /> 重选大纲
            </button>
            <button
              onClick={onReset}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 shadow-lg shadow-gray-200"
            >
              开始新创作
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        {/* Mobile Preview Look */}
        <div className="border border-gray-200 rounded-[2rem] overflow-hidden bg-gray-50 max-w-xs mx-auto md:mx-0 shadow-lg relative aspect-[9/16]">
          {/* Header */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between text-white drop-shadow-md">
            <span className="text-xs font-medium">小红书</span>
          </div>

          {/* Image */}
          <div className="h-2/3 w-full bg-gray-200 relative group">
            {finalPost.imageUrl ? (
              <img
                src={finalPost.imageUrl}
                alt="Generated"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon size={48} />
              </div>
            )}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
              AI 生成
            </div>
          </div>

          {/* Content Preview */}
          <div className="p-4 bg-white h-1/3 overflow-y-auto absolute bottom-0 w-full rounded-t-2xl">
            <h3 className="font-bold text-gray-900 mb-2 leading-snug">
              {finalPost.selectedOutline?.title || ""}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                AI
              </div>
              <span className="text-xs text-gray-500">RedNote 助手</span>
              <span className="text-xs text-gray-300 ml-auto">刚刚</span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-line text-ellipsis leading-relaxed">
              {finalPost.fullCaption}
            </p>
          </div>
        </div>

        {/* Editor / Actions */}
        <div className="flex flex-col h-full">
          <div className="flex-1 mb-6">
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              生成的文案
            </label>
            <textarea
              readOnly
              value={finalPost.fullCaption}
              className="w-full h-full min-h-[300px] p-4 text-sm bg-gray-50 rounded-xl border-none resize-none focus:ring-0 text-gray-600 font-mono leading-relaxed"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCopyCaption}
              className="flex-1 py-3 bg-red-50 text-xhs-red font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
            >
              复制文案
            </button>
            <button
              onClick={onDownloadImage}
              className="flex-1 py-3 bg-red-50 text-xhs-red font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
            >
              下载图片
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
