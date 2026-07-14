import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, CheckCircle, Play, FileText,
  Download, BookOpen, Menu, X, Award, ChevronDown, ChevronUp, Lock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageLoader } from "../components/Skeleton";
import api from "../api/axios";

// ── Lesson type icon ──────────────────────────────────────────────────────
function LessonTypeIcon({ type, className = "w-4 h-4" }) {
  if (type === "video")    return <Play     className={`${className} text-brand-500`} />;
  if (type === "pdf")      return <FileText  className={`${className} text-amber-500`} />;
  if (type === "resource") return <Download  className={`${className} text-green-500`} />;
  return <BookOpen className={`${className} text-violet-500`} />;
}

// ── Video player ──────────────────────────────────────────────────────────
function VideoPlayer({ url }) {
  if (!url) return <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center text-gray-500">No video URL provided</div>;

  // YouTube embed
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden bg-black">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    );
  }
  // Direct video file
  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-black">
      <video className="w-full h-full" controls src={url}>
        Your browser does not support video.
      </video>
    </div>
  );
}

// ── Markdown notes viewer ─────────────────────────────────────────────────
function NotesViewer({ content }) {
  return (
    <div className="glass-card p-6 prose dark:prose-invert max-w-none">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        {content || "No notes for this lesson."}
      </pre>
    </div>
  );
}

