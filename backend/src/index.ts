import express from 'express';
import { ENV } from './config/env';

const app = express();

app.get('/', (req, res) => {
  res.json({ success: true });
});

app.listen(ENV.PORT, () => {
  console.log(`Server is running on PORT: ${ENV.PORT}`);
});
