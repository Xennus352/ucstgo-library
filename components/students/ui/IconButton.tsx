
import React from "react";
import { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  size?: number;
  label?: string;
  ariaLabel?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  className = "",
  size = 5,
  label,
  ariaLabel,
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 text-muted-foreground hover:text-navy rounded-full hover:bg-muted/40 transition-colors shrink-0 ${className}`}
      aria-label={ariaLabel || label}
      title={label}
    >
      <Icon className={`h-${size} w-${size}`} />
    </button>
  );
};
