import { useState, useEffect } from "react";

const CATEGORIES = ["Programming", "DevOps", "Cloud", "Data Science", "Design", "Business"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  shortDescription: "",
  instructor: "",
  category: "Programming",
  level: "Beginner",
  price: 0,
  isFree: false,
  thumbnail: "",
  duration: "10 hours",
  lessons: 20,
  rating: 4.5,
  featured: false,
  published: true,
};

export default function CourseForm({ course, onSubmit, loading }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || "",
        slug: course.slug || "",
        description: course.description || "",
        shortDescription: course.shortDescription || "",
        instructor: course.instructor || "",
        category: course.category || "Programming",
        level: course.level || "Beginner",
        price: course.price || 0,
        isFree: course.isFree || false,
        thumbnail: course.thumbnail || "",
        duration: course.duration || "10 hours",
        lessons: course.lessons || 20,
        rating: course.rating || 4.5,
        featured: course.featured || false,
        published: course.published !== false,
      });
    } else {
      setForm(emptyForm);
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm((f) => ({
      ...f,
      title,
      slug: course ? f.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    }));
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Title *</label>
          <input name="title" value={form.title} onChange={handleTitleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Slug *</label>
          <input name="slug" value={form.slug} onChange={handleChange} required className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Description *</label>
        <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Short Description</label>
        <input name="shortDescription" value={form.shortDescription} onChange={handleChange} className={inputClass} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Instructor *</label>
          <input name="instructor" value={form.instructor} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Image URL</label>
          <input name="thumbnail" value={form.thumbnail} onChange={handleChange} placeholder="https://..." className={inputClass} />
          {form.thumbnail && (
            <img src={form.thumbnail} alt="" className="mt-2 h-24 w-full object-cover rounded-lg" onError={(e) => (e.target.style.display = "none")} />
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Level</label>
          <select name="level" value={form.level} onChange={handleChange} className={inputClass}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Price ($)</label>
          <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} disabled={form.isFree} className={inputClass} />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Duration</label>
          <input name="duration" value={form.duration} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Lessons</label>
          <input name="lessons" type="number" min="1" value={form.lessons} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Rating</label>
          <input name="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={handleChange} className={inputClass} />
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" name="isFree" checked={form.isFree} onChange={handleChange} /> Free course
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" name="published" checked={form.published} onChange={handleChange} /> Published
        </label>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? "Saving..." : course ? "Update Course" : "Create Course"}
      </button>
    </form>
  );
}
