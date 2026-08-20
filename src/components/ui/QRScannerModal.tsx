"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Camera, AlertCircle } from "lucide-react";

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onResult: (data: string) => void;
}

export function QRScannerModal({ open, onClose, onResult }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch (e) {
      setError("Camera permission denied");
    }
  }, []);

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      try {
        const jsqr = (await import("jsqr")).default;
        const code = jsqr(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          onResult(code.data);
          stopCamera();
          return;
        }
      } catch {
        // jsqr not available
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [scanning, onResult, stopCamera]);

  useEffect(() => {
    if (open) startCamera();
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  useEffect(() => {
    if (scanning) rafRef.current = requestAnimationFrame(scanFrame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [scanning, scanFrame]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] rounded-xl w-full max-w-sm overflow-hidden border border-[var(--border-default)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">Scan QR Code</span>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera */}
        <div className="relative aspect-[4/3] bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          {/* Scan overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-[var(--accent)] rounded-lg relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-[var(--accent)] rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-[var(--accent)] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-[var(--accent)] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-[var(--accent)] rounded-br-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[var(--accent)] opacity-30" style={{ transform: "translateY(-50%)" }} />
            </div>
          </div>
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-2">
              <AlertCircle className="w-8 h-8 text-[var(--red)]" />
              <p className="text-xs text-[var(--text-secondary)]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3">
          <p className="text-xs text-[var(--text-dim)] text-center">Point the camera at the QR code</p>
        </div>
      </div>
    </div>
  );
}
