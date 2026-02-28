import React, { useId } from "react";

import { cn } from "./cn";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  errorText?: string;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2";

export const Input: React.FC<InputProps> = ({
  id,
  label,
  helperText,
  errorText,
  className,
  ...props
}) => {
  const fallbackId = useId();
  const inputId = id || (label ? `input-${fallbackId}` : undefined);
  const describedById = helperText || errorText ? `${inputId}-desc` : undefined;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs text-xhs-secondary ml-1"
        >
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={describedById}
        className={cn(
          "w-full p-3 rounded-xl border border-xhs-border bg-white",
          focusRing,
          className,
        )}
      />
      {(helperText || errorText) && (
        <p
          id={describedById}
          className={cn(
            "text-[11px] ml-1",
            errorText ? "text-red-600" : "text-gray-400",
          )}
        >
          {errorText || helperText}
        </p>
      )}
    </div>
  );
};
