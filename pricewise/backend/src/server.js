import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { searchRouter } from './routes/search.js';
import { trendingRouter } from './routes/trending.js';
import { geoRouter } from './routes/geo.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Needed so req.headers['x-forwarded-for'] / real client IP works correctly
// when deployed behind a reverse proxy (Render, Railway, Fly.io, Nginx, etc.).
// Trusting exactly 1 hop (not `true`, which trusts the whole chain) keeps
// express-rate-limit's IP detection safe from spoofing via forged headers.
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

// Real rate limiting — protects your SerpAPI quota (which is metered/paid)
// from being drained by abuse.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE || 30),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    priceProviderConfigured: Boolean(process.env.SERPAPI_KEY),
    time: new Date().toISOString(),
  });
});

app.use('/api/search', searchRouter);
app.use('/api/trending', trendingRouter);
app.use('/api/geo', geoRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

app.listen(PORT, () => {
  console.log(`Pricewise backend running on port ${PORT}`);
  if (!process.env.SERPAPI_KEY) {
    console.warn('WARNING: SERPAPI_KEY is not set. /api/search will return 503 until it is configured in .env');
  }
});
