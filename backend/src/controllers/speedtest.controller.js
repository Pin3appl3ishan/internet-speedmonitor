import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import SpeedTest from '../models/speedtest.model.js';

/**
 * Get speed test results with optional date range filtering
 * @param {string} range - Time range: 'day', 'week', 'month', or 'custom'
 * @param {Date} startDate - Start date for custom range
 * @param {Date} endDate - End date for custom range
 * @returns {Promise<Object>} - Speed test results with statistics
 */
export const getSpeedTests = async (range = 'day', startDate, endDate) => {
  const now = new Date();
  let where = {};
  
  // Set date range based on the specified period
  switch (range.toLowerCase()) {
    case 'day':
      where.timestamp = {
        [Op.gte]: startOfDay(now),
        [Op.lte]: endOfDay(now),
      };
      break;
    case 'week':
      where.timestamp = {
        [Op.gte]: startOfWeek(now, { weekStartsOn: 1 }),
        [Op.lte]: endOfWeek(now, { weekStartsOn: 1 }),
      };
      break;
    case 'month':
      where.timestamp = {
        [Op.gte]: startOfMonth(now),
        [Op.lte]: endOfMonth(now),
      };
      break;
    case 'custom':
      if (!startDate || !endDate) {
        throw new Error('Start and end dates are required for custom range');
      }
      where.timestamp = {
        [Op.gte]: startOfDay(new Date(startDate)),
        [Op.lte]: endOfDay(new Date(endDate)),
      };
      break;
    default:
      throw new Error('Invalid range. Must be one of: day, week, month, custom');
  }

  // Fetch speed tests from the database
  const speedTests = await SpeedTest.findAll({
    where,
    order: [['timestamp', 'ASC']],
  });

  // Calculate statistics
  const stats = calculateStats(speedTests);

  return {
    count: speedTests.length,
    range,
    ...(range === 'custom' && { startDate, endDate }),
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
      acc.minLatency = Math.min(acc.minLatency || test.latency_ms, test.latency_ms);
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
  if (!provider || download_mbps === undefined || upload_mbps === undefined || latency_ms === undefined) {
    throw new Error('Missing required fields');
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
