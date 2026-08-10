import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, Flag, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api/axios";

// ── Star display ──────────────────────────────────────────────────────────
function Stars({ value, interactive = false, onRate, size = "w-5 h-5" }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size} transition-colors ${s <= display ? "star-filled" : "star-empty"} ${interactive ? "cursor-pointer" : ""}`}
          onClick={() => interactive && onRate && onRate(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
        />
      ))}
    </div>
  );
}

// ── Rating bar (distribution) ─────────────────────────────────────────────
function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-8 text-right text-gray-500">{star}★</span>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-gray-500">{count}</span>
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────
function ReviewCard({ review, onHelpful, onDelete, onEdit, currentUserId }) {
  const isOwn = review.user?._id === currentUserId;
  const [reporting, setReporting] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-white font-bold text-sm shrink-0">
            {review.user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{review.user?.name}</p>
            <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Stars value={review.rating} size="w-4 h-4" />
          {isOwn && (
            <>
              <button onClick={() => onEdit(review)} className="p-1 text-gray-400 hover:text-brand-500 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(review._id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {review.title && <p className="font-semibold text-sm">{review.title}</p>}
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{review.body}</p>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => onHelpful(review._id)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${review.isHelpful ? "text-brand-500" : "text-gray-400 hover:text-brand-500"}`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Helpful{review.helpfulCount > 0 && ` (${review.helpfulCount})`}
        </button>
        {!isOwn && !reporting && (
          <button
            onClick={() => setReporting(true)}
            className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" /> Report
          </button>
        )}
        {reporting && <span className="text-xs text-green-500">Reported</span>}
      </div>
    </motion.div>
  );
}

// ── Review form ───────────────────────────────────────────────────────────
function ReviewForm({ existing, onSubmit, loading, onCancel }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [title, setTitle] = useState(existing?.title || "");
  const [body, setBody] = useState(existing?.body || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    if (!body.trim()) { setError("Please write a review"); return; }
    onSubmit({ rating, title, body });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
      <h3 className="font-semibold">{existing ? "Edit Review" : "Write a Review"}</h3>
      <div>
        <label className="block text-sm text-gray-500 mb-1.5">Rating *</label>
        <Stars value={rating} interactive onRate={setRating} size="w-7 h-7" />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1.5">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          className="input-base"
          maxLength={100}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1.5">Review *</label>
        <textarea
          value={body}
          onChange={(e) => { setBody(e.target.value); setError(""); }}
          placeholder="What did you think of this course?"
          rows={4}
          className="input-base resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-gray-400 mt-1">{body.length}/1000</p>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        )}
        <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
          {loading ? "Submitting…" : existing ? "Update Review" : "Submit Review"}
        </button>
      </div>
    </form>
  );
}

// ── Main ReviewSection component ──────────────────────────────────────────
export default function ReviewSection({ courseId, isEnrolled }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [distribution, setDistribution] = useState({});
  const [avgRating, setAvgRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/reviews`, {
        params: { sort, page, limit: 6 },
      });
      const d = res.data;
      setReviews(d.reviews);
      setDistribution(d.distribution || {});
      setAvgRating(d.avgRating);
      setTotal(d.total);
      setPages(d.pages);
      setMyReview(d.myReview);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (courseId) fetchReviews(); }, [courseId, sort, page]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingReview) {
        await api.put(`/courses/${courseId}/reviews/${editingReview._id}`, formData);
        toast("Review updated!", "success");
      } else {
        await api.post(`/courses/${courseId}/reviews`, formData);
        toast("Review submitted!", "success");
      }
      setShowForm(false);
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to submit review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await api.delete(`/courses/${courseId}/reviews/${reviewId}`);
      toast("Review deleted", "info");
      fetchReviews();
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) { toast("Sign in to vote", "info"); return; }
    try {
      const res = await api.post(`/courses/${courseId}/reviews/${reviewId}/helpful`);
      setReviews((prev) => prev.map((r) =>
        r._id === reviewId
          ? { ...r, helpfulCount: res.data.helpfulCount, isHelpful: res.data.isHelpful }
          : r
      ));
    } catch { /* silently fail */ }
  };

  const totalReviews = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Student Reviews</h2>
          <p className="text-sm text-gray-500">{total} review{total !== 1 ? "s" : ""}</p>
        </div>
        {isEnrolled && user && !myReview && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2.5">
            Write a Review
          </button>
        )}
      </div>

      {/* Rating summary */}
      {total > 0 && (
        <div className="glass-card p-6 grid sm:grid-cols-2 gap-6">
          <div className="text-center flex flex-col items-center justify-center">
            <p className="text-6xl font-black gradient-text">{avgRating.toFixed(1)}</p>
            <Stars value={Math.round(avgRating)} size="w-6 h-6" />
            <p className="text-sm text-gray-500 mt-1">{total} reviews</p>
          </div>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => (
              <RatingBar key={s} star={s} count={distribution[s] || 0} total={totalReviews} />
            ))}
          </div>
        </div>
      )}

      {/* Write / edit form */}
      <AnimatePresence>
        {(showForm || editingReview) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ReviewForm
              existing={editingReview}
              onSubmit={handleSubmit}
              loading={submitting}
              onCancel={() => { setShowForm(false); setEditingReview(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort controls */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {["recent", "helpful", "highest", "lowest"].map((s) => (
            <button
              key={s}
              onClick={() => { setSort(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                sort === s
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No reviews yet</p>
          {isEnrolled && <p className="text-sm mt-1">Be the first to leave a review!</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onHelpful={handleHelpful}
              onDelete={handleDelete}
              onEdit={(r) => { setEditingReview(r); setShowForm(false); }}
              currentUserId={user?._id || user?.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === p ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
