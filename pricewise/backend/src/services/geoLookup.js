import fetch from 'node-fetch';

function isPrivateIp(ip) {
  if (!ip) return true;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('::ffff:127.')
  );
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress;
}

/**
 * Looks up the real country for a given public IP using ipapi.co's free
 * tier (no key, ~1000 lookups/day — a genuine rate limit, not invented).
 * Returns null on any failure or private/local IP, so the caller can fall
 * back honestly instead of guessing.
 */
export async function lookupCountryByIp(ip) {
  if (isPrivateIp(ip)) return null;
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'pricewise-app/1.0' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error || !json.country_code) return null;
    return {
      countryCode: json.country_code,
      countryName: json.country_name,
      ip,
    };
  } catch {
    return null;
  }
}
