import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Palette, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { adminApi } from "../../api/adminApi";

export default function AdminSettings() {
  const { user, setUser } = useAuth();
  const { dark, toggle } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500";

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await adminApi.updateProfile({ name, bio });
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Profile updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await adminApi.changePassword({ currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-400" /> Profile Settings
        </h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputClass} />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary disabled:opacity-50">
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand-400" /> Change Password
        </h3>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={inputClass} />
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary disabled:opacity-50">
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-brand-400" /> Appearance & System
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50">
            <div>
              <p className="text-white font-medium">Dark Mode</p>
              <p className="text-sm text-gray-500">Toggle admin panel theme</p>
            </div>
            <button onClick={toggle} className={`w-12 h-6 rounded-full transition-colors ${dark ? "bg-brand-600" : "bg-gray-600"}`}>
              <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${dark ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Notifications</p>
                <p className="text-sm text-gray-500">Email alerts for new enrollments</p>
              </div>
            </div>
            <button onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full ${notifications ? "bg-brand-600" : "bg-gray-600"}`}>
              <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${notifications ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 text-sm text-gray-400">
            <p><strong className="text-gray-300">Platform:</strong> LearnDev v2.0</p>
            <p className="mt-1"><strong className="text-gray-300">Stack:</strong> React · Node.js · MongoDB Atlas · Redis · Docker</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