export default function LearnPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completionModal, setCompletionModal] = useState(false);

  // Flat list of all lessons for prev/next navigation
  const allLessons = sections.flatMap((s) => s.lessons || []);

  const fetchData = useCallback(async () => {
    try {
      const courseRes = await api.get(`/courses/${slug}`);
      const c = courseRes.data.course;
      setCourse(c);

      // Fetch structured sections
      const sectionsRes = await api.get(`/courses/${c._id}/sections`);
      const sects = sectionsRes.data.sections || [];
      setSections(sects);

      // Fetch enrollment
      const enrollRes = await api.get(`/enrollments/${c._id}`);
      const enroll = enrollRes.data.enrollment;
      setEnrollment(enroll);

      // Set initial lesson: last accessed or first lesson
      const flat = sects.flatMap((s) => s.lessons || []);
      if (flat.length > 0) {
        const resume = enroll?.lastLessonId
          ? flat.find((l) => l._id === enroll.lastLessonId?._id || l._id === enroll.lastLessonId)
          : null;
        setActiveLesson(resume || flat[0]);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        toast("You are not enrolled in this course.", "error");
        navigate(`/courses/${slug}`);
      } else {
        toast("Failed to load course content.", "error");
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [slug, navigate, toast]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchData();
  }, [user, fetchData, navigate]);

  const isCompleted = (lessonId) =>
    enrollment?.completedLessons?.includes(lessonId) || false;

  const handleMarkLesson = async (lessonId, completed) => {
    if (marking) return;
    setMarking(true);
    try {
      const res = await api.patch(`/enrollments/${course._id}/lessons`, {
        lessonId,
        completed,
      });
      setEnrollment(res.data.enrollment);
      if (res.data.isCompleted && !completionModal) {
        setCompletionModal(true);
      }
      toast(completed ? "Lesson marked complete!" : "Lesson unmarked.", "success");
    } catch {
      toast("Could not save progress.", "error");
    } finally {
      setMarking(false);
    }
  };

  const goToLesson = (lesson) => {
    setActiveLesson(lesson);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentIndex = allLessons.findIndex((l) => l._id === activeLesson?._id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (loading) return <PageLoader />;
  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10 h-14 flex items-center px-4 gap-3">
        <Link to="/dashboard" className="text-gray-500 hover:text-brand-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{course.title}</p>
          {enrollment && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 max-w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${enrollment.progress || 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{enrollment.progress || 0}%</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="p-2 rounded-lg glass hover:bg-white/20 transition-colors lg:hidden"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex pt-14 flex-1">
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {(sidebarOpen) && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed lg:relative left-0 top-14 bottom-0 w-72 lg:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto z-30 flex-shrink-0"
            >
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Course Content</p>
                {sections.length === 0 && (
                  <p className="text-gray-500 text-sm">No structured content yet.</p>
                )}
                {sections.map((section, si) => (
                  <SidebarSection
                    key={section._id}
                    section={section}
                    sectionIndex={si}
                    activeLesson={activeLesson}
                    onSelect={goToLesson}
                    completedLessons={enrollment?.completedLessons || []}
                  />
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-auto"
          onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
        >
          {activeLesson ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Lesson header */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <LessonTypeIcon type={activeLesson.type} />
                  <span className="capitalize">{activeLesson.type}</span>
                </div>
                <h1 className="text-2xl font-bold">{activeLesson.title}</h1>
                {activeLesson.description && (
                  <p className="text-gray-500 mt-2">{activeLesson.description}</p>
                )}
              </div>

              {/* Content area */}
              {activeLesson.type === "video" && <VideoPlayer url={activeLesson.content} />}
              {activeLesson.type === "pdf" && (
                <div className="glass-card p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">PDF Document</p>
                  <a
                    href={activeLesson.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Open PDF
                  </a>
                </div>
              )}
              {activeLesson.type === "notes" && (
                <NotesViewer content={activeLesson.content} />
              )}
              {activeLesson.type === "resource" && (
                <div className="glass-card p-6 text-center">
                  <Download className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Downloadable Resource</p>
                  {activeLesson.resourceUrl && (
                    <a
                      href={activeLesson.resourceUrl}
                      download
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  )}
                </div>
              )}

              {/* Complete button + navigation */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => goToLesson(prevLesson)}
                  disabled={!prevLesson}
                  className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  onClick={() => handleMarkLesson(activeLesson._id, !isCompleted(activeLesson._id))}
                  disabled={marking}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isCompleted(activeLesson._id)
                      ? "bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30"
                      : "btn-primary"
                  }`}
                >
                  {marking
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <CheckCircle className="w-4 h-4" />
                  }
                  {isCompleted(activeLesson._id) ? "Completed ✓" : "Mark Complete"}
                </button>

                <button
                  onClick={() => nextLesson ? goToLesson(nextLesson) : null}
                  disabled={!nextLesson}
                  className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center py-24">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-bold mb-2">No lessons yet</h2>
              <p className="text-gray-500">This course has no lessons added yet. Check back soon!</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Course completion modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {completionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-10 max-w-md w-full text-center"
            >
              <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <Award className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Course Complete! 🎉</h2>
              <p className="text-gray-500 mb-6">
                Congratulations on completing <strong>{course.title}</strong>. Your certificate has been issued.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCompletionModal(false)}
                  className="btn-secondary flex-1"
                >
                  Keep Reviewing
                </button>
                <Link to="/dashboard" className="btn-primary flex-1 text-center">
                  View Certificate
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sidebar section component ─────────────────────────────────────────────
function SidebarSection({ section, sectionIndex, activeLesson, onSelect, completedLessons }) {
  const [open, setOpen] = useState(sectionIndex === 0);
  const completedCount = section.lessons?.filter((l) => completedLessons.includes(l._id)).length || 0;

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left py-2.5 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
        <span className="text-sm font-medium flex-1 truncate">{section.title}</span>
        <span className="text-xs text-gray-400 shrink-0">{completedCount}/{section.lessons?.length || 0}</span>
      </button>
      {open && (
        <ul className="ml-6 mt-1 space-y-0.5">
          {section.lessons?.map((lesson) => {
            const active = lesson._id === activeLesson?._id;
            const done = completedLessons.includes(lesson._id);
            return (
              <li key={lesson._id}>
                <button
                  onClick={() => onSelect(lesson)}
                  className={`w-full flex items-center gap-2 text-left py-2 px-2 rounded-lg transition-colors text-sm ${
                    active
                      ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-medium"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {done
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    : <LessonTypeIcon type={lesson.type} className="w-3.5 h-3.5 shrink-0" />
                  }
                  <span className="truncate">{lesson.title}</span>
                  {lesson.duration > 0 && (
                    <span className="text-xs text-gray-400 shrink-0 ml-auto">
                      {Math.round(lesson.duration / 60)}m
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
