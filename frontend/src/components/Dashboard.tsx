import React, { useState, useEffect, useCallback } from "react";
import { StatsCard } from "./StatsCard";
import { Filters } from "./Filters";
import { SpeedChart } from "./SpeedChart";
import { ApiService } from "../services/api";
import type {
  SpeedTestResponse,
  TimeRange,
  ChartDataPoint,
} from "../types/speedTest";
import { format } from "date-fns";

// Icons as simple SVG components
const DownloadIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
    />
  </svg>
);

const UploadIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const LatencyIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const TestsIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<SpeedTestResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("day");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiService.getSpeedTests(
        selectedRange,
        customStartDate,
        customEndDate
      );

      setData(response);

      // Transform data for chart
      const transformedData: ChartDataPoint[] = response.results.map(
        (test) => ({
          timestamp: test.timestamp,
          download: test.download_mbps,
          upload: test.upload_mbps,
          latency: test.latency_ms,
          provider: test.provider,
          time: format(new Date(test.timestamp), "HH:mm"),
        })
      );

      setChartData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [selectedRange, customStartDate, customEndDate]);

  useEffect(() => {
    // Only fetch if not custom range, or if custom range has both dates
    if (selectedRange !== "custom" || (customStartDate && customEndDate)) {
      fetchData();
    }
  }, [selectedRange, customStartDate, customEndDate, fetchData]);

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    if (range !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  const getRangeDisplayName = () => {
    switch (selectedRange) {
      case "day":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "custom":
        return "Custom Range";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">
            Error loading data: {error}
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header moved to App.tsx */}

        {/* Filters */}
        <div className="mb-6">
          <Filters
            selectedRange={selectedRange}
            onRangeChange={handleRangeChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateChange={handleCustomDateChange}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Avg Download"
            value={data?.stats.avgDownload || 0}
            unit="Mbps"
            icon={<DownloadIcon />}
          />
          <StatsCard
            title="Avg Upload"
            value={data?.stats.avgUpload || 0}
            unit="Mbps"
            icon={<UploadIcon />}
          />
          <StatsCard
            title="Avg Latency"
            value={data?.stats.avgLatency || 0}
            unit="ms"
            icon={<LatencyIcon />}
          />
          <StatsCard
            title="Total Tests"
            value={data?.count || 0}
            unit="tests"
            icon={<TestsIcon />}
          />
        </div>

        {/* Chart */}
        <div className="mb-8">
          <SpeedChart data={chartData} />
        </div>

        {/* Data Summary */}
        {data && data.count > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Summary for {getRangeDisplayName()}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Max Download:
                </span>{" "}
                <span className="font-medium">
                  {data.stats.maxDownload.toFixed(2)} Mbps
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Max Upload:
                </span>{" "}
                <span className="font-medium">
                  {data.stats.maxUpload.toFixed(2)} Mbps
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Min Latency:
                </span>{" "}
                <span className="font-medium">
                  {data.stats.minLatency.toFixed(1)} ms
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
