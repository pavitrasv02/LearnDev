import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-hero-dark dark:opacity-100 opacity-0" />
      <div className="absolute inset-0 bg-hero-light dark:opacity-0 opacity-100" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-pink/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 section-padding text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-brand-400" />
            Production-Ready DevOps Learning Platform
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-gray-900 dark:text-white">Learn Skills</span>
            <br />
            <span className="gradient-text">From Anywhere</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
            Master DevOps, Cloud, and Programming with premium courses — powered by Docker, Kubernetes, and enterprise-grade infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses" className="btn-primary inline-flex items-center justify-center gap-2">
              Explore Courses <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/signup" className="btn-secondary inline-flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> Start Free
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {["Docker", "Kubernetes", "AWS", "React"].map((tech, i) => (
            <div key={tech} className="glass-card p-4 text-center font-semibold text-sm hover:scale-105 transition-transform">
              {tech}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
