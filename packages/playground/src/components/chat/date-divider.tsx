import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface DateDividerProps {
  date: string | Date;
  className?: string;
}

export function DateDivider({ date, className }: DateDividerProps) {
  // Use a fixed format with date-fns instead of toLocaleDateString to prevent hydration issues
  const formattedDate = typeof date === 'string'
    ? date
    : format(date, 'EEE, dd MMM yyyy');

  return (
    <div className="flex justify-center items-center h-[28px] px-[32px] py-[12px] gap-[10px] flex-shrink-0">
      <div 
        className={cn(
          "relative px-4 py-1 rounded-lg text-sm text-[rgba(255,255,255,0.8)] font-[var(--font-space-grotesk)]",
          className
        )}
        style={{
          background: "#17181A",
        }}
      >
        {/* Custom border with gradient */}
        <div
          className="absolute inset-0 rounded-lg -z-10"
          style={{
            border: "1px solid",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 100%)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box,border-box",
          }}
        />
        {formattedDate}
      </div>
    </div>
  );
} 