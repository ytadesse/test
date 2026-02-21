import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for camera access and image capture.
 * Supports both live camera capture and file upload.
 */
export function useCamera() {
  const [stream, setStream] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const openCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError(`Camera access denied: ${err.message}`);
      setIsCameraOpen(false);
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const imageData = {
      id: Date.now().toString(),
      dataUrl,
      base64: dataUrl.split(',')[1],
      mimeType: 'image/jpeg',
      timestamp: new Date().toISOString(),
    };

    setCapturedImages((prev) => [...prev, imageData]);
    return imageData;
  }, []);

  const addImageFromFile = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const imageData = {
          id: Date.now().toString(),
          dataUrl,
          base64: dataUrl.split(',')[1],
          mimeType: file.type,
          timestamp: new Date().toISOString(),
          fileName: file.name,
        };
        setCapturedImages((prev) => [...prev, imageData]);
        resolve(imageData);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = useCallback((id) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearImages = useCallback(() => {
    setCapturedImages([]);
  }, []);

  return {
    videoRef,
    canvasRef,
    stream,
    isCameraOpen,
    capturedImages,
    error,
    openCamera,
    closeCamera,
    capturePhoto,
    addImageFromFile,
    removeImage,
    clearImages,
  };
}
