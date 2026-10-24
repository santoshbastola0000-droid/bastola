/** Local signal measurement only; no recording, upload, or audible monitor path. */
export function monitorMicrophone(stream:MediaStream,onSample:(voiced:boolean,levels:number[],now:number)=>void){
  let context:AudioContext|null=null;
  let source:MediaStreamAudioSourceNode|null=null;
  let timer:ReturnType<typeof setInterval>|null=null;
  let closed=false;
  try{
    context=new AudioContext();
    source=context.createMediaStreamSource(stream);
    const analyser=context.createAnalyser();analyser.fftSize=1024;source.connect(analyser);
    const data=new Float32Array(analyser.fftSize);
    let voiceUntil=0;
    timer=setInterval(()=>{
      if(closed||context?.state!=='running')return;
      analyser.getFloatTimeDomainData(data);
      let energy=0;for(const v of data)energy+=v*v;
      const rms=Math.sqrt(energy/data.length),now=performance.now();
      if(rms>0.018)voiceUntil=now+160;
      const levels=Array.from({length:7},(_,i)=>{
        let sum=0;const from=Math.floor(i*data.length/7),to=Math.floor((i+1)*data.length/7);
        for(let n=from;n<to;n++)sum+=data[n]*data[n];
        return Math.min(1,Math.sqrt(sum/(to-from))*14);
      });
      onSample(now<voiceUntil,levels,now);
    },80);
    void context.resume().catch(()=>undefined);
  }catch{/* VAD status still works when local metering is unsupported. */}
  return ()=>{closed=true;if(timer)clearInterval(timer);source?.disconnect();if(context)void context.close().catch(()=>undefined);};
}
