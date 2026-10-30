export type OwnerCostReport = {
  id:string;model:string;durationSeconds:number;estimatedAiNpr:number|null;nprPerMinute:number|null;
  targetNprPerMinute:number;overTarget:boolean|null;responseCount:number;incomplete:boolean;
  source?:string;rateSource?:string;sttUsdPerMinute?:number;ttsUsdPerMinute?:number;
  ended:boolean;stale:boolean;usdToNpr:number;fxSource:string;pricesCheckedAt:string;
};
/** Forward only usage counters; never transcript, audio, token secrets, or full provider events. */
export function costUsageEvent(message:any) {
  if(message?.type==='input_audio_buffer.committed'&&typeof message.item_id==='string')return {type:'transcription_pending',responseId:message.item_id};
  if(message?.type==='conversation.item.input_audio_transcription.completed') {
    if(typeof message.item_id!=='string'||!message.usage)return {type:'missing'};
    const u=message.usage;
    return {type:'transcription',responseId:message.item_id,usage:{type:u.type,total_tokens:u.total_tokens,input_tokens:u.input_tokens,output_tokens:u.output_tokens}};
  }
  if(message?.type==='conversation.item.input_audio_transcription.failed')return {type:'missing'};
  if(message?.type!=='response.done')return null;
  const r=message.response,u=r?.usage;
  if(typeof r?.id!=='string'||!u)return {type:'missing'};
  const i=u.input_token_details,o=u.output_token_details,c=i?.cached_tokens_details;
  return {type:'usage',responseId:r.id,usage:{total_tokens:u.total_tokens,input_tokens:u.input_tokens,output_tokens:u.output_tokens,
    input_token_details:i?{text_tokens:i.text_tokens,audio_tokens:i.audio_tokens,image_tokens:i.image_tokens,cached_tokens:i.cached_tokens,
      cached_tokens_details:c?{text_tokens:c.text_tokens,audio_tokens:c.audio_tokens,image_tokens:c.image_tokens}:undefined}:undefined,
    output_token_details:o?{text_tokens:o.text_tokens,audio_tokens:o.audio_tokens}:undefined}};
}
export class OwnerCostReporter {
  private queue:Promise<void>=Promise.resolve();
  private ended=false;
  constructor(private send:(event:unknown)=>Promise<OwnerCostReport>,private show:(report:OwnerCostReport|null)=>void){}
  event(event:unknown) {
    this.queue=this.queue.then(async()=>{
      try {let report:OwnerCostReport;try{report=await this.send(event);}catch{report=await this.send(event);}this.show(report);}
      catch {this.show(null);}
    });
  }
  handle(message:unknown) {if(this.ended)return;const event=costUsageEvent(message);if(event)this.event(event);}
  start(){if(!this.ended)this.event({type:'started'});}
  end(){if(this.ended)return;this.ended=true;this.event({type:'ended'});}
}
