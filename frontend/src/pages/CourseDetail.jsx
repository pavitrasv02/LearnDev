import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Users, Star, BookOpen, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageLoader } from "../components/Skeleton";
import api from "../api/axios";

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    api
      .get(`/courses/${slug}`)
      .then((res) => setCourse(res.data.course))
      .catch(() => navigate("/courses"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setEnrolling(true);
    try {
      await api.post(`/enrollments/${course._id}`);
      toast("Successfully enrolled!", "success");
      navigate("/dashboard");
    } catch (err) {
      toast(err.response?.data?.message || "Enrollment failed", "error");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!course) return null;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full aspect-video object-cover rounded-2xl mb-6"
              />
              <span className="text-sm px-3 py-1 rounded-full glass">{course.category}</span>
              <h1 className="text-4xl font-bold mt-4 mb-4">{course.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">{course.description}</p>
              <div className="flex flex-wrap gap-6 text-gray-500 mb-8">
                <span className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> {course.rating} rating</span>
                <span className="flex items-center gap-2"><Users className="w-5 h-5" /> {course.studentsCount?.toLocaleString()} students</span>
                <span className="flex items-center gap-2"><Clock className="w-5 h-5" /> {course.duration}</span>
                <span className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> {course.lessons} lessons</span>
              </div>
              {course.curriculum?.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Curriculum</h2>
                  <div className="space-y-4">
                    {course.curriculum.map((section, i) => (
                      <motion.div key={i} className="glass-card p-5">
                        <h3 className="font-semibold mb-3">{section.title}</h3>
                        <ul className="space-y-2">
                          {section.lessons?.map((lesson, j) => (
                            <li key={j} className="flex items-center gap-2 text-sm text-gray-500">
                              <CheckCircle className="w-4 h-4 text-brand-500" />
                              {lesson.title} — {lesson.duration}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          <div>
            <div className="glass-card p-8 sticky top-24">
              <p className="text-3xl font-bold gradient-text mb-2">
                {course.isFree ? "Free" : `$${course.price}`}
              </p>
              <p className="text-gray-500 mb-6">Instructor: {course.instructor}</p>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="btn-primary w-full text-center disabled:opacity-50"
              >
                {enrolling ? "Enrolling..." : "Enroll Now"}
              </button>
              <ul className="mt-6 space-y-2 text-sm text-gray-500">
                <li>✓ Lifetime access</li>
                <li>✓ Certificate of completion</li>
                <li>✓ {course.level} level</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
