"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRole } from "@/stores/user-store";
import {
  MessageCircle,
  X,
  Send,
  User,
  ChevronDown,
  MapPin,
  Mic,
  MicOff,
  Video,
  Coins,
  Trash2,
  Loader2,
  Sparkles,
  PanelLeft,
  Plus,
  MessageSquare,
  ExternalLink,
  Phone,
  Home,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/http/services/wallet.service";
import useTokenStore from "@/store";

interface RoomItem { id?: string; title?: string; price?: string; location?: string; contact?: string; link?: string; mediaUrl?: string; }
interface RoomPostingPreview { title?: string; type?: string; city?: string; area?: string; rent?: number; capacity?: number; amenities?: string[]; availableFrom?: string; contactPhone?: string; }
interface RoomPostingResult { id?: string; title?: string; approvalStatus?: string; }
interface RoomRequestPreview { fullName?: string; contactPhone?: string; city?: string; preferredArea?: string; budget?: number; roomType?: string; numberOfPeople?: number; tenantType?: string; moveInDate?: string; }
interface JobItem { id?: string; number?: number; jobTitle?: string; companyName?: string; location?: string; salary?: string | number | null; experience?: string | null; contactPhone?: string | null; contact?: string | null; description?: string | null; matchPercent?: number; createdAt?: string; }
interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  timestamp: string;
  roomDetails?: RoomItem;
  roomsList?: RoomItem[];
  jobDetails?: JobItem;
  jobsList?: JobItem[];
  nextAction?: string;
  roomId?: string;
  roomPostingPreview?: RoomPostingPreview;
  roomPosting?: RoomPostingResult;
  roomRequestId?: string;
  roomRequestPreview?: RoomRequestPreview;
  confirmation?: { type?: string; text?: string };
  quickReplies?: string[];
  reviewEligible?: boolean;
}
interface ChatSession { id: string; title: string; messages: ChatMessage[]; }

function isChatSession(value: unknown): value is ChatSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<ChatSession>;
  return typeof session.id === "string" && typeof session.title === "string" && Array.isArray(session.messages);
}
function sanitizeTitle(text: string): string {
  if (!text) return "Room Search";
  const cleanText = text.replace(/(madarchod|bhenchod|radi|lado|mucchi|fuck|shit|bitch)/gi, "***").trim();
  if (cleanText.replace(/\*/g, "").length < 2) return "New Conversation";
  return cleanText.length > 22 ? cleanText.slice(0, 22) + "..." : cleanText;
}

