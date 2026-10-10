"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Brain, ArrowLeft, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

type Game = "friends" | "crush";
const friendQuestions = [
  { q: "मलाई सबैभन्दा मन पर्ने के हो?", a: ["घुम्न जान ✈️", "खाना खान 🍕", "सुत्न 😴", "Game खेल्न 🎮"] },
  { q: "म खाली समयमा के गर्छु?", a: ["Movie हेर्छु 🎬", "साथीसँग कुरा गर्छु 📱", "घुम्छु 🏃", "सुत्छु 💤"] },
  { q: "मलाई कुन gift मन पर्छ?", a: ["Chocolate 🍫", "Flowers 🌷", "Gadgets 🎧", "Surprise 🎁"] },
  { q: "मेरो dream holiday कस्तो?", a: ["Beach 🏖️", "Mountains 🏔️", "City 🌆", "घरमै आराम 🛋️"] },
  { q: "म कुन कुरामा बढी हाँस्छु?", a: ["Memes 😂", "Jokes 🤣", "Friends 😜", "Funny videos 📹"] },
];
const crushQuestions = [
  { q: "Crush ले message गर्यो भने?", a: ["तुरुन्त reply 😍", "Cool बनेर पछि 😎", "साथीलाई screenshot 😂", "लाज लाग्छ 🙈"] },
  { q: "Perfect date कुन हो?", a: ["Coffee ☕", "Movie 🎬", "Long walk 🌙", "Food date 🍕"] },
  { q: "मन परेको मान्छे अगाडि?", a: ["धेरै बोल्छु 😁", "चुप लाग्छु 🤐", "Jokes गर्छु 😂", "Cool बन्छु 😎"] },
  { q: "Love song सुन्दा?", a: ["Dream गर्छु 💭", "गुनगुनाउँछु 🎵", "Skip गर्छु ⏭️", "Smile गर्छु 😊"] },
  { q: "Cute surprise पाउँदा?", a: ["Blush 🙈", "Happy dance 💃", "Thank you ❤️", "Speechless 😳"] },
];
const personalities = ["Hopeless Romantic 💕", "Cool Lover 😎", "Secret Love Detective 🕵️", "Shy Sweetheart 🌸"];
function encodeAnswers(values: number[]) { return values.join(""); }
function decodeAnswers(raw: string | null) {
  if (!raw || !/^[0-3]{5}$/.test(raw)) return null;
  return raw.split("").map(Number);
}
export default function ReferralGamesPage() {
  const [game, setGame] = useState<Game | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [challenge, setChallenge] = useState<number[] | null>(null);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const incoming = decodeAnswers(query.get("answers"));
    if (query.get("game") === "friends" && incoming) {
      setGame("friends");
      setChallenge(incoming);
    }
  }, []);
  const questions = game === "friends" ? friendQuestions : crushQuestions;
  const isCreator = game === "friends" && !challenge;
  const reset = () => { setGame(null); setAnswers([]); setStep(0); setChallenge(null); setFinished(false); window.history.replaceState(null, "", window.location.pathname); };
  const choose = (index: number) => {
    const next = [...answers, index];
    setAnswers(next);
    if (next.length === questions.length) setFinished(true);
    else setStep(next.length);
  };
  const share = async (url: string, title: string) => {
    if (navigator.share) {
      try { await navigator.share({ title, text: title, url }); return; }
      catch { /* User cancelled or native sharing unavailable. */ }
    }
    try { await navigator.clipboard.writeText(url); toast.success("Challenge link copied!"); }
    catch { toast.error("Could not copy. Please use your browser share menu."); }
  };
  const score = challenge ? answers.filter((v, i) => v === challenge[i]).length : 0;
  const friendLink = typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}?game=friends&answers=${encodeAnswers(answers)}`;
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="rounded-lg border p-2" aria-label="Back to RoomKhoj"><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-2xl font-bold">Play & Challenge Friends 🎉</h1><p className="text-sm text-muted-foreground">रमाइलो खेल, साथीलाई challenge र shareable result।</p></div>
      </div>
      {!game ? <><Link href="/funny-check" className="block rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-sm"><h2 className="text-xl font-bold">🤣 तिमी कत्तिको चुतिया छौ?</h2><p className="mt-2 text-sm">10 funny questions • साथीलाई link share गर • उसले के छान्यो monitoring मा हेर!</p><span className="mt-3 inline-block font-semibold">Play & Monitor →</span></Link><div className="grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => { setGame("friends"); setAnswers([]); setStep(0); }} className="rounded-2xl border bg-card p-6 text-left shadow-sm hover:border-primary">
          <Brain className="mb-3 h-8 w-8 text-primary" /><h2 className="text-xl font-bold">How Well Do You Know Me?</h2>
          <p className="mt-2 text-sm text-muted-foreground">5 प्रश्नको आफ्नो answer छान्नुहोस्। Link share गरेर साथीले कति मिलाउँछ हेर्नुहोस्।</p>
          <p className="mt-4 font-semibold text-primary">Create your challenge →</p>
        </button>
        <button type="button" onClick={() => { setGame("crush"); setAnswers([]); setStep(0); }} className="rounded-2xl border bg-card p-6 text-left shadow-sm hover:border-pink-400">
          <Heart className="mb-3 h-8 w-8 text-pink-600" /><h2 className="text-xl font-bold">Secret Crush Meter</h2>
          <p className="mt-2 text-sm text-muted-foreground">5 funny love questions को उत्तर दिनुहोस् र आफ्नो personality result share गर्नुहोस्।</p>
          <p className="mt-4 font-semibold text-pink-600">Play now →</p>
        </button>
      </div></> : <Card>
        <CardHeader>
          <CardTitle>{game === "friends" ? "🧠 Best Friend Challenge" : "❤️ Secret Crush Meter"}</CardTitle>
          <CardDescription>{game === "friends" ? (challenge ? "साथीको उत्तर अनुमान गर्नुहोस्!" : "आफ्नो उत्तर छानेर साथीलाई quiz पठाउनुहोस्।") : "यो केवल मनोरञ्जनका लागि हो; वास्तविक प्रेमको परीक्षण होइन।"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!finished ? <>
            <p className="text-xs font-semibold text-muted-foreground">QUESTION {step + 1} / {questions.length}</p>
            <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / questions.length) * 100}%` }} /></div>
            <h3 className="text-lg font-semibold">{questions[step].q}</h3>
            <div className="grid gap-2">{questions[step].a.map((option, i) => <button key={option} type="button" onClick={() => choose(i)} className="rounded-xl border px-4 py-3 text-left font-medium transition hover:border-primary hover:bg-muted/50">{option}</button>)}</div>
          </> : game === "friends" && isCreator ? <>
            <h3 className="text-xl font-bold">तिम्रो Challenge तयार भयो! 🎉</h3>
            <p className="text-sm text-muted-foreground">साथीलाई link पठाऊ। उसले 5 प्रश्न guess गरेपछि आफ्नो score देख्नेछ। तिमीलाई उसको result हेर्न उसैले share गर्नुपर्छ।</p>
            <Button className="w-full" onClick={() => share(friendLink, "तिमी मलाई कति चिन्छौ? मेरो 5-question challenge खेल!")}><Share2 className="mr-2 h-4 w-4" /> Share challenge</Button>
            <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(friendLink).then(() => toast.success("Link copied")).catch(() => toast.error("Copy failed")); }}><Copy className="mr-2 h-4 w-4" /> Copy link</Button>
            <p className="text-xs text-muted-foreground">यो हल्का game हो। Quiz का उत्तर link भित्र encode हुन्छन्, त्यसैले गोप्य जानकारी प्रयोग नगर्नुहोस्।</p>
          </> : game === "friends" ? <>
            <div className="rounded-xl bg-muted p-5 text-center"><p className="text-4xl font-black">{score}/5</p><p className="mt-2 font-semibold">{score === 5 ? "Perfect Bestie! 🏆" : score >= 3 ? "तिमी राम्रो साथी रहेछौ! 😎" : "अझै चिन्न बाँकी रहेछ! 😂"}</p></div>
            <Button className="w-full" onClick={() => share(window.location.href, `मैले Best Friend Challenge मा ${score}/5 ल्याएँ! तिमी कति ल्याउँछौ?`)}><Share2 className="mr-2 h-4 w-4" /> Share score</Button>
          </> : <>
            <div className="rounded-xl bg-muted p-5 text-center"><p className="text-3xl">💘</p><h3 className="mt-2 text-xl font-bold">{personalities[answers.reduce((a, b) => a + b, 0) % personalities.length]}</h3><p className="mt-2 text-sm text-muted-foreground">Just for fun! साथीलाई पनि आफ्नो result पत्ता लगाउन challenge गर।</p></div>
            <Button className="w-full" onClick={() => share(`${window.location.origin}${window.location.pathname}`, "मेरो Love Personality पत्ता लाग्यो! तिमी पनि Secret Crush Meter खेल ❤️")}><Share2 className="mr-2 h-4 w-4" /> Challenge a friend</Button>
          </>}
          <Button variant="outline" className="w-full" onClick={reset}>Back to games</Button>
        </CardContent>
      </Card>}
      <p className="text-center text-xs text-muted-foreground">Games are for entertainment only. Playing does not create wallet rewards or verified referrals.</p>
    </div>
  );
}
