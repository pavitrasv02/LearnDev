import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, ChevronDown, ChevronUp, Clock,
  CheckCircle, AlertCircle, Send, X, Paperclip
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import api from "../api/axios";

const TYPES = ["complaint", "bug_report", "course_issue", "video_issue", "pdf_issue", "feedback", "feature_request"];
const TYPE_LABELS = {
  complaint: "Complaint",
  bug_report: "Bug Report",
  course_issue: "Course Issue",
  video_issue: "Video Issue",
  pdf_issue: "PDF Issue",
  feedback: "Feedback",
  feature_request: "Feature Request",
};

const STATUS_META = {
  submitted:    { label: "Submitted",    color: "badge-blue" },
  under_review: { label: "Under Review", color: "badge-yellow" },
  assigned:     { label: "Assigned",     color: "badge-violet" },
  resolved:     { label: "Resolved",     color: "badge-green" },
  closed:       { label: "Closed",       color: "badge-gray" },
};

const PRIORITY_META = {
  low:      { label: "Low",      color: "badge-gray" },
  medium:   { label: "Medium",   color: "badge-yellow" },
  high:     { label: "High",     color: "badge-red" },
  critical: { label: "Critical", color: "badge-red" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.submitted;
  return <span className={`badge ${m.color}`}>{m.label}</span>;
}

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.low;
  return <span className={`badge ${m.color}`}>{m.label}</span>;
}

// ── Complaint detail accordion ────────────────────────────────────────────
function ComplaintItem({ complaint, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const canReply = !["resolved", "closed"].includes(complaint.status);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/complaints/${complaint._id}/reply`, { message: reply });
      setReply("");
      toast("Reply sent", "success");
      onRefresh();
    } catch {
      toast("Failed to send reply", "error");
    } finally { setSending(false); }
  };

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="badge badge-gray text-xs">{TYPE_LABELS[complaint.type] || complaint.type}</span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <p className="font-semibold truncate">{complaint.subject}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(complaint.createdAt).toLocaleDateString()} ·{" "}
            {complaint.replies?.length || 0} repl{complaint.replies?.length === 1 ? "y" : "ies"}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-800"
          >
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{complaint.description}</p>

              {/* Replies */}
              {complaint.replies?.length > 0 && (
                <div className="space-y-3">
                  {complaint.replies.map((r, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl text-sm ${
                        r.isAdmin
                          ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800"
                          : "bg-gray-50 dark:bg-gray-800/50"
                      }`}
                    >
                      <p className="font-medium text-xs mb-1 text-gray-500">
                        {r.isAdmin ? "Support Team" : "You"} · {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {canReply && (
                <div className="flex gap-3 pt-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to this ticket..."
                    rows={2}
                    className="input-base resize-none flex-1"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim() || sending}
                    className="btn-primary px-4 self-end disabled:opacity-60 flex items-center gap-2"
                  >
                    {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── New complaint form ────────────────────────────────────────────────────
function NewComplaintForm({ onClose, onSuccess }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ type: "complaint", subject: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.description.trim()) e.description = "Description is required";
    else if (form.description.length < 20) e.description = "Please provide more detail (20+ characters)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/complaints", form);
      toast("Ticket submitted! We'll get back to you soon.", "success");
      onSuccess();
      onClose();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to submit ticket", "error");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New Support Ticket</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="input-base"
            >
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Subject *</label>
            <input
              value={form.subject}
              onChange={(e) => { setForm((f) => ({ ...f, subject: e.target.value })); setErrors((p) => ({ ...p, subject: "" })); }}
              placeholder="Brief description of the issue"
              className={`input-base ${errors.subject ? "ring-2 ring-red-400" : ""}`}
              maxLength={100}
            />
            {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setErrors((p) => ({ ...p, description: "" })); }}
              placeholder="Please describe the issue in detail..."
              rows={5}
              className={`input-base resize-none ${errors.description ? "ring-2 ring-red-400" : ""}`}
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</> : "Submit Ticket"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Support page ─────────────────────────────────────────────────────
export default function Support() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchComplaints = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const res = await api.get("/complaints/mine", { params });
      setComplaints(res.data.complaints || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, [statusFilter]);

  const pending = complaints.filter((c) => !["resolved", "closed"].includes(c.status)).length;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Support <span className="gradient-text">Center</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {pending > 0 ? `${pending} open ticket${pending > 1 ? "s" : ""}` : "All tickets resolved"}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {["all", "submitted", "under_review", "resolved", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="font-semibold text-gray-600 dark:text-gray-300">No tickets found</p>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter === "all"
                ? "Haven't submitted any tickets yet."
                : `No ${statusFilter.replace("_", " ")} tickets.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <ComplaintItem key={c._id} complaint={c} onRefresh={fetchComplaints} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <NewComplaintForm
            onClose={() => setShowForm(false)}
            onSuccess={fetchComplaints}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
