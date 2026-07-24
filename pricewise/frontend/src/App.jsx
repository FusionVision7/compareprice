import { useEffect, useState, useCallback } from 'react';
import { getGeo, searchProduct, getTrending } from './api';
import ResultsPanel from './components/ResultsPanel';
import PriceHistoryChart from './components/PriceHistoryChart';
import TrendingTicker from './components/TrendingTicker';

const REGIONS = [
  { code: 'IN', name: 'India', symbol: '\u20B9' },
  { code: 'US', name: 'United States', symbol: '$' },
  { code: 'GB', name: 'United Kingdom', symbol: '\u00A3' },
  { code: 'AE', name: 'UAE', symbol: 'AED' },
  { code: 'AU', name: 'Australia', symbol: 'A$' },
  { code: 'CA', name: 'Canada', symbol: 'C$' },
  { code: 'DE', name: 'Germany', symbol: '\u20AC' },
  { code: 'FR', name: 'France', symbol: '\u20AC' },
  { code: 'SG', name: 'Singapore', symbol: 'S$' },
  { code: 'NG', name: 'Nigeria', symbol: '\u20A6' },
  { code: 'ZA', name: 'South Africa', symbol: 'R' },
  { code: 'BR', name: 'Brazil', symbol: 'R$' },
];

const CURRENCY_SYMBOLS = {
  INR: '\u20B9', USD: '$', GBP: '\u00A3', AED: 'AED ', AUD: 'A$', CAD: 'C$',
  EUR: '\u20AC', SGD: 'S$', NGN: '\u20A6', ZAR: 'R', BRL: 'R$',
};

const EXAMPLE_QUERIES = ['iPhone 15', 'Nike Air Max', 'Instant Pot', 'Sony WH-1000XM5'];

export default function App() {
  const [country, setCountry] = useState('IN');
  const [geoNote, setGeoNote] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [trending, setTrending] = useState(null);

  useEffect(() => {
    getGeo()
      .then((geo) => {
        setCountry(geo.country);
        if (!geo.detected) setGeoNote(geo.reason);
      })
      .catch(() => setGeoNote('Could not detect your location automatically. Defaulted to India \u2014 change it above if needed.'));
  }, []);

  const loadTrending = useCallback(() => {
    getTrending()
      .then(setTrending)
      .catch(() => setTrending({ trending: [] }));
  }, []);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  async function runSearch(q) {
    const trimmed = (q ?? query).trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await searchProduct(trimmed, country);
      setResult(data);
      loadTrending();
    } catch (err) {
      if (err.status === 503) {
        setError({
          kind: 'not_configured',
          message: err.message,
        });
      } else {
        setError({ kind: 'generic', message: err.message || 'Something went wrong fetching live prices.' });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runSearch();
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          Price<span className="brand-mark">Wise</span>
        </div>
        <label className="region-pill">
          Region
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
        </label>
      </header>

      <section className="hero">
        <h1>Every price. <em>The real one.</em></h1>
        <p>{'Search a product once. We check live listings across marketplaces and show you the actual cheapest price right now \u2014 no invented numbers, no fake discounts.'}</p>

        <form className="search-slip" onSubmit={handleSubmit}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'Search a product, e.g. \u201cSamsung Galaxy S24\u201d'}
            aria-label="Product search"
          />
          <button type="submit" disabled={loading}>{loading ? 'Checking\u2026' : 'Compare prices'}</button>
        </form>

        <div className="hint-row">
          {EXAMPLE_QUERIES.map((eq) => (
            <button key={eq} type="button" className="hint-chip" onClick={() => { setQuery(eq); runSearch(eq); }}>
              {eq}
            </button>
          ))}
        </div>

        {geoNote && <div className="status-banner info" role="status">{geoNote}</div>}
        {error && error.kind === 'not_configured' && (
          <div className="status-banner error" role="alert">
            {'Live price data isn\u2019t connected yet on this deployment: '}{error.message}
          </div>
        )}
        {error && error.kind === 'generic' && (
          <div className="status-banner error" role="alert">{error.message}</div>
        )}
      </section>

      <main className="results-wrap">
        <ResultsPanel result={result} />
        {result && result.offers && result.offers.length > 0 && (
          <PriceHistoryChart history={result.history} symbol={result.symbol} />
        )}
      </main>

      <TrendingTicker
        trending={trending ? trending.trending : null}
        message={trending ? trending.message : null}
        currencySymbols={CURRENCY_SYMBOLS}
      />

      <footer className="site-footer">
        Prices are fetched live at search time from real marketplace listings and may change. PriceWise is not affiliated with Amazon, Flipkart, or Meesho.
      </footer>
    </div>
  );
}
