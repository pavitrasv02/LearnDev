import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api/axios";

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", { name, bio });
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast("Profile updated!", "success");
    } catch {
      toast("Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">
          My <span className="gradient-text">Profile</span>
        </h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-2xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.name}</p>
              <p className="text-gray-500 flex items-center gap-2"><Mail className="w-4 h-4" /> {user?.email}</p>
              <p className="text-sm text-brand-500 flex items-center gap-1 mt-1">
                <Shield className="w-4 h-4" /> {user?.role}
              </p>
            </div>
          </div>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
