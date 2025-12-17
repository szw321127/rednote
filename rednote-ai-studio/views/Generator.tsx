import React from "react";
import { LoadingState } from "../components/LoadingState";
import { StepIndicator } from "../components/StepIndicator";
import { ContentStep } from "../components/steps/ContentStep";
import { OutlineStep } from "../components/steps/OutlineStep";
import { TopicStep } from "../components/steps/TopicStep";
import { useGenerator } from "../hooks/useGenerator";
import { AppSettings, GeneratedPost } from "../types";

interface GeneratorProps {
  settings: AppSettings;
  initialPost?: GeneratedPost | null;
  onPostRestored?: () => void;
}

const Generator: React.FC<GeneratorProps> = ({
  settings,
  initialPost,
  onPostRestored,
}) => {
  const {
    // 状态
    step,
    topic,
    isGenerating,
    outlines,
    completedContents,
    progressText,

    // 操作
    setStep,
    setTopic,
    handleGenerateOutlines,
    handleRegenerateOutlines,
    handleSelectOutline,
    handleEditOutline,
    reset,
    handleCopyCaption,
    handleDownloadImage,
  } = useGenerator(settings, initialPost, onPostRestored);

  const handleStepClick = (targetStep: number) => {
    if (isGenerating) return;

    if (targetStep === 0) {
      setStep(0);
    } else if (targetStep === 1 && outlines.length > 0) {
      setStep(1);
    } else if (targetStep === 2 && completedContents.length > 0) {
      setStep(2);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">以此为题创作</h1>
        <p className="text-gray-500 mt-2">一键生成爆款小红书图文。</p>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={step}
        hasOutlines={outlines.length > 0}
        hasCompletedContents={completedContents.length > 0}
        onStepClick={handleStepClick}
      />

      {/* Loading State */}
      {isGenerating && (
        <LoadingState progressText={progressText} backendUrl={settings.backendUrl} />
      )}

      {/* Step 0: Topic Input */}
      {!isGenerating && step === 0 && (
        <TopicStep
          topic={topic}
          isGenerating={isGenerating}
          hasOutlines={outlines.length > 0}
          onTopicChange={setTopic}
          onGenerate={handleGenerateOutlines}
          onRestoreOutlines={() => setStep(1)}
        />
      )}

      {/* Step 1: Outline Selection */}
      {!isGenerating && step === 1 && outlines.length > 0 && (
        <OutlineStep
          outlines={outlines}
          onSelectOutline={handleSelectOutline}
          onEditOutline={handleEditOutline}
          onRegenerateOutlines={handleRegenerateOutlines}
          onBackToTopic={() => setStep(0)}
        />
      )}

      {/* Step 2: Completed Contents */}
      {!isGenerating && step === 2 && completedContents.length > 0 && (
        <ContentStep
          completedContents={completedContents}
          onBackToOutlines={() => setStep(1)}
          onReset={reset}
          onCopyCaption={handleCopyCaption}
          onDownloadImage={handleDownloadImage}
        />
      )}
    </div>
  );
};

export default Generator;
