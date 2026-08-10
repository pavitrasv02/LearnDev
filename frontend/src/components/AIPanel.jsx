import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Send, FileText, Zap, CreditCard,
  RefreshCw, Copy, CheckCircle, ChevronRight, ChevronLeft,
  RotateCcw, Loader
} from "lucide-react";
import { aiApi } from "../api/aiApi";

// ── Shared markdown-ish renderer (simple, no extra deps) ─────────────────
function MDText({ text }) {
  if (!text) return null;
  // Convert **bold**, `code`, ## headers and bullet lists to HTML
  const html = text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-1 text-gray-800 dark:text-gray-100">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-gray-900 dark:text-white">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-brand-600 dark:text-brand-400 font-mono text-xs">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 dark:text-gray-300">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700 dark:text-gray-300">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>');

  return (
    <div
      className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${html}</p>` }}
    />
  );
}

// ── Copy button ───────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-500 transition-colors">
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────
function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
        active
          ? "bg-brand-500 text-white shadow-sm"
          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ── Loading state ────────────────────────────────────────────────────────
function AILoading({ message = "AI is thinking…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="relative">
        <Loader className="w-8 h-8 text-brand-500 animate-spin" />
        <Sparkles className="w-3.5 h-3.5 text-violet-400 absolute -top-1 -right-1 animate-pulse" />
      </div>
      <p className="text-sm text-gray-500 animate-pulse">{message}</p>
    </div>
  );
}

// ── Quiz view ─────────────────────────────────────────────────────────────
function QuizView({ courseId, lessonId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError(""); setSubmitted(false); setAnswers({});
    try {
      const res = await aiApi.quiz({ courseId, lessonId, difficulty, count: 5 });
      if (!res.data.questions?.length) { setError("No questions generated. Try again."); return; }
      setQuestions(res.data.questions);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate quiz.");
    } finally { setLoading(false); }
  };

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctAnswer).length
    : 0;

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <div className="text-center space-y-4 py-4">
          <div className="flex justify-center gap-2">
            {["easy", "medium", "hard"].map((d) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  difficulty === d ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}>
                {d}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={generate} disabled={loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? "Generating…" : "Generate Quiz"}
          </button>
        </div>
      ) : (
        <>
          {submitted && (
            <div className={`p-4 rounded-xl text-center ${score >= questions.length * 0.7 ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"}`}>
              <p className="font-bold text-lg">{score}/{questions.length} correct</p>
              <p className="text-sm">{score >= questions.length * 0.7 ? "Great job! 🎉" : "Keep practicing!"}</p>
            </div>
          )}
          {questions.map((q) => {
            const picked = answers[q.id];
            const isCorrect = submitted && picked === q.correctAnswer;
            const isWrong = submitted && picked && picked !== q.correctAnswer;
            return (
              <div key={q.id} className={`glass-card p-4 space-y-3 ${isCorrect ? "border-green-500/30" : isWrong ? "border-red-400/30" : ""}`}>
                <p className="text-sm font-semibold">{q.id}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt) => {
                    const letter = opt[0];
                    const isSelected = picked === letter;
                    const isRight = submitted && letter === q.correctAnswer;
                    return (
                      <button key={opt} onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: letter }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          isRight ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium" :
                          isSelected && !isRight && submitted ? "bg-red-100 dark:bg-red-900/30 text-red-600" :
                          isSelected ? "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300" :
                          "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <p className="text-xs text-gray-500 italic border-t border-gray-100 dark:border-gray-800 pt-2">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
          <div className="flex gap-3">
            {!submitted ? (
              <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}
                className="btn-primary flex-1 disabled:opacity-50">Submit</button>
            ) : (
              <button onClick={() => { setQuestions([]); setSubmitted(false); setAnswers({}); }}
                className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> New Quiz
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Flashcards view ────────────────────────────────────────────────────────
function FlashcardsView({ courseId, lessonId }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState(new Set());
  const [shuffled, setShuffled] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError(""); setLearned(new Set()); setIndex(0); setFlipped(false);
    try {
      const res = await aiApi.flashcards({ courseId, lessonId, count: 8 });
      if (!res.data.flashcards?.length) { setError("No flashcards generated. Try again."); return; }
      setCards(res.data.flashcards);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate flashcards.");
    } finally { setLoading(false); }
  };

  const shuffle = () => {
    setCards((c) => [...c].sort(() => Math.random() - 0.5));
    setIndex(0); setFlipped(false); setShuffled(true);
  };

  const current = cards[index];
  const remaining = cards.length - learned.size;

  return (
    <div className="space-y-4">
      {cards.length === 0 ? (
        <div className="text-center py-4 space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={generate} disabled={loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {loading ? "Generating…" : "Generate Flashcards"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{index + 1} / {cards.length} · {remaining} remaining</span>
            <div className="flex gap-2">
              <button onClick={shuffle} className="flex items-center gap-1 hover:text-brand-500 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Shuffle
              </button>
              <button onClick={() => { setCards([]); setIndex(0); setLearned(new Set()); }} className="hover:text-red-400 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card */}
          <div
            onClick={() => setFlipped((v) => !v)}
            className={`cursor-pointer rounded-2xl p-6 min-h-[160px] flex flex-col items-center justify-center text-center transition-all duration-300 ${
              learned.has(current?.id)
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : flipped
                  ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800"
                  : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            }`}
          >
            <p className="text-xs text-gray-400 mb-2">{flipped ? "Answer" : "Question"} · tap to flip</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white leading-relaxed">
              {flipped ? current?.back : current?.front}
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
              disabled={index === 0} className="btn-secondary flex-1 flex items-center justify-center gap-1 disabled:opacity-40 text-sm py-2">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={() => {
              setLearned((l) => { const n = new Set(l); n.has(current.id) ? n.delete(current.id) : n.add(current.id); return n; });
            }} className={`flex-1 text-sm py-2 rounded-xl font-medium transition-colors ${
              learned.has(current?.id) ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}>
              {learned.has(current?.id) ? "✓ Learned" : "Mark Learned"}
            </button>
            <button onClick={() => { setIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
              disabled={index >= cards.length - 1} className="btn-secondary flex-1 flex items-center justify-center gap-1 disabled:opacity-40 text-sm py-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Summary view ──────────────────────────────────────────────────────────
function SummaryView({ courseId, lessonId }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const res = await aiApi.summary({ courseId, lessonId });
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate summary.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      {!summary ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-sm text-gray-500">Generate an AI-powered summary of this lesson including key concepts, important points, common mistakes, and interview questions.</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={generate} disabled={loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {loading ? "Generating…" : "Generate Summary"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">AI Summary</p>
            <div className="flex gap-3">
              <CopyBtn text={summary} />
              <button onClick={() => setSummary("")} className="text-xs text-gray-400 hover:text-brand-500 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>
          </div>
          <div className="glass-card p-4">
            <MDText text={summary} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Chat view ─────────────────────────────────────────────────────────────
function ChatView({ courseId, lessonId }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "👋 Hi! I'm your AI tutor. I know what you're studying right now. Ask me anything about this lesson!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await aiApi.ask({ question: q, courseId, lessonId });
      setMessages((m) => [...m, { role: "ai", text: res.data.answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "ai", text: err.response?.data?.message || "Sorry, I couldn't process that. Please try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex-1 space-y-3 max-h-72 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm ${
              m.role === "user"
                ? "bg-brand-500 text-white rounded-br-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
            }`}>
              {m.role === "ai" ? <MDText text={m.text} /> : m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask anything about this lesson…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-400"
          disabled={loading}
        />
        <button onClick={send} disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main AIPanel ──────────────────────────────────────────────────────────
export default function AIPanel({ courseId, lessonId, onClose }) {
  const [tab, setTab] = useState("chat");

  const tabs = [
    { id: "chat",       icon: Sparkles,  label: "Ask AI" },
    { id: "summary",    icon: FileText,  label: "Summary" },
    { id: "quiz",       icon: Zap,       label: "Quiz" },
    { id: "flashcards", icon: CreditCard,label: "Cards" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed right-4 bottom-4 top-16 w-[360px] z-50 flex flex-col glass-card shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-500/10 to-violet-500/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-500/20">
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-bold">AI Study Tutor</p>
            <p className="text-xs text-gray-400">Context-aware · lesson-aware</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 shrink-0 overflow-x-auto">
        {tabs.map((t) => <Tab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />)}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tab === "chat"       && <ChatView       courseId={courseId} lessonId={lessonId} />}
            {tab === "summary"    && <SummaryView    courseId={courseId} lessonId={lessonId} />}
            {tab === "quiz"       && <QuizView       courseId={courseId} lessonId={lessonId} />}
            {tab === "flashcards" && <FlashcardsView courseId={courseId} lessonId={lessonId} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
