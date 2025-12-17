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
  return (
    <div className="flex items-center mb-10 select-none">
      {/* 选题步骤 */}
      <div
        onClick={() => onStepClick(0)}
        className={`flex items-center cursor-pointer transition-colors ${
          currentStep === 0
            ? "text-xhs-red font-bold"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm border ${
            currentStep === 0
              ? "bg-xhs-red text-white border-xhs-red"
              : "bg-white border-gray-300"
          }`}
        >
          <PenTool size={14} />
        </div>
        选题
      </div>

      {/* 连接线 1 */}
      <div
        className={`flex-1 h-px mx-4 ${
          currentStep > 0 ? "bg-xhs-red" : "bg-gray-200"
        }`}
      ></div>

      {/* 大纲步骤 */}
      <div
        onClick={() => onStepClick(1)}
        className={`flex items-center transition-colors ${
          currentStep === 1
            ? "text-xhs-red font-bold"
            : hasOutlines
            ? "text-gray-500 cursor-pointer hover:text-gray-800"
            : "text-gray-300 cursor-not-allowed"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm border ${
            currentStep === 1
              ? "bg-xhs-red text-white border-xhs-red"
              : hasOutlines
              ? "bg-white border-gray-300 text-gray-500"
              : "bg-gray-50 border-gray-200 text-gray-300"
          }`}
        >
          <LayoutList size={14} />
        </div>
        大纲
      </div>

      {/* 连接线 2 */}
      <div
        className={`flex-1 h-px mx-4 ${
          currentStep > 1 ? "bg-xhs-red" : "bg-gray-200"
        }`}
      ></div>

      {/* 成品步骤 */}
      <div
        onClick={() => onStepClick(2)}
        className={`flex items-center transition-colors ${
          currentStep === 2
            ? "text-xhs-red font-bold"
            : hasCompletedContents
            ? "text-gray-500 cursor-pointer hover:text-gray-800"
            : "text-gray-300 cursor-not-allowed"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm border ${
            currentStep === 2
              ? "bg-xhs-red text-white border-xhs-red"
              : hasCompletedContents
              ? "bg-white border-gray-300 text-gray-500"
              : "bg-gray-50 border-gray-200 text-gray-300"
          }`}
        >
          <CheckCircle size={14} />
        </div>
        成品
      </div>
    </div>
  );
};
