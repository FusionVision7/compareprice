// Maps a country code to the parameters that make the shopping-data provider
// return results from that country's real marketplaces, in that country's
// real currency. We never convert prices with a manual exchange-rate
// multiplication — we ask the provider for that country's actual listings
// instead, which is more accurate to what a shopper there would really see.
export const LOCALES = {
  IN: { name: 'India', gl: 'in', hl: 'en', google_domain: 'google.co.in', currency: 'INR', symbol: '\u20B9' },
  US: { name: 'United States', gl: 'us', hl: 'en', google_domain: 'google.com', currency: 'USD', symbol: '$' },
  GB: { name: 'United Kingdom', gl: 'uk', hl: 'en', google_domain: 'google.co.uk', currency: 'GBP', symbol: '\u00A3' },
  AE: { name: 'United Arab Emirates', gl: 'ae', hl: 'en', google_domain: 'google.ae', currency: 'AED', symbol: 'AED' },
  AU: { name: 'Australia', gl: 'au', hl: 'en', google_domain: 'google.com.au', currency: 'AUD', symbol: 'A$' },
  CA: { name: 'Canada', gl: 'ca', hl: 'en', google_domain: 'google.ca', currency: 'CAD', symbol: 'C$' },
  DE: { name: 'Germany', gl: 'de', hl: 'de', google_domain: 'google.de', currency: 'EUR', symbol: '\u20AC' },
  FR: { name: 'France', gl: 'fr', hl: 'fr', google_domain: 'google.fr', currency: 'EUR', symbol: '\u20AC' },
  SG: { name: 'Singapore', gl: 'sg', hl: 'en', google_domain: 'google.com.sg', currency: 'SGD', symbol: 'S$' },
  NG: { name: 'Nigeria', gl: 'ng', hl: 'en', google_domain: 'google.com.ng', currency: 'NGN', symbol: '\u20A6' },
  ZA: { name: 'South Africa', gl: 'za', hl: 'en', google_domain: 'google.co.za', currency: 'ZAR', symbol: 'R' },
  BR: { name: 'Brazil', gl: 'br', hl: 'pt', google_domain: 'google.com.br', currency: 'BRL', symbol: 'R$' },
};

export const DEFAULT_COUNTRY = 'US';

export function resolveLocale(countryCode) {
  if (!countryCode) return { code: DEFAULT_COUNTRY, ...LOCALES[DEFAULT_COUNTRY] };
  const code = countryCode.toUpperCase();
  if (LOCALES[code]) return { code, ...LOCALES[code] };
  return { code: DEFAULT_COUNTRY, ...LOCALES[DEFAULT_COUNTRY] };
}
