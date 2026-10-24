import type { OwnerVoiceTurns } from './owner-voice-turns';
export type PublicMapPlace={placeId:string;name:string;address:string;mapsUrl:string;attributions?:{provider:string;providerUri:string}[]};
export type OwnerMapResult={available:boolean;reason:string;source?:string;note?:string;anchors?:PublicMapPlace[];nearby?:PublicMapPlace[]};
type ToolEvent={type?:string;name?:string;call_id?:string;arguments?:string;transcript?:string;item_id?:string;event_id?:string};

/** Map data remains a transient suggestion. Only real owner transcripts supply search context. */
export class OwnerMapLookup {
  private closed=false;
  private generation=0;
  private words:string[]=[];
  private seen=new Set<string>();
  private ownerEvents=new Set<string>();
  private aborts=new Set<AbortController>();
  private inFlight=false;
  private requests=0;
  constructor(private readonly coordinator:OwnerVoiceTurns,
    private readonly send:(event:Record<string,unknown>)=>void,
    private readonly request:(args:unknown,signal:AbortSignal)=>Promise<OwnerMapResult>,
    private readonly show:(result:OwnerMapResult)=>void) {}
  handle(event:ToolEvent) {
    if(this.closed)return;
    if(event.type==='input_audio_buffer.speech_started')this.generation++;
    if(event.type==='conversation.item.input_audio_transcription.completed'&&event.transcript) {
      const id=event.item_id||event.event_id;
      if(!id||!this.ownerEvents.has(id)) {
        if(id)this.ownerEvents.add(id);
        this.words.push(event.transcript.slice(0,2000));this.words=this.words.slice(-30);
      }
    }
    if(event.type!=='response.function_call_arguments.done'||event.name!=='lookup_owner_location'||!event.call_id||this.seen.has(event.call_id))return;
    this.seen.add(event.call_id);
    void this.lookup(event.call_id,event.arguments||'');
  }
  private async lookup(callId:string,raw:string) {
    const generation=this.generation;
    this.coordinator.holdTool();
    const abort=new AbortController();this.aborts.add(abort);
    const timer=setTimeout(()=>abort.abort(),10000);
    let result:OwnerMapResult={available:false,reason:'MAP_LOOKUP_UNAVAILABLE'};
    const allowed=!this.inFlight&&this.requests<2;
    if(allowed){this.inFlight=true;this.requests++;}
    try {
      if(allowed) {
        const args=JSON.parse(raw);
        result=await this.request({...args,ownerWords:this.words.join('\n').slice(-2000)},abort.signal);
      }else result={available:false,reason:'MAP_LOOKUP_LIMIT',note:'Two map lookups are enough. Stop location probing, keep owner wording, leave exact address unknown and finish politely.'};
    }catch { /* Keep conversation usable when maps or networking fail. */ }
    finally {clearTimeout(timer);this.aborts.delete(abort);if(allowed)this.inFlight=false;}
    if(this.closed)return;
    const stale=generation!==this.generation;
    if(!stale)this.show(result);
    this.send({type:'conversation.item.create',item:{type:'function_call_output',call_id:callId,output:JSON.stringify(stale?{available:false,reason:'OWNER_CONTINUED_SPEAKING',note:'This search was superseded. Listen to the latest owner answer; never use stale candidates.'}:result)}});
    this.coordinator.releaseTool(!stale);
  }
  stop(){this.closed=true;for(const a of this.aborts)a.abort();this.aborts.clear();this.words=[];this.seen.clear();this.ownerEvents.clear();}
}
