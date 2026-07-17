export type ChatbotAction = {
  label: string;
  href: string;
};

export type ChatbotReply = {
  text: string;
  action?: ChatbotAction;
};

export type ChatbotTrainingRule = {
  id: string;
  title: string;
  triggers: string[];
  reply: string;
  actionLabel?: string;
  actionHref?: string;
};

export type UserPreferenceProfile = {
  city?: string;
  maxBudget?: number;
  womenOnly?: boolean;
  tenantType?: string;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
};

export const CHATBOT_STORAGE_KEY = "roomkhoj.chatbot.training";
export const CHATBOT_RULES_UPDATED_EVENT = "roomkhoj-chatbot-training-updated";

const DEFAULT_RULES: ChatbotTrainingRule[] = [
  {
    id: "find-room",
    title: "Find rooms",
    triggers: [
      "find room",
      "search room",
      "browse room",
      "available room",
      "kotha khoj",
      "room khoj",
      "room khojna",
      "ghar khojna",
    ],
    reply:
      "To find a room quickly, open **Browse Rooms** and use the search bar, category chips, price filter, and nearby option. Open any room card to see full details, amenities, and owner unlock info.",
    actionLabel: "Browse Rooms",
    actionHref: "/rooms",
  },
  {
    id: "budget-room",
    title: "Budget rooms",
    triggers: ["cheap room", "budget room", "low price", "sasto room", "sasto kotha"],
    reply:
      "For budget-friendly rooms, open **Browse Rooms** and sort by lower price or set a smaller price range. That makes it easier to compare affordable options first.",
    actionLabel: "View Budget Rooms",
    actionHref: "/rooms",
  },
  {
    id: "women-friendly-room",
    title: "Women-friendly rooms",
    triggers: [
      "women room",
      "female room",
      "ladies room",
      "girls hostel",
      "women friendly",
      "mahila room",
    ],
    reply:
      "You can find women-friendly listings from **Browse Rooms** and check the **Women OK** badge on room cards. Open the room page for more rules and tenant preference details.",
    actionLabel: "Browse Women-Friendly",
    actionHref: "/rooms",
  },
  {
    id: "amenities-room",
    title: "Amenities and furnished rooms",
    triggers: [
      "wifi",
      "parking",
      "kitchen",
      "furnished",
      "amenities",
      "facility",
      "facilities",
    ],
    reply:
      "Room cards show the main amenities like Wi‑Fi, parking, and kitchen. Open a room to see the full amenity list, water timings, and house rules before you decide.",
    actionLabel: "Explore Rooms",
    actionHref: "/rooms",
  },
  {
    id: "location-room",
    title: "Location and nearby search",
    triggers: [
      "location",
      "near me",
      "nearby room",
      "pokhara room",
      "city room",
      "address room",
    ],
    reply:
      "Use **Browse Rooms** to search by city or area, and use the nearby option when available. Every room page also shows its address and map details for easier comparison.",
    actionLabel: "Search by Location",
    actionHref: "/rooms",
  },
  {
    id: "owner-contact",
    title: "Owner contact and unlock",
    triggers: [
      "owner contact",
      "contact owner",
      "phone number",
      "call owner",
      "unlock room",
      "service charge",
    ],
    reply:
      "Open the room details page to unlock the owner's contact details. If a service charge applies, the page shows the amount clearly before you continue.",
    actionLabel: "See Rooms",
    actionHref: "/rooms",
  },
  {
    id: "add-room",
    title: "Add room",
    triggers: ["add room", "create room", "list room", "new room", "room post"],
    reply:
      "To add a new room, click **Add New Room** in the sidebar or tap the ＋ button. Fill in the title, price, address, amenities, and photos, then submit it for approval.",
    actionLabel: "Add Room Now",
    actionHref: "/user/dashboard/rooms/create",
  },
  {
    id: "wallet",
    title: "Wallet",
    triggers: ["wallet", "balance", "money", "earning", "earnings"],
    reply:
      "Your wallet shows your earnings and transaction history. You can top up or withdraw from the Wallet section in the sidebar.",
    actionLabel: "Go to Wallet",
    actionHref: "/user/dashboard/wallet",
  },
  {
    id: "approval",
    title: "Room approval",
    triggers: ["approval", "approv", "pending", "review", "status", "room status"],
    reply:
      "After submitting a room, it goes to **Pending** status and an admin reviews it within 24-48 hours. You can track it under **Pending Approvals** in the sidebar.",
    actionLabel: "View Pending",
    actionHref: "/user/dashboard/rooms/pending",
  },
  {
    id: "verification",
    title: "Verification",
    triggers: ["verification", "verif", "badge", "verified"],
    reply:
      "Your account is verified automatically when you confirm your email during signup. The blue ✓ badge appears on your profile once verified.",
    actionLabel: "View Profile",
    actionHref: "/user/dashboard/profile",
  },
  {
    id: "profile",
    title: "Profile",
    triggers: ["profile", "edit profile", "name", "phone", "update profile"],
    reply:
      "You can update your name and phone number from your Profile page. Click **Edit Profile** to make changes.",
    actionLabel: "Go to Profile",
    actionHref: "/user/dashboard/profile",
  },
  {
    id: "my-rooms",
    title: "My rooms",
    triggers: ["my rooms", "my room", "view my room", "listed room"],
    reply:
      "All your listed rooms are available under **My Rooms** in the sidebar, where you can review and manage them.",
    actionLabel: "My Rooms",
    actionHref: "/user/dashboard/rooms",
  },
  {
    id: "rejected-room",
    title: "Rejected room",
    triggers: ["reject", "denied", "rejected room"],
    reply:
      "If your room was rejected, an admin should have provided a reason. You can edit and resubmit the listing from the Rejected Rooms section.",
  },
  {
    id: "greeting",
    title: "Greeting",
    triggers: ["hello", "hi", "hey", "namaste"],
    reply:
      "Hello! 👋 I'm your RoomKhoj assistant. I can help with finding rooms, room rules, approval, wallet, and listing questions. What would you like to know?",
  },
  {
    id: "help",
    title: "Help",
    triggers: ["help", "what can you do", "k garna sakchau", "assist"],
    reply:
      "I can help you with:\n• Finding rooms\n• Budget and women-friendly room tips\n• Amenities and owner unlock info\n• Adding or managing rooms\n• Wallet, profile, and approval status\n\nJust ask me anything!",
  },
];

