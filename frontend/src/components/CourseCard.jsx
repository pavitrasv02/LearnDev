import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Users, Star } from "lucide-react";

export default function CourseCard({ course, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <Link to={`/courses/${course.slug}`} className="block glass-card overflow-hidden h-full">
        <div className="relative overflow-hidden aspect-video">
          <img
            src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600"}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full glass">
            {course.category}
          </span>
          {course.isFree && (
            <span className="absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full bg-green-500 text-white">
              FREE
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-bold text-lg mb-2 group-hover:text-brand-500 transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{course.shortDescription || course.description}</p>
          <p className="text-sm text-gray-500 mb-3">by {course.instructor}</p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {course.rating}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration}</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {(course.studentsCount / 1000).toFixed(1)}k</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-lg font-bold gradient-text">
              {course.isFree ? "Free" : `$${course.price}`}
            </span>
            <span className="text-xs px-2 py-1 rounded-lg bg-brand-500/10 text-brand-500">{course.level}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
