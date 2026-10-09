"use client";
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { officeService, officeError } from '@/http/services/office.service';

const pages = [
  ['Office / Reception','/admin/dashboard/office'],['Users','/admin/dashboard/users'],
  ['Rooms','/admin/dashboard/rooms'],['Records / Client forms','/admin/dashboard/records'],
  ['Wallet','/admin/dashboard/wallet'],['Staff Tracking','/admin/dashboard/staff-tracking'],
  ['Messages','/admin/dashboard/messages'],['Room requests','/admin/dashboard/office?tab=requests'],
];
type Result = { title: string; subtitle: string; href: string };
export function GlobalSearch() {
  const [query,setQuery]=useState('');
  const [results,setResults]=useState<Result[]>([]);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const generation=useRef(0);
  const router=useRouter();
  const pathname=usePathname();
  useEffect(()=>{setOpen(false);generation.current++;setLoading(false);},[pathname]);
  useEffect(()=>{const close=(event: KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
  async function search(e: FormEvent) {
    e.preventDefault();const q=query.trim();if(!q)return;
    const ticket=++generation.current;setLoading(true);setOpen(true);setError('');setResults([]);
    try {
      const data=await officeService.search(q);if(ticket!==generation.current)return;
      const next:Result[]=[
        ...data.users.map(u=>({title:`User · ${u.name}`,subtitle:`${u.phoneNumber} · ${u.email}`,href:`/admin/dashboard/users?search=${encodeURIComponent(u.email)}`})),
        ...data.rooms.map(r=>({title:`Office room · ${r.code}`,subtitle:`${r.title} · ${r.location} · ${r.ownerPhone}`,href:`/admin/dashboard/office?q=${encodeURIComponent(r.code)}`})),
        ...data.clients.map(c=>({title:`Client · ${c.name}`,subtitle:c.phone,href:`/admin/dashboard/office?tab=history&q=${encodeURIComponent(c.phone)}`})),
        ...data.records.map(r=>({title:`Form · ${r.name}`,subtitle:r.customerNumber,href:`/admin/dashboard/records/${r.id}/edit`})),
        ...pages.filter(([name])=>name.toLowerCase().includes(q.toLowerCase())).map(([title,href])=>({title,subtitle:'Admin page',href})),
      ];
      setResults(next);
      if(next.length===1){setOpen(false);router.push(next[0].href);}
    }catch(e){if(ticket===generation.current)setError(officeError(e));}
    finally{if(ticket===generation.current)setLoading(false);}
  }
  return <div className="relative w-full max-w-md"><form className="flex items-center rounded-lg border bg-white" onSubmit={search}><input aria-label="Search admin by name, phone, room code or page" className="w-full min-w-0 rounded-lg bg-transparent px-3 py-2 text-sm text-slate-900 outline-none" placeholder="Name, phone, code or page…" maxLength={180} value={query} onChange={e=>{setQuery(e.target.value);generation.current++;setLoading(false);setOpen(false);}}/><button aria-label="Search" className="p-2 text-slate-600" disabled={loading}><Search className="h-4 w-4"/></button></form>{open&&<div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border bg-white p-2 shadow-xl text-slate-900"><div className="flex justify-between p-2 text-xs text-slate-500"><span>{loading?'Searching…':`${results.length} matches · choose a page`}</span><button onClick={()=>setOpen(false)} aria-label="Close search">✕</button></div>{error&&<p role="alert" className="p-2 text-red-700">{error}</p>}{!loading&&!error&&!results.length&&<p className="p-3 text-sm">No matching users, rooms or forms.</p>}{results.map((r,i)=><Link key={r.href+String(i)} href={r.href} className="block rounded-lg p-3 hover:bg-slate-50" onClick={()=>setOpen(false)}><p className="text-sm font-semibold">{r.title}</p><p className="text-xs text-slate-500">{r.subtitle}</p></Link>)}</div>}</div>;
}
