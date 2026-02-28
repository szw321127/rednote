import React from "react";

import { cn } from "./cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      {...props}
      className={cn(
        "bg-xhs-surface rounded-2xl shadow-soft border border-xhs-border p-6 md:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
};
