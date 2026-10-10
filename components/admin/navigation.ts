import type { ElementType } from "react";
import { Armchair, LayoutDashboard, Building2, Users, LogOut, ChevronLeft, ChevronRight, Menu, Home, Wallet, Percent, BarChart, Bot, BriefcaseBusiness, GitFork, Bell, PhoneCall, MessageSquare, ShieldCheck, Megaphone, ScanSearch, BrainCircuit, CalendarClock, Search, Folder, ChevronDown, Settings, X } from "lucide-react";

export interface NavItem { title: string; href: string; icon: ElementType; badge?: number; roles?: string[]; }

export const navItems: NavItem[] = [
  { title: "Office / Reception", href: "/admin/dashboard/office", icon: Armchair },
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Traffic Tracker", href: "/admin/dashboard/traffic", icon: BarChart },
  { title: "Security Scanner", href: "/admin/dashboard/security-scanner", icon: ScanSearch },
  { title: "Rooms", href: "/admin/dashboard/rooms", icon: Building2 },
  { title: "Pending Approvals", href: "/admin/dashboard/rooms/pending", icon: Building2 },
  { title: "Approved Rooms", href: "/admin/dashboard/rooms/approved", icon: Building2 },
  { title: "Users", href: "/admin/dashboard/users", icon: Users },
  { title: "Bot Users", href: "/admin/dashboard/bot-users", icon: Bot },
  { title: "Scheduled Posts", href: "/admin/dashboard/scheduled-posts", icon: CalendarClock },
  { title: "Profile UI", href: "/admin/dashboard/profile-ui", icon: ShieldCheck },
  { title: "User Band", href: "/admin/dashboard/user-band", icon: ShieldCheck },
  { title: "Messages", href: "/admin/dashboard/messages", icon: MessageSquare },
  { title: "Notifications", href: "/admin/dashboard/notifications", icon: Bell },
  { title: "Website Notice", href: "/admin/dashboard/site-notice", icon: Megaphone },
  { title: "TikTok Publish", href: "/admin/dashboard/tiktok", icon: Megaphone },
  { title: "Inter Call", href: "/admin/dashboard#inter-call", icon: PhoneCall },
  { title: "AI Training", href: "/admin/dashboard/ai-call", icon: Bot },
  { title: "AI Owner Calling", href: "/admin/dashboard/ai-owner-calling", icon: PhoneCall },
  { title: "Vacancies", href: "/admin/dashboard/vacancies", icon: BriefcaseBusiness },
  { title: "Candidates", href: "/admin/dashboard/candidates", icon: Users },
  { title: "Contact History", href: "/admin/dashboard/candidate-contacts", icon: Users },
  { title: "Referrals", href: "/admin/dashboard/referrals", icon: GitFork },
  { title: "Wallet", href: "/admin/dashboard/wallet", icon: Wallet },
  { title: "Wallet Top-Up", href: "/admin/dashboard/wallet/topup", icon: Wallet },
  { title: "Account Monetize", href: "/admin/dashboard/monetization", icon: ShieldCheck },
  { title: "Commission", href: "/admin/dashboard/commission", icon: Percent },
  { title: "Records", href: "/admin/dashboard/records", icon: BarChart },
  { title: "Staff Tracking", href: "/admin/dashboard/staff-tracking", icon: Users },
  { title: "Chatbot Training", href: "/admin/dashboard/chatbot", icon: Bot },
  { title: "AI Profiles", href: "/admin/dashboard/ai-profiles", icon: Bot },
  { title: "AI Learning", href: "/admin/dashboard/ai-learning", icon: Bot },
  { title: "AI Developer", href: "/admin/dashboard/ai-developer", icon: Bot },
  { title: "AI Flow Monitor", href: "/admin/dashboard/ai-flow-monitor", icon: BrainCircuit },
];

export type NavGroup = "Office" | "Rooms" | "Users" | "AI" | "Finance" | "Settings" | "Others";
const groupPaths: Record<NavGroup, string[]> = {
  Office: ["office", "vacancies", "candidates", "candidate-contacts", "records", "staff-tracking", "#inter-call"],
  Rooms: ["rooms"],
  Users: ["users", "user-band", "messages", "notifications", "referrals"],
  AI: ["bot-users", "bot-engagement", "ai-call", "ai-owner-calling", "chatbot", "ai-profiles", "ai-learning", "ai-developer", "ai-flow-monitor"],
  Finance: ["wallet", "monetization", "commission"],
  Settings: ["profile-ui", "site-notice", "security-scanner"],
  Others: ["traffic", "scheduled-posts", "tiktok"],
};
export const getGroup = (item: NavItem): NavGroup => {
  const route = item.href.replace("/admin/dashboard", "").replace(/^\//, "");
  return (Object.keys(groupPaths) as NavGroup[]).find((group) =>
    groupPaths[group].some((path) => route === path || route.startsWith(path + "/"))
  ) || "Others";
};
export const navGroups = Object.keys(groupPaths) as NavGroup[];

