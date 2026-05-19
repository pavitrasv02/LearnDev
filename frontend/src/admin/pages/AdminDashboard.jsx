import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, GraduationCap, DollarSign, Activity, Database, Server } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import { adminApi } from "../../api/adminApi";
import StatCard from "../components/StatCard";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await adminApi.getStats();
      setStats(data.stats);
    } catch {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl skeleton bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} sub="Registered accounts" delay={0} />
        <StatCard icon={BookOpen} label="Total Courses" value={stats?.totalCourses ?? 0} sub="Published & draft" delay={0.1} />
        <StatCard icon={GraduationCap} label="Enrollments" value={stats?.totalEnrollments ?? 0} sub={`${stats?.activeEnrollments ?? 0} active`} delay={0.2} />
        <StatCard icon={DollarSign} label="Revenue Potential" value={`$${stats?.revenue?.potential ?? 0}`} sub={`Avg $${stats?.revenue?.averageCoursePrice ?? 0}/course`} delay={0.3} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Enrollment Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats?.enrollmentsByMonth || []}>
              <defs>
                <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#colorEnroll)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Courses by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats?.coursesByCategory || []}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ category, count }) => `${category}: ${count}`}
              >
                {(stats?.coursesByCategory || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-400" /> Recent Enrollments
          </h3>
          <div className="space-y-3">
            {(stats?.recentActivity?.enrollments || []).map((e) => (
              <div key={e._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{e.user?.name}</p>
                  <p className="text-xs text-gray-500">enrolled in {e.course?.title}</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
            {!stats?.recentActivity?.enrollments?.length && (
              <p className="text-gray-500 text-sm text-center py-8">No recent enrollments</p>
            )}
          </div>
        </motion.div>

        <motion.div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3">
            {[
              { icon: Database, label: "Database", status: stats?.system?.database },
              { icon: Server, label: "API", status: stats?.system?.api },
              { icon: Activity, label: "Cache", status: stats?.system?.cache },
            ].map(({ icon: Icon, label, status }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-brand-400" />
                  <span className="text-sm text-gray-300">{label}</span>
                </div>
                <span className="flex items-center gap-2 text-xs text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
