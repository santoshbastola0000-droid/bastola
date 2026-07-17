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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  CHATBOT_RULES_UPDATED_EVENT,
  findChatbotReply,
  getChatbotQuickReplies,
  getStoredChatbotRules,
  type ChatbotTrainingRule,
} from "@/lib/chatbot-training";

interface Message {
  id: number;
  role: "bot" | "user";
  text: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [customRules, setCustomRules] = useState<ChatbotTrainingRule[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "bot",
      text: "Hi! 👋 I'm your RoomKhoj assistant. I can help you find rooms, understand listings, and manage your account. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const syncRules = () => setCustomRules(getStoredChatbotRules());

    syncRules();
    window.addEventListener(CHATBOT_RULES_UPDATED_EVENT, syncRules);
    window.addEventListener("storage", syncRules);

    return () => {
      window.removeEventListener(CHATBOT_RULES_UPDATED_EVENT, syncRules);
      window.removeEventListener("storage", syncRules);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: Date.now(), role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    setTimeout(() => {
      const reply = findChatbotReply(trimmed, customRules);
      const botMsg: Message = {
        id: Date.now() + 1,
        role: "bot",
        text: reply.text,
      };
      setMessages((m) => [...m, botMsg]);

      if (reply.action) {
        const actionMsg: Message = {
          id: Date.now() + 2,
          role: "bot",
          text: `__action__${JSON.stringify(reply.action)}`,
        };
        setMessages((m) => [...m, actionMsg]);
      }
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage(input);
  };

  const renderText = (text: string) => {
    return text
      .split("**")
      .map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
      );
  };

  return (
    <>
      {/* FAB toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer",
          isOpen
            ? "bg-gray-700 text-white"
            : "bg-gradient-to-br from-red-500 to-rose-600 text-white hover:scale-105",
        )}
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-border bg-white dark:bg-gray-900"
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none">RoomKhoj Bot</p>
                <p className="text-[10px] text-white/70 mt-0.5">
                  Room help, listing help, and quick answers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => {
                if (msg.text.startsWith("__action__")) {
                  let action: { label: string; href: string } | null = null;
                  try {
                    action = JSON.parse(msg.text.replace("__action__", ""));
                  } catch {
                    return null;
                  }
                  if (!action) return null;
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          router.push(action.href);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer font-medium"
                      >
                        {action.label} →
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {msg.role === "bot" && (
                      <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0 mb-0.5">
                        <Bot className="w-3.5 h-3.5 text-red-600" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                        msg.role === "bot"
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                          : "bg-red-600 text-white rounded-br-sm",
                      )}
                    >
                      {msg.text.split("\n").map((line, i) => (
                        <p key={i} className={i > 0 ? "mt-1" : ""}>
                          {renderText(line)}
                        </p>
                      ))}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mb-0.5">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div className="px-4 pb-2 flex gap-1.5 flex-wrap shrink-0">
              {getChatbotQuickReplies(customRules).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-red-200 text-red-700 dark:text-red-400 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 pb-3 flex items-center gap-2 shrink-0 border-t border-border pt-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything…"
                className="flex-1 text-sm px-3 py-2 rounded-full border border-border bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-red-300 transition"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
