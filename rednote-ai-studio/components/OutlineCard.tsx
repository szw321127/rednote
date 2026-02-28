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
    e.stopPropagation();
    onEdit(outline);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(outline);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(outline)}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer bg-xhs-surface p-6 rounded-2xl shadow-soft border border-xhs-border hover:border-xhs-red/40 hover:shadow-soft-md transition-all relative overflow-hidden flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg"
      aria-label={`选择大纲：${outline.title}`}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-xhs-red opacity-0 group-hover:opacity-100 transition-opacity" />

      <button
        type="button"
        onClick={handleEdit}
        className="absolute top-4 right-4 p-2 bg-xhs-surface rounded-xl shadow-soft border border-xhs-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 hover:border-xhs-red/40 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg"
        title="编辑大纲"
        aria-label="编辑大纲"
      >
        <Edit2 size={14} className="text-xhs-secondary" aria-hidden="true" />
      </button>

      <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300 origin-left">
        {outline.emoji}
      </div>
      <h3 className="font-bold text-lg mb-2 text-xhs-text leading-tight pr-8">
        {outline.title}
      </h3>
      <p className="text-sm text-xhs-secondary mb-4 line-clamp-4 flex-grow">
        {outline.content}
      </p>
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
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
