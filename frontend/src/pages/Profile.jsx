import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail, Shield, Camera, BookOpen, Award, Bookmark,
  TrendingUp, Clock, Edit3, Save, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api/axios";

// ── Avatar with upload placeholder ───────────────────────────────────────
function Avatar({ user, size = "w-24 h-24", text = "text-3xl" }) {
  if (user?.avatar) {
    return <img src={user.avatar} alt={user.name} className={`${size} rounded-full object-cover ring-4 ring-brand-500/30`} />;
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center ${text} font-bold text-white ring-4 ring-brand-500/30`}>
      {user?.name?.charAt(0)?.toUpperCase()}
    </div>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────
function StatTile({ icon: Icon, label, value, color = "brand" }) {
  const colors = {
    brand:  "from-brand-500/20  to-brand-600/10  text-brand-500",
    green:  "from-green-500/20  to-green-600/10  text-green-500",
    violet: "from-violet-500/20 to-violet-600/10 text-violet-500",
    amber:  "from-amber-500/20  to-amber-600/10  text-amber-500",
  };
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "", avatar: user?.avatar || "" });
  const [saving, setSaving] = useState(false);

  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/enrollments"),
      api.get("/certificates").catch(() => ({ data: { certificates: [] } })),
      api.get("/users/bookmarks").catch(() => ({ data: { bookmarks: [] } })),
    ]).then(([enrollRes, certRes, bmRes]) => {
      setEnrollments(enrollRes.data.enrollments || []);
      setCertificates(certRes.data.certificates || []);
      setBookmarks(bmRes.data.bookmarks || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const completed  = enrollments.filter((e) => e.status === "completed");
  const inProgress = enrollments.filter((e) => e.status !== "completed");

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", { name: form.name, bio: form.bio, avatar: form.avatar });
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast("Profile updated!", "success");
      setEditing(false);
    } catch {
      toast("Update failed", "error");
    } finally { setSaving(false); }
  };

  const cancelEdit = () => {
    setForm({ name: user?.name || "", bio: user?.bio || "", avatar: user?.avatar || "" });
    setEditing(false);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding max-w-4xl">
        {/* ── Profile card ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="relative shrink-0 self-start">
              <Avatar user={editing ? { ...user, avatar: form.avatar } : user} />
              {editing && (
                <div className="absolute bottom-1 right-1 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-600 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Info / Edit form */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Display Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="input-base"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Avatar URL</label>
                    <input
                      value={form.avatar}
                      onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
                      className="input-base"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      className="input-base resize-none"
                      placeholder="Tell the community about yourself..."
                      maxLength={300}
                    />
                    <p className="text-xs text-gray-400 mt-1">{form.bio.length}/300</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={cancelEdit} className="btn-secondary flex items-center gap-2">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                      {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h1 className="text-2xl font-bold">{user?.name}</h1>
                      <p className="text-gray-500 flex items-center gap-1.5 text-sm mt-1">
                        <Mail className="w-4 h-4" /> {user?.email}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-brand-500">
                        <Shield className="w-3.5 h-3.5" /> {user?.role}
                      </span>
                    </div>
                    <button onClick={() => setEditing(true)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </div>
                  {user?.bio
                    ? <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{user.bio}</p>
                    : <p className="text-gray-400 text-sm italic">No bio yet. Click the edit button to add one.</p>
                  }
                  <p className="text-xs text-gray-400 mt-3">
                    Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatTile icon={BookOpen} label="Enrolled"   value={enrollments.length}  color="brand" />
          <StatTile icon={TrendingUp} label="In Progress" value={inProgress.length} color="violet" />
          <StatTile icon={Award}    label="Completed"  value={completed.length}    color="green" />
          <StatTile icon={Bookmark} label="Bookmarks"  value={bookmarks.length}    color="amber" />
        </div>

        {/* ── Certificates ──────────────────────────────────────────────── */}
        {certificates.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-500" /> Certificates
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert._id} className="glass-card p-5 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20 shrink-0">
                    <Award className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{cert.courseTitle}</p>
                    <p className="text-xs text-gray-500">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">#{cert.verificationCode?.slice(0, 20)}…</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Bookmarks ─────────────────────────────────────────────────── */}
        {bookmarks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500" /> Saved Courses
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {bookmarks.map((bm) => (
                <Link key={bm._id} to={`/courses/${bm.course?.slug}`} className="glass-card p-4 flex items-center gap-4 hover:shadow-glow transition-shadow">
                  <img
                    src={bm.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"}
                    alt={bm.course?.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{bm.course?.title}</p>
                    <p className="text-xs text-gray-500">{bm.course?.instructor} · {bm.course?.level}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── In Progress ───────────────────────────────────────────────── */}
        {inProgress.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-500" /> In Progress
            </h2>
            <div className="space-y-3">
              {inProgress.map((e) => (
                <Link key={e._id} to={`/learn/${e.course?.slug}`} className="glass-card p-4 flex items-center gap-4 hover:shadow-glow transition-shadow">
                  <img
                    src={e.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"}
                    alt={e.course?.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{e.course?.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${e.progress || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{e.progress || 0}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
