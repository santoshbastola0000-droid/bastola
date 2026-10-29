const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const filename=path.resolve(__dirname,"../lib/availability-list.ts");
const code=process.env.AVAILABILITY_LIST_COMPILED
 ?fs.readFileSync(process.env.AVAILABILITY_LIST_COMPILED,"utf8")
 :require("typescript").transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:1,target:9}}).outputText;
function load(get){
 const exports={};
 vm.runInNewContext(code,{exports,require:name=>{if(name==="@/http/api/api")return{api:{get}};throw Error("Unexpected import "+name);},Map,Set,Number,Boolean,Array,Promise,encodeURIComponent},{filename});
 return exports;
}
const room=(id,price=5000,type="Single")=>({id,price,status:"AVAILABLE",code:id,title:"Room",location:"Pokhara",details:"WiFi",matchProfile:{roomType:type}});
test("combines saved search, budget and room type",()=>{
 const api=load(()=>{});
 const found=api.filterAvailabilityRooms([room("one"),room("two",12000),room("three",4000,"Flat")],{search:"pokhara",maxRent:6000,roomType:"single"});
 assert.deepEqual(Array.from(found,x=>x.id),["one"]);
});
test("does not treat unconfirmed rent as a zero-price budget match",()=>{
 const api=load(()=>{});
 assert.equal(api.filterAvailabilityRooms([room("one",0)],{search:"",maxRent:5000,roomType:""}).length,0);
});
test("default list fetches only requested server page",async()=>{
 const calls=[];const api=load(async(url,config)=>{calls.push(config.params);return{data:{rooms:[room("one")],total:50}};});
 const result=await api.loadAvailabilityRooms({search:"",page:1,maxRent:0,roomType:""});
 assert.equal(calls.length,1);assert.equal(calls[0].page,1);assert.equal(result.total,50);
});
test("budget filters include matching rooms beyond the first page",async()=>{
 const api=load(async(url,config)=>({data:{rooms:config.params.page===0?Array.from({length:24},(_,i)=>room(String(i),15000)):[room("last",4000)],total:25}}));
 const result=await api.loadAvailabilityRooms({search:"",page:0,maxRent:5000,roomType:""});
 assert.equal(result.total,1);assert.equal(result.rooms[0].id,"last");
});
test("saved rooms are fetched across server pages and unavailable rooms are omitted",async()=>{
 const api=load(async url=>{if(url.endsWith("/expired"))throw{response:{status:404}};return{data:room(url.split("/").at(-1))};});
 const result=await api.loadAvailabilityRooms({search:"",page:0,savedIds:["outside-page","expired"],maxRent:0,roomType:""});
 assert.equal(result.total,1);assert.equal(result.rooms[0].id,"outside-page");
});
test("does not hide network errors as empty saved lists",async()=>{
 const api=load(async()=>{throw Error("network error");});
 await assert.rejects(api.loadAvailabilityRooms({search:"",page:0,savedIds:["one"],maxRent:0,roomType:""}),/network error/);
});
test("empty saved list needs no API requests",async()=>{
 const api=load(()=>{throw Error("Unexpected request");});
 const result=await api.loadAvailabilityRooms({search:"",page:0,savedIds:[],maxRent:0,roomType:""});
 assert.equal(result.total,0);
});
