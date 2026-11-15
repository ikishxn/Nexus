import { useState, useRef } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

interface MediaDropzoneProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export default function MediaDropzone({ value, onChange }: MediaDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await uploadFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async (files: File[]) => {
    setError(null);
    const validFiles = files.filter(file => 
      ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    );

    if (validFiles.length === 0) {
      setError('Please upload only image files (PNG, JPEG, WEBP).');
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = validFiles.map(async (file) => {
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
          const body = await response.json().catch(() => ({ message: 'Image upload failed' }));
          throw new Error(body.message || 'Image upload failed');
        }

        const data = await response.json();
        return data.url as string;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...value, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter(url => url !== urlToRemove));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Upload Attachments (PNG, JPEG, WEBP)
      </label>

      {/* Dropzone area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={cn(
          'flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200',
          isDragActive 
            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20' 
            : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          multiple
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-rose-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs font-bold">Uploading files...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-400 dark:text-zinc-500">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Drag & drop images, or <span className="text-rose-600 dark:text-rose-400">browse</span>
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              Up to 10MB each
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Preview thumbnails */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {value.map((url, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/5">
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(url);
                }}
                className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
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
