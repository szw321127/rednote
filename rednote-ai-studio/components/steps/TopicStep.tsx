import React from "react";
import { TopicInput } from "../TopicInput";

interface TopicStepProps {
  topic: string;
  isGenerating: boolean;
  hasOutlines: boolean;
  onTopicChange: (topic: string) => void;
  onGenerate: () => void;
  onRestoreOutlines: () => void;
}

export const TopicStep: React.FC<TopicStepProps> = ({
  topic,
  isGenerating,
  hasOutlines,
  onTopicChange,
  onGenerate,
  onRestoreOutlines,
}) => {
  return (
    <TopicInput
      topic={topic}
      isGenerating={isGenerating}
      hasOutlines={hasOutlines}
      onTopicChange={onTopicChange}
      onGenerate={onGenerate}
      onRestoreOutlines={onRestoreOutlines}
    />
  );
};
