import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BookOpen, Users, Award, Layers } from "lucide-react";
import api from "../api/axios";

function Counter({ end, duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function Stats() {
  const [stats, setStats] = useState({ totalCourses: 8, totalStudents: 12500, totalInstructors: 48, satisfaction: 98 });

  useEffect(() => {
    api.get("/courses/stats").then((res) => setStats(res.data.stats)).catch(() => {});
  }, []);

  const items = [
    { icon: BookOpen, label: "Courses", value: stats.totalCourses },
    { icon: Users, label: "Students", value: stats.totalStudents },
    { icon: Award, label: "Satisfaction", value: stats.satisfaction, suffix: "%" },
    { icon: Layers, label: "Categories", value: stats.categories || 6 },
  ];

  return (
    <section className="section-padding">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(({ icon: Icon, label, value, suffix = "" }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 text-center hover:shadow-glow transition-shadow"
          >
            <Icon className="w-10 h-10 mx-auto mb-4 text-brand-500" />
            <p className="text-3xl font-bold gradient-text">
              <Counter end={value} />
              {suffix}
            </p>
            <p className="text-gray-500 mt-2">{label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
