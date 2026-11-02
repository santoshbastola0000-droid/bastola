"use client";

import { useEffect, useRef, useState } from 'react';
import { officeError, officeService } from '@/http/services/office.service';
import type { ClientInput, OfficeHistory, OfficeRoom } from '@/http/services/office.service';
import { PhoneReveal } from './PhoneReveal';
import { OfficeVideo } from './OfficeVideo';
import { clientHistoryGroups, clientRoomHistory } from '@/lib/reception-client-history';
import { privateApi } from '@/http/api/privateApi';

type Outcome = 'MOVED_IN' | 'NOT_MOVED_IN';
type Props = {
  query?: string; roomId?: string; revision?: number; busy: boolean;
  onSend: (room: OfficeRoom, client: ClientInput) => void;
  onOutcome: (entry: OfficeHistory, outcome: Outcome, notes: string) => Promise<void>;
};
const secondary = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50';

export function ReceptionHistory({ query = '', roomId, revision = 0, busy, onSend, onOutcome }: Props) {
  const [entries, setEntries] = useState<OfficeHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [formPhones, setFormPhones] = useState<Set<string>>(new Set());
  const phoneKey = (phone?: string) => (phone || '').replace(/\D/g,'').slice(-10);
  const generation = useRef(0);
  const pending = useRef(false);
  const scope = useRef('');

  useEffect(() => {
    const current = ++generation.current;
    pending.current = true; setLoading(true); setError(''); setPage(0);
    const nextScope=JSON.stringify([query,roomId]);
    if(scope.current!==nextScope){scope.current=nextScope;setEntries([]);setTotal(0);}
    officeService.history(query, roomId, 0).then(result => {
      if (current !== generation.current) return;
      setEntries(result.history); setTotal(result.total);
      const phones = [...new Set(result.history.map(entry => phoneKey(entry.clientPhone)).filter(phone => phone.length === 10))];
      setFormPhones(new Set());
      if (phones.length) privateApi.post('/office/chat-forms/phone-matches',{phones}).then(response => {
        if (current === generation.current) setFormPhones(new Set((response.data?.data?.phones || response.data?.phones || []) as string[]));
      }).catch(() => { if (current === generation.current) setFormPhones(new Set()); });
    }).catch(error => {
      if (current === generation.current) setError(officeError(error));
    }).finally(() => {
      if (current === generation.current) { pending.current = false; setLoading(false); }
    });
    return () => { generation.current += 1; };
  }, [query, roomId, revision, attempt]);

  async function loadMore() {
    if (pending.current) return;
    const current = generation.current;
    pending.current = true; setLoading(true); setError('');
    try {
      const result = await officeService.history(query, roomId, page + 1);
      if (current !== generation.current) return;
      setEntries(previous => [...new Map([...previous, ...result.history].map(entry => [entry.id, entry])).values()]);
      const phones=[...new Set(result.history.map(entry=>phoneKey(entry.clientPhone)).filter(phone=>phone.length===10))];
      if(phones.length) void privateApi.post('/office/chat-forms/phone-matches',{phones}).then(response=>{
        if(current===generation.current) setFormPhones(previous=>new Set([...previous,...((response.data?.data?.phones || response.data?.phones || []) as string[])]));
      }).catch(()=>undefined);
      setTotal(result.total); setPage(value => value + 1);
    } catch (error) {
      if (current === generation.current) setError(officeError(error));
    } finally {
      if (current === generation.current) { pending.current = false; setLoading(false); }
    }
  }

  return <section className="space-y-3" aria-label="Serial client history">
    <div><h2 className="text-lg font-semibold">Client history ({total})</h2><p className="text-sm text-slate-500">Client को नाममुनि देखाएका rooms · बसेको टिक गर्दा यहीँ rented हुन्छ।</p></div>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error} <button type="button" className="underline" onClick={() => entries.length ? void loadMore() : setAttempt(value => value + 1)}>Try again</button></div>}
    <ol className="space-y-3">
      {clientHistoryGroups(entries).map((group, index) => <HistoryRow key={(group[0].clientId||group[0].id)+":"+revision} entries={group} serial={index + 1} busy={busy} formFilled={formPhones.has(phoneKey(group[0].clientPhone))} onSend={onSend} onOutcome={onOutcome}/>)}
    </ol>
    {loading && <p role="status" className="text-sm text-slate-500">Loading history…</p>}
    {!loading && !error && entries.length === 0 && <p className="text-sm text-slate-500">No matching client history.</p>}
    {entries.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{entries.length} of {total} records shown</span>{(page + 1) * 50 < total && <button type="button" className={secondary} disabled={loading} onClick={() => void loadMore()}>{loading ? 'Loading…' : 'Load more history ↓'}</button>}</div>}
  </section>;
}

