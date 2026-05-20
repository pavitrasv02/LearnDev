import { Link } from "react-router-dom";
import {
  GraduationCap,
  Github,
  Linkedin,
  Instagram,
  MessageCircle,
} from "lucide-react";

const social = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: MessageCircle, href: "https://whatsapp.com", label: "Whatsapp" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950">
      <div className="section-padding grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Left Section */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>

            <span className="text-xl font-bold gradient-text">
              Devops Dash
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Modern online learning platform built with Docker, Redis,
            Kubernetes, and complete DevOps automation.
          </p>

          <div className="flex gap-4 mt-6">
            {social.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="p-2 rounded-lg glass hover:text-blue-500 transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Platform Links */}
        <div>
          <h4 className="font-semibold mb-4">Platform</h4>

          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>
              <Link to="/courses" className="hover:text-blue-500">
                Courses
              </Link>
            </li>

            <li>
              <Link to="/dashboard" className="hover:text-blue-500">
                Dashboard
              </Link>
            </li>

            <li>
              <Link to="/#pricing" className="hover:text-blue-500">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        {/* DevOps Stack */}
        <div>
          <h4 className="font-semibold mb-4">DevOps Stack</h4>

          <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
            <li>Docker Containers</li>
            <li>Jenkins Automation</li>
            <li>Redis Caching</li>
            <li>NGINX Reverse Proxy</li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Devops Dash. All rights reserved.
      </div>
    </footer>
  );
}