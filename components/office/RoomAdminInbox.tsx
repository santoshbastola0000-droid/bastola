"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AdminRoomInquiry, type InquiryRoomCache } from "./AdminRoomInquiry";
import { X, MessageCircle } from "lucide-react";
import { privateApi } from "@/http/api/privateApi";
import { officeError } from "@/http/services/office.service";
import type { ChatMessage, MessageConversation } from "@/http/services/message.service";
import { SoundToggle } from "@/components/SiteSoundEffects";
import { playUiSound, playIncomingMessageSound, unlockSounds } from "@/lib/ui-sounds";

function mergeMessages(current:ChatMessage[], incoming:ChatMessage[]) {
  const merged=new Map(current.map(message=>[message.id,message]));
  incoming.forEach(message=>merged.set(message.id,message));
  return [...merged.values()].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||a.id.localeCompare(b.id));
}

function UserChatBox({conversation,officialAdminId,onClose}: {
  conversation:MessageConversation;officialAdminId:string;onClose:()=>void;
}) {
  const id=conversation.id,name=conversation.otherUser?.name||"Client";
  const [messages,setMessages]=useState<ChatMessage[]>([]);
  const [draft,setDraft]=useState(""),[error,setError]=useState("");
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
  const [hasOlder,setHasOlder]=useState(false),[loadingOlder,setLoadingOlder]=useState(false);
  const [visible,setVisible]=useState(false);
  const panel=useRef<HTMLElement>(null),scroller=useRef<HTMLDivElement>(null);
  const roomCache=useRef<InquiryRoomCache>(new Map());
  const sending=useRef(false),lastIncoming=useRef<string|null>(null);
  const nearBottom=useRef(true),olderPosition=useRef<{height:number;top:number}|null>(null);

  useEffect(()=>{
    const node=panel.current;if(!node)return;
    if(typeof IntersectionObserver==="undefined"){setVisible(true);return;}
    const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)));
    observer.observe(node);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!visible)return;
    let alive=true,inFlight=false;
    async function load(){
      if(inFlight||document.visibilityState==="hidden")return;
      inFlight=true;
      try{
        const r=await privateApi.get("/message/room-admin/conversations/"+encodeURIComponent(id)+"/messages");
        const data:ChatMessage[]=r.data?.data||r.data||[];
        if(!alive)return;
        const incoming=data.filter(message=>message.senderId!==officialAdminId).at(-1)?.id||"";
        if(lastIncoming.current!==null&&incoming&&incoming!==lastIncoming.current)playIncomingMessageSound(incoming);
        if(lastIncoming.current===null)setHasOlder(data.length===50);
        lastIncoming.current=incoming;
        setMessages(current=>mergeMessages(current,data));setError("");
      }catch(e){if(alive)setError(officeError(e));}
      finally{inFlight=false;if(alive)setLoading(false);}
    }
    void load();const timer=window.setInterval(load,4000);
    return()=>{alive=false;window.clearInterval(timer);};
  },[id,officialAdminId,visible]);
  useEffect(()=>{
    const node=scroller.current;if(!node)return;
    if(olderPosition.current){
      node.scrollTop=olderPosition.current.top+node.scrollHeight-olderPosition.current.height;
      olderPosition.current=null;
    }else if(nearBottom.current)node.scrollTop=node.scrollHeight;
  },[messages.length]);

  async function older(){
    if(!messages[0]||loadingOlder)return;setLoadingOlder(true);
    try{
      const r=await privateApi.get("/message/room-admin/conversations/"+encodeURIComponent(id)+"/messages",{params:{beforeId:messages[0].id}});
      const data:ChatMessage[]=r.data?.data||r.data||[];
      setHasOlder(data.length===50);
      if(data.length&&scroller.current)olderPosition.current={height:scroller.current.scrollHeight,top:scroller.current.scrollTop};
      setMessages(current=>mergeMessages(current,data));
    }catch(e){setError(officeError(e));}finally{setLoadingOlder(false);}
  }
  async function send(event:FormEvent){
    event.preventDefault();event.stopPropagation();
    if(!draft.trim()||sending.current)return;
    unlockSounds();sending.current=true;setBusy(true);setError("");
    try{
      const r=await privateApi.post("/message/room-admin/conversations/"+encodeURIComponent(id)+"/messages",{content:draft.trim()});
      const message:ChatMessage=r.data?.data||r.data;
      nearBottom.current=true;setMessages(current=>mergeMessages(current,[message]));
      setDraft("");playUiSound("sent");
    }catch(e){setError(officeError(e));}finally{sending.current=false;setBusy(false);}
  }
  return <section ref={panel} aria-label={"Chat with "+name} data-conversation-id={id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-primary/20 bg-white shadow-sm">
    <header className="flex items-center justify-between gap-2 border-b bg-primary/5 px-3 py-2">
      <div className="min-w-0"><h3 className="truncate text-sm font-bold">{name}</h3><p className="text-[10px] text-slate-500">Room Khoj · Private chat</p></div>
      <button type="button" disabled={busy||loadingOlder} onClick={onClose} aria-label={"Close chat with "+name} className="rounded-full p-1.5 hover:bg-primary/10 disabled:opacity-50"><X className="h-4 w-4" aria-hidden="true"/></button>
    </header>
    <div ref={scroller} onScroll={event=>{const node=event.currentTarget;nearBottom.current=node.scrollHeight-node.scrollTop-node.clientHeight<80;}} className="h-64 space-y-2 overflow-y-auto bg-slate-50 p-3">
      {loading&&<p role="status" className="text-xs text-slate-500">Loading messages…</p>}
      {hasOlder&&<button type="button" disabled={loadingOlder} onClick={()=>void older()} className="mx-auto block rounded-lg border bg-white px-2 py-1 text-[11px]">{loadingOlder?"Loading…":"Load older messages"}</button>}
      {messages.map(message=><div key={message.id} className={"flex "+(message.senderId===officialAdminId?"justify-end":"justify-start")}><div className={"max-w-[90%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-xs "+(message.senderId===officialAdminId?"bg-primary text-primary-foreground":"border bg-white text-slate-900")}>{message.senderId!==officialAdminId&&message.content?<AdminRoomInquiry content={message.content} cache={roomCache.current}/>:message.content||"["+message.type+"]"}</div></div>)}
      {!loading&&!messages.length&&<p className="text-xs text-slate-500">No messages yet.</p>}
    </div>
    {error&&<p role="alert" className="break-words bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    <form onSubmit={send} className="flex items-end gap-2 border-t p-2">
      <textarea aria-label={"Reply to "+name} disabled={busy} maxLength={5000} required rows={2} value={draft} onChange={event=>setDraft(event.target.value)} placeholder={"Message "+name+"…"} className="min-w-0 flex-1 resize-y rounded-lg border p-2 text-[16px] leading-5 sm:text-xs"/>
      <button type="submit" disabled={busy||!draft.trim()} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy?"Sending…":"Send"}</button>
    </form>
  </section>;
}

