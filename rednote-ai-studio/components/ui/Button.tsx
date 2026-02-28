import React from "react";

import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-xhs-red text-white shadow-soft enabled:hover:bg-red-600 enabled:active:bg-red-700",
  secondary:
    "bg-xhs-surface text-xhs-text border border-xhs-border enabled:hover:bg-gray-50",
  ghost: "bg-transparent text-xhs-text enabled:hover:bg-gray-50",
  danger:
    "bg-red-600 text-white shadow-soft enabled:hover:bg-red-700 enabled:active:bg-red-800",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors",
        focusRing,
        sizeClasses[size],
        variantClasses[variant],
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
    >
      {loading && (
        <span
          className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
};
