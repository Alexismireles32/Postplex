'use client';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ value, className = '', showPercentage = true }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm font-medium text-gray-700 mt-1">
          {clampedValue.toFixed(0)}%
        </div>
      )}
    </div>
  );
}
