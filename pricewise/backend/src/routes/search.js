import { Router } from 'express';
import crypto from 'node:crypto';
import { db, normalizeQuery } from '../db.js';
import { resolveLocale } from '../services/locales.js';
import { fetchLiveOffers, ProviderNotConfiguredError, ProviderRequestError } from '../services/shoppingProvider.js';

export const searchRouter = Router();

const insertSearch = db.prepare(
  `INSERT INTO searches (normalized_query, raw_query, country) VALUES (?, ?, ?)`
);

const insertSnapshot = db.prepare(`
  INSERT INTO price_snapshots
    (normalized_query, product_title, source, price, currency, link, thumbnail, rating, reviews, fetch_batch)
  VALUES (@normalized_query, @product_title, @source, @price, @currency, @link, @thumbnail, @rating, @reviews, @fetch_batch)
`);

const insertManySnapshots = db.transaction((rows) => {
  for (const row of rows) insertSnapshot.run(row);
});

const historyQuery = db.prepare(`
  SELECT date(fetched_at) AS day, MIN(price) AS minPrice, currency
  FROM price_snapshots
  WHERE normalized_query = ?
  GROUP BY date(fetched_at)
  ORDER BY day ASC
  LIMIT 90
`);

searchRouter.get('/', async (req, res) => {
  const rawQuery = (req.query.q || '').toString();
  const countryCode = (req.query.country || '').toString();

  if (!rawQuery.trim()) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  const normalized = normalizeQuery(rawQuery);
  const locale = resolveLocale(countryCode);

  let offers;
  try {
    offers = await fetchLiveOffers(rawQuery, locale);
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      return res.status(503).json({
        error: 'not_configured',
        message: err.message,
      });
    }
    if (err instanceof ProviderRequestError) {
      return res.status(502).json({ error: 'provider_error', message: err.message });
    }
    return res.status(500).json({ error: 'unknown_error', message: 'Unexpected error fetching live prices.' });
  }

  // Log the search itself (real user activity — powers the trending section)
  insertSearch.run(normalized, rawQuery, locale.code);

  if (offers.length === 0) {
    return res.json({
      query: rawQuery,
      normalizedQuery: normalized,
      country: locale.code,
      currency: locale.currency,
      symbol: locale.symbol,
      offers: [],
      cheapest: null,
      priceRange: null,
      history: historyQuery.all(normalized),
      message: 'No live offers found for this product in this region right now. Try a more specific product name.',
    });
  }

  const fetchBatch = crypto.randomUUID();
  const rows = offers.map((o) => ({
    normalized_query: normalized,
    product_title: o.title,
    source: o.source,
    price: o.price,
    currency: o.currency,
    link: o.link,
    thumbnail: o.thumbnail,
    rating: o.rating,
    reviews: o.reviews,
    fetch_batch: fetchBatch,
  }));
  insertManySnapshots(rows);

  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];
  const priceRange = {
    min: sorted[0].price,
    max: sorted[sorted.length - 1].price,
  };

  const history = historyQuery.all(normalized);

  res.json({
    query: rawQuery,
    normalizedQuery: normalized,
    country: locale.code,
    currency: locale.currency,
    symbol: locale.symbol,
    offers: sorted,
    cheapest,
    priceRange,
    history, // real per-day lowest price, grows as this query is searched over time
  });
});
