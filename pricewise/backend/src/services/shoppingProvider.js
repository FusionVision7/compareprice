import fetch from 'node-fetch';

const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json';

export class ProviderNotConfiguredError extends Error {}
export class ProviderRequestError extends Error {}

/**
 * Fetches REAL, live shopping results for a query from Google Shopping via
 * SerpAPI. This function returns exactly what the provider gives back —
 * it never fabricates, pads, or estimates a price. If the provider has no
 * result for a field, that field is omitted rather than guessed.
 */
export async function fetchLiveOffers(query, locale) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new ProviderNotConfiguredError(
      'SERPAPI_KEY is not set. Add a real SerpAPI key to backend/.env — this app will not invent prices as a substitute.'
    );
  }

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    gl: locale.gl,
    hl: locale.hl,
    google_domain: locale.google_domain,
    api_key: apiKey,
  });

  const res = await fetch(`${SERPAPI_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ProviderRequestError(`Shopping data provider returned ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();

  if (json.error) {
    throw new ProviderRequestError(json.error);
  }

  const rawResults = Array.isArray(json.shopping_results) ? json.shopping_results : [];

  // Only keep results that actually have a numeric price and a real link.
  // Anything missing either is dropped rather than filled in.
  const offers = rawResults
    .filter((r) => typeof r.extracted_price === 'number' && (r.product_link || r.link))
    .map((r) => ({
      title: r.title,
      source: r.source || 'Unknown seller',
      price: r.extracted_price,
      currency: locale.currency,
      link: r.product_link || r.link,
      thumbnail: r.thumbnail || null,
      rating: typeof r.rating === 'number' ? r.rating : null,
      reviews: typeof r.reviews === 'number' ? r.reviews : null,
    }));

  return offers;
}
