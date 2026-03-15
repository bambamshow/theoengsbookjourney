import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

const sizes = {
  sm: 16,
  md: 24,
  lg: 32,
};

function StarIcon({ filled, half, px }: { filled: boolean; half: boolean; px: number }) {
  return (
    <span className="relative inline-block" style={{ width: px, height: px }}>
      <svg
        viewBox="0 0 24 24"
        width={px}
        height={px}
        className="absolute inset-0"
        style={{ fill: "#27272a", stroke: "#52525b", strokeWidth: 0.5 }}
      >
        <path d={starPath} />
      </svg>
      {(filled || half) && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: filled ? "100%" : "50%" }}
        >
          <svg
            viewBox="0 0 24 24"
            width={px}
            height={px}
            style={{ fill: "hsl(var(--primary))", stroke: "hsl(var(--primary))", strokeWidth: 0.5 }}
          >
            <path d={starPath} />
          </svg>
        </span>
      )}
    </span>
  );
}

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, position: number) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(isHalf ? position - 0.5 : position);
  };

  const handleMouseLeave = () => {
    if (!readOnly) setHoverValue(null);
  };

  const handleClick = (position: number) => {
    if (!readOnly && onChange) {
      onChange(position);
    }
  };

  const displayValue = hoverValue !== null ? hoverValue : value;
  const px = sizes[size];

  return (
    <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((pos) => {
        const filled = displayValue >= pos;
        const half = !filled && displayValue >= pos - 0.5;
        return (
          <button
            key={pos}
            type="button"
            disabled={readOnly}
            className={readOnly ? "cursor-default" : "cursor-pointer focus:outline-none"}
            onMouseMove={(e) => handleMouseMove(e, pos)}
            onClick={() => handleClick(hoverValue ?? pos)}
          >
            <StarIcon filled={filled} half={half} px={px} />
          </button>
        );
      })}
      {!readOnly && (
        <span className="text-sm text-zinc-400 ml-2 min-w-[2rem]">
          {displayValue > 0 ? displayValue : ""}
        </span>
      )}
    </div>
  );
}
