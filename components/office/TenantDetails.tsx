"use client";
import { useState } from 'react';
import { officeError, officeService, TenantDetails } from '@/http/services/office.service';
import { PhoneReveal } from './PhoneReveal';

export function TenantView({tenant}:{tenant:TenantDetails}) {
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function download(){
    if(!tenant.documentId)return;setBusy(true);setError('');
    try{const blob=await officeService.document(tenant.documentId);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`tenant-citizenship.${blob.type==='application/pdf'?'pdf':blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg'}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    catch(e){setError(officeError(e));}finally{setBusy(false);}
  }
  return <section className="space-y-1 rounded-lg border bg-white p-3 text-sm" aria-label="Saved tenant details"><p className="font-semibold">Staying tenant: {tenant.name}</p><PhoneReveal phone={tenant.phone} label="Tenant phone"/><p>{tenant.people} people · Move-in: {tenant.moveInDate}</p>{tenant.address&&<p>Address: {tenant.address}</p>}{tenant.occupation&&<p>Occupation: {tenant.occupation}</p>}{tenant.emergencyContact&&<p>Emergency contact: {tenant.emergencyContact}</p>}{tenant.notes&&<p className="whitespace-pre-wrap">{tenant.notes}</p>}{tenant.documentId&&<button type="button" disabled={busy} className="text-blue-700 underline" onClick={()=>void download()}>{busy?'Loading…':'Download private citizenship copy'}</button>}{error&&<p role="alert" className="text-red-700">{error}</p>}</section>;
}
