import { StatusCodes } from "http-status-codes";
import { Op } from "sequelize";
import { subDays } from "date-fns";
import SpeedTest from "../models/speedtest.model.js";

/**
 * Get speed test results with optional date range filtering
 * @param {string} range - Time range: 'day', 'week', 'month', or 'custom'
 * @param {Date} startDate - Start date for custom range
 * @param {Date} endDate - End date for custom range
 * @returns {Promise<Object>} - Speed test results with statistics
 */
// UTC-safe date helpers to avoid timezone drift between services
const startOfDayUtc = (d = new Date()) =>
  new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
const endOfDayUtc = (d = new Date()) =>
  new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );

const startOfWeekUtc = (d = new Date(), weekStartsOn = 1) => {
  const day = d.getUTCDay();
  const diff = (day - weekStartsOn + 7) % 7; // 0 = same day, 1 = one day after start
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
};
const endOfWeekUtc = (d = new Date(), weekStartsOn = 1) => {
  const start = startOfWeekUtc(d, weekStartsOn);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
};

const startOfMonthUtc = (d = new Date()) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
const endOfMonthUtc = (d = new Date()) =>
  new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );

export const getSpeedTests = async (range = "day", startDate, endDate) => {
  const now = new Date();
  let where = {};

  // Set date range based on the specified period (UTC boundaries)
  switch (range.toLowerCase()) {
    case "day":
      where.timestamp = {
        [Op.gte]: startOfDayUtc(now),
        [Op.lte]: endOfDayUtc(now),
      };
      break;
    case "week":
      where.timestamp = {
        [Op.gte]: startOfWeekUtc(now, 1),
        [Op.lte]: endOfWeekUtc(now, 1),
      };
      break;
    case "month":
      where.timestamp = {
        [Op.gte]: startOfMonthUtc(now),
        [Op.lte]: endOfMonthUtc(now),
      };
      break;
    case "custom":
      if (!startDate || !endDate) {
        throw new Error("Start and end dates are required for custom range");
      }
      where.timestamp = {
        [Op.gte]: startOfDayUtc(new Date(startDate)),
        [Op.lte]: endOfDayUtc(new Date(endDate)),
      };
      break;
    default:
      throw new Error(
        "Invalid range. Must be one of: day, week, month, custom"
      );
  }

  // Fetch speed tests from the database
  const speedTests = await SpeedTest.findAll({
    where,
    order: [["timestamp", "ASC"]],
  });

  // Calculate statistics
  const stats = calculateStats(speedTests);

  return {
    count: speedTests.length,
    range,
    ...(range === "custom" && { startDate, endDate }),
    stats,
    results: speedTests,
  };
};

/**
 * Calculate statistics from speed test results
 * @param {Array} tests - Array of speed test results
 * @returns {Object} - Statistics object
 */
const calculateStats = (tests) => {
  if (tests.length === 0) {
    return {
      avgDownload: 0,
      avgUpload: 0,
      avgLatency: 0,
      maxDownload: 0,
      maxUpload: 0,
      minLatency: 0,
    };
  }

  const stats = tests.reduce(
    (acc, test) => {
      acc.totalDownload += test.download_mbps;
      acc.totalUpload += test.upload_mbps;
      acc.totalLatency += test.latency_ms;
      acc.maxDownload = Math.max(acc.maxDownload, test.download_mbps);
      acc.maxUpload = Math.max(acc.maxUpload, test.upload_mbps);
      acc.minLatency = Math.min(
        acc.minLatency || test.latency_ms,
        test.latency_ms
      );
      return acc;
    },
    {
      totalDownload: 0,
      totalUpload: 0,
      totalLatency: 0,
      maxDownload: 0,
      maxUpload: 0,
      minLatency: null,
    }
  );

  return {
    avgDownload: stats.totalDownload / tests.length,
    avgUpload: stats.totalUpload / tests.length,
    avgLatency: stats.totalLatency / tests.length,
    maxDownload: stats.maxDownload,
    maxUpload: stats.maxUpload,
    minLatency: stats.minLatency || 0,
  };
};

/**
 * Save a new speed test result
 * @param {Object} data - Speed test data
 * @returns {Promise<Object>} - Created speed test record
 */
export const createSpeedTest = async (data) => {
  const {
    provider,
    server,
    download_mbps,
    upload_mbps,
    latency_ms,
    timestamp = new Date(),
    raw_json,
  } = data;

  // Validate required fields
  if (
    !provider ||
    download_mbps === undefined ||
    upload_mbps === undefined ||
    latency_ms === undefined
  ) {
    throw new Error("Missing required fields");
  }

  // Sanity checks to filter out unrealistic values (configurable via env)
  const maxDownload = Number(process.env.MAX_DOWNLOAD_MBPS || 1000);
  const maxUpload = Number(process.env.MAX_UPLOAD_MBPS || 1000);
  if (download_mbps < 0 || upload_mbps < 0 || latency_ms < 0) {
    throw new Error("Invalid negative values");
  }
  if (download_mbps > maxDownload || upload_mbps > maxUpload) {
    throw new Error("Outlier values exceed configured thresholds");
  }

  // Create the speed test record
  const speedTest = await SpeedTest.create({
    provider,
    server: server || null,
    download_mbps: parseFloat(download_mbps),
    upload_mbps: parseFloat(upload_mbps),
    latency_ms: parseFloat(latency_ms),
    timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
    raw_json: raw_json ? JSON.stringify(raw_json) : null,
  });

  return speedTest;
};
