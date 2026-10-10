"use client";
import {useEffect,useState} from 'react';
export function RoomKhojStartupSplash(){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{const timer=window.setTimeout(()=>setVisible(false),180);return()=>window.clearTimeout(timer);},[]);
 if(!visible)return null;
 return <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-white/90" aria-hidden="true"><img src="/roomkhoj-logo.png" alt="" width={96} height={96} className="h-24 w-24 rounded-3xl"/></div>;
}