export function Chatbot() {
  const userStore = useUserRole() as any;
  const token = useTokenStore((state) => state.token);
  const [guestSessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    const storageKey = "roomkhoj_guest_session_id";
    const existing = localStorage.getItem(storageKey);
    if (existing && /^[A-Za-z0-9_-]{16,128}$/.test(existing)) return existing;
    const created = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(storageKey, created);
    return created;
  });

  const loggedInUserId = userStore?.user?.id || userStore?.user?._id || userStore?.id || userStore?.profile?.id || userStore?.profile?._id || null;
  const CHAT_KEY = `roomkhoj_chat_history_${loggedInUserId || "guest"}`;
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: walletBalanceData } = useQuery({ queryKey: ["wallet-balance"], queryFn: () => walletService.getBalance(), enabled: !!loggedInUserId, staleTime: 30_000 });
  const balance = Number(walletBalanceData?.balance ?? 0);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceConversationMode, setVoiceConversationMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [documentScanProgress, setDocumentScanProgress] = useState(0);
  const [documentScanStep, setDocumentScanStep] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ url: string; type: "image" | "video" | "file"; rawFile: File } | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const voiceConversationRef = useRef(false);
  const activeVoiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceVadFrameRef = useRef<number | null>(null);
  const voiceTurnProcessingRef = useRef(false);

  const initDefaultMessages = useCallback(() => [{ id: "1", role: "bot" as const, text: "Namaste! 🙏 How can I help you find your room today on RoomKhoj?", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }], []);

  const closeChatbot = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("close-roomkhoj-chatbot"));
  }, []);

  useEffect(() => {
    const openChatbot = () => setIsOpen(true);
    window.addEventListener("open-roomkhoj-chatbot", openChatbot);
    return () => window.removeEventListener("open-roomkhoj-chatbot", openChatbot);
  }, []);

  useEffect(() => { setMessages(initDefaultMessages()); }, [loggedInUserId, initDefaultMessages]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(CHAT_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) setSessions(parsed.filter(isChatSession));
      else window.localStorage.removeItem(CHAT_KEY);
    } catch { window.localStorage.removeItem(CHAT_KEY); }
  }, [CHAT_KEY]);

  useEffect(() => {
    return () => {
      if (selectedFile?.url) URL.revokeObjectURL(selectedFile.url);
      if (mediaRecorderRef.current?.state === "recording") { try { mediaRecorderRef.current.stop(); } catch {} }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (voiceVadFrameRef.current !== null) cancelAnimationFrame(voiceVadFrameRef.current);
      if (audioContextRef.current) void audioContextRef.current.close().catch(() => undefined);
      if (activeVoiceAudioRef.current) { activeVoiceAudioRef.current.pause(); activeVoiceAudioRef.current.src = ""; }
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [selectedFile]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping, isOpen]);

  const saveCurrentSession = useCallback((currentMsgs: ChatMessage[]) => {
    if (currentMsgs.length <= 1) return;
    const firstUserMsg = currentMsgs.find((m) => m.role === "user")?.text || "New Conversation";
    const existingId = currentSessionId || Date.now().toString();
    if (!currentSessionId) setCurrentSessionId(existingId);
    const activeSession: ChatSession = { id: existingId, title: sanitizeTitle(firstUserMsg), messages: currentMsgs };
    setSessions((prev) => {
      const updated = [activeSession, ...prev.filter((s) => s.id !== activeSession.id)].slice(0, 15);
      if (typeof window !== "undefined") window.localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [CHAT_KEY, currentSessionId]);

  const stopMediaStream = () => { mediaStreamRef.current?.getTracks().forEach((track) => track.stop()); mediaStreamRef.current = null; };

  const transcribeRecordedAudio = async (blob: Blob) => {
    if (!token) throw new Error("Live voice requires login.");
    const form = new FormData();
    const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
    form.append("audio", blob, `roomkhoj-live-voice.${extension}`);
    const response = await fetch("https://api.roomkhoj.com/ai-call/transcribe", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || "Voice transcription failed.");
    return String(data?.data?.text || "").trim();
  };

  const speakBotReply = async (text: string) => {
    if (!voiceConversationRef.current || !text.trim()) return;
    if (!token) return;
    try {
      setVoiceStatus("AI बोल्दैछ...");
      const response = await fetch("https://api.roomkhoj.com/ai-call/speak", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ text: text.slice(0, 1200) }) });
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      activeVoiceAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(audioUrl); activeVoiceAudioRef.current = null; setVoiceStatus("सुन्दैछु..."); window.setTimeout(() => void startHandsFreeListening(), 200); };
      await audio.play();
    } catch { setVoiceStatus("Voice playback failed"); }
  };

  const startHandsFreeListening = async () => {
    if (!voiceConversationRef.current || voiceTurnProcessingRef.current || mediaRecorderRef.current?.state === "recording" || activeVoiceAudioRef.current) return;
    if (!token || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
      mediaStreamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      let speechStarted = false;
      let speechStartedAt = 0;
      let lastSpeechAt = performance.now();
      const listenStartedAt = performance.now();
      let stoppedByVad = false;
      recorder.ondataavailable = (event) => { if (event.data?.size) recordedChunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        if (voiceVadFrameRef.current !== null) cancelAnimationFrame(voiceVadFrameRef.current);
        if (audioContextRef.current) void audioContextRef.current.close().catch(() => undefined);
        stopMediaStream();
        setIsRecording(false);
        mediaRecorderRef.current = null;
        if (!voiceConversationRef.current || !speechStarted || !stoppedByVad) return;
        voiceTurnProcessingRef.current = true;
        setVoiceStatus("आवाज बुझ्दैछ...");
        try {
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
          recordedChunksRef.current = [];
          const transcript = await transcribeRecordedAudio(blob);
          if (transcript) await sendMessage(transcript);
        } finally { voiceTurnProcessingRef.current = false; }
      };
      recorder.start(250);
      setIsRecording(true);
      setVoiceStatus("सुन्दैछु... बोल्नुहोस्");
      const samples = new Uint8Array(analyser.fftSize);
      const monitor = () => {
        if (recorder.state !== "recording" || !voiceConversationRef.current) return;
        analyser.getByteTimeDomainData(samples);
        let sumSquares = 0;
        for (let i = 0; i < samples.length; i += 1) { const n = (samples[i] - 128) / 128; sumSquares += n * n; }
        const rms = Math.sqrt(sumSquares / samples.length);
        const now = performance.now();
        if (rms >= 0.022) { if (!speechStarted) { speechStarted = true; speechStartedAt = now; } lastSpeechAt = now; }
        if (speechStarted && now - lastSpeechAt >= 850 && now - speechStartedAt >= 250) { stoppedByVad = true; recorder.stop(); return; }
        if (!speechStarted && now - listenStartedAt >= 6500) { recorder.stop(); return; }
        voiceVadFrameRef.current = requestAnimationFrame(monitor);
      };
      voiceVadFrameRef.current = requestAnimationFrame(monitor);
    } catch { setVoiceStatus("Microphone access failed"); }
  };

  const toggleVoiceRecording = async () => {
    if (voiceConversationRef.current) return;
    voiceConversationRef.current = true;
    setVoiceConversationMode(true);
    setVoiceStatus("Live Voice सुरु हुँदैछ...");
    await speakBotReply("नमस्कार! म RoomKhoj AI हुँ। तपाईंलाई के सहयोग गरौँ?");
  };
  const stopVoiceConversation = () => {
    voiceConversationRef.current = false;
    setVoiceConversationMode(false);
    setVoiceStatus("");
    setIsRecording(false);
    if (mediaRecorderRef.current?.state === "recording") { try { mediaRecorderRef.current.stop(); } catch {} }
    stopMediaStream();
    if (activeVoiceAudioRef.current) { activeVoiceAudioRef.current.pause(); activeVoiceAudioRef.current.src = ""; activeVoiceAudioRef.current = null; }
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation) return;
    setLocationRequested(true);
    navigator.geolocation.getCurrentPosition((position) => { setLocationRequested(false); const { latitude, longitude } = position.coords; void sendMessage(`📍 Shared Location: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`); }, () => setLocationRequested(false), { enableHighAccuracy: true });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (selectedFile?.url) URL.revokeObjectURL(selectedFile.url);
    const fileUrl = URL.createObjectURL(file);
    const type: "image" | "video" | "file" = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
    setSelectedFile({ url: fileUrl, type, rawFile: file });
    if (type === "file") { setDocumentScanProgress(24); setDocumentScanStep("Scanning document..."); } else { setDocumentScanProgress(0); setDocumentScanStep(""); }
  };

  const sendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if ((!textToSend.trim() && !selectedFile) || isTyping) return;
    if (loggedInUserId && balance < 1) { alert("AI चलाउन wallet balance आवश्यक छ। कृपया wallet top-up गर्नुहोस्।"); return; }
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: "user", text: textToSend, mediaUrl: selectedFile?.url, mediaType: selectedFile?.type, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages); setInput(""); setSelectedFile(null); setIsTyping(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }; if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("https://api.roomkhoj.com/ai-v3/chat", { method: "POST", headers, body: JSON.stringify({ message: textToSend.slice(0, 2000), guestSessionId: loggedInUserId ? undefined : guestSessionId, hasMedia: Boolean(newUserMsg.mediaUrl), mediaType: newUserMsg.mediaType }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "API Error");
      if (typeof data?.billing?.balance === "number") queryClient.setQueryData(["wallet-balance"], (old: any) => ({ ...(old || {}), balance: data.billing.balance }));
      const obj = typeof data?.reply === "object" && data.reply !== null ? data.reply : typeof data?.response === "object" && data.response !== null ? data.response : typeof data?.data === "object" && data.data !== null ? data.data : data;
      const botReplyText = typeof obj === "string" ? obj : String(obj?.reply || obj?.text || obj?.message || obj?.content || data?.reply || "I found matching details for your search query.");
      const botReply: ChatMessage = { id: (Date.now() + 1).toString(), role: "bot", text: botReplyText, roomDetails: obj?.roomDetails || obj?.details, roomsList: obj?.roomsList || obj?.rooms, jobDetails: obj?.jobDetails || data?.jobDetails, jobsList: obj?.jobsList || obj?.jobs || data?.jobsList || data?.jobs, quickReplies: Array.isArray(obj?.quickReplies) ? obj.quickReplies : undefined, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      const finalMsgs = [...updatedMessages, botReply]; setMessages(finalMsgs); saveCurrentSession(finalMsgs);
      if (voiceConversationRef.current && botReplyText.trim()) void speakBotReply(botReplyText);
    } catch {
      const fallbackReply: ChatMessage = { id: (Date.now() + 1).toString(), role: "bot", text: "Error: Server connection problem. Please try again.", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setMessages([...updatedMessages, fallbackReply]);
    } finally { setIsTyping(false); }
  };

  return (
    <>
      <button type="button" onClick={() => isOpen ? closeChatbot() : setIsOpen(true)} className={cn("hidden md:flex fixed bottom-6 right-6 z-[10000] h-12 w-12 items-center justify-center rounded-full border shadow-xl", isOpen ? "bg-slate-800 text-white" : "bg-gradient-to-r from-red-600 to-rose-600 text-white")} aria-label="Toggle AI Assistant">
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-900 dark:bg-[#212121] dark:text-white">
            <div className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#212121]/95">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowHistorySidebar((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-lg md:hidden"><PanelLeft className="w-4 h-4" /></button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 dark:bg-white"><Sparkles className="h-4 w-4 text-white dark:text-slate-900" /></div>
                <div><h2 className="text-sm font-semibold">RoomKhoj AI</h2><span className="text-[10px] text-slate-500">Rooms • Jobs • Career</span></div>
              </div>
              <div className="flex items-center gap-2"><div className="rounded-lg border px-2.5 py-1.5 text-[11px]"><Coins className="mr-1 inline w-3 h-3" />Rs.{balance}</div><button type="button" onClick={closeChatbot} className="flex h-9 w-9 items-center justify-center rounded-lg"><X className="w-4 h-4" /></button></div>
            </div>

            <div className="flex h-10 shrink-0 items-center justify-between border-b px-3 text-[11px] text-slate-500"><span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" />Find rooms near your location</span><button type="button" onClick={requestUserLocation} disabled={locationRequested} className="rounded-lg bg-slate-900 px-2.5 py-1 text-white">{locationRequested ? "Detecting..." : "Detect Location"}</button></div>

            <div className="relative flex min-h-0 flex-1 overflow-hidden">
              <div className={cn("fixed inset-y-0 left-0 z-40 w-[260px] border-r bg-[#f9f9f9] p-2 transition-transform md:translate-x-0 dark:bg-[#171717]", showHistorySidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0")}> 
                <button type="button" onClick={() => { setCurrentSessionId(null); setMessages(initDefaultMessages()); setShowHistorySidebar(false); }} className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5"><Plus className="h-4 w-4" />New chat</button>
                <p className="px-2 py-2 text-[11px] text-slate-500">Recent Chats</p>
                {sessions.map((sess) => <button key={sess.id} type="button" onClick={() => { setCurrentSessionId(sess.id); setMessages(sess.messages); setShowHistorySidebar(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs"><MessageSquare className="w-3.5 h-3.5" /><span className="truncate">{sess.title}</span></button>)}
                {sessions.length > 0 && <button type="button" onClick={() => { setSessions([]); window.localStorage.removeItem(CHAT_KEY); }} className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-red-500"><Trash2 className="w-3.5 h-3.5" />Clear History</button>}
              </div>

              <div className="ml-0 flex-1 overflow-y-auto bg-white pb-[220px] pt-5 md:ml-[260px] dark:bg-[#212121]">
                <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 sm:px-6">
                  {messages.map((msg) => <div key={msg.id} className={cn("flex items-start gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>{msg.role === "bot" && <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900"><Sparkles className="h-3.5 w-3.5 text-white" /></div>}<div className={cn("max-w-[85%] text-[14px] leading-6", msg.role === "user" ? "rounded-[18px] bg-[#f4f4f4] px-4 py-2.5" : "text-slate-800 dark:text-slate-100")}>{msg.mediaUrl && msg.mediaType === "image" && <img src={msg.mediaUrl} alt="attachment" className="mb-2 h-36 w-full rounded-md object-cover" />}{msg.roomDetails && <div className="mb-2 rounded-xl border p-2.5"><h4 className="font-bold"><Home className="mr-1 inline w-3.5 h-3.5" />{msg.roomDetails.title}</h4>{msg.roomDetails.location && <p className="text-xs">{msg.roomDetails.location}</p>}</div>}{msg.jobsList?.map((job) => <div key={job.id} className="mb-2 rounded-xl border p-2.5 text-xs"><strong>{job.jobTitle}</strong>{job.companyName && <div>{job.companyName}</div>}</div>)}<p className="whitespace-pre-wrap break-words">{msg.text}</p>{msg.quickReplies?.map((reply) => <button key={reply} type="button" onClick={() => void sendMessage(reply)} className="mr-2 mt-2 rounded-full border px-3 py-1.5 text-xs">{reply}</button>)}<span className="block text-right text-[8px] opacity-60">{msg.timestamp}</span></div>{msg.role === "user" && <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-700"><User className="w-3 h-3 text-white" /></div>}</div>)}
                  {isTyping && <div className="flex items-center gap-3"><Sparkles className="h-4 w-4 animate-pulse" /><span className="text-sm text-slate-500">Thinking...</span></div>}
                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-white via-white to-white/0 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-6 md:left-[260px] dark:from-[#212121] dark:via-[#212121]">
                <div className="mx-auto w-full max-w-[760px]">
                  <div className="rounded-[32px] border bg-white px-4 pb-3 pt-4 shadow-lg dark:bg-[#212121]">
                    {selectedFile?.type === "file" && <div className="mb-3 rounded-2xl border p-3"><FileText className="mr-2 inline h-5 w-5" />{selectedFile.rawFile.name}<div className="mt-2 text-xs text-slate-500">{documentScanStep} {documentScanProgress}%</div></div>}
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" />
                    <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Ask RoomKhoj AI" rows={1} className="block min-h-[38px] w-full resize-none bg-transparent px-1 py-1 text-[18px] outline-none" />
                    <div className="mt-2 flex items-center justify-between gap-2"><button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-11 w-11 items-center justify-center rounded-full"><Plus className="h-7 w-7" /></button><div className="ml-auto flex items-center gap-1">{voiceConversationMode && <button type="button" onClick={stopVoiceConversation} className="hidden h-9 rounded-full border border-red-200 px-3 text-xs text-red-600 sm:flex">End voice</button>}<button type="button" onClick={() => void toggleVoiceRecording()} className={cn("flex h-11 w-11 items-center justify-center rounded-full", isRecording ? "bg-red-100 text-red-600" : voiceConversationMode ? "bg-emerald-100 text-emerald-700" : "")}>{isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}</button><button type="button" onClick={() => void sendMessage()} disabled={(!input.trim() && !selectedFile) || isTyping} className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white disabled:bg-slate-100 disabled:text-slate-400">{isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button></div></div>
                  </div>
                  {voiceConversationMode && <div className="mt-2 text-center text-[11px] text-emerald-700">{voiceStatus || "सुन्दैछु..."}</div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
