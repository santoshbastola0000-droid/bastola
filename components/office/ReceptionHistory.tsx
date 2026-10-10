"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { officeError, officeService } from '@/http/services/office.service';
import type { ClientInput, OfficeHistory, OfficeRoom } from '@/http/services/office.service';
import { PhoneReveal } from './PhoneReveal';
import { RoomDetails } from './RoomDetails';
import { TenantView } from './TenantDetails';
import { OfficeVideo } from './OfficeVideo';

type Outcome = 'MOVED_IN' | 'NOT_MOVED_IN';
type Props = {
  query?: string; roomId?: string; revision?: number; busy: boolean;
  onSend: (room: OfficeRoom, client: ClientInput) => void;
  onOutcome: (entry: OfficeHistory, outcome: Outcome, notes: string) => void;
};
const secondary = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50';

export function ReceptionHistory({ query = '', roomId, revision = 0, busy, onSend, onOutcome }: Props) {
  const [entries, setEntries] = useState<OfficeHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
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
      setTotal(result.total); setPage(value => value + 1);
    } catch (error) {
      if (current === generation.current) setError(officeError(error));
    } finally {
      if (current === generation.current) { pending.current = false; setLoading(false); }
    }
  }

  return <section className="space-y-3" aria-label="Serial client history">
    <div><h2 className="text-lg font-semibold">Client history ({total})</h2><p className="text-sm text-slate-500">Newest first · Click a numbered row to open details here. Saved history is permanent.</p></div>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error} <button type="button" className="underline" onClick={() => entries.length ? void loadMore() : setAttempt(value => value + 1)}>Try again</button></div>}
    <ol className="space-y-3">
      {entries.map((entry, index) => <HistoryRow key={entry.id} entry={entry} serial={index + 1} busy={busy} onSend={onSend} onOutcome={onOutcome}/>)}
    </ol>
    {loading && <p role="status" className="text-sm text-slate-500">Loading history…</p>}
    {!loading && !error && entries.length === 0 && <p className="text-sm text-slate-500">No matching client history.</p>}
    {entries.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{entries.length} of {total} records shown</span>{(page + 1) * 50 < total && <button type="button" className={secondary} disabled={loading} onClick={() => void loadMore()}>{loading ? 'Loading…' : 'Load more history ↓'}</button>}</div>}
  </section>;
}

function HistoryRow({ entry, serial, busy, onSend, onOutcome }: {
  entry: OfficeHistory; serial: number; busy: boolean;
  onSend: Props['onSend']; onOutcome: Props['onOutcome'];
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const id = useId();
  return <li className="overflow-hidden rounded-xl border bg-white">
    <button type="button" className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50"
      aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-emerald-50 px-2 font-mono font-bold text-emerald-800">{serial}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{entry.clientName} · {entry.code}</span><span className="block text-sm text-slate-600">{entry.action==='SENT'?`Sent to ${entry.clientName}`:entry.action.replaceAll('_', ' ')} · {entry.location}</span><span className="block text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()} · {entry.staffName || 'Client'}</span></span>
      <span aria-hidden="true" className={`text-xl transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}>⌄</span>
    </button>
    <div id={id} aria-hidden={!open} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="min-h-0 overflow-hidden">{open && <div className="border-t">
        <OfficeVideo roomId={entry.roomId}/><RoomDetails room={{ ...entry, id: entry.roomId }}/>
        <div className="space-y-3 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{entry.clientName}</span><PhoneReveal phone={entry.clientPhone} label="Client phone"/></div>
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold">{entry.occupancyStatus === 'MOVED_IN' ? 'बसिसकेको / Moved in' : entry.occupancyStatus === 'NOT_MOVED_IN' ? 'नबसेको / Not moved in' : 'अवस्था पुष्टि हुन बाँकी / Not confirmed'}</p>
          <p className="whitespace-pre-wrap text-sm">{entry.notes}</p>
          <p className="text-xs text-slate-500">Event date/time: {new Date(entry.occurredAt||entry.createdAt).toLocaleString()} · Recorded by {entry.staffName||'Client'}</p>
          {entry.notMovedReason&&entry.occupancyStatus==='NOT_MOVED_IN'&&<p className="text-sm">Reason not staying: {entry.notMovedReason}</p>}
          {entry.tenantRental?.tenant&&<TenantView tenant={entry.tenantRental.tenant}/>}
          {entry.recordId && <section className="space-y-2 rounded-lg border bg-white p-3 text-sm" aria-label="Linked client form"><h3 className="font-semibold">Client form · {entry.formName || 'Name not recorded'}</h3><PhoneReveal phone={entry.formPhone} label="Form phone"/><p>Status: {entry.formStatus || '—'}</p><p>Destination: {entry.formDestination || '—'}</p></section>}
          <label className="block space-y-1 text-sm">Reception / outcome notes<textarea className="w-full rounded-lg border bg-white p-3" rows={2} maxLength={5000} value={notes} onChange={event => setNotes(event.target.value)}/></label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondary} disabled={busy || entry.status === 'RENTED'} onClick={() => onSend({ ...entry, id: entry.roomId }, { clientName: entry.clientName, clientPhone: entry.clientPhone, recordId: entry.recordId, notes: '' })}>Send this room again</button>
            {(['MOVED_IN', 'NOT_MOVED_IN'] as const).map(outcome => <button type="button" key={outcome} className={secondary} disabled={busy||(outcome==='NOT_MOVED_IN'&&!notes.trim())} onClick={() => onOutcome(entry, outcome, notes)}>{outcome === 'MOVED_IN' ? 'बसेको / Moved in' : 'नबसेको / Not moved in'}</button>)}
          </div>
        </div>
      </div>}</div>
    </div>
  </li>;
}

