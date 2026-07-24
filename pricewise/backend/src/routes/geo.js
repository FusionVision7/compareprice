import { Router } from 'express';
import { getClientIp, lookupCountryByIp } from '../services/geoLookup.js';
import { resolveLocale, DEFAULT_COUNTRY } from '../services/locales.js';

export const geoRouter = Router();

geoRouter.get('/', async (req, res) => {
  const ip = getClientIp(req);
  const lookup = await lookupCountryByIp(ip);

  if (!lookup) {
    const locale = resolveLocale(DEFAULT_COUNTRY);
    return res.json({
      detected: false,
      reason: 'Could not determine location from IP (private/local network or lookup failed). Defaulted to United States — you can change the region manually.',
      country: locale.code,
      countryName: locale.name,
      currency: locale.currency,
      symbol: locale.symbol,
    });
  }

  const locale = resolveLocale(lookup.countryCode);
  res.json({
    detected: true,
    country: locale.code,
    countryName: locale.name,
    currency: locale.currency,
    symbol: locale.symbol,
    matchedRequestedCountry: locale.code === lookup.countryCode.toUpperCase(),
  });
});
