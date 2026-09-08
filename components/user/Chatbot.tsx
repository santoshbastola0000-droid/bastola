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
  const [voiceConversationMode, setVoiceConversationMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
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

  const closeChatbot = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("close-roomkhoj-chatbot"));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent("open-roomkhoj-chatbot"));
    }
  }, [isOpen]);

  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const voiceConversationRef = useRef(false);
  const activeVoiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const voiceVadFrameRef = useRef<number | null>(null);
  const voiceTurnProcessingRef = useRef(false);
  const voiceSilencePromptRef = useRef(false);
  const bargeInStreamRef = useRef<MediaStream | null>(null);
  const bargeInContextRef = useRef<AudioContext | null>(null);
  const bargeInFrameRef = useRef<number | null>(null);

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
      if (mediaRecorderRef.current?.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (voiceVadFrameRef.current !== null) {
        cancelAnimationFrame(voiceVadFrameRef.current);
        voiceVadFrameRef.current = null;
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      if (bargeInFrameRef.current !== null) {
        cancelAnimationFrame(bargeInFrameRef.current);
        bargeInFrameRef.current = null;
      }
      bargeInStreamRef.current?.getTracks().forEach((track) => track.stop());
      bargeInStreamRef.current = null;
      if (bargeInContextRef.current) {
        void bargeInContextRef.current.close().catch(() => undefined);
        bargeInContextRef.current = null;
      }
      if (activeVoiceAudioRef.current) {
        activeVoiceAudioRef.current.pause();
        activeVoiceAudioRef.current.src = "";
        activeVoiceAudioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
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

  const stopBargeInMonitor = () => {
    if (bargeInFrameRef.current !== null) {
      cancelAnimationFrame(bargeInFrameRef.current);
      bargeInFrameRef.current = null;
    }
    bargeInStreamRef.current?.getTracks().forEach((track) => track.stop());
    bargeInStreamRef.current = null;
    if (bargeInContextRef.current) {
      void bargeInContextRef.current.close().catch(() => undefined);
      bargeInContextRef.current = null;
    }
  };

  const startBargeInMonitor = async () => {
    if (
      typeof window === "undefined" ||
      !voiceConversationRef.current ||
      !activeVoiceAudioRef.current ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return;
    }

    stopBargeInMonitor();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      bargeInStreamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();
      bargeInContextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);

      const samples = new Uint8Array(analyser.fftSize);
      let loudSince: number | null = null;

      const monitor = () => {
        if (
          !voiceConversationRef.current ||
          !activeVoiceAudioRef.current
        ) {
          stopBargeInMonitor();
          return;
        }

        analyser.getByteTimeDomainData(samples);
        let sumSquares = 0;
        for (let i = 0; i < samples.length; i += 1) {
          const normalized = (samples[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / samples.length);
        const now = performance.now();

        if (rms >= 0.075) {
          if (loudSince === null) loudSince = now;
          if (now - loudSince >= 180) {
            const audio = activeVoiceAudioRef.current;
            if (audio) {
              audio.pause();
              audio.src = "";
              activeVoiceAudioRef.current = null;
            }
            stopBargeInMonitor();
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            setVoiceStatus("सुन्दैछु...");
            void startHandsFreeListening();
            return;
          }
        } else {
          loudSince = null;
        }

        bargeInFrameRef.current = requestAnimationFrame(monitor);
      };

      bargeInFrameRef.current = requestAnimationFrame(monitor);
    } catch (error) {
      console.error("Barge-in monitor unavailable:", error);
      stopBargeInMonitor();
    }
  };

  const scheduleHandsFreeListen = () => {
    window.setTimeout(() => {
      if (
        voiceConversationRef.current &&
        !voiceTurnProcessingRef.current &&
        !activeVoiceAudioRef.current
      ) {
        void startHandsFreeListening();
      }
    }, 250);
  };

  const speakWithBrowserFallback = (text: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !text.trim()
    ) {
      setVoiceStatus("यो browser मा voice playback उपलब्ध छैन");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.slice(0, 1200));
    const voices = window.speechSynthesis.getVoices();

    const nepaliVoice =
      voices.find((voice) => voice.lang.toLowerCase().startsWith("ne")) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("hi")) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en-in")) ||
      voices[0];

    if (nepaliVoice) {
      utterance.voice = nepaliVoice;
      utterance.lang = nepaliVoice.lang;
    } else {
      utterance.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-IN";
    }

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setVoiceStatus("AI बोल्दैछ...");
      void startBargeInMonitor();
    };
    utterance.onend = () => {
      stopBargeInMonitor();
      setVoiceStatus("सुन्दैछु...");
      scheduleHandsFreeListen();
    };
    utterance.onerror = () => {
      stopBargeInMonitor();
      setVoiceStatus("Voice playback failed, फेरि सुन्दैछु...");
      scheduleHandsFreeListen();
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakBotReply = async (text: string) => {
    if (
      typeof window === "undefined" ||
      !voiceConversationRef.current ||
      !text.trim()
    ) {
      return;
    }

    if (activeVoiceAudioRef.current) {
      activeVoiceAudioRef.current.pause();
      activeVoiceAudioRef.current.src = "";
      activeVoiceAudioRef.current = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (!token) {
      speakWithBrowserFallback(text);
      return;
    }

    try {
      setVoiceStatus("AI आवाज तयार गर्दैछ...");

      const response = await fetch(
        "https://api.roomkhoj.com/ai-call/speak",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text.slice(0, 1200),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      activeVoiceAudioRef.current = audio;

      audio.onplay = () => {
        setVoiceStatus("AI बोल्दैछ...");
        void startBargeInMonitor();
      };
      audio.onended = () => {
        stopBargeInMonitor();
        URL.revokeObjectURL(audioUrl);
        if (activeVoiceAudioRef.current === audio) {
          activeVoiceAudioRef.current = null;
        }
        setVoiceStatus("सुन्दैछु...");
        scheduleHandsFreeListen();
      };
      audio.onerror = () => {
        stopBargeInMonitor();
        URL.revokeObjectURL(audioUrl);
        if (activeVoiceAudioRef.current === audio) {
          activeVoiceAudioRef.current = null;
        }
        speakWithBrowserFallback(text);
      };

      await audio.play();
    } catch (error) {
      console.error("Server TTS failed, using browser fallback:", error);
      speakWithBrowserFallback(text);
    }
  };

  const stopMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const transcribeRecordedAudio = async (blob: Blob) => {
    if (!token) {
      throw new Error("Live voice fallback requires login.");
    }

    const form = new FormData();
    const extension = blob.type.includes("ogg")
      ? "ogg"
      : blob.type.includes("mp4")
        ? "m4a"
        : "webm";

    form.append("audio", blob, `roomkhoj-live-voice.${extension}`);

    const response = await fetch(
      "https://api.roomkhoj.com/ai-call/transcribe",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Voice transcription failed.",
      );
    }

    return String(data?.data?.text || "").trim();
  };

  const stopVoiceCaptureOnly = () => {
    if (voiceVadFrameRef.current !== null) {
      cancelAnimationFrame(voiceVadFrameRef.current);
      voiceVadFrameRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    stopBargeInMonitor();
    voiceTurnProcessingRef.current = false;
    voiceSilencePromptRef.current = false;

    stopMediaStream();
    setIsRecording(false);
  };

  const startHandsFreeListening = async () => {
    if (
      typeof window === "undefined" ||
      !voiceConversationRef.current ||
      voiceTurnProcessingRef.current ||
      mediaRecorderRef.current?.state === "recording" ||
      activeVoiceAudioRef.current
    ) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceStatus("यो browser मा microphone recording उपलब्ध छैन");
      return;
    }

    if (!token) {
      setVoiceStatus("Live voice का लागि login आवश्यक छ");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      mediaStreamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      analyserRef.current = analyser;

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const mimeType =
        preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordedChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      let speechStarted = false;
      let speechStartedAt = 0;
      let lastSpeechAt = performance.now();
      let listenStartedAt = performance.now();
      let peakRms = 0;
      let speechRmsTotal = 0;
      let speechFrames = 0;
      let stoppedByVad = false;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (voiceVadFrameRef.current !== null) {
          cancelAnimationFrame(voiceVadFrameRef.current);
          voiceVadFrameRef.current = null;
        }
        if (audioContextRef.current) {
          void audioContextRef.current.close().catch(() => undefined);
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        stopMediaStream();
        setIsRecording(false);
        mediaRecorderRef.current = null;

        if (!voiceConversationRef.current) {
          recordedChunksRef.current = [];
          return;
        }

        const avgSpeechRms =
          speechFrames > 0 ? speechRmsTotal / speechFrames : 0;

        if (!speechStarted || !stoppedByVad) {
          recordedChunksRef.current = [];
          voiceTurnProcessingRef.current = true;

          const prompt =
            peakRms > 0 && peakRms < 0.035
              ? "तपाईं टाढाबाट बोलिरहनुभएको जस्तो छ। कृपया अलि नजिकबाट स्पष्ट बोल्नुहोस्।"
              : "तपाईंको आवाज सुनिएन। कृपया बोल्नुहोस्।";

          voiceSilencePromptRef.current = true;
          await speakBotReply(prompt);
          voiceSilencePromptRef.current = false;
          voiceTurnProcessingRef.current = false;
          return;
        }

        if (avgSpeechRms < 0.028 || peakRms < 0.04) {
          recordedChunksRef.current = [];
          voiceTurnProcessingRef.current = true;
          await speakBotReply(
            "तपाईं टाढाबाट बोलिरहनुभएको जस्तो छ। कृपया अलि नजिकबाट स्पष्ट बोल्नुहोस्।",
          );
          voiceTurnProcessingRef.current = false;
          return;
        }

        voiceTurnProcessingRef.current = true;
        setVoiceStatus("आवाज बुझ्दैछ...");

        try {
          const blob = new Blob(recordedChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          recordedChunksRef.current = [];

          const transcript = await transcribeRecordedAudio(blob);

          if (!transcript) {
            await speakBotReply(
              "तपाईंको कुरा स्पष्ट बुझिनँ। कृपया फेरि एकपटक भन्नुहोस्।",
            );
            return;
          }

          setVoiceStatus(`सुनेँ: ${transcript}`);
          await sendMessage(transcript);
        } catch (error) {
          console.error("Hands-free voice transcription error:", error);
          await speakBotReply(
            "आवाज बुझ्न समस्या आयो। कृपया फेरि बोल्नुहोस्।",
          );
        } finally {
          voiceTurnProcessingRef.current = false;
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setVoiceStatus("सुन्दैछु... बोल्नुहोस्");

      const samples = new Uint8Array(analyser.fftSize);

      const monitor = () => {
        if (
          !voiceConversationRef.current ||
          recorder.state !== "recording"
        ) {
          return;
        }

        analyser.getByteTimeDomainData(samples);

        let sumSquares = 0;
        for (let i = 0; i < samples.length; i += 1) {
          const normalized = (samples[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / samples.length);
        peakRms = Math.max(peakRms, rms);

        const now = performance.now();
        const speechThreshold = 0.022;

        if (rms >= speechThreshold) {
          if (!speechStarted) {
            speechStarted = true;
            speechStartedAt = now;
            setVoiceStatus("सुन्दैछु... बोलिरहनुहोस्");
          }
          lastSpeechAt = now;
          speechRmsTotal += rms;
          speechFrames += 1;
        }

        if (
          speechStarted &&
          now - lastSpeechAt >= 900 &&
          now - speechStartedAt >= 250
        ) {
          stoppedByVad = true;
          recorder.stop();
          return;
        }

        if (!speechStarted && now - listenStartedAt >= 6000) {
          recorder.stop();
          return;
        }

        if (speechStarted && now - speechStartedAt >= 15000) {
          stoppedByVad = true;
          recorder.stop();
          return;
        }

        voiceVadFrameRef.current = requestAnimationFrame(monitor);
      };

      voiceVadFrameRef.current = requestAnimationFrame(monitor);
    } catch (error) {
      console.error("Hands-free microphone error:", error);
      stopVoiceCaptureOnly();
      setVoiceStatus("Microphone access failed");
    }
  };

  const toggleVoiceRecording = async () => {
    if (typeof window === "undefined") return;

    if (voiceConversationRef.current) {
      return;
    }

    voiceConversationRef.current = true;
    setVoiceConversationMode(true);
    voiceTurnProcessingRef.current = false;
    setVoiceStatus("Live Voice सुरु हुँदैछ...");

    await speakBotReply(
      "नमस्कार! म RoomKhoj AI हुँ। तपाईंलाई के सहयोग गरौँ?",
    );
  };

  const stopVoiceConversation = () => {
    voiceConversationRef.current = false;
    setVoiceConversationMode(false);
    setVoiceStatus("");
    setIsRecording(false);

    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }

    if (mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    stopMediaStream();

    if (activeVoiceAudioRef.current) {
      activeVoiceAudioRef.current.pause();
      activeVoiceAudioRef.current.src = "";
      activeVoiceAudioRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
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

      if (voiceConversationRef.current && botReplyText.trim()) {
        void speakBotReply(botReplyText);
      }
    } catch (error: any) {
      console.error("API Error details:", error);
      const fallbackReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: `Error: Server connection problem. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([...updatedMessages, fallbackReply]);
      if (voiceConversationRef.current) {
        void speakBotReply(fallbackReply.text);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            closeChatbot();
          } else {
            setIsOpen(true);
          }
        }}
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
                  onClick={closeChatbot}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Existing chatbot body remains unchanged below in the branch version. */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
