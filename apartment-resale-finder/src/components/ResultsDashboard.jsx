export default function ResultsDashboard({ results, isLoading }) {
  if (isLoading) {
    return (
      <div className="results-section">
        <h2>Analyzing &amp; Searching...</h2>
        <div className="loading-container">
          <div className="spinner" />
          <p>Identifying products and searching eBay for comparable listings...</p>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) return null;

  const totalEstimatedLow = results.reduce((sum, r) => sum + (r.priceRange?.low || 0), 0);
  const totalEstimatedHigh = results.reduce((sum, r) => sum + (r.priceRange?.high || 0), 0);
  const totalEstimatedAvg = results.reduce((sum, r) => sum + (r.priceRange?.avg || 0), 0);

  return (
    <div className="results-section">
      <h2>Step 3: Your Resale Estimates</h2>

      <div className="total-summary">
        <div className="summary-card highlight">
          <h3>Total Estimated Value</h3>
          <div className="price-range">
            <span className="price-low">${totalEstimatedLow.toFixed(2)}</span>
            <span className="price-separator">&ndash;</span>
            <span className="price-high">${totalEstimatedHigh.toFixed(2)}</span>
          </div>
          <div className="price-avg">Average: ${totalEstimatedAvg.toFixed(2)}</div>
          <div className="item-count">{results.length} item{results.length !== 1 ? 's' : ''} identified</div>
        </div>
      </div>

      <div className="results-grid">
        {results.map((result, index) => (
          <ResultCard key={index} result={result} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const { product, priceRange, listings, totalResults, error } = result;

  return (
    <div className={`result-card ${error ? 'result-error' : ''}`}>
      <div className="result-header">
        <h3>{product?.name || result.query}</h3>
        <span className="category-badge">{product?.category}</span>
      </div>

      {product?.condition && (
        <div className="condition">Condition: <strong>{product.condition}</strong></div>
      )}

      {product?.description && (
        <p className="product-description">{product.description}</p>
      )}

      {error ? (
        <div className="error-message">Search error: {error}</div>
      ) : (
        <>
          <div className="price-estimate">
            <div className="price-label">eBay Price Range</div>
            <div className="price-range">
              <span className="price-low">${priceRange.low.toFixed(2)}</span>
              <span className="price-separator">&ndash;</span>
              <span className="price-high">${priceRange.high.toFixed(2)}</span>
            </div>
            <div className="price-avg">
              Average selling price: <strong>${priceRange.avg.toFixed(2)}</strong>
            </div>
            <div className="total-found">{totalResults} similar listings on eBay</div>
          </div>

          {listings.length > 0 && (
            <div className="sample-listings">
              <h4>Sample Listings</h4>
              <ul>
                {listings.slice(0, 3).map((listing, i) => (
                  <li key={i} className="listing-item">
                    <span className="listing-title">{listing.title}</span>
                    <span className="listing-price">${listing.price.toFixed(2)}</span>
                    <span className="listing-condition">{listing.condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
