"use client";
import {useEffect,useState} from 'react';
import useTokenStore from '@/store';
const API=(process.env.NEXT_PUBLIC_BACKEND_URL||'https://api.roomkhoj.com').replace(/\/$/,'');
type Row={id:string;callId:string;source:string;ownerName:string|null;phoneNumber:string|null;details:Record<string,unknown>;ownerStatements:string[];locationNotes:{quote:string}[];missingFields:string[];reviewStatus:string;callStatus:string;createdAt:string;reviewedAt:string|null};
const labels:Record<string,string>={ownerName:'Owner',location:'मुख्य ठाउँ',floor:'तला',landmark:'Landmark',roomType:'कोठाको प्रकार',monthlyRentNpr:'भाडा रु.',depositNpr:'Deposit रु.',availableRooms:'खाली unit',bathroom:'बाथरुम',kitchen:'Kitchen',water:'पानी',electricity:'बिजुली',wifi:'WiFi',parking:'Parking',furnished:'फर्निचर',availableFrom:'उपलब्ध मिति',restrictions:'सर्त',notes:'थप विवरण'};
function text(value:unknown):string {return value==null?'—':typeof value==='object'?JSON.stringify(value):String(value);}
export function OwnerCollectedData(){
  const token=useTokenStore(s=>s.token);
  const [query,setQuery]=useState(''),[search,setSearch]=useState(''),[page,setPage]=useState(0),[refresh,setRefresh]=useState(0);
  const [rows,setRows]=useState<Row[]>([]),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    setRows([]);setMore(false);setError('');
    if(!token)return;
    const controller=new AbortController();setBusy(true);
    void fetch(API+'/ai-owner/admin/collected-data?'+new URLSearchParams({search,page:String(page)}),{credentials:'include',cache:'no-store',headers:{Authorization:`Bearer ${token}`},signal:controller.signal})
      .then(async r=>{if(!r.ok)throw new Error(r.status===404?'यो table का लागि backend update चाहिन्छ।':'विवरण लोड भएन ('+r.status+')');return r.json();})
      .then(response=>{if(controller.signal.aborted)return;const data=response.data??response;setRows(Array.isArray(data.items)?data.items:[]);setMore(data.hasMore===true);})
      .catch(e=>{if(!controller.signal.aborted)setError(String(e.message||e));})
      .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>controller.abort();
  },[token,search,page,refresh]);
  return <section className="space-y-3 rounded-xl border p-4">
    <h2 className="text-lg font-semibold">Owner call बाट संकलित विवरण</h2>
    <p className="text-sm text-muted-foreground">Website मा save अनुमति दिएका विवरण र admin का owner phone call का मूल उत्तर। प्रत्येक पङ्क्ति एउटा call हो; पुरानो र नयाँ call का कोठा आफैँ मिलाइँदैन।</p>
    <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();setPage(0);setSearch(query.trim());setRefresh(n=>n+1);}}>
      <label className="flex-1"> <span className="sr-only">नाम, फोन, ठाउँ वा विवरण खोज्नुहोस्</span><input maxLength={200} value={query} onChange={e=>setQuery(e.target.value)} placeholder="नाम, फोन, ठाउँ वा विवरण खोज्नुहोस्" className="w-full rounded border bg-background p-2"/></label>
      <button className="rounded border px-3 py-2" disabled={busy}>खोज्नुहोस्</button>
      <button type="button" disabled={busy} onClick={()=>setRefresh(n=>n+1)} className="rounded border px-3 py-2">Refresh</button>
    </form>
    <p className="text-sm text-amber-700">बोली गलत लेखिएको वा उपलब्धता बदलिएको हुन सक्छ। मान्छे पठाउनुअघि owner सँग भाडा, सही बाटो र अहिले खाली छ कि छैन जाँच्नुहोस्। Approved हुनु live availability वा घरको pin पुष्टि होइन।</p>
    {error&&<p role="alert">{error}</p>}
    {busy&&<p role="status">लोड हुँदैछ…</p>}
    <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm">
      <caption className="sr-only">Owner call विवरण, मूल उत्तर र review स्थिति</caption>
      <thead><tr>{['Owner / सम्पर्क','Call / मिति','ठाउँ / बाटो','कोठा / भाडा','उपलब्धता / Review','सबै विवरण'].map(h=><th key={h} scope="col" className="border-b p-3">{h}</th>)}</tr></thead>
      <tbody>{rows.map(r=><tr key={r.source+r.id} className="align-top">
        <td className="border-b p-3"><strong>{r.ownerName||text(r.details.ownerName)}</strong><p>{r.phoneNumber||'फोन छैन'}</p></td>
        <td className="border-b p-3">{r.source==='PHONE'?'Phone':'Website'}<p>{new Date(r.createdAt).toLocaleString()}</p><p className="text-xs">{r.callStatus}</p></td>
        <td className="max-w-xs border-b p-3 break-words">{text(r.details.location)}<p>Landmark: {text(r.details.landmark)}</p><p>तला: {text(r.details.floor)}</p>{!!r.locationNotes?.length&&<details><summary className="cursor-pointer">सबै ठाउँ / बाटो ({r.locationNotes.length})</summary><ul className="list-disc pl-4">{r.locationNotes.map((n,i)=><li key={i}>{n.quote}</li>)}</ul></details>}</td>
        <td className="border-b p-3">{text(r.details.roomType)}<p>भाडा: {text(r.details.monthlyRentNpr)}</p><p>Deposit: {text(r.details.depositNpr)}</p></td>
        <td className="border-b p-3">खाली unit: {text(r.details.availableRooms)}<p>मिति: {text(r.details.availableFrom)}</p><p className="font-medium">{r.reviewStatus==='APPROVED'?'Admin ले review गरेको':r.reviewStatus==='REJECTED'?'अस्वीकृत':'पुष्टि / review बाँकी'}</p>{!!r.missingFields?.length&&<p className="text-xs">बाँकी: {r.missingFields.map(k=>labels[k]||k).join(', ')}</p>}</td>
        <td className="max-w-sm border-b p-3"><details><summary className="cursor-pointer">विवरण र मूल उत्तर खोल्नुहोस्</summary><dl className="mt-2 space-y-1">{Object.entries(r.details||{}).map(([k,v])=><div key={k}><dt className="inline font-medium">{labels[k]||k}: </dt><dd className="inline break-words">{text(v)}</dd></div>)}</dl><h3 className="mt-3 font-medium">Owner का मूल उत्तर ({r.ownerStatements?.length||0})</h3><ol className="list-decimal space-y-1 pl-5">{r.ownerStatements?.map((s,i)=><li key={i} className="whitespace-pre-wrap break-words">{s}</li>)}</ol><p className="mt-2 text-xs">Call ID: {r.callId}</p></details></td>
      </tr>)}</tbody>
    </table></div>
    {!busy&&!error&&!rows.length&&<p>यस खोजीमा saved विवरण छैन।</p>}
    <nav aria-label="विवरणका पृष्ठ" className="flex items-center gap-3"><button disabled={busy||page===0} onClick={()=>setPage(p=>p-1)} className="rounded border p-2">अघिल्लो</button><span>पृष्ठ {page+1}</span><button disabled={busy||!more} onClick={()=>setPage(p=>p+1)} className="rounded border p-2">अर्को</button></nav>
    <p className="text-xs text-muted-foreground">Website विवरण सच्याउन / review गर्न तल Room Drafts खोल्नुहोस्। Phone call का उत्तर review नभएको रूपमा देखिन्छन्।</p>
  </section>;
}
