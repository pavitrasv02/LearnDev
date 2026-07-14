import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Play, FileText, BookOpen, Download, Eye,
  GripVertical, Globe, GlobeLock, Loader, CheckCircle,
  Clock, Layers
} from "lucide-react";
import toast from "react-hot-toast";
import { courseApi } from "../../api/courseApi";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import LessonForm from "../components/LessonForm";

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const TYPE_META = {
  video:    { icon: Play,     color: "text-brand-500",  bg: "bg-brand-500/10" },
  pdf:      { icon: FileText,  color: "text-amber-500",  bg: "bg-amber-500/10" },
  notes:    { icon: BookOpen,  color: "text-violet-500", bg: "bg-violet-500/10" },
  resource: { icon: Download,  color: "text-green-500",  bg: "bg-green-500/10" },
};

function LessonTypeIcon({ type, size = "w-4 h-4" }) {
  const meta = TYPE_META[type] || TYPE_META.video;
  const Icon = meta.icon;
  return <span className={`inline-flex p-1.5 rounded-lg ${meta.bg}`}><Icon className={`${size} ${meta.color}`} /></span>;
}

// ── Inline editable section title ─────────────────────────────────────────
function SectionTitle({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const commit = () => {
    setEditing(false);
    if (val.trim() && val !== value) onSave(val.trim());
    else setVal(value);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setVal(value); } }}
        className="bg-gray-800 text-white text-sm font-semibold rounded-lg px-3 py-1.5 outline-none ring-2 ring-brand-500 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      className="font-semibold text-white group-hover:text-brand-300 transition-colors text-left flex items-center gap-2 hover:underline decoration-dotted"
      title="Click to rename"
    >
      {value}
      <Pencil className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100" />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function CourseBuilder() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Section state
  const [expandedSections, setExpandedSections] = useState({});
  const [addingSectionTitle, setAddingSectionTitle] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState(null);
  const [deletingSection, setDeletingSection] = useState(false);

  // Lesson state
  const [lessonModal, setLessonModal] = useState({ open: false, sectionId: null, lesson: null });
  const [savingLesson, setSavingLesson] = useState(false);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState(null); // {lesson, sectionId}
  const [deletingLesson, setDeletingLesson] = useState(false);

  // ── Fetch course + sections ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      // courseId is a MongoDB ObjectId — use the dedicated by-id endpoint
      const courseRes = await courseApi.getCourseById(courseId);
      const courseData = courseRes.data.course;
      setCourse(courseData);

      const secRes = await courseApi.getSections(courseData._id);
      const sects = secRes.data.sections || [];
      setSections(sects);

      // Expand first section by default
      if (sects.length > 0) {
        setExpandedSections({ [sects[0]._id]: true });
      }
    } catch (err) {
      toast.error("Failed to load course");
      navigate("/admin/courses");
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length || 0), 0);
  const totalDuration = sections.reduce(
    (sum, s) => sum + (s.lessons || []).reduce((ls, l) => ls + (l.duration || 0), 0), 0
  );

  // ── Section helpers ──────────────────────────────────────────────────────
  const toggleSection = (id) =>
    setExpandedSections((p) => ({ ...p, [id]: !p[id] }));

  const handleAddSection = async () => {
    if (!addingSectionTitle.trim()) return;
    setAddingSection(true);
    try {
      const res = await courseApi.createSection(course._id, { title: addingSectionTitle.trim() });
      const newSection = { ...res.data.section, lessons: [] };
      setSections((p) => [...p, newSection]);
      setExpandedSections((p) => ({ ...p, [newSection._id]: true }));
      setAddingSectionTitle("");
      setShowAddSection(false);
      toast.success("Section added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add section");
    } finally {
      setAddingSection(false);
    }
  };

  const handleRenameSection = async (sectionId, newTitle) => {
    try {
      await courseApi.updateSection(course._id, sectionId, { title: newTitle });
      setSections((p) => p.map((s) => s._id === sectionId ? { ...s, title: newTitle } : s));
      toast.success("Section renamed");
    } catch {
      toast.error("Failed to rename section");
    }
  };

  const handleMoveSection = async (index, direction) => {
    const newSections = [...sections];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSections.length) return;
    [newSections[index], newSections[swapIdx]] = [newSections[swapIdx], newSections[index]];
    setSections(newSections);
    try {
      await courseApi.reorderSections(course._id, newSections.map((s) => s._id));
    } catch {
      toast.error("Failed to reorder — refreshing");
      fetchData();
    }
  };

  const handleDeleteSection = async () => {
    setDeletingSection(true);
    try {
      await courseApi.deleteSection(course._id, deleteSectionTarget._id);
      setSections((p) => p.filter((s) => s._id !== deleteSectionTarget._id));
      setDeleteSectionTarget(null);
      toast.success("Section deleted");
    } catch {
      toast.error("Failed to delete section");
    } finally {
      setDeletingSection(false);
    }
  };

  // ── Lesson helpers ────────────────────────────────────────────────────────
  const openAddLesson = (sectionId) =>
    setLessonModal({ open: true, sectionId, lesson: null });

  const openEditLesson = (sectionId, lesson) =>
    setLessonModal({ open: true, sectionId, lesson });

  const handleSaveLesson = async (formData) => {
    setSavingLesson(true);
    try {
      const { sectionId, lesson } = lessonModal;
      if (lesson) {
        // Update
        const res = await courseApi.updateLesson(course._id, sectionId, lesson._id, formData);
        setSections((p) =>
          p.map((s) =>
            s._id === sectionId
              ? { ...s, lessons: s.lessons.map((l) => l._id === lesson._id ? res.data.lesson : l) }
              : s
          )
        );
        toast.success("Lesson updated");
      } else {
        // Create
        const res = await courseApi.createLesson(course._id, sectionId, formData);
        setSections((p) =>
          p.map((s) =>
            s._id === sectionId
              ? { ...s, lessons: [...(s.lessons || []), res.data.lesson] }
              : s
          )
        );
        toast.success("Lesson added");
      }
      setLessonModal({ open: false, sectionId: null, lesson: null });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save lesson");
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async () => {
    setDeletingLesson(true);
    try {
      const { lesson, sectionId } = deleteLessonTarget;
      await courseApi.deleteLesson(course._id, sectionId, lesson._id);
      setSections((p) =>
        p.map((s) =>
          s._id === sectionId
            ? { ...s, lessons: s.lessons.filter((l) => l._id !== lesson._id) }
            : s
        )
      );
      setDeleteLessonTarget(null);
      toast.success("Lesson deleted");
    } catch {
      toast.error("Failed to delete lesson");
    } finally {
      setDeletingLesson(false);
    }
  };

  // ── Publish toggle ────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await courseApi.publishCourse(course._id);
      setCourse((p) => ({ ...p, published: res.data.published }));
      toast.success(res.data.published ? "Course published!" : "Course unpublished");
    } catch {
      toast.error("Failed to update publish status");
    } finally {
      setPublishing(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading course builder…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin/courses"
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Course Builder</p>
            <h1 className="text-xl font-bold text-white truncate">{course?.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Stats pills */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800">
              <Layers className="w-3.5 h-3.5" /> {sections.length} sections
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800">
              <BookOpen className="w-3.5 h-3.5" /> {totalLessons} lessons
            </span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800">
                <Clock className="w-3.5 h-3.5" /> {Math.round(totalDuration / 60)}m
              </span>
            )}
          </div>

          {/* Preview link */}
          <Link
            to={`/courses/${course?.slug}`}
            target="_blank"
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Preview course page"
          >
            <Eye className="w-5 h-5" />
          </Link>

          {/* Publish toggle */}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              course?.published
                ? "bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30"
                : "btn-primary"
            }`}
          >
            {publishing
              ? <Loader className="w-4 h-4 animate-spin" />
              : course?.published
                ? <><Globe className="w-4 h-4" /> Published</>
                : <><GlobeLock className="w-4 h-4" /> Publish</>
            }
          </button>
        </div>
      </div>

      {/* ── Curriculum Builder ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {sections.length === 0 && !showAddSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border-2 border-dashed border-gray-700 p-12 text-center"
          >
            <Layers className="w-14 h-14 mx-auto mb-4 text-gray-600" />
            <h3 className="text-white font-semibold text-lg mb-2">No sections yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Start building your course by adding the first section. Each section groups related lessons together.
            </p>
            <button
              onClick={() => setShowAddSection(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add First Section
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {sections.map((section, si) => {
            const isExpanded = !!expandedSections[section._id];
            const sectionDuration = (section.lessons || []).reduce((s, l) => s + (l.duration || 0), 0);

            return (
              <motion.div
                key={section._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden"
              >
                {/* Section header */}
                <div
                  className="group flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleSection(section._id)}
                >
                  {/* Drag handle (visual only) */}
                  <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />

                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMoveSection(si, "up")}
                      disabled={si === 0}
                      className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white disabled:opacity-20"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(si, "down")}
                      disabled={si === sections.length - 1}
                      className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white disabled:opacity-20"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Section index */}
                  <span className="text-xs font-bold text-brand-500 shrink-0 w-6 text-center">
                    S{si + 1}
                  </span>

                  {/* Inline rename title */}
                  <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <SectionTitle
                      value={section.title}
                      onSave={(t) => handleRenameSection(section._id, t)}
                    />
                  </div>

                  {/* Right meta + actions */}
                  <div className="flex items-center gap-2 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {section.lessons?.length || 0} lessons
                      {sectionDuration > 0 && ` · ${Math.round(sectionDuration / 60)}m`}
                    </span>
                    <button
                      onClick={() => openAddLesson(section._id)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Lesson
                    </button>
                    <button
                      onClick={() => setDeleteSectionTarget(section)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-gray-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Lessons list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-800"
                    >
                      {(!section.lessons || section.lessons.length === 0) ? (
                        <div className="px-5 py-8 text-center">
                          <p className="text-gray-500 text-sm mb-3">No lessons in this section yet.</p>
                          <button
                            onClick={() => openAddLesson(section._id)}
                            className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium"
                          >
                            <Plus className="w-4 h-4" /> Add first lesson
                          </button>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-800/60">
                          {section.lessons.map((lesson, li) => (
                            <li
                              key={lesson._id}
                              className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors group"
                            >
                              <span className="text-xs text-gray-600 w-5 text-right shrink-0">{li + 1}</span>
                              <LessonTypeIcon type={lesson.type} />
                              <span className="flex-1 min-w-0">
                                <span className="text-sm text-white font-medium truncate block">
                                  {lesson.title}
                                </span>
                                {lesson.description && (
                                  <span className="text-xs text-gray-500 truncate block">{lesson.description}</span>
                                )}
                              </span>
                              {lesson.duration > 0 && (
                                <span className="text-xs text-gray-500 shrink-0 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {fmtDuration(lesson.duration)}
                                </span>
                              )}
                              {lesson.isPreview && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 shrink-0 hidden sm:block">
                                  Preview
                                </span>
                              )}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => openEditLesson(section._id, lesson)}
                                  className="p-1.5 rounded-lg hover:bg-brand-500/20 text-gray-400 hover:text-brand-400 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteLessonTarget({ lesson, sectionId: section._id })}
                                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* ── Add section input ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showAddSection ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border-2 border-brand-500/40 bg-gray-900/60 p-5"
            >
              <p className="text-sm font-semibold text-white mb-3">New Section</p>
              <div className="flex gap-3">
                <input
                  autoFocus
                  value={addingSectionTitle}
                  onChange={(e) => setAddingSectionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSection();
                    if (e.key === "Escape") { setShowAddSection(false); setAddingSectionTitle(""); }
                  }}
                  placeholder="e.g. Introduction to Docker"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-500"
                />
                <button
                  onClick={handleAddSection}
                  disabled={!addingSectionTitle.trim() || addingSection}
                  className="btn-primary px-5 flex items-center gap-2 disabled:opacity-50"
                >
                  {addingSection
                    ? <Loader className="w-4 h-4 animate-spin" />
                    : <CheckCircle className="w-4 h-4" />
                  }
                  Add
                </button>
                <button
                  onClick={() => { setShowAddSection(false); setAddingSectionTitle(""); }}
                  className="px-4 py-2.5 rounded-xl text-gray-400 hover:bg-white/10 text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAddSection(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Section
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Lesson modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={lessonModal.open}
        onClose={() => setLessonModal({ open: false, sectionId: null, lesson: null })}
        title={lessonModal.lesson ? "Edit Lesson" : "Add Lesson"}
        size="lg"
      >
        <LessonForm
          lesson={lessonModal.lesson}
          onSubmit={handleSaveLesson}
          loading={savingLesson}
          onCancel={() => setLessonModal({ open: false, sectionId: null, lesson: null })}
        />
      </Modal>

      {/* ── Delete section confirm ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteSectionTarget}
        onClose={() => setDeleteSectionTarget(null)}
        onConfirm={handleDeleteSection}
        title="Delete Section"
        message={`Delete section "${deleteSectionTarget?.title}" and all ${deleteSectionTarget?.lessons?.length || 0} lesson(s) inside it? This cannot be undone.`}
        confirmText="Delete Section"
        loading={deletingSection}
      />

      {/* ── Delete lesson confirm ─────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteLessonTarget}
        onClose={() => setDeleteLessonTarget(null)}
        onConfirm={handleDeleteLesson}
        title="Delete Lesson"
        message={`Delete "${deleteLessonTarget?.lesson?.title}"? This cannot be undone.`}
        confirmText="Delete Lesson"
        loading={deletingLesson}
      />
    </div>
  );
}
