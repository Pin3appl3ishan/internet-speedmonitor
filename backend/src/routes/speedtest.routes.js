import { Router } from 'express';
import { body, query } from 'express-validator';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  getSpeedTests,
  createSpeedTest,
} from '../controllers/speedtest.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Speed Tests
 *   description: Internet speed test results
 */

/**
 * @swagger
 * /speed:
 *   get:
 *     summary: Get speed test results
 *     tags: [Speed Tests]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [day, week, month, custom]
 *           default: day
 *         description: Time range for results
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Speed test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Number of results
 *                 range:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     avgDownload:
 *                       type: number
 *                     avgUpload:
 *                       type: number
 *                     avgLatency:
 *                       type: number
 *                     maxDownload:
 *                       type: number
 *                     maxUpload:
 *                       type: number
 *                     minLatency:
 *                       type: number
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SpeedTest'
 */
router.get(
  '/',
  [
    query('range')
      .optional()
      .isIn(['day', 'week', 'month', 'custom'])
      .withMessage('Range must be one of: day, week, month, custom'),
    query('startDate')
      .if(query('range').equals('custom'))
      .notEmpty()
      .isISO8601()
      .withMessage('startDate is required and must be a valid date (YYYY-MM-DD)'),
    query('endDate')
      .if(query('range').equals('custom'))
      .notEmpty()
      .isISO8601()
      .withMessage('endDate is required and must be a valid date (YYYY-MM-DD)'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { range = 'day', startDate, endDate } = req.query;
      const results = await getSpeedTests(range, startDate, endDate);
      res.json(results);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /speed:
 *   post:
 *     summary: Add a new speed test result
 *     tags: [Speed Tests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpeedTestInput'
 *     responses:
 *       201:
 *         description: Speed test result created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpeedTest'
 */
router.post(
  '/',
  [
    body('provider')
      .isIn(['fast.com', 'speedtest.net'])
      .withMessage('Provider must be either fast.com or speedtest.net'),
    body('download_mbps').isFloat({ min: 0 }).withMessage('Download speed must be a positive number'),
    body('upload_mbps').isFloat({ min: 0 }).withMessage('Upload speed must be a positive number'),
    body('latency_ms').isFloat({ min: 0 }).withMessage('Latency must be a positive number'),
    body('server').optional().isString(),
    body('timestamp').optional().isISO8601().toDate(),
    body('raw_json').optional().isObject(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const speedTest = await createSpeedTest(req.body);
      res.status(201).json(speedTest);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
