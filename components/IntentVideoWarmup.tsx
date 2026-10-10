"use client";
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
export function IntentVideoWarmup(){
 const pathname=usePathname();
 useEffect(()=>{
  const section=/^\/(?:jobs|job)(?:\/|$)/.test(pathname||'')?'job':/^\/(?:rooms|property|search)(?:\/|$)/.test(pathname||'')?'room':null;
  const connection=(navigator as Navigator & {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  if(connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType||''))return;
  const queue:HTMLVideoElement[]=[];const seen=new WeakSet<HTMLVideoElement>();let current:HTMLVideoElement|null=null,stop=false,timer=0,idle=0;
  let release=()=>{};
  const eligible=(video:HTMLVideoElement)=>!video.closest('[data-reel-id]') && !video.autoplay && (video.dataset.videoIntent===section || (section==='job' && !video.dataset.videoIntent) || (video.dataset.videoIntent==='room' && !!video.closest('[data-room-availability]')));
  const next=()=>{
   if(stop || current || document.hidden || !queue.length)return;
   const video=queue.shift()!;
   if(!video.isConnected || !video.paused || Number.isFinite(video.duration)){next();return;}
   current=video;
   const done=()=>{video.removeEventListener('loadedmetadata',done);video.removeEventListener('error',done);window.clearTimeout(timer);current=null;release=()=>{};timer=window.setTimeout(next,500);};
   release=done;
   const load=()=>{if(stop || !video.isConnected){done();return;}video.addEventListener('loadedmetadata',done,{once:true});video.addEventListener('error',done,{once:true});video.preload='metadata';video.load();timer=window.setTimeout(done,6000);};
   if('requestIdleCallback' in window)idle=window.requestIdleCallback(load,{timeout:1500});else timer=window.setTimeout(load,350);
  };
  const intersection=new IntersectionObserver(entries=>{
   entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top).forEach(entry=>{
    const video=entry.target as HTMLVideoElement;intersection.unobserve(video);queue.push(video);
   });next();
  },{rootMargin:'200px 0px'});
  const scan=(root:ParentNode)=>{
   const videos=[...(root instanceof HTMLVideoElement?[root]:[]),...Array.from(root.querySelectorAll<HTMLVideoElement>('video'))];
   for(const video of videos){if(seen.has(video)||!eligible(video))continue;seen.add(video);if(video.paused)video.preload='none';intersection.observe(video);}
  };
  scan(document);
  const mutations=new MutationObserver(entries=>{for(const entry of entries)for(const node of Array.from(entry.addedNodes))if(node instanceof Element)scan(node);});
  mutations.observe(document.body,{childList:true,subtree:true});
  const visibility=()=>{if(!document.hidden)next();};document.addEventListener('visibilitychange',visibility);
  return()=>{stop=true;release();window.clearTimeout(timer);if(idle && 'cancelIdleCallback' in window)window.cancelIdleCallback(idle);intersection.disconnect();mutations.disconnect();document.removeEventListener('visibilitychange',visibility);queue.length=0;};
 },[pathname]);
 return null;
}