function HistoryRow({ entries, serial, busy, formFilled, onSend, onOutcome }: {
  entries: OfficeHistory[]; serial: number; busy: boolean; formFilled: boolean;
  onSend: Props['onSend']; onOutcome: Props['onOutcome'];
}) {
  const client=entries[0];
  const [related,setRelated]=useState<OfficeHistory[]>([]);
  const [page,setPage]=useState(-1);
  const [hasMore,setHasMore]=useState(true);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const pending=useRef(false);
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const rooms=clientRoomHistory(client.clientId,[...entries,...related]);
  async function loadRelated() {
    if(pending.current||!client.clientId||!client.clientPhone)return;
    pending.current=true;setLoading(true);setError('');
    try {
      const next=page+1;
      const result=await officeService.history(client.clientPhone,undefined,next);
      if(!alive.current)return;
      // Search can match owner phones too. Never display another client's rows.
      setRelated(previous=>[...previous,...result.history.filter(row=>row.clientId===client.clientId)]);
      setPage(next);setHasMore((next+1)*50<result.total);
    } catch(error) {if(alive.current)setError(officeError(error));}
    finally {pending.current=false;if(alive.current)setLoading(false);}
  }
  return <li className="min-w-0 overflow-hidden rounded-xl border bg-white p-3">
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">{serial}.</span>
      <h3 className="min-w-0 break-words text-sm font-bold">{client.clientName||'Name not recorded'}</h3>
      {formFilled&&<span className="text-[10px] text-emerald-700">✓ Form filled</span>}
      <PhoneReveal phone={client.clientPhone} label="Client phone" highlighted={formFilled}/>
    </div>
    <ul className="space-y-2" aria-label="Rooms shown to this client">
      {rooms.map(entry=><CompactClientRoom key={entry.roomId} entry={entry} busy={busy} onSend={onSend} onOutcome={onOutcome}/>)}
    </ul>
    {hasMore&&<button type="button" className="mt-2 text-xs font-semibold text-blue-700 underline disabled:opacity-50" disabled={loading||!client.clientPhone} onClick={()=>void loadRelated()}>{loading?'Loading…':page<0?'अरू देखाएका rooms हेर्नुहोस्':'थप history खोज्नुहोस्'}</button>}
    {page>=0&&!hasMore&&<p className="mt-2 text-[10px] text-slate-500">यस client का खोजिएका सबै room records देखाइए।</p>}
    {error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </li>;
}

function CompactClientRoom({entry,busy,onSend,onOutcome}:{
  entry:OfficeHistory;busy:boolean;onSend:Props['onSend'];onOutcome:Props['onOutcome'];
}) {
  const [notes,setNotes]=useState('');
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const pending=useRef(false);
  async function outcome(value:Outcome) {
    if(pending.current||busy)return;
    pending.current=true;setSaving(true);setError('');
    try {await onOutcome(entry,value,notes);}
    catch(error){setError(officeError(error));}
    finally{pending.current=false;setSaving(false);}
  }
  const stayed=entry.occupancyStatus==='MOVED_IN';
  return <li className="min-w-0 rounded-lg border bg-slate-50 p-2">
    <div className="flex items-start gap-2">
      <div className="w-24 shrink-0 overflow-hidden rounded-md"><OfficeVideo compact roomId={entry.roomId}/></div>
      <div className="min-w-0 flex-1 text-xs">
        <p className="break-words font-bold">{entry.code} · {entry.title}</p>
        <p className="break-words text-slate-600">{entry.location}</p>
        <p className="font-semibold">रु. {Number(entry.price||0).toLocaleString()} / महिना</p>
        <p className="line-clamp-2 break-words text-[10px] text-slate-500">{entry.details||'थप विवरण छैन'}</p>
        <p className="text-[10px] text-slate-500">{entry.status==='RENTED'?'Rented':'Available'} · {new Date(entry.occurredAt||entry.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-emerald-800">
        <input type="checkbox" checked={stayed} disabled={busy||saving||stayed||entry.status==='RENTED'} onChange={event=>{if(event.target.checked)void outcome('MOVED_IN');}}/>
        {saving?'Saving…':'बसेको / Fixed'}
      </label>
      <button type="button" className="text-[10px] text-blue-700 underline disabled:opacity-50" disabled={busy||saving||entry.status==='RENTED'} onClick={()=>onSend({...entry,id:entry.roomId},{clientName:entry.clientName,clientPhone:entry.clientPhone,recordId:entry.recordId,notes:''})}>फेरि पठाउनुहोस्</button>
    </div>
    <details className="mt-1 text-[10px]">
      <summary className="cursor-pointer text-slate-500">Notes / नबसेको</summary>
      {entry.notes&&<p className="my-1 whitespace-pre-wrap break-words">{entry.notes}</p>}
      <label className="block">Outcome notes<textarea rows={2} maxLength={5000} className="mt-1 w-full rounded border p-2 text-xs" value={notes} onChange={event=>setNotes(event.target.value)}/></label>
      <button type="button" className="mt-1 text-red-700 underline disabled:opacity-50" disabled={busy||saving||!notes.trim()||stayed||entry.status==='RENTED'} onClick={()=>void outcome('NOT_MOVED_IN')}>नबसेको / Not moved in</button>
    </details>
    {error&&<p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
  </li>;
}
