import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Eye, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import CourseForm from "../components/CourseForm";
import EmptyState from "../components/EmptyState";

const CATEGORIES = ["All", "Programming", "DevOps", "Cloud", "Data Science", "Design", "Business"];

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getCourses({ search, category, page, limit: 10 });
      setCourses(data.courses);
      setPages(data.pages);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchCourses, 300);
    return () => clearTimeout(t);
  }, [search, category, page]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateCourse(editing._id, formData);
        toast.success("Course updated");
      } else {
        await adminApi.createCourse(formData);
        toast.success("Course created");
      }
      setModalOpen(false);
      setEditing(null);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteCourse(deleteTarget._id);
      toast.success("Course deleted");
      setDeleteTarget(null);
      fetchCourses();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm outline-none"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2 justify-center"
        >
          <Plus className="w-5 h-5" /> Add Course
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-gray-800 overflow-hidden bg-gray-900/40"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4 font-medium">Course</th>
                <th className="p-4 font-medium hidden md:table-cell">Category</th>
                <th className="p-4 font-medium hidden sm:table-cell">Price</th>
                <th className="p-4 font-medium hidden lg:table-cell">Students</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td colSpan={6} className="p-4"><div className="h-10 bg-gray-800 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={BookOpen}
                      title="No courses found"
                      description="Create your first course or adjust filters"
                      action={<button onClick={() => setModalOpen(true)} className="btn-primary">Add Course</button>}
                    />
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={course.thumbnail || "https://via.placeholder.com/48"} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-white">{course.title}</p>
                          <p className="text-xs text-gray-500">{course.instructor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-gray-400">{course.category}</td>
                    <td className="p-4 hidden sm:table-cell text-gray-300">{course.isFree ? "Free" : `$${course.price}`}</td>
                    <td className="p-4 hidden lg:table-cell text-gray-400">{course.studentsCount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs ${course.published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                        {course.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/courses/${course.slug}`} target="_blank" className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => { setEditing(course); setModalOpen(true); }} className="p-2 rounded-lg hover:bg-brand-500/20 text-brand-400">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(course)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-800">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-lg text-sm ${page === p ? "bg-brand-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Edit Course" : "Add Course"} size="lg">
        <CourseForm course={editing} onSubmit={handleSave} loading={saving} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove all enrollments.`}
        loading={deleting}
      />
    </div>
  );
}
