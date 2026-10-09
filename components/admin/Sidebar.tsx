"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Armchair, LayoutDashboard, Building2, Users, LogOut, ChevronLeft, ChevronRight, Menu, Home, Wallet, Percent, BarChart, Bot, BriefcaseBusiness, GitFork, Bell, PhoneCall, MessageSquare, ShieldCheck, Megaphone, ScanSearch, BrainCircuit, CalendarClock, Search, Folder, ChevronDown, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { navItems, getGroup, navGroups, type NavItem, type NavGroup } from "./navigation";

interface SidebarProps { isCollapsed: boolean; setIsCollapsed: (collapsed: boolean) => void; isMobile?: boolean; }

export function AdminSidebar({ isCollapsed, setIsCollapsed, isMobile = false }: SidebarProps) {
  const pathname = usePathname(); const router = useRouter(); const { user } = useUserStore(); const { logout } = useLogout();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false); const [isMobileOpen, setIsMobileOpen] = useState(false); const [query, setQuery] = useState("");
  const [openGroup, setOpenGroup] = useState<NavGroup | null>(() => getGroup(navItems.find((item) => item.href === pathname) || navItems[0]));
  useEffect(() => { const item = [...navItems].sort((a, b) => b.href.length - a.href.length).find((item) => !item.href.includes("#") && (pathname === item.href || pathname.startsWith(item.href + "/"))); if (item && item.href !== "/admin/dashboard") setOpenGroup(getGroup(item)); }, [pathname]); useEffect(() => setIsMobileOpen(false), [pathname]);
  const handleLogout = async () => { await logout(); router.push("/auth/login"); };
  const getInitials = () => user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "AD";
  const renderLink = (item: NavItem, mobile: boolean) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} onClick={() => { if (mobile) setIsMobileOpen(false); }} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-all", isActive ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white")}>
      <Icon className="h-4 w-4 flex-shrink-0" /><span className="flex-1 text-sm">{item.title}</span>{item.badge ? <Badge>{item.badge}</Badge> : null}
    </Link>;
  };
  const renderItems = (mobile: boolean) => {
    const compact = isCollapsed && !mobile;
    const search = query.trim().toLowerCase();
    const groups = navGroups.map((group) => ({ group, items: navItems.filter((item) => item.href !== "/admin/dashboard" && getGroup(item) === group && (!search || (item.title + " " + group + " " + item.href).toLowerCase().includes(search))) })).filter(({items}) => items.length > 0);
    return <>
      {compact ? <Button variant="ghost" size="icon" aria-label="Expand sidebar to search services" title="Search services" onClick={() => setIsCollapsed(false)}><Search className="h-5 w-5" /></Button> :
        <div className="relative mb-4"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input aria-label="Search admin services" placeholder="Search services..." value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-gray-600 bg-gray-800 py-2.5 pl-9 pr-8 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-2.5 text-gray-400"><X className="h-4 w-4" /></button>}</div>}
      {(!search || "dashboard".includes(search)) && (compact ? <Link href="/admin/dashboard" title="Dashboard" aria-label="Dashboard" className="flex justify-center rounded-lg p-3 text-gray-300 hover:bg-gray-800"><LayoutDashboard className="h-5 w-5" /></Link> : renderLink(navItems.find((item) => item.href === "/admin/dashboard")!, mobile))}
      {groups.map(({group, items}) => {
        const expanded = !!search || openGroup === group;
        const Icon = group === "Settings" ? Settings : group === "Office" ? Armchair : group === "AI" ? BrainCircuit : group === "Users" ? Users : Folder;
        return <div key={group}>
          <button type="button" title={group} aria-label={group + " services"} aria-expanded={!compact && expanded} aria-controls={(mobile ? "mobile" : "desktop") + "-" + group} onClick={() => { if (compact) { setIsCollapsed(false); setOpenGroup(group); } else setOpenGroup(openGroup === group ? null : group); }} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-800", compact && "justify-center", openGroup === group ? "text-white bg-gray-800/70" : "text-gray-300")}>
            <Icon className="h-5 w-5 shrink-0" />{!compact && <><span className="flex-1 text-left">{group}</span><span className="text-xs text-gray-400">{items.length}</span><ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} /></>}
          </button>
          {!compact && expanded && <div id={(mobile ? "mobile" : "desktop") + "-" + group} className="ml-4 border-l border-gray-600 pl-2 py-1 space-y-1">{items.map((item) => renderLink(item, mobile))}</div>}
        </div>;
      })}
      {search && groups.length === 0 && !"dashboard".includes(search) && <p role="status" className="px-3 py-4 text-sm text-gray-400">No services found.</p>}
    </>;
  };

  const MobileSidebar = () => <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-40 cursor-pointer"><Menu className="h-5 w-5" /></Button></SheetTrigger><SheetContent side="left" className="w-[280px] p-0"><div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white"><div className="p-6 border-b border-gray-700"><h2 className="font-bold text-lg">RoomKhoj</h2><p className="text-xs text-gray-400">Admin Panel</p></div><nav className="flex-1 overflow-y-auto p-4 space-y-1">{renderItems(true)}</nav><div className="p-4 border-t border-gray-700"><Button variant="ghost" className="w-full justify-start text-red-400" onClick={() => setShowLogoutDialog(true)}><LogOut className="h-4 w-4 mr-3" />Logout</Button></div></div></SheetContent></Sheet>;
  const DesktopSidebar = () => <aside className={cn("hidden md:flex flex-col h-screen sticky top-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300", isCollapsed ? "w-20" : "w-64")}><div className="flex items-center justify-between p-6 border-b border-gray-700"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center"><Home className="h-5 w-5 text-white" /></div>{!isCollapsed && <div><h2 className="font-bold text-lg">RoomKhoj</h2><p className="text-xs text-gray-400">Admin Panel</p></div>}</div><Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-400 hover:text-white"><>{isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</></Button></div><div className={cn("p-4 border-b border-gray-700", isCollapsed && "text-center")}><Avatar className="h-10 w-10 ring-2 ring-primary/50"><AvatarImage src={user?.profilePhotoUrl || undefined} /><AvatarFallback className="bg-primary/20 text-primary">{getInitials()}</AvatarFallback></Avatar>{!isCollapsed && <p className="mt-2 text-sm font-medium truncate">{user?.name || "Admin User"}</p>}</div><nav className="flex-1 overflow-y-auto p-4 space-y-1">{renderItems(false)}</nav><div className="p-4 border-t border-gray-700"><Button variant="ghost" className={cn("w-full text-red-400", isCollapsed ? "justify-center" : "justify-start")} onClick={() => setShowLogoutDialog(true)}><LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />{!isCollapsed && "Logout"}</Button></div></aside>;
  return <>{MobileSidebar()}{isMobile ? null : DesktopSidebar()}<LogoutConfirmDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={handleLogout} /></>;
}

