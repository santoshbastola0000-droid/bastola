"use client";
import { OwnerVoiceCostPanel } from "@/components/OwnerVoiceCostPanel";
import { useEffect, useRef, useState } from "react";
import { privateApi } from "@/http/api/privateApi";
import useTokenStore from "@/store";

type Target={id:string;phone:string;name:string;status:string;providerStatus:string|null;error:string|null;callSid:string|null};
type State={enabled:boolean;configured:boolean;voiceEnabled:boolean;from:string|null;notice:string|null;counts:{status:string;count:number}[];items:Target[];hasMore:boolean};
const statusLabels:Record<string,string>={QUEUED:"पालो पर्खँदै",DIALING:"Call पठाउँदै",ACTIVE:"Call चल्दैछ",DONE:"सकियो",FAILED:"उठेन / असफल",UNKNOWN:"Provider मा जाँच आवश्यक",CANCELLED:"हटाइयो / रोकियो"};
function failure(e:unknown){const error=e as {response?:{data?:{message?:unknown}}};const message=error.response?.data?.message;return typeof message==='string'?message:"परिवर्तन सुरक्षित भएन। Connection र admin access जाँच्नुहोस्।";}
export function AiAutoCalling({selectedPhone="",selectedName=""}:{selectedPhone?:string;selectedName?:string}) {
  const token=useTokenStore(s=>s.token);
  const [state,setState]=useState<State|null>(null);
  const [numbers,setNumbers]=useState("");
  const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false);
  const pending=useRef(false);
  const [error,setError]=useState("");
  const [loadError,setLoadError]=useState("");
  const [notice,setNotice]=useState("");
  const [offset,setOffset]=useState(0);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    if(!token){setState(null);return;}
    let active=true;
    let timer:ReturnType<typeof setTimeout>;
    const controller=new AbortController();
    async function load(){try{
      const r=await privateApi.get('/admin/ai-call/auto',{params:{offset},signal:controller.signal});
      if(active){setState(r.data?.data??r.data);setLoadError("");}
    }catch{if(active)setLoadError('Auto calling लोड भएन। Backend update र connection जाँच्नुहोस्।');}
    finally{if(active)timer=setTimeout(()=>void load(),5000);}}
    void load();return()=>{active=false;controller.abort();clearTimeout(timer);};
  },[token,offset,refresh]);
  async function action(work:()=>Promise<unknown>,success:string){
    if(pending.current)return;pending.current=true;setBusy(true);setError('');setNotice('');
    try{await work();setNotice(success);setRefresh(n=>n+1);}
    catch(e){setError(failure(e));}
    finally{pending.current=false;setBusy(false);}
  }
  function add(contacts:{phone:string;name:string}[]){
    if(!consent){setError('पहिले owner को call अनुमति पुष्टि गर्नुहोस्।');return;}
    if(!contacts.length){setError('कम्तीमा एउटा नम्बर राख्नुहोस्।');return;}
    void action(async()=>{
      const r=await privateApi.post('/admin/ai-call/auto/targets',{contacts,consentConfirmed:true});
      const data=r.data?.data??r.data;
      setNumbers('');setConsent(false);
      return data;
    },'अनुमति भएका नयाँ नम्बर queue मा थपिए। Duplicate नम्बर फेरि थपिँदैन।');
  }
  return <section id="auto-calling" className="space-y-4 rounded-xl border p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">AI Auto Calling</h2><p className="text-sm text-muted-foreground">ON हुँदा तलका owner नम्बरमा पालैपालो call गरेर खाली कोठा छ कि सोध्छ।</p></div>
      <button role="switch" aria-checked={state?.enabled===true} disabled={busy||!state||(!state.enabled&&(!state.configured||!state.voiceEnabled))}
        onClick={()=>void action(()=>privateApi.patch('/admin/ai-call/auto',{enabled:!state?.enabled}),state?.enabled?'Auto calling OFF गरियो। चलिरहेको call को stop status तल हेर्नुहोस्।':'Auto calling ON गरियो।')}
        className={`rounded-full px-6 py-3 font-bold text-white disabled:opacity-50 ${state?.enabled?'bg-green-700':'bg-gray-600'}`}>{busy?'Saving…':state?.enabled?'ON':'OFF'}</button>
    </div>
    <OwnerVoiceCostPanel phone phoneSid={(state?.items.find(r=>r.callSid&&['ACTIVE','DIALING'].includes(r.status))||state?.items.find(r=>r.callSid))?.callSid||undefined} poll={state?.items.some(r=>['ACTIVE','DIALING'].includes(r.status))??false} />
    <p className="rounded-lg bg-muted p-3 text-sm">AI: “नमस्ते, म RoomKhoj को AI सहायक बोल्दै छु। तपाईंको घरमा भाडामा दिने कुनै खाली कोठा छ?”</p>
    {!state&&<p role="status">{token?'Status लोड हुँदैछ…':'Admin login आवश्यक छ।'}</p>}
    {state&&<p className="text-sm">Calling number: <strong>{state.from||'जोडिएको छैन'}</strong> · Phone provider: {state.configured?'तयार':'setup बाँकी'} · AI Calling: {state.voiceEnabled?'enabled':'disabled'}</p>}
    <p className="text-xs text-muted-foreground">एउटा call सकिएपछि अर्को सुरु हुन्छ। प्रति नम्बर एकपटक मात्र प्रयास हुन्छ। OFF ले नयाँ call रोक्छ र चालु auto call बन्द गर्ने प्रयास गर्छ। Backend restart पछि OFF हुन्छ।</p>
    <label className="block text-sm" htmlFor="auto-owner-numbers">Owner नम्बरहरू — प्रत्येक line मा एउटा (+977… वा 98…)</label>
    <textarea id="auto-owner-numbers" rows={3} maxLength={2500} value={numbers} onChange={e=>setNumbers(e.target.value)} className="w-full rounded-lg border bg-background p-3" placeholder={"+97798XXXXXXXX\n+97797XXXXXXXX"}/>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>यी owner ले RoomKhoj AI बाट availability call लिन अनुमति दिएका छन्।</span></label>
    <div className="flex flex-wrap gap-2">
      <button disabled={busy||!consent||!numbers.trim()} className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-40" onClick={()=>add(numbers.split(/\r?\n/).map(phone=>phone.trim()).filter(Boolean).map(phone=>({phone,name:""})))}>नम्बर queue मा थप्नुहोस्</button>
      {selectedPhone&&<button disabled={busy||!consent} className="rounded-lg border px-4 py-2 disabled:opacity-40" onClick={()=>add([{phone:selectedPhone,name:selectedName.slice(0,120)}])}>छानिएको owner थप्नुहोस् ({selectedName||selectedPhone})</button>}
    </div>
    {loadError&&<p role="alert" className="text-sm text-red-600">{loadError}</p>}
    {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
    {notice&&<p role="status" className="text-sm text-green-700">{notice}</p>}
    {state?.notice&&<p className="rounded border border-amber-400 p-3 text-sm">{state.notice}</p>}
    {state&&<>
      <p className="text-xs">{state.counts.map(c=>`${statusLabels[c.status]||c.status}: ${c.count}`).join(' · ')||'Queue खाली छ।'}</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Owner / Number</th><th className="p-2">Call अवस्था</th><th className="p-2">Action</th></tr></thead><tbody>
        {state.items.map(row=><tr key={row.id} className="border-t"><td className="p-2"><p>{row.name||'Owner'}</p><p>{row.phone}</p></td><td className="p-2"><p>{statusLabels[row.status]||row.status}{row.providerStatus?` · ${row.providerStatus}`:''}</p>{row.error&&<p className="max-w-xs text-xs text-red-600">{row.error}</p>}{row.callSid&&<p className="break-all text-xs text-muted-foreground">{row.callSid}</p>}</td><td className="p-2">
          {row.status==='QUEUED'&&<button disabled={busy} className="rounded border p-2" onClick={()=>void action(()=>privateApi.delete(`/admin/ai-call/auto/targets/${row.id}`),'नम्बर queue बाट हटाइयो।')}>Remove</button>}
          {row.status==='UNKNOWN'&&<button disabled={busy} className="rounded border p-2 text-xs" onClick={()=>{
            if(window.confirm('Phone provider dashboard मा यो प्रयास जाँच्नुभयो र कुनै call चलिरहेको छैन भन्ने पुष्टि गर्नुभयो? यो नम्बर फेरि dial हुने छैन।'))
              void action(()=>privateApi.post(`/admin/ai-call/auto/targets/${row.id}/resolve`,{confirmed:true}),'Provider review पूरा भयो। नम्बर फेरि dial हुँदैन।');
          }}>Provider मा जाँच गरिसकेँ</button>}
        </td></tr>)}
      </tbody></table></div>
      <div className="flex items-center justify-between text-sm"><button disabled={offset===0||busy} onClick={()=>setOffset(n=>Math.max(0,n-50))}>Previous</button><span>Page {offset/50+1}</span><button disabled={!state.hasMore||busy} onClick={()=>setOffset(n=>n+50)}>Next</button></div>
    </>}
  </section>;
}
