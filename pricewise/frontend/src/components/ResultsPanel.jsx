export default function ResultsPanel({ result }) {
  if (!result) return null;
  const { offers, cheapest, priceRange, symbol, query, message } = result;

  if (!offers || offers.length === 0) {
    return (
      <div className="status-banner info" role="status">
        {message || 'No live offers found for this search.'}
      </div>
    );
  }

  return (
    <>
      <div className="summary-row">
        <div className="summary-card cheapest">
          <div className="label">Cheapest right now</div>
          <div className="value">{symbol}{cheapest.price.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="label">Price range</div>
          <div className="value">
            {symbol}{priceRange.min.toLocaleString()}{'\u2013'}{symbol}{priceRange.max.toLocaleString()}
          </div>
        </div>
        <div className="summary-card">
          <div className="label">Sellers compared</div>
          <div className="value">{offers.length}</div>
        </div>
      </div>

      <div className="receipt">
        <div className="receipt-head">Results for &ldquo;{query}&rdquo;</div>
        {offers.map((offer, i) => (
          <a
            key={`${offer.source}-${i}`}
            className="offer-row"
            href={offer.link}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {offer.thumbnail ? (
              <img className="offer-thumb" src={offer.thumbnail} alt="" loading="lazy" />
            ) : (
              <div className="offer-thumb" aria-hidden="true" />
            )}
            <div className="offer-main">
              <div className="offer-title">{offer.title}</div>
              <div className="offer-source">
                {offer.source}
                {offer.rating ? ` \u00B7 \u2605 ${offer.rating}${offer.reviews ? ` (${offer.reviews})` : ''}` : ''}
              </div>
            </div>
            <div className="offer-price">{symbol}{offer.price.toLocaleString()}</div>
            {i === 0 && <span className="best-stamp">BEST PRICE</span>}
          </a>
        ))}
      </div>
    </>
  );
}
