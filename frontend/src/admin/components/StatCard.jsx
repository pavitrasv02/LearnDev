import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, sub, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl p-6 border border-gray-800/50 bg-gray-900/60 backdrop-blur-sm ${gradient || ""}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-2">{sub}</p>}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-brand-500/20 border border-brand-500/30">
            <Icon className="w-6 h-6 text-brand-400" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
