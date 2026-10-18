import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  placeholder?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label = 'Image / Photo',
  value,
  onChange,
  required = false,
  placeholder = 'https://images.unsplash.com/... or upload from device',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const res = await api.uploadImage(file);
      if (res && res.url) {
        onChange(res.url);
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError(err.message || 'Image upload failed. You can paste an image URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wider font-bold text-stone-700 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-xs font-semibold text-nature-800 hover:underline flex items-center gap-1"
        >
          {isUrlMode ? (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Switch to File Upload</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Paste Image URL</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Preview Card if Image is Set */}
      {value ? (
        <div className="relative rounded-2xl border border-stone-200 bg-stone-50 p-3 flex items-center gap-3">
          <div className="w-20 h-16 rounded-xl overflow-hidden bg-stone-200 flex-shrink-0 shadow-sm border border-stone-300">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-stone-800 block truncate">{value}</span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> Image attached
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg hover:bg-stone-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 text-stone-400 hover:text-red-600 bg-white border border-stone-200 rounded-lg hover:bg-red-50"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : isUrlMode ? (
        /* Manual URL input */
        <div>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800 bg-white"
          />
        </div>
      ) : (
        /* Drag and Drop / File upload zone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-nature-800 bg-nature-50'
              : 'border-stone-200 hover:border-nature-700 bg-cream-50/60 hover:bg-cream-100/60'
          }`}
        >
          {uploading ? (
            <div className="py-2 flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-nature-900 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-xs font-bold text-stone-700">Uploading photo to server...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-soft border border-stone-200 flex items-center justify-center text-nature-800">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-800">
                  Click to upload photo or drag & drop here
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">PNG, JPG, WebP up to 10MB</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
