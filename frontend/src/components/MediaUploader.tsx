import { useState, DragEvent } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface MediaUploaderProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
}

export default function MediaUploader({ mediaUrls, onChange }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
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
        const body = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(body.message || 'Upload failed');
      }

      const data = await response.json();
      onChange([...mediaUrls, data.url]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(mediaUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const imageAttachments = mediaUrls.filter(url => {
    const isAudio = url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.includes('video/upload') || url.includes('raw/upload');
    return !isAudio;
  });

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        Attachments (Images)
      </label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'
        }`}
      >
        <input
          type="file"
          id="image-file-input"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Uploading to Cloudinary...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Upload className="h-5 w-5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Drag & drop or click to upload
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Supports JPEG, PNG, WEBP (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {imageAttachments.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {imageAttachments.map((url, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
              <img src={url} alt="Upload preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  const globalIdx = mediaUrls.indexOf(url);
                  if (globalIdx !== -1) handleRemove(globalIdx);
                }}
                className="absolute top-1 right-1 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-900 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
