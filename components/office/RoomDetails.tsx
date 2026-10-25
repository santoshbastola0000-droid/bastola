"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { officeService, officeError, type OfficeRoom } from '@/http/services/office.service';
import { PhoneReveal } from './PhoneReveal';

const questionLabels = ["Water / Electricity","Wi-Fi","Parking","Suitable tenants","Not suitable tenants","Neighbors / surroundings","Additional questions"];
const fieldInfo: Record<string, { title: string; example: string }> = {
  "Water / Electricity": { title: "Water / Electricity", example: "पानीको पैसा लाग्छ, बिजुलीको लाग्दैन" },
  "Wi-Fi": { title: "Wi-Fi", example: "Wi-Fi छ, महिनाको रु 300 लाग्छ" },
  "Parking": { title: "Parking", example: "बाइकको मात्र पार्किङ छ" },
  "Suitable tenants": { title: "कस्तो प्रकारका मान्छे बस्न मिल्छ?", example: "Student, working person" },
  "Not suitable tenants": { title: "कस्तो मान्छे बस्न मिल्दैन?", example: "जाँडरक्सी खाने, हल्ला गर्ने" },
  "Neighbors / surroundings": { title: "वरिपरि कस्ता मान्छे बस्छन्?", example: "Family, student" },
  "Additional questions": { title: "थप विवरण", example: "अन्य जानकारी" },
};
const CUSTOM_PREFIX = "Custom question: ";
function parseCustomQuestions(raw: string): {question:string;answer:string}[] {
  return raw.split('\n').filter(line=>line.startsWith(CUSTOM_PREFIX)).map(line=>{
    const rest=line.slice(CUSTOM_PREFIX.length);
    const separator=rest.indexOf(" | Answer: ");
    return separator===-1?{question:rest,answer:""}:{question:rest.slice(0,separator),answer:rest.slice(separator+" | Answer: ".length)};
  });
}
function removeCustomLines(raw:string){return raw.split('\n').filter(line=>!line.startsWith(CUSTOM_PREFIX)).join('\n');}

function parseDetails(raw: string): Record<string,string> { const result: Record<string,string> = {}; const lines=removeCustomLines(raw).split('\n'); const extra:string[]=[]; for(const line of lines){const label=questionLabels.find(k=>line.startsWith(k+': ')); if(label) result[label]=line.slice(label.length+2); else extra.push(line); } result['Other details']=extra.join('\n').trim(); return result; }
function serializeDetails(values:Record<string,string>){return [...questionLabels.map(k=>values[k]?.trim()?k+': '+values[k].trim():''),values['Other details']?.trim()||''].filter(Boolean).join('\n');}

