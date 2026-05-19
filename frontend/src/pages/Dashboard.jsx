import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, TrendingUp, Award } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "../components/Skeleton";
import api from "../api/axios";

export default function Dashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/enrollments")
      .then((res) => setEnrollments(res.data.enrollments))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const avgProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((a, e) => a + (e.progress || 0), 0) / enrollments.length)
      : 0;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-gray-500 mb-10">Track your learning progress</p>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {[
            { icon: BookOpen, label: "Enrolled", value: enrollments.length },
            { icon: TrendingUp, label: "Avg Progress", value: `${avgProgress}%` },
            { icon: Award, label: "Completed", value: enrollments.filter((e) => e.status === "completed").length },
          ].map(({ icon: Icon, label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex items-center gap-4"
            >
              <Icon className="w-10 h-10 text-brand-500" />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-gray-500 text-sm">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-6">My Courses</h2>
        {enrollments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t enrolled in any courses yet.</p>
            <Link to="/courses" className="btn-primary inline-block">Browse Courses</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((e) => (
              <Link key={e._id} to={`/courses/${e.course?.slug}`} className="glass-card p-6 block hover:shadow-glow transition-shadow">
                <img src={e.course?.thumbnail} alt="" className="w-full h-32 object-cover rounded-lg mb-4" />
                <h3 className="font-semibold mb-2">{e.course?.title}</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${e.progress || 0}%` }} />
                </div>
                <p className="text-sm text-gray-500">{e.progress || 0}% complete</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
