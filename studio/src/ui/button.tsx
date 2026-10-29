import * as React from "react";
import { cn } from "./utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

const variantClass: Readonly<Record<ButtonVariant, string>> = {
  default: "hk-btn--primary",
  secondary: "hk-btn--secondary",
  outline: "hk-btn--outline",
  ghost: "hk-btn--ghost",
  destructive: "hk-btn--danger",
};

const sizeClass: Readonly<Partial<Record<ButtonSize, string>>> = {
  sm: "hk-btn--sm",
  lg: "hk-btn--lg",
  icon: "hk-btn--icon",
};

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: Readonly<ButtonProps>) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn("hk-btn", variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  );
}

export { Button, type ButtonProps, type ButtonSize, type ButtonVariant };
