'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

interface Preset {
  id: string;
  labelBn: string;
  labelEn: string;
  width: number;
  height: number;
  maxKB: number;
  note?: string;
}

const PRESETS: Preset[] = [
  { id: 'passport',  labelBn: 'সরকারি চাকরির ছবি', labelEn: 'Govt Job Photo', width: 300, height: 300, maxKB: 100, note: 'বেশিরভাগ সরকারি ফর্ম' },
  { id: 'signature', labelBn: 'স্বাক্ষর',           labelEn: 'Signature',      width: 300, height: 80,  maxKB: 60,  note: 'Teletalk application' },
  { id: 'bcs',       labelBn: 'BCS ছবি',            labelEn: 'BCS Photo',      width: 200, height: 200, maxKB: 100, note: 'BPSC BCS exam' },
  { id: 'nid',       labelBn: 'NID আপডেট',          labelEn: 'NID Photo',      width: 600, height: 800, maxKB: 200, note: 'National ID update' },
  { id: 'bank',      labelBn: 'ব্যাংক জব ছবি',     labelEn: 'Bank Job Photo', width: 300, height: 300, maxKB: 80,  note: 'Bangladesh Bank' },
  { id: 'custom',    labelBn: 'কাস্টম সাইজ',       labelEn: 'Custom Size',    width: 0,   height: 0,   maxKB: 0 },
];

interface Result {
  dataUrl: string;
  sizeKB: number;
  width: number;
  height: number;
}

