import { useState, useCallback } from 'react';
import CameraCapture from './components/CameraCapture';
import ResultsDashboard from './components/ResultsDashboard';
import SettingsPanel from './components/SettingsPanel';
import { useCamera } from './hooks/useCamera';
import { identifyProducts } from './services/geminiService';
import { searchProductsInParallel } from './services/ebayService';
import './App.css';

export default function App() {
  const camera = useCamera();
  const [identifiedProducts, setIdentifiedProducts] = useState([]);
  const [ebayResults, setEbayResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  const analyzeImages = useCallback(async () => {
    if (camera.capturedImages.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setIdentifiedProducts([]);
    setEbayResults([]);

    try {
      // Step 1: Identify products in all captured images
      setAnalysisStep('Identifying products with AI...');
      const allProducts = [];

      for (const img of camera.capturedImages) {
        const products = await identifyProducts(img.base64, img.mimeType);
        allProducts.push(...products);
      }

      if (allProducts.length === 0) {
        setError('No sellable products identified in your photos. Try taking clearer photos of specific items.');
        setIsAnalyzing(false);
        return;
      }

      setIdentifiedProducts(allProducts);

      // Step 2: Search eBay for all identified products in parallel
      setAnalysisStep(`Searching eBay for ${allProducts.length} products...`);
      const results = await searchProductsInParallel(allProducts);
      setEbayResults(results);
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  }, [camera.capturedImages]);

  const handleReset = () => {
    camera.clearImages();
    setIdentifiedProducts([]);
    setEbayResults([]);
    setError(null);
  };

  const hasApiKeys =
    localStorage.getItem('gemini_api_key') ||
    import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Apartment Resale Finder
          </h1>
          <button
            className="btn btn-icon"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
        {!hasApiKeys && (
          <div className="demo-banner">
            Running in demo mode with mock data.{' '}
            <button className="link-btn" onClick={() => setShowSettings(true)}>
              Add API keys
            </button>{' '}
            for real product identification.
          </div>
        )}
      </header>

      <main className="app-main">
        <CameraCapture
          videoRef={camera.videoRef}
          canvasRef={camera.canvasRef}
          isCameraOpen={camera.isCameraOpen}
          capturedImages={camera.capturedImages}
          error={camera.error}
          onOpenCamera={camera.openCamera}
          onCloseCamera={camera.closeCamera}
          onCapture={camera.capturePhoto}
          onFileUpload={camera.addImageFromFile}
          onRemoveImage={camera.removeImage}
        />

        {camera.capturedImages.length > 0 && (
          <div className="analyze-section">
            <h2>Step 2: Analyze &amp; Price</h2>
            <p className="section-description">
              We&apos;ll identify products using AI, then search eBay in parallel to find comparable listings and estimate resale value.
            </p>
            <div className="analyze-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={analyzeImages}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <div className="spinner-small" />
                    {analysisStep}
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    Analyze {camera.capturedImages.length} Photo{camera.capturedImages.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
              {(ebayResults.length > 0 || identifiedProducts.length > 0) && (
                <button className="btn btn-secondary" onClick={handleReset}>
                  Start Over
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
          </div>
        )}

        <ResultsDashboard results={ebayResults} isLoading={isAnalyzing && identifiedProducts.length > 0} />
      </main>

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
