import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: 0,
    desc: "Get started with fundamentals",
    features: ["5 free courses", "Community access", "Basic certificates", "Mobile learning"],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Pro",
    price: 19,
    desc: "Best for serious learners",
    features: ["All courses", "Priority support", "Pro certificates", "Download resources", "Live Q&A sessions"],
    cta: "Go Pro",
    featured: true,
  },
  {
    name: "Enterprise",
    price: 49,
    desc: "For teams and organizations",
    features: ["Everything in Pro", "Team dashboard", "Custom learning paths", "SSO integration", "Dedicated account manager"],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="section-padding">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
        Simple <span className="gradient-text">Pricing</span>
      </h2>
      <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">Choose the plan that fits your learning journey</p>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-8 relative ${plan.featured ? "ring-2 ring-brand-500 scale-105 shadow-glow" : ""}`}
          >
            {plan.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-500 text-white text-xs font-bold rounded-full">
                POPULAR
              </span>
            )}
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
            <p className="text-4xl font-bold mb-6">
              ${plan.price}<span className="text-lg font-normal text-gray-500">/mo</span>
            </p>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup" className={`block text-center w-full py-3 rounded-xl font-semibold transition-all ${plan.featured ? "btn-primary" : "btn-secondary"}`}>
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
