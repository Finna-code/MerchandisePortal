"use client";

import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { cn } from "@/lib/utils";

type Props = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  name?: string;
  title?: string;
};

export function Select({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  className,
  children,
  disabled,
  name,
  title,
}: Props) {
  return (
    <RadixSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} name={name} disabled={disabled}>
      <RadixSelect.Trigger
        className={cn(
          "inline-flex items-center justify-between gap-2",
          "bg-background text-foreground border border-input",
          "rounded-md px-3 py-2 text-sm",
          "shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        aria-label={placeholder}
        title={title}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          className={cn(
            "z-[60] min-w-[10rem] overflow-hidden",
            "rounded-md border border-input bg-popover text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
          )}
        >
          <RadixSelect.Viewport className="p-1">
            {children}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <RadixSelect.Item
      value={value}
      className={cn(
        "relative flex w-full cursor-default select-none items-center",
        "rounded-sm px-2 py-1.5 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      )}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute right-2 inline-flex items-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}
