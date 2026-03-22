import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { clerkMiddleware } from '@clerk/express';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import commentRoutes from './routes/commentRoutes';
import cartRoutes from './routes/cartRoutes';
import paymentRoutes from './routes/paymentRoutes';

const app = express();

const allowedOrigins = [ENV.FRONTEND_URL, 'http://localhost:5173'].filter(
  Boolean,
) as string[];

// Support both GET and HEAD for UptimeRobot
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.head('/health', (_req, res) => {
  res.status(200).end();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  }),
);

// !!!!! WEBHOOK MUST BE REGISTERED BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(clerkMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);

export default app;
