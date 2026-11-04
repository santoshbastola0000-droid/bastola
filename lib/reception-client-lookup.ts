import type {ReceptionClient} from '@/http/services/office.service';

export function normalizeClientLookupPhone(value:string):string|null {
 const normalized=value.trim().replace(/[०-९]/g,c=>String(c.charCodeAt(0)-0x0966));
 if(!normalized||!/^\+?[0-9\s().-]+$/.test(normalized))return null;
 let digits=normalized.replace(/[^0-9]/g,'');
 if(digits.startsWith('00977'))digits=digits.slice(5);
 else if(digits.length===13&&digits.startsWith('977'))digits=digits.slice(3);
 return /^9[0-9]{9}$/.test(digits)?digits:null;
}

/** Fetch every phone-search page before declaring an exact result or a miss. */
export async function findSavedClientsByPhone(
 phone:string,
 fetchPage:(query:string,page:number)=>Promise<{clients:ReceptionClient[];total:number}>,
 isCurrent:()=>boolean=()=>true
):Promise<ReceptionClient[]>{
 const digits=normalizeClientLookupPhone(phone);
 if(!digits)return [];
 const found=new Map<string,ReceptionClient>();
 for(let page=0;page<100;page++){
  if(!isCurrent())return [];
  const result=await fetchPage(digits,page);
  if(!isCurrent())return [];
  if(!Number.isInteger(result.total)||result.total<0||!Array.isArray(result.clients))
   throw new Error('Invalid saved-client search response');
  for(const client of result.clients)
   if(normalizeClientLookupPhone(client.phone)===digits)found.set(client.id,client);
  if((page+1)*20>=result.total)return [...found.values()];
  if(result.clients.length===0)throw new Error('Saved-client search incomplete');
 }
 throw new Error('Too many saved-client search pages; narrow the search');
}
