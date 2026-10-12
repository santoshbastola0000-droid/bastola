"use client";
import { BrandWordmark } from "@/components/BrandWordmark";
import {useEffect,useState} from 'react';
export function RoomKhojStartupSplash(){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{const timer=window.setTimeout(()=>setVisible(false),180);return()=>window.clearTimeout(timer);},[]);
 if(!visible)return null;
 return <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-white/90" aria-hidden="true"><BrandWordmark className="text-[42px]" /></div>;
}
