"use client";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { playUiSound, unlockSounds } from "@/lib/ui-sounds";
import { SoundToggle } from "@/components/SiteSoundEffects";
import { X, LockKeyhole, MapPin, MessageCircle, ChevronRight, CalendarDays } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";
import { officeBackend, officeError } from "@/http/services/office.service";
import { PublicRoomDetails } from "./PublicRoomDetails";
import { RoomContactUnlock, type AvailableRoom } from "./RoomAvailability";
import { ReportRoom } from "./ReportRoom";
import { RoomListingActions } from "./RoomListingActions";

const listingDay = new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kathmandu"});
const listingTime = new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Kathmandu"});

function AdminRoomMessage({room,compact=false}: {room:AvailableRoom;compact?:boolean}) {
  const user=useUserStore(state=>state.user);
  const messageId=useId();
  const [message,setMessage]=useState("नमस्ते, यो room अझै available छ?");
  const [busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState("");
  const pending=useRef(false);
  async function send(event:FormEvent) {
    event.preventDefault();if(pending.current||!user)return;
    unlockSounds();
    pending.current=true;setBusy(true);setError("");
    try {
      await privateApi.post("/message/room-admin/rooms/"+encodeURIComponent(room.id)+"/send",{content:message.trim()});
      setSent(true);playUiSound("sent");
      window.dispatchEvent(new Event("roomkhoj:unread-refresh"));
    } catch(e) {
      const status=(e as {response?:{status?:number}})?.response?.status;
      setError(status===404?"Chat अहिले उपलब्ध छैन। कृपया केही समयपछि प्रयास गर्नुहोस्।":officeError(e));
    }
    finally {pending.current=false;setBusy(false);}
  }
  return <section id={messageId+"-box"} className={compact?"rounded-xl border border-border bg-card p-2.5 text-card-foreground":"rounded-2xl border border-border bg-card p-3 text-card-foreground sm:p-4"}>
    <h3 className="flex items-center gap-1.5 text-xs font-semibold"><MessageCircle className="h-4 w-4 text-primary" aria-hidden="true"/>Message Room Khoj</h3>
    {sent?<p role="status" className="mt-3 rounded-xl bg-primary/10 p-3 text-sm text-primary">Message पठाइयो। अरू room हेर्न सक्नुहुन्छ। Reply Messages मा आउँछ।</p>:user?<form onSubmit={send} className="mt-2 flex items-end gap-2">
      <label className="sr-only" htmlFor={messageId}>Your private message</label>
      <textarea id={messageId} required minLength={1} maxLength={2000} rows={1} value={message} onChange={e=>setMessage(e.target.value)} className="min-h-10 min-w-0 flex-1 resize-y rounded-xl border-0 bg-muted px-3 py-2 text-[16px] leading-6 sm:text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <button disabled={busy||!message.trim()} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">{busy?"Sending…":"Send"}</button>
    </form>:<Link href="/auth/login" onClick={()=>sessionStorage.setItem("roomkhoj_post_auth_redirect","/rooms?room="+encodeURIComponent(room.id))} className="mt-3 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">Log in to message admin</Link>}
    {!compact&&<p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground"><LockKeyhole className="h-3 w-3 shrink-0" aria-hidden="true"/>Private chat · Admin मात्र</p>}
    {error&&<p role="alert" className="mt-2 break-words text-xs leading-snug text-destructive">{error}</p>}
  </section>;

}

export function RoomListingBody({room,onDetails,compact=false}: {room:AvailableRoom;onDetails?:()=>void;compact?:boolean}) {
  const container=useRef<HTMLDivElement>(null);
  function message() {
    const target=container.current?.querySelector<HTMLTextAreaElement>("textarea");
    const box=container.current?.querySelector<HTMLElement>("section");
    box?.scrollIntoView({behavior:"smooth",block:"center"});
    target?.focus({preventScroll:true});
  }
  const rent=Number(room.price);
  const listingDate=room.createdAt?new Date(room.createdAt):null;
  const validListingDate=listingDate&&!Number.isNaN(listingDate.getTime())?listingDate:null;
  return <div ref={container} className={compact?"space-y-2 p-2.5 text-card-foreground":"space-y-4 p-4 text-card-foreground sm:p-5"}>
    {compact ? <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 break-words text-[13px] font-bold leading-snug">{onDetails?<button type="button" onClick={onDetails} className="text-left transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{room.title||"Room for rent"}</button>:room.title||"Room for rent"}</h3>
        <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-4 text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true"/><span className="line-clamp-2 min-w-0 break-words">{room.location||"Location not entered"}</span></p>
      </div>
      <div className="shrink-0 rounded-lg border border-primary/10 bg-primary/5 px-2 py-1.5 text-right">
        <p className="text-sm font-extrabold leading-none tracking-tight text-primary">{Number.isFinite(rent)&&rent>0?"रु "+rent.toLocaleString():"Ask rent"}</p>
        <p className="mt-1 text-[10px] font-medium text-muted-foreground">per month</p>
      </div>
    </div> : (
<div>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className={compact?"min-w-0 break-words text-base font-bold leading-snug":"min-w-0 break-words text-xl font-extrabold leading-tight"}>{onDetails?<button type="button" onClick={onDetails} className="text-left hover:text-primary">{room.title||"Room for rent"}</button>:room.title||"Room for rent"}</h3><span role="img" aria-label="Room available" className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"/></div>
      <p className={compact?"mt-0.5 text-base font-bold":"mt-1 text-lg font-bold"}>{Number.isFinite(rent)&&rent>0?<>रु {rent.toLocaleString()}<span className="text-sm font-semibold">/month</span></>:<span className="text-sm">Ask reception for rent</span>}</p>
      <p className="mt-1.5 flex items-start gap-1 text-xs font-medium text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/><span className="min-w-0 break-words">{room.location||"Location not entered"}</span></p>
    </div>
    )}
    {validListingDate&&<p className="flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarDays className="h-3 w-3" aria-hidden="true"/><span>Listed · <time dateTime={validListingDate.toISOString()} title={listingTime.format(validListingDate)+" (Nepal time)"}>{compact?listingDay.format(validListingDate):listingTime.format(validListingDate)+" (Nepal time)"}</time></span></p>}
    <AdminRoomMessage room={room} compact={compact}/>
    <RoomListingActions room={room} onMessage={message} compact={compact}/>
    <section className={compact?"space-y-1 rounded-lg bg-muted/40 px-2.5 py-2":"space-y-1"}>{!compact&&<h4 className="text-base font-extrabold">Description</h4>}<p className={"whitespace-pre-line break-words "+(compact?"line-clamp-2 text-[11px] leading-4":"text-sm leading-relaxed")}>{room.details||("Room for rent in "+room.location+". Contact Room Khoj for availability and viewing.")}</p>{!compact&&<p className="text-[10px] text-muted-foreground">Room code · <span className="font-mono">{room.code}</span></p>}</section>
    {onDetails?<button type="button" onClick={onDetails} className="flex min-h-9 w-full items-center justify-between rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"><span>View all room details</span><ChevronRight className="h-4 w-4" aria-hidden="true"/></button>:<><details className="rounded-xl border border-border"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-primary">Facilities & all room details</summary><div className="p-2"><PublicRoomDetails room={room}/></div></details><RoomContactUnlock roomId={room.id}/></>}
    {!compact&&room.tiktokUrl&&<a href={room.tiktokUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-primary underline underline-offset-4">Watch TikTok video ↗</a>}
  </div>;
}

export function RoomListingDetails({room,onClose}: {room:AvailableRoom;onClose:()=>void}) {
  const user=useUserStore(state=>state.user);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    if(!user)return;
    const node=dialog.current,previous=document.body.style.overflow;
    node?.showModal();document.body.style.overflow="hidden";
    return ()=>{node?.close();document.body.style.overflow=previous;};
  },[user]);
  if(!user)return null;
  return <dialog ref={dialog} onCancel={event=>{event.preventDefault();onClose();}} aria-label={room.title+" details"} className="fixed inset-0 m-auto h-[100dvh] max-h-[100dvh] w-full max-w-none overflow-y-auto bg-card p-0 text-card-foreground backdrop:bg-slate-950/60 sm:h-[92dvh] sm:max-w-2xl sm:rounded-3xl">
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur"><button type="button" onClick={onClose} autoFocus aria-label="Close room details" className="rounded-full p-2 hover:bg-muted"><X className="h-6 w-6"/></button><span className="font-mono text-xs text-muted-foreground">{room.code}</span><SoundToggle/></div>
    {room.hasVideo!==false?<video data-video-intent="room" controls playsInline preload="metadata" aria-label={room.title+" room video"} className="aspect-[4/3] w-full bg-black object-contain" src={officeBackend+"/office/availability/"+encodeURIComponent(room.id)+"/video"}/>:<div className="flex aspect-video items-center justify-center bg-slate-100"><img src="/roomkhoj-logo.png" alt="RoomKhoj — no video available" className="h-24 w-24 object-contain"/></div>}
    <RoomListingBody room={room}/>
    <ReportRoom key={room.id} roomId={room.id}/>

  </dialog>;
}

export function SharedAvailabilityRoom({id}: {id:string}) {
  const user=useUserStore(state=>state.user);
  const [room,setRoom]=useState<AvailableRoom|null>(null),[error,setError]=useState("");
  useEffect(()=>{
    if(!user)return;
    let alive=true;setRoom(null);setError("");
    api.get("/office/availability/"+encodeURIComponent(id)).then(r=>{if(alive)setRoom(r.data?.data||r.data);}).catch(()=>{if(alive)setError("यो room अहिले उपलब्ध छैन वा link मिलेन।");});
    return()=>{alive=false;};
  },[id,user]);
  if(!user)return <button type="button" onClick={()=>{sessionStorage.setItem("roomkhoj_post_auth_redirect","/rooms?room="+encodeURIComponent(id));window.dispatchEvent(new Event("roomkhoj:open-login"));}} className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">यो room को details हेर्न Login गर्नुहोस्</button>;
  return room?<RoomListingDetails room={room} onClose={()=>{const url=new URL(window.location.href);url.searchParams.delete("room");window.history.replaceState(null,"",url);setRoom(null);}}/>:error?<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>:null;
}
