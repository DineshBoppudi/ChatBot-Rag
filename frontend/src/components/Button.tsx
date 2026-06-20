import React from "react";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
};

const VARIANTS: Record<string, string> = {
  primary: "btn",
  secondary: "btn-secondary",
};

export default function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition ${VARIANTS[variant]} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}
