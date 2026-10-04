"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Brain, Check, Gamepad2, Share2, Sparkles, Users } from "lucide-react";

type Question = {
  text: string;
  options: string[];
};

const questions: Question[] = [
  {
    text: "तिमी रिसाएको बेला सबैभन्दा पहिले के गर्छौ?",
    options: ["🤐 चुप लाग्छु", "😤 झर्किन्छु", "😂 मजाक गर्छु", "📱 कसैलाई message गर्छु"],
  },
  {
    text: "तिमीलाई अचानक Rs. 1 लाख मिल्यो भने?",
    options: ["🛍️ Shopping", "✈️ घुम्न जाने", "💰 Save गर्ने", "🍕 साथीहरूलाई treat"],
  },
  {
    text: "तिमीलाई साथीले surprise दियो भने?",
    options: ["🥹 भावुक हुन्छु", "😂 हाँस्छु", "🤗 तुरुन्त hug", "😎 Cool बन्न खोज्छु"],
  },
  {
    text: "तिमीलाई secretly सबैभन्दा मन पर्ने कुरा?",
    options: ["🎵 Music", "🍕 Food", "🎮 Games", "🌙 Late-night talks"],
  },
  {
    text: "तिम्रो personality एउटा शब्दमा?",
    options: ["😂 Funny", "❤️ Caring", "😈 Chaotic", "🧠 Thoughtful"],
  },
];

export default function GamesPage() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const progress = ((current + (started ? 1 : 0)) / questions.length) * 100;
  const score = useMemo(() => Math.min(99, 70 + answers.length * 4), [answers]);

  const choose = (index: number) => {
    const next = [...answers, index];
    setAnswers(next);
    if (current < questions.length - 1) setCurrent(current + 1);
    else setStarted(false);
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.origin + "/games" : "/games";
    const text = "I just took this crazy friendship test 😂 Can you beat me?";
    try {
      if (navigator.share) {
        await navigator.share({ title: "FriendCheck", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // User cancelled the native share sheet.
    }
  };

  if (started) {
    const question = questions[current];
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-rose-50 via-white to-violet-50 px-4 py-8">
        <div className="mx-auto max-w-xl">
          <div className="mb-6 flex items-center justify-between text-sm font-bold text-slate-500">
            <span>Question {current + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
          </div>

          <section className="rounded-3xl border border-white bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Brain className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{question.text}</h1>
            <div className="mt-7 grid gap-3">
              {question.options.map((option, index) => (
                <button
                  key={option}
                  onClick={() => choose(index)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 active:scale-[.99]"
                >
                  {option}
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (answers.length === questions.length) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-rose-50 via-white to-violet-50 px-4 py-10">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-600 text-white shadow-xl">
            <Sparkles className="h-9 w-9" />
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[.2em] text-rose-500">Your result is ready 👀</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">{score}% — Best Friend Level ❤️</h1>
          <p className="mx-auto mt-4 max-w-md text-slate-600">
            We found something interesting. Challenge a friend and see whether they can guess your answers.
          </p>

          <div className="mt-8 rounded-3xl border bg-white p-6 text-left shadow-xl">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-violet-600" />
              <div>
                <p className="font-black text-slate-900">Make it a two-player game</p>
                <p className="text-sm text-slate-500">Your friend makes the result more interesting.</p>
              </div>
            </div>
            <button onClick={share} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800">
              <Share2 className="h-5 w-5" />
              {copied ? "Link copied!" : "Challenge a Friend"}
            </button>
          </div>

          <button
            onClick={() => { setAnswers([]); setCurrent(0); }}
            className="mt-5 font-bold text-slate-500 hover:text-slate-900"
          >
            Play again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-rose-50 via-white to-violet-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-[2rem] border border-white bg-white p-7 shadow-2xl sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-violet-600 text-white shadow-lg">
              <Gamepad2 className="h-8 w-8" />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-[.2em] text-rose-500">FriendCheck</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              How well does your best friend really know you? 👀
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
              Answer 5 quick questions. Challenge a friend. See how well they actually know you.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-violet-600 px-7 py-4 font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5"
            >
              Start Challenge <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["🧠", "Answer", "5 fun questions"],
              ["👀", "Challenge", "Invite a friend"],
              ["❤️", "Reveal", "Compare your answers"],
            ].map(([emoji, title, text]) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className="text-2xl">{emoji}</div>
                <p className="mt-2 font-black text-slate-900">{title}</p>
                <p className="text-xs font-semibold text-slate-500">{text}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-400">
            <Check className="h-4 w-4" /> Sharing is always optional and user-initiated.
          </p>
        </section>
      </div>
    </main>
  );
}
