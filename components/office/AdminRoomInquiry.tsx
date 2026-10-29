"use client";
import { useEffect, useRef, useState } from "react";
import { officeService, officeError, type OfficeRoom } from "@/http/services/office.service";
import { OfficeVideo } from "./OfficeVideo";
import { RoomDetails } from "./RoomDetails";

export function parseRoomInquiry(content:string) {
  const match=content.match(/^Room inquiry · [^\n]*\n\/rooms(?:\/availability)?\?room=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\n\n/i);
  return match?{roomId:match[1],text:content.slice(match[0].length)}:null;
}

// This cache belongs to one admin conversation, never to public/user messages.
export type InquiryRoomCache=Map<string,Promise<OfficeRoom>>;
export function AdminRoomInquiry({content,cache}: {content:string;cache:InquiryRoomCache}) {
  const inquiry=parseRoomInquiry(content);
  const id=inquiry?.roomId;
  const [room,setRoom]=useState<OfficeRoom|null>(null),[error,setError]=useState("");
  const [visible,setVisible]=useState(false),[retry,setRetry]=useState(0);
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!id)return;
    if(typeof IntersectionObserver==="undefined"){setVisible(true);return;}
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}});
    if(root.current)observer.observe(root.current);
    return()=>observer.disconnect();
  },[id]);
  useEffect(()=>{
    if(!id||!visible)return;
    let alive=true;setError("");
    let request=cache.get(id);
    if(!request){request=officeService.room(id);cache.set(id,request);}
    request.then(value=>{if(alive)setRoom(value);}).catch(e=>{cache.delete(id);if(alive)setError(officeError(e));});
    return()=>{alive=false;};
  },[id,visible,cache,retry]);
  if(!inquiry)return <>{content}</>;
  return <div ref={root} className="space-y-2">
    <div className="max-w-[260px] overflow-hidden rounded-lg border border-primary/15 bg-white text-slate-900">
      {room?<><div className="flex items-start gap-2 p-2">
        <div className="w-[104px] shrink-0"><OfficeVideo roomId={room.id} compact/></div>
        <div className="min-w-0"><p className="font-mono text-[10px] font-bold text-primary">{room.code}</p><p className="break-words text-xs font-bold">{room.title}</p><p className="break-words text-[10px] text-slate-500">{room.location}</p><p className="text-[11px] font-bold">Rs. {Number(room.price).toLocaleString()}/month</p></div>
      </div><details className="border-t"><summary className="cursor-pointer px-2 py-2 text-[11px] font-bold text-primary">Details · सबै room विवरण</summary><p className="px-2 pt-1 text-[10px] text-slate-500">Current reception record</p><RoomDetails room={room} isAdmin/></details></>:error?<div role="alert" className="p-2 text-xs text-red-700">{error}<button type="button" onClick={()=>setRetry(value=>value+1)} className="ml-2 underline">Retry room details</button></div>:<p className="p-2 text-[11px] text-slate-500">Loading room details…</p>}
    </div>
    <p className="whitespace-pre-wrap break-words">{inquiry.text}</p>
  </div>;
}
