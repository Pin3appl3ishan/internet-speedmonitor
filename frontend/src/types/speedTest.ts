export interface SpeedTest {
  id: number;
  timestamp: string;
  provider: "fast.com" | "speedtest.net";
  server: string;
  download_mbps: number;
  upload_mbps: number;
  latency_ms: number;
  raw_json?: string;
  created_at: string;
  updated_at: string;
}

export interface SpeedTestStats {
  avgDownload: number;
  avgUpload: number;
  avgLatency: number;
  maxDownload: number;
  maxUpload: number;
  minLatency: number;
}

export interface SpeedTestResponse {
  count: number;
  range: string;
  startDate?: string;
  endDate?: string;
  stats: SpeedTestStats;
  results: SpeedTest[];
}

export type TimeRange = "day" | "week" | "month" | "custom";

export interface ChartDataPoint {
  timestamp: string;
  download: number;
  upload: number;
  latency: number;
  provider: string;
  time: string; // formatted time for display
}
