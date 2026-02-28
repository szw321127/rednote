import { CheckCircle, LayoutList, PenTool } from "lucide-react";
import React from "react";

interface StepIndicatorProps {
  currentStep: number;
  hasOutlines: boolean;
  hasCompletedContents: boolean;
  onStepClick: (step: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  hasOutlines,
  hasCompletedContents,
  onStepClick,
}) => {
  const steps = [
    {
      id: 0,
      label: "选题",
      icon: PenTool,
      enabled: true,
    },
    {
      id: 1,
      label: "大纲",
      icon: LayoutList,
      enabled: hasOutlines,
    },
    {
      id: 2,
      label: "成品",
      icon: CheckCircle,
      enabled: hasCompletedContents,
    },
  ];

  return (
    <div className="flex items-center mb-10 select-none" aria-label="创作步骤">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.id;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              disabled={!step.enabled}
              className={`flex items-center transition-colors rounded-xl px-2.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-bg ${
                isActive
                  ? "text-xhs-red font-bold"
                  : step.enabled
                  ? "text-xhs-secondary hover:text-xhs-text"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center mr-2 text-sm border transition-colors ${
                  isActive
                    ? "bg-xhs-red text-white border-xhs-red shadow-soft"
                    : step.enabled
                    ? "bg-xhs-surface border-xhs-border text-xhs-secondary"
                    : "bg-gray-50 border-gray-200 text-gray-300"
                }`}
                aria-hidden="true"
              >
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="text-sm">{step.label}</span>
            </button>

            {idx < steps.length - 1 ? (
              <div
                className={`flex-1 h-px mx-4 ${
                  currentStep > step.id ? "bg-xhs-red" : "bg-gray-200"
                }`}
                aria-hidden="true"
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};
