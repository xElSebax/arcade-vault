import type { ButtonHTMLAttributes, ReactNode } from "react";

type BtnVariant = "default" | "magenta" | "yellow" | "ghost";
type BtnSize = "default" | "lg" | "xl";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  pulse?: boolean;
  children: ReactNode;
}

export function Btn({
  variant = "default",
  size = "default",
  pulse = false,
  className = "",
  type = "button",
  children,
  ...props
}: BtnProps) {
  const classes = [
    "btn",
    variant !== "default" ? variant : "",
    size === "lg" ? "lg" : "",
    size === "xl" ? "xl" : "",
    pulse ? "pulse" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
