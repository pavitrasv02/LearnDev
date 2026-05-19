import { Menu, Bell, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function AdminHeader({ onMenuClick, title }) {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-white/10">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900/80 border border-gray-800">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-40 text-gray-300 placeholder-gray-500"
          />
        </div>
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
        </button>
        <div className="flex items-center gap-3 pl-3 border-l border-gray-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
