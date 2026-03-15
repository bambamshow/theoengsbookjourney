import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const handleMouseEnter = (index: number) => {
    if (!readOnly) setHoverValue(index);
  };

  const handleMouseLeave = () => {
    if (!readOnly) setHoverValue(null);
  };

  const handleClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index);
    }
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          key={index}
          type="button"
          disabled={readOnly}
          className={`${readOnly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110 active:scale-90"} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm`}
          onMouseEnter={() => handleMouseEnter(index)}
          onClick={() => handleClick(index)}
        >
          <Star
            className={`
              ${sizes[size]} 
              transition-colors duration-200
              ${index <= displayValue 
                ? "fill-primary text-primary" 
                : "fill-zinc-800 text-zinc-700"}
            `}
          />
        </button>
      ))}
    </div>
  );
}
