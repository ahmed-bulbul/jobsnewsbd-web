'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/ui/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { getRecommendedBooks } from '@/lib/api';
import type { RecommendedBook } from '@/lib/types';

function BookCard({ book }: { book: RecommendedBook }) {
  const { t } = useLanguage();
  return (
    <Link
      href={`/study-corner/recommended-books/${book.id}`}
      className="group bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div className="aspect-[3/4] bg-warm-bg flex items-center justify-center overflow-hidden relative">
        {book.coverImageUrl ? (
          <Image src={book.coverImageUrl} alt={book.title} fill className="object-cover" unoptimized />
        ) : (
          <span className="text-4xl select-none">📖</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-0.5 flex-1">
        <h3 className="font-bold text-sm leading-snug text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
          {book.title}
        </h3>
        {book.author && <p className="text-xs text-warm-muted line-clamp-1">{book.author}</p>}
        {book.category && (
          <span className="mt-1 inline-block w-fit text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {book.category}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function RecommendedBooksListPage() {
  const { t } = useLanguage();
  const [books, setBooks] = useState<RecommendedBook[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRecommendedBooks({ category: category || undefined, q: q || undefined, page, size: 20 })
      .then((res) => { setBooks(res.content); setTotalPages(res.totalPages); })
      .catch(() => { setBooks([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  }, [category, q, page]);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/study-corner" className="hover:text-primary transition-colors">{t('স্টাডি কর্নার', 'Study Corner')}</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">{t('প্রস্তাবিত বই', 'Recommended Books')}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('প্রস্তাবিত বই', 'Recommended Books')}</h1>
          <p className="mt-1 text-sm text-warm-muted">
            {t('প্রস্তুতির জন্য বাছাই করা সেরা বইয়ের তালিকা', 'A curated list of the best books for exam preparation')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(0); }}
            placeholder={t('ক্যাটাগরি (যেমনঃ বিসিএস, ব্যাংক)', 'Category (e.g. BCS, Bank)')}
            className="input text-sm w-auto"
          />
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder={t('বইয়ের নাম বা লেখক দিয়ে খুঁজুন', 'Search by book title or author')}
            className="input text-sm flex-1 min-w-[200px]"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="aspect-[3/4] bg-white rounded-2xl border border-warm-border animate-pulse" />)}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('কোনো বই পাওয়া যায়নি', 'No books found')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Footer />
    </div>
  );
}
