import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Star, AlertCircle, Award, Users, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../../api/adminApi";
import api from "../../api/axios";
import StatCard from "../components/StatCard";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

function InsightCard({ icon: Icon, label, value, sub, trend, color = "brand" }) {
  const colors = {
    brand:  "border-brand-500/30  bg-brand-500/5",
    green:  "border-green-500/30  bg-green-500/5",
    red:    "border-red-500/30    bg-red-500/5",
    amber:  "border-amber-500/30  bg-amber-500/5",
    violet: "border-violet-500/30 bg-violet-500/5",
  };
  const iconColors = {
    brand:  "text-brand-500",
    green:  "text-green-500",
    red:    "text-red-500",
    amber:  "text-amber-500",
    violet: "text-violet-500",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 ${colors[color]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-400">{label}</p>
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1 truncate">{sub}</p>}
    </motion.div>
  );
}

export default function AdminInsights() {
  const [stats, setStats]         = useState(null);
  const [insights, setInsights]   = useState(null);
  const [complaints, setComplaints] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, insightsRes, complaintRes] = await Promise.all([
          adminApi.getStats(),
          api.get("/admin/insights").catch(() => ({ data: { insights: null } })),
          api.get("/admin/complaints?limit=1").catch(() => ({ data: { stats: {} } })),
        ]);
        setStats(statsRes.data.stats);
        setInsights(insightsRes.data.insights);
        setComplaints(complaintRes.data.stats || {});
      } catch {
        toast.error("Failed to load insights");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array(8).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-800 animate-pulse" />)}
      </div>
    );
  }

  // Use admin stats as the base (always available)
  const enrollmentData = stats?.enrollmentsByMonth || [];
  const categoryData   = stats?.coursesByCategory  || [];
  const totalEnrollments = stats?.totalEnrollments || 0;
  const totalCourses   = stats?.totalCourses || 0;
  const totalUsers     = stats?.totalUsers || 0;

  const pendingComplaints = (complaints?.submitted || 0) + (complaints?.under_review || 0);

  return (
    <div className="space-y-8">
      {/* ── Overview stats ──────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Users}    label="Total Users"    value={totalUsers}       sub="All registered" delay={0} />
        <StatCard icon={BookOpen} label="Total Courses"  value={totalCourses}     sub="Published & draft" delay={0.1} />
        <StatCard icon={TrendingUp} label="Enrollments"  value={totalEnrollments} sub={`${stats?.activeEnrollments || 0} active`} delay={0.2} />
        <StatCard icon={Award}    label="Completion Rate"
          value={totalEnrollments > 0 ? `${Math.round(((stats?.totalEnrollments - stats?.activeEnrollments) / totalEnrollments) * 100)}%` : "0%"}
          sub="Completed vs total" delay={0.3}
        />
      </div>

      {/* ── Complaint overview ───────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <InsightCard icon={AlertCircle} label="Pending Tickets"  value={pendingComplaints}                color="amber" />
        <InsightCard icon={AlertCircle} label="Resolved"         value={complaints?.resolved || 0}        color="green" />
        <InsightCard icon={AlertCircle} label="Closed"           value={complaints?.closed || 0}          color="violet" />
        <InsightCard icon={AlertCircle} label="Under Review"     value={complaints?.under_review || 0}    color="brand" />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Enrollments</h3>
          {enrollmentData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">No enrollment data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Category distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Courses by Category</h3>
          {categoryData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                <YAxis dataKey="category" type="category" width={90} stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* ── Enrollment by category pie ───────────────────────────────────── */}
      {categoryData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={90}
                label={({ category, count }) => `${category}: ${count}`} labelLine={false}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Recent activity ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Enrollments</h3>
        {(stats?.recentActivity?.enrollments || []).length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {(stats?.recentActivity?.enrollments || []).map((e) => (
              <div key={e._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{e.user?.name}</p>
                  <p className="text-xs text-gray-500">enrolled in {e.course?.title}</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
