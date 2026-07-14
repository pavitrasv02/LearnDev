import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, TrendingUp, Award, Play, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CourseCardSkeleton } from "../components/Skeleton";
import api from "../api/axios";

// ── Small reusable stat card ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = "brand" }) {
  const colors = {
    brand: "from-brand-500/20 to-brand-600/10 text-brand-500",
    green: "from-green-500/20 to-green-600/10 text-green-500",
    violet: "from-violet-500/20 to-violet-600/10 text-violet-500",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 flex items-center gap-4"
    >
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

// ── Progress bar ─────────────────────────────────────────────────────────
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
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/enrollments"),
      api.get("/certificates").catch(() => ({ data: { certificates: [] } })),
    ])
      .then(([enrollRes, certRes]) => {
        setEnrollments(enrollRes.data.enrollments || []);
        setCertificates(certRes.data.certificates || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = enrollments.filter((e) => e.status === "completed");
  const inProgress = enrollments.filter((e) => e.status !== "completed");
  const avgProgress =
    inProgress.length > 0
      ? Math.round(inProgress.reduce((a, e) => a + (e.progress || 0), 0) / inProgress.length)
      : 0;

  // "Continue Learning" — most recently accessed active enrollment
  const continueEnrollment = enrollments.find((e) => e.status === "active" && e.lastLessonId)
    || enrollments.find((e) => e.status === "active");

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {inProgress.length > 0
              ? `You have ${inProgress.length} course${inProgress.length > 1 ? "s" : ""} in progress.`
              : "Start learning something new today."}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          <StatCard icon={BookOpen}   label="Enrolled"   value={enrollments.length} color="brand" />
          <StatCard icon={TrendingUp} label="Avg Progress" value={`${avgProgress}%`} color="violet" />
          <StatCard icon={Award}      label="Completed"  value={completed.length}   color="green" />
        </div>

        {/* Continue Learning banner */}
        {continueEnrollment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <img
              src={continueEnrollment.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300"}
              alt=""
              className="w-full sm:w-24 h-16 object-cover rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-500 font-semibold uppercase tracking-wide mb-1">Continue Learning</p>
              <p className="font-semibold truncate">{continueEnrollment.course?.title}</p>
              <div className="mt-2">
                <ProgressBar value={continueEnrollment.progress} />
                <p className="text-xs text-gray-500 mt-1">{continueEnrollment.progress || 0}% complete</p>
              </div>
            </div>
            <Link
              to={`/learn/${continueEnrollment.course?.slug}`}
              className="btn-primary flex items-center gap-2 shrink-0 text-sm py-2.5"
            >
              <Play className="w-4 h-4" /> Resume
            </Link>
          </motion.div>
        )}

        {/* In Progress */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : inProgress.length > 0 ? (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-5">In Progress</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {inProgress.map((e, i) => (
                <motion.div
                  key={e._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={e.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"}
                      alt={e.course?.title}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-xs text-white font-medium">
                      {e.course?.level}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{e.course?.title}</h3>
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {e.course?.duration}
                    </p>
                    <ProgressBar value={e.progress} />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{e.progress || 0}%</span>
                      <Link
                        to={`/learn/${e.course?.slug}`}
                        className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                      >
                        Continue <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ) : (
          <div className="glass-card p-12 text-center mb-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
            <Link to="/courses" className="btn-primary inline-block">Browse Courses</Link>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-5">Completed</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {completed.map((e, i) => (
                <motion.div
                  key={e._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card overflow-hidden"
                >
                  <img
                    src={e.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"}
                    alt={e.course?.title}
                    className="w-full h-28 object-cover"
                  />
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

        {/* Certificates */}
        {certificates.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-5">My Certificates</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {certificates.map((cert, i) => (
                <motion.div
                  key={cert._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 border-2 border-brand-500/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-brand-500/10">
                      <Award className="w-6 h-6 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm line-clamp-2">{cert.courseTitle}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Issued {new Date(cert.issuedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                        #{cert.verificationCode?.slice(0, 16)}…
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
