import { ArrowRight, Loader2 } from "lucide-react";
import React from "react";

interface TopicInputProps {
  topic: string;
  isGenerating: boolean;
  hasOutlines: boolean;
  onTopicChange: (topic: string) => void;
  onGenerate: () => void;
  onRestoreOutlines: () => void;
}

const SAMPLE_TOPICS = ["春日穿搭", "上海探店", "减脂餐", "猫咪搞笑瞬间"];

export const TopicInput: React.FC<TopicInputProps> = ({
  topic,
  isGenerating,
  hasOutlines,
  onTopicChange,
  onGenerate,
  onRestoreOutlines,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onGenerate();
    }
  };

  return (
    <div className="bg-xhs-surface p-8 rounded-2xl shadow-soft border border-xhs-border animate-fade-in">
      <label className="block text-sm font-semibold text-xhs-text mb-2">
        请输入笔记主题
      </label>
      <div className="relative">
        <input
          type="text"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="例如：油皮夏季护肤指南"
          className="w-full p-4 pr-12 text-lg bg-white border border-xhs-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg transition-all placeholder-gray-300"
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={onGenerate}
          disabled={!topic.trim() || isGenerating}
          className="absolute right-2 top-2 bottom-2 bg-xhs-red hover:bg-red-600 text-white rounded-xl px-6 font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {SAMPLE_TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTopicChange(t)}
            className="whitespace-nowrap px-4 py-2 bg-gray-50 text-xhs-secondary rounded-full text-sm hover:bg-gray-100 hover:text-xhs-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg"
          >
            {t}
          </button>
        ))}
      </div>

      {hasOutlines && (
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
          <button
            type="button"
            onClick={onRestoreOutlines}
            className="text-xhs-secondary hover:text-xhs-red text-sm flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg rounded-lg px-2 py-1"
          >
            <span className="mr-2">恢复上次生成的大纲</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};
