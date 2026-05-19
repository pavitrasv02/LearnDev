import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  { name: "Priya Sharma", role: "DevOps Engineer", text: "The Docker and Kubernetes courses helped me land my first DevOps role. Incredible platform!", avatar: "PS" },
  { name: "James Wilson", role: "Full Stack Developer", text: "Premium UI and real backend integration. Perfect for my portfolio demonstration.", avatar: "JW" },
  { name: "Maria Garcia", role: "Cloud Architect", text: "AWS and CI/CD content is production-quality. The Jenkins pipeline demo impressed interviewers.", avatar: "MG" },
];

export default function Testimonials() {
  return (
    <section className="section-padding">
      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-bold text-center mb-12"
      >
        What <span className="gradient-text">Learners Say</span>
      </motion.h2>
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass-card p-8 relative"
          >
            <Quote className="w-8 h-8 text-brand-500/30 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-6">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-white font-bold">
                {t.avatar}
              </div>
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
