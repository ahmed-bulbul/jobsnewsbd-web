'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getComments, addComment, addReply, deleteComment } from '@/lib/api';
import type { Comment } from '@/lib/types';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'এইমাত্র';
  if (m < 60) return `${m} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ঘণ্টা আগে`;
  return `${Math.floor(h / 24)} দিন আগে`;
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-primary-700">
        {name?.[0]?.toUpperCase() ?? 'U'}
      </span>
    </div>
  );
}

function CommentInput({
  placeholder,
  onSubmit,
  autoFocus = false,
}: {
  placeholder: string;
  onSubmit: (body: string) => Promise<void>;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed || trimmed.length < 2) return;
    setLoading(true);
    try {
      await onSubmit(trimmed);
      setBody('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-start">
      <textarea
        ref={ref}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={1000}
        className="flex-1 text-sm px-3 py-2 rounded-xl border border-warm-border focus:outline-none focus:border-primary resize-none bg-white"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
        }}
      />
      <button
        onClick={submit}
        disabled={loading || body.trim().length < 2}
        className="btn-primary px-4 py-2 text-sm disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? '...' : 'পোস্ট'}
      </button>
    </div>
  );
}

function ReplyCard({
  reply,
  currentUserId,
  onDelete,
}: {
  reply: Comment;
  currentUserId?: number;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex gap-2.5 pl-4 border-l-2 border-warm-border">
      <Avatar name={reply.authorName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-900">{reply.authorName}</span>
          <span className="text-xs text-warm-muted">{timeAgo(reply.createdAt)}</span>
          {currentUserId === reply.authorId && (
            <button
              onClick={() => onDelete(reply.id)}
              className="text-xs text-red-400 hover:text-red-600 ml-auto"
            >
              মুছুন
            </button>
          )}
        </div>
        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{reply.body}</p>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  slug,
  currentUserId,
  token,
  onDelete,
  onReplyAdded,
}: {
  comment: Comment;
  slug: string;
  currentUserId?: number;
  token?: string;
  onDelete: (id: number) => void;
  onReplyAdded: (commentId: number, reply: Comment) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const { openModal } = useAuth();

  const handleReply = async (body: string) => {
    if (!token) { openModal('login'); return; }
    const reply = await addReply(slug, comment.id, token, body);
    onReplyAdded(comment.id, reply);
    setShowReply(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-warm-border p-4 space-y-3">
      {/* Author row */}
      <div className="flex gap-3">
        <Avatar name={comment.authorName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{comment.authorName}</span>
            <span className="text-xs text-warm-muted">{timeAgo(comment.createdAt)}</span>
            {currentUserId === comment.authorId && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-400 hover:text-red-600 ml-auto"
              >
                মুছুন
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.body}</p>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-3 pt-1">
          {comment.replies.map((r) => (
            <ReplyCard
              key={r.id}
              reply={r}
              currentUserId={currentUserId}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Reply toggle */}
      <div>
        {!showReply ? (
          <button
            onClick={() => { if (!token) { openModal('login'); return; } setShowReply(true); }}
            className="text-xs text-primary hover:underline"
          >
            উত্তর দিন
          </button>
        ) : (
          <div className="space-y-2">
            <CommentInput
              placeholder="উত্তর লিখুন..."
              onSubmit={handleReply}
              autoFocus
            />
            <button onClick={() => setShowReply(false)} className="text-xs text-warm-muted hover:text-gray-600">
              বাতিল
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsSection({ slug }: { slug: string }) {
  const { user, openModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComments(slug)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAdd = async (body: string) => {
    if (!user) { openModal('login'); return; }
    const comment = await addComment(slug, user.token, body);
    setComments((prev) => [...prev, { ...comment, replies: [] }]);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    await deleteComment(id, user.token);
    setComments((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) }))
    );
  };

  const handleReplyAdded = (commentId: number, reply: Comment) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
  };

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        মন্তব্য {totalCount > 0 && <span className="text-warm-muted font-normal text-base">({totalCount})</span>}
      </h2>

      {/* Add comment */}
      <div className="bg-white rounded-2xl border border-warm-border p-4 mb-6">
        {user ? (
          <div className="flex gap-3">
            <Avatar name={user.name} />
            <div className="flex-1">
              <CommentInput
                placeholder="আপনার মন্তব্য লিখুন... (Ctrl+Enter)"
                onSubmit={handleAdd}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm text-warm-muted mb-3">মন্তব্য করতে লগইন করুন</p>
            <button onClick={() => openModal('login')} className="btn-primary px-5 py-2 text-sm">
              লগইন করুন
            </button>
          </div>
        )}
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-warm-border animate-pulse" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-warm-muted text-sm">
          এখনো কোনো মন্তব্য নেই — প্রথম হন!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              slug={slug}
              currentUserId={user?.userId}
              token={user?.token}
              onDelete={handleDelete}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}
    </section>
  );
}
