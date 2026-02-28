import React from "react";

import { cn } from "./cn";

type IconButtonVariant = "ghost" | "danger";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  ariaLabel: string;
  variant?: IconButtonVariant;
  children: React.ReactNode;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2";

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: "text-gray-400 enabled:hover:text-xhs-text enabled:hover:bg-gray-50",
  danger: "text-gray-400 enabled:hover:text-xhs-red enabled:hover:bg-red-50",
};

export const IconButton: React.FC<IconButtonProps> = ({
  ariaLabel,
  variant = "ghost",
  className,
  children,
  ...props
}) => {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center rounded-xl p-2 transition-colors",
        focusRing,
        variantClasses[variant],
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
};
