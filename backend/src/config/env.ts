import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// A helper to require env vars at startup
const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const ENV = {
  // Numbers need explicit parsing
  PORT: parseInt(process.env.PORT || '3000', 10),

  // These must exist — crash at startup if missing, not mid-request
  DATABASE_URL: requireEnv('DATABASE_URL'),
  CLERK_PUBLISHABLE_KEY: requireEnv('CLERK_PUBLISHABLE_KEY'),
  CLERK_SECRET_KEY: requireEnv('CLERK_SECRET_KEY'),
  STRIPE_SECRET_KEY: requireEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: requireEnv('STRIPE_WEBHOOK_SECRET'),
  OPENROUTER_API_KEY: requireEnv('OPENROUTER_API_KEY'),

  // These have sensible fallbacks
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  PLATFORM_FEE_PERCENTAGE: process.env.PLATFORM_FEE_PERCENTAGE || '0.05',
};
