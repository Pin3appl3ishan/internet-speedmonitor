import type { SpeedTestResponse, TimeRange } from "../types/speedTest";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:3001/api";

export class ApiService {
  static async getSpeedTests(
    range: TimeRange = "day",
    startDate?: string,
    endDate?: string
  ): Promise<SpeedTestResponse> {
    let url = `${API_BASE_URL}/speed?range=${range}`;

    if (range === "custom") {
      if (startDate && endDate) {
        url = `${API_BASE_URL}/speed?range=custom&startDate=${startDate}&endDate=${endDate}`;
      } else {
        // If custom is selected but no dates provided, default to today
        url = `${API_BASE_URL}/speed?range=day`;
      }
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch speed tests: ${response.statusText}`);
    }

    return response.json();
  }

  static async createSpeedTest(data: {
    provider: string;
    server?: string;
    download_mbps: number;
    upload_mbps: number;
    latency_ms: number;
    timestamp?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/speed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create speed test: ${response.statusText}`);
    }

    return response.json();
  }

  static async getHealthStatus() {
    const healthUrl = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/health`
      : "http://localhost:3001/health";
    const response = await fetch(healthUrl);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}