const DEFAULT_QUICK_REPLIES = [
  "Find rooms near me",
  "Show women-friendly rooms",
  "How do I add a room?",
  "Room approval process",
];

const PREFERENCE_STORAGE_KEY = "roomkhoj.user.preferences";

export function createChatbotRuleId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function sanitizeRule(rule: unknown): ChatbotTrainingRule | null {
  if (!rule || typeof rule !== "object") return null;

  const candidate = rule as Partial<ChatbotTrainingRule>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const reply = typeof candidate.reply === "string" ? candidate.reply.trim() : "";
  const triggers = Array.isArray(candidate.triggers)
    ? candidate.triggers
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  if (!title || !reply || triggers.length === 0) return null;

  return {
    id:
      typeof candidate.id === "string" && candidate.id.trim()
        ? candidate.id.trim()
        : createChatbotRuleId(),
    title,
    triggers,
    reply,
    actionLabel:
      typeof candidate.actionLabel === "string" && candidate.actionLabel.trim()
        ? candidate.actionLabel.trim()
        : undefined,
    actionHref:
      typeof candidate.actionHref === "string" && candidate.actionHref.trim()
        ? candidate.actionHref.trim()
        : undefined,
  };
}

function buildAction(rule: ChatbotTrainingRule): ChatbotAction | undefined {
  if (!rule.actionLabel || !rule.actionHref) return undefined;
  return {
    label: rule.actionLabel,
    href: rule.actionHref,
  };
}

function matchesRule(input: string, rule: ChatbotTrainingRule) {
  return rule.triggers.some((trigger) => {
    const normalizedTrigger = normalize(trigger);
    return normalizedTrigger && input.includes(normalizedTrigger);
  });
}

export function getDefaultChatbotRules() {
  return DEFAULT_RULES;
}

export function getStoredChatbotRules(): ChatbotTrainingRule[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CHATBOT_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((rule) => sanitizeRule(rule))
      .filter((rule): rule is ChatbotTrainingRule => Boolean(rule));
  } catch {
    return [];
  }
}

export function saveStoredChatbotRules(rules: ChatbotTrainingRule[]) {
  if (typeof window === "undefined") return;

  const sanitized = rules
    .map((rule) => sanitizeRule(rule))
    .filter((rule): rule is ChatbotTrainingRule => Boolean(rule));

  window.localStorage.setItem(CHATBOT_STORAGE_KEY, JSON.stringify(sanitized));
  window.dispatchEvent(new Event(CHATBOT_RULES_UPDATED_EVENT));
}

export function getChatbotQuickReplies(customRules: ChatbotTrainingRule[] = []) {
  const customReplies = customRules
    .slice(0, 2)
    .map((rule) => rule.title)
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_QUICK_REPLIES, ...customReplies])).slice(
    0,
    6,
  );
}

export function findChatbotReply(
  input: string,
  customRules: ChatbotTrainingRule[] = [],
): ChatbotReply {
  const normalizedInput = normalize(input);
  const rules = [...customRules, ...DEFAULT_RULES];

  const matchedRule = rules.find((rule) => matchesRule(normalizedInput, rule));
  if (matchedRule) {
    return {
      text: matchedRule.reply,
      action: buildAction(matchedRule),
    };
  }

  return {
    text:
      "I'm not sure about that yet. Try asking about finding rooms, women-friendly rooms, amenities, owner unlock info, approval process, or profile settings.",
  };
}

function isRoomDiscoveryQuery(input: string): boolean {
  const discoveryPhrases = [
    "find room",
    "search room",
    "room khoj",
    "kotha khoj",
    "room near",
    "nearby room",
    "room kata xa",
    "kotha kata xa",
    "kata xa room",
    "suggest room",
    "recommend room",
    "room dinos",
    "room deu",
  ];
  return discoveryPhrases.some((phrase) => input.includes(phrase));
}

export function saveUserPreferences(preferences: UserPreferenceProfile) {
  if (typeof window === "undefined") return;
  const existing = getUserPreferences();
  const next: UserPreferenceProfile = { ...existing, ...preferences };
  window.localStorage.setItem(
    PREFERENCE_STORAGE_KEY,
    JSON.stringify(next),
  );
}

export function getUserPreferences(): UserPreferenceProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UserPreferenceProfile;
  } catch {
    return {};
  }
}

export function clearUserPreferences() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PREFERENCE_STORAGE_KEY);
}

export { isRoomDiscoveryQuery };
