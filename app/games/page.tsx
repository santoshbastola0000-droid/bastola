"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Heart, Loader2, Share2, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { api } from "@/http/api/api";

type Question = { id: string; category: string; text: string; options: string[] };
type Result = {
  attemptId: string; creatorName: string; knowledgeScore: number; vibeScore: number; funScore: number;
  overallScore: number; friendshipType: string; matched: { question: string; answer: string }[];
  missed: { question: string; guessed: string; actual: string }[]; challengeToken: string;
};

const modes = [
  ["best-friend", "👯", "Best Friend", "Who really knows me?"],
  ["love", "❤️", "Love / Crush", "Do we think alike?"],
  ["mind-match", "🧠", "Mind Match", "Same brain or not?"],
  ["fun-chaos", "😂", "Fun & Chaos", "Predict my chaos."],
  ["who-knows", "🔥", "Who Knows Me Best", "Challenge everyone."],
] as const;

const makeAnonId = () => {
  if (typeof window === "undefined") return "";
  const key = "friendcheck-anon-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  localStorage.setItem(key, value);
  return value;
};

export default function FriendCheckPage() {
  const [mode, setMode] = useState("best-friend");
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [screen, setScreen] = useState<"home" | "create" | "share" | "challenge" | "result">("home");
  const [token, setToken] = useState("");
  const [resultId, setResultId] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challenge = params.get("challenge");
    const resultParam = params.get("result");
    if (challenge) {
      setToken(challenge);
      setScreen("challenge");
      void loadChallenge(challenge);
    } else if (resultParam) {
      setResultId(resultParam);
      setScreen("result");
      void loadResult(resultParam);
    }
  }, []);

  const progress = questions.length ? Math.round(((current + 1) / questions.length) * 100) : 0;
  const challengeUrl = useMemo(
    () => token ? `${typeof window !== "undefined" ? window.location.origin : ""}/games?challenge=${encodeURIComponent(token)}` : "",
    [token],
  );

  async function loadQuestions(selectedMode = mode) {
    setLoading(true); setError("");
    try {
      const response = await api.get("/friendcheck/questions", { params: { mode: selectedMode } });
      setQuestions(Array.isArray(response.data?.data) ? response.data.data : []);
      setAnswers({}); setCurrent(0); setScreen("create");
    } catch {
      setError("Could not load the game. Please try again.");
    } finally { setLoading(false); }
  }

  async function loadChallenge(challengeToken: string) {
    setLoading(true); setError("");
    try {
      const response = await api.get(`/friendcheck/${encodeURIComponent(challengeToken)}`);
      const data = response.data?.data;
      setQuestions(data?.questions || []);
      setName(data?.creatorName || "Your friend");
      setAnswers({}); setCurrent(0);
    } catch { setError("This FriendCheck link is unavailable or expired."); }
    finally { setLoading(false); }
  }

  async function loadResult(id: string) {
    setLoading(true); setError("");
    try {
      const response = await api.get(`/friendcheck/attempt/${encodeURIComponent(id)}/result`);
      setResult(response.data?.data || null);
    } catch { setError("Could not load this result."); }
    finally { setLoading(false); }
  }

  async function createChallenge() {
    if (!questions.length || Object.keys(answers).length !== questions.length) return;
    setLoading(true); setError("");
    try {
      const response = await api.post("/friendcheck", { mode, creatorName: name || "Friend", answers });
      const data = response.data?.data;
      setToken(data.token);
      setQuestions(data.questions || questions);
      setScreen("share");
      window.history.replaceState({}, "", `/games?challenge=${encodeURIComponent(data.token)}`);
    } catch { setError("Could not create your challenge."); }
    finally { setLoading(false); }
  }

  async function submitAttempt() {
    if (!token || Object.keys(answers).length !== questions.length) return;
    setLoading(true); setError("");
    try {
      const response = await api.post(`/friendcheck/${encodeURIComponent(token)}/attempt`, {
        answers, anonymousId: makeAnonId(),
      });
      const id = response.data?.data?.attemptId;
      if (!id) throw new Error("Missing result");
      setResultId(id);
      window.history.replaceState({}, "", `/games?result=${encodeURIComponent(id)}`);
      setScreen("result");
      await loadResult(id);
    } catch { setError("Could not calculate the result. Please try again."); }
    finally { setLoading(false); }
  }

  async function share(url = challengeUrl) {
    const text = "👀 I made a FriendCheck. Let's see how well you actually know me 😂";
    try {
      if (navigator.share) await navigator.share({ title: "FriendCheck", text, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true); setTimeout(() => setCopied(false), 1800);
      }
    } catch {}
  }

  const choose = (value: number) => {
    const q = questions[current];
    setAnswers(prev => ({ ...prev, [q.id]: value }));
  };

  const next = () => {
    if (current < questions.length - 1) setCurrent(v => v + 1);
    else if (screen === "create") void createChallenge();
    else void submitAttempt();
  };

  if (loading && screen !== "create" && !questions.length) {
    return <Shell><Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-600" /><p className="mt-4 text-center font-bold text-slate-500">Loading FriendCheck…</p></Shell>;
  }

  if (screen === "home") return (
    <Shell>
      <div className="mx-auto max-w-3xl text-center">
        <Badge>FRIENDCHECK</Badge>
        <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-950 sm:text-7xl">How well do your friends <span className="text-violet-600">REALLY</span> know you? 👀</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Answer a few questions, send your challenge to a friend, and see how well they actually know you.</p>
        <div className="mx-auto mt-8 grid max-w-2xl gap-2 sm:grid-cols-5">{modes.map(([id,emoji,title]) => <button key={id} onClick={() => setMode(id)} className={`rounded-2xl border p-3 text-left transition ${mode === id ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white"}`}><div className="text-xl">{emoji}</div><div className="mt-1 text-xs font-black text-slate-900">{title}</div></button>)}</div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => loadQuestions()} className="btn-primary"><Sparkles className="h-5 w-5" /> Create My FriendCheck</button>
          <button onClick={() => setScreen("challenge")} className="btn-secondary"><Users className="h-5 w-5" /> I received a FriendCheck</button>
        </div>
      </div>
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {[["🧠","Guess","Your friend predicts your answers."],["🔥","Reveal","See exactly where they matched."],["🚀","Remix","They can challenge their next friend."]].map(([emoji,title,text]) => <div key={title} className="rounded-3xl border bg-white p-6 text-left shadow-sm"><div className="text-3xl">{emoji}</div><h3 className="mt-3 font-black">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p></div>)}
      </div>
      {error && <ErrorBox text={error} />}
    </Shell>
  );

  if (screen === "challenge" && !token) return (
    <Shell>
      <button className="back" onClick={() => setScreen("home")}><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="mx-auto max-w-lg rounded-[2rem] border bg-white p-7 shadow-xl">
        <Badge>CHALLENGE</Badge>
        <h1 className="mt-3 text-3xl font-black">Enter your friend's link 👀</h1>
        <p className="mt-2 text-slate-500">Paste the FriendCheck URL you received.</p>
        <input className="input mt-6" placeholder="https://…/games?challenge=…" onChange={e => {
          try { const u = new URL(e.target.value); setToken(u.searchParams.get("challenge") || ""); } catch { setToken(""); }
        }} />
        <button disabled={!token} onClick={() => { setScreen("challenge"); void loadChallenge(token); }} className="btn-primary mt-4 w-full">Open Challenge <ArrowRight className="h-5 w-5" /></button>
      </div>
    </Shell>
  );

  if ((screen === "create" || screen === "challenge") && questions.length) {
    const q = questions[current];
    const selected = answers[q.id];
    const isCreator = screen === "create";
    return <Shell>
      <div className="mx-auto max-w-xl">
        <button className="back" onClick={() => setScreen("home")}><ArrowLeft className="h-4 w-4" /> Exit</button>
        <div className="mb-5 flex items-center justify-between text-sm font-black text-slate-500"><span>Question {current + 1} / {questions.length}</span><span>{progress}%</span></div>
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-600 transition-all" style={{width:`${progress}%`}} /></div>
        {isCreator && current === 0 && <input className="input mb-4" value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)" maxLength={80} />}
        <section className="rounded-[2rem] border bg-white p-6 shadow-xl sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><Heart className="h-6 w-6" /></div>
          <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-violet-600">{q.category}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{isCreator ? q.text : `What would ${name || "they"} choose?`}</h2>
          <div className="mt-7 grid gap-3">{q.options.map((option,i) => <button key={option} onClick={() => choose(i)} className={`option ${selected === i ? "option-active" : ""}`}>{option}{selected === i && <Check className="ml-auto h-5 w-5" />}</button>)}</div>
          <button disabled={selected === undefined || loading} onClick={next} className="btn-primary mt-6 w-full">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : current === questions.length - 1 ? (isCreator ? "Create My Challenge 🔥" : "Reveal My Result 👀") : "Next"}<ArrowRight className="h-5 w-5" /></button>
        </section>
        <p className="mt-4 text-center text-xs text-slate-400">Your friend's original answers stay hidden until the final reveal.</p>
      </div>
    </Shell>;
  }

  if (screen === "share") return (
    <Shell>
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-600 text-white shadow-xl"><Zap className="h-9 w-9" /></div>
        <Badge>Your challenge is ready</Badge>
        <h1 className="mt-3 text-4xl font-black">Now let's see who actually knows you. 🔥</h1>
        <div className="mt-7 rounded-[2rem] border bg-white p-6 text-left shadow-xl">
          <p className="text-sm font-bold text-slate-500">Your private challenge link</p>
          <div className="mt-2 break-all rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">{challengeUrl}</div>
          <button onClick={() => share()} className="btn-primary mt-4 w-full"><Share2 className="h-5 w-5" /> {copied ? "Link copied!" : "Share with Friend"}</button>
          <button onClick={() => { navigator.clipboard?.writeText(challengeUrl); setCopied(true); setTimeout(()=>setCopied(false),1800); }} className="btn-secondary mt-3 w-full"><Copy className="h-5 w-5" /> Copy Link</button>
        </div>
        <button onClick={() => setScreen("home")} className="mt-5 font-bold text-slate-500">Create another</button>
      </div>
    </Shell>
  );

  if (screen === "result" && result) return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <div className="text-center"><Badge>YOUR FRIENDCHECK RESULT</Badge><h1 className="mt-4 text-5xl font-black text-slate-950">{result.overallScore}% 🔥</h1><p className="mt-2 text-xl font-black text-violet-600">{result.friendshipType}</p><p className="mt-2 text-slate-500">You actually know {result.creatorName}!</p></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">{[["🧠", "Know them", result.knowledgeScore],["❤️","Vibe match",result.vibeScore],["😂","Fun match",result.funScore]].map(([emoji,title,score])=><div key={title as string} className="rounded-3xl border bg-white p-5 text-center shadow-sm"><div className="text-2xl">{emoji}</div><p className="mt-2 text-xs font-black uppercase text-slate-400">{title}</p><p className="mt-1 text-3xl font-black">{score}%</p></div>)}</div>
        <section className="mt-4 rounded-[2rem] border bg-white p-6 shadow-xl"><h2 className="text-xl font-black">You both matched on ❤️</h2><div className="mt-4 grid gap-3">{result.matched.length ? result.matched.map((m,i)=><div key={i} className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm font-bold text-slate-700">{m.question}</p><p className="mt-1 font-black text-emerald-700">{m.answer}</p></div>) : <p className="text-sm text-slate-500">No exact matches this time — try another friend!</p>}</div></section>
        {result.missed.length > 0 && <section className="mt-4 rounded-[2rem] border bg-white p-6 shadow-xl"><h2 className="text-xl font-black">😳 You completely missed</h2><div className="mt-4 grid gap-3">{result.missed.map((m,i)=><div key={i} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold">{m.question}</p><p className="mt-2 text-sm text-slate-500">You guessed: <b>{m.guessed}</b></p><p className="text-sm text-violet-600">They chose: <b>{m.actual}</b></p></div>)}</div></section>}
        <button onClick={() => { setScreen("home"); window.history.replaceState({}, "", "/games"); }} className="btn-primary mt-6 w-full"><Trophy className="h-5 w-5" /> 🔥 Now test YOUR friends</button>
      </div>
    </Shell>
  );

  return <Shell><ErrorBox text={error || "Result not found."} /><button onClick={()=>setScreen("home")} className="btn-secondary mx-auto">Back to FriendCheck</button></Shell>;
}

function Shell({ children }: { children: ReactNode }) {
  return <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-rose-50 via-white to-violet-50 px-4 py-8 sm:py-12">{children}<style jsx>{`
    .btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;border-radius:1rem;background:linear-gradient(90deg,#f43f5e,#7c3aed);padding:.9rem 1.3rem;font-weight:900;color:white;box-shadow:0 12px 30px rgba(124,58,237,.16);transition:.18s}.btn-primary:hover{transform:translateY(-1px)}.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
    .btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;border-radius:1rem;border:1px solid #e2e8f0;background:white;padding:.9rem 1.3rem;font-weight:900;color:#334155}.back{display:inline-flex;align-items:center;gap:.4rem;margin-bottom:1.2rem;font-size:.875rem;font-weight:800;color:#64748b}.input{width:100%;border:1px solid #e2e8f0;border-radius:1rem;background:white;padding:.95rem 1rem;font-weight:700;outline:none}.input:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.12)}
    .option{display:flex;align-items:center;width:100%;border:1px solid #e2e8f0;border-radius:1rem;background:white;padding:1rem;text-align:left;font-weight:800;color:#334155;transition:.15s}.option:hover{border-color:#c4b5fd;background:#faf5ff}.option-active{border-color:#8b5cf6;background:#f5f3ff;color:#5b21b6;box-shadow:0 0 0 2px rgba(139,92,246,.1)}
  `}</style></main>;
}

function Badge({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-xs font-black uppercase tracking-[.2em] text-rose-500">{children}</p>;
}

function ErrorBox({ text }: { text: string }) {
  return <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-sm font-bold text-rose-700">{text}</div>;
}
