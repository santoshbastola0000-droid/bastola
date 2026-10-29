"use client";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { playUiSound, setSoundsEnabled, soundsEnabled, unlockSounds } from "@/lib/ui-sounds";
export function SiteSoundEffects() {
  useEffect(()=>{
    const activate=()=>unlockSounds();
    const click=(event:MouseEvent)=>{const target=event.target;if(target instanceof Element&&target.closest("[data-ui-sound]"))playUiSound("tap");};
    window.addEventListener("pointerdown",activate,{passive:true});window.addEventListener("keydown",activate);
    document.addEventListener("click",click);
    return()=>{window.removeEventListener("pointerdown",activate);window.removeEventListener("keydown",activate);document.removeEventListener("click",click);};
  },[]);
  return null;
}
export function SoundToggle() {
  const [enabled,setEnabled]=useState(true);
  useEffect(()=>{const sync=()=>setEnabled(soundsEnabled());sync();window.addEventListener("roomkhoj:sounds-changed",sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener("roomkhoj:sounds-changed",sync);window.removeEventListener("storage",sync);};},[]);
  return <button type="button" aria-label={enabled?"Turn site sounds off":"Turn site sounds on"} aria-pressed={enabled} onClick={()=>{setSoundsEnabled(!enabled);setEnabled(!enabled);if(!enabled){unlockSounds();playUiSound("tap");}}} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-2 text-xs text-slate-600">{enabled?<Volume2 className="h-4 w-4"/>:<VolumeX className="h-4 w-4"/>}Sound {enabled?"on":"off"}</button>;
}
