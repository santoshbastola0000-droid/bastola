"use client";
import { useEffect, useState } from "react";
import { playUiSound } from "@/lib/ui-sounds";
import { Bookmark, Share2, MessageCircle } from "lucide-react";
import type { AvailableRoom } from "./RoomAvailability";

const SAVE_KEY = "roomkhoj:saved-reception-room-ids:v1";
export const SAVE_EVENT = "roomkhoj:saved-reception-rooms";
export function readSaved(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) || "[]");
    return Array.isArray(ids) ? [...new Set(ids.filter((id): id is string => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))].slice(0,500) : [];
  } catch { return []; }
}
export function RoomListingActions({room,onMessage,side=false,compact=false}: {room:AvailableRoom;onMessage:()=>void;side?:boolean;compact?:boolean}) {
  const [saved,setSaved] = useState(false);
  const [notice,setNotice] = useState("");
  const [fallback,setFallback] = useState("");
  const [sharing,setSharing] = useState(false);
  useEffect(()=>{
    const sync=()=>setSaved(readSaved().includes(room.id));
    sync(); window.addEventListener("storage",sync);window.addEventListener(SAVE_EVENT,sync);
    return ()=>{window.removeEventListener("storage",sync);window.removeEventListener(SAVE_EVENT,sync);};
  },[room.id]);
  function save() {
    try {
      const ids=readSaved(), exists=ids.includes(room.id);
      localStorage.setItem(SAVE_KEY,JSON.stringify(exists?ids.filter(id=>id!==room.id):[room.id,...ids].slice(0,500)));
      playUiSound("saved");setSaved(!exists);setNotice(exists?"Removed from saved rooms":"Saved on this device");
      window.dispatchEvent(new Event(SAVE_EVENT));
    } catch { setNotice("Could not save. Browser storage is unavailable."); }
  }
  async function share() {
    if(sharing)return;
    setSharing(true);setNotice("");setFallback("");
    const url=new URL("/rooms/availability",window.location.origin);
    url.searchParams.set("room",room.id);
    try {
      if(navigator.share)await navigator.share({title:room.title,text:room.code+" · "+room.location,url:url.href});
      else {await navigator.clipboard.writeText(url.href);setNotice("Room link copied");playUiSound("tap");}
    } catch(error) {
      if(!(error instanceof Error && error.name==="AbortError"))setFallback(url.href);
    } finally {setSharing(false);}
  }
  const button = side
    ? "flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    : compact ? "flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-[10px] font-semibold text-foreground hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" : "flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl py-2 text-xs font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
  const circle = side || compact ? "" : "flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary";
  return <div className={side?"absolute right-3 top-16 z-10 flex flex-col items-end gap-2":"space-y-2"}>
    <div className={side?"flex flex-col gap-2":"flex items-start justify-around gap-2"}>
      <button type="button" onClick={onMessage} className={"group "+button} aria-label="Message admin privately" title="Message admin"><span className={circle}><MessageCircle className={compact?"h-4 w-4":"h-6 w-6"} aria-hidden="true"/></span>{!side&&<span>Message</span>}</button>
      <button type="button" onClick={()=>void share()} disabled={sharing} className={"group "+button} aria-label="Share room" title="Share"><span className={circle}><Share2 className={compact?"h-4 w-4":"h-6 w-6"} aria-hidden="true"/></span>{!side&&<span>Share</span>}</button>
      <button type="button" onClick={save} className={"group "+button} aria-label={saved?"Unsave room":"Save room on this device"} aria-pressed={saved} title={saved?"Saved":"Save on this device"}><span className={circle+" "+(saved?"bg-primary/10 text-primary":"")}><Bookmark className={(compact?"h-4 w-4 ":"h-6 w-6 ")+(saved?"fill-current":"")} aria-hidden="true"/></span>{!side&&<span>{saved?"Saved":"Save"}</span>}</button>
    </div>
    {notice&&<p role="status" className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">{notice}</p>}
    {fallback&&<label className="block rounded-lg border border-border bg-card p-2 text-xs text-card-foreground">Copy room link<input aria-label="Room share link" readOnly value={fallback} onFocus={e=>e.target.select()} className="mt-1 w-full rounded border border-input bg-background p-2"/></label>}
  </div>;
}
