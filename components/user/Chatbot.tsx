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
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/http/services/wallet.service";
import useTokenStore from "@/store";

interface RoomItem {
  id?: string;
  title?: string;
  price?: string;
  location?: string;
  contact?: string;
  link?: string;
  mediaUrl?: string;
}

interface RoomPostingPreview {
  title?: string;
  type?: string;
  city?: string;
  area?: string;
  rent?: number;
  capacity?: number;
  amenities?: string[];
  availableFrom?: string;
  contactPhone?: string;
}

interface RoomPostingResult {
  id?: string;
  title?: string;
  approvalStatus?: string;
}

interface RoomRequestPreview {
  fullName?: string;
  contactPhone?: string;
  city?: string;
  preferredArea?: string;
  budget?: number;
  roomType?: string;
  numberOfPeople?: number;
  tenantType?: string;
  moveInDate?: string;
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
  nextAction?: string;
  roomId?: string;
  roomPostingPreview?: RoomPostingPreview;
  roomPosting?: RoomPostingResult;
  roomRequestId?: string;
  roomRequestPreview?: RoomRequestPreview;
  confirmation?: {
    type?: string;
    text?: string;
  };
  quickReplies?: string[];
  reviewEligible?: boolean;
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
  const token = useTokenStore((state) => state.token);

