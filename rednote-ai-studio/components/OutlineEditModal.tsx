import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Outline } from "../types";

interface OutlineEditModalProps {
  outline: Outline | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOutline: Outline) => void;
}

export const OutlineEditModal: React.FC<OutlineEditModalProps> = ({
  outline,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [emoji, setEmoji] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (outline) {
      setTitle(outline.title);
      setContent(outline.content);
      setEmoji(outline.emoji);
      setTags(outline.tags);
    }
  }, [outline]);

  if (!isOpen || !outline) return null;

  const handleSave = () => {
    const updatedOutline: Outline = {
      ...outline,
      title,
      content,
      emoji,
      tags,
    };
    onSave(updatedOutline);
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">编辑大纲</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Emoji */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              表情符号
            </label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="😊"
              className="w-24 p-3 text-2xl text-center border-2 border-gray-100 rounded-xl focus:border-xhs-red focus:ring-0 outline-none transition-all"
              maxLength={2}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入大纲标题"
              className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-xhs-red focus:ring-0 outline-none transition-all"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              内容描述
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入大纲内容描述"
              rows={6}
              className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-xhs-red focus:ring-0 outline-none transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              标签
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入标签并按回车"
                className="flex-1 p-3 border-2 border-gray-100 rounded-xl focus:border-xhs-red focus:ring-0 outline-none transition-all"
              />
              <button
                onClick={handleAddTag}
                className="px-6 py-3 bg-xhs-red text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-sm bg-red-50 text-xhs-red px-3 py-1.5 rounded-lg"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-red-100 rounded p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-xhs-red text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            保存并生成
          </button>
        </div>
      </div>
    </div>
  );
};
