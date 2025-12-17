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
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        请输入笔记主题
      </label>
      <div className="relative">
        <input
          type="text"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="例如：油皮夏季护肤指南"
          className="w-full p-4 pr-12 text-lg border-2 border-gray-100 rounded-xl focus:border-xhs-red focus:ring-0 outline-none transition-all placeholder-gray-300"
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={onGenerate}
          disabled={!topic.trim() || isGenerating}
          className="absolute right-2 top-2 bottom-2 bg-xhs-red hover:bg-red-600 text-white rounded-lg px-6 font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        </button>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {SAMPLE_TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => onTopicChange(t)}
            className="whitespace-nowrap px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-gray-100 transition-colors"
          >
            {t}
          </button>
        ))}
      </div>

      {hasOutlines && (
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
          <button
            onClick={onRestoreOutlines}
            className="text-gray-500 hover:text-xhs-red text-sm flex items-center"
          >
            <span className="mr-2">恢复上次生成的大纲</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
