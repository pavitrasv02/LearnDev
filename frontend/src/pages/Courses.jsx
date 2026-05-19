import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import CourseCard from "../components/CourseCard";
import { CourseCardSkeleton } from "../components/Skeleton";
import api from "../api/axios";

const categories = ["All", "Programming", "DevOps", "Cloud", "Data Science"];
const levels = ["All", "Beginner", "Intermediate", "Advanced"];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category !== "All") params.set("category", category);
    if (level !== "All") params.set("level", level);

    const timer = setTimeout(() => {
      api
        .get(`/courses?${params}`)
        .then((res) => setCourses(res.data.courses))
        .catch(() => setCourses([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, level]);

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-2"
        >
          Explore <span className="gradient-text">Courses</span>
        </motion.h1>
        <p className="text-gray-500 mb-8">Find your next skill from our curated catalog</p>

        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl glass-card border-0 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-brand-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === "All" ? "Category" : c}</option>
              ))}
            </select>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="px-4 py-3 rounded-xl glass-card outline-none focus:ring-2 focus:ring-brand-500"
            >
              {levels.map((l) => (
                <option key={l} value={l}>{l === "All" ? "Level" : l}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No courses found. Try different filters.</p>
          </div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c, i) => (
              <CourseCard key={c._id} course={c} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
