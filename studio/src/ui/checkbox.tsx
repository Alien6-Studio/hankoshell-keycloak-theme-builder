"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "./utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer flex size-4 min-h-4 shrink-0 items-center justify-center rounded-[4px] border border-[var(--border)] bg-transparent text-white outline-none transition-colors",
        "focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-glow)]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        "aria-invalid:border-[var(--accent-red)] aria-invalid:ring-2 aria-invalid:ring-[color-mix(in_oklch,var(--accent-red)_20%,transparent)]",
        "data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]",
        "data-[state=indeterminate]:border-[var(--primary)] data-[state=indeterminate]:bg-[var(--primary)]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        <CheckIcon className="size-3.5" aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
