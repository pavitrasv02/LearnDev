import { Link } from "react-router-dom";
import { GraduationCap, Github, Twitter, Linkedin, Youtube } from "lucide-react";

const social = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Whatsapp, href: "https://whatsapp.com", label: "Whatsapp" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
      <div className="section-padding grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">LearnDev</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Production-grade online learning platform with Docker, Kubernetes, Redis, and full DevOps pipeline.
          </p>
          <div className="flex gap-4 mt-6">
            {social.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="p-2 rounded-lg glass hover:text-brand-500 transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Platform</h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li><Link to="/courses" className="hover:text-brand-500">Courses</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand-500">Dashboard</Link></li>
            <li><Link to="/#pricing" className="hover:text-brand-500">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">DevOps Stack</h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
            <li>Docker & Kubernetes</li>
            <li>Jenkins CI/CD</li>
            <li>Prometheus & Grafana</li>
            <li>nginx Reverse Proxy</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} LearnDev. Built for portfolio & placements.
      </div>
    </footer>
  );
}
