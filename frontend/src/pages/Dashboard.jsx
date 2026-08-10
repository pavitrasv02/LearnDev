import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, TrendingUp, Award, Play, Clock, ChevronRight,
  Search, Bookmark, Star, Zap, Sparkles, Brain
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CourseCardSkeleton } from "../components/Skeleton";
import api from "../api/axios";

function StatCard({ icon: Icon, label, value, color = "brand" }) {
  const colors = {
    brand:  "from-brand-500/20  to-brand-600/10  text-brand-500",
    green:  "from-green-500/20  to-green-600/10  text-green-500",
    violet: "from-violet-500/20 to-violet-600/10 text-violet-500",
    amber:  "from-amber-500/20  to-amber-600/10  text-amber-500",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
      </div>
    </motion.div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
      <div
        className="bg-gradient-to-r from-brand-500 to-accent-violet h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${value || 0}%` }}
      />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments]   = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [bookmarks, setBookmarks]       = useState([]);
  const [recommended, setRecommended]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQ, setSearchQ]           = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/enrollments"),
      api.get("/certificates").catch(() => ({ data: { certificates: [] } })),
      api.get("/users/bookmarks").catch(() => ({ data: { bookmarks: [] } })),
      api.get("/courses?featured=true&limit=4").catch(() => ({ data: { courses: [] } })),
    ]).then(([enrollRes, certRes, bmRes, recRes]) => {
      setEnrollments(enrollRes.data.enrollments || []);
      setCertificates(certRes.data.certificates || []);
      setBookmarks(bmRes.data.bookmarks || []);
      setRecommended(recRes.data.courses || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const completed  = enrollments.filter((e) => e.status === "completed");
  const inProgress = enrollments.filter((e) => e.status !== "completed");
  const avgProgress = inProgress.length > 0
    ? Math.round(inProgress.reduce((a, e) => a + (e.progress || 0), 0) / inProgress.length)
    : 0;
  const continueEnrollment =
    enrollments.find((e) => e.status === "active" && e.lastLessonId) ||
    enrollments.find((e) => e.status === "active");

  const handleSearch = (ev) => {
    ev.preventDefault();
    if (searchQ.trim()) navigate(`/courses?search=${encodeURIComponent(searchQ.trim())}`);
  };

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding">

        {/* ── Welcome banner ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-1">
            {greeting}, <span className="gradient-text">{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {inProgress.length > 0
              ? `You have ${inProgress.length} course${inProgress.length > 1 ? "s" : ""} in progress. Keep it up!`
              : "Start learning something new today."}
          </p>
        </motion.div>

        {/* ── Quick search ───────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search for a course, topic, or skill..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl glass-card border-0 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
            />
            {searchQ && (
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-4 text-xs">
                Search
              </button>
            )}
          </div>
        </form>

        {/* ── AI Mentor banner ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 mb-8 bg-gradient-to-r from-brand-500/5 to-violet-500/5 border border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 shrink-0">
            <Brain className="w-7 h-7 text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-4 h-4" /> AI Study Mentor
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get your Learning Health Score, Interview Readiness, flashcards, quizzes, and personalised AI insights.
            </p>
          </div>
          <Link to="/ai-mentor" className="btn-primary text-sm py-2.5 shrink-0 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Open Mentor
          </Link>
        </motion.div>

        {/* ── Stat cards ─────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={BookOpen}   label="Enrolled"     value={enrollments.length}  color="brand" />
          <StatCard icon={TrendingUp} label="Avg Progress" value={`${avgProgress}%`}   color="violet" />
          <StatCard icon={Award}      label="Completed"    value={completed.length}     color="green" />
          <StatCard icon={Bookmark}   label="Bookmarks"    value={bookmarks.length}     color="amber" />
        </div>

        {/* ── Continue Learning banner ───────────────────────────────── */}
        {continueEnrollment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-l-4 border-brand-500"
          >
            <img
              src={continueEnrollment.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300"}
              alt=""
              className="w-full sm:w-24 h-16 object-cover rounded-xl shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-brand-500" />
                <p className="text-xs text-brand-500 font-bold uppercase tracking-wide">Continue Learning</p>
              </div>
              <p className="font-semibold truncate">{continueEnrollment.course?.title}</p>
              <div className="mt-2">
                <ProgressBar value={continueEnrollment.progress} />
                <p className="text-xs text-gray-500 mt-1">{continueEnrollment.progress || 0}% complete</p>
              </div>
            </div>
            <Link to={`/learn/${continueEnrollment.course?.slug}`} className="btn-primary flex items-center gap-2 shrink-0 text-sm py-2.5">
              <Play className="w-4 h-4" /> Resume
            </Link>
          </motion.div>
        )}

        {/* ── In Progress ────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {Array(3).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : inProgress.length > 0 ? (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">In Progress</h2>
              <Link to="/courses" className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1">
                Browse more <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {inProgress.map((e, i) => (
                <motion.div key={e._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden group">
                  <div className="relative">
                    <img
                      src={e.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"}
                      alt={e.course?.title}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-xs text-white font-medium">{e.course?.level}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{e.course?.title}</h3>
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1"><Clock className="w-3 h-3" /> {e.course?.duration}</p>
                    <ProgressBar value={e.progress} />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{e.progress || 0}%</span>
                      <Link to={`/learn/${e.course?.slug}`} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                        Continue <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ) : (
          <div className="glass-card p-12 text-center mb-10">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
            <Link to="/courses" className="btn-primary inline-block">Browse Courses</Link>
          </div>
        )}

        {/* ── Completed ──────────────────────────────────────────────── */}
        {completed.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-5">Completed Courses</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {completed.map((e, i) => (
                <motion.div key={e._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
                  <img src={e.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"} alt={e.course?.title} className="w-full h-28 object-cover" />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Completed</span>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-1">{e.course?.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── Bookmarks ──────────────────────────────────────────────── */}
        {bookmarks.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500" /> Saved for Later
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {bookmarks.slice(0, 4).map((bm) => (
                <Link key={bm._id} to={`/courses/${bm.course?.slug}`} className="glass-card p-4 flex flex-col hover:shadow-glow transition-shadow">
                  <img src={bm.course?.thumbnail || ""} alt={bm.course?.title} className="w-full h-24 object-cover rounded-xl mb-3" />
                  <p className="text-sm font-semibold line-clamp-2">{bm.course?.title}</p>
                  <div className="flex items-center gap-1 mt-auto pt-2 text-xs text-gray-400">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {bm.course?.rating}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Certificates ───────────────────────────────────────────── */}
        {certificates.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-5">My Certificates</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {certificates.map((cert, i) => (
                <motion.div key={cert._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 border-l-4 border-green-500">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20 shrink-0">
                      <Award className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm line-clamp-2">{cert.courseTitle}</p>
                      <p className="text-xs text-gray-500 mt-1">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── Recommended ────────────────────────────────────────────── */}
        {recommended.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-500" /> Recommended
              </h2>
              <Link to="/courses" className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommended.map((c) => (
                <Link key={c._id} to={`/courses/${c.slug}`} className="glass-card p-4 hover:shadow-glow transition-shadow">
                  <img src={c.thumbnail} alt={c.title} className="w-full h-24 object-cover rounded-xl mb-3" />
                  <p className="text-sm font-semibold line-clamp-2 mb-1">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.instructor}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {c.rating}
                    </div>
                    <span className="text-xs font-bold text-brand-500">{c.isFree ? "Free" : `$${c.price}`}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
