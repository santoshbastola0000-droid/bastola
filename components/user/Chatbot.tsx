"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRole } from "@/stores/user-store";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ChevronDown,
  MapPin,
  Mic,
  MicOff,
  Paperclip,
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
  Briefcase,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/http/services/wallet.service";

interface RoomItem {
  id?: string;
  title?: string;
  price?: string;
  location?: string;
  contact?: string;
  link?: string;
  mediaUrl?: string;
}

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
}
interface JobItem {
  id?: string;
  number?: number;
  jobTitle?: string;
  companyName?: string;
  location?: string;
  salary?: string | number | null;
  experience?: string | null;
  contactPhone?: string | null;
  contact?: string | null;
  description?: string | null;
  matchPercent?: number;
  createdAt?: string;
}
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}

function isChatSession(value: unknown): value is ChatSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<ChatSession>;
  return (
    typeof session.id === "string" &&
    typeof session.title === "string" &&
    Array.isArray(session.messages)
  );
}

const QUICK_SUGGESTIONS = [
  "🔍 Find 1BHK rooms near me",
  "💰 Cheap rooms under Rs 10,000",
  "📍 Rooms in Kathmandu / Pokhara",
];

function sanitizeTitle(text: string): string {
  if (!text) return "Room Search";

  const profanityRegex = /(madarchod|bhenchod|radi|lado|mucchi|fuck|shit|bitch)/gi;
  let cleanText = text.replace(profanityRegex, "***").trim();

  if (cleanText.replace(/\*/g, "").length < 2) {
    return "New Conversation";
  }

  return cleanText.length > 22 ? cleanText.slice(0, 22) + "..." : cleanText;
}

export function Chatbot() {
  const userStore = useUserRole() as any;
  const loggedInUserId =
    userStore?.user?.id ||
    userStore?.user?._id ||
    userStore?.id ||
    userStore?.profile?.id ||
    userStore?.profile?._id ||
    null;

  const CHAT_KEY = `roomkhoj_chat_history_${loggedInUserId || "guest"}`;

  const [isOpen, setIsOpen] = useState(false);
const queryClient = useQueryClient();

const { data: walletBalanceData } = useQuery({
  queryKey: ["wallet-balance"],
  queryFn: () => walletService.getBalance(),
  enabled: !!loggedInUserId,
  staleTime: 30_000,
});

const balance = Number(walletBalanceData?.balance ?? 0);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    type: "image" | "video" | "file";
    rawFile: File;
  } | null>(null);
