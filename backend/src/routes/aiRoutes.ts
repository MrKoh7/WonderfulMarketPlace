import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { generateDescription } from '../controllers/aiController';

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

export default router;
