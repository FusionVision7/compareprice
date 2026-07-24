const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const err = new Error((body && body.message) || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function getGeo() {
  return request('/geo');
}

export function searchProduct(query, country) {
  const params = new URLSearchParams({ q: query });
  if (country) params.set('country', country);
  return request(`/search?${params.toString()}`);
}

export function getTrending() {
  return request('/trending');
}
