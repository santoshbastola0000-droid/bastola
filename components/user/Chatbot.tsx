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
  Image as ImageIcon,
  Video,
  Coins,
  History,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  timestamp: string;
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

export function AdvancedChatbot() {
  const userStore = useUserRole() as any;
  const loggedInUserId =
    userStore?.user?.id ||
    userStore?.user?._id ||
    userStore?.id ||
    userStore?.profile?.id ||
    userStore?.profile?._id ||
    null;

  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState<number>(50);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    type: "image" | "video" | "file";
    rawFile: File;
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [locationRequested, setLocationRequested] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Client-side initialization to prevent hydration mismatch
  useEffect(() => {
    setMessages([
      {
        id: "1",
        role: "bot",
        text: "Namaste! 🙏 I am RoomKhoj AI assistant. You can search rooms, upload photos/videos, use voice search, or share location right here!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, []);

  // Load chat history from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem("roomkhoj_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSessions(parsed.filter(isChatSession));
        } else {
          window.localStorage.removeItem("roomkhoj_chat_history");
        }
      } catch (e) {
        console.error("Failed to parse chat history:", e);
        window.localStorage.removeItem("roomkhoj_chat_history");
      }
    }
  }, []);

  // Cleanup object URLs and speech recognition on unmount
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
      setTimeout(() => inputRef.current?.focus(), 200);
      scrollToBottom();
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const saveCurrentSession = useCallback((currentMsgs: ChatMessage[]) => {
    if (currentMsgs.length <= 1) return;

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: currentMsgs[1]?.text?.slice(0, 30) + "..." || "Chat session",
      messages: currentMsgs,
    };

    setSessions((prev) => {
      const updated = [newSession, ...prev.filter((s) => s.id !== newSession.id)].slice(0, 5);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("roomkhoj_chat_history", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const deductBalanceForText = (text: string) => {
    if (!text) return;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const cost = Math.max(1, Math.ceil(wordCount / 5));
    setBalance((prev) => Math.max(0, prev - cost));
  };

  const toggleVoiceRecording = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
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
        alert("Unable to retrieve your location. Please check browser permissions.");
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
    const type = file.type.startsWith("image/")
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

    const currentUserId =
      loggedInUserId ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem("userId") ||
          window.localStorage.getItem("user_id") ||
          window.localStorage.getItem("id")
        : null) ||
      "guest_user";

    try {
      const res = await fetch("https://api.roomkhoj.com/ai/chat", {
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
        throw new Error(data?.message || `API failed with status ${res.status}`);
      }

      const botReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: data?.reply || "Sorry, I couldn't process that.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMsgs = [...updatedMessages, botReply];
      setMessages(finalMsgs);
      saveCurrentSession(finalMsgs);
    } catch (error) {
      console.error("API Error:", error);
      const fallbackReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: "Network connection error. Please try again shortly.",
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
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer",
          isOpen
            ? "bg-slate-800 text-white hover:bg-slate-900"
            : "bg-gradient-to-br from-red-500 to-rose-600 text-white hover:scale-105 active:scale-95"
        )}
        aria-label="Toggle RoomKhoj AI Chatbot"
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[340px] sm:w-[380px] flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-[580px]"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">RoomKhoj AI</p>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-200 font-medium">
                    <Coins className="w-3 h-3" />
                    <span>Balance: Rs. {balance}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  title="Chat History"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Recent Chats
                  </h3>
                  <button
                    onClick={() => {
                      setSessions([]);
                      if (typeof window !== "undefined") {
                        window.localStorage.removeItem("roomkhoj_chat_history");
                      }
                    }}
                    className="text-xs text-red-500 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-10">
                    No past chat history found.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((sess) => (
                      <button
                        key={sess.id}
                        type="button"
                        onClick={() => {
                          setMessages(sess.messages);
                          setShowHistory(false);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 cursor-pointer hover:border-red-400 dark:hover:border-red-400 text-xs shadow-xs truncate transition"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {sess.title}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="bg-red-50 dark:bg-red-950/40 px-3 py-2 border-b border-red-100 dark:border-red-900 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> Find rooms near you?
                  </span>
                  <button
                    type="button"
                    onClick={requestUserLocation}
                    disabled={locationRequested}
                    className="px-2.5 py-1 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                  >
                    {locationRequested ? "Detecting..." : "Allow Location"}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-end gap-2",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "bot" && (
                        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center shrink-0 mb-0.5">
                          <Bot className="w-3.5 h-3.5 text-red-600 dark:text-red-300" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                          msg.role === "bot"
                            ? "bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-slate-100 rounded-bl-xs"
                            : "bg-red-600 text-white rounded-br-xs"
                        )}
                      >
                        {msg.mediaUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/20 max-w-[200px]">
                            {msg.mediaType === "image" ? (
                              <img
                                src={msg.mediaUrl}
                                alt="Uploaded attachment"
                                className="w-full h-32 object-cover"
                              />
                            ) : msg.mediaType === "video" ? (
                              <video src={msg.mediaUrl} controls className="w-full h-32 object-cover" />
                            ) : null}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        <span className="block text-[9px] text-right mt-1 opacity-70">
                          {msg.timestamp}
                        </span>
                      </div>

                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0 mb-0.5">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-red-600 dark:text-red-300" />
                      </div>
                      <div className="bg-slate-100 dark:bg-gray-800 px-3.5 py-2 rounded-2xl rounded-bl-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {selectedFile && (
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-gray-800 flex items-center justify-between border-t border-slate-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs truncate">
                      {selectedFile.type === "image" ? (
                        <ImageIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <Video className="w-4 h-4 text-red-500" />
                      )}
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {selectedFile.rawFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeSelectedFile}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="p-3 border-t border-slate-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-1.5">
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
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition cursor-pointer"
                      title="Upload Photo or Video"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={cn(
                        "p-2 rounded-full transition cursor-pointer",
                        isRecording
                          ? "bg-red-600 text-white animate-pulse"
                          : "text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-gray-800"
                      )}
                      title="Voice Search"
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder={isRecording ? "Listening..." : "Ask room details..."}
                      className="flex-1 text-sm px-3 py-2 rounded-full border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-400 transition"
                    />

                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={(!input.trim() && !selectedFile) || isTyping}
                      className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs"
                    >
                      {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-1.5 px-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Rate: Rs 1 / 5 words</span>
                    <a
                      href="/pricing"
                      className="text-[10px] text-red-600 dark:text-red-400 font-semibold hover:underline"
                    >
                      Top-up Balance ⚡
                    </a>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { AdvancedChatbot as Chatbot };
