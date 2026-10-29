export type UiSound = "tap" | "saved" | "sent" | "received";
const KEY="roomkhoj:ui-sounds:v1";
let context:AudioContext|null=null,unlocked=false,lastPlayed=0;
export function soundsEnabled() {
  if(typeof window==="undefined")return false;
  try{return localStorage.getItem(KEY)!=="off";}catch{return true;}
}
export function setSoundsEnabled(enabled:boolean) {
  try{localStorage.setItem(KEY,enabled?"on":"off");}catch{}
  window.dispatchEvent(new Event("roomkhoj:sounds-changed"));
}
export function unlockSounds() {
  unlocked=true;
  if(!soundsEnabled())return;
  try{context ||= new AudioContext();if(context.state==="suspended")void context.resume().catch(()=>{});}catch{}
}
export function playUiSound(kind:UiSound="tap") {
  if(!unlocked||!soundsEnabled()||typeof window==="undefined")return;
  const now=Date.now();if(now-lastPlayed<100)return;lastPlayed=now;
  try {
    context ||= new AudioContext();
    if(context.state!=="running")return;
    const notes=kind==="sent"?[620,880]:kind==="received"?[880,660]:kind==="saved"?[740,990]:[500];
    notes.forEach((frequency,index)=>{
      const oscillator=context!.createOscillator(),gain=context!.createGain();
      const start=context!.currentTime+index*0.065;
      oscillator.type="sine";oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(0.035,start+0.008);gain.gain.exponentialRampToValueAtTime(0.0001,start+0.09);
      oscillator.connect(gain);gain.connect(context!.destination);oscillator.start(start);oscillator.stop(start+0.1);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    });
  }catch{}
}

const receivedIds=new Set<string>();
export function playIncomingMessageSound(id?:string) {
  if(!id||receivedIds.has(id))return;
  receivedIds.add(id);if(receivedIds.size>200)receivedIds.delete(receivedIds.values().next().value!);
  playUiSound("received");
}
