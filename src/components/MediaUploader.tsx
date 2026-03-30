"use client";

import { useRef, useState } from "react";
import { Camera, Mic, Square, Trash2, Play, Pause } from "lucide-react";
import type { NoteAttachment } from "@/types";

interface Props {
  noteId: string;
  attachments: NoteAttachment[];
  onUploaded: (a: NoteAttachment) => void;
  onDeleted: (id: string) => void;
}

export default function MediaUploader({ noteId, attachments, onUploaded, onDeleted }: Props) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const uploadFile = async (file: File, type: "photo" | "voice") => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("noteId", noteId);
      form.append("type", type);
      form.append("file", file);
      const res = await fetch("/api/attachments", { method: "POST", body: form });
      const attachment = await res.json() as NoteAttachment;
      onUploaded(attachment);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file, "photo");
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        await uploadFile(file, "voice");
        setSeconds(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    onDeleted(id);
  };

  const photos = attachments.filter(a => a.type === "photo");
  const voices = attachments.filter(a => a.type === "voice");

  return (
    <div className="mt-2 space-y-2">
      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map(a => (
            <div key={a.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.filename} className="h-20 w-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => handleDelete(a.id)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Voice recordings */}
      {voices.length > 0 && (
        <div className="space-y-1">
          {voices.map(a => (
            <div key={a.id} className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2">
              <Mic size={14} className="text-purple-500 flex-shrink-0" />
              <audio src={a.url} className="flex-1 h-7" controls />
              <button onClick={() => handleDelete(a.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload controls */}
      <div className="flex items-center gap-2">
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={uploading}
          title="Add photo"
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-40"
        >
          <Camera size={15} />
          <span>Photo</span>
        </button>

        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 text-xs text-red-500 px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 animate-pulse"
          >
            <Square size={13} />
            <span>Stop {seconds}s</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={uploading}
            title="Record voice"
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 px-2 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-40"
          >
            <Mic size={15} />
            <span>Voice</span>
          </button>
        )}
        {uploading && <span className="text-xs text-gray-400">Uploading...</span>}
      </div>
    </div>
  );
}
