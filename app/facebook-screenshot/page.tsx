"use client";
import { useState } from "react";
import { Menu, PlusSquare, Search, MessageCircle, Image as ImageIcon, ThumbsUp, MessageSquare, Share2, Home, Clapperboard, Users, Store, Bell, X, MoreHorizontal, Moon } from "lucide-react";

const stories = [
  {name:"Lion Keshab Paudel", caption:"Entry soon 2017 Ga 13 pa", bg:"linear-gradient(145deg,#262626,#777,#111)"},
  {name:"Prakash Puri",caption:"",bg:"linear-gradient(#9ed3e5 0%,#e8f7ff 45%,#668c4e 60%,#344b26)"},
  {name:"Rojkumar Ghising",caption:"WhatsApp 9707857375",bg:"linear-gradient(140deg,#88b8df,#454e55,#bc2727)"},
  {name:"Rajan",caption:"",bg:"linear-gradient(#94c6e8,#638d56)"}
];
export default function FacebookScreenshotPage(){
 const [hidden,setHidden]=useState<string[]>([]);
 const [tab,setTab]=useState("Home");
 return <main style={{background:"#fff",color:"#111",maxWidth:540,margin:"0 auto",minHeight:"100dvh",fontFamily:"Arial,Helvetica,sans-serif",paddingBottom:90}}>
 <div style={{height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",fontWeight:750,fontSize:25}}><span>9:09 ☾</span><span style={{fontSize:18}}>▮▮▮ ᯤ 🔋</span></div>
 <header style={{display:"flex",alignItems:"center",gap:17,padding:"13px 18px 23px"}}>
 <Menu size={31}/><strong style={{fontSize:38,letterSpacing:-2,color:"#0866ff",flex:1}}>facebook</strong><PlusSquare size={31}/><Search size={33}/><span style={{background:"#111",color:"white",borderRadius:"50%",padding:7,display:"grid"}}><MessageCircle size={20}/></span>
 </header>
 <section style={{display:"flex",alignItems:"center",gap:13,padding:"8px 20px 30px"}}><div style={{width:62,height:62,borderRadius:"50%",background:"linear-gradient(140deg,#162d3d,#789caa)"}}/><strong style={{flex:1,fontSize:20}}>What's on your mind?</strong><ImageIcon color="#777" size={30}/></section>
 <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 0 13px",scrollbarWidth:"none"}}>{stories.map((s,i)=><div key={s.name} style={{flex:"0 0 208px",height:370,position:"relative",borderRadius:17,overflow:"hidden",background:s.bg}}>
 <div style={{position:"absolute",top:15,left:13,width:50,height:50,borderRadius:"50%",border:"4px solid #0866ff",background:"#cad9d9"}}/>
 {s.caption&&<span style={{position:"absolute",top:i===0?56:192,left:10,background:"#ffffffdd",fontWeight:700,fontSize:15,padding:5,maxWidth:165,textAlign:"center"}}>{s.caption}</span>}
 <strong style={{position:"absolute",bottom:14,left:13,right:8,color:"white",fontSize:19,textShadow:"0 1px 5px #222"}}>{s.name}</strong></div>)}</div>
 <div style={{height:9,background:"#e5e5e5"}}/>
 {!hidden.includes("ronb")&&<article style={{padding:"18px 20px 14px",borderBottom:"3px solid #ddd"}}>
 <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{border:"2px solid #b72337",color:"#b72337",borderRadius:"50%",width:64,height:64,display:"grid",placeItems:"center",fontSize:13,fontWeight:800,textAlign:"center"}}>RONB</div><div style={{flex:1}}><strong style={{fontSize:20}}>Routine of Nepal banda</strong><div style={{color:"#777",marginTop:4}}>31m · 🌐</div></div><MoreHorizontal/><button aria-label="Hide post" onClick={()=>setHidden([...hidden,"ronb"])} style={{border:0,background:"none"}}><X size={28}/></button></div>
 <p style={{fontSize:19,fontWeight:700,lineHeight:1.5,margin:"19px 0 0"}}>गृह मन्त्रालयले आचरण उल्लंघन, अनुशासनहीन कार्य र संगठनको छविमा आँच पुर्‍याएको भन्दै सशस्त्र प्रहरीका एसआईडी वंशीराज दाहाललाई सेवाबाट हटाएको छ।</p><div style={{color:"#0866ff",fontWeight:700,fontSize:18}}>#News</div>
 <div style={{display:"flex",gap:35,alignItems:"center",color:"#777",marginTop:18,fontSize:17,fontWeight:700}}><span>♧ 5.9K</span><span>▢ 393</span><span>➤ 33</span><span style={{marginLeft:"auto",color:"#0866ff"}}>👍❤️</span></div></article>}
 {!hidden.includes("omega")&&<article style={{padding:"18px 20px"}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:65,height:65,borderRadius:"50%",background:"#050914",color:"#53a8ff",display:"grid",placeItems:"center",fontWeight:800}}>Ω</div><div style={{flex:1}}><strong style={{fontSize:20}}>Omega Digi Center</strong><div style={{color:"#777"}}>Ad · 🌐</div></div><MoreHorizontal/><button aria-label="Hide ad" onClick={()=>setHidden([...hidden,"omega"])} style={{border:0,background:"none"}}><X size={28}/></button></div><p style={{fontSize:18,fontWeight:700}}>🚀 Need a Website or Mobile App for Your Busines... <span style={{color:"#777"}}>See more</span></p><div style={{height:340,background:"linear-gradient(125deg,#a9a0c1,#d2b5aa,#737d9b)",borderRadius:3}}/></article>}
 <nav aria-label="Bottom navigation" style={{position:"fixed",bottom:15,left:"50%",transform:"translateX(-50%)",width:"min(calc(100% - 28px),510px)",background:"#fff",borderRadius:50,boxShadow:"0 0 10px #aaa",display:"flex",justifyContent:"space-around",alignItems:"center",padding:"10px 6px",zIndex:2}}>{[[Home,"Home"],[Clapperboard,"Reels"],[Users,"Friends"],[Store,"Marketplace"],[Bell,"Notifications"]].map(([Icon,name])=>{const C=Icon as typeof Home;return <button key={name as string} aria-label={name as string} onClick={()=>setTab(name as string)} style={{border:0,borderRadius:40,padding:"8px 13px",background:tab===name?"#e7f0ff":"transparent",color:tab===name?"#0866ff":"#111"}}><C size={30}/></button>})}<div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(#2a485b,#a0b2b9)"}}/></nav>
 </main>
}
