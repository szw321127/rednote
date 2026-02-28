import React from "react";

interface LoadingStateProps {
  progressText: string;
  backendUrl: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  progressText,
  backendUrl,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 border-4 border-red-100 border-t-xhs-red rounded-full animate-spin mb-6" />
      <h3 className="text-xl font-semibold text-xhs-text">{progressText}</h3>
      <p className="text-xhs-secondary mt-2 text-sm">
        正在请求后端 <b className="text-xhs-text">{backendUrl}</b>
      </p>
    </div>
  );
};
