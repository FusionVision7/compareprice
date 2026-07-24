# PriceWise — real-time multi-retailer price comparison

A working, deployable price-comparison site: search a product once, get **real, live** offers
across marketplaces (via Google Shopping's live index — this covers Amazon, Flipkart, Meesho,
and most other retailers automatically), the genuinely cheapest one, a price-history chart built
from real data over time, and a trending strip driven by actual search activity on your site.

## What's real vs. what you must set up

This app **never invents a price**. Concretely:

- If you haven't configured a data source yet, product search returns a clear error
  (`503 not_configured`) instead of fake numbers.
- The price-history chart only plots days you've actually had the backend check that
  exact search. On day one it will show a single point and say so honestly — it is
  **not** pre-populated with invented history.
- The "Trending now" strip is built entirely from your own `searches` table. On a brand
  new deployment it will be empty until real people search real things.
- Currency isn't computed by manual exchange-rate math — the backend asks the live data
  source for that specific country's actual listings, so what you see is what a shopper
  in that region would really see.

## Architecture

```
frontend/   React (Vite) PWA — installable on Android & iOS home screens, works in any browser
backend/    Node/Express API — SQLite persistence, SerpAPI (Google Shopping) as the live data source
```

- **Data source: SerpAPI's Google Shopping engine.** This is the realistic path discussed:
  Amazon's and Flipkart's own product APIs require an *already-approved, sales-active*
  affiliate account, and Meesho has no public product API at all — so a paid, legal
  aggregator API is what actually lets this work on day one. SerpAPI's free tier is
  100 searches/month; paid plans scale from there. Get a key at https://serpapi.com/.
- **Database: SQLite** (via `better-sqlite3`), a single file at `backend/data/pricewise.sqlite`.
  This is genuinely persistent and needs no external service — good for a single-instance
  deployment. If you outgrow one instance, swap it for Postgres (the queries are plain SQL
  and port over with minor syntax changes).
- **Geolocation:** the backend looks up the visitor's public IP via ipapi.co's free tier
  (~1,000 lookups/day) to detect country/currency. Users can also override the region
  manually in the header — the override is always respected over the auto-detection.

## Local setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env and paste a real SERPAPI_KEY
npm start
```
Runs on `http://localhost:8080`. Check `http://localhost:8080/api/health` —
`priceProviderConfigured` should be `true` once your key is in place.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api/*` to `http://localhost:8080` automatically
(see `vite.config.js`).

## Deploying to a public domain

**Backend** (needs to keep running + hold the SQLite file, so use a persistent-disk host,
not a serverless function):
1. Any of Render, Railway, Fly.io, or a small VPS work well for a Node app like this.
2. Set the environment variables from `backend/.env.example` in your host's dashboard
   (`SERPAPI_KEY` is the one that matters — without it the API honestly refuses to serve
   fake results).
3. Make sure the host gives you a **persistent disk/volume** mounted at `backend/data/` —
   otherwise the SQLite file (and your price history) resets on every redeploy.
4. Note the backend's public URL, e.g. `https://pricewise-api.onrender.com`.

**Frontend:**
1. Set `VITE_API_BASE_URL=https://pricewise-api.onrender.com/api` (your backend's real URL)
   as a build-time environment variable.
2. `npm run build` produces static files in `frontend/dist/` — deploy that folder to
   Vercel, Netlify, Cloudflare Pages, or any static host.
3. Point your domain at it. HTTPS is required for the PWA install prompt to work.

**Custom domain:** once both are deployed, buy/point your domain's DNS at the frontend host,
and (if you want a clean API URL) a subdomain like `api.yourdomain.com` at the backend host.

## Mobile (Android & iOS)

This is a installable Progressive Web App, not a native app:
- On Android Chrome: visitors get an "Install app" / "Add to Home Screen" prompt automatically.
- On iOS Safari: visitors use Share → "Add to Home Screen" (Apple doesn't offer an automatic
  install prompt for PWAs).
- Once installed, it opens full-screen like a native app and works the same everywhere,
  from one codebase.

If you later want native App Store/Play Store apps specifically, that's a separate codebase
(e.g. React Native) — this project doesn't attempt to fake that with just a website.

## Known real limitations (not bugs — just honesty)

- **SerpAPI's coverage of Meesho is inconsistent.** Google Shopping's index leans heavily
  toward Amazon, Flipkart, and large D2C/retail sites; Meesho listings appear less often
  because Meesho's own catalog isn't as fully indexed by Google Shopping. If Meesho coverage
  matters a lot to you, the honest fix is applying for Meesho's partner program directly
  (no public self-serve API exists as of this writing) rather than pretending we can scrape it.
- **Rate limits are real and enforced** (`RATE_LIMIT_PER_MINUTE` in `.env`, default 30
  requests/min per IP) to protect your paid SerpAPI quota from being drained by bots.
- **The IP geolocation free tier** (ipapi.co) is capped around 1,000 lookups/day; at real
  scale you'd want a paid geolocation provider or a `MaxMind` local database instead.

## Project structure

```
backend/
  src/
    db.js                    SQLite schema + connection
    server.js                Express app entry point
    routes/search.js          /api/search — live offers, DB logging, history
    routes/trending.js        /api/trending — real aggregation of past searches
    routes/geo.js              /api/geo — IP-based region/currency detection
    services/shoppingProvider.js  SerpAPI wrapper (the only source of prices)
    services/geoLookup.js      ipapi.co wrapper
    services/locales.js        country → {gl, hl, currency, symbol} mapping
frontend/
  src/
    App.jsx                   Main page: search, region switch, results, ticker
    api.js                    Thin fetch wrapper for the backend
    components/ResultsPanel.jsx     Receipt-style offer list + best-price stamp
    components/PriceHistoryChart.jsx  Real per-day price history (recharts)
    components/TrendingTicker.jsx     Bottom "trending now" strip
```
