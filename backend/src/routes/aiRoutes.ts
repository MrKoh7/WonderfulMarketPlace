import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  generateDescription,
  semanticSearch,
} from '../controllers/aiController';

// Set to 5 generations per user per minute 5 gen/min - prevent abuse
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req: any) => req.auth?.()?.userId ?? ipKeyGenerator(req),
  message: { error: 'Too many requests. Please wait before generating again.' },
});

const router = Router();

router.post(
  '/generate-description',
  requireAuth(),
  aiLimiter,
  generateDescription,
);

router.get('/semantic-search', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}, semanticSearch);

export default router;
