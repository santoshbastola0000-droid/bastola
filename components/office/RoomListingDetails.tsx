"use client";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { playUiSound } from "@/lib/ui-sounds";
import { SoundToggle } from "@/components/SiteSoundEffects";
import { X, LockKeyhole, MapPin, MessageCircle } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";
import { officeBackend, officeError } from "@/http/services/office.service";
import { PublicRoomDetails } from "./PublicRoomDetails";
import { RoomContactUnlock, type AvailableRoom } from "./RoomAvailability";
import { RoomListingActions } from "./RoomListingActions";

function AdminRoomMessage({room,compact=false}: {room:AvailableRoom;compact?:boolean}) {
  const user=useUserStore(state=>state.user);
  const messageId=useId();
  const router=useRouter();
  const [message,setMessage]=useState("नमस्ते, यो room अझै available छ?");
  const [busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState("");
  const pending=useRef(false);
  async function send(event:FormEvent) {
    event.preventDefault();if(pending.current||!user)return;
    pending.current=true;setBusy(true);setError("");
    try {
      const r=await privateApi.post("/message/room-admin/rooms/"+encodeURIComponent(room.id)+"/send",{content:message.trim()});
      const data=r.data?.data||r.data;
      setSent(true);playUiSound("sent");
      window.dispatchEvent(new Event("roomkhoj:unread-refresh"));
      router.push("/messages?conversation="+encodeURIComponent(data.conversationId));
    } catch(e) {
      const status=(e as {response?:{status?:number}})?.response?.status;
      setError(status===404?"Chat अहिले उपलब्ध छैन। कृपया केही समयपछि प्रयास गर्नुहोस्।":officeError(e));
    }
    finally {pending.current=false;setBusy(false);}
  }
  return <section id={messageId+"-box"} className={compact?"rounded-xl border border-border bg-card p-2.5 text-card-foreground":"rounded-2xl border border-border bg-card p-3 text-card-foreground sm:p-4"}>
    <h3 className="flex items-center gap-1.5 text-xs font-semibold"><MessageCircle className="h-4 w-4 text-primary" aria-hidden="true"/>Message Room Khoj</h3>
    {sent?<p role="status" className="mt-3 rounded-xl bg-primary/10 p-3 text-sm text-primary">Message पठाइयो। Messages box मा कुराकानी जारी राख्नुहोस्।</p>:user?<form onSubmit={send} className="mt-2 flex items-end gap-2">
      <label className="sr-only" htmlFor={messageId}>Your private message</label>
      <textarea id={messageId} required minLength={1} maxLength={2000} rows={1} value={message} onChange={e=>setMessage(e.target.value)} className="min-h-10 min-w-0 flex-1 resize-y rounded-xl border-0 bg-muted px-3 py-2 text-[16px] leading-6 sm:text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <button disabled={busy||!message.trim()} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">{busy?"Sending…":"Send"}</button>
    </form>:<Link href="/auth/login" className="mt-3 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">Log in to message admin</Link>}
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
  return <div ref={container} className={compact?"space-y-2.5 p-3 text-card-foreground":"space-y-4 p-4 text-card-foreground sm:p-5"}>
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className={compact?"min-w-0 break-words text-base font-bold leading-snug":"min-w-0 break-words text-xl font-extrabold leading-tight"}>{onDetails?<button type="button" onClick={onDetails} className="text-left hover:text-primary">{room.title||"Room for rent"}</button>:room.title||"Room for rent"}</h3><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">Available</span></div>
      <p className={compact?"mt-0.5 text-base font-bold":"mt-1 text-lg font-bold"}>{Number.isFinite(rent)&&rent>0?<>रु {rent.toLocaleString()}<span className="text-sm font-semibold">/month</span></>:<span className="text-sm">Ask reception for rent</span>}</p>
      <p className="mt-1.5 flex items-start gap-1 text-xs font-medium text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/><span className="min-w-0 break-words">{room.location||"Location not entered"}</span></p>
    </div>
    <AdminRoomMessage room={room} compact={compact}/>
    <RoomListingActions room={room} onMessage={message} compact={compact}/>
    <section className="space-y-1">{!compact&&<h4 className="text-base font-extrabold">Description</h4>}<p className={"whitespace-pre-line break-words "+(compact?"line-clamp-2 text-xs leading-5":"text-sm leading-relaxed")}>{room.details||("Room for rent in "+room.location+". Contact Room Khoj for availability and viewing.")}</p><p className="text-[10px] text-muted-foreground">Room code · <span className="font-mono">{room.code}</span></p></section>
    {onDetails?<button type="button" onClick={onDetails} className="w-full rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10">View all room details</button>:<><details className="rounded-xl border border-border"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-primary">Facilities & all room details</summary><div className="p-2"><PublicRoomDetails room={room}/></div></details><RoomContactUnlock roomId={room.id}/></>}
    {!compact&&room.tiktokUrl&&<a href={room.tiktokUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-primary underline underline-offset-4">Watch TikTok video ↗</a>}
  </div>;
}

export function RoomListingDetails({room,onClose}: {room:AvailableRoom;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const node=dialog.current,previous=document.body.style.overflow;
    node?.showModal();document.body.style.overflow="hidden";
    return ()=>{node?.close();document.body.style.overflow=previous;};
  },[]);
  return <dialog ref={dialog} onCancel={event=>{event.preventDefault();onClose();}} aria-label={room.title+" details"} className="fixed inset-0 m-auto h-[100dvh] max-h-[100dvh] w-full max-w-none overflow-y-auto bg-card p-0 text-card-foreground backdrop:bg-slate-950/60 sm:h-[92dvh] sm:max-w-2xl sm:rounded-3xl">
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur"><button type="button" onClick={onClose} autoFocus aria-label="Close room details" className="rounded-full p-2 hover:bg-muted"><X className="h-6 w-6"/></button><span className="font-mono text-xs text-muted-foreground">{room.code}</span><SoundToggle/></div>
    {room.hasVideo!==false?<video data-video-intent="room" controls playsInline preload="metadata" aria-label={room.title+" room video"} className="aspect-[4/3] w-full bg-black object-contain" src={officeBackend+"/office/availability/"+encodeURIComponent(room.id)+"/video"}/>:<div className="flex aspect-video items-center justify-center bg-slate-100"><img src="/roomkhoj-logo.png" alt="RoomKhoj — no video available" className="h-24 w-24 object-contain"/></div>}
    <RoomListingBody room={room}/>

  </dialog>;
}

export function SharedAvailabilityRoom({id}: {id:string}) {
  const [room,setRoom]=useState<AvailableRoom|null>(null),[error,setError]=useState("");
  useEffect(()=>{let alive=true;setRoom(null);setError("");api.get("/office/availability/"+encodeURIComponent(id)).then(r=>{if(alive)setRoom(r.data?.data||r.data);}).catch(()=>{if(alive)setError("यो room अहिले उपलब्ध छैन वा link मिलेन।");});return()=>{alive=false;};},[id]);
  return room?<RoomListingDetails room={room} onClose={()=>{const url=new URL(window.location.href);url.searchParams.delete("room");window.history.replaceState(null,"",url);setRoom(null);}}/>:error?<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>:null;
}