useEffect(() => {
  const openChatbot = () => {
    setIsOpen(true);
  };

  window.addEventListener("open-roomkhoj-chatbot", openChatbot);

  return () => {
    window.removeEventListener("open-roomkhoj-chatbot", openChatbot);
  };
}, []);


  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const initDefaultMessages = useCallback(() => {
    return [
      {
        id: "1",
        role: "bot" as const,
        text: "Namaste! 🙏 How can I help you find your room today on RoomKhoj?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  }, []);

  useEffect(() => {
    setMessages(initDefaultMessages());
  }, [loggedInUserId, initDefaultMessages]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(CHAT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSessions(parsed.filter(isChatSession));
        } else {
          window.localStorage.removeItem(CHAT_KEY);
        }
      } catch (e) {
        console.error("Failed to parse chat history:", e);
        window.localStorage.removeItem(CHAT_KEY);
      }
    }
  }, [CHAT_KEY]);

  useEffect(() => {
    return () => {
      if (selectedFile?.url) {
        URL.revokeObjectURL(selectedFile.url);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [selectedFile]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const saveCurrentSession = useCallback(
    (currentMsgs: ChatMessage[]) => {
      if (currentMsgs.length <= 1) return;

      const firstUserMsg = currentMsgs.find((m) => m.role === "user")?.text || "New Conversation";
      const titleText = sanitizeTitle(firstUserMsg);

      const existingId = currentSessionId || Date.now().toString();
      if (!currentSessionId) {
        setCurrentSessionId(existingId);
      }

      const activeSession: ChatSession = {
        id: existingId,
        title: titleText,
        messages: currentMsgs,
      };

      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== activeSession.id);
        const updated = [activeSession, ...filtered].slice(0, 15);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    },
    [CHAT_KEY, currentSessionId]
  );

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages(initDefaultMessages());
    setShowHistorySidebar(false);
  };

const deductBalanceForText = (text: string) => {
  if (!text) return;

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const cost = Math.max(1, Math.ceil(wordCount / 5));

  queryClient.setQueryData(["wallet-balance"], (old: any) => {
    if (!old) return old;

    return {
      ...old,
      balance: Math.max(0, Number(old.balance ?? 0) - cost),
    };
  });
};
  const toggleVoiceRecording = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported on this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ne-NP";
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript ?? "";
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const requestUserLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationRequested(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationRequested(false);
        sendMessage(`📍 Shared Location: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`);
      },
      () => {
        setLocationRequested(false);
        alert("Unable to access location. Check permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedFile?.url) {
      URL.revokeObjectURL(selectedFile.url);
    }

    const fileUrl = URL.createObjectURL(file);
    const type: "image" | "video" | "file" = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : "file";

    setSelectedFile({ url: fileUrl, type, rawFile: file });
  };

  const removeSelectedFile = () => {
    if (selectedFile?.url) {
      URL.revokeObjectURL(selectedFile.url);
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sanitizeLink = (linkStr?: string) => {
    if (!linkStr) return "#";
    const cleaned = linkStr.replace(/roomservise\.com/gi, "roomkhoj.com");
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      return cleaned;
    }
    return `https://roomkhoj.com${cleaned.startsWith("/") ? "" : "/"}${cleaned}`;
  };

  const sendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if ((!textToSend.trim() && !selectedFile) || isTyping) return;

    if (balance <= 0) {
      alert("Your balance is finished! Please top-up to continue chatting.");
      return;
    }

    deductBalanceForText(textToSend);

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: textToSend,
      mediaUrl: selectedFile?.url,
      mediaType: selectedFile?.type,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput("");
    setSelectedFile(null);
    setIsTyping(true);

    const currentUserId = loggedInUserId || "guest_user";

    try {
      const res = await fetch("https://api.roomkhoj.com/ai-v2/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: String(currentUserId),
          message: textToSend,
          hasMedia: Boolean(newUserMsg.mediaUrl),
          mediaType: newUserMsg.mediaType,
        }),
      });

      let data: any = null;
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        data = { reply: rawText };
      }

      if (!res.ok) {
        throw new Error(data?.message || data?.error || `API Error status: ${res.status}`);
      }

      const responseObj =
        typeof data?.reply === "object" &&
        data.reply !== null
          ? data.reply
          : typeof data?.response === "object" &&
              data.response !== null
            ? data.response
            : typeof data?.data === "object" &&
                data.data !== null
              ? data.data
              : data;
      let botReplyText = "";
      let roomDetails = undefined;
      let roomsList = undefined;
      let jobDetails: JobItem | undefined = undefined;
      let jobsList: JobItem[] | undefined = undefined;
      let mediaUrl: string | undefined = undefined;
      let mediaType: "image" | "video" | "file" | undefined = undefined;

      if (typeof responseObj === "string") {
        botReplyText = responseObj;
      } else if (typeof responseObj === "object" && responseObj !== null) {
        botReplyText =
          responseObj.reply ||
          responseObj.text ||
          responseObj.message ||
          responseObj.content ||
          "";
        roomDetails = responseObj.roomDetails || responseObj.details;
        roomsList = responseObj.roomsList || responseObj.rooms;
        jobDetails =
          responseObj.jobDetails ||
          data?.jobDetails;

        jobsList =
          responseObj.jobsList ||
          responseObj.jobs ||
          data?.jobsList ||
          data?.jobs;
        mediaUrl = responseObj.mediaUrl || responseObj.image;
        mediaType = mediaUrl ? "image" : undefined;
      }

      if (
        !botReplyText &&
        !roomDetails &&
        !roomsList &&
        !jobDetails &&
        !jobsList
      ) {
        botReplyText = "I found matching details for your search query.";
      }

      const botReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: botReplyText,
        mediaUrl,
        mediaType,
        roomDetails,
        roomsList,
        jobDetails,
        jobsList,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMsgs = [...updatedMessages, botReply];
      setMessages(finalMsgs);
      saveCurrentSession(finalMsgs);
    } catch (error: any) {
      console.error("API Error details:", error);
      const fallbackReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: `Error: Server connection problem. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([...updatedMessages, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "hidden md:flex fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-2xl shadow-[0_18px_45px_-12px_rgba(220,38,38,0.55)] items-center justify-center transition-all duration-300 cursor-pointer border border-white/20 backdrop-blur-xl",
          isOpen
            ? "bg-slate-800 text-white hover:bg-slate-900"
            : "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:scale-105 active:scale-95"
        )}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 26,
              filter: "blur(8px)",
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              scale: 0.97,
              y: 18,
              filter: "blur(5px)",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 28,
              mass: 0.8,
            }}
            className="
              fixed
              inset-x-0
              top-0
              bottom-0
              z-[9998]

              flex
              flex-col
              overflow-hidden

              bg-white
              dark:bg-slate-950

              font-sans

              sm:inset-auto
              sm:right-6
              sm:bottom-6
              sm:w-[430px]
              sm:h-[min(720px,calc(100dvh-48px))]
              sm:rounded-[30px]
              sm:border
              sm:border-white/70
              sm:dark:border-white/10
              sm:bg-white/95
              sm:dark:bg-slate-950/95
              sm:backdrop-blur-2xl
              sm:shadow-[0_30px_90px_-20px_rgba(15,23,42,0.45)]
            "
          >
            <div className="
              relative
              z-30
              flex
              shrink-0
              items-center
              justify-between
              overflow-hidden
              border-b
              border-white/10
              bg-gradient-to-r
              from-slate-950
              via-slate-900
              to-red-950
              px-4
              py-3.5
              text-white
              shadow-lg
            ">
              <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full bg-red-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-10 bottom-0 h-20 w-20 rounded-full bg-rose-500/10 blur-2xl" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHistorySidebar((v) => !v)}
                  className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
                  title="Toggle History Sidebar"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>

                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(239,68,68,0)",
                      "0 0 24px rgba(239,68,68,.45)",
                      "0 0 0 rgba(239,68,68,0)",
                    ],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-red-700 shadow-lg"
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </motion.div>
                <div className="relative z-10">
                  <h2 className="text-sm font-bold leading-none tracking-tight">
                    RoomKhoj AI
                  </h2>
                  <span className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
                    Online
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative z-10 flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 backdrop-blur-xl">
                  <Coins className="w-3 h-3" /> Rs.{balance}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="
              z-20
              flex
              shrink-0
              items-center
              justify-between
              border-b
              border-red-100
              bg-gradient-to-r
              from-red-50
              via-rose-50/70
              to-white
              px-4
              py-2.5
              text-[11px]
              font-medium
              text-red-700
              dark:border-red-950
              dark:from-red-950/40
              dark:via-slate-950
              dark:to-slate-950
              dark:text-red-300
            ">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" /> Find rooms near your location
              </span>
              <button
                type="button"
                onClick={requestUserLocation}
                disabled={locationRequested}
                className="ml-2 shrink-0 rounded-full bg-red-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {locationRequested ? "Detecting..." : "Detect Location"}
              </button>
            </div>

            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 z-40 w-[82%] max-w-[290px] bg-slate-950/98 text-white flex flex-col transition-transform duration-300 border-r border-white/10 shadow-2xl backdrop-blur-2xl",
                  showHistorySidebar ? "translate-x-0" : "-translate-x-full"
                )}
              >
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:brightness-105 active:scale-[.98] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> New Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistorySidebar(false)}
                    className="p-1 text-slate-400 hover:text-white ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-1">
                    Recent Chats
                  </p>
                  {sessions.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">No history saved yet.</p>
                  ) : (
                    sessions.map((sess) => (
                      <button
                        key={sess.id}
                        type="button"
                        onClick={() => {
                          setCurrentSessionId(sess.id);
                          setMessages(sess.messages);
                          setShowHistorySidebar(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition cursor-pointer truncate",
                          currentSessionId === sess.id
                            ? "bg-slate-800 text-white font-medium"
                            : "text-slate-300 hover:bg-slate-800/60"
                        )}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sess.title}</span>
                      </button>
                    ))
                  )}
                </div>

                {sessions.length > 0 && (
                  <div className="p-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSessions([]);
                        if (typeof window !== "undefined") {
                          window.localStorage.removeItem(CHAT_KEY);
                        }
                      }}
                      className="w-full text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 py-1.5 hover:bg-slate-800/50 rounded-lg cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear History
                    </button>
                  </div>
                )}
              </div>

              <div className="
                flex-1
                space-y-4
                overflow-y-auto
                overscroll-contain
                bg-gradient-to-b
                from-slate-50
                via-white
                to-slate-50
                px-3
                py-4
                sm:px-4
                dark:from-slate-950
                dark:via-slate-950
                dark:to-slate-900
                [scrollbar-width:thin]
              ">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "bot" && (
                      <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-rose-100 shadow-sm dark:border-red-950 dark:from-red-950 dark:to-slate-900">
                        <Sparkles className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[86%] px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-[20px] text-[13px] leading-relaxed shadow-sm",
                        msg.role === "bot"
                          ? "border border-slate-200/70 bg-white text-slate-800 rounded-bl-md shadow-[0_8px_24px_-14px_rgba(15,23,42,.35)] dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                          : "bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white rounded-br-md shadow-[0_10px_26px_-14px_rgba(220,38,38,.7)]"
                      )}
                    >
                      {msg.mediaUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/15 bg-black/5 w-full">
                          {msg.mediaType === "image" ? (
                            <img
                              src={msg.mediaUrl}
                              alt="Room media"
                              className="w-full h-36 object-cover rounded-md"
                            />
                          ) : (
                            <video src={msg.mediaUrl} controls className="w-full h-36 object-cover rounded-md" />
                          )}
                        </div>
                      )}

                      {msg.roomDetails && (
                        <div className="mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-700 space-y-1.5">
                          {msg.roomDetails.mediaUrl && (
                            <div className="rounded-md overflow-hidden h-32 w-full mb-1.5 border border-slate-200 dark:border-gray-700">
                              <img
                                src={msg.roomDetails.mediaUrl}
                                alt="Room photo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {msg.roomDetails.title && (
                            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              {msg.roomDetails.title}
                            </h4>
                          )}
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                            {msg.roomDetails.price && (
                              <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                <Coins className="w-3 h-3" /> {msg.roomDetails.price}
                              </div>
                            )}
                            {msg.roomDetails.location && (
                              <div className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-red-500 shrink-0" /> <span className="truncate">{msg.roomDetails.location}</span>
                              </div>
                            )}
                          </div>
                          {msg.roomDetails.contact && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-200 pt-0.5">
                              <Phone className="w-3 h-3 text-blue-500 shrink-0" /> {msg.roomDetails.contact}
                            </div>
                          )}
                          {msg.roomDetails.link && (
                            <a
                              href={sanitizeLink(msg.roomDetails.link)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-[11px] transition cursor-pointer"
                            >
                              View Room Details <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}

                      {msg.roomsList && Array.isArray(msg.roomsList) && msg.roomsList.length > 0 && (
                        <div className="mb-2 space-y-2.5">
                          {msg.roomsList.map((room, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-700 space-y-1.5"
                            >
                              {room.mediaUrl && (
                                <div className="rounded-md overflow-hidden h-32 w-full border border-slate-200 dark:border-gray-700 bg-black/5">
                                  <img
                                    src={room.mediaUrl}
                                    alt={room.title || "Room"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              {room.title && (
                                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <Home className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                  {room.title}
                                </h4>
                              )}

                              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                                {room.price && (
                                  <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                    <Coins className="w-3 h-3" /> {room.price}
                                  </div>
                                )}
                                {room.location && (
                                  <div className="flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 text-red-500 shrink-0" /> <span className="truncate">{room.location}</span>
                                  </div>
                                )}
                              </div>

                              {room.contact && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-200">
                                  <Phone className="w-3 h-3 text-blue-500 shrink-0" /> {room.contact}
                                </div>
                              )}

                              {room.link && (
                                <a
                                  href={sanitizeLink(room.link)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-[11px] transition cursor-pointer"
                                >
                                  View on RoomKhoj <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      
                      <span className="block text-[8px] text-right mt-0.5 opacity-60">
                        {msg.timestamp}
                      </span>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mb-0.5">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200/70 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}

                {messages.length <= 1 && !isTyping && (
                  <div className="pt-2 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions
                    </p>
                    {QUICK_SUGGESTIONS.map((sugg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessage(sugg)}
                        className="group text-left text-[11px] bg-white/90 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 px-3 py-2.5 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer truncate"
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {selectedFile && (
                <div className="shrink-0 border-t border-slate-200/70 bg-white/95 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                  <div className="flex items-center gap-2 truncate text-slate-700 dark:text-slate-300">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-black/10 shrink-0 border border-slate-300 dark:border-gray-600 flex items-center justify-center">
                      {selectedFile.type === "image" ? (
                        <img src={selectedFile.url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-[11px] font-medium truncate">{selectedFile.rawFile.name}</span>
                      <span className="text-[9px] text-slate-400 uppercase">{selectedFile.type} attached</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeSelectedFile}
                    className="w-6 h-6 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="
                shrink-0
                border-t
                border-slate-200/70
                bg-white/95
                px-3
                pt-2.5
                pb-[max(.75rem,env(safe-area-inset-bottom))]
                backdrop-blur-2xl
                dark:border-white/10
                dark:bg-slate-950/95
              ">
                <div className="
                  flex
                  min-h-[52px]
                  items-center
                  gap-1
                  rounded-[22px]
                  border
                  border-slate-200
                  bg-slate-50
                  px-2
                  py-1.5
                  shadow-inner
                  transition
                  focus-within:border-red-300
                  focus-within:bg-white
                  focus-within:ring-4
                  focus-within:ring-red-100/70
                  dark:border-white/10
                  dark:bg-slate-900
                  dark:focus-within:ring-red-950/40
                ">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition cursor-pointer"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={cn(
                      "p-1.5 rounded-full transition cursor-pointer",
                      isRecording ? "text-red-600 animate-pulse bg-red-100 dark:bg-red-950" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    )}
                    title={isRecording ? "Stop recording" : "Voice input"}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message or ask for rooms..."
                    className="min-w-0 flex-1 bg-transparent border-none outline-none text-base sm:text-sm text-slate-800 dark:text-slate-100 px-2 py-2 placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={(!input.trim() && !selectedFile) || isTyping}
                    className={cn(
                      "w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-white transition-all cursor-pointer",
                      (!input.trim() && !selectedFile) || isTyping
                        ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                        : "bg-gradient-to-br from-red-500 via-rose-600 to-red-700 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
                    )}
                  >
                    {isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
