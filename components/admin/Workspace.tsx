"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Armchair, Building2, Users, BrainCircuit, Wallet, Settings, LayoutGrid, Search, X, ChevronDown, Home } from "lucide-react";
import { AdminHeader } from "./Header";
import { navItems, navGroups, getGroup, type NavGroup } from "./navigation";
import { cn } from "@/lib/utils";

const categories = {
  Office: { icon: Armchair, description: "Reception, clients & staff", color: "bg-primary/10 text-primary" },
  Rooms: { icon: Building2, description: "Listings & approvals", color: "bg-primary/10 text-primary" },
  Users: { icon: Users, description: "People & communication", color: "bg-primary/10 text-primary" },
  AI: { icon: BrainCircuit, description: "Bots, training & automation", color: "bg-primary/10 text-primary" },
  Finance: { icon: Wallet, description: "Payments & commissions", color: "bg-primary/10 text-primary" },
  Settings: { icon: Settings, description: "Website & security", color: "bg-primary/10 text-primary" },
  Others: { icon: LayoutGrid, description: "Publishing & analytics", color: "bg-primary/10 text-primary" },
};
const shortcuts = ["office", "rooms", "users", "records"];

export function AdminWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const home = pathname === "/admin/dashboard";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<NavGroup | "All">("All");
  const [browse, setBrowse] = useState(false);
  const search = query.trim().toLowerCase();
  const services = navItems.filter(item => item.href !== "/admin/dashboard");
  const matches = services.filter(item => (!!search || category === "All" || getGroup(item) === category) && (!search || `${item.title} ${getGroup(item)} ${item.href}`.toLowerCase().includes(search)));
  const current = [...services].sort((a,b) => b.href.length-a.href.length).find(item => !item.href.includes("#") && (pathname === item.href || pathname.startsWith(item.href+"/")));
  const showServices = home || browse;
  const navigate = () => { setBrowse(false); setQuery(""); };

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <AdminHeader />
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/dashboard" onClick={navigate} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary"><Home className="h-4 w-4" />Admin home{!home && <><span className="text-slate-300">/</span><span className="text-slate-900">{current?.title || "Details"}</span></>}</Link>
        {!home && <button type="button" aria-expanded={browse} aria-controls="admin-service-browser" onClick={() => setBrowse(!browse)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-100"><LayoutGrid className="h-4 w-4" />{browse ? "Close services" : "Browse services"}<ChevronDown className={cn("h-4 w-4", browse && "rotate-180")} /></button>}
      </div>
      {home && <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">RoomKhoj workspace</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">What would you like to do?</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">Choose a service below. Rooms, clients, users and your daily work — all in one place.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{shortcuts.map(slug => { const item=services.find(s=>s.href===`/admin/dashboard/${slug}`)!; const Icon=item.icon; return <Link key={slug} href={item.href} onClick={navigate} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 transition hover:bg-white/20"><Icon className="h-5 w-5 text-primary-foreground/90" /><span className="flex-1 text-sm font-semibold">{slug === "records" ? "Client forms" : item.title}</span><ArrowUpRight className="h-4 w-4 text-primary-foreground/70" /></Link>; })}</div>
      </section>}
      {showServices && <section id="admin-service-browser" aria-label="Admin services" className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">Your services</h2><p className="mt-1 text-sm text-slate-500">Choose a category or search for a task.</p></div><div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" /><input aria-label="Search services" placeholder="Search services…" value={query} onChange={e=>setQuery(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />{query && <button type="button" aria-label="Clear service search" onClick={()=>setQuery("")} className="absolute right-3 top-3 text-slate-500"><X className="h-5 w-5" /></button>}</div></div>
        <div className="mb-6 flex flex-wrap gap-2" aria-label="Service categories">{(["All", ...navGroups] as const).map(group=>{ const Icon=group==="All"?LayoutGrid:categories[group].icon; return <button key={group} type="button" aria-pressed={category===group} onClick={()=>setCategory(group)} className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",category===group?"bg-primary text-primary-foreground shadow-sm":"bg-slate-50 text-slate-600 hover:bg-slate-100")}><Icon className="h-4 w-4" />{group}</button>; })}</div>
        {matches.length===0 ? <div role="status" className="py-10 text-center text-sm text-slate-500">No services found. Try another search or category.</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{matches.map(item=>{const group=getGroup(item); const Icon=item.icon; return <Link key={item.href} href={item.href} onClick={navigate} className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm focus-visible:outline-primary"><span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", categories[group].color)}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{group}</p></div><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-primary" /></Link>;})}</div>}
      </section>}
      {home ? <details className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6"><summary className="cursor-pointer text-base font-semibold">Dashboard reports & activity</summary><div className="mt-6">{children}</div></details> : <><Link href="/admin/dashboard" onClick={navigate} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary"><ArrowLeft className="h-4 w-4" />Back to services</Link>{children}</>}
    </div>
  </div>;
}
