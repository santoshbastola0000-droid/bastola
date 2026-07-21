"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { cn, formatPriceNPR } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  CHATBOT_RULES_UPDATED_EVENT,
  findChatbotReply,
  getChatbotQuickReplies,
  getStoredChatbotRules,
  isRoomDiscoveryQuery,
  saveUserPreferences,
  getUserPreferences,
  type ChatbotTrainingRule,
  type UserPreferenceProfile,
} from "@/lib/chatbot-training";
import { useChatbotSuggestions } from "@/hooks/use-chatbot-suggestions";
import { getStoredUserLocation } from "@/hooks/use-user-location";
import type { Recommendation } from "@/hooks/use-room-recommendations";

interface Message {
  id: number;
  role: "bot" | "user";
  text: string;
}

type SuggestionStep =
  | "idle"
  | "ask-city"
  | "ask-budget"
  | "ask-women"
  | "ask-tenant"
  | "ask-amenities"
  | "confirm-location"
  | "searching"
  | "results";

interface SuggestionState {
  step: SuggestionStep;
  preferences: UserPreferenceProfile;
}

function buildPreferenceSummary(prefs: UserPreferenceProfile): string {
  const parts: string[] = [];
  if (prefs.city) parts.push(`area: ${prefs.city}`);
  if (prefs.maxBudget) parts.push(`budget up to ${formatPriceNPR(prefs.maxBudget)}`);
  if (prefs.womenOnly) parts.push("women-friendly");
  if (prefs.tenantType) parts.push(`tenant type: ${prefs.tenantType}`);
  if (prefs.amenities?.length) parts.push(`amenities: ${prefs.amenities.join(", ")}`);
  return parts.length ? parts.join(" • ") : "any room";
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

  const [suggestionState, setSuggestionState] = useState<SuggestionState>({
    step: "idle",
    preferences: getUserPreferences(),
  });

  const { fetch: fetchSuggestions, recommendations, loading: suggestionsLoading } =
    useChatbotSuggestions();

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

  const appendBotMessage = useCallback((text: string) => {
    setMessages((m) => [...m, { id: Date.now(), role: "bot", text }]);
  }, []);

  const appendActionButton = useCallback((label: string, href: string) => {
    setMessages((m) => [
      ...m,
      {
        id: Date.now(),
        role: "bot",
        text: `__action__${JSON.stringify({ label, href })}`,
      },
    ]);
  }, []);

  const startRoomDiscovery = useCallback(() => {
    const stored = getStoredUserLocation();
    const prefs = getUserPreferences();
    setSuggestionState({ step: "ask-city", preferences: prefs });

    if (stored) {
      setSuggestionState((prev) => ({
        step: "ask-city",
        preferences: {
          ...prev.preferences,
          latitude: stored.latitude,
          longitude: stored.longitude,
        },
      }));
    }

    appendBotMessage(
      "Great! Let me find rooms for you. First, which city or area are you looking in? (e.g., Pokhara, Lakeside, Kathmandu)",
    );
  }, [appendBotMessage]);

  const parseBudget = (text: string): number | undefined => {
    const match = text.replace(/,/g, "").match(/\d+/);
    if (!match) return undefined;
    const value = Number(match[0]);
    return value > 0 ? value : undefined;
  };

  const parseAmenities = (text: string): string[] =>
    text
      .split(/[,/\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

  const detectYesNo = (text: string): boolean | undefined => {
    const t = text.toLowerCase().trim();
    if (["yes", "ya", "yep", "ho", "chaiyo", "chahiyo"].some((w) => t.includes(w)))
      return true;
    if (["no", "na", "nope", "hoina", "chaina", "chahidaina"].some((w) => t.includes(w)))
      return false;
    return undefined;
  };

  const detectWomenFriendly = (text: string): boolean | undefined => {
    const t = text.toLowerCase();
    if (["women", "female", "ladies", "girl", "mahila"].some((w) => t.includes(w)))
      return true;
    return detectYesNo(text);
  };

  const runSearch = useCallback(
    async (prefs: UserPreferenceProfile) => {
      appendBotMessage(`Searching for rooms matching: ${buildPreferenceSummary(prefs)}…`);
      setSuggestionState((prev) => ({ ...prev, step: "searching" }));
      saveUserPreferences(prefs);

      await fetchSuggestions(prefs);
      setSuggestionState((prev) => ({ ...prev, step: "results" }));
    },
    [appendBotMessage, fetchSuggestions],
  );

  const handleSuggestionStep = useCallback(
    async (text: string) => {
      const { step, preferences } = suggestionState;

      if (step === "ask-city") {
        const next: UserPreferenceProfile = { ...preferences, city: text };
        setSuggestionState({ step: "ask-budget", preferences: next });
        appendBotMessage(`Got it — ${text}. What's your maximum monthly budget? (e.g., 15000)`);
        return;
      }

      if (step === "ask-budget") {
        const budget = parseBudget(text);
        const next: UserPreferenceProfile = { ...preferences, maxBudget: budget };
        setSuggestionState({ step: "ask-women", preferences: next });
        appendBotMessage(
          budget
            ? `Budget: ${formatPriceNPR(budget)}. Do you need a women-friendly room?`
            : "No problem. Do you need a women-friendly room?",
        );
        return;
      }

      if (step === "ask-women") {
        const womenOnly = detectWomenFriendly(text) ?? false;
        const next: UserPreferenceProfile = { ...preferences, womenOnly };
        setSuggestionState({ step: "ask-tenant", preferences: next });
        appendBotMessage(
          "Who will be staying? (Student, Working Professional, Family, Single Person, Couple, Any)",
        );
        return;
      }

      if (step === "ask-tenant") {
        const tenantType = text;
        const next: UserPreferenceProfile = { ...preferences, tenantType };
        setSuggestionState({ step: "ask-amenities", preferences: next });
        appendBotMessage(
          "Any must-have amenities? (e.g., wifi, parking, kitchen, attached bathroom). Say 'none' to skip.",
        );
        return;
      }

      if (step === "ask-amenities") {
        const amenities =
          text.toLowerCase().includes("none") || text.toLowerCase().includes("skip")
            ? []
            : parseAmenities(text);
        const next: UserPreferenceProfile = { ...preferences, amenities };
        setSuggestionState({ step: "confirm-location", preferences: next });

        if (preferences.latitude && preferences.longitude) {
          appendBotMessage(
            "I can also use your saved location to find nearby rooms. Should I include nearby results?",
          );
        } else {
          appendBotMessage(
            "Would you like to share your current location so I can find nearby rooms? (yes/no)",
          );
        }
        return;
      }

      if (step === "confirm-location") {
        const wantsNearby = detectYesNo(text) ?? true;
        const next: UserPreferenceProfile = { ...preferences };

        if (wantsNearby) {
          const stored = getStoredUserLocation();
          if (stored) {
            next.latitude = stored.latitude;
            next.longitude = stored.longitude;
          } else if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const prefsWithLoc: UserPreferenceProfile = {
                  ...preferences,
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
                setSuggestionState({ step: "searching", preferences: prefsWithLoc });
                await runSearch(prefsWithLoc);
              },
              async () => {
                appendBotMessage(
                  "Location access wasn't available. Searching by the area you entered instead.",
                );
                await runSearch(preferences);
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
            );
            return;
          }
        }

        await runSearch(next);
        return;
      }

      if (step === "results") {
        appendBotMessage(
          "I've already shown matching rooms. You can open any room above or tap Browse Rooms to see more.",
        );
        appendActionButton("Browse Rooms", "/rooms");
      }
    },
    [appendActionButton, appendBotMessage, runSearch, suggestionState],
  );

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: Date.now(), role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    if (suggestionState.step !== "idle" && suggestionState.step !== "results") {
      void handleSuggestionStep(trimmed);
      return;
    }

    const normalized = trimmed.toLowerCase();

    if (isRoomDiscoveryQuery(normalized)) {
      startRoomDiscovery();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const res = await fetch("https://api.roomkhoj.com/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
        }),
      });

      const data: { reply?: string } = await res.json();
      const replyText =
        typeof data.reply === "string" && data.reply.trim().length > 0
          ? data.reply
          : "Sorry, I couldn't generate a reply right now.";

      setMessages((m) => [...m, { id: Date.now() + 1, role: "bot", text: replyText }]);
    } catch {
      appendBotMessage("Sorry, I couldn't generate a reply right now.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage(input);
  };

  const openRoom = (roomId: string) => {
    setIsOpen(false);
    router.push(`/property/${roomId}`);
  };

  const renderRecommendation = (rec: Recommendation) => {
    const room = rec.room;
    return (
      <div
        key={room.id}
        className="rounded-xl border border-slate-200 bg-white dark:bg-gray-800 p-3 text-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{room.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              <MapPin className="inline h-3 w-3 mr-0.5" />
              {room.location?.city || room.address}
            </p>
          </div>
          <span className="text-red-600 font-semibold text-xs shrink-0">
            {formatPriceNPR(Number(room.price))}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {rec.reasons.slice(0, 3).map((reason) => (
            <span
              key={reason}
              className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100"
            >
              {reason}
            </span>
          ))}
          {rec.distanceKm !== undefined && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {rec.distanceKm.toFixed(1)} km
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => openRoom(room.id)}
          className="mt-2 w-full text-center text-xs bg-red-600 hover:bg-red-700 text-white rounded-full py-1.5 transition-colors cursor-pointer"
        >
          View Room →
        </button>
      </div>
    );
  };

  const renderText = (text: string) =>
    text
      .split("**")
      .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>));

  return (
    <>
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
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

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

              {suggestionsLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Bot className="w-4 h-4" />
                  <span>Finding best rooms for you…</span>
                </div>
              )}

              {!suggestionsLoading &&
                suggestionState.step === "results" &&
                recommendations.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-medium text-slate-600">Top matches for you:</p>
                    {recommendations.map(renderRecommendation)}
                  </div>
                )}

              {!suggestionsLoading &&
                suggestionState.step === "results" &&
                recommendations.length === 0 && (
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
                    No exact matches found. Try changing your area, budget, or amenities.
                  </div>
                )}

              <div ref={bottomRef} />
            </div>

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
