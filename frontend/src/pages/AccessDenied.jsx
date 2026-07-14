import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";

export default function AccessDenied() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="inline-flex p-6 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <ShieldOff className="w-14 h-14 text-red-500" />
        </div>
        <div className="text-7xl font-black text-red-500 mb-3 leading-none">403</div>
        <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          You don't have permission to view this page. If you think this is a mistake, please contact support.
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
        </div>
      </motion.div>
    </div>
  );
}