export function RoomAdminInbox() {
  const [conversations,setConversations]=useState<MessageConversation[]>([]);
  const [officialAdminId,setOfficialAdminId]=useState("");
  const [openIds,setOpenIds]=useState<string[]>([]);
  const [error,setError]=useState(""),[loading,setLoading]=useState(true);
  // A dismissed chat opens again only when another incoming message arrives.
  const seenIncoming=useRef(new Map<string,string>()),hasLoaded=useRef(false);
  useEffect(()=>{
    let alive=true,inFlight=false;
    async function load(){
      if(inFlight||document.visibilityState==="hidden")return;
      inFlight=true;
      try{
        const r=await privateApi.get("/message/room-admin/inbox"),data=r.data?.data||r.data;
        if(!alive)return;
        const list:MessageConversation[]=data.conversations||[],newChats:string[]=[];
        for(const conversation of list){
          const last=conversation.lastMessage;
          if(last&&last.senderId!==data.officialAdminId){
            const previous=seenIncoming.current.get(conversation.id);
            if(last.id!==previous){
              if(Number(conversation.unreadCount)>0)newChats.push(conversation.id);
              if(previous!==undefined||hasLoaded.current)playIncomingMessageSound(last.id);
              seenIncoming.current.set(conversation.id,last.id);
            }
          }
        }
        hasLoaded.current=true;
        setOfficialAdminId(data.officialAdminId);setConversations(list);setError("");
        if(newChats.length)setOpenIds(current=>[...new Set([...current,...newChats])]);
      }catch(e){if(alive)setError(officeError(e));}finally{inFlight=false;if(alive)setLoading(false);}
    }
    void load();const timer=window.setInterval(load,5000);
    return()=>{alive=false;window.clearInterval(timer);};
  },[]);
  const openChats=openIds.map(id=>conversations.find(conversation=>conversation.id===id)).filter((conversation):conversation is MessageConversation=>Boolean(conversation));
  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-bold">Room Khoj chatbox</h2><p className="text-xs text-slate-500">Admin only · हरेक user को छुट्टै chat र reply</p></div><SoundToggle/></div>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div aria-label="Customer conversations" className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-xl border bg-white p-2">
      {loading?<p className="p-2 text-xs">Loading chats…</p>:!conversations.length?<p className="p-2 text-xs text-slate-500">No room chats yet.</p>:conversations.map(conversation=><button key={conversation.id} type="button" aria-pressed={openIds.includes(conversation.id)} onClick={()=>setOpenIds(current=>current.includes(conversation.id)?current:[...current,conversation.id])} className={"flex min-w-0 max-w-56 items-center gap-2 rounded-lg border px-3 py-2 text-left "+(openIds.includes(conversation.id)?"border-primary/30 bg-primary/10":"hover:bg-slate-50")}>
        <MessageCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true"/><span className="min-w-0"><span className="block truncate text-xs font-bold">{conversation.otherUser?.name||"Client"}</span><span className="block truncate text-[10px] text-slate-500">{conversation.lastMessage?.content||"Open conversation"}</span></span>
        {Number(conversation.unreadCount)>0&&<span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{conversation.unreadCount}<span className="sr-only"> unread</span></span>}
      </button>)}
    </div>
    {openChats.length?<div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">{openChats.map(conversation=><UserChatBox key={conversation.id} conversation={conversation} officialAdminId={officialAdminId} onClose={()=>setOpenIds(current=>current.filter(id=>id!==conversation.id))}/>)}</div>:<p className="rounded-xl border border-dashed p-6 text-center text-xs text-slate-500">User छानेर chat खोल्नुहोस्। नयाँ unread message आउँदा छुट्टै box खुल्छ।</p>}
  </section>;
}
