
import React from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search items...",
  value,
  onChange,
  className = "",
  onFocus,
  onBlur,
}) => {
  return (
    <div className={`relative flex-1 max-w-xs ${className}`}>
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground/70">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full bg-card border border-border rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-royal transition-all placeholder:text-muted-foreground/50"
      />
    </div>
  );
};
