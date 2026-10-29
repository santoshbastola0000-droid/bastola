"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2, Clapperboard, MessageCircle, UserRound } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
export function DesktopPrimaryNav({isAuthenticated=false,light=false,className=""}:{isAuthenticated?:boolean;light?:boolean;className?:string}) {
 const path=usePathname(),{language}=useLanguage();
 const items=[
  {key:"feed",label:language==="ne"?"फिड":"Feed",href:isAuthenticated?"/feed":"/rooms",icon:Home,active:path.startsWith("/feed")},
  {key:"room",label:language==="ne"?"कोठा":"Room",href:"/rooms",icon:Building2,active:path.startsWith("/rooms")||(!isAuthenticated&&path==="/")},
  {key:"reels",label:language==="ne"?"रिल्स":"Reels",href:"/reels",icon:Clapperboard,active:path.startsWith("/reels")},
  {key:"messages",label:language==="ne"?"सन्देश":"Messages",href:"/messages",icon:MessageCircle,active:path.startsWith("/messages")},
  {key:"profile",label:language==="ne"?"प्रोफाइल":"Profile",href:"/user/dashboard/profile",icon:UserRound,active:path.startsWith("/user/dashboard/profile")},
 ];
 return <nav aria-label="Primary navigation" className={"hidden items-center gap-1 md:flex "+className}>
  {items.map(item=><Link key={item.key} href={item.href} data-ui-sound aria-current={item.active?"page":undefined} className={"flex min-h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring "+(item.active?"bg-primary/10 text-primary":light?"text-white/85 hover:bg-white/10 hover:text-white":"text-muted-foreground hover:bg-muted hover:text-primary")}><item.icon className="h-5 w-5" aria-hidden="true"/><span>{item.label}</span></Link>)}
 </nav>;
}
