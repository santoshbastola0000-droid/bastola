export type RoomQA={question:string;answer:string};
const start='\n[Room Questions]\n';
const end='\n[/Room Questions]';
export function parseRoomQA(details:string):{plain:string;items:RoomQA[]}{
 const a=details.indexOf(start);if(a<0)return {plain:details,items:[]};
 const b=details.indexOf(end,a+start.length);if(b<0)return {plain:details,items:[]};
 let items:RoomQA[]=[];try{const raw=JSON.parse(details.slice(a+start.length,b));if(Array.isArray(raw))items=raw.filter(x=>typeof x?.question==='string'&&typeof x?.answer==='string').slice(0,30);}catch{}
 return {plain:details.slice(0,a)+details.slice(b+end.length),items};
}
export function composeRoomQA(plain:string,items:RoomQA[]):string{
 const valid=items.map(x=>({question:x.question.trim(),answer:x.answer.trim()})).filter(x=>x.question||x.answer).slice(0,30);
 return valid.length?plain+start+JSON.stringify(valid)+end:plain;
}
