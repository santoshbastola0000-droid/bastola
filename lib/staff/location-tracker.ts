type Result = { autoCompleted?: boolean; [key: string]: any };
type Options = {
  geolocation: Pick<Geolocation, 'watchPosition' | 'clearWatch' | 'getCurrentPosition'>;
  send: (payload: {latitude:number;longitude:number;accuracy:number;capturedAt:string;source:string}, signal: AbortSignal) => Promise<Result>;
  onResult: (result: Result) => void;
  onError: (error: any) => void;
  now?: () => number;
  setInterval: (callback: () => void, ms: number) => number;
  clearInterval: (id: number) => void;
};

// One shift owns this instance. Disposed callbacks can neither send GPS nor update UI.
export function createStaffLocationTracker(o: Options) {
  let active=false,watch:number|null=null,timer:number|null=null,getting=false,sending=false,lastSent:number|null=null,lastAttempt:number|null=null;
  const controller=new AbortController(),now=o.now||Date.now;
  const stop=()=>{active=false;controller.abort();if(watch!==null)o.geolocation.clearWatch(watch);if(timer!==null)o.clearInterval(timer);watch=null;timer=null;};
  const error=(e:any)=>{if(!active)return;if([401,403].includes(e?.response?.status)||e?.code===1)stop();o.onError(e);};
  const sync=async(p:GeolocationPosition)=>{
    if(!active||sending||(lastSent!==null&&now()-lastSent<45000)||(lastAttempt!==null&&now()-lastAttempt<5000))return;
    const {latitude,longitude,accuracy}=p.coords;
    if(!Number.isFinite(p.timestamp)||Math.abs(now()-p.timestamp)>60000||!Number.isFinite(latitude)||latitude< -90||latitude>90||!Number.isFinite(longitude)||longitude< -180||longitude>180||!Number.isFinite(accuracy)||accuracy<0){error(new Error('Fresh valid GPS required'));return;}
    sending=true;lastAttempt=now();
    try{
      const r=await o.send({latitude,longitude,accuracy,capturedAt:new Date(p.timestamp).toISOString(),source:'AUTO'},controller.signal);
      if(!active)return;lastSent=now();if(r.autoCompleted)stop();o.onResult(r);
    }catch(e){error(e);}finally{sending=false;}
  };
  const resume=()=>{
    if(!active||getting||sending||(lastSent!==null&&now()-lastSent<45000))return;
    getting=true;
    try{o.geolocation.getCurrentPosition(p=>{getting=false;void sync(p);},e=>{getting=false;error(e);},{enableHighAccuracy:true,maximumAge:30000,timeout:20000});}catch(e){getting=false;error(e);}
  };
  return {
    start(){if(active||controller.signal.aborted)return;active=true;try{const id=o.geolocation.watchPosition(p=>void sync(p),error,{enableHighAccuracy:true,maximumAge:20000,timeout:20000});if(active)watch=id;else o.geolocation.clearWatch(id);if(active){timer=o.setInterval(resume,60000);resume();}}catch(e){stop();o.onError(e);}},
    stop,resume,
  };
}

export function staffWorkDate(now: Date = new Date(), timezone='Asia/Kathmandu'): string {
  const p=new Intl.DateTimeFormat('en-US',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const v=(t:string)=>p.find(x=>x.type===t)!.value;
  return `${v('year')}-${v('month')}-${v('day')}`;
}

export function staffWeekStart(now: Date = new Date()): string {
  const day=new Date(staffWorkDate(now)+'T12:00:00Z');
  day.setUTCDate(day.getUTCDate()-((day.getUTCDay()+6)%7));
  return day.toISOString().slice(0,10);
}
