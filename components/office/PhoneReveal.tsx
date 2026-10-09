"use client";

import { useId, useState } from 'react';

export function PhoneReveal({ phone, label = 'Phone' }: { phone?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!phone) return <span className="text-sm text-slate-500">{label}: Not recorded</span>;
  return <span className="inline-flex max-w-full flex-col items-start align-middle">
    <button type="button" aria-expanded={open} aria-controls={id}
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
      onClick={() => setOpen(value => !value)}>
      {open ? 'Hide' : 'Show'} {label.toLowerCase()} {open ? '⌃' : '⌄'}
    </button>
    <span id={id} aria-hidden={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <span className="min-h-0 overflow-hidden">
        {open && <a className="mt-2 inline-block rounded-lg bg-emerald-50 px-3 py-2 font-mono text-sm text-emerald-800 underline" href={`tel:${phone}`}>{phone}</a>}
      </span>
    </span>
  </span>;
}
