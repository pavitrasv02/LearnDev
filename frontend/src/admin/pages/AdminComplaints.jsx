import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageSquare, ChevronDown, ChevronUp, Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Modal from "../components/Modal";

const STATUS_OPTIONS = ["submitted", "under_review", "assigned", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

const STATUS_COLORS = {
  submitted:    "bg-blue-500/20 text-blue-400",
  under_review: "bg-yellow-500/20 text-yellow-400",
  assigned:     "bg-violet-500/20 text-violet-400",
  resolved:     "bg-green-500/20 text-green-400",
  closed:       "bg-gray-500/20 text-gray-400",
};

const PRIORITY_COLORS = {
  low:      "bg-gray-500/20 text-gray-400",
  medium:   "bg-yellow-500/20 text-yellow-400",
  high:     "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [stats, setStats]           = useState({});
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);

  const [selected, setSelected]     = useState(null);
  const [replyText, setReplyText]   = useState("");
  const [sending, setSending]       = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/admin/complaints", { params });
      // Client-side search filter
      let list = res.data.complaints || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter((c) =>
          c.subject.toLowerCase().includes(q) ||
          c.user?.name?.toLowerCase().includes(q) ||
          c.user?.email?.toLowerCase().includes(q)
        );
      }
      setComplaints(list);
      setPages(res.data.pages || 1);
      setStats(res.data.stats || {});
    } catch {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [statusFilter, page]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchComplaints, 400);
    return () => clearTimeout(t);
  }, [search]);

  const updateComplaint = async (id, data) => {
    try {
      await api.patch(`/admin/complaints/${id}`, data);
      toast.success("Updated");
      fetchComplaints();
      if (selected?._id === id) {
        setSelected((p) => ({ ...p, ...data }));
      }
    } catch { toast.error("Failed to update"); }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/admin/complaints/${selected._id}/reply`, { message: replyText });
      setReplyText("");
      toast.success("Reply sent");
      fetchComplaints();
      // Refresh selected
      const res = await api.get("/admin/complaints");
      const updated = res.data.complaints.find((c) => c._id === selected._id);
      if (updated) setSelected(updated);
    } catch { toast.error("Failed to send reply"); }
    finally { setSending(false); }
  };

  const totalPending = (stats.submitted || 0) + (stats.under_review || 0);

  return (
    <div className="space-y-6">
      {/* Stats pills */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(stats).map(([status, count]) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(statusFilter === status ? "" : status); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors border ${
              statusFilter === status
                ? "bg-brand-600 text-white border-brand-600"
                : "border-gray-700 text-gray-400 hover:bg-gray-800"
            }`}
          >
            {status.replace("_", " ")}: {count}
          </button>
        ))}
        {statusFilter && (
          <button onClick={() => setStatusFilter("")} className="px-4 py-2 rounded-xl text-sm text-red-400 border border-gray-700 hover:bg-gray-800">
            Clear filter
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by subject or user..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-800 overflow-hidden bg-gray-900/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="p-4">User</th>
              <th className="p-4 hidden sm:table-cell">Subject</th>
              <th className="p-4 hidden md:table-cell">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4 hidden lg:table-cell">Priority</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={6} className="p-4"><div className="h-10 bg-gray-800 rounded animate-pulse" /></td></tr>
            )) : complaints.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  No complaints found
                </td>
              </tr>
            ) : complaints.map((c) => (
              <tr key={c._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="p-4">
                  <p className="font-medium text-white text-sm">{c.user?.name}</p>
                  <p className="text-xs text-gray-500">{c.user?.email}</p>
                </td>
                <td className="p-4 hidden sm:table-cell text-gray-300 max-w-[200px] truncate">{c.subject}</td>
                <td className="p-4 hidden md:table-cell">
                  <span className="text-xs text-gray-400 capitalize">{c.type?.replace("_", " ")}</span>
                </td>
                <td className="p-4">
                  <select
                    value={c.status}
                    onChange={(e) => updateComplaint(c._id, { status: e.target.value })}
                    className={`text-xs px-2 py-1 rounded-lg border-0 ${STATUS_COLORS[c.status] || ""} bg-transparent outline-none cursor-pointer`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-gray-900 text-gray-300">{s.replace("_", " ")}</option>)}
                  </select>
                </td>
                <td className="p-4 hidden lg:table-cell">
                  <select
                    value={c.priority || "low"}
                    onChange={(e) => updateComplaint(c._id, { priority: e.target.value })}
                    className={`text-xs px-2 py-1 rounded-lg border-0 ${PRIORITY_COLORS[c.priority || "low"] || ""} bg-transparent outline-none cursor-pointer`}
                  >
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p} className="bg-gray-900 text-gray-300">{p}</option>)}
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => setSelected(c)} className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                    View / Reply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-800">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-lg text-sm ${page === p ? "bg-brand-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setReplyText(""); }} title="Complaint Detail" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${STATUS_COLORS[selected.status] || ""}`}>{selected.status?.replace("_", " ")}</span>
              <span className={`badge ${PRIORITY_COLORS[selected.priority || "low"] || ""}`}>{selected.priority || "low"}</span>
              <span className="badge bg-gray-800 text-gray-400 capitalize">{selected.type?.replace("_", " ")}</span>
            </div>
            <h3 className="font-bold text-white">{selected.subject}</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>

            {selected.replies?.length > 0 && (
              <div className="space-y-3 border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500 font-semibold uppercase">Conversation</p>
                {selected.replies.map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl text-sm ${r.isAdmin ? "bg-brand-900/30 border border-brand-800" : "bg-gray-800/50"}`}>
                    <p className="text-xs text-gray-500 mb-1">{r.isAdmin ? "Support Team" : selected.user?.name} · {new Date(r.createdAt).toLocaleDateString()}</p>
                    <p className="text-gray-200">{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || sending}
                className="btn-primary px-4 self-end disabled:opacity-60 flex items-center gap-2"
              >
                {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
