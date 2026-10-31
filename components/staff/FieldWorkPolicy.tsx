'use client';
import {useEffect,useRef,useState} from 'react';
import {privateApi} from '@/http/api/privateApi';
import {staffWeekStart} from '@/lib/staff/location-tracker';
import {Button} from '@/components/ui/button';
import {toast} from 'sonner';
type Zone={id:string;name:string;latitude:number;longitude:number;radiusMeters:number};
let sdk:Promise<any>|null=null;
function mapsSdk(){
 if((window as any).google?.maps)return Promise.resolve((window as any).google.maps);
 const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
 if(!key)return Promise.reject(Error('Google Maps browser key is not configured'));
 if(!sdk)sdk=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key);s.async=true;s.onload=()=>resolve((window as any).google.maps);s.onerror=()=>{sdk=null;reject(Error('Google Maps could not load'))};document.head.appendChild(s);});
 return sdk;
}
const errorText=(e:any)=>e?.response?.data?.message||e?.message||'Request failed';
export function NamedStaffPlace({sessionId,updatedAt}:{sessionId?:string;updatedAt?:string}){
 const [place,setPlace]=useState<{name:string|null;source:string}|null>(null);
 useEffect(()=>{let active=true;setPlace(null);if(sessionId)privateApi.get(`/staff-tracking/admin/sessions/${encodeURIComponent(sessionId)}/place`).then(r=>{if(active)setPlace(r.data)}).catch(()=>{});return()=>{active=false}},[sessionId,updatedAt]);
 return <span>{place?.name||'ठाउँको नाम उपलब्ध छैन'}{place?.name&&<small className="block text-xs text-muted-foreground">{place.source}</small>}</span>;
}
export function FieldWorkAdmin({profiles,onSaved}:{profiles:any[];onSaved?:()=>void}){
 const [enabled,setEnabled]=useState(false),[profileId,setProfileId]=useState(''),[zones,setZones]=useState<Zone[]>([]),[chosen,setChosen]=useState<string[]>([]),[name,setName]=useState(''),[radius,setRadius]=useState(500),[center,setCenter]=useState<{latitude:number;longitude:number}|null>(null),[mapError,setMapError]=useState(''),[busy,setBusy]=useState(false),[week,setWeek]=useState(()=>staffWeekStart()),[report,setReport]=useState<any>(null),[mapReady,setMapReady]=useState(false),[evidence,setEvidence]=useState<Record<string,string>>({});
 const element=useRef<HTMLDivElement>(null),map=useRef<any>(null),circle=useRef<any>(null),overlays=useRef<any[]>([]),maps=useRef<any>(null),selectionEpoch=useRef(0),weekEpoch=useRef(0);
 useEffect(()=>{let active=true;privateApi.get('/staff-tracking/field-policy/config').then(r=>{if(active)setEnabled(Boolean(r.data?.enabled))}).catch(()=>{});return()=>{active=false;weekEpoch.current++}},[]);
 useEffect(()=>{const profile=profiles.find(p=>p.id===profileId);const saved=profile?.fieldPolicy?.zones||[];setZones(saved);setChosen(saved.map((z:Zone)=>z.id));selectionEpoch.current++},[profileId,profiles]);
 useEffect(()=>{if(!enabled)return;let active=true,listener:any;mapsSdk().then(g=>{if(!active||!element.current)return;maps.current=g;map.current=new g.Map(element.current,{center:{lat:28.2096,lng:83.9856},zoom:13});setMapReady(true);listener=map.current.addListener('click',(event:any)=>setCenter({latitude:event.latLng.lat(),longitude:event.latLng.lng()}));}).catch(e=>{if(active)setMapError(e.message)});return()=>{active=false;listener?.remove();circle.current?.setMap(null);overlays.current.forEach(c=>c.setMap(null));map.current=null}},[enabled]);
 useEffect(()=>{if(!map.current||!maps.current||!center)return;circle.current?.setMap(null);circle.current=new maps.current.Circle({map:map.current,center:{lat:center.latitude,lng:center.longitude},radius,fillColor:'#2563eb',fillOpacity:.2,strokeColor:'#2563eb'});},[center,radius]);
 useEffect(()=>{
  overlays.current.forEach(c=>c.setMap(null));overlays.current=[];
  if(!mapReady||!map.current||!maps.current)return;
  overlays.current=zones.filter(z=>chosen.includes(z.id)).map(z=>new maps.current.Circle({map:map.current,center:{lat:z.latitude,lng:z.longitude},radius:z.radiusMeters,fillColor:'#16a34a',fillOpacity:.15,strokeColor:'#16a34a'}));
  return()=>{overlays.current.forEach(c=>c.setMap(null));overlays.current=[];};
 },[zones,chosen,mapReady]);
 async function save(){if(!profileId||busy)return;setBusy(true);const epoch=selectionEpoch.current;try{const selected=zones.filter(z=>chosen.includes(z.id));await privateApi.patch(`/staff-tracking/admin/profiles/${encodeURIComponent(profileId)}/field-policy`,{zones:selected});if(epoch===selectionEpoch.current){toast.success('Area saved. New shifts use this assignment; active shift is unchanged.');onSaved?.()}}catch(e){toast.error(errorText(e))}finally{setBusy(false)}}
 async function weekly(){const epoch=++weekEpoch.current;try{const r=await privateApi.get('/staff-tracking/admin/weekly',{params:{from:week}});if(epoch===weekEpoch.current)setReport(r.data)}catch(e){if(epoch===weekEpoch.current)toast.error(errorText(e))}}
 async function review(id:string,status:string){try{await privateApi.patch('/staff-tracking/admin/outcomes/'+encodeURIComponent(id),{status,evidence:evidence[id]||''});toast.success('Review saved');await weekly()}catch(e){toast.error(errorText(e))}}
 return <section className="space-y-4 rounded-xl border p-4">
 <h2 className="text-xl font-bold">Field area र १०–५ verification</h2>
 {!enabled&&<p role="status" className="text-amber-800">यो सुविधा अझै सक्रिय गरिएको छैन। अहिले नयाँ area वा नतिजा save हुँदैन।</p>}
 <p className="text-sm">GPS ले उपस्थितिको संकेत दिन्छ; कामको प्रमाण होइन। पूरा १०–५ coverage, तोकिएको area र final verification पुगेमा मात्र automatic credit। अस्पष्ट GPS वा gap भए review चाहिन्छ।</p>
 <label className="block">Marketing staff<select className="ml-2 rounded border p-2" value={profileId} onChange={e=>setProfileId(e.target.value)}><option value="">Staff छान्नुहोस्</option>{profiles.filter(p=>p.staffType==='MARKETING').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <div ref={element} aria-label="Google Maps work area selector" className="h-72 rounded border"/>{mapError&&<p role="status">{mapError}</p>}
 <p className="text-sm">Google Map मा area को बीचमा click गर्नुहोस्। देखिएको घेराले सीमा जनाउँछ; यो official neighbourhood boundary होइन।</p>
 <label>ठाउँको नाम <input className="rounded border p-2" value={name} maxLength={100} onChange={e=>setName(e.target.value)} placeholder="जस्तै: बगर क्षेत्र"/></label>
 <label className="ml-2">Radius (metres) <input type="number" min={100} max={5000} className="w-24 rounded border p-2" value={radius} onChange={e=>setRadius(Number(e.target.value))}/></label>
 <Button type="button" className="ml-2" disabled={!center||name.trim().length<2||!Number.isFinite(radius)||radius<100||radius>5000||zones.length>=10} onClick={()=>{if(!center)return;const z={id:crypto.randomUUID(),name:name.trim(),...center,radiusMeters:radius};setZones(v=>[...v,z]);setChosen(v=>[...v,z.id]);setName('')}}>Area थप्नुहोस्</Button>
 <div>{zones.map(z=><label key={z.id} className="mr-4 inline-flex gap-2"><input type="checkbox" checked={chosen.includes(z.id)} onChange={e=>setChosen(v=>e.target.checked?[...v,z.id]:v.filter(id=>id!==z.id))}/>{z.name} ({z.radiusMeters}m)</label>)}</div>
 <Button type="button" disabled={!enabled||!profileId||busy||!chosen.length} onClick={()=>void save()}>Tick गरेका area assign गर्नुहोस्</Button>
 <h3 className="text-lg font-bold">७ दिनको प्रमाणित नतिजा</h3><label>सुरु मिति <input type="date" value={week} onChange={e=>{weekEpoch.current++;setReport(null);setWeek(e.target.value)}}/></label><Button disabled={!enabled} onClick={()=>void weekly()}>Weekly result</Button>
 <p className="text-sm">क्रम: प्रमाणित rental fix, त्यसपछि प्रमाणित room added। Phone नउठेको संख्या काम नराम्रो भएको score होइन। यो नयाँ ledger को तथ्य हो; पुरानो सबै history होइन।</p>
 {report&&<><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Staff','Room fix','Room added','Owner no answer','Pending review'].map(x=><th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{report.rows?.map((r:any)=><tr key={r.staffProfileId}><td>{r.name}</td><td>{r.rentalsFixed}</td><td>{r.roomsAdded}</td><td>{r.ownerNoAnswer}</td><td>{r.pending}</td></tr>)}</tbody></table></div>
 {report.pending?.map((r:any)=><div key={r.id} className="flex flex-wrap gap-2 border-t py-2"><span>{r.name}: {r.kind} — {r.sourceId}</span><input aria-label="Evidence reference" placeholder="Room/booking/call record जाँचेको प्रमाण" maxLength={500} value={evidence[r.id]||''} onChange={e=>setEvidence(v=>({...v,[r.id]:e.target.value}))}/><Button onClick={()=>void review(r.id,'VERIFIED')}>प्रमाणित</Button><Button variant="outline" onClick={()=>void review(r.id,'REJECTED')}>अस्वीकृत</Button></div>)}</>}
 </section>;
}
export function StaffOutcomeForm(){
 const [enabled,setEnabled]=useState(false),[kind,setKind]=useState('ROOM_ADDED'),[sourceId,setSourceId]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;privateApi.get('/staff-tracking/field-policy/config').then(r=>{if(active)setEnabled(Boolean(r.data?.enabled))}).catch(()=>{});return()=>{active=false}},[]);
 if(!enabled)return null;
 return <form className="space-y-3 rounded-xl border p-4" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);try{const r=await privateApi.post('/staff-tracking/outcomes',{kind,sourceId});toast.success(r.data?.duplicate?'Already reported':'Admin review मा पठाइयो; अझै प्रमाणित भएको छैन');setSourceId('')}catch(error){toast.error(errorText(error))}finally{setBusy(false)}}}><h2 className="font-bold">Field work नतिजा पठाउनुहोस्</h2><label>नतिजा <select value={kind} onChange={e=>setKind(e.target.value)}><option value="ROOM_ADDED">नयाँ room थपियो</option><option value="RENTAL_FIXED">Room rental fix भयो</option><option value="OWNER_NO_ANSWER">Owner ले phone उठाएन</option></select></label><label className="block">Room / booking / call record ID <input required maxLength={100} value={sourceId} onChange={e=>setSourceId(e.target.value)}/></label><p className="text-sm">Phone number नलेख्नुहोस्। Admin ले सम्बन्धित record जाँचेपछि मात्र weekly verified count मा पर्छ।</p><Button disabled={busy}>Review को लागि पठाउनुहोस्</Button></form>;
}
