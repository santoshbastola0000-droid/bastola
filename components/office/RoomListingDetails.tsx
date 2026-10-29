"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { playUiSound } from "@/lib/ui-sounds";
import { SoundToggle } from "@/components/SiteSoundEffects";
import { X, LockKeyhole, Send, MapPin } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";
import { officeBackend, officeError } from "@/http/services/office.service";
import { PublicRoomDetails } from "./PublicRoomDetails";
import { RoomContactUnlock, type AvailableRoom } from "./RoomAvailability";
import { RoomListingActions } from "./RoomListingActions";

function AdminRoomMessage({room}: {room:AvailableRoom}) {
  const user=useUserStore(state=>state.user);
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
    } catch(e) {setError(officeError(e));}
    finally {pending.current=false;setBusy(false);}
  }
  return <section id={"admin-message-"+room.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="font-bold">Message Room Khoj admin</h3>
    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><LockKeyhole className="h-3 w-3" aria-hidden="true"/>यो message admin ले मात्र हेर्न मिल्छ।</p>
    {sent?<p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Message पठाइयो। Admin ले हेरेपछि तपाईंलाई सम्पर्क गर्न सक्नुहुन्छ।</p>:user?<form onSubmit={send} className="mt-3 space-y-2">
      <label className="sr-only" htmlFor={"room-message-"+room.id}>Your private message</label>
      <textarea id={"room-message-"+room.id} required minLength={1} maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} className="min-h-24 w-full resize-y rounded-xl border bg-slate-50 p-3 text-sm" />
      <button disabled={busy||!message.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Send className="h-4 w-4" aria-hidden="true"/>{busy?"Sending…":"Send to admin"}</button>
    </form>:<Link href="/auth/login" className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Log in to message admin</Link>}
    {error&&<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}

export function RoomListingDetails({room,onClose}: {room:AvailableRoom;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const node=dialog.current,previous=document.body.style.overflow;
    node?.showModal();document.body.style.overflow="hidden";
    return ()=>{node?.close();document.body.style.overflow=previous;};
  },[]);
  function message() {
    document.getElementById("admin-message-"+room.id)?.scrollIntoView({behavior:"smooth",block:"center"});
    document.getElementById("room-message-"+room.id)?.focus({preventScroll:true});
  }
  return <dialog ref={dialog} onCancel={event=>{event.preventDefault();onClose();}} aria-label={room.title+" details"} className="fixed inset-0 m-auto h-[100dvh] max-h-[100dvh] w-full max-w-none overflow-y-auto bg-white p-0 text-slate-900 backdrop:bg-slate-950/60 sm:h-[92dvh] sm:max-w-2xl sm:rounded-3xl">
    <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/95 px-4 py-3 backdrop-blur"><span className="font-mono text-sm font-semibold">{room.code}</span><button type="button" onClick={onClose} autoFocus aria-label="Close room details" className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5"/></button></div>
    {room.hasVideo!==false?<video data-video-intent="room" controls playsInline preload="metadata" aria-label={room.title+" room video"} className="aspect-video w-full bg-slate-950 object-contain" src={officeBackend+"/office/availability/"+encodeURIComponent(room.id)+"/video"}/>:<div className="flex aspect-video items-center justify-center bg-slate-100"><img src="/roomkhoj-logo.png" alt="RoomKhoj — no video available" className="h-24 w-24 object-contain"/></div>}
    <div className="space-y-5 px-4 py-5 pb-12 sm:px-6">
      <div><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Available</span><h2 className="mt-2 break-words text-2xl font-extrabold">{room.title}</h2><p className="mt-1 text-xl font-bold">रु {Number(room.price).toLocaleString()}<span className="text-sm font-medium text-slate-500"> / month</span></p><p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4 shrink-0"/>{room.location}</p></div>
      <div className="flex justify-end"><SoundToggle/></div>
      <RoomListingActions room={room} onMessage={message}/>
      <AdminRoomMessage key={room.id} room={room}/>
      <section><h3 className="mb-3 text-lg font-bold">Room description & details</h3><PublicRoomDetails room={room}/></section>
      <RoomContactUnlock roomId={room.id}/>
      {room.tiktokUrl&&<a href={room.tiktokUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold text-blue-700 underline">Watch TikTok video ↗</a>}
    </div>
  </dialog>;
}

export function SharedAvailabilityRoom({id}: {id:string}) {
  const [room,setRoom]=useState<AvailableRoom|null>(null),[error,setError]=useState("");
  useEffect(()=>{let alive=true;setRoom(null);setError("");api.get("/office/availability/"+encodeURIComponent(id)).then(r=>{if(alive)setRoom(r.data?.data||r.data);}).catch(()=>{if(alive)setError("यो room अहिले उपलब्ध छैन वा link मिलेन।");});return()=>{alive=false;};},[id]);
  return room?<RoomListingDetails room={room} onClose={()=>{const url=new URL(window.location.href);url.searchParams.delete("room");window.history.replaceState(null,"",url);setRoom(null);}}/>:error?<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>:null;
}
