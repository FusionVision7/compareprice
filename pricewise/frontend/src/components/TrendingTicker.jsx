export default function TrendingTicker({ trending, message, currencySymbols }) {
  if (!trending || trending.length === 0) {
    return (
      <div className="ticker-section">
        <div className="ticker-label">Trending now</div>
        <div className="empty-ticker">
          {message || 'Not enough search activity yet \u2014 trending products will appear here as people use the site.'}
        </div>
      </div>
    );
  }

  return (
    <div className="ticker-section">
      <div className="ticker-label">{'Trending now \u00B7 real searches from this site'}</div>
      <div className="ticker-track">
        {trending.map((t) => {
          const symbol = (currencySymbols && currencySymbols[t.currency]) || t.currency + ' ';
          return (
            <a key={t.normalizedQuery} className="ticker-item" href={t.link} target="_blank" rel="noopener noreferrer sponsored">
              <span className="tq">{t.query}</span>
              <span className="tp">{symbol}{t.lowestPrice.toLocaleString()}</span>
              {t.isLowestRecorded && <span className="low-badge">LOWEST YET</span>}
            </a>
          );
        })}
      </div>
    </div>
  );
}
