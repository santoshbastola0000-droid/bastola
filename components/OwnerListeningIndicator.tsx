"use client";
export function OwnerListeningIndicator({speaking,levels,muted=false}:{speaking:boolean;levels:number[];muted?:boolean}){
  return <div><div className="flex items-center justify-center gap-3 rounded-xl border border-current/15 p-3">
    <div aria-hidden="true" className="flex h-8 items-center gap-1">
      {Array.from({length:7},(_,i)=><span key={i} className="w-1.5 rounded-full bg-emerald-500 transition-[height] duration-100 motion-reduce:transition-none" style={{height:muted?4:4+Math.round((levels[i]||0)*26)}}/>)}
    </div>
    <span role="status" className="text-sm">{muted?"Mic बन्द छ":speaking?"सुन्दैछु… आरामले कुरा पूरा गर्नुहोस्।":"तपाईंको कुरा सुन्न तयार छु।"}</span>
  </div><p className="mt-1 text-center text-xs opacity-60">सुन्ने संकेत मात्र हो; विवरण पुष्टि वा save भएको होइन।</p></div>;
}
