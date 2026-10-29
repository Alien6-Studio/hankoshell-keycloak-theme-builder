import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-20 w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--fg)] outline-none transition-colors",
        "placeholder:text-[var(--fg-muted)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring-glow)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:opacity-60",
        "aria-invalid:border-[var(--accent-red)] aria-invalid:ring-2 aria-invalid:ring-[color-mix(in_oklch,var(--accent-red)_20%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
