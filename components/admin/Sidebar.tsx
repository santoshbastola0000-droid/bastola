"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, Users, LogOut, ChevronLeft, ChevronRight, Menu, Home, Wallet, Percent, BarChart, Bot, BriefcaseBusiness, GitFork, Bell, PhoneCall, MessageSquare, ShieldCheck, Megaphone, ScanSearch, BrainCircuit, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps { isCollapsed: boolean; setIsCollapsed: (collapsed: boolean) => void; isMobile?: boolean; }
interface NavItem { title: string; href: string; icon: React.ElementType; badge?: number; roles?: string[]; }

const navItems: NavItem[] = [
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

export function AdminSidebar({ isCollapsed, setIsCollapsed, isMobile = false }: SidebarProps) {
  const pathname = usePathname(); const router = useRouter(); const { user } = useUserStore(); const { logout } = useLogout();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false); const [isMobileOpen, setIsMobileOpen] = useState(false); const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); useEffect(() => setIsMobileOpen(false), [pathname]);
  const handleLogout = async () => { await logout(); router.push("/auth/login"); };
  const getInitials = () => user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "AD";
  const renderItems = (mobile: boolean) => navItems.map((item) => { const Icon = item.icon; const isActive = pathname === item.href; return <Link key={`${item.href}-${item.title}`} href={item.href} onClick={() => mobile && setIsMobileOpen(false)} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer", isCollapsed && !mobile ? "justify-center" : "", isActive ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white")}><Icon className="h-5 w-5 flex-shrink-0" />{(!isCollapsed || mobile) && <><span className="flex-1 text-sm">{item.title}</span>{item.badge && <Badge className="bg-primary/20 text-primary border-0 text-xs">{item.badge}</Badge>}</>}</Link>; });

  const MobileSidebar = () => <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-40 cursor-pointer"><Menu className="h-5 w-5" /></Button></SheetTrigger><SheetContent side="left" className="w-[280px] p-0"><div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white"><div className="p-6 border-b border-gray-700"><h2 className="font-bold text-lg">RoomKhoj</h2><p className="text-xs text-gray-400">Admin Panel</p></div><nav className="flex-1 overflow-y-auto p-4 space-y-1">{renderItems(true)}</nav><div className="p-4 border-t border-gray-700"><Button variant="ghost" className="w-full justify-start text-red-400" onClick={() => setShowLogoutDialog(true)}><LogOut className="h-4 w-4 mr-3" />Logout</Button></div></div></SheetContent></Sheet>;
  const DesktopSidebar = () => <aside className={cn("hidden md:flex flex-col h-screen sticky top-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300", isCollapsed ? "w-20" : "w-64")}><div className="flex items-center justify-between p-6 border-b border-gray-700"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center"><Home className="h-5 w-5 text-white" /></div>{!isCollapsed && <div><h2 className="font-bold text-lg">RoomKhoj</h2><p className="text-xs text-gray-400">Admin Panel</p></div>}</div><Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-400 hover:text-white"><>{isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</></Button></div><div className={cn("p-4 border-b border-gray-700", isCollapsed && "text-center")}><Avatar className="h-10 w-10 ring-2 ring-primary/50"><AvatarImage src={user?.profilePhotoUrl || undefined} /><AvatarFallback className="bg-primary/20 text-primary">{getInitials()}</AvatarFallback></Avatar>{!isCollapsed && <p className="mt-2 text-sm font-medium truncate">{user?.name || "Admin User"}</p>}</div><nav className="flex-1 overflow-y-auto p-4 space-y-1"><TooltipProvider delayDuration={0}>{renderItems(false).map((item: any) => isCollapsed ? <Tooltip key={item.key || item.props?.href}><TooltipTrigger asChild>{item}</TooltipTrigger>{mounted && <TooltipContent side="right">{item.props?.children?.[1]?.props?.children || "Admin"}</TooltipContent>}</Tooltip> : item)}</TooltipProvider></nav><div className="p-4 border-t border-gray-700"><Button variant="ghost" className={cn("w-full text-red-400", isCollapsed ? "justify-center" : "justify-start")} onClick={() => setShowLogoutDialog(true)}><LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />{!isCollapsed && "Logout"}</Button></div></aside>;
  return <><MobileSidebar />{isMobile ? null : <DesktopSidebar />}<LogoutConfirmDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={handleLogout} /></>;
}
