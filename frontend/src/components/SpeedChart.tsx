import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "../types/speedTest";
import { format } from "date-fns";

interface SpeedChartProps {
  data: ChartDataPoint[];
  height?: number;
}

export const SpeedChart: React.FC<SpeedChartProps> = ({
  data,
  height = 400,
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {format(new Date(data.timestamp), "MMM dd, yyyy HH:mm")}
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              Download:{" "}
              <span className="font-medium">
                {data.download.toFixed(2)} Mbps
              </span>
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              Upload:{" "}
              <span className="font-medium">{data.upload.toFixed(2)} Mbps</span>
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
              Latency:{" "}
              <span className="font-medium">{data.latency.toFixed(1)} ms</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Provider: {data.provider}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Speed Trends Over Time
      </h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p>No speed test data available</p>
            <p className="text-sm mt-1">
              Run some speed tests to see trends here
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              label={{
                value: "Speed (Mbps)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="download"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              name="Download"
            />
            <Line
              type="monotone"
              dataKey="upload"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
              name="Upload"
            />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2 }}
              name="Latency (ms)"
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