async function resizeImage(file: File, targetW: number, targetH: number, targetKB: number): Promise<Result> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);

        // Fit the image inside the canvas (cover-style)
        const scale = Math.max(targetW / img.width, targetH / img.height);
        const sw = img.width  * scale;
        const sh = img.height * scale;
        const sx = (targetW  - sw) / 2;
        const sy = (targetH  - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh);

        if (targetKB <= 0) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const sizeKB  = Math.round(atob(dataUrl.split(',')[1]).length / 1024);
          resolve({ dataUrl, sizeKB, width: targetW, height: targetH });
          return;
        }

        // Binary-search JPEG quality to hit target KB
        let lo = 0.1, hi = 0.99, best = canvas.toDataURL('image/jpeg', 0.5);
        for (let i = 0; i < 12; i++) {
          const mid = (lo + hi) / 2;
          const url = canvas.toDataURL('image/jpeg', mid);
          const kb  = Math.round(atob(url.split(',')[1]).length / 1024);
          if (kb <= targetKB) { best = url; lo = mid; } else { hi = mid; }
        }
        const sizeKB = Math.round(atob(best.split(',')[1]).length / 1024);
        resolve({ dataUrl: best, sizeKB, width: targetW, height: targetH });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageResizerPage() {
  const { t, lang } = useLanguage();
  const [selectedPreset, setSelectedPreset] = useState<string>('passport');
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [customKB, setCustomKB] = useState('');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [originalKB, setOriginalKB] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const preset = PRESETS.find((p) => p.id === selectedPreset)!;

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError(t('শুধু ছবি ফাইল (.jpg, .png, .webp) আপলোড করুন', 'Only image files (.jpg, .png, .webp) are supported')); return; }
    setError('');
    setResult(null);
    setOriginalFile(file);
    setOriginalKB(Math.round(file.size / 1024));
    const reader = new FileReader();
    reader.onload = (e) => setOriginalPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }, []);

  const handleProcess = async () => {
    if (!originalFile) return;
    const w = preset.id === 'custom' ? Number(customW) : preset.width;
    const h = preset.id === 'custom' ? Number(customH) : preset.height;
    const kb = preset.id === 'custom' ? Number(customKB) : preset.maxKB;
    if (!w || !h) { setError(t('প্রস্থ ও উচ্চতা দিন', 'Enter width and height')); return; }
    setProcessing(true);
    setError('');
    try {
      const res = await resizeImage(originalFile, w, h, kb);
      setResult(res);
    } catch {
      setError(t('ছবি প্রক্রিয়া করতে সমস্যা হয়েছে। অন্য ছবি দিয়ে চেষ্টা করুন।', 'Could not process image. Please try another file.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `resized_${preset.id}_${result.width}x${result.height}.jpg`;
    a.click();
  };

  const reset = () => {
    setOriginalFile(null);
    setOriginalPreview('');
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/tools" className="hover:text-primary transition-colors">{t('টুলস', 'Tools')}</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">{t('ছবি রিসাইজার', 'Image Resizer')}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('ছবি রিসাইজার', 'Image Resizer')}</h1>
          <p className="mt-1 text-sm text-warm-muted">
            {t(
              'সরকারি চাকরির আবেদনের জন্য ছবি ও স্বাক্ষর নির্দিষ্ট সাইজে কমান — সম্পূর্ণ বিনামূল্যে, কোনো আপলোড নেই',
              'Resize your photo & signature to exact govt job specs — completely free, nothing is uploaded',
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: controls */}
          <div className="lg:col-span-2 space-y-5">

            {/* Preset selector */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 text-sm mb-3">{t('সাইজ বেছে নিন', 'Select Size')}</h2>
              <div className="space-y-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPreset(p.id); setResult(null); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                      selectedPreset === p.id
                        ? 'border-primary bg-primary-50 text-primary-800'
                        : 'border-warm-border hover:border-primary/50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{lang === 'bn' ? p.labelBn : p.labelEn}</span>
                      {p.id !== 'custom' && (
                        <span className="text-xs font-mono text-warm-muted">{p.width}×{p.height}</span>
                      )}
                    </div>
                    {p.note && (
                      <span className="text-xs text-warm-muted mt-0.5 block">{p.note}</span>
                    )}
                    {p.id !== 'custom' && p.maxKB > 0 && (
                      <span className="text-xs text-warm-muted">{t('সর্বোচ্চ', 'Max')} {p.maxKB} KB</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom inputs */}
              {selectedPreset === 'custom' && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div>
                    <label className="label text-xs">{t('প্রস্থ (px)', 'Width (px)')}</label>
                    <input type="number" value={customW} onChange={(e) => setCustomW(e.target.value)} placeholder="300" className="input text-sm" />
                  </div>
                  <div>
                    <label className="label text-xs">{t('উচ্চতা (px)', 'Height (px)')}</label>
                    <input type="number" value={customH} onChange={(e) => setCustomH(e.target.value)} placeholder="300" className="input text-sm" />
                  </div>
                  <div>
                    <label className="label text-xs">{t('সর্বোচ্চ KB', 'Max KB')}</label>
                    <input type="number" value={customKB} onChange={(e) => setCustomKB(e.target.value)} placeholder="100" className="input text-sm" />
                  </div>
                </div>
              )}
            </div>

            {/* Process button */}
            {originalFile && (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('প্রক্রিয়া হচ্ছে...', 'Processing...')}
                  </span>
                ) : `🔄 ${t('রিসাইজ করুন', 'Resize Image')}`}
              </button>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}

            {/* Info box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
              🔒 {t('আপনার ছবি কোথাও আপলোড হয় না — সব কিছু আপনার ব্রাউজারেই হয়', 'Your image is never uploaded — everything happens in your browser')}
            </div>
          </div>

          {/* Right: upload + preview */}
          <div className="lg:col-span-3 space-y-5">

            {/* Drop zone */}
            {!originalFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`card flex flex-col items-center justify-center gap-4 py-16 cursor-pointer transition-all border-2 border-dashed ${
                  dragging ? 'border-primary bg-primary-50' : 'border-warm-border hover:border-primary hover:bg-cream/50'
                }`}
              >
                <span className="text-5xl">📁</span>
                <div className="text-center">
                  <p className="font-semibold text-gray-700">{t('ছবি এখানে টেনে আনুন', 'Drag & drop your image here')}</p>
                  <p className="text-sm text-warm-muted mt-1">{t('অথবা ক্লিক করে ছবি বেছে নিন', 'or click to browse')}</p>
                  <p className="text-xs text-warm-muted mt-2">{t('JPG, PNG, WEBP সাপোর্টেড', 'JPG, PNG, WEBP supported')}</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Before / After */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="card p-3">
                    <p className="text-xs font-semibold text-warm-muted mb-2 uppercase tracking-wide">{t('আগে', 'Before')}</p>
                    <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ height: 160 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {originalPreview && <img src={originalPreview} alt="Original" className="max-h-full max-w-full object-contain" />}
                    </div>
                    <p className="text-xs text-warm-muted mt-2 text-center">{originalKB} KB</p>
                  </div>

                  {/* Result */}
                  <div className="card p-3">
                    <p className="text-xs font-semibold text-warm-muted mb-2 uppercase tracking-wide">{t('পরে', 'After')}</p>
                    <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ height: 160 }}>
                      {result ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={result.dataUrl} alt="Resized" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-warm-muted text-sm">{t('রিসাইজ করুন', 'Resize first')}</span>
                      )}
                    </div>
                    {result && (
                      <p className="text-xs text-warm-muted mt-2 text-center">
                        {result.sizeKB} KB — {result.width}×{result.height} px
                      </p>
                    )}
                  </div>
                </div>

                {/* Result stats + actions */}
                {result && (
                  <div className="card p-4 bg-emerald-50 border-emerald-200">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">✅ {t('সফলভাবে রিসাইজ হয়েছে', 'Successfully resized')}</p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          {originalKB} KB → {result.sizeKB} KB &nbsp;·&nbsp; {result.width}×{result.height} px
                        </p>
                      </div>
                      <button
                        onClick={handleDownload}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        ⬇ {t('ডাউনলোড করুন', 'Download')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Change image */}
                <button onClick={reset} className="btn-outline w-full text-sm py-2">
                  {t('অন্য ছবি দিন', 'Choose another image')}
                </button>
              </div>
            )}

            {/* Quick reference table */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">
                {t('সরকারি চাকরির ছবির সাইজ তালিকা', 'Govt Job Photo Size Reference')}
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-warm-muted border-b border-warm-border">
                    <th className="text-left pb-2 font-medium">{t('ধরন', 'Type')}</th>
                    <th className="text-center pb-2 font-medium">{t('সাইজ (px)', 'Size (px)')}</th>
                    <th className="text-right pb-2 font-medium">{t('সর্বোচ্চ', 'Max')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border">
                  {[
                    { bn: 'সরকারি চাকরির ছবি (বেশিরভাগ)', en: 'Govt Job Photo (most forms)', size: '300×300', max: '100 KB' },
                    { bn: 'স্বাক্ষর (Teletalk)',            en: 'Signature (Teletalk)',        size: '300×80',  max: '60 KB' },
                    { bn: 'BCS ছবি (BPSC)',                 en: 'BCS Photo (BPSC)',            size: '200×200', max: '100 KB' },
                    { bn: 'বাংলাদেশ ব্যাংক',               en: 'Bangladesh Bank',             size: '300×300', max: '80 KB' },
                    { bn: 'NID আপডেট',                      en: 'NID Update',                  size: '600×800', max: '200 KB' },
                  ].map((row) => (
                    <tr key={row.size + row.max}>
                      <td className="py-2 text-gray-700">{t(row.bn, row.en)}</td>
                      <td className="py-2 text-center font-mono text-primary">{row.size}</td>
                      <td className="py-2 text-right text-warm-muted">{row.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