  const [guestSessionId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const storageKey =
      "roomkhoj_guest_session_id";

    const existing =
      localStorage.getItem(storageKey);

    if (
      existing &&
      /^[A-Za-z0-9_-]{16,128}$/.test(
        existing,
      )
    ) {
      return existing;
    }

    const created =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;

    localStorage.setItem(
      storageKey,
      created,
    );

    return created;
  });

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
  const [documentScanProgress, setDocumentScanProgress] = useState(0);
  const [documentScanStep, setDocumentScanStep] = useState("");
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

    if (type === "file") {
      setDocumentScanProgress(8);
      setDocumentScanStep("Preparing document...");

      const stages = [
        { progress: 24, text: "Scanning CV..." },
        { progress: 43, text: "Reading basic information..." },
        { progress: 61, text: "Reading education..." },
        { progress: 78, text: "Reading experience..." },
        { progress: 91, text: "Reading skills..." },
      ];

      stages.forEach((stage, index) => {
        window.setTimeout(() => {
          setDocumentScanProgress(stage.progress);
          setDocumentScanStep(stage.text);
        }, 450 * (index + 1));
      });
    } else {
      setDocumentScanProgress(0);
      setDocumentScanStep("");
    }
  };

  const removeSelectedFile = () => {
    if (selectedFile?.url) {
      URL.revokeObjectURL(selectedFile.url);
    }
    setSelectedFile(null);
    setDocumentScanProgress(0);
    setDocumentScanStep("");

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

    if (
      loggedInUserId &&
      balance < 1
    ) {
      alert("AI चलाउन wallet balance आवश्यक छ। कृपया wallet top-up गर्नुहोस्।");
      return;
    }

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

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("https://api.roomkhoj.com/ai-v3/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: textToSend.slice(0, 2000),
          guestSessionId:
            loggedInUserId
              ? undefined
              : guestSessionId,
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

      if (
        typeof data?.billing?.balance === "number"
      ) {
        queryClient.setQueryData(["wallet-balance"], (old: any) => ({
          ...(old || {}),
          balance: data.billing.balance,
        }));
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
      let nextAction: string | undefined = undefined;
      let roomId: string | undefined = undefined;
      let roomPostingPreview: RoomPostingPreview | undefined = undefined;
      let roomPosting: RoomPostingResult | undefined = undefined;
      let roomRequestId: string | undefined = undefined;
      let roomRequestPreview: RoomRequestPreview | undefined = undefined;
      let confirmation: ChatMessage["confirmation"] = undefined;
      let quickReplies: string[] | undefined = undefined;
      let reviewEligible = false;
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
        nextAction = responseObj.nextAction || data?.nextAction;
        roomId = responseObj.roomId || data?.roomId;
        roomPostingPreview =
          responseObj.roomPostingPreview || data?.roomPostingPreview;
        roomPosting = responseObj.roomPosting || data?.roomPosting;
        roomRequestId = responseObj.roomRequestId || data?.roomRequestId;
        roomRequestPreview =
          responseObj.roomRequestPreview || data?.roomRequestPreview;
        confirmation = responseObj.confirmation || data?.confirmation;
        quickReplies = Array.isArray(responseObj.quickReplies)
          ? responseObj.quickReplies
          : Array.isArray(data?.quickReplies)
            ? data.quickReplies
            : undefined;
        reviewEligible =
          responseObj.reviewEligible === true || data?.reviewEligible === true;
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
        nextAction,
        roomId,
        roomPostingPreview,
        roomPosting,
        roomRequestId,
        roomRequestPreview,
        confirmation,
        quickReplies,
        reviewEligible,
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
          "hidden md:flex fixed bottom-6 right-6 z-[10000] h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-white shadow-xl transition hover:bg-black hover:scale-105 active:scale-95 cursor-pointer",
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
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              fixed
              inset-0
              z-[9999]
              flex
              h-[100dvh]
              max-h-[100dvh]
              flex-col
              overflow-hidden
              bg-white
              text-slate-900
              dark:bg-[#212121]
              dark:text-white
              font-sans
            "
          >
            <div className="
              relative
              z-30
              flex
              h-14
              shrink-0
              items-center
              justify-between
              border-b
              border-slate-200
              bg-white/95
              px-3
              backdrop-blur-xl
              md:ml-[260px]
              dark:border-white/10
              dark:bg-[#212121]/95
            ">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHistorySidebar((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer"
                  title="Toggle History Sidebar"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 dark:bg-white">
                  <Sparkles className="h-4 w-4 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-none text-slate-900 dark:text-white">
                    RoomKhoj AI
                  </h2>
                  <span className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Rooms • Jobs • Career
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <Coins className="w-3 h-3" /> Rs.{balance}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="
              relative
              z-20
              flex
              h-10
              shrink-0
              items-center
              justify-between
              border-b
              border-slate-200
              bg-white
              px-3
              text-[11px]
              text-slate-500
              md:ml-[260px]
              dark:border-white/10
              dark:bg-[#212121]
              dark:text-slate-400
            ">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" /> Find rooms near your location
              </span>
              <button
                type="button"
                onClick={requestUserLocation}
                disabled={locationRequested}
                className="ml-2 shrink-0 rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white transition hover:bg-black cursor-pointer disabled:opacity-50 dark:bg-white dark:text-slate-900"
              >
                {locationRequested ? "Detecting..." : "Detect Location"}
              </button>
            </div>

            <div className="relative flex min-h-0 w-full flex-1 overflow-hidden">
              <div
                className={cn(
                  "fixed inset-y-0 left-0 z-40 w-[260px] bg-[#f9f9f9] text-slate-900 flex flex-col transition-transform duration-300 border-r border-slate-200 dark:bg-[#171717] dark:text-white dark:border-white/10 md:translate-x-0",
                  showHistorySidebar
                    ? "translate-x-0"
                    : "-translate-x-full md:translate-x-0"
                )}
              >
                <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3 dark:border-white/10">
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-200/70 dark:text-white dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    New chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistorySidebar(false)}
                    className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 md:hidden dark:hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <p className="px-2 py-2 text-[11px] font-medium text-slate-500">
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
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs transition cursor-pointer truncate",
                          currentSessionId === sess.id
                            ? "bg-slate-200 text-slate-900 font-medium dark:bg-white/10 dark:text-white"
                            : "text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/5"
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
                ml-0
                flex-1
                overflow-y-auto
                overscroll-contain
                bg-white
                pb-[240px]
                md:pb-[220px]
                pt-5
                dark:bg-[#212121]
                md:ml-[260px]
                md:pt-5
              ">
                <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 sm:px-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-start gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "bot" && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-white">
                        <Sparkles className="h-3.5 w-3.5 text-white dark:text-slate-900" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[85%] text-[14px] leading-6",
                        msg.role === "bot"
                          ? "text-slate-800 dark:text-slate-100"
                          : "rounded-[18px] bg-[#f4f4f4] px-4 py-2.5 text-slate-900 dark:bg-[#2f2f2f] dark:text-white"
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

                      {msg.roomPostingPreview && (
                        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-slate-800 shadow-sm dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-slate-100">
                          <div className="mb-2 flex items-center gap-2 font-semibold">
                            <Home className="h-4 w-4" />
                            कोठा पोस्ट Preview
                          </div>
                          <div className="grid gap-1.5 text-xs sm:grid-cols-2">
                            <span>Title: {msg.roomPostingPreview.title || "-"}</span>
                            <span>Type: {msg.roomPostingPreview.type || "-"}</span>
                            <span>Location: {[msg.roomPostingPreview.area, msg.roomPostingPreview.city].filter(Boolean).join(", ") || "-"}</span>
                            <span>Rent: रु. {msg.roomPostingPreview.rent ?? "-"}</span>
                            <span>Capacity: {msg.roomPostingPreview.capacity ?? "-"} जना</span>
                            <span>Available: {msg.roomPostingPreview.availableFrom || "-"}</span>
                          </div>
                          {!!msg.roomPostingPreview.amenities?.length && (
                            <p className="mt-2 text-xs">
                              Facilities: {msg.roomPostingPreview.amenities.join(", ")}
                            </p>
                          )}
                          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            Contact: {msg.roomPostingPreview.contactPhone || "-"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => sendMessage("हो, post गर")}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              हो, Post गर
                            </button>
                            <button
                              type="button"
                              onClick={() => inputRef.current?.focus()}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold dark:border-white/20 dark:bg-white/5"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => sendMessage("cancel")}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 dark:border-red-400/30 dark:text-red-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {msg.confirmation?.type === "ROOM_REQUEST" &&
                        !msg.roomRequestPreview && (
                          <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-400/20 dark:bg-blue-400/10">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {msg.confirmation.text || "Room requirement सुरक्षित गर्ने अनुमति दिनुहुन्छ?"}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              Valid Nepal mobile चाहिन्छ; OTP verification चाहिँदैन। तपाईंको phone room owner लाई स्वतः दिइँदैन।
                            </p>
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => sendMessage("हो")}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                हो
                              </button>
                              <button
                                type="button"
                                onClick={() => sendMessage("होइन")}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold dark:border-white/20 dark:bg-white/5"
                              >
                                होइन
                              </button>
                            </div>
                          </div>
                        )}

                      {msg.roomRequestPreview && (
                        <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-400/20 dark:bg-blue-400/10">
                          <div className="mb-2 flex items-center gap-2 font-semibold">
                            <MapPin className="h-4 w-4" />
                            Room Requirement Preview
                          </div>
                          <div className="grid gap-1.5 text-xs sm:grid-cols-2">
                            <span>Name: {msg.roomRequestPreview.fullName || "-"}</span>
                            <span>Mobile: {msg.roomRequestPreview.contactPhone || "-"}</span>
                            <span>Location: {[msg.roomRequestPreview.preferredArea, msg.roomRequestPreview.city].filter(Boolean).join(", ") || "-"}</span>
                            <span>Budget: रु. {msg.roomRequestPreview.budget ?? "-"}</span>
                            <span>Type: {msg.roomRequestPreview.roomType || "-"}</span>
                            <span>People: {msg.roomRequestPreview.numberOfPeople ?? "-"}</span>
                            <span>Tenant: {msg.roomRequestPreview.tenantType || "-"}</span>
                            <span>Move-in: {msg.roomRequestPreview.moveInDate || "-"}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => sendMessage("हो")}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Requirement Save गर
                            </button>
                            <button
                              type="button"
                              onClick={() => inputRef.current?.focus()}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold dark:border-white/20 dark:bg-white/5"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => sendMessage("cancel")}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 dark:border-red-400/30 dark:text-red-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {msg.nextAction === "ROOM_REQUEST_SAVED" && (
                        <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                            Room requirement सुरक्षित भयो ✅
                          </p>
                          <a
                            href="/user/dashboard/room-requests"
                            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-900"
                          >
                            View Room Requests <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {msg.nextAction === "ROOM_POST_CREATED" && (
                        <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10">
                          <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
                            <Home className="h-4 w-4" />
                            तपाईंको कोठा review का लागि पठाइयो
                          </div>
                          {msg.roomPosting?.title && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                              {msg.roomPosting.title}
                            </p>
                          )}
                          <a
                            href="/user/dashboard/rooms"
                            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-900"
                          >
                            View My Listings <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {msg.jobDetails && (
                        <div className="mb-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#2a2a2a]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10">
                                  <Briefcase className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                                </div>

                                <div className="min-w-0">
                                  <h4 className="truncate font-semibold text-slate-900 dark:text-white">
                                    {msg.jobDetails.jobTitle || "Job Vacancy"}
                                  </h4>

                                  {msg.jobDetails.companyName && (
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                      {msg.jobDetails.companyName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {typeof msg.jobDetails.matchPercent === "number" && (
                              <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                {msg.jobDetails.matchPercent}% match
                              </div>
                            )}
                          </div>

                          <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                            {msg.jobDetails.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span>{msg.jobDetails.location}</span>
                              </div>
                            )}

                            {msg.jobDetails.salary !== null &&
                              msg.jobDetails.salary !== undefined && (
                                <div className="flex items-center gap-1.5">
                                  <Coins className="h-3.5 w-3.5 shrink-0" />
                                  <span>Rs. {msg.jobDetails.salary}</span>
                                </div>
                              )}

                            {msg.jobDetails.experience && (
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 shrink-0" />
                                <span>{msg.jobDetails.experience}</span>
                              </div>
                            )}
                          </div>

                          {msg.jobDetails.description && (
                            <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
                              {msg.jobDetails.description}
                            </p>
                          )}
                        </div>
                      )}

                      {msg.jobsList &&
                        Array.isArray(msg.jobsList) &&
                        msg.jobsList.length > 0 && (
                          <div className="mb-2 space-y-2.5">
                            {msg.jobsList.map((job, jIdx) => (
                              <div
                                key={job.id || jIdx}
                                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#2a2a2a]"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className="truncate font-semibold text-slate-900 dark:text-white">
                                      {job.number ? `${job.number}. ` : ""}
                                      {job.jobTitle || "Job Vacancy"}
                                    </h4>

                                    {job.companyName && (
                                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                        {job.companyName}
                                      </p>
                                    )}
                                  </div>

                                  {typeof job.matchPercent === "number" && (
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                      {job.matchPercent}%
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 grid gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                                  {job.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      <span>{job.location}</span>
                                    </div>
                                  )}

                                  {job.salary !== null &&
                                    job.salary !== undefined && (
                                      <div className="flex items-center gap-1">
                                        <Coins className="h-3 w-3 shrink-0" />
                                        <span>Rs. {job.salary}</span>
                                      </div>
                                    )}

                                  {job.experience && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3 shrink-0" />
                                      <span>{job.experience}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
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

                      {!!msg.quickReplies?.length && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.quickReplies.slice(0, 4).map((reply) => (
                            <button
                              key={reply}
                              type="button"
                              onClick={() => sendMessage(reply)}
                              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.reviewEligible &&
                        process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL && (
                          <a
                            href={process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Google Review <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      
                      <span className="block text-[8px] text-right mt-0.5 opacity-60">
                        {msg.timestamp}
                      </span>
                    </div>

                    {msg.role === "user" && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-white">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse text-white dark:text-slate-900" />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3.5 py-2 dark:bg-white/5">
                      <span className="text-[13px] font-medium text-slate-500 dark:text-slate-300">
                        Thinking
                      </span>

                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-[bounce_1.2s_infinite] rounded-full bg-slate-400 [animation-delay:-0.30s]" />
                        <span className="h-1.5 w-1.5 animate-[bounce_1.2s_infinite] rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-[bounce_1.2s_infinite] rounded-full bg-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
                </div>
              </div>

              {selectedFile && (
                <div className="fixed bottom-[88px] left-0 right-0 z-30 mx-auto flex max-w-[760px] items-center justify-between border border-slate-200 bg-white px-3 py-2 shadow-lg md:left-[260px] dark:border-white/10 dark:bg-[#2f2f2f]">
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
                fixed
                bottom-0
                left-0
                right-0
                z-30
                bg-gradient-to-t
                from-white
                via-white
                to-white/0
                px-3
                pb-[max(12px,env(safe-area-inset-bottom))]
                pt-6
                md:left-[260px]
                dark:from-[#212121]
                dark:via-[#212121]
                dark:to-transparent
              ">
                <div className="mx-auto w-full max-w-[760px]">
                <div
                  className={cn(
                    "relative rounded-[32px] border bg-white px-4 pt-4 pb-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 dark:bg-[#212121]",
                    input.trim()
                      ? "border-slate-300 shadow-[0_10px_35px_rgba(0,0,0,0.12)] dark:border-white/20"
                      : "border-slate-200 dark:border-white/10"
                  )}
                >
                  {selectedFile?.type === "file" && (
                    <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/10">
                          <FileText className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {selectedFile.rawFile.name}
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-400">
                                {(selectedFile.rawFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={removeSelectedFile}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                              title="Remove document"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />

                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                  {documentScanStep || "Preparing document..."}
                                </span>
                              </div>

                              <span className="text-[11px] tabular-nums text-slate-400">
                                {documentScanProgress}%
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                              <div
                                className="h-full rounded-full bg-slate-900 transition-all duration-500 ease-out dark:bg-white"
                                style={{
                                  width: `${documentScanProgress}%`,
                                }}
                              />
                            </div>

                            <div className="mt-3 space-y-1">
                              <p className={
                                documentScanProgress >= 61
                                  ? "text-[11px] text-slate-600 dark:text-slate-300"
                                  : "text-[11px] text-slate-400"
                              }>
                                {documentScanProgress >= 61 ? "✓" : "○"} Reading education
                              </p>

                              <p className={
                                documentScanProgress >= 78
                                  ? "text-[11px] text-slate-600 dark:text-slate-300"
                                  : "text-[11px] text-slate-400"
                              }>
                                {documentScanProgress >= 78 ? "✓" : "○"} Reading experience
                              </p>

                              <p className={
                                documentScanProgress >= 91
                                  ? "text-[11px] text-slate-600 dark:text-slate-300"
                                  : "text-[11px] text-slate-400"
                              }>
                                {documentScanProgress >= 91 ? "✓" : "○"} Reading skills
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    className="hidden"
                  />

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask RoomKhoj AI"
                    rows={1}
                    className="
                      block
                      min-h-[38px]
                      max-h-[100px]
                      w-full
                      resize-none
                      bg-transparent
                      px-1
                      py-1
                      text-[18px]
                      leading-7
                      text-slate-900
                      outline-none
                      placeholder:text-slate-400
                      dark:text-white
                      dark:placeholder:text-slate-500
                    "
                  />

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="
                        flex h-11 w-11 shrink-0
                        items-center justify-center
                        rounded-full
                        text-slate-900
                        transition
                        hover:bg-slate-100
                        dark:text-white
                        dark:hover:bg-white/10
                      "
                      title="Attach file"
                    >
                      <Plus className="h-7 w-7" />
                    </button>

                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full transition",
                          isRecording
                            ? "bg-red-100 text-red-600 animate-pulse dark:bg-red-950"
                            : "text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                        )}
                        title={isRecording ? "Stop recording" : "Voice input"}
                      >
                        {isRecording ? (
                          <MicOff className="h-6 w-6" />
                        ) : (
                          <Mic className="h-6 w-6" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => sendMessage()}
                        disabled={(!input.trim() && !selectedFile) || isTyping}
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200",
                          (!input.trim() && !selectedFile) || isTyping
                            ? "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"
                            : "bg-black text-white hover:scale-105 dark:bg-white dark:text-black"
                        )}
                      >
                        {isTyping ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-center text-[10px] text-slate-400">
                  RoomKhoj AI can make mistakes. Check important information.
                </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