export function RoomDetails({ room }: { room: OfficeRoom }) {
  const [tab,setTab]=useState<'overview'|'owner'|'history'>('overview');
  const [more,setMore]=useState(false);
  useEffect(()=>{setTab('overview');setMore(false);},[room.id]);
  const parsed=parseDetails(room.details||'');
  const questions=parseCustomQuestions(room.details||'');
  const profile=room.matchProfile;
  const rent=Number(room.price);
  const rentKnown=Number.isFinite(rent)&&rent>0;
  const place=profile?.exactAddress||room.location||profile?.area||profile?.city||'Not entered';
  const facilities=profile?.facilities||[];
  const missing=[
    !rentKnown&&'Rent',!room.location&&!profile?.exactAddress&&'Location',
    !profile?.roomType&&'Room type',!profile?.capacity&&'Capacity',
    !facilities.length&&'Facilities',!room.ownerPhone&&'Owner phone'
  ].filter((item):item is string=>Boolean(item));
  const status=room.status==='RENTED'?'Rented':room.availabilityExpired?'Confirmation required':'Available';
  const info=[['Monthly rent',rentKnown?'Rs. '+rent.toLocaleString()+'/month':'Not entered'],
    ['Location',place],['Room type',profile?.roomType||'Not entered'],
    ['Capacity',profile?.capacity?String(profile.capacity)+' people':'Not entered'],
    ['Times rented',String(room.rentalCount||0)+' times'],['Availability',status]];
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-3 text-slate-900 sm:p-4">
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reception / Room Details</p>
        <h3 className="text-lg font-bold">{room.title||'Untitled room'}</h3>
        <p className="text-sm text-slate-600">{room.code} · {place}</p></div>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${room.status==='RENTED'?'bg-slate-200 text-slate-800':room.availabilityExpired?'bg-amber-100 text-amber-800':'bg-emerald-100 text-emerald-800'}`}>{status}</span>
    </header>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{info.map(([label,value])=><div key={label} className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-bold">{value}</p></div>)}</div>
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold">Room information completeness</p><span className="text-xs text-slate-500">{6-missing.length}/6</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${((6-missing.length)/6)*100}%`}}/></div>
      <p className="mt-2 text-xs text-slate-600">{missing.length?'Missing: '+missing.join(', '):'All key details entered'}. Missing details do not block saving.</p>
    </div>
    <div role="tablist" aria-label="Room information" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">{(['overview','owner','history'] as const).map(value=><button key={value} type="button" role="tab" aria-selected={tab===value} onClick={()=>setTab(value)} className={`rounded-lg px-2 py-2 text-sm font-semibold capitalize ${tab===value?'bg-white text-blue-700 shadow-sm':'text-slate-600'}`}>{value}</button>)}</div>
    {tab==='overview'&&<div role="tabpanel" className="space-y-4">
      <div><h4 className="mb-2 font-bold">Facilities & Services</h4>{facilities.length?<div className="flex flex-wrap gap-2">{facilities.map(facility=><span key={facility} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">✓ {facility}</span>)}</div>:<p className="text-sm text-slate-500">Facilities not confirmed yet.</p>}</div>
      <div className="space-y-2"><h4 className="font-bold">Room Rules & Information</h4>
        {questionLabels.map(label=>parsed[label]&&<p key={label} className="rounded-lg bg-slate-50 p-2 text-sm"><strong>{fieldInfo[label].title}: </strong>{parsed[label]}</p>)}
        {questions.map((item,index)=><p key={index} className="rounded-lg bg-slate-50 p-2 text-sm"><strong>{item.question}: </strong>{item.answer||'Not entered'}</p>)}
        {parsed['Other details']&&<p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-sm">{parsed['Other details']}</p>}
        {!room.details&&<p className="text-sm text-slate-500">No room rules or notes added yet.</p>}
      </div>
      <button type="button" onClick={()=>setMore(!more)} aria-expanded={more} className="w-full rounded-lg border border-slate-200 p-3 text-left text-sm font-semibold">More room details {more?'⌃':'⌄'}</button>
      {more&&<div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
        <p><strong>City / Area:</strong> {[profile?.city,profile?.area].filter(Boolean).join(', ')||'Not entered'}</p>
        <p><strong>Exact address:</strong> {profile?.exactAddress||'Not entered'}</p>
        <p><strong>Occupancy:</strong> {profile?.occupancy||'Not entered'}</p>
        <p><strong>Parking:</strong> {profile?.parkingVehicles?.join(', ')||'Not entered'}</p>
        {profile?.latitude!=null&&profile.longitude!=null&&<a className="text-blue-700 underline" target="_blank" rel="noopener noreferrer" href={'https://www.google.com/maps?q='+encodeURIComponent(profile.latitude+','+profile.longitude)}>View map ↗</a>}
        {room.tiktokUrl&&/^https?:\/\//i.test(room.tiktokUrl)&&<p><a className="text-blue-700 underline" href={room.tiktokUrl} target="_blank" rel="noopener noreferrer">Open TikTok ↗</a></p>}
      </div>}
    </div>}
    {tab==='owner'&&<div role="tabpanel" className="space-y-3 rounded-lg bg-slate-50 p-3">
      <h4 className="font-bold">Owner Information</h4><p className="text-sm">Name: {room.ownerName||'Not entered'}</p>
      <PhoneReveal phone={room.ownerPhone} label="Owner phone"/>
      <p className="text-xs text-slate-500">Owner contact is protected by Reception access controls.</p>
    </div>}
    {tab==='history'&&<div role="tabpanel" className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
      <h4 className="font-bold">Rental & Staff History</h4>
      <p>Times rented: {room.rentalCount||0}</p>
      <p>Last availability confirmation: {room.availabilityConfirmedAt?new Date(room.availabilityConfirmedAt).toLocaleString():'Not recorded'}</p>
      <p>Current rental: {room.currentRental?'Rented':'None recorded'}</p>
      <p className="text-slate-600">Full tenant history, staff comments and client visits are available in the sections below.</p>
    </div>}
  </section>;
}


/** Admin-only inline editor; writes to the existing room details column. */
export function RoomDetailsEditor({ room, onSaved }: { room: OfficeRoom; onSaved: () => Promise<void> }) {
  const [customQuestions,setCustomQuestions] = useState(()=>parseCustomQuestions(room.details||''));
  const [values,setValues] = useState<Record<string,string>>(()=>parseDetails(room.details||''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => { setCustomQuestions(parseCustomQuestions(room.details||'')); setValues(parseDetails(room.details||'')); setError(''); setSaved(false); }, [room.id, room.details]);
  const serialized=[serializeDetails(values),...customQuestions.filter(item=>item.question.trim()).map(item=>CUSTOM_PREFIX+item.question.trim().replaceAll('\n',' ')+' | Answer: '+item.answer.trim().replaceAll('\n',' '))].filter(Boolean).join('\n');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (serialized.length>5000){setError('Details must be under 5000 characters');return;}
    setSaving(true); setError(''); setSaved(false);
    try {
      await officeService.update(room.id, {
        code: room.code, title: room.title, location: room.location,
        details: serialized, ownerName: room.ownerName, ownerPhone: room.ownerPhone,
        tiktokUrl: room.tiktokUrl, price: room.price, matchProfile: room.matchProfile,
      });
      await onSaved();
      setSaved(true);
      setEditing(false);
    } catch (cause) { setError(officeError(cause)); }
    finally { setSaving(false); }
  }
  return <div className="space-y-2"><button type="button" onClick={()=>{setEditing(value=>!value);setError("");}} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700">{editing?"Cancel edit":"Edit details"}</button>
    {saved && !editing && <span role="status" className="ml-2 text-sm text-emerald-700">Details saved</span>}
    {editing && <form onSubmit={save} className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
    <p className="text-sm font-semibold">Reception room details</p>
    <p className="text-sm">Location: {room.matchProfile?.exactAddress || room.location || 'Not entered'} · Rent: रु {Number(room.price).toLocaleString()}/month</p>
    {questionLabels.map(label=><label key={label} className="block text-sm font-semibold text-slate-900">{fieldInfo[label].title}<textarea rows={label==='Additional questions'?4:2} maxLength={1000} value={values[label]||''} onChange={e=>setValues(v=>({...v,[label]:e.target.value}))} placeholder={fieldInfo[label].example} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal"/></label>)}
    <div className="space-y-2"><p className="text-sm font-semibold">Custom questions</p>
    {customQuestions.map((item,index)=><div key={index} className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
      <input aria-label="Custom question" value={item.question} maxLength={200} onChange={e=>setCustomQuestions(items=>items.map((v,i)=>i===index?{...v,question:e.target.value}:v))} placeholder="प्रश्न लेख्नुहोस्" className="w-full rounded border border-slate-300 p-2 text-sm"/>
      <textarea aria-label="Custom answer" value={item.answer} maxLength={1000} onChange={e=>setCustomQuestions(items=>items.map((v,i)=>i===index?{...v,answer:e.target.value}:v))} placeholder="उत्तर लेख्नुहोस्" rows={2} className="w-full rounded border border-slate-300 p-2 text-sm"/>
      <button type="button" className="text-xs font-semibold text-red-700" onClick={()=>setCustomQuestions(items=>items.filter((_,i)=>i!==index))}>Remove question</button>
    </div>)}
    <button type="button" onClick={()=>setCustomQuestions(items=>[...items,{question:'',answer:''}])} className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-blue-700">+ Add Question</button>
    </div>
    <label className="block text-sm font-semibold">Other details<textarea rows={3} value={values['Other details']||''} onChange={e=>setValues(v=>({...v,'Other details':e.target.value}))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal"/></label>
    <div className="flex items-center gap-3">
      <button type="submit" disabled={saving || serialized===(room.details || '').trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {saving?'Saving…':'Save details'}
      </button>
      {saved && <span role="status" className="text-sm text-emerald-700">Details saved</span>}
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </form>}</div>;
}
