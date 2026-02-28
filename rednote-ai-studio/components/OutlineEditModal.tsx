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
    const next = tagInput.trim();
    if (next && !tags.includes(next)) {
      setTags([...tags, next]);
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

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2";

  const inputClass =
    `w-full p-3 border border-xhs-border rounded-xl bg-gray-50 transition-all ${focusRing}`;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="编辑大纲"
    >
      <div className="bg-xhs-surface rounded-2xl shadow-soft-md max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-xhs-border">
        <div className="flex items-center justify-between p-6 border-b border-xhs-border">
          <h2 className="text-2xl font-bold text-xhs-text">编辑大纲</h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 hover:bg-gray-50 rounded-xl transition-colors ${focusRing} focus-visible:ring-offset-xhs-surface`}
            aria-label="关闭"
          >
            <X size={20} className="text-xhs-secondary" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-xhs-text mb-2">
              表情符号
            </label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="😊"
              className={`w-24 p-3 text-2xl text-center border border-xhs-border rounded-xl bg-gray-50 ${focusRing} focus-visible:ring-offset-xhs-surface`}
              maxLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-xhs-text mb-2">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入大纲标题"
              className={`${inputClass} focus-visible:ring-offset-xhs-surface`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-xhs-text mb-2">
              内容描述
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入大纲内容描述"
              rows={6}
              className={`${inputClass} resize-none focus-visible:ring-offset-xhs-surface`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-xhs-text mb-2">
              标签
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入标签并按回车"
                className={`${inputClass} flex-1 focus-visible:ring-offset-xhs-surface`}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className={`px-6 py-3 bg-xhs-red text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-soft ${focusRing} focus-visible:ring-offset-xhs-surface`}
              >
                添加
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-sm bg-red-50 text-xhs-red px-3 py-1.5 rounded-xl"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className={`hover:bg-red-100 rounded p-0.5 ${focusRing} focus-visible:ring-offset-red-50`}
                    aria-label={`移除标签 ${tag}`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-xhs-border">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3 bg-gray-100 text-xhs-text rounded-xl hover:bg-gray-200 transition-colors font-medium ${focusRing} focus-visible:ring-offset-xhs-surface`}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`flex-1 py-3 bg-xhs-red text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-soft ${focusRing} focus-visible:ring-offset-xhs-surface`}
          >
            保存并生成
          </button>
        </div>
      </div>
    </div>
  );
};
