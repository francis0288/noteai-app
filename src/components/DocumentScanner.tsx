"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Camera, RotateCcw, Check, Upload } from "lucide-react";

interface Props {
  noteId: string;
  onScanned: (attachment: { id: string; url: string; filename: string; type: string; mimeType: string; sizeBytes: number; createdAt: string }) => void;
  onClose: () => void;
}

type Stage = "camera" | "preview" | "uploading";

export default function DocumentScanner({ noteId, onScanned, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<Stage>("camera");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [camError, setCamError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCamError("Camera access denied. Please allow camera permissions and try again.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [startCamera]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Basic auto-enhance: draw, apply slight contrast boost
    ctx.filter = "contrast(1.15) brightness(1.05)";
    ctx.drawImage(video, 0, 0);
    ctx.filter = "none";

    canvas.toBlob(blob => {
      if (!blob) return;
      setCapturedBlob(blob);
      setCapturedUrl(URL.createObjectURL(blob));
      setStage("preview");
      streamRef.current?.getTracks().forEach(t => t.stop());
    }, "image/jpeg", 0.92);
  };

  const retake = () => {
    setCapturedUrl(null);
    setCapturedBlob(null);
    setStage("camera");
    startCamera();
  };

  const upload = async () => {
    if (!capturedBlob) return;
    setStage("uploading");

    const filename = `scan_${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("file", capturedBlob, filename);
    formData.append("noteId", noteId);
    formData.append("type", "photo");

    try {
      const res = await fetch("/api/attachments", { method: "POST", body: formData });
      const attachment = await res.json();
      onScanned(attachment);
      onClose();
    } catch {
      setStage("preview");
      alert("Upload failed. Please try again.");
    }
  };

  // Fallback: file input if camera not available
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStage("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("noteId", noteId);
    formData.append("type", "photo");
    try {
      const res = await fetch("/api/attachments", { method: "POST", body: formData });
      const attachment = await res.json();
      onScanned(attachment);
      onClose();
    } catch {
      setStage("camera");
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-black/80">
        <span className="text-white font-semibold text-base">Scan Document</span>
        <button onClick={onClose} className="text-gray-300 hover:text-white p-1">
          <X size={22} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {camError ? (
          <div className="text-center px-8">
            <Camera size={48} className="text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 text-sm mb-6">{camError}</p>
            <label className="inline-flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium text-sm cursor-pointer transition-colors">
              <Upload size={16} /> Upload Image Instead
              <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            </label>
          </div>
        ) : stage === "camera" ? (
          <>
            <video
              ref={videoRef}
              className="max-h-full max-w-full object-contain"
              playsInline
              muted
            />
            {/* Document guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-brand-400/70 rounded-lg"
                style={{ width: "85%", height: "70%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+80px)]">
                <p className="text-white/80 text-xs text-center bg-black/40 px-3 py-1 rounded-full">
                  Align document within the frame
                </p>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : stage === "preview" && capturedUrl ? (
          <img src={capturedUrl} alt="Scan preview" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-white text-center">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-300">Uploading scan…</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 py-6 bg-black/80">
        {stage === "camera" && !camError && (
          <>
            <label className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors text-xs">
              <div className="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center">
                <Upload size={20} />
              </div>
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            </label>
            <button
              onClick={capture}
              className="w-18 h-18 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
              style={{ width: 72, height: 72 }}
            >
              <Camera size={28} className="text-gray-800" />
            </button>
            <div className="w-12 h-12" /> {/* spacer */}
          </>
        )}
        {stage === "preview" && (
          <>
            <button
              onClick={retake}
              className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors text-xs"
            >
              <div className="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center">
                <RotateCcw size={20} />
              </div>
              Retake
            </button>
            <button
              onClick={upload}
              className="w-16 h-16 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center transition-colors"
            >
              <Check size={28} className="text-white" />
            </button>
            <div className="w-12 h-12" />
          </>
        )}
      </div>
    </div>
  );
}
