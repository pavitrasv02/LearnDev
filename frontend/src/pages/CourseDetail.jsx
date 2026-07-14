import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Users, Star, BookOpen, CheckCircle, Play, FileText,
  Download, ChevronDown, ChevronUp, Lock, Award
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageLoader, CourseCardSkeleton } from "../components/Skeleton";
import api from "../api/axios";

// ── Lesson type icon ──────────────────────────────────────────────────────
function LessonIcon({ type }) {
  if (type === "video") return <Play className="w-4 h-4 text-brand-500" />;
  if (type === "pdf") return <FileText className="w-4 h-4 text-amber-500" />;
  if (type === "resource") return <Download className="w-4 h-4 text-green-500" />;
  return <BookOpen className="w-4 h-4 text-violet-500" />;
}

// ── Section accordion ─────────────────────────────────────────────────────
function SectionItem({ section, isEnrolled, completedLessons = [], index }) {
  const [open, setOpen] = useState(index === 0);
  const completedInSection = section.lessons?.filter(
    (l) => completedLessons.includes(l._id)
  ).length || 0;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-bold text-brand-500 shrink-0">S{index + 1}</span>
          <span className="font-semibold truncate">{section.title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-xs text-gray-500 hidden sm:block">
            {section.lessons?.length || 0} lessons
            {isEnrolled && completedInSection > 0 && ` · ${completedInSection} done`}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && section.lessons?.length > 0 && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800"
          >
            {section.lessons.map((lesson) => {
              const done = completedLessons.includes(lesson._id);
              return (
                <li
                  key={lesson._id}
                  className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <LessonIcon type={lesson.type} />
                  <span className={`flex-1 truncate ${done ? "line-through text-gray-400" : ""}`}>
                    {lesson.title}
                  </span>
                  {lesson.duration > 0 && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {Math.round(lesson.duration / 60)}m
                    </span>
                  )}
                  {!isEnrolled && !lesson.isPreview && (
                    <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                  {done && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const courseRes = await api.get(`/courses/${slug}`);
        setCourse(courseRes.data.course);

        if (user) {
          try {
            const enrollRes = await api.get(`/enrollments/${courseRes.data.course._id}`);
            setEnrollment(enrollRes.data.enrollment);
          } catch {
            setEnrollment(null);
          }
        }
      } catch {
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [slug, user, navigate]);

  const handleEnroll = async () => {
    if (!user) { navigate("/login"); return; }
    setEnrolling(true);
    try {
      await api.post(`/enrollments/${course._id}`);
      toast("Enrolled successfully! Start learning now.", "success");
      navigate(`/learn/${course.slug}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Enrollment failed";
      if (msg.toLowerCase().includes("already")) {
        navigate(`/learn/${course.slug}`);
      } else {
        toast(msg, "error");
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!course) return null;

  const sections = course.populatedSections || [];
  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length || 0), 0)
    || course.lessons || 0;
  const isEnrolled = !!enrollment;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/courses" className="hover:text-brand-500 transition-colors">Courses</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{course.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left: course info */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <img
                src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"}
                alt={course.title}
                className="w-full aspect-video object-cover rounded-2xl mb-6"
              />

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 text-sm rounded-full glass">{course.category}</span>
                <span className="px-3 py-1 text-sm rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  {course.level}
                </span>
                {course.isFree && (
                  <span className="px-3 py-1 text-sm rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">
                    FREE
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                {course.description}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap gap-5 text-gray-500 text-sm mb-8">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {course.rating} rating
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {(course.studentsCount || 0).toLocaleString()} students
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> {totalLessons} lessons
                </span>
              </div>

              {/* Instructor */}
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {course.instructor?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Instructor</p>
                  <p className="font-semibold">{course.instructor}</p>
                </div>
              </div>
            </motion.div>

            {/* Curriculum */}
            {sections.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
                <p className="text-sm text-gray-500 mb-5">
                  {sections.length} sections · {totalLessons} lessons
                  {isEnrolled && ` · ${enrollment.progress || 0}% complete`}
                </p>
                <div className="space-y-3">
                  {sections.map((s, i) => (
                    <SectionItem
                      key={s._id}
                      section={s}
                      index={i}
                      isEnrolled={isEnrolled}
                      completedLessons={enrollment?.completedLessons || []}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Legacy curriculum fallback */}
            {sections.length === 0 && course.curriculum?.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Curriculum</h2>
                <div className="space-y-3">
                  {course.curriculum.map((section, i) => (
                    <div key={i} className="glass-card p-5">
                      <h3 className="font-semibold mb-3">{section.title}</h3>
                      <ul className="space-y-2">
                        {section.lessons?.map((lesson, j) => (
                          <li key={j} className="flex items-center gap-2 text-sm text-gray-500">
                            <Play className="w-4 h-4 text-brand-500 shrink-0" />
                            {lesson.title}
                            {lesson.duration && <span className="ml-auto text-xs">{lesson.duration}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: enroll card (sticky) */}
          <div>
            <div className="glass-card p-7 sticky top-24 space-y-4">
              {/* Progress for enrolled */}
              {isEnrolled && (
                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-brand-600 dark:text-brand-400">Your progress</span>
                    <span className="font-bold">{enrollment.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-accent-violet h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progress || 0}%` }}
                    />
                  </div>
                  {enrollment.status === "completed" && (
                    <div className="flex items-center gap-2 mt-3 text-green-600 dark:text-green-400 text-sm font-semibold">
                      <Award className="w-4 h-4" /> Course completed!
                    </div>
                  )}
                </div>
              )}

              <p className="text-3xl font-bold gradient-text">
                {course.isFree ? "Free" : `$${course.price}`}
              </p>

              {isEnrolled ? (
                <Link
                  to={`/learn/${course.slug}`}
                  className="btn-primary w-full text-center flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {enrollment.status === "completed" ? "Review Course" : "Continue Learning"}
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {enrolling ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enrolling…</>
                  ) : (
                    `Enroll ${course.isFree ? "for Free" : "Now"}`
                  )}
                </button>
              )}

              <ul className="space-y-2 text-sm text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Lifetime access</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Certificate of completion</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {course.level} level</li>
                {totalLessons > 0 && (
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {totalLessons} lessons</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
