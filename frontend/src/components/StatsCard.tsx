import React from "react";

interface StatsCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  unit,
  icon,
  change,
  changeType = "neutral",
}) => {
  const formatValue = (val: number) => {
    if (unit === "ms") return val.toFixed(1);
    return val.toFixed(2);
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className="text-primary-600 mr-3">{icon}</div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              <div className="flex items-baseline">
                <p className="stat-value">
                  {formatValue(value)}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {unit}
                  </span>
                </p>
              </div>
            </div>
          </div>
          {change !== undefined && (
            <div className={`text-xs ${getChangeColor()} mt-1`}>
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}% from last period
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
