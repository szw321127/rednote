import React from "react";

import { cn } from "./cn";

type BadgeVariant = "success" | "info" | "neutral" | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-700 border border-green-200",
  info: "bg-blue-50 text-700 border border-blue-200",
  neutral: "bg-gray-100 text-600 border border-gray-200",
  danger: "bg-red-50 text-700 border border-red-200",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  className,
  children,
  ...props
}) => {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
