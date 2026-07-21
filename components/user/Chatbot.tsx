"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export function AdvancedChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState<number>(50); // Sample balance in NPR
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "bot",
      text: "Namaste! 🙏 I am RoomKhoj AI assistant. You can search rooms, upload photos/videos, use voice search, or share location right here!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ url: string; type: "image" | "video" | "file" } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [locationRequested, setLocationRequested] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("roomkhoj_chat_history");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save messages to history
  const saveCurrentSession = (currentMsgs: ChatMessage[]) => {
    if (currentMsgs.length <= 1) return;
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: currentMsgs[1]?.text.slice(0, 30) + "..." || "Chat session",
      messages: currentMsgs,
    };
    const updated = [newSession, ...sessions.slice(0, 4)]; // Keep last 5 sessions
    setSessions(updated);
    localStorage.setItem("roomkhoj_chat_history", JSON.stringify(updated));
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Balance & Token deduction logic (e.g., Rs 1 per 5 words)
  const deductBalanceForText = (text: string) => {
    const wordCount = text.trim().split(/\s+/).length;
    const cost = Math.ceil(wordCount / 5); // 1 rupee per 5 words
    setBalance((prev) => Math.max(0, prev - cost));
  };

  // Voice Search (Speech Recognition) Integration
  const toggleVoiceRecording = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ne-NP"; // Default to Nepali
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  // Location Request inside Chat Box
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationRequested(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationRequested(false);
        sendMessage(`📍 My Current Location Shared: Lat ${latitude.toFixed(2)}, Lng ${longitude.toFixed(2)}`);
      },
      () => {
        setLocationRequested(false);
        alert("Unable to retrieve your location. Please check permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  // File / Media Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
    setSelectedFile({ url: fileUrl, type });
  };

  const sendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() && !selectedFile) return;

    if (balance <= 0) {
      alert("Your balance is finished! Please upgrade or top-up to continue chatting.");
      return;
    }

    deductBalanceForText(textToSend);

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: textToSend,
      mediaUrl: selectedFile?.url,
      mediaType: selectedFile?.type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput("");
    setSelectedFile(null);

    // Simulate AI response
    setTimeout(() => {
      const botReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: `I received your message! ${newUserMsg.mediaType ? `(Attached a ${newUserMsg.mediaType})` : ""} Let me find the best room matches for you.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalMsgs = [...updatedMessages, botReply];
      setMessages(finalMsgs);
      saveCurrentSession(finalMsgs);
    }, 1000);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer",
          isOpen ? "bg-slate-800 text-white" : "bg-gradient-to-br from-red-500 to-rose-600 text-white hover:scale-105"
        )}
        aria-label="Toggle AI Chatbot"
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-85 sm:w-96 flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-slate-200 bg-white dark:bg-gray-900"
            style={{ height: "580px" }}
          >
            {/* Header with Balance & History Toggle */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
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
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* History Overlay Drawer */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Recent Chats</h3>
                  <button onClick={() => { setSessions([]); localStorage.removeItem("roomkhoj_chat_history"); }} className="text-xs text-red-500 flex items-center gap-1 cursor-pointer">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center mt-10">No past chat history found.</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => { setMessages(sess.messages); setShowHistory(false); }}
                        className="p-2.5 rounded-xl bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 cursor-pointer hover:border-red-400 text-xs shadow-xs truncate"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{sess.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Location Prompt Banner inside Chat */}
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

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex items-end gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {msg.role === "bot" && (
                        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center shrink-0 mb-0.5">
                          <Bot className="w-3.5 h-3.5 text-red-600" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                          msg.role === "bot"
                            ? "bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-slate-100 rounded-bl-sm"
                            : "bg-red-600 text-white rounded-br-sm"
                        )}
                      >
                        {msg.mediaUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/20 max-w-[200px]">
                            {msg.mediaType === "image" ? (
                              <img src={msg.mediaUrl} alt="Uploaded preview" className="w-full h-32 object-cover" />
                            ) : msg.mediaType === "video" ? (
                              <video src={msg.mediaUrl} controls className="w-full h-32 object-cover" />
                            ) : null}
                          </div>
                        )}
                        <p>{msg.text}</p>
                        <span className="block text-[9px] text-right mt-1 opacity-70">{msg.timestamp}</span>
                      </div>

                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0 mb-0.5">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Selected File Preview Box */}
                {selectedFile && (
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-gray-800 flex items-center justify-between border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs truncate">
                      {selectedFile.type === "image" ? <ImageIcon className="w-4 h-4 text-red-500" /> : <Video className="w-4 h-4 text-red-500" />}
                      <span className="truncate text-slate-700 dark:text-slate-300">Attached media ready</span>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Input Footer */}
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
                      title="Upload Room Photo/Video"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={cn(
                        "p-2 rounded-full transition cursor-pointer",
                        isRecording ? "bg-red-600 text-white animate-pulse" : "text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-gray-800"
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
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder={isRecording ? "Listening..." : "Ask room details..."}
                      className="flex-1 text-sm px-3 py-2 rounded-full border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-red-400 transition"
                    />

                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!input.trim() && !selectedFile}
                      className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-1.5 px-1">
                    <span className="text-[10px] text-slate-400">Rate: Rs 1 / 5 words</span>
                    <a href="/pricing" className="text-[10px] text-red-600 font-semibold hover:underline">Top-up Balance ⚡</a>
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

// यो लाइनले GlobalChatbot.tsx मा आउने 'Chatbot export not found' एररलाई सदाको लागि हटाउँछ
export { AdvancedChatbot as Chatbot };
