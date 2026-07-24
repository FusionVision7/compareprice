import { Router } from 'express';
import { db } from '../db.js';

export const trendingRouter = Router();

// Most-searched queries in the last 48 hours, real counts from real searches.
const topQueriesStmt = db.prepare(`
  SELECT normalized_query, COUNT(*) AS searchCount, MAX(raw_query) AS displayQuery
  FROM (
    SELECT normalized_query, raw_query FROM searches
    WHERE created_at >= datetime('now', '-2 day')
  )
  GROUP BY normalized_query
  ORDER BY searchCount DESC
  LIMIT 8
`);

// For a given query, the lowest-priced offer from its most recent fetch batch.
const latestBatchStmt = db.prepare(`
  SELECT fetch_batch FROM price_snapshots
  WHERE normalized_query = ?
  ORDER BY fetched_at DESC
  LIMIT 1
`);

const cheapestInBatchStmt = db.prepare(`
  SELECT product_title, source, price, currency, link, fetched_at
  FROM price_snapshots
  WHERE normalized_query = ? AND fetch_batch = ?
  ORDER BY price ASC
  LIMIT 1
`);

// Compares the current lowest price to the previous fetch batch's lowest,
// so we only ever label something "lowest price now" when that is actually
// true against real prior data — never assumed.
const previousLowStmt = db.prepare(`
  SELECT MIN(price) AS minPrice
  FROM price_snapshots
  WHERE normalized_query = ? AND fetch_batch != ?
`);

trendingRouter.get('/', (req, res) => {
  const topQueries = topQueriesStmt.all();

  if (topQueries.length === 0) {
    return res.json({
      trending: [],
      message: 'Not enough search activity yet. Trending products will appear here as people use the site.',
    });
  }

  const trending = topQueries.map((q) => {
    const latestBatch = latestBatchStmt.get(q.normalized_query);
    if (!latestBatch) return null;

    const cheapest = cheapestInBatchStmt.get(q.normalized_query, latestBatch.fetch_batch);
    if (!cheapest) return null;

    const prevLow = previousLowStmt.get(q.normalized_query, latestBatch.fetch_batch);
    const isLowestEver = prevLow.minPrice === null || cheapest.price <= prevLow.minPrice;

    return {
      query: q.displayQuery,
      normalizedQuery: q.normalized_query,
      searchCount: q.searchCount,
      lowestPrice: cheapest.price,
      currency: cheapest.currency,
      source: cheapest.source,
      link: cheapest.link,
      isLowestRecorded: isLowestEver,
      lastCheckedAt: cheapest.fetched_at,
    };
  }).filter(Boolean);

  res.json({ trending });
});
