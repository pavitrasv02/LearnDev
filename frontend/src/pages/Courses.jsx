import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, BookOpen, X, Bookmark, BookmarkCheck } from "lucide-react";
import CourseCard from "../components/CourseCard";
import { CourseCardSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const CATEGORIES = ["All", "Programming", "DevOps", "Cloud", "Data Science", "Design", "Business"];
const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export default function Courses() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch]   = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("All");
  const [level, setLevel]     = useState("All");
  const [isFree, setIsFree]   = useState(false);
  const [bookmarked, setBookmarked] = useState(new Set()); // set of bookmarked courseIds

  const inputRef = useRef(null);
  const debounce = useRef(null);

  // Load bookmarks for logged-in users
  useEffect(() => {
    if (!user) return;
    api.get("/users/bookmarks").then((res) => {
      const ids = new Set((res.data.bookmarks || []).map((b) => b.course?._id));
      setBookmarked(ids);
    }).catch(() => {});
  }, [user]);

  const fetchCourses = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (search) params.search = search;
    if (category !== "All") params.category = category;
    if (level !== "All") params.level = level;
    if (isFree) params.isFree = "true";

    api.get("/courses", { params })
      .then((res) => {
        setCourses(res.data.courses || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [search, category, level, isFree, page]);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(fetchCourses, 300);
    return () => clearTimeout(debounce.current);
  }, [fetchCourses]);

  // Sync URL search param
  useEffect(() => {
    const q = searchParams.get("search");
    if (q) { setSearch(q); inputRef.current?.focus(); }
  }, []);

  const toggleBookmark = async (courseId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await api.post(`/courses/${courseId}/bookmark`);
      setBookmarked((prev) => {
        const next = new Set(prev);
        res.data.bookmarked ? next.add(courseId) : next.delete(courseId);
        return next;
      });
    } catch { /* silently fail */ }
  };

  const clearFilters = () => { setSearch(""); setCategory("All"); setLevel("All"); setIsFree(false); setPage(1); };
  const hasFilters = search || category !== "All" || level !== "All" || isFree;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-2">Explore <span className="gradient-text">Courses</span></h1>
          <p className="text-gray-500 mb-8">
            {total > 0 ? `${total} course${total !== 1 ? "s" : ""} available` : "Find your next skill"}
          </p>
        </motion.div>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search courses, topics, instructors..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-10 py-3 rounded-xl glass-card border-0 focus:ring-2 focus:ring-brand-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="px-4 py-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-brand-500 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
            </select>
            <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}
              className="px-4 py-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-brand-500 text-sm">
              {LEVELS.map((l) => <option key={l} value={l}>{l === "All" ? "All Levels" : l}</option>)}
            </select>
            <button
              onClick={() => { setIsFree((v) => !v); setPage(1); }}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isFree ? "bg-green-500 text-white" : "glass-card text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Free Only
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Results ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24">
            <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-gray-500 font-medium">No courses match your filters.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-brand-500 hover:text-brand-600 text-sm font-medium">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c, i) => (
              <div key={c._id} className="relative">
                <CourseCard course={c} index={i} />
                {/* Bookmark button overlay */}
                {user && (
                  <button
                    onClick={(e) => toggleBookmark(c._id, e)}
                    className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all ${
                      bookmarked.has(c._id)
                        ? "bg-amber-500 text-white shadow-lg"
                        : "bg-black/40 text-white hover:bg-black/60"
                    }`}
                    title={bookmarked.has(c._id) ? "Remove bookmark" : "Bookmark"}
                  >
                    {bookmarked.has(c._id)
                      ? <BookmarkCheck className="w-4 h-4" />
                      : <Bookmark className="w-4 h-4" />
                    }
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-10 flex-wrap">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl glass-card text-sm disabled:opacity-40">← Prev</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-medium ${page === p ? "bg-brand-500 text-white" : "glass-card text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-4 py-2 rounded-xl glass-card text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
