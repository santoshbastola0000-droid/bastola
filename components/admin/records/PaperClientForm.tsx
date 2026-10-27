"use client";
import {useEffect,useState} from "react";
import {privateApi} from "@/http/api/privateApi";

const groups = [
  {title:"Permanent Contact Details",fields:[["fullName","Full Name"],["fatherName","Father name"],["phone","Phone #"],["email","Email"],["address","Address"],["documentNumber","Document number"],["documentIssueDate","Document issue date"],["familyContact","Family contact no."],["gender","Gender"]]},
  {title:"Room details",fields:[["roomCount","तपाईंलाई कति कोठा चाहिन्छ? (How many rooms do you need?)"],["preferredLocation","कुन लोकेसनमा कोठा खोज्दै हुनुहुन्छ? (Preferred location)"],["roomType","कोठा कुन किसिमको चाहिन्छ? (Single, double, suite, flat, etc.)"],["budget","तपाईंको बजेट कति हो? (Budget)"],["furnishing","फर्निचर सहितको कोठा चाहिन्छ कि खाली? (Furnished or unfurnished)"],["facilities","कुन विशेष सुविधा चाहिन्छ? (Parking, Wi-Fi, security)"],["floor","कुन फ्लोर वा दृश्य चाहिन्छ? (Floor / view preference)"],["moveInDate","कोठा कहिलेदेखि चाहिन्छ? (Move-in date)"],["pets","के तपाईं जनावर पाल्नुहुन्छ? (Pets)"],["advance","कति अग्रिम दिन सक्नुहुन्छ? (Advance payment ability)"],["people","कोठामा बस्ने व्यक्तिको संख्या (Number of people)"],["restrictions","के तपाईं कुनै किसिमको नशा गर्नुहुन्छ? (Smoking, alcohol, etc.)"],["other","अन्य आवश्यकताहरू (Other requirements)"]]},
  {title:"Payment Details",fields:[["paymentMethod","Payment method (eSewa / Cash / Bank transfer / Others)"],["paymentCode","Payment code"],["receiverName","Payment receiver name"],["receiverSignature","Payment receiver signature"],["paymentNumber","Payment number"],["authorizedSignature","Authorized Signature"],["clientSignature","Signature"]]}
] as const;
type Fields=Record<string,string>;
const initial=Object.fromEntries(groups.flatMap(g=>g.fields.map(([id])=>[id,""]))) as Fields;
const storageKey="roomkhoj-paper-form-draft";
export function PaperClientForm(){
 const [data,setData]=useState<Fields>(initial),[preview,setPreview]=useState(false);
 const [notice,setNotice]=useState("");
 useEffect(()=>{try{const saved=sessionStorage.getItem(storageKey);if(saved)setData({...initial,...JSON.parse(saved)});}catch{}},[]);
 const edit=(id:string,value:string)=>setData(old=>({...old,[id]:value}));
 const download=()=>{const blob=new Blob([JSON.stringify({version:1,values:data},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="roomkhoj-client-form.json";a.click();URL.revokeObjectURL(url);};
 const saveDraft=()=>{try{sessionStorage.setItem(storageKey,JSON.stringify(data));setNotice("Draft saved in this browser tab. This is not a database record.");}catch{setNotice("Could not save browser draft.");}};
 return <section className="rounded-xl border bg-white p-3 sm:p-5">
 <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-bold">RoomKhoj · Paper Client Form</h2><p className="text-xs text-slate-500">Same paper layout · A4 preview · existing client records are unchanged</p></div><div className="flex gap-2"><button type="button" className="rounded border px-3 py-2" onClick={()=>setPreview(!preview)}>{preview?"Edit form":"Preview form"}</button><button type="button" className="rounded border px-3 py-2" onClick={saveDraft}>Save draft</button><button type="button" className="rounded border px-3 py-2" onClick={download}>Export JSON</button><button type="button" className="rounded border px-3 py-2" onClick={()=>window.print()}>Print / Save PDF</button></div></div>
 {notice&&<p role="status" className="mb-3 text-sm text-emerald-700">{notice}</p>}
 <div id="roomkhoj-printable" className="mx-auto w-full max-w-[794px] bg-white px-3 py-5 text-slate-900 sm:px-9" style={{fontFamily:"Arial,sans-serif"}}>
 <header className="mb-5 border-b-2 border-slate-600 pb-3 text-center"><div className="text-3xl font-extrabold">Roomkhoj.com</div><div className="text-sm font-bold">Pokhara, Trade Mall 4th floor</div><div className="text-sm">Contact: 9765408817</div><div className="mt-2 text-right text-xs">Date: ______ / ______ / ______</div></header>
 {groups.map((group,index)=><div key={group.title} className="mb-5"><h3 className="mb-3 bg-slate-200 py-2 text-center text-sm font-bold">{group.title}</h3>{group.fields.map(([id,label])=><div key={id} className="mb-2 flex items-end gap-2 text-xs"><label htmlFor={"paper-"+id} className="shrink-0">{label}:</label>{preview?<span className="min-h-6 flex-1 border-b border-slate-500 px-2 font-semibold">{data[id]||" "}</span>:<input id={"paper-"+id} type="text" value={data[id]} onChange={e=>edit(id,e.target.value)} className="min-w-0 flex-1 rounded-none border-0 border-b border-slate-400 bg-transparent px-1 py-1 text-xs outline-none focus:border-blue-600"/>}</div>)}
 {index===2&&<div className="mt-3 space-y-3 text-xs"><p className="font-semibold">Our service charge is Rs. 1500, non-refundable if you cancel.</p><p>We will find only 3 rooms for you.</p><p className="border-t pt-2">३ वटा कोठा खोजिदिने सम्बन्धमा मैले रु १५०० सेवा शुल्क आफ्नो इच्छाले बुझाएको छु। सेवा रद्द गरेमा रकम फिर्ता नहुने सर्त पढेर बुझेको छु।</p><div className="flex justify-between gap-4 pt-6"><span>_________________<br/>Authorized Signature</span><span>_________________<br/>Signature</span></div></div>}
 </div>)}
 <p className="pt-4 text-center text-xs">RoomKhoj.com</p>
 </div>
 <style jsx global>{`@media print { body * {visibility:hidden!important;} #roomkhoj-printable, #roomkhoj-printable * {visibility:visible!important;} #roomkhoj-printable {position:absolute;left:0;top:0;width:210mm;max-width:none;padding:12mm;} @page {size:A4;margin:0;} }`}</style>
 </section>;
}
