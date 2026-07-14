import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, BookOpen } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-9xl font-black gradient-text mb-4 leading-none">404</div>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link to="/" className="btn-primary flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Home
          </Link>
          <Link to="/courses" className="btn-secondary flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" /> Courses
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
