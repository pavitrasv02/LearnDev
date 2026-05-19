import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import { adminApi } from "../../api/adminApi";
import StatCard from "../components/StatCard";
import { GraduationCap, Users, TrendingUp } from "lucide-react";

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 15 };
        if (statusFilter) params.status = statusFilter;
        const { data } = await adminApi.getEnrollments(params);
        setEnrollments(data.enrollments);
        setCourseStats(data.courseStats || []);
        setPages(data.pages);
      } catch {
        toast.error("Failed to load enrollments");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, statusFilter]);

  const activeCount = enrollments.filter((e) => e.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-6">
        <StatCard icon={GraduationCap} label="Total Enrollments" value={enrollments.length} sub="On this page" />
        <StatCard icon={Users} label="Active Students" value={activeCount} />
        <StatCard icon={TrendingUp} label="Courses Tracked" value={courseStats.length} />
      </div>

      <motion.div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Course-wise Enrollments</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={courseStats} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis dataKey="courseTitle" type="category" width={140} stroke="#9ca3af" fontSize={11} />
            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="flex gap-3">
        {["", "active", "completed", "dropped"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm capitalize ${statusFilter === s ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            {s || "all"}
          </button>
        ))}
      </div>

      <motion.div className="rounded-2xl border border-gray-800 overflow-hidden bg-gray-900/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="p-4">Student</th>
              <th className="p-4">Course</th>
              <th className="p-4 hidden sm:table-cell">Progress</th>
              <th className="p-4">Status</th>
              <th className="p-4 hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={5} className="p-4"><div className="h-10 bg-gray-800 rounded animate-pulse" /></td></tr>
              ))
            ) : (
              enrollments.map((e) => (
                <tr key={e._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4">
                    <p className="text-white font-medium">{e.user?.name}</p>
                    <p className="text-xs text-gray-500">{e.user?.email}</p>
                  </td>
                  <td className="p-4 text-gray-300">{e.course?.title}</td>
                  <td className="p-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full max-w-[100px]">
                        <div className="h-2 bg-brand-500 rounded-full" style={{ width: `${e.progress}%` }} />
                      </div>
                      <span className="text-gray-500">{e.progress}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs capitalize ${
                      e.status === "completed" ? "bg-green-500/20 text-green-400" :
                      e.status === "active" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"
                    }`}>{e.status}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell text-gray-500">{new Date(e.enrolledAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-800">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded-lg text-sm ${page === p ? "bg-brand-600 text-white" : "text-gray-400"}`}>{p}</button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
