import { useRef } from 'react';

export default function CameraCapture({
  videoRef,
  canvasRef,
  isCameraOpen,
  capturedImages,
  error,
  onOpenCamera,
  onCloseCamera,
  onCapture,
  onFileUpload,
  onRemoveImage,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await onFileUpload(file);
      }
    }
    e.target.value = '';
  };

  return (
    <div className="camera-section">
      <h2>Step 1: Capture Your Items</h2>
      <p className="section-description">
        Take photos of items in your apartment or upload existing pictures.
      </p>

      <div className="camera-controls">
        {!isCameraOpen ? (
          <div className="capture-buttons">
            <button className="btn btn-primary" onClick={onOpenCamera}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Open Camera
            </button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload Photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="camera-view">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
              onLoadedMetadata={(e) => e.target.play()}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="camera-actions">
              <button className="btn btn-capture" onClick={onCapture} title="Take photo">
                <div className="capture-circle" />
              </button>
              <button className="btn btn-secondary" onClick={onCloseCamera}>
                Close Camera
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {capturedImages.length > 0 && (
        <div className="captured-gallery">
          <h3>{capturedImages.length} photo{capturedImages.length !== 1 ? 's' : ''} captured</h3>
          <div className="image-grid">
            {capturedImages.map((img) => (
              <div key={img.id} className="image-thumbnail">
                <img src={img.dataUrl} alt="Captured item" />
                <button
                  className="remove-btn"
                  onClick={() => onRemoveImage(img.id)}
                  title="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
