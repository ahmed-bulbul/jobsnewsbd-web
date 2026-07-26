'use client';

import { useCallback, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { pdfToImages, zipFiles, downloadBlob, type ZipEntry } from '@/lib/fileConvert';

export default function PdfToJpgConverter() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ZipEntry[] | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFile = (f: File) => {
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError(t('শুধু PDF ফাইল আপলোড করুন', 'Only PDF files are supported'));
      return;
    }
    setError('');
    setResults(null);
    setPreviews([]);
    setFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      const entries = await pdfToImages(file, format, 2);
      setResults(entries);
      setPreviews(entries.map((entry) => URL.createObjectURL(entry.blob)));
    } catch {
      setError(t('PDF রূপান্তর করতে সমস্যা হয়েছে। ফাইলটি ঠিক আছে কিনা দেখুন।', 'Could not convert this PDF. Please check the file and try again.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!results || results.length === 0) return;
    if (results.length === 1) {
      downloadBlob(results[0].blob, results[0].name);
      return;
    }
    const zip = await zipFiles(results);
    downloadBlob(zip, `${file?.name.replace(/\.pdf$/i, '') || 'pages'}.zip`);
  };

  const reset = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setFile(null);
    setResults(null);
    setPreviews([]);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: controls */}
      <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">{t('আউটপুট ফরম্যাট', 'Output format')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['jpeg', 'png'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFormat(f); setResults(null); }}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  format === f ? 'border-primary bg-primary-50 text-primary-800' : 'border-warm-border hover:border-primary/50 text-gray-700'
                }`}
              >
                {f === 'jpeg' ? 'JPG' : 'PNG'}
              </button>
            ))}
          </div>
        </div>

        {file && !results && (
          <button
            onClick={handleConvert}
            disabled={processing}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('রূপান্তর হচ্ছে...', 'Converting...')}
              </span>
            ) : `🖼️ ${t('ছবিতে রূপান্তর করুন', 'Convert to images')}`}
          </button>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {results && (
          <div className="card p-4 bg-emerald-50 border-emerald-200">
            <p className="text-sm font-semibold text-emerald-800">
              ✅ {t(`${results.length}টি পৃষ্ঠা প্রস্তুত`, `${results.length} page${results.length > 1 ? 's' : ''} ready`)}
            </p>
            <button
              onClick={handleDownload}
              className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              ⬇ {results.length > 1 ? t('ZIP ডাউনলোড করুন', 'Download as ZIP') : t('ডাউনলোড করুন', 'Download')}
            </button>
          </div>
        )}

        {file && (
          <button onClick={reset} className="btn-outline w-full text-sm py-2">
            {t('অন্য PDF দিন', 'Choose another PDF')}
          </button>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
          🔒 {t('আপনার PDF কোথাও আপলোড হয় না — সব কিছু আপনার ব্রাউজারেই হয়', 'Your PDF is never uploaded — everything happens right in your browser')}
        </div>
      </div>

      {/* Right: drop zone + previews */}
      <div className="lg:col-span-3 space-y-4 order-1 lg:order-2">
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`card flex flex-col items-center justify-center gap-4 py-16 cursor-pointer transition-all border-2 border-dashed ${
              dragging ? 'border-primary bg-primary-50' : 'border-warm-border hover:border-primary hover:bg-cream/50'
            }`}
          >
            <span className="text-5xl">📄</span>
            <div className="text-center">
              <p className="font-semibold text-gray-700">{t('PDF এখানে টেনে আনুন', 'Drag & drop your PDF here')}</p>
              <p className="text-sm text-warm-muted mt-1">{t('অথবা ক্লিক করে PDF বেছে নিন', 'or click to browse')}</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="card p-4 flex items-center gap-3">
            <span className="text-3xl">📄</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <p className="text-xs text-warm-muted">{Math.round(file.size / 1024)} KB</p>
            </div>
          </div>
        )}

        {previews.length > 0 && (
          <div className="card p-3">
            <p className="text-xs font-semibold text-warm-muted uppercase tracking-wide px-1 mb-2">
              {t('প্রিভিউ', 'Preview')}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`Page ${i + 1}`} className="w-full aspect-[3/4] object-cover rounded-lg border border-warm-border bg-white" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
