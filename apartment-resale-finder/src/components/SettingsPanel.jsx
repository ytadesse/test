import { useState } from 'react';

export default function SettingsPanel({ isOpen, onClose }) {
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [ebayAppId, setEbayAppId] = useState(localStorage.getItem('ebay_app_id') || '');
  const [ebayToken, setEbayToken] = useState(localStorage.getItem('ebay_access_token') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (geminiKey) localStorage.setItem('gemini_api_key', geminiKey);
    else localStorage.removeItem('gemini_api_key');

    if (ebayAppId) localStorage.setItem('ebay_app_id', ebayAppId);
    else localStorage.removeItem('ebay_app_id');

    if (ebayToken) localStorage.setItem('ebay_access_token', ebayToken);
    else localStorage.removeItem('ebay_access_token');

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>API Settings</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <p className="settings-description">
          Configure your API keys to use real product identification and eBay pricing.
          Without keys, the app runs in demo mode with mock data.
        </p>

        <div className="settings-form">
          <div className="form-group">
            <label htmlFor="gemini-key">Google Gemini API Key</label>
            <input
              id="gemini-key"
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
            />
            <small>Get one at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a></small>
          </div>

          <div className="form-group">
            <label htmlFor="ebay-app-id">eBay App ID (Client ID)</label>
            <input
              id="ebay-app-id"
              type="password"
              value={ebayAppId}
              onChange={(e) => setEbayAppId(e.target.value)}
              placeholder="Enter your eBay App ID..."
            />
            <small>Get one at <a href="https://developer.ebay.com" target="_blank" rel="noreferrer">eBay Developer Portal</a></small>
          </div>

          <div className="form-group">
            <label htmlFor="ebay-token">eBay OAuth Token</label>
            <input
              id="ebay-token"
              type="password"
              value={ebayToken}
              onChange={(e) => setEbayToken(e.target.value)}
              placeholder="Enter your eBay OAuth token..."
            />
          </div>

          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
