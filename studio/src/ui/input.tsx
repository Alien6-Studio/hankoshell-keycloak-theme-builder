import * as React from "react";
import { cn } from "./utils";

function Input({ className, ...props }: Readonly<React.InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <input
      data-slot="input"
      className={cn(
        "hk-input disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
