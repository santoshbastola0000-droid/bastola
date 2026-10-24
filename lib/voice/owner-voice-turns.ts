/** Serializes answers and sparse listening cues, only during a measured pause. */
export class OwnerVoiceTurns {
  private speaking=false;
  private busy=false;
  private playing=false;
  private pending=false;
  private usedCue=false;
  private startedAt=0;
  private lastCue=-Infinity;
  private cueIndex=0;
  private closed=false;
  private pauseAt:number|null=null;
  private localVoiced=true;
  private measured=false;
  private cue=false;
  private toolsPending=0;
  constructor(private readonly send:(event:Record<string,unknown>)=>void) {}
  greet(developer=false){this.create({instructions:developer
    ? 'Greet the administrator as RoomKhoj AI in Developer Mode and ask what speaking style or memory they want to teach. Do not ask about rental rooms.'
    : 'Use the configured Start introduction from the session instructions, including the RoomKhoj AI disclosure. Keep it brief, then wait for the owner.'});}
  feedback(){this.pending=true;this.pump();}
  holdTool(){if(!this.closed)this.toolsPending++;}
  releaseTool(reply=true){if(this.closed)return;this.toolsPending=Math.max(0,this.toolsPending-1);if(reply)this.pending=true;this.pump();}
  microphone(voiced:boolean,now:number){
    if(this.closed)return;
    this.measured=true;this.localVoiced=voiced;
    if(voiced){
      this.pauseAt=null;
      if(this.cue){
        this.cue=false;
        if(this.busy)this.send({type:'response.cancel'});
        this.send({type:'output_audio_buffer.clear'});
      }
    }else if(this.pauseAt===null)this.pauseAt=now;
  }
  handle(type:string,now:number){
    if(this.closed)return;
    if(type==='input_audio_buffer.speech_started'){
      this.speaking=true;this.pending=false;this.usedCue=false;this.startedAt=now;this.pauseAt=null;
      this.microphone(true,now);
    }else if(type==='input_audio_buffer.speech_stopped')this.speaking=false;
    else if(type==='input_audio_buffer.committed')this.pending=true;
    else if(type==='response.created')this.busy=true;
    else if(type==='response.done')this.busy=false;
    else if(type==='output_audio_buffer.started')this.playing=true;
    else if(type==='output_audio_buffer.stopped'||type==='output_audio_buffer.cleared'){this.playing=false;this.cue=false;}
    this.pump();
  }
  tick(now:number){
    if(this.closed||this.toolsPending||!this.speaking||this.pending||this.busy||this.playing||this.usedCue||
      !this.measured||this.localVoiced||this.pauseAt===null||now-this.pauseAt<450||now-this.pauseAt>1000||
      now-this.startedAt<7000||now-this.lastCue<14000)return;
    this.usedCue=true;this.lastCue=now;this.cue=true;
    const cue=['हजुर','अँ'][this.cueIndex++%2];
    this.create({conversation:'none',input:[],instructions:'During this brief pause say ONLY "'+cue+'" softly, then stop. This means listening only, never agreement, fact verification or saving. Do not answer, ask a question or finish the owner sentence.'});
  }
  private pump(){
    if(this.closed||this.toolsPending||!this.pending||this.speaking||this.busy||this.playing)return;
    this.pending=false;this.cue=false;this.create({});
  }
  private create(response:Record<string,unknown>){
    if(this.closed||this.busy)return;
    this.busy=true;this.send({type:'response.create',response:{output_modalities:['audio'],...response}});
  }
  stop(){this.closed=true;this.pending=false;this.pauseAt=null;}
}
