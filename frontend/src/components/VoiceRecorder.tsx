import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Volume2, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  value?: string;
  onChange: (url: string | null) => void;
}

export default function VoiceRecorder({ value, onChange }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    setSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/media/upload`, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Audio upload failed' }));
        throw new Error(body.message || 'Audio upload failed');
      }

      const data = await response.json();
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload voice note');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Voice Answer (Max 60s)
      </label>

      <div className="flex items-center gap-3">
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-all"
          >
            <Square className="h-4 w-4 fill-white" />
            Stop {formatTime(seconds)} / 01:00
          </button>
        ) : isUploading ? (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-rose-100 px-4 py-2 text-sm font-bold text-rose-400 dark:bg-rose-950/40 dark:text-rose-600"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </button>
        ) : !value ? (
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-all"
          >
            <Mic className="h-4 w-4" />
            Record Voice
          </button>
        ) : null}

        {isRecording && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {value && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-white/5 dark:bg-white/5 max-w-sm">
          <div className="flex items-center gap-2 flex-1">
            <Volume2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <audio controls className="h-8 flex-1 max-w-[200px] outline-none" src={value} />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-white/5"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
