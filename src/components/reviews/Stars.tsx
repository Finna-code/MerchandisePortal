"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarsProps = {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Stars({ value, onChange, disabled = false, size = "md", className }: StarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = typeof onChange === "function" && !disabled;
  const displayValue = hovered ?? value;

  const sizeClass = useMemo(() => {
    switch (size) {
      case "sm":
        return "size-4";
      case "lg":
        return "size-6";
      default:
        return "size-5";
    }
  }, [size]);

  const handleSelect = (rating: number) => {
    if (!interactive) return;
    onChange?.(rating);
  };

  const handleMouseEnter = (rating: number) => {
    if (!interactive) return;
    setHovered(rating);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHovered(null);
  };

  return (
    <div className={cn("flex items-center gap-1", interactive && "cursor-pointer", className)}>
      {Array.from({ length: 5 }, (_, index) => {
        const starNumber = index + 1;
        const fillRatio = Math.max(0, Math.min(1, displayValue - index));
        return (
          <span
            key={starNumber}
            className={cn("relative inline-flex", interactive && "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring")}
            onMouseEnter={() => handleMouseEnter(starNumber)}
            onMouseLeave={handleMouseLeave}
          >
            <Star className={cn(sizeClass, "text-muted-foreground/40")}
              strokeWidth={1.5}
            />
            <Star
              className={cn(sizeClass, "absolute inset-0 text-yellow-500")}
              fill="currentColor"
              strokeWidth={1.5}
              style={{ clipPath: `inset(0 ${100 - fillRatio * 100}% 0 0)` }}
            />
            {interactive && (
              <button
                type="button"
                aria-label={`${starNumber} star${starNumber === 1 ? "" : "s"}`}
                className="absolute inset-0"
                onClick={() => handleSelect(starNumber)}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

