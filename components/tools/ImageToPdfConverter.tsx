'use client';

import { useCallback, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { imagesToPdf, downloadBlob } from '@/lib/fileConvert';

interface PickedImage {
  file: File;
  preview: string;
  id: string;
}

export default function ImageToPdfConverter() {
  const { t } = useLanguage();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | File[]) => {
    const valid = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      setError(t('শুধু ছবি ফাইল (.jpg, .png, .webp) যোগ করা যাবে', 'Only image files (.jpg, .png, .webp) can be added'));
      return;
    }
    setError('');
    setResultBlob(null);
    setImages((prev) => [
      ...prev,
      ...valid.map((file) => ({ file, preview: URL.createObjectURL(file), id: `${file.name}-${file.size}-${Math.random()}` })),
    ]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setResultBlob(null);
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setError('');
    try {
      const blob = await imagesToPdf(images.map((i) => i.file));
      setResultBlob(blob);
    } catch {
      setError(t('PDF তৈরি করতে সমস্যা হয়েছে। অন্য ছবি দিয়ে চেষ্টা করুন।', 'Could not create the PDF. Please try different images.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    downloadBlob(resultBlob, `converted-${Date.now()}.pdf`);
  };

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setResultBlob(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: actions */}
      <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">
        {images.length > 0 && (
          <button
            onClick={handleConvert}
            disabled={processing}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('তৈরি হচ্ছে...', 'Converting...')}
              </span>
            ) : (
              `📄 ${t(`PDF তৈরি করুন (${images.length}টি ছবি)`, `Convert to PDF (${images.length} image${images.length > 1 ? 's' : ''})`)}`
            )}
          </button>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {resultBlob && (
          <div className="card p-4 bg-emerald-50 border-emerald-200">
            <p className="text-sm font-semibold text-emerald-800">✅ {t('PDF তৈরি হয়েছে', 'PDF is ready')}</p>
            <button
              onClick={handleDownload}
              className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              ⬇ {t('ডাউনলোড করুন', 'Download PDF')}
            </button>
          </div>
        )}

        {images.length > 0 && (
          <button onClick={reset} className="btn-outline w-full text-sm py-2">
            {t('সব মুছে নতুন করে শুরু করুন', 'Clear all & start over')}
          </button>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
          🔒 {t('আপনার ছবি কোথাও আপলোড হয় না — সব কিছু আপনার ব্রাউজারেই হয়', 'Your images are never uploaded — everything happens right in your browser')}
        </div>
      </div>

      {/* Right: drop zone + list */}
      <div className="lg:col-span-3 space-y-4 order-1 lg:order-2">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`card flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-all border-2 border-dashed ${
            dragging ? 'border-primary bg-primary-50' : 'border-warm-border hover:border-primary hover:bg-cream/50'
          }`}
        >
          <span className="text-4xl">🖼️</span>
          <div className="text-center">
            <p className="font-semibold text-gray-700">{t('ছবি এখানে টেনে আনুন', 'Drag & drop images here')}</p>
            <p className="text-sm text-warm-muted mt-1">{t('অথবা ক্লিক করে একাধিক ছবি বেছে নিন', 'or click to select multiple images')}</p>
            <p className="text-xs text-warm-muted mt-2">{t('JPG, PNG, WEBP সাপোর্টেড — একাধিক ছবি একটি PDF-এ যোগ হবে', 'JPG, PNG, WEBP supported — multiple images combine into one PDF')}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {images.length > 0 && (
          <div className="card p-3 space-y-2">
            <p className="text-xs font-semibold text-warm-muted uppercase tracking-wide px-1">
              {t('পৃষ্ঠার ক্রম (উপরে-নিচে বাটনে সাজান)', 'Page order (use arrows to reorder)')}
            </p>
            {images.map((img, idx) => (
              <div key={img.id} className="flex items-center gap-3 bg-cream/50 rounded-lg p-2">
                <span className="text-xs font-mono text-warm-muted w-5 text-center shrink-0">{idx + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.preview} alt={img.file.name} className="w-12 h-12 object-cover rounded shrink-0 bg-white" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{img.file.name}</p>
                  <p className="text-xs text-warm-muted">{Math.round(img.file.size / 1024)} KB</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveImage(idx, -1)}
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-md border border-warm-border text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 transition-colors"
                    aria-label="Move up"
                  >↑</button>
                  <button
                    onClick={() => moveImage(idx, 1)}
                    disabled={idx === images.length - 1}
                    className="w-7 h-7 rounded-md border border-warm-border text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 transition-colors"
                    aria-label="Move down"
                  >↓</button>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="w-7 h-7 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Remove"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
