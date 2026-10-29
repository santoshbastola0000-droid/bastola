"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { privateApi } from "@/http/api/privateApi";
import { officeError } from "@/http/services/office.service";
type Report={id:string;roomId:string;code:string;title:string;reason:string;details:string;status:string;createdAt:string;reporterName:string;reporterPhone:string};
export default function RoomReportsPage(){
 const [reports,setReports]=useState<Report[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(0),[revision,setRevision]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const pending=useRef(false);
 useEffect(()=>{let alive=true;setLoading(true);setReports([]);setError("");privateApi.get("/office/room-reports",{params:{page}}).then(r=>{if(alive){const d=r.data?.data||r.data;setReports(d.reports);setTotal(d.total);}}).catch(e=>{if(alive)setError(officeError(e));}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[page,revision]);
 async function review(id:string,status:string){
  if(pending.current)return;pending.current=true;setBusy(true);setError("");
  try{await privateApi.patch("/office/room-reports/"+id,{status});setReports(current=>current.map(item=>item.id===id?{...item,status}:item));}
  catch(e){setError(officeError(e));}finally{pending.current=false;setBusy(false);}
 }
 return <section className="space-y-4"><div className="flex items-center justify-between gap-2"><div><h1 className="text-xl font-bold">Room Reports</h1><p className="text-xs text-muted-foreground">Admin only · {total} reports</p></div><button disabled={busy} onClick={()=>setRevision(v=>v+1)} className="rounded-lg border px-3 py-2 text-xs">Refresh</button></div>
 {error&&<p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
 {loading?<p role="status">Loading reports…</p>:!reports.length?<p className="text-sm text-muted-foreground">No reports yet.</p>:reports.map(item=><article key={item.id} className="space-y-3 rounded-xl border bg-card p-4 text-card-foreground"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{item.code} · {item.title}</h2><span className="text-xs font-bold text-primary">{item.status}</span></div><p className="text-sm font-medium">{item.reason.replaceAll("_"," ")}</p>{item.details&&<p className="whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-sm">{item.details}</p>}<p className="text-xs text-muted-foreground">By {item.reporterName} · {item.reporterPhone} · {new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kathmandu"}).format(new Date(item.createdAt))} (Nepal time)</p><div className="flex flex-wrap gap-2"><Link href={"/rooms/availability?room="+encodeURIComponent(item.roomId)} className="rounded-lg border px-3 py-2 text-xs">View room</Link><button disabled={busy||item.status==="REVIEWED"} onClick={()=>void review(item.id,"REVIEWED")} className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-40">Mark reviewed</button><button disabled={busy||item.status==="DISMISSED"} onClick={()=>void review(item.id,"DISMISSED")} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Dismiss</button></div></article>)}
 <div className="flex justify-between"><button disabled={loading||busy||page===0} onClick={()=>setPage(v=>v-1)} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Previous</button><button disabled={loading||busy||(page+1)*30>=total} onClick={()=>setPage(v=>v+1)} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Next</button></div></section>;
}
