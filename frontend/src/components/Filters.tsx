import React from "react";
import type { TimeRange } from "../types/speedTest";

interface FiltersProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}) => {
  const ranges: { value: TimeRange; label: string }[] = [
    { value: "day", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Time Range:</span>

        <div className="flex flex-wrap gap-2">
          {ranges.map((range) => (
            <button
              key={range.value}
              onClick={() => onRangeChange(range.value)}
              className={`filter-button ${
                selectedRange === range.value ? "active" : "inactive"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {selectedRange === "custom" && (
          <div className="flex items-center gap-2 ml-4">
            <input
              type="date"
              value={customStartDate || ""}
              onChange={(e) =>
                onCustomDateChange?.(e.target.value, customEndDate || "")
              }
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={customEndDate || ""}
              onChange={(e) =>
                onCustomDateChange?.(customStartDate || "", e.target.value)
              }
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};
