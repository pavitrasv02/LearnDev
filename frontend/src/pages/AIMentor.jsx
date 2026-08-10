import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Brain, Target, TrendingUp, BookOpen, Award,
  Zap, RefreshCw, Loader, ChevronRight, Star, AlertTriangle
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { aiApi } from "../api/aiApi";

// ── Score ring ────────────────────────────────────────────────────────────
function ScoreRing({ score = 0, size = 120, label = "" }) {
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#6366f1" : score >= 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="8"
          className="text-gray-200 dark:text-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-black" style={{ color }}>{score}</p>
        {label && <p className="text-xs text-gray-400">{label}</p>}
      </div>
    </div>
  );
}

// ── Pill list ─────────────────────────────────────────────────────────────
function PillList({ items = [], color = "green" }) {
  const colors = {
    green:  "bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300",
    red:    "bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-300",
    violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    amber:  "bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300",
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>{item}</span>
      ))}
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────
function Card({ title, icon: Icon, iconColor = "text-brand-500", children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-card p-6 space-y-3">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────
function MentorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────
function AIUnavailable({ onRetry }) {
  return (
    <div className="glass-card p-12 text-center max-w-md mx-auto">
      <div className="inline-flex p-4 rounded-full bg-amber-100 dark:bg-amber-900/20 mb-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
      </div>
      <h3 className="text-lg font-bold mb-2">AI Service Unavailable</h3>
      <p className="text-gray-500 text-sm mb-6">
        The AI mentor requires a Gemini API key. Ask your administrator to configure{" "}
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code> in the backend.
      </p>
      <button onClick={onRetry} className="btn-secondary flex items-center gap-2 mx-auto">
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}

export default function AIMentor() {
  const { user } = useAuth();
  const [mentor, setMentor]       = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const [mentorRes, interviewRes] = await Promise.all([
        aiApi.mentorReport(),
        aiApi.interviewScore(),
      ]);
      setMentor(mentorRes.data.report);
      setInterview(interviewRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI mentor report.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-brand-500/10">
            <Sparkles className="w-7 h-7 text-brand-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Study Mentor</h1>
            <p className="text-gray-400 text-sm animate-pulse">Analysing your learning journey…</p>
          </div>
        </div>
        <MentorSkeleton />
      </div>
    </div>
  );

  if (error) return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding"><AIUnavailable onRetry={() => load()} /></div>
    </div>
  );

  const healthColor = (mentor?.healthScore || 0) >= 75 ? "text-green-500" :
    (mentor?.healthScore || 0) >= 50 ? "text-brand-500" : "text-amber-500";

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="section-padding max-w-5xl">
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20">
              <Sparkles className="w-7 h-7 text-brand-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Study Mentor</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Personalised insights for {user?.name?.split(" ")[0]}
              </p>
            </div>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm shrink-0"
          >
            {refreshing
              ? <Loader className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
            Refresh
          </button>
        </div>

        {/* ── TOP ROW — Health + Interview score side by side ─────────── */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          {/* Learning Health */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={mentor?.healthScore || 0} label="/100" />
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold mb-1">Learning Health</h2>
              <p className={`text-3xl font-black ${healthColor}`}>{mentor?.healthScore || 0}<span className="text-base font-normal text-gray-400">/100</span></p>
              <p className="text-sm text-gray-500 mt-1 capitalize">Consistency: {mentor?.consistency || "—"}</p>
              <p className="text-sm text-gray-400 mt-2 max-w-xs">{mentor?.motivationalMessage}</p>
            </div>
          </motion.div>

          {/* Interview Readiness */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={interview?.score || 0} label="/100" size={120} />
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold mb-1">Interview Readiness</h2>
              <p className="text-3xl font-black text-brand-500">{interview?.score || 0}<span className="text-base font-normal text-gray-400">/100</span></p>
              <div className="flex flex-wrap gap-2 mt-2">
                {interview?.grade && <span className="badge badge-violet">Grade: {interview.grade}</span>}
                {interview?.level && <span className="badge badge-blue">{interview.level}</span>}
              </div>
              {interview?.estimatedReadyInDays > 0 && (
                <p className="text-xs text-gray-400 mt-2">Ready in ~{interview.estimatedReadyInDays} days</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── RADAR CHART ──────────────────────────────────────────────── */}
        {interview?.radarData?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-6 mb-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-500" /> Skill Radar
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={interview.radarData} cx="50%" cy="50%" outerRadius={100}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Radar name="Skill" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── GRID — insights ──────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {/* Strengths */}
          <Card title="Strengths" icon={Star} iconColor="text-green-500" delay={0.2}>
            <PillList items={mentor?.strongSubjects || interview?.strengths || []} color="green" />
            {!(mentor?.strongSubjects?.length || interview?.strengths?.length) && (
              <p className="text-sm text-gray-400">Complete more courses to see strengths.</p>
            )}
          </Card>

          {/* Needs Work */}
          <Card title="Needs Improvement" icon={AlertTriangle} iconColor="text-amber-500" delay={0.25}>
            <PillList items={mentor?.weakSubjects || interview?.improvements || []} color="amber" />
            {!(mentor?.weakSubjects?.length || interview?.improvements?.length) && (
              <p className="text-sm text-gray-400">Great — no significant weak areas yet!</p>
            )}
          </Card>

          {/* Study plan */}
          <Card title="Study Plan" icon={TrendingUp} iconColor="text-violet-500" delay={0.3}>
            <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
              <p><span className="font-semibold">Daily goal:</span> {mentor?.recommendedDailyHours || 1}h/day</p>
              <p><span className="font-semibold">Completion:</span> ~{mentor?.estimatedCompletionDays || "—"} days</p>
              {mentor?.weeklyGoal && (
                <p className="text-xs text-brand-500 font-medium mt-2">This week: {mentor.weeklyGoal}</p>
              )}
            </div>
          </Card>

          {/* Recommendations */}
          <Card title="AI Recommendations" icon={Sparkles} iconColor="text-brand-500" delay={0.35}>
            <ul className="space-y-1.5">
              {(interview?.recommendations || []).slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <ChevronRight className="w-3.5 h-3.5 text-brand-500 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
              {!interview?.recommendations?.length && (
                <p className="text-sm text-gray-400">Enroll in more courses for personalised recommendations.</p>
              )}
            </ul>
          </Card>

          {/* Topics to revise */}
          {(interview?.topicsToRevise?.length > 0 || mentor?.weakSubjects?.length > 0) && (
            <Card title="Revise These Topics" icon={BookOpen} iconColor="text-red-500" delay={0.4}>
              <PillList items={interview?.topicsToRevise || mentor?.weakSubjects || []} color="red" />
            </Card>
          )}

          {/* Next recommended course */}
          <Card title="Next Step" icon={Zap} iconColor="text-yellow-500" delay={0.45}>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {mentor?.nextRecommendedCourse || interview?.recommendations?.[0] || "Complete more lessons to get a recommendation."}
            </p>
            <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium mt-1">
              Browse Courses <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>

        {/* ── AI Insights (long text) ────────────────────────────────── */}
        {(mentor?.insights?.length > 0 || interview?.summary) && (
          <Card title="Personalised Insights" icon={Brain} iconColor="text-violet-500" delay={0.5}>
            {interview?.summary && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{interview.summary}</p>
            )}
            {mentor?.insights && (
              <ul className="space-y-2">
                {mentor.insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                    {ins}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

      </div>
    </div>
  );
}
