"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { privateApi } from "@/http/api/privateApi";
import { officeError } from "@/http/services/office.service";
import type { ChatMessage, MessageConversation } from "@/http/services/message.service";
import { SoundToggle } from "@/components/SiteSoundEffects";
import { playUiSound, playIncomingMessageSound } from "@/lib/ui-sounds";

export function RoomAdminInbox() {
  const [conversations,setConversations]=useState<MessageConversation[]>([]),[officialAdminId,setOfficialAdminId]=useState("");
  const [selected,setSelected]=useState<string|null>(null),[messages,setMessages]=useState<ChatMessage[]>([]);
  const [error,setError]=useState(""),[draft,setDraft]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
  const [hasOlder,setHasOlder]=useState(false),[loadingOlder,setLoadingOlder]=useState(false);
  const sending=useRef(false),lastIncoming=useRef<string|null>(null),skipScroll=useRef(false),end=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let alive=true,inFlight=false;
    async function load(){
      if(inFlight||document.visibilityState==="hidden")return;
      inFlight=true;
      try{const r=await privateApi.get("/message/room-admin/inbox");const d=r.data?.data||r.data;if(alive){setOfficialAdminId(d.officialAdminId);setConversations(d.conversations||[]);setError("");}}
      catch(e){if(alive)setError(officeError(e));}finally{inFlight=false;if(alive)setLoading(false);}
    }
    void load();const timer=window.setInterval(load,5000);
    return()=>{alive=false;window.clearInterval(timer);};
  },[]);
  useEffect(()=>{
    if(!selected){setMessages([]);return;}
    let alive=true,inFlight=false;setMessages([]);setHasOlder(false);lastIncoming.current=null;
    async function load(){
      if(inFlight||document.visibilityState==="hidden")return;
      inFlight=true;
      try{const r=await privateApi.get("/message/room-admin/conversations/"+selected+"/messages");const data:ChatMessage[]=r.data?.data||r.data||[];
        if(alive){const incoming=data.filter(m=>m.senderId!==officialAdminId).at(-1)?.id||"";if(lastIncoming.current!==null&&incoming&&incoming!==lastIncoming.current)playIncomingMessageSound(incoming);if(lastIncoming.current===null)setHasOlder(data.length===50);lastIncoming.current=incoming;setMessages(current=>{const fresh=new Map(data.map(m=>[m.id,m]));return [...current.filter(m=>!fresh.has(m.id)),...data].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||a.id.localeCompare(b.id));});setError("");}}
      catch(e){if(alive)setError(officeError(e));}finally{inFlight=false;}
    }
    void load();const timer=window.setInterval(load,4000);
    return()=>{alive=false;window.clearInterval(timer);};
  },[selected,officialAdminId]);
  useEffect(()=>{if(skipScroll.current){skipScroll.current=false;return;}end.current?.scrollIntoView({block:"nearest"});},[messages.length]);
  async function older() {
    if(!selected||!messages[0]||loadingOlder)return;
    setLoadingOlder(true);
    try {const r=await privateApi.get("/message/room-admin/conversations/"+selected+"/messages",{params:{beforeId:messages[0].id}});const data:ChatMessage[]=r.data?.data||r.data||[];setHasOlder(data.length===50);skipScroll.current=data.length>0;setMessages(current=>{const ids=new Set(current.map(m=>m.id));return [...data.filter(m=>!ids.has(m.id)),...current];});}
    catch(e){setError(officeError(e));}finally{setLoadingOlder(false);}
  }
  async function send(event:FormEvent){
    event.preventDefault();if(!selected||!draft.trim()||sending.current)return;
    sending.current=true;setBusy(true);setError("");const id=selected;
    try{const r=await privateApi.post("/message/room-admin/conversations/"+id+"/messages",{content:draft.trim()});const message=r.data?.data||r.data;setMessages(current=>current.some(m=>m.id===message.id)?current:[...current,message]);setDraft("");playUiSound("sent");}
    catch(e){setError(officeError(e));}finally{sending.current=false;setBusy(false);}
  }
  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-bold">Room Khoj chatbox</h2><p className="text-sm text-slate-500">Admin only · User को Messages box सँग जोडिएको</p></div><SoundToggle/></div>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid overflow-hidden rounded-2xl border bg-white md:grid-cols-[260px_1fr]">
      <div className="max-h-72 overflow-y-auto border-b md:max-h-[65vh] md:border-b-0 md:border-r">{loading?<p className="p-4">Loading chats…</p>:!conversations.length?<p className="p-4 text-sm text-slate-500">No room chats yet.</p>:conversations.map(c=><button key={c.id} disabled={busy||loadingOlder} onClick={()=>{setSelected(c.id);setDraft("");}} className={"w-full border-b p-4 text-left "+(selected===c.id?"bg-primary/10":"hover:bg-slate-50")}><span className="block font-semibold">{c.otherUser?.name||"Client"}</span><span className="mt-1 block truncate text-xs text-slate-500">{c.lastMessage?.content||"Open conversation"}</span>{Number(c.unreadCount)>0&&<span className="text-xs font-bold text-primary">{c.unreadCount} unread</span>}</button>)}</div>
      <div className="flex min-h-96 flex-col"><div className="border-b p-4 font-semibold">{selected?"Room Khoj · Private conversation":"Choose a conversation"}</div><div className="max-h-[48vh] min-h-64 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{hasOlder&&<button type="button" disabled={loadingOlder} onClick={()=>void older()} className="mx-auto block rounded-lg border bg-white px-3 py-2 text-xs">{loadingOlder?"Loading…":"Load older messages"}</button>}{messages.map(m=><div key={m.id} className={"flex "+(m.senderId===officialAdminId?"justify-end":"justify-start")}><div className={"max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm "+(m.senderId===officialAdminId?"bg-primary text-primary-foreground":"border bg-white text-slate-900")}>{m.content||"["+m.type+"]"}</div></div>)}<div ref={end}/></div>
        {selected&&<form onSubmit={send} className="flex items-end gap-2 border-t p-3"><textarea aria-label="Reply to client" maxLength={5000} required value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Reply as Room Khoj…" className="min-w-0 flex-1 rounded-xl border p-3 text-sm"/><button disabled={busy||!draft.trim()} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Sending…":"Send"}</button></form>}
      </div>
    </div>
  </section>;
}

