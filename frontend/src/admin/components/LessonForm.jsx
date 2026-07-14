import { useState, useEffect } from "react";
import { Play, FileText, BookOpen, Download, Eye, EyeOff } from "lucide-react";

const LESSON_TYPES = [
  { value: "video",    label: "Video",    icon: Play,     color: "text-brand-500",  desc: "YouTube URL or direct video link" },
  { value: "pdf",      label: "PDF",      icon: FileText,  color: "text-amber-500",  desc: "PDF document URL" },
  { value: "notes",    label: "Notes",    icon: BookOpen,  color: "text-violet-500", desc: "Markdown text notes" },
  { value: "resource", label: "Resource", icon: Download,  color: "text-green-500",  desc: "Downloadable file or external link" },
];

const empty = {
  title: "",
  description: "",
  type: "video",
  content: "",
  resourceUrl: "",
  duration: 0,
  isPreview: false,
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-500";

export default function LessonForm({ lesson, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lesson) {
      setForm({
        title:       lesson.title       || "",
        description: lesson.description || "",
        type:        lesson.type        || "video",
        content:     lesson.content     || "",
        resourceUrl: lesson.resourceUrl || "",
        duration:    lesson.duration    || 0,
        isPreview:   lesson.isPreview   || false,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [lesson]);

  const set = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked
      : e.target.type === "number" ? Number(e.target.value)
      : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (form.type === "video" && !form.content.trim()) e.content = "Video URL is required";
    if (form.type === "pdf" && !form.content.trim()) e.content = "PDF URL is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  // Duration display helpers
  const durationMins = Math.floor((form.duration || 0) / 60);
  const durationSecs = (form.duration || 0) % 60;

  const selectedType = LESSON_TYPES.find((t) => t.value === form.type);
  const TypeIcon = selectedType?.icon || Play;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Type selector */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Lesson Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LESSON_TYPES.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: value, content: "" }))}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center
                ${form.type === value
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-gray-700 hover:border-gray-600"
                }`}
            >
              <Icon className={`w-5 h-5 ${form.type === value ? color : "text-gray-500"}`} />
              <span className={`text-xs font-semibold ${form.type === value ? "text-white" : "text-gray-400"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">{selectedType?.desc}</p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Title *</label>
        <input
          value={form.title}
          onChange={set("title")}
          placeholder="e.g. Introduction to Express.js"
          className={`${inputCls} ${errors.title ? "ring-2 ring-red-500 border-red-500" : ""}`}
        />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={set("description")}
          placeholder="Brief description of what this lesson covers..."
          rows={2}
          className={inputCls}
        />
      </div>

      {/* Content — changes based on type */}
      {form.type === "video" && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Video URL *</label>
          <input
            value={form.content}
            onChange={set("content")}
            placeholder="https://youtube.com/watch?v=... or direct video URL"
            className={`${inputCls} ${errors.content ? "ring-2 ring-red-500 border-red-500" : ""}`}
          />
          {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
          {/* Duration row */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="0"
                value={durationMins}
                onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) * 60 + durationSecs }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Seconds</label>
              <input
                type="number"
                min="0"
                max="59"
                value={durationSecs}
                onChange={(e) => setForm((f) => ({ ...f, duration: durationMins * 60 + Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {form.type === "pdf" && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">PDF URL *</label>
          <input
            value={form.content}
            onChange={set("content")}
            placeholder="https://example.com/document.pdf"
            className={`${inputCls} ${errors.content ? "ring-2 ring-red-500 border-red-500" : ""}`}
          />
          {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
        </div>
      )}

      {form.type === "notes" && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Markdown Notes</label>
          <textarea
            value={form.content}
            onChange={set("content")}
            placeholder={"# Lesson Notes\n\nWrite your notes in **Markdown** format...\n\n```js\nconst x = 1;\n```"}
            rows={10}
            className={`${inputCls} font-mono text-xs leading-relaxed`}
          />
          <p className="text-xs text-gray-500 mt-1">Supports Markdown: headers, bold, code blocks, lists</p>
        </div>
      )}

      {form.type === "resource" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description / Link Text</label>
            <input
              value={form.content}
              onChange={set("content")}
              placeholder="e.g. GitHub repository, reference docs, exercise file..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Resource URL</label>
            <input
              value={form.resourceUrl}
              onChange={set("resourceUrl")}
              placeholder="https://github.com/... or https://drive.google.com/..."
              className={inputCls}
            />
          </div>
        </div>
      )}

      {/* Preview toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none group">
        <div className="relative">
          <input
            type="checkbox"
            checked={form.isPreview}
            onChange={set("isPreview")}
            className="sr-only"
          />
          <div className={`w-10 h-5 rounded-full transition-colors ${form.isPreview ? "bg-brand-600" : "bg-gray-600"}`} />
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.isPreview ? "translate-x-5" : ""}`} />
        </div>
        <div>
          <span className="text-sm font-medium text-white flex items-center gap-1.5">
            {form.isPreview ? <Eye className="w-4 h-4 text-brand-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
            Free Preview
          </span>
          <p className="text-xs text-gray-500">Non-enrolled visitors can view this lesson</p>
        </div>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            : lesson ? "Update Lesson" : "Add Lesson"
          }
        </button>
      </div>
    </form>
  );
}
