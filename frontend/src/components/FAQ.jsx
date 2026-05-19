import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "How do I enroll in a course?", a: "Create a free account, browse courses, and click Enroll on any course page. Your dashboard tracks all progress." },
  { q: "Is this platform production-ready?", a: "Yes! Built with Docker, Kubernetes, Redis caching, MongoDB Atlas, Jenkins CI/CD, and Prometheus monitoring." },
  { q: "What technologies are covered?", a: "DevOps, Docker, Kubernetes, AWS, Node.js, React, JavaScript, and more — all with hands-on projects." },
  { q: "Can I use this for my portfolio?", a: "Absolutely. The full stack demonstrates modern frontend, backend API, database, and DevOps workflows." },
  { q: "Are certificates included?", a: "Pro and Enterprise plans include verified certificates upon course completion." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="section-padding max-w-3xl">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
        Frequently Asked <span className="gradient-text">Questions</span>
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-5 text-left font-semibold"
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              {faq.q}
              <ChevronDown className={`w-5 h-5 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-gray-600 dark:text-gray-400">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
