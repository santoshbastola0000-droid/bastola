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
  const parsed=parseDetails(room.details||'');
  const questions=parseCustomQuestions(room.details||'');
  return <div className="space-y-1 p-3">
    <div className="flex items-start justify-between gap-3"><h3 className="text-base font-semibold">{room.title}</h3><span className="rounded-lg bg-slate-100 px-3 py-1 font-mono font-bold">{room.code}</span></div>
    <p className="text-slate-600">📍 Location: {room.matchProfile?.exactAddress || room.location || "Not entered"} · Rent: रु {Number(room.price).toLocaleString()}/month</p>{room.matchProfile?.exactAddress&&<p className="text-sm text-slate-600">Exact address: {room.matchProfile.exactAddress}</p>}{room.matchProfile?.latitude != null&&room.matchProfile?.longitude != null&&<a className="inline-block text-sm text-blue-700 underline" target="_blank" rel="noopener noreferrer" href={'https://www.google.com/maps?q='+encodeURIComponent(String(room.matchProfile.latitude)+','+String(room.matchProfile.longitude))}>📍 View exact location on map ↗</a>}
    <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><p className="font-semibold">Room details</p>{questionLabels.map(label=>parsed[label]&&<p key={label}><strong>{fieldInfo[label].title}:</strong> {parsed[label]}</p>)}{questions.map((item,index)=><p key={index}><strong>{item.question}:</strong> {item.answer||"—"}</p>)}{parseDetails(room.details||"")["Other details"]&&<p className="whitespace-pre-wrap">{parseDetails(room.details||"")["Other details"]}</p>}{!room.details&&<p>No details added yet.</p>}</div>
    <div className="flex flex-wrap items-center gap-2 text-sm"><span>Owner: {room.ownerName || '—'}</span><PhoneReveal phone={room.ownerPhone} label="Owner phone"/></div>
    {room.tiktokUrl && <a className="inline-block text-sm text-blue-700 underline" href={room.tiktokUrl} target="_blank" rel="noopener noreferrer">Open TikTok ↗</a>}
  </div>;
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
