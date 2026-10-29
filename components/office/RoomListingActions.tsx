"use client";
import { useEffect, useState } from "react";
import { playUiSound } from "@/lib/ui-sounds";
import { Bookmark, Share2, MessageCircle } from "lucide-react";
import type { AvailableRoom } from "./RoomAvailability";

const SAVE_KEY = "roomkhoj:saved-reception-room-ids:v1";
const SAVE_EVENT = "roomkhoj:saved-reception-rooms";
function readSaved(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) || "[]");
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string").slice(0,500) : [];
  } catch { return []; }
}
export function RoomListingActions({room,onMessage,side=false}: {room:AvailableRoom;onMessage:()=>void;side?:boolean}) {
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
    ? "flex h-11 w-11 flex-col items-center justify-center rounded-full border border-white/30 bg-slate-950/80 text-white shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    : "flex flex-1 flex-col items-center gap-1 rounded-xl bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100";
  return <div className={side?"absolute right-3 top-16 z-10 flex flex-col items-end gap-2":"space-y-2"}>
    <div className={side?"flex flex-col gap-2":"flex gap-2"}>
      <button type="button" onClick={save} className={button} aria-label={saved?"Unsave room":"Save room on this device"} aria-pressed={saved} title={saved?"Saved":"Save on this device"}><Bookmark className={"h-5 w-5 "+(saved?"fill-current":"")} aria-hidden="true"/>{!side&&<span>{saved?"Saved":"Save"}</span>}</button>
      <button type="button" onClick={()=>void share()} disabled={sharing} className={button} aria-label="Share room" title="Share"><Share2 className="h-5 w-5" aria-hidden="true"/>{!side&&<span>Share</span>}</button>
      <button type="button" onClick={onMessage} className={button} aria-label="Message admin privately" title="Message admin"><MessageCircle className="h-5 w-5" aria-hidden="true"/>{!side&&<span>Message admin</span>}</button>
    </div>
    {notice&&<p role="status" className="max-w-52 rounded-lg bg-white p-2 text-xs text-slate-700 shadow">{notice}</p>}
    {fallback&&<label className="block max-w-56 rounded-lg bg-white p-2 text-xs text-slate-800 shadow">Copy room link<input aria-label="Room share link" readOnly value={fallback} onFocus={e=>e.target.select()} className="mt-1 w-full rounded border p-2"/></label>}
  </div>;
}
