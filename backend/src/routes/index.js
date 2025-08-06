import { Router } from 'express';
import speedTestRoutes from './speedtest.routes.js';

const router = Router();

// API routes
router.use('/speed', speedTestRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
