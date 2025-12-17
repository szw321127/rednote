import { Edit2 } from "lucide-react";
import React from "react";
import { Outline } from "../types";

interface OutlineCardProps {
  outline: Outline;
  onSelect: (outline: Outline) => void;
  onEdit: (outline: Outline) => void;
}

export const OutlineCard: React.FC<OutlineCardProps> = ({
  outline,
  onSelect,
  onEdit,
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发卡片的点击事件
    onEdit(outline);
  };

  return (
    <div
      onClick={() => onSelect(outline)}
      className="group cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-xhs-red hover:shadow-md transition-all relative overflow-hidden flex flex-col h-full"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-xhs-red opacity-0 group-hover:opacity-100 transition-opacity"></div>

      {/* 编辑按钮 */}
      <button
        onClick={handleEdit}
        className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 hover:border-xhs-red z-10"
        title="编辑大纲"
      >
        <Edit2 size={14} className="text-gray-600" />
      </button>

      <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300 origin-left">
        {outline.emoji}
      </div>
      <h3 className="font-bold text-lg mb-2 text-gray-800 leading-tight pr-8">
        {outline.title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-4 flex-grow">
        {outline.content}
      </p>
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
        {outline.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs bg-red-50 text-xhs-red px-2 py-1 rounded-md"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};
