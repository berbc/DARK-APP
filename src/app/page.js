"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─── TOKENS ──────────────────────────────────────────────────
const BG="#1C1C1E",BG2="#232325",BG3="#2A2A2D",CARD="#2C2C2F";
const BOR="rgba(255,255,255,0.09)",BOR2="rgba(255,255,255,0.16)";
const TEXT="#F5F5F5",MUTED="#8A8A8E",HINT="#4A4A4E";
const ACCENT="#FBBF24",GREEN="#10B981",RED="#EF4444",BLUE="#60A5FA",PURP="#8B5CF6",ORANGE="#FB923C";
const card={background:CARD,border:`1px solid ${BOR}`,borderRadius:10,padding:18,marginBottom:10};
const lbl={color:MUTED,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:6,fontFamily:"'DM Sans'",display:"block"};
const inp={background:BG3,border:`1px solid ${BOR}`,borderRadius:6,color:TEXT,padding:"8px 12px",fontFamily:"'DM Sans'",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"};
const btnGold={background:ACCENT,color:"#111",border:"none",borderRadius:6,padding:"8px 18px",cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1};
const btnGhost={background:"transparent",color:MUTED,border:`1px solid ${BOR}`,borderRadius:6,padding:"8px 18px",cursor:"pointer",fontFamily:"'DM Sans'",fontSize:13};

// ─── CONSTANTS ───────────────────────────────────────────────
const TABS=["🏠 Dashboard","⚡ Focus OS","🎯 Metas","📅 Agenda","🎬 Canais Dark","◈ Clientes","💰 Finanças","📚 Biblioteca","🔥 Trending"];
const PIPELINE=["Roteiro","Locução","Geração de Imagens","Edição","Thumb e Título","Postagem"];
const PIPELINE_COLORS={"Roteiro":ACCENT,"Locução":BLUE,"Geração de Imagens":PURP,"Edição":RED,"Thumb e Título":ORANGE,"Postagem":GREEN};
const TASK_TYPES=["Roteiro","Gravação","Edição","Thumbnail","Revisão","Upload","Reunião","Pesquisa","Postagem"];
const SCRIPT_SECTIONS=["GANCHO","CONSTRUÇÃO","A VIRADA","DESENVOLVIMENTO","DESFECHO","CTA"];
const SECTION_COLORS={"GANCHO":"#F59E0B","CONSTRUÇÃO":ACCENT,"A VIRADA":BLUE,"DESENVOLVIMENTO":PURP,"DESFECHO":GREEN,"CTA":TEXT};
const CAMERA_ANGLES=["A","B","C","D","E","F"];
const ANGLE_LABELS={"A":"Céu fisheye de baixo","B":"Over shoulder","C":"Top-down aéreo","D":"Bottom-up contra sol","E":"Raso do solo","F":"Macro / close"};
const GOAL_HORIZONS=["curto","medio","longo"];
const GOAL_TYPE_LABELS={"videos_mes":"Vídeos/mês","seguidores":"Seguidores","adsense_mes":"AdSense/mês","faturamento_mes":"Faturamento/mês","clientes":"Nº de clientes","views_mes":"Views/mês","personalizada":"Personalizada"};
const YT_BENCH={cpm_br:8,views_per_video:5000,subs_per_1k:0.8};
const DEFAULT_NICHES=[{name:"Curiosidades Gerais",keyword:"curiosidades fatos incríveis",cpm:"$4–8",active:true},{name:"Psicologia & Comportamento",keyword:"psicologia comportamento humano",cpm:"$8–15",active:true},{name:"Mistério & Paranormal",keyword:"misterio paranormal sobrenatural",cpm:"$5–9",active:true},{name:"True Crime",keyword:"crime real investigação",cpm:"$6–11",active:true},{name:"História Sombria",keyword:"historia sombria chocante",cpm:"$7–13",active:true},{name:"Ciência Sombria",keyword:"ciencia sombria experimentos",cpm:"$8–14",active:true},{name:"Filosofia Existencial",keyword:"filosofia existencial vida",cpm:"$10–18",active:true},{name:"Lendas Urbanas BR",keyword:"lendas urbanas brasil",cpm:"$4–7",active:true}];

// ─── HELPERS ─────────────────────────────────────────────────
const toLocalDate=d=>{const dt=new Date(d);return`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;};
const today=()=>toLocalDate(new Date());
const thisMonth=()=>`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
const deadlineDiff=d=>{if(!d)return 999;const now=new Date();now.setHours(0,0,0,0);return Math.round((new Date(d+"T12:00:00")-now)/86400000);};
const deadlineColor=d=>{const df=deadlineDiff(d);if(df<0||df<=1)return RED;if(df<=3)return ACCENT;return GREEN;};
const deadlineLabel=d=>{if(!d)return"";const df=deadlineDiff(d);if(df<0)return`${Math.abs(df)}d atraso`;if(df===0)return"Hoje!";if(df===1)return"Amanhã";return`${df}d`;};
const fmtCurrency=v=>`R$ ${(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const fmtDate=d=>d?new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}):"—";
const taskScore=t=>({hot:100,warn:50,normal:10}[t.urgency||"normal"]+(10-Math.min(10,deadlineDiff(t.deadline)||10))*5-(t.estimated_hours||1));

const calcGoalPlan=(goal)=>{
  const now=new Date();
  const target=goal.target_date?new Date(goal.target_date+"T12:00:00"):new Date(now.getFullYear()+1,now.getMonth(),1);
  const monthsLeft=Math.max(1,Math.round((target-now)/(1000*60*60*24*30)));
  const current=goal.current_value||0;const target_val=goal.target_value||0;
  const remaining=Math.max(0,target_val-current);const perMonth=remaining/monthsLeft;
  const pct=Math.min(100,Math.round((current/Math.max(1,target_val))*100));
  const onTrack=monthsLeft>0?current>=(target_val*(1-monthsLeft/Math.max(1,monthsLeft+1)))*.85:pct>=100;
  const milestones=[];
  for(let i=1;i<=Math.min(monthsLeft,6);i++){
    const d=new Date(now.getFullYear(),now.getMonth()+i,1);
    milestones.push({month:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}),expected:Math.round(current+perMonth*i),actions:getGoalActions(goal,i,perMonth)});
  }
  return{monthsLeft,perMonth,onTrack,milestones,pct};
};
const getGoalActions=(goal,idx,perMonth)=>{
  const a=[];
  if(goal.type==="videos_mes"){a.push(`Publicar ${Math.ceil(perMonth)} vídeos este mês`);a.push(idx<=2?"Consistência acima da perfeição":"Replique os formatos que mais performam");}
  else if(goal.type==="seguidores"){const v=Math.ceil(perMonth/YT_BENCH.subs_per_1k*1000);a.push(`Meta de ${v.toLocaleString("pt-BR")} views`);a.push(`~${Math.ceil(v/YT_BENCH.views_per_video)} vídeos necessários`);if(idx===1)a.push("Otimize thumbnails para CTR > 4%");}
  else if(goal.type==="adsense_mes"){const v=Math.ceil(((goal.current_value||0)+perMonth)/YT_BENCH.cpm_br*1000);a.push(`${v.toLocaleString("pt-BR")} views/mês necessários`);a.push("Foque em Psicologia e Filosofia — CPM mais alto");}
  else if(goal.type==="faturamento_mes"){a.push(`R$ ${Math.ceil(perMonth).toLocaleString("pt-BR")} em novos contratos`);a.push(idx<=2?"Prospectar 5 leads novos":"Reajuste com clientes existentes");}
  else if(goal.type==="clientes"){a.push(`${Math.ceil(perMonth*10)/10} cliente(s) novo(s) este mês`);a.push("Follow-up em todos os leads abertos");}
  else{a.push(`Avançar ${Math.ceil(perMonth).toLocaleString("pt-BR")} unidades`);}
  return a;
};

// ─── MAIN ────────────────────────────────────────────────────
export default function DarkApp(){
  const [user,setUser]=useState(null);
  const [loginEmail,setLoginEmail]=useState("");
  const [loginPassword,setLoginPassword]=useState("");
  const [loginError,setLoginError]=useState("");
  const [loginLoading,setLoginLoading]=useState(false);
  const [checkingAuth,setCheckingAuth]=useState(true);
  const [clients,setClients]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [videos,setVideos]=useState([]);
  const [ideas,setIdeas]=useState([]);
  const [invoices,setInvoices]=useState([]);
  const [goals,setGoals]=useState([]);
  const [library,setLibrary]=useState([]);
  const [leads,setLeads]=useState([]);
  const [refChannels,setRefChannels]=useState([]);
  const [niches,setNiches]=useState([]);
  const [timeEntries,setTimeEntries]=useState([]);
  const [userStats,setUserStats]=useState({xp:0,level:1,streak:0,tasks_completed:0,pomodoros_completed:0});
  const [trendingData,setTrendingData]=useState({br:[],global:[],niches:{}});
  const [trendingPrev,setTrendingPrev]=useState({});
  const [trendingLoading,setTrendingLoading]=useState(false);
  const [lastUpdated,setLastUpdated]=useState(null);
  const [channelVideos,setChannelVideos]=useState({});
  const [channelLoading,setChannelLoading]=useState(null);
  const [loading,setLoading]=useState(true);
  const [activeTab,setActiveTab]=useState(0);
  const [saved,setSaved]=useState(false);
  const [errorMsg,setErrorMsg]=useState("");
  const [confetti,setConfetti]=useState(false);
  const [quickCapture,setQuickCapture]=useState(false);
  const [quickText,setQuickText]=useState("");
  const [quickDest,setQuickDest]=useState("idea");
  const [weekOffset,setWeekOffset]=useState(0);
  const [dashIdeaInput,setDashIdeaInput]=useState("");
  const [darkIdeaInput,setDarkIdeaInput]=useState("");
  const [focusTaskId,setFocusTaskId]=useState(null);
  const [timerRunning,setTimerRunning]=useState(false);
  const [timerSeconds,setTimerSeconds]=useState(25*60);
  const [timerMode,setTimerMode]=useState("work");
  const [activeEntry,setActiveEntry]=useState(null);
  const timerRef=useRef(null);
  const [videoDetailModal,setVideoDetailModal]=useState(null);
  const [scriptModal,setScriptModal]=useState(false);
  const [scriptData,setScriptData]=useState(null);
  const [scriptTakes,setScriptTakes]=useState([]);
  const [pipelineFilter,setPipelineFilter]=useState("todos");
  const [darkSection,setDarkSection]=useState("pipeline");
  const [useAsBaseModal,setUseAsBaseModal]=useState(null);
  const [clientModal,setClientModal]=useState(false);
  const [clientEdit,setClientEdit]=useState(null);
  const [selectedClient,setSelectedClient]=useState(null);
  const [taskModal,setTaskModal]=useState(false);
  const [taskEdit,setTaskEdit]=useState(null);
  const [approvalModal,setApprovalModal]=useState(null);
  const [invoiceModal,setInvoiceModal]=useState(false);
  const [invoiceEdit,setInvoiceEdit]=useState(null);
  const [invoiceFilter,setInvoiceFilter]=useState("todos");
  const [invoicePeriod,setInvoicePeriod]=useState("mensal");
  const [invoiceYear,setInvoiceYear]=useState(new Date().getFullYear());
  const [invoiceMonth,setInvoiceMonth]=useState(new Date().getMonth()+1);
  const [libModal,setLibModal]=useState(false);
  const [libEdit,setLibEdit]=useState(null);
  const [libFilter,setLibFilter]=useState("todos");
  const [libSearch,setLibSearch]=useState("");
  const [goalModal,setGoalModal]=useState(false);
  const [goalEdit,setGoalEdit]=useState(null);
  const [goalHorizon,setGoalHorizon]=useState("curto");
  const [selectedGoal,setSelectedGoal]=useState(null);
  const [leadModal,setLeadModal]=useState(false);
  const [leadEdit,setLeadEdit]=useState(null);
  const [ideaModal,setIdeaModal]=useState(false);
  const [ideaEdit,setIdeaEdit]=useState(null);
  const [trendingTab,setTrendingTab]=useState("brasil");
  const [refChannelModal,setRefChannelModal]=useState(false);
  const [refChannelEdit,setRefChannelEdit]=useState(null);
  const [nicheModal,setNicheModal]=useState(false);
  const [nicheEdit,setNicheEdit]=useState(null);

  const flash=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const flashError=m=>{setErrorMsg(m);setTimeout(()=>setErrorMsg(""),4000);};
  const triggerConfetti=()=>{setConfetti(true);setTimeout(()=>setConfetti(false),2500);};

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user??null);setCheckingAuth(false);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>setUser(s?.user??null));
    return()=>subscription.unsubscribe();
  },[]);
  const login=async()=>{setLoginLoading(true);setLoginError("");const{error}=await supabase.auth.signInWithPassword({email:loginEmail,password:loginPassword});if(error)setLoginError(error.message);setLoginLoading(false);};
  const logout=async()=>supabase.auth.signOut();

  const loadAll=useCallback(async()=>{
    setLoading(true);
    try{
      const[cl,tk,vi,id,inv,go,lib,us,ld,rc,te,ni]=await Promise.all([
        supabase.from("clients").select("*").eq("active",true).order("name"),
        supabase.from("tasks").select("*").order("deadline",{ascending:true,nullsLast:true}),
        supabase.from("videos").select("*").order("created_at",{ascending:false}),
        supabase.from("ideas").select("*").order("created_at",{ascending:false}),
        supabase.from("invoices").select("*").order("due_date"),
        supabase.from("goals").select("*").order("created_at",{ascending:false}),
        supabase.from("library").select("*").order("score",{ascending:false}),
        supabase.from("user_stats").select("*").limit(1),
        supabase.from("leads").select("*").order("follow_up_date",{ascending:true,nullsLast:true}),
        supabase.from("ref_channels").select("*").order("niche,name"),
        supabase.from("time_entries").select("*").order("started_at",{ascending:false}),
        supabase.from("niches").select("*").order("sort_order,name"),
      ]);
      if(cl.data)setClients(cl.data);
      if(tk.data)setTasks(tk.data);
      if(vi.data)setVideos(vi.data);
      if(id.data)setIdeas(id.data);
      if(inv.data)setInvoices(inv.data);
      if(go.data)setGoals(go.data);
      if(lib.data)setLibrary(lib.data);
      if(ld.data)setLeads(ld.data);
      if(rc.data)setRefChannels(rc.data);
      if(te.data)setTimeEntries(te.data);
      if(us.data?.[0])setUserStats(us.data[0]);
      else{const{data:ns}=await supabase.from("user_stats").insert({xp:0,level:1,streak:0,tasks_completed:0,pomodoros_completed:0,last_active:today()}).select().single();if(ns)setUserStats(ns);}
      if(ni.data&&ni.data.length>0)setNiches(ni.data);
      else{
        const{data:inserted}=await supabase.from("niches").insert(DEFAULT_NICHES.map((n,i)=>({...n,sort_order:i}))).select();
        if(inserted)setNiches(inserted);else setNiches(DEFAULT_NICHES.map((n,i)=>({...n,id:i,sort_order:i})));
      }
    }catch(e){flashError("Erro ao carregar dados");}
    setLoading(false);
  },[]);
  useEffect(()=>{if(user)loadAll();},[user,loadAll]);

  const activeNiches=niches.filter(n=>n.active!==false);

  const fetchTrending=useCallback(async()=>{
    const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if(!apiKey)return;
    setTrendingLoading(true);
    try{
      const prev={...trendingPrev};
      const mapV=(v)=>({id:v.id,title:v.snippet?.title,channel:v.snippet?.channelTitle,thumb:v.snippet?.thumbnails?.medium?.url,views:parseInt(v.statistics?.viewCount||0),url:`https://youtube.com/watch?v=${v.id}`,growth:prev[v.id]?Math.round(((parseInt(v.statistics?.viewCount||0)-prev[v.id])/Math.max(1,prev[v.id]))*100):0});
      const fetchRegion=async(region)=>{const r=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&maxResults=15&key=${apiKey}`);const d=await r.json();return(d.items||[]).filter(v=>![10].includes(parseInt(v.snippet?.categoryId))).map(mapV);};
      const fetchNiche=async(kw)=>{const r=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(kw)}&type=video&order=viewCount&regionCode=BR&maxResults=8&key=${apiKey}`);const d=await r.json();const ids=(d.items||[]).map(i=>i.id?.videoId).filter(Boolean).join(",");if(!ids)return[];const s=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${apiKey}`);const sd=await s.json();return(sd.items||[]).map(mapV);};
      const[br,gl,...nr]=await Promise.all([fetchRegion("BR"),fetchRegion("US"),...activeNiches.map(n=>fetchNiche(n.keyword||n.name))]);
      const newPrev={};[...br,...gl,...nr.flat()].forEach(v=>{newPrev[v.id]=v.views;});
      setTrendingPrev(newPrev);
      const nm={};activeNiches.forEach((n,i)=>{nm[n.name]=nr[i]||[];});
      setTrendingData({br,global:gl,niches:nm});
      setLastUpdated(new Date());
    }catch(e){flashError("Erro ao buscar trending");}
    setTrendingLoading(false);
  },[trendingPrev,activeNiches]);

  const fetchChannelVideos=async(ch)=>{
    const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if(!apiKey||!ch.channel_id||channelVideos[ch.id])return;
    setChannelLoading(ch.id);
    try{
      const r=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ch.channel_id}&order=viewCount&maxResults=10&type=video&key=${apiKey}`);
      const d=await r.json();const ids=(d.items||[]).map(i=>i.id?.videoId).filter(Boolean).join(",");
      if(!ids){setChannelLoading(null);return;}
      const s=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${apiKey}`);
      const sd=await s.json();
      setChannelVideos(prev=>({...prev,[ch.id]:(sd.items||[]).map(v=>({id:v.id,title:v.snippet?.title,channel:v.snippet?.channelTitle,thumb:v.snippet?.thumbnails?.medium?.url,views:parseInt(v.statistics?.viewCount||0),url:`https://youtube.com/watch?v=${v.id}`})).sort((a,b)=>b.views-a.views)}));
    }catch(e){flashError("Erro ao buscar vídeos");}
    setChannelLoading(null);
  };

  useEffect(()=>{
    if(timerRunning){timerRef.current=setInterval(()=>{setTimerSeconds(s=>{if(s<=1){clearInterval(timerRef.current);setTimerRunning(false);handleTimerEnd();return timerMode==="work"?5*60:25*60;}return s-1;});},1000);}
    else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[timerRunning]);

  const handleTimerEnd=async()=>{
    if(timerMode==="work"){triggerConfetti();const ns={...userStats,xp:(userStats.xp||0)+25,pomodoros_completed:(userStats.pomodoros_completed||0)+1};setUserStats(ns);if(userStats.id)await supabase.from("user_stats").update(ns).eq("id",userStats.id);setTimerMode("break");}
    else{setTimerMode("work");setTimerSeconds(25*60);}
  };
  const startTimer=async(taskId)=>{
    if(activeEntry)await stopTimeEntry();
    setFocusTaskId(taskId);setTimerRunning(true);setTimerSeconds(25*60);setTimerMode("work");
    const task=tasks.find(t=>t.id===taskId);if(!task)return;
    const{data}=await supabase.from("time_entries").insert({task_id:taskId,client_id:task.client_id,started_at:new Date().toISOString()}).select().single();
    if(data)setActiveEntry(data);
  };
  const stopTimeEntry=async()=>{
    if(!activeEntry)return;
    const now=new Date();const mins=Math.round((now-new Date(activeEntry.started_at))/60000);
    await supabase.from("time_entries").update({ended_at:now.toISOString(),duration_minutes:mins}).eq("id",activeEntry.id);
    setActiveEntry(null);setTimerRunning(false);
  };
  const completeTask=async(taskId)=>{
    await stopTimeEntry();
    const{data}=await supabase.from("tasks").update({done:true,done_at:new Date().toISOString()}).eq("id",taskId).select().single();
    if(data){setTasks(prev=>prev.map(t=>t.id===taskId?data:t));triggerConfetti();const ns={...userStats,xp:(userStats.xp||0)+50,tasks_completed:(userStats.tasks_completed||0)+1};setUserStats(ns);if(userStats.id)await supabase.from("user_stats").update(ns).eq("id",userStats.id);setFocusTaskId(null);flash();}
  };
  const saveQuickCapture=async()=>{
    if(!quickText.trim())return;
    if(quickDest==="idea"){const{data}=await supabase.from("ideas").insert({title:quickText.trim(),source:"quick"}).select().single();if(data)setIdeas(prev=>[data,...prev]);}
    else{const{data}=await supabase.from("tasks").insert({title:quickText.trim(),urgency:"normal",estimated_hours:1}).select().single();if(data)setTasks(prev=>[data,...prev]);}
    setQuickText("");setQuickCapture(false);flash();
  };
  const saveTask=async()=>{
    if(!taskEdit?.title?.trim())return;
    let data;
    if(taskEdit.id){const r=await supabase.from("tasks").update(taskEdit).eq("id",taskEdit.id).select().single();data=r.data;if(data)setTasks(prev=>prev.map(t=>t.id===data.id?data:t));}
    else{const r=await supabase.from("tasks").insert(taskEdit).select().single();data=r.data;if(data)setTasks(prev=>[data,...prev].sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999")));}
    setTaskModal(false);setTaskEdit(null);flash();
  };
  const deleteTask=async(id)=>{await supabase.from("tasks").delete().eq("id",id);setTasks(prev=>prev.filter(t=>t.id!==id));};
  const duplicateTask=async(t)=>{const{id,created_at,done_at,...rest}=t;const{data}=await supabase.from("tasks").insert({...rest,done:false,title:rest.title+" (cópia)"}).select().single();if(data)setTasks(prev=>[...prev,data].sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999")));flash();};
  const saveClient=async()=>{
    if(!clientEdit?.name?.trim())return;let data;
    if(clientEdit.id){const r=await supabase.from("clients").update(clientEdit).eq("id",clientEdit.id).select().single();data=r.data;if(data)setClients(prev=>prev.map(c=>c.id===data.id?data:c));}
    else{const r=await supabase.from("clients").insert({...clientEdit,active:true}).select().single();data=r.data;if(data)setClients(prev=>[...prev,data]);}
    setClientModal(false);setClientEdit(null);flash();
  };
  const deleteClient=async(id)=>{if(!confirm("Excluir cliente?"))return;await supabase.from("clients").update({active:false}).eq("id",id);setClients(prev=>prev.filter(c=>c.id!==id));};
  const getClientStats=(cId)=>{
    const cTasks=tasks.filter(t=>t.client_id===cId);
    const cEntries=timeEntries.filter(e=>e.client_id===cId);
    const hoursWorked=cEntries.reduce((s,e)=>s+(e.duration_minutes||0),0)/60;
    const client=clients.find(c=>c.id===cId);
    const contractValue=client?.contract_value||0;
    const realHourlyRate=hoursWorked>0&&contractValue>0?contractValue/hoursWorked:0;
    return{hoursWorked:Math.round(hoursWorked*10)/10,contractValue,realHourlyRate:Math.round(realHourlyRate),idealHourlyRate:client?.rate_per_hour||0,pendingTasks:cTasks.filter(t=>!t.done).sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999")),doneTasks:cTasks.filter(t=>t.done).length};
  };
  const saveVideoDetail=async(vd)=>{
    if(!vd?.id)return;
    const{data}=await supabase.from("videos").update({title:vd.title,niche:vd.niche,status:vd.status,publish_date:vd.publish_date||null,platforms:vd.platforms||[],meu_titulo:vd.meu_titulo||"",minha_thumbnail:vd.minha_thumbnail||"",transcricao:vd.transcricao||"",meu_roteiro:vd.meu_roteiro||"",descricao_yt:vd.descricao_yt||"",drive_locuçao:vd.drive_locuçao||"",hook:vd.hook||"",notes:vd.notes||"",ref_titulo:vd.ref_titulo||"",ref_thumb:vd.ref_thumb||"",ref_url:vd.ref_url||"",ref_canal:vd.ref_canal||"",ref_views:vd.ref_views||0}).eq("id",vd.id).select().single();
    if(data){setVideos(prev=>prev.map(v=>v.id===data.id?data:v));setVideoDetailModal(data);flash();}
  };
  const createVideo=async(initial)=>{
    const dc=clients.find(c=>c.name==="Canais Dark");
    const{data}=await supabase.from("videos").insert({title:initial?.title||"Novo Vídeo",niche:initial?.niche||activeNiches[0]?.name||"Curiosidades",status:"Roteiro",client_id:dc?.id,...(initial||{})}).select().single();
    if(data){setVideos(prev=>[data,...prev]);setVideoDetailModal(data);}
  };
  const deleteVideo=async(id)=>{if(!confirm("Excluir?"))return;await supabase.from("videos").delete().eq("id",id);setVideos(prev=>prev.filter(v=>v.id!==id));setVideoDetailModal(null);};
  const moveVideo=async(id,status)=>{const{data}=await supabase.from("videos").update({status}).eq("id",id).select().single();if(data)setVideos(prev=>prev.map(v=>v.id===data.id?data:v));};
  const useVideoAsBase=async(rv,niche)=>{
    const dc=clients.find(c=>c.name==="Canais Dark");
    const{data}=await supabase.from("videos").insert({title:rv.title,niche:niche||activeNiches[0]?.name||"Curiosidades",status:"Roteiro",client_id:dc?.id,ref_titulo:rv.title,ref_thumb:rv.thumb,ref_url:rv.url,ref_canal:rv.channel,ref_views:rv.views||0}).select().single();
    if(data){setVideos(prev=>[data,...prev]);setVideoDetailModal(data);setUseAsBaseModal(null);flash();}
  };
  const openScript=v=>{setScriptData({...v});const takes=v.script?JSON.parse(v.script||"[]"):[];setScriptTakes(takes.length?takes:[{id:Date.now(),section:"GANCHO",startTime:"00:00",endTime:"00:07",angle:"A",narration:"",visual:"",prompt:""}]);setScriptModal(true);};
  const updateTake=(id,f,val)=>setScriptTakes(prev=>prev.map(t=>t.id===id?{...t,[f]:val}:t));
  const deleteTake=id=>setScriptTakes(prev=>prev.filter(t=>t.id!==id));
  const saveScript=async()=>{if(!scriptData)return;const{data}=await supabase.from("videos").update({script:JSON.stringify(scriptTakes)}).eq("id",scriptData.id).select().single();if(data){setVideos(prev=>prev.map(v=>v.id===data.id?data:v));flash();}};
  const saveInvoice=async()=>{
    if(!invoiceEdit?.amount||!invoiceEdit?.client_id)return;let data;
    if(invoiceEdit.id){const r=await supabase.from("invoices").update(invoiceEdit).eq("id",invoiceEdit.id).select().single();data=r.data;if(data)setInvoices(prev=>prev.map(i=>i.id===data.id?data:i));}
    else{const r=await supabase.from("invoices").insert(invoiceEdit).select().single();data=r.data;if(data)setInvoices(prev=>[...prev,data]);}
    setInvoiceModal(false);setInvoiceEdit(null);flash();
  };
  const deleteInvoice=async(id)=>{await supabase.from("invoices").delete().eq("id",id);setInvoices(prev=>prev.filter(i=>i.id!==id));};
  const markInvoicePaid=async(id)=>{const{data}=await supabase.from("invoices").update({status:"pago",paid_date:today()}).eq("id",id).select().single();if(data)setInvoices(prev=>prev.map(i=>i.id===data.id?data:i));flash();};
  const duplicateInvoice=(inv)=>{const{id,created_at,paid_date,...rest}=inv;setInvoiceEdit({...rest,status:"pendente",issued_date:today(),due_date:today(),number:(rest.number||"")+" (cópia)"});setInvoiceModal(true);};
  const saveLib=async()=>{
    if(!libEdit?.content?.trim())return;let data;
    if(libEdit.id){const r=await supabase.from("library").update(libEdit).eq("id",libEdit.id).select().single();data=r.data;if(data)setLibrary(prev=>prev.map(l=>l.id===data.id?data:l));}
    else{const r=await supabase.from("library").insert(libEdit).select().single();data=r.data;if(data)setLibrary(prev=>[data,...prev]);}
    setLibModal(false);setLibEdit(null);flash();
  };
  const deleteLib=async(id)=>{await supabase.from("library").delete().eq("id",id);setLibrary(prev=>prev.filter(l=>l.id!==id));};
  const saveGoal=async()=>{
    if(!goalEdit?.title?.trim())return;let data;
    if(goalEdit.id){const r=await supabase.from("goals").update(goalEdit).eq("id",goalEdit.id).select().single();data=r.data;if(data)setGoals(prev=>prev.map(g=>g.id===data.id?data:g));}
    else{const r=await supabase.from("goals").insert(goalEdit).select().single();data=r.data;if(data)setGoals(prev=>[data,...prev]);}
    setGoalModal(false);setGoalEdit(null);flash();
  };
  const deleteGoal=async(id)=>{await supabase.from("goals").delete().eq("id",id);setGoals(prev=>prev.filter(g=>g.id!==id));};
  const updateGoalProgress=async(id,val)=>{const{data}=await supabase.from("goals").update({current_value:val}).eq("id",id).select().single();if(data)setGoals(prev=>prev.map(g=>g.id===data.id?data:g));flash();};
  const saveLead=async()=>{
    if(!leadEdit?.name?.trim())return;let data;
    if(leadEdit.id){const r=await supabase.from("leads").update(leadEdit).eq("id",leadEdit.id).select().single();data=r.data;if(data)setLeads(prev=>prev.map(l=>l.id===data.id?data:l));}
    else{const r=await supabase.from("leads").insert(leadEdit).select().single();data=r.data;if(data)setLeads(prev=>[data,...prev]);}
    setLeadModal(false);setLeadEdit(null);flash();
  };
  const deleteLead=async(id)=>{await supabase.from("leads").delete().eq("id",id);setLeads(prev=>prev.filter(l=>l.id!==id));};
  const convertLead=async(lead)=>{const{data}=await supabase.from("clients").insert({name:lead.name,color:ACCENT,type:"YouTube",frequency:"",rate_per_hour:0,active:true,notes:lead.notes||""}).select().single();if(data){setClients(prev=>[...prev,data]);await supabase.from("leads").update({converted:true,client_id:data.id}).eq("id",lead.id);setLeads(prev=>prev.map(l=>l.id===lead.id?{...l,converted:true}:l));flash();}};
  const saveIdeaEdit=async()=>{
    if(!ideaEdit?.title?.trim())return;let data;
    if(ideaEdit.id){const r=await supabase.from("ideas").update(ideaEdit).eq("id",ideaEdit.id).select().single();data=r.data;if(data)setIdeas(prev=>prev.map(i=>i.id===data.id?data:i));}
    else{const r=await supabase.from("ideas").insert(ideaEdit).select().single();data=r.data;if(data)setIdeas(prev=>[data,...prev]);}
    setIdeaModal(false);setIdeaEdit(null);flash();
  };
  const saveQuickIdea=async(title)=>{const{data}=await supabase.from("ideas").insert({title,source:"quick"}).select().single();if(data)setIdeas(prev=>[data,...prev]);flash();};
  const deleteIdea=async(id)=>{await supabase.from("ideas").delete().eq("id",id);setIdeas(prev=>prev.filter(i=>i.id!==id));};
  const useIdeaAsVideo=async(idea)=>{const dc=clients.find(c=>c.name==="Canais Dark");const{data}=await supabase.from("videos").insert({title:idea.title,niche:idea.niche||activeNiches[0]?.name||"Curiosidades",status:"Roteiro",client_id:dc?.id,notes:idea.description||""}).select().single();if(data){setVideos(prev=>[data,...prev]);await supabase.from("ideas").update({used:true}).eq("id",idea.id);setIdeas(prev=>prev.map(i=>i.id===idea.id?{...i,used:true}:i));setVideoDetailModal(data);flash();}};
  const saveRefChannel=async()=>{
    if(!refChannelEdit?.name?.trim())return;let data;
    if(refChannelEdit.id){const r=await supabase.from("ref_channels").update(refChannelEdit).eq("id",refChannelEdit.id).select().single();data=r.data;if(data)setRefChannels(prev=>prev.map(c=>c.id===data.id?data:c));}
    else{const r=await supabase.from("ref_channels").insert(refChannelEdit).select().single();data=r.data;if(data)setRefChannels(prev=>[...prev,data]);}
    setRefChannelModal(false);setRefChannelEdit(null);flash();
  };
  const deleteRefChannel=async(id)=>{await supabase.from("ref_channels").delete().eq("id",id);setRefChannels(prev=>prev.filter(c=>c.id!==id));};
  const saveNiche=async()=>{
    if(!nicheEdit?.name?.trim())return;let data;
    if(nicheEdit.id){const r=await supabase.from("niches").update(nicheEdit).eq("id",nicheEdit.id).select().single();data=r.data;if(data)setNiches(prev=>prev.map(n=>n.id===data.id?data:n));}
    else{const r=await supabase.from("niches").insert({...nicheEdit,active:true,sort_order:niches.length}).select().single();data=r.data;if(data)setNiches(prev=>[...prev,data]);}
    setNicheModal(false);setNicheEdit(null);flash();
  };
  const deleteNiche=async(id)=>{await supabase.from("niches").delete().eq("id",id);setNiches(prev=>prev.filter(n=>n.id!==id));};
  const toggleNicheActive=async(n)=>{const{data}=await supabase.from("niches").update({active:!n.active}).eq("id",n.id).select().single();if(data)setNiches(prev=>prev.map(x=>x.id===data.id?data:x));};

  // ─── COMPUTED ──────────────────────────────────────────────
  const pendingTasks=tasks.filter(t=>!t.done).sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999"));
  const thisMonthKey=thisMonth();
  const getInvoicesByPeriod=()=>{
    if(invoicePeriod==="anual")return invoices.filter(i=>i.issued_date?.startsWith(String(invoiceYear)));
    return invoices.filter(i=>{const d=i.issued_date||"";return d.startsWith(`${invoiceYear}-${String(invoiceMonth).padStart(2,"0")}`)});
  };
  const periodInvoices=getInvoicesByPeriod();
  const totalEmitido=periodInvoices.reduce((s,i)=>s+(i.amount||0),0);
  const totalRecebido=periodInvoices.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0);
  const totalPendente=periodInvoices.filter(i=>i.status==="pendente").reduce((s,i)=>s+(i.amount||0),0);
  const totalVencido=invoices.filter(i=>i.status==="vencido"||(i.status==="pendente"&&deadlineDiff(i.due_date)<0)).reduce((s,i)=>s+(i.amount||0),0);
  const vencendoBreve=invoices.filter(i=>i.status==="pendente"&&deadlineDiff(i.due_date)<=3&&deadlineDiff(i.due_date)>=0);
  const getClientColor=cId=>{const c=clients.find(c=>c.id===cId);return c?.color||ACCENT;};
  const getClientName=cId=>clients.find(c=>c.id===cId)?.name||"—";
  const timerFmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const getWeekDates=(offset=0)=>{const days=["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];const now=new Date();const dow=now.getDay();const mon=new Date(now);mon.setDate(now.getDate()-(dow===0?6:dow-1)+offset*7);mon.setHours(0,0,0,0);return Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return{date:toLocalDate(d),label:days[i]};});};
  const overdueLeads=leads.filter(l=>!l.converted&&l.follow_up_date&&deadlineDiff(l.follow_up_date)<=0);
  const activeGoals=goals.filter(g=>!g.completed);

  // ─── MONTHS ARRAY ──────────────────────────────────────────
  const MONTHS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const YEARS=[new Date().getFullYear()-1,new Date().getFullYear(),new Date().getFullYear()+1];

  if(checkingAuth)return<div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:ACCENT,fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:3}}>CARREGANDO...</div></div>;

  if(!user)return(
    <div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{background:CARD,border:`1px solid ${BOR2}`,borderRadius:14,padding:40,width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}><div style={{fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:4,color:TEXT}}>DARK APP</div><div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,letterSpacing:2}}>PRODUCTION · FOCUS · FINANCE</div></div>
        <div style={{marginBottom:14}}><span style={lbl}>Email</span><input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type="email" placeholder="seu@email.com" style={inp}/></div>
        <div style={{marginBottom:24}}><span style={lbl}>Senha</span><input value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type="password" placeholder="••••••••" style={inp}/></div>
        {loginError&&<div style={{color:RED,fontSize:12,marginBottom:12,fontFamily:"'DM Sans'"}}>{loginError}</div>}
        <button onClick={login} disabled={loginLoading} style={{...btnGold,width:"100%",opacity:loginLoading?.7:1}}>{loginLoading?"ENTRANDO...":"ENTRAR"}</button>
      </div>
    </div>
  );

  return(
    <div style={{background:BG,minHeight:"100vh",color:TEXT}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#3A3A3E;border-radius:2px}.hr:hover{background:${SURF2||"#323235"}!important}.hc:hover{transform:translateY(-1px);border-color:${BOR2}!important}input:focus,textarea:focus,select:focus{border-color:${ACCENT}!important;outline:none}textarea{resize:vertical}`}</style>

      {/* HEADER */}
      <div style={{background:BG2,borderBottom:`1px solid ${BOR}`,padding:"0 24px",display:"flex",alignItems:"center",height:54,position:"sticky",top:0,zIndex:50,gap:16}}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:4,color:ACCENT}}>DARK APP</div>
        <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,letterSpacing:2}}>PRODUCTION · FOCUS · FINANCE</div>
        <div style={{flex:1}}/>
        {saved&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:GREEN,background:`${GREEN}15`,padding:"3px 12px",borderRadius:20}}>✓ Salvo</div>}
        {errorMsg&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:RED,background:`${RED}15`,padding:"3px 12px",borderRadius:20}}>⚠ {errorMsg}</div>}
        {timerRunning&&<div style={{display:"flex",alignItems:"center",gap:8,background:`${timerMode==="work"?ACCENT:GREEN}15`,border:`1px solid ${timerMode==="work"?ACCENT:GREEN}33`,borderRadius:8,padding:"4px 12px"}}><span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:timerMode==="work"?ACCENT:GREEN,letterSpacing:2}}>{timerFmt(timerSeconds)}</span><button onClick={()=>setTimerRunning(false)} style={{...btnGhost,padding:"1px 6px",fontSize:10}}>⏸</button></div>}
        <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>{user.email}</div>
        <button onClick={logout} style={{...btnGhost,fontSize:11,padding:"4px 10px"}}>Sair</button>
      </div>

      {/* TABS */}
      <div style={{display:"flex",background:BG2,borderBottom:`1px solid ${BOR}`,overflowX:"auto"}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setActiveTab(i)} style={{fontFamily:"'DM Sans'",fontSize:12,color:activeTab===i?ACCENT:MUTED,background:"transparent",border:"none",borderBottom:activeTab===i?`2px solid ${ACCENT}`:"2px solid transparent",padding:"13px 16px",cursor:"pointer",whiteSpace:"nowrap",fontWeight:activeTab===i?600:400,transition:"all .15s"}}>{t}</button>)}
      </div>

      <div style={{maxWidth:1400,margin:"0 auto",padding:"24px"}}>

      {/* ═══ DASHBOARD ═══ */}
      {activeTab===0&&(()=>{
        const urgentToday=pendingTasks.filter(t=>t.urgency==="hot"||deadlineDiff(t.deadline)<=0);
        const nextTask=pendingTasks[0];
        const stuckVideos=videos.filter(v=>v.status!=="Postagem").sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).slice(0,3);
        const topGoals=activeGoals.slice(0,3).map(g=>({...g,plan:calcGoalPlan(g)}));
        const weekTasks=pendingTasks.filter(t=>t.deadline&&deadlineDiff(t.deadline)<=7&&deadlineDiff(t.deadline)>0);
        return(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
              <div><div style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:1}}>BOM DIA, <span style={{color:ACCENT}}>BERNARDO.</span></div><div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,marginTop:4}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})} · {pendingTasks.length} pendentes</div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
              {/* HOJE */}
              <div style={card}>
                <div style={{fontFamily:"'DM Sans'",fontSize:10,color:urgentToday.length>0?RED:GREEN,letterSpacing:1,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>⚡ HOJE — {urgentToday.length} tarefas</div>
                {urgentToday.length===0&&nextTask&&(
                  <div>
                    <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:8}}>Próxima tarefa:</div>
                    <div style={{padding:"10px 12px",background:BG3,borderRadius:8,marginBottom:10,cursor:"pointer"}} onClick={()=>startTimer(nextTask.id)}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500,marginBottom:4}}>{nextTask.title}</div>
                      <div style={{display:"flex",gap:6}}><span style={{background:`${getClientColor(nextTask.client_id)}20`,color:getClientColor(nextTask.client_id),borderRadius:4,padding:"1px 6px",fontSize:10}}>{getClientName(nextTask.client_id)}</span>{nextTask.deadline&&<span style={{background:`${deadlineColor(nextTask.deadline)}20`,color:deadlineColor(nextTask.deadline),borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>{deadlineLabel(nextTask.deadline)}</span>}</div>
                    </div>
                    <button onClick={()=>startTimer(nextTask.id)} style={{...btnGold,width:"100%",fontSize:13}}>▶ INICIAR POMODORO</button>
                  </div>
                )}
                {urgentToday.length===0&&!nextTask&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:GREEN,padding:"8px 0"}}>🎉 Tudo em dia!</div>}
                {urgentToday.slice(0,4).map(t=>(
                  <div key={t.id} className="hr" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 5px",borderBottom:`1px solid ${BOR}`,cursor:"pointer",borderRadius:4}} onClick={()=>startTimer(t.id)}>
                    <div style={{width:5,height:5,borderRadius:1,background:{hot:RED,warn:ACCENT,normal:GREEN}[t.urgency||"normal"],flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div><div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>{getClientName(t.client_id)}</div></div>
                    <button onClick={e=>{e.stopPropagation();completeTask(t.id);}} style={{...btnGhost,padding:"1px 6px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>✓</button>
                    <span style={{background:`${deadlineColor(t.deadline)}20`,color:deadlineColor(t.deadline),borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600,flexShrink:0}}>{deadlineLabel(t.deadline)||"🔥"}</span>
                  </div>
                ))}
              </div>
              {/* FINANCEIRO */}
              <div style={card}>
                <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>💰 FINANCEIRO — {thisMonthKey}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {[{l:"A receber",v:invoices.filter(i=>i.status==="pendente"&&i.issued_date?.startsWith(thisMonthKey)).reduce((s,i)=>s+(i.amount||0),0),c:ACCENT},{l:"Recebido",v:invoices.filter(i=>i.status==="pago"&&i.issued_date?.startsWith(thisMonthKey)).reduce((s,i)=>s+(i.amount||0),0),c:GREEN},{l:"Vencido",v:totalVencido,c:RED},{l:"Emitido",v:invoices.filter(i=>i.issued_date?.startsWith(thisMonthKey)).reduce((s,i)=>s+(i.amount||0),0),c:TEXT}].map(m=>(
                    <div key={m.l} style={{background:BG3,borderRadius:7,padding:"9px 10px",cursor:"pointer"}} onClick={()=>setActiveTab(6)}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{m.l}</div>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:15,color:m.c}}>{fmtCurrency(m.v)}</div>
                    </div>
                  ))}
                </div>
                {vencendoBreve.length>0&&<div style={{background:`${RED}10`,border:`1px solid ${RED}22`,borderRadius:6,padding:"7px 10px",marginBottom:8}}><div style={{fontFamily:"'DM Sans'",fontSize:10,color:RED,fontWeight:600,marginBottom:4}}>⚠ Vencendo em breve</div>{vencendoBreve.map(i=><div key={i.id} style={{display:"flex",justifyContent:"space-between",fontFamily:"'DM Sans'",fontSize:11}}><span style={{color:MUTED}}>{getClientName(i.client_id)}</span><span style={{color:RED,fontWeight:600}}>{fmtCurrency(i.amount)} · {deadlineLabel(i.due_date)}</span></div>)}</div>}
                {overdueLeads.length>0&&<div style={{background:`${ACCENT}10`,border:`1px solid ${ACCENT}22`,borderRadius:6,padding:"7px 10px",cursor:"pointer"}} onClick={()=>setActiveTab(5)}><div style={{fontFamily:"'DM Sans'",fontSize:10,color:ACCENT,fontWeight:600}}>🔔 {overdueLeads.length} follow-up{overdueLeads.length>1?"s":""} pendente{overdueLeads.length>1?"s":""}</div></div>}
              </div>
              {/* PIPELINE DARK */}
              <div style={card}>
                <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>🎬 PIPELINE DARK</div>
                {PIPELINE.map(s=>{const count=videos.filter(v=>v.status===s).length;const color=PIPELINE_COLORS[s];return(<div key={s} className="hr" style={{display:"flex",alignItems:"center",gap:8,padding:"5px 4px",borderBottom:`1px solid ${BOR}`,cursor:"pointer",borderRadius:4}} onClick={()=>setActiveTab(4)}><div style={{width:7,height:7,borderRadius:2,background:color,flexShrink:0}}/><span style={{fontFamily:"'DM Sans'",fontSize:12,flex:1}}>{s}</span><span style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:count>0?color:HINT,fontWeight:600}}>{count}</span></div>);})}
                {stuckVideos.length>0&&<div style={{marginTop:8}}><div style={{fontFamily:"'DM Sans'",fontSize:9,color:ORANGE,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>⏱ Parados</div>{stuckVideos.map(v=><div key={v.id} style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer",padding:"2px 0"}} onClick={()=>{setVideoDetailModal({...v});setActiveTab(4);}}>→ {v.meu_titulo||v.title}</div>)}</div>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {/* METAS */}
              <div style={card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>🎯 METAS</div><button onClick={()=>setActiveTab(2)} style={{...btnGhost,fontSize:10,padding:"2px 8px",color:ACCENT,borderColor:`${ACCENT}33`}}>ver todas →</button></div>
                {topGoals.length===0?<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,padding:"8px 0"}}>Nenhuma meta. <span style={{color:ACCENT,cursor:"pointer"}} onClick={()=>setActiveTab(2)}>Criar →</span></div>:topGoals.map(g=>{const plan=g.plan;const hc={curto:ACCENT,medio:BLUE,longo:PURP}[g.horizon||"curto"];return(<div key={g.id} style={{marginBottom:12,cursor:"pointer"}} onClick={()=>setActiveTab(2)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}><span style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500}}>{g.title}</span><span style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:plan.onTrack?GREEN:RED,fontWeight:600}}>{plan.pct}%</span></div><div style={{background:BG,borderRadius:3,height:5,overflow:"hidden"}}><div style={{height:"100%",width:`${plan.pct}%`,background:plan.onTrack?hc:RED,borderRadius:3,transition:"width .5s"}}/></div>{plan.milestones[0]?.actions[0]&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginTop:3}}>→ {plan.milestones[0].actions[0]}</div>}</div>);})}
              </div>
              {/* IDEIAS */}
              <div style={card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>💡 IDEIAS</div><button onClick={()=>{setIdeaEdit({title:"",description:"",niche:""});setIdeaModal(true);}} style={{...btnGhost,fontSize:10,padding:"2px 8px"}}>+ Nova</button></div>
                <div style={{display:"flex",gap:8,marginBottom:10}}><input value={dashIdeaInput} onChange={e=>setDashIdeaInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&dashIdeaInput.trim()){saveQuickIdea(dashIdeaInput.trim());setDashIdeaInput("");}}} placeholder="Capturar ideia..." style={{...inp,flex:1,fontSize:12,padding:"6px 10px"}}/><button onClick={()=>{if(dashIdeaInput.trim()){saveQuickIdea(dashIdeaInput.trim());setDashIdeaInput("");}}} style={{...btnGold,padding:"6px 12px",fontSize:13}}>+</button></div>
                {ideas.filter(i=>!i.used).slice(0,5).map(i=>(
                  <div key={i.id} className="hr" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 5px",borderBottom:`1px solid ${BOR}`,borderRadius:4}}>
                    <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>{setIdeaEdit({...i});setIdeaModal(true);}}><div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.title}</div>{(i.niche||i.description)&&<div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.niche||i.description}</div>}</div>
                    <button onClick={()=>useIdeaAsVideo(i)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`,flexShrink:0}}>usar →</button>
                    <button onClick={()=>deleteIdea(i.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                ))}
                {ideas.filter(i=>!i.used).length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:12}}>Capture sua próxima ideia acima.</div>}
              </div>
            </div>
            {weekTasks.length>0&&<div style={{...card,marginTop:14}}><div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:12,fontWeight:600}}>📅 ESTA SEMANA — {weekTasks.length} vencendo</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>{clients.map(c=>{const ct=weekTasks.filter(t=>t.client_id===c.id);if(!ct.length)return null;return(<div key={c.id} style={{background:BG3,borderRadius:8,padding:"10px 12px",borderLeft:`3px solid ${c.color||ACCENT}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontFamily:"'Bebas Neue'",fontSize:13,color:c.color||ACCENT}}>{c.name}</span><span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{ct.length}x</span></div><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ct[0]?.title}</div></div>);})}</div></div>}
          </div>
        );
      })()}

      {/* ═══ FOCUS OS ═══ */}
      {activeTab===1&&(()=>{
        const LEVELS=[{n:1,l:"Iniciante",xp:0},{n:2,l:"Freelancer",xp:100},{n:3,l:"Creator",xp:250},{n:4,l:"Producer",xp:500},{n:5,l:"Director",xp:1000},{n:6,l:"Studio Boss",xp:2000}];
        const curLvl=LEVELS.filter(l=>l.xp<=(userStats.xp||0)).pop()||LEVELS[0];
        const nextLvl=LEVELS.find(l=>l.xp>(userStats.xp||0));
        const focusTask=pendingTasks.find(t=>t.id===focusTaskId)||pendingTasks[0];
        return(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>FOCUS OS</div><button onClick={()=>{setTaskEdit({title:"",urgency:"hot",estimated_hours:1,deadline:today()});setTaskModal(true);}} style={btnGold}>+ NOVA TAREFA</button></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20}}>
              <div>
                <div style={{...card,marginBottom:14,border:`1px solid ${timerMode==="work"?ACCENT:GREEN}44`}}>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:timerMode==="work"?ACCENT:GREEN,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{timerMode==="work"?"🍅 Pomodoro 25min":"☕ Descanso 5min"}</div>
                  {focusTask&&<div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,marginBottom:10}}>{focusTask.title}</div>}
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:52,letterSpacing:-2,color:timerMode==="work"?ACCENT:GREEN,lineHeight:1,marginBottom:16}}>{timerFmt(timerSeconds)}</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {!timerRunning?<button onClick={()=>focusTask&&startTimer(focusTask.id)} style={{...btnGold,opacity:focusTask?1:.5}}>▶ INICIAR</button>:<button onClick={()=>{setTimerRunning(false);stopTimeEntry();}} style={{...btnGhost,color:ACCENT,borderColor:`${ACCENT}44`}}>⏸ PAUSAR</button>}
                    {focusTask&&<button onClick={()=>completeTask(focusTask.id)} style={{...btnGhost,color:GREEN,borderColor:`${GREEN}44`}}>✓ CONCLUIR</button>}
                    {focusTask&&<button onClick={()=>setFocusTaskId(null)} style={btnGhost}>→ Pular</button>}
                  </div>
                </div>
                <div style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2}}>PLANO DO DIA</div><button onClick={()=>{setTaskEdit({title:"",urgency:"normal",estimated_hours:1,deadline:today()});setTaskModal(true);}} style={{...btnGhost,fontSize:10,padding:"3px 8px"}}>+ Tarefa</button></div>
                  {pendingTasks.length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:20}}>🎉 Nenhuma tarefa pendente!</div>}
                  {pendingTasks.map((t,i)=>{
                    const isFocus=t.id===focusTaskId||(i===0&&!focusTaskId);
                    return(
                      <div key={t.id} className="hr" onClick={()=>startTimer(t.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 8px",borderBottom:`1px solid ${BOR}`,background:isFocus?`${ACCENT}06`:undefined,borderRadius:isFocus?6:0,cursor:"pointer"}}>
                        <span style={{fontFamily:"'IBM Plex Mono'",color:HINT,fontSize:10,width:20,flexShrink:0}}>#{i+1}</span>
                        <div style={{width:5,height:5,borderRadius:1,background:{hot:RED,warn:ACCENT,normal:GREEN}[t.urgency||"normal"],flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:isFocus?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{getClientName(t.client_id)} · {t.type||"Tarefa"}</div></div>
                        <div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center"}}>
                          {t.deadline&&<span style={{background:`${deadlineColor(t.deadline)}20`,color:deadlineColor(t.deadline),borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:600}}>{deadlineLabel(t.deadline)}</span>}
                          <span style={{background:BG3,color:MUTED,borderRadius:4,padding:"1px 5px",fontSize:10}}>{t.estimated_hours}h</span>
                          <button onClick={e=>{e.stopPropagation();completeTask(t.id);}} style={{...btnGhost,padding:"1px 6px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>✓</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{...card,marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>LVL {curLvl.n}</div><span style={{background:`${ACCENT}20`,color:ACCENT,borderRadius:4,padding:"2px 8px",fontFamily:"'DM Sans'",fontSize:11,fontWeight:600}}>{curLvl.l}</span></div>
                  <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED,marginBottom:6}}>{userStats.xp||0} / {nextLvl?.xp||"MAX"} XP</div>
                  <div style={{background:BG,borderRadius:3,height:6,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,Math.round(((userStats.xp||0)-(curLvl.xp||0))/Math.max(1,(nextLvl?.xp||500)-(curLvl.xp||0))*100))}%`,background:GREEN,borderRadius:3,transition:"width .8s"}}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>{[{l:"Tarefas",v:userStats.tasks_completed||0},{l:"Pomodoros",v:userStats.pomodoros_completed||0},{l:"Streak",v:`🔥 ${userStats.streak||0}d`},{l:"XP",v:userStats.xp||0}].map(s=><div key={s.l} style={{background:BG3,borderRadius:7,padding:"9px 10px"}}><div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{s.l}</div><div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACCENT}}>{s.v}</div></div>)}</div>
                </div>
                <div style={card}><div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,marginBottom:12}}>JORNADA</div>{LEVELS.map(l=>{const done=(userStats.xp||0)>=(LEVELS[l.n]?.xp||9999);const current=l.n===curLvl.n;return(<div key={l.n} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${BOR}`}}><div style={{width:26,height:26,borderRadius:"50%",border:`1.5px solid ${done?GREEN:current?ACCENT:BOR2}`,background:done?`${GREEN}15`:current?`${ACCENT}10`:undefined,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono'",fontSize:10,color:done?GREEN:current?ACCENT:HINT,fontWeight:600,flexShrink:0}}>{done?"✓":l.n}</div><div style={{flex:1,fontFamily:"'DM Sans'",fontSize:12,fontWeight:current?600:400,color:current?ACCENT:done?GREEN:MUTED}}>LVL {l.n} — {l.l}</div><div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:HINT}}>{l.xp}</div></div>);})}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ METAS ═══ */}
      {activeTab===2&&(()=>{
        const HC={curto:ACCENT,medio:BLUE,longo:PURP};
        const filteredGoals=goals.filter(g=>(g.horizon||"curto")===goalHorizon);
        const TEMPLATES={curto:[{title:"4 vídeos — Sr. Waldemar",type:"videos_mes",target_value:4},{title:"8 vídeos — Canais Dark",type:"videos_mes",target_value:8},{title:"R$ 5k este mês",type:"faturamento_mes",target_value:5000}],medio:[{title:"R$ 15k/mês até Julho",type:"faturamento_mes",target_value:15000},{title:"3 clientes novos",type:"clientes",target_value:3},{title:"50k seguidores Waldemar",type:"seguidores",target_value:50000}],longo:[{title:"100k seguidores Waldemar",type:"seguidores",target_value:100000},{title:"R$ 10k/mês AdSense",type:"adsense_mes",target_value:10000},{title:"R$ 200k em 2026",type:"faturamento_mes",target_value:200000}]};
        return(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>🎯 METAS</div><button onClick={()=>{setGoalEdit({title:"",type:"videos_mes",horizon:goalHorizon,target_value:0,current_value:0,target_date:"",client_id:"",notes:""});setGoalModal(true);}} style={btnGold}>+ NOVA META</button></div>
            <div style={{display:"flex",gap:2,borderBottom:`1px solid ${BOR}`,marginBottom:24}}>
              {GOAL_HORIZONS.map(h=><button key={h} onClick={()=>setGoalHorizon(h)} style={{fontFamily:"'DM Sans'",fontSize:12,color:goalHorizon===h?HC[h]:MUTED,background:"transparent",border:"none",borderBottom:goalHorizon===h?`2px solid ${HC[h]}`:"2px solid transparent",padding:"10px 20px",cursor:"pointer",whiteSpace:"nowrap",fontWeight:goalHorizon===h?600:400}}>{h==="curto"?"⚡ Curto Prazo":h==="medio"?"📈 Médio Prazo":"🚀 Longo Prazo"}</button>)}
            </div>
            {filteredGoals.length===0&&<div style={{...card,marginBottom:20}}>
              <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Templates rápidos</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{(TEMPLATES[goalHorizon]||[]).map(t=><button key={t.title} onClick={()=>{setGoalEdit({...t,current_value:0,target_date:"",client_id:"",notes:"",horizon:goalHorizon});setGoalModal(true);}} style={{...btnGhost,fontSize:11,padding:"6px 12px",color:HC[goalHorizon],borderColor:`${HC[goalHorizon]}33`}}>+ {t.title}</button>)}</div>
            </div>}
            {filteredGoals.map(g=>{
              const plan=calcGoalPlan(g);const hc=HC[g.horizon||"curto"];const isSelected=selectedGoal?.id===g.id;
              return(
                <div key={g.id} style={{...card,border:`1px solid ${isSelected?hc:BOR}`,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1}}>{g.title}</div>
                        <span style={{background:`${hc}20`,color:hc,borderRadius:4,padding:"1px 8px",fontSize:10,fontWeight:600}}>{GOAL_TYPE_LABELS[g.type]||g.type}</span>
                        {g.client_id&&<span style={{background:`${getClientColor(g.client_id)}20`,color:getClientColor(g.client_id),borderRadius:4,padding:"1px 8px",fontSize:10,fontWeight:600}}>{getClientName(g.client_id)}</span>}
                      </div>
                      <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:8}}>
                        <div style={{fontFamily:"'IBM Plex Mono'",fontSize:13,fontWeight:600}}>{(g.current_value||0).toLocaleString("pt-BR")} <span style={{color:MUTED}}>/ {(g.target_value||0).toLocaleString("pt-BR")}</span></div>
                        <div style={{fontFamily:"'DM Sans'",fontSize:12,color:plan.onTrack?GREEN:RED,fontWeight:600}}>{plan.onTrack?"✓ No ritmo":"⚠ Atrasado"}</div>
                        {g.target_date&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>até {fmtDate(g.target_date)}</div>}
                      </div>
                      <div style={{background:BG,borderRadius:4,height:7,overflow:"hidden",marginBottom:4}}><div style={{height:"100%",width:`${plan.pct}%`,background:plan.onTrack?hc:RED,borderRadius:4,transition:"width .6s"}}/></div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{plan.pct}% · {plan.monthsLeft} meses · {plan.perMonth.toLocaleString("pt-BR",{maximumFractionDigits:1})}/mês necessário</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>setSelectedGoal(isSelected?null:g)} style={{...btnGhost,padding:"4px 10px",fontSize:11,color:hc,borderColor:`${hc}44`}}>{isSelected?"▲":"▼ plano"}</button>
                      <button onClick={()=>{setGoalEdit({...g});setGoalModal(true);}} style={{...btnGhost,padding:"4px 8px",fontSize:11}}>✏️</button>
                      <button onClick={()=>deleteGoal(g.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:isSelected?16:0,alignItems:"center"}}>
                    <input type="number" defaultValue={g.current_value||0} onBlur={e=>updateGoalProgress(g.id,parseFloat(e.target.value)||0)} style={{...inp,width:130,fontSize:13,fontFamily:"'IBM Plex Mono'"}} placeholder="Valor atual"/>
                    <span style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>atualizar progresso</span>
                  </div>
                  {isSelected&&(
                    <div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:12,marginTop:8}}>CRONOGRAMA — PASSO A PASSO</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
                        {plan.milestones.map((m,i)=>{
                          const isPast=new Date(m.month+"-01")<new Date()&&m.month!==thisMonthKey;
                          const isCurrent=m.month===thisMonthKey;
                          return(
                            <div key={m.month} style={{background:isCurrent?`${hc}10`:BG3,borderRadius:9,padding:"12px 12px",borderTop:`2px solid ${isCurrent?hc:isPast?GREEN:BOR2}`,opacity:isPast?.6:1}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                                <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,color:isCurrent?hc:TEXT}}>{m.label.toUpperCase()}</div>
                                {isCurrent&&<span style={{background:`${hc}20`,color:hc,borderRadius:3,padding:"1px 5px",fontSize:9,fontWeight:600}}>AGORA</span>}
                                {isPast&&<span style={{color:GREEN,fontSize:11}}>✓</span>}
                              </div>
                              <div style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:hc,fontWeight:600,marginBottom:7}}>{m.expected.toLocaleString("pt-BR")}</div>
                              {m.actions.map((a,j)=><div key={j} style={{display:"flex",gap:4,marginBottom:4}}><span style={{color:hc,fontSize:9,flexShrink:0,marginTop:2}}>→</span><span style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,lineHeight:1.4}}>{a}</span></div>)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredGoals.length===0&&goals.length>0&&<div style={{textAlign:"center",padding:40,color:MUTED,fontFamily:"'DM Sans'",fontSize:14}}>Nenhuma meta de {goalHorizon} prazo.</div>}
          </div>
        );
      })()}

      {/* ═══ AGENDA ═══ */}
      {activeTab===3&&(()=>{
        const weekDates=getWeekDates(weekOffset);const todayStr=today();
        return(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>AGENDA</div><div style={{display:"flex",gap:8}}><button onClick={()=>setWeekOffset(o=>o-1)} style={btnGhost}>← Anterior</button><button onClick={()=>setWeekOffset(0)} style={{...btnGhost,color:ACCENT,borderColor:`${ACCENT}44`}}>Hoje</button><button onClick={()=>setWeekOffset(o=>o+1)} style={btnGhost}>Próxima →</button><button onClick={()=>{setTaskEdit({title:"",urgency:"normal",estimated_hours:1});setTaskModal(true);}} style={btnGold}>+ TAREFA</button></div></div>
            {weekDates.map(({date,label})=>{
              const isToday=date===todayStr;const dayTasks=tasks.filter(t=>t.deadline===date&&!t.done);const totalH=dayTasks.reduce((s,t)=>s+(t.estimated_hours||0),0);const lc=totalH>8?RED:totalH>5?ACCENT:GREEN;
              return(
                <div key={date} style={{marginBottom:8}}>
                  <div style={{display:"grid",gridTemplateColumns:"130px 1fr auto",gap:14,alignItems:"flex-start",background:isToday?`${ACCENT}06`:"transparent",border:`1px solid ${isToday?ACCENT:BOR}`,borderRadius:10,padding:"13px 16px"}}>
                    <div><div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2,color:isToday?ACCENT:TEXT}}>{label}</div><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{new Date(date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long"})}</div>{isToday&&<span style={{background:ACCENT,color:"#111",borderRadius:8,padding:"1px 7px",fontFamily:"'DM Sans'",fontSize:9,fontWeight:600}}>HOJE</span>}{totalH>0&&<div style={{marginTop:5}}><div style={{background:BG3,borderRadius:2,height:3,overflow:"hidden",width:70}}><div style={{height:"100%",width:`${Math.min(100,(totalH/10)*100)}%`,background:lc}}/></div><div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:lc,marginTop:2}}>{totalH}h</div></div>}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {dayTasks.length===0?<div style={{fontFamily:"'DM Sans'",fontSize:12,color:HINT}}>—</div>:dayTasks.map(t=>(
                        <div key={t.id} onClick={()=>{setTaskEdit({...t});setTaskModal(true);}} style={{display:"flex",gap:10,padding:"10px 12px",background:`${getClientColor(t.client_id)}07`,border:`1px solid ${getClientColor(t.client_id)}22`,borderRadius:7,cursor:"pointer",alignItems:"center"}}>
                          <div style={{flex:1}}><div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,color:getClientColor(t.client_id)}}>{getClientName(t.client_id).toUpperCase()}</div><div style={{fontFamily:"'DM Sans'",fontSize:13}}>{t.title}</div><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{t.type||"Tarefa"} · {t.estimated_hours}h</div></div>
                          <span style={{background:`${deadlineColor(t.deadline)}20`,color:deadlineColor(t.deadline),borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:600,flexShrink:0}}>{t.urgency==="hot"?"🔥":"OK"}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>{setTaskEdit({title:"",urgency:"normal",estimated_hours:1,deadline:date});setTaskModal(true);}} style={{...btnGhost,fontSize:11,padding:"5px 10px",flexShrink:0}}>+</button>
                  </div>
                </div>
              );
            })}
            <div style={{...card,marginTop:14}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2,marginBottom:12}}>📌 PRÓXIMAS DEADLINES</div>
              {tasks.filter(t=>!t.done&&t.deadline&&deadlineDiff(t.deadline)<=7).sort((a,b)=>deadlineDiff(a.deadline)-deadlineDiff(b.deadline)).map(t=>(
                <div key={t.id} className="hr" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",borderBottom:`1px solid ${BOR}`,cursor:"pointer",borderRadius:4}} onClick={()=>{setTaskEdit({...t});setTaskModal(true);}}>
                  <div style={{width:8,height:8,borderRadius:2,background:deadlineColor(t.deadline),flexShrink:0}}/><div style={{flex:1}}><div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500}}>{t.title}</div><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{getClientName(t.client_id)}</div></div>
                  <span style={{background:`${deadlineColor(t.deadline)}20`,color:deadlineColor(t.deadline),borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:600}}>{fmtDate(t.deadline)} · {deadlineLabel(t.deadline)}</span>
                </div>
              ))}
              {tasks.filter(t=>!t.done&&t.deadline&&deadlineDiff(t.deadline)<=7).length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:16}}>Nenhuma deadline nos próximos 7 dias 🎉</div>}
            </div>
          </div>
        );
      })()}

      {/* ═══ CANAIS DARK ═══ */}
      {activeTab===4&&(()=>{
        const filteredVideos=pipelineFilter==="todos"?videos:videos.filter(v=>v.status===pipelineFilter);
        return(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>CANAIS DARK</div>
              <div style={{display:"flex",gap:8}}>
                {["pipeline","ideias","nichos","referencias"].map(s=><button key={s} onClick={()=>setDarkSection(s)} style={{...btnGhost,color:darkSection===s?ACCENT:MUTED,borderColor:darkSection===s?`${ACCENT}44`:BOR,fontSize:12}}>{s==="referencias"?"Referências":s.charAt(0).toUpperCase()+s.slice(1)}</button>)}
                <button onClick={()=>createVideo()} style={btnGold}>+ NOVO VÍDEO</button>
              </div>
            </div>

            {darkSection==="pipeline"&&(
              <div>
                <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
                  {["todos",...PIPELINE].map(s=><button key={s} onClick={()=>setPipelineFilter(s)} style={{...btnGhost,fontSize:10,padding:"3px 9px",color:pipelineFilter===s?PIPELINE_COLORS[s]||ACCENT:MUTED,borderColor:pipelineFilter===s?`${PIPELINE_COLORS[s]||ACCENT}44`:BOR,background:pipelineFilter===s?`${PIPELINE_COLORS[s]||ACCENT}10`:undefined}}>{s==="todos"?"Todos":s}</button>)}
                </div>
                <div style={{overflowX:"auto",paddingBottom:8}}>
                  <div style={{display:"flex",gap:10,minWidth:"max-content"}}>
                    {PIPELINE.map(status=>{
                      const colVids=filteredVideos.filter(v=>v.status===status);const color=PIPELINE_COLORS[status];
                      return(
                        <div key={status} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("vid");if(id)moveVideo(id,status);}} style={{width:230,flexShrink:0,background:BG3,border:`1px solid ${BOR}`,borderRadius:10,overflow:"hidden",minHeight:260}}>
                          <div style={{padding:"9px 10px 7px",borderBottom:`2px solid ${color}`,background:`${color}10`}}><div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,color}}>{status}</div><div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>{colVids.length}</div></div>
                          <div style={{padding:6,display:"flex",flexDirection:"column",gap:5}}>
                            {colVids.map(v=>(
                              <div key={v.id} draggable onDragStart={e=>e.dataTransfer.setData("vid",v.id)} onClick={()=>setVideoDetailModal({...v})} style={{background:CARD,border:`1px solid ${v.ref_url?BLUE:BOR}`,borderRadius:7,padding:"9px 10px",cursor:"pointer",transition:"all .15s"}} className="hc">
                                {v.ref_thumb&&<img src={v.ref_thumb} alt="" style={{width:"100%",height:52,objectFit:"cover",borderRadius:3,marginBottom:5}}/>}
                                <div style={{fontFamily:"'DM Sans'",fontSize:11,fontWeight:600,lineHeight:1.3,marginBottom:4}}>{v.meu_titulo||v.title}</div>
                                <div style={{display:"flex",gap:3,flexWrap:"wrap"}}><span style={{background:`${ACCENT}15`,color:ACCENT,borderRadius:3,padding:"1px 5px",fontSize:9}}>{(v.niche||"").split(" ")[0]}</span>{v.ref_url&&<span style={{background:`${BLUE}15`,color:BLUE,borderRadius:3,padding:"1px 5px",fontSize:9}}>📎</span>}{v.publish_date&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>📅{fmtDate(v.publish_date)}</span>}</div>
                              </div>
                            ))}
                            {colVids.length===0&&<div style={{color:HINT,fontSize:11,textAlign:"center",padding:14}}>Arraste aqui</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{...card,marginTop:16}}><div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,marginBottom:12}}>📅 COMO AVANÇAR UM VÍDEO</div><div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>{[{d:"DIA 1",c:ACCENT,i:["Escolher ideia","Pesquisar refs","Definir hook"]},{d:"DIA 2",c:BLUE,i:["Escrever roteiro","Revisar","Gravar locução"]},{d:"DIA 3",c:RED,i:["Prompts Nano","Gerar imagens","Animações"]},{d:"DIA 4",c:PURP,i:["Editar vídeo","Sincronizar","Legendas"]},{d:"DIA 5",c:ORANGE,i:["Thumbnail","Título","Descrição"]},{d:"DIA 6",c:GREEN,i:["Revisão","Upload","Agendar"]}].map(({d,c,i})=><div key={d} style={{background:BG3,borderRadius:7,padding:"9px 8px",borderTop:`2px solid ${c}`}}><div style={{fontFamily:"'Bebas Neue'",fontSize:11,color:c,letterSpacing:1,marginBottom:6}}>{d}</div>{i.map((it,j)=><div key={j} style={{display:"flex",gap:4,marginBottom:4}}><span style={{color:c,fontSize:9,flexShrink:0,marginTop:2}}>→</span><span style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,lineHeight:1.4}}>{it}</span></div>)}</div>)}</div></div>
              </div>
            )}

            {darkSection==="ideias"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                <div style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2}}>💡 BANCO DE IDEIAS</div><button onClick={()=>{setIdeaEdit({title:"",description:"",niche:""});setIdeaModal(true);}} style={{...btnGhost,fontSize:11,padding:"3px 9px"}}>+ Nova</button></div>
                  <div style={{display:"flex",gap:8,marginBottom:12}}><input value={darkIdeaInput} onChange={e=>setDarkIdeaInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&darkIdeaInput.trim()){saveQuickIdea(darkIdeaInput.trim());setDarkIdeaInput("");}}} placeholder="Nova ideia..." style={{...inp,flex:1}}/><button onClick={()=>{if(darkIdeaInput.trim()){saveQuickIdea(darkIdeaInput.trim());setDarkIdeaInput("");}}} style={btnGold}>+</button></div>
                  {ideas.filter(i=>!i.used).map(i=>(
                    <div key={i.id} className="hr" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 5px",borderBottom:`1px solid ${BOR}`,borderRadius:4}}>
                      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>{setIdeaEdit({...i});setIdeaModal(true);}}><div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.title}</div>{i.niche&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{i.niche}</div>}{i.description&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:HINT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.description}</div>}</div>
                      <button onClick={()=>useIdeaAsVideo(i)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`,flexShrink:0}}>usar →</button>
                      <button onClick={()=>deleteIdea(i.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  ))}
                  {ideas.filter(i=>!i.used).length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:16}}>Banco vazio.</div>}
                </div>
                <div style={card}><div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,marginBottom:12}}>✓ USADAS</div>{ideas.filter(i=>i.used).map(i=><div key={i.id} style={{padding:"6px 0",borderBottom:`1px solid ${BOR}`,opacity:.4}}><div style={{fontFamily:"'DM Sans'",fontSize:12,textDecoration:"line-through"}}>{i.title}</div></div>)}</div>
              </div>
            )}

            {darkSection==="nichos"&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>NICHOS</div>
                  <button onClick={()=>{setNicheEdit({name:"",keyword:"",cpm:"",active:true});setNicheModal(true);}} style={btnGold}>+ NOVO NICHO</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
                  {niches.map(n=>{
                    const channels=refChannels.filter(c=>c.niche===n.name);
                    return(
                      <div key={n.id} style={{...card,opacity:n.active===false?.5:1,marginBottom:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <div><div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:1}}>{n.name}</div>{n.cpm&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:ACCENT}}>CPM {n.cpm}</div>}</div>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>toggleNicheActive(n)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:n.active===false?MUTED:GREEN,borderColor:n.active===false?BOR:`${GREEN}33`}}>{n.active===false?"off":"on"}</button>
                            <button onClick={()=>{setNicheEdit({...n});setNicheModal(true);}} style={{...btnGhost,padding:"2px 6px",fontSize:10}}>✏️</button>
                            <button onClick={()=>deleteNiche(n.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:11}}>✕</button>
                          </div>
                        </div>
                        {n.keyword&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:8}}>🔍 {n.keyword}</div>}
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>{channels.length} canais · {videos.filter(v=>v.niche===n.name).length} vídeos</span>
                          <button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:n.name,subscribers:"",notes:""});setRefChannelModal(true);}} style={{...btnGhost,padding:"1px 7px",fontSize:10}}>+ canal</button>
                        </div>
                        {channels.map(ch=>(
                          <div key={ch.id} style={{marginBottom:6,background:BG3,borderRadius:5,overflow:"hidden"}}>
                            <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderBottom:`1px solid ${BOR}`}}>
                              <a href={ch.url} target="_blank" rel="noreferrer" style={{flex:1,fontFamily:"'DM Sans'",fontSize:11,fontWeight:600,color:TEXT,textDecoration:"none"}}>{ch.name}</a>
                              {ch.subscribers&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{ch.subscribers}</span>}
                              <button onClick={()=>fetchChannelVideos(ch)} disabled={!!channelLoading} style={{...btnGhost,padding:"1px 6px",fontSize:9,color:ACCENT,borderColor:`${ACCENT}33`,opacity:channelLoading===ch.id?.5:1}}>{channelLoading===ch.id?"...":"▶"}</button>
                              <button onClick={()=>deleteRefChannel(ch.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:10}}>✕</button>
                            </div>
                            {channelVideos[ch.id]&&channelVideos[ch.id].map((v,i)=>(
                              <div key={v.id} style={{display:"flex",gap:5,padding:"4px 8px",borderBottom:`1px solid ${BOR}`,alignItems:"center"}}>
                                <span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:HINT,width:14,flexShrink:0}}>{i+1}</span>
                                {v.thumb&&<img src={v.thumb} alt="" style={{width:40,height:28,borderRadius:2,objectFit:"cover",flexShrink:0}}/>}
                                <div style={{flex:1,minWidth:0}}><a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:10,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a><div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div></div>
                                <div style={{display:"flex",gap:3,flexShrink:0}}>
                                  <button onClick={()=>saveQuickIdea(v.title)} style={{...btnGhost,padding:"1px 4px",fontSize:9,color:GREEN,borderColor:`${GREEN}33`}}>+</button>
                                  <button onClick={()=>setUseAsBaseModal({...v,niche:n.name})} style={{...btnGhost,padding:"1px 4px",fontSize:9,color:ACCENT,borderColor:`${ACCENT}33`}}>base</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {darkSection==="referencias"&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>CANAIS DE REFERÊNCIA</div><button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:activeNiches[0]?.name||"",subscribers:"",notes:""});setRefChannelModal(true);}} style={btnGold}>+ CANAL</button></div>
                {niches.map(n=>{const channels=refChannels.filter(c=>c.niche===n.name);if(!channels.length)return null;return(
                  <div key={n.name} style={{marginBottom:18}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,color:ACCENT,marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${BOR}`}}>{n.name}</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:10}}>
                      {channels.map(ch=>(
                        <div key={ch.id} style={{...card,marginBottom:0}} className="hc">
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <div><a href={ch.url} target="_blank" rel="noreferrer" style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,color:TEXT,textDecoration:"none",display:"block"}}>{ch.name}</a>{ch.subscribers&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{ch.subscribers} inscritos</div>}</div>
                            <div style={{display:"flex",gap:3}}><button onClick={()=>{setRefChannelEdit({...ch});setRefChannelModal(true);}} style={{...btnGhost,padding:"2px 5px",fontSize:10}}>✏️</button><button onClick={()=>deleteRefChannel(ch.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:11}}>✕</button></div>
                          </div>
                          {ch.notes&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:7,lineHeight:1.5}}>{ch.notes}</div>}
                          <button onClick={()=>fetchChannelVideos(ch)} disabled={!!channelLoading} style={{...btnGhost,width:"100%",fontSize:11,color:ACCENT,borderColor:`${ACCENT}33`,opacity:channelLoading===ch.id?.5:1}}>{channelLoading===ch.id?"Carregando...":channelVideos[ch.id]?`✓ ${channelVideos[ch.id].length} vídeos`:"▶ Carregar top 10"}</button>
                          {channelVideos[ch.id]&&channelVideos[ch.id].slice(0,5).map((v,i)=>(
                            <div key={v.id} style={{display:"flex",gap:7,padding:"5px 0",borderBottom:`1px solid ${BOR}`,alignItems:"center",marginTop:4}}>
                              <span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:HINT,width:14}}>{i+1}</span>
                              <div style={{flex:1,minWidth:0}}><a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a><div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div></div>
                              <button onClick={()=>setUseAsBaseModal({...v,niche:n.name})} style={{...btnGhost,padding:"1px 5px",fontSize:9,color:ACCENT,borderColor:`${ACCENT}33`,flexShrink:0}}>base</button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );})}
                {refChannels.length===0&&<div style={{...card,textAlign:"center",padding:36}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:MUTED,marginBottom:8}}>NENHUM CANAL</div><button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:activeNiches[0]?.name||"",subscribers:"",notes:""});setRefChannelModal(true);}} style={btnGold}>+ ADICIONAR</button></div>}
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══ CLIENTES ═══ */}
      {activeTab===5&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>CLIENTES</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setLeadEdit({name:"",contact:"",service:"",proposed_value:0,status:"novo",last_contact:today(),follow_up_date:"",notes:""});setLeadModal(true);}} style={{...btnGhost,color:ACCENT,borderColor:`${ACCENT}44`,fontSize:12}}>+ Lead</button>
              <button onClick={()=>{setClientEdit({name:"",color:ACCENT,type:"YouTube",frequency:"",rate_per_hour:0,contract_value:0,notes:""});setClientModal(true);}} style={btnGold}>+ NOVO CLIENTE</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"250px 1fr",gap:18}}>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {clients.map(c=>{const{pendingTasks:pt}=getClientStats(c.id);const isSel=selectedClient?.id===c.id;return(
                <div key={c.id} onClick={()=>setSelectedClient(isSel?null:c)} style={{...card,cursor:"pointer",border:`1px solid ${isSel?c.color||ACCENT:BOR}`,background:isSel?`${c.color||ACCENT}06`:CARD,marginBottom:0,transition:"all .15s"}} className="hc">
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:32,height:32,borderRadius:7,background:`${c.color||ACCENT}20`,border:`1px solid ${c.color||ACCENT}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue'",fontSize:11,color:c.color||ACCENT,flexShrink:0}}>{c.name.slice(0,2).toUpperCase()}</div>
                    <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{c.type}</div></div>
                    {pt.length>0&&<span style={{background:`${RED}20`,color:RED,borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:600}}>{pt.length}</span>}
                  </div>
                </div>
              );})}
            </div>

            {selectedClient?(()=>{
              const{hoursWorked,contractValue,realHourlyRate,idealHourlyRate,pendingTasks:pt,doneTasks}=getClientStats(selectedClient.id);
              return(
                <div>
                  <div style={{...card,marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        <div style={{width:48,height:48,borderRadius:10,background:`${selectedClient.color||ACCENT}20`,border:`1px solid ${selectedClient.color||ACCENT}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue'",fontSize:16,color:selectedClient.color||ACCENT}}>{selectedClient.name.slice(0,2).toUpperCase()}</div>
                        <div><div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1}}>{selectedClient.name}</div><div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>{selectedClient.type} · {selectedClient.frequency}</div></div>
                      </div>
                      <div style={{display:"flex",gap:7}}><button onClick={()=>{setClientEdit({...selectedClient});setClientModal(true);}} style={btnGhost}>✏️ Editar</button><button onClick={()=>deleteClient(selectedClient.id)} style={{...btnGhost,color:RED,borderColor:`${RED}44`}}>🗑</button></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:9}}>
                      {[{l:"Contrato",v:fmtCurrency(contractValue),c:ACCENT},{l:"Horas trabalhadas",v:`${hoursWorked}h`,c:BLUE},{l:"R$/h real",v:realHourlyRate>0?`R$ ${realHourlyRate}`:"-",c:realHourlyRate>0&&idealHourlyRate>0?(realHourlyRate>=idealHourlyRate?GREEN:RED):MUTED},{l:"R$/h ideal",v:idealHourlyRate>0?`R$ ${idealHourlyRate}`:"-",c:MUTED},{l:"Concluídas",v:doneTasks,c:GREEN}].map(s=>(
                        <div key={s.l} style={{background:BG3,borderRadius:7,padding:"9px 10px"}}><div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{s.l}</div><div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:s.c}}>{s.v}</div></div>
                      ))}
                    </div>
                    {realHourlyRate>0&&idealHourlyRate>0&&<div style={{marginTop:9,padding:"7px 10px",background:realHourlyRate>=idealHourlyRate?`${GREEN}10`:`${RED}10`,borderRadius:5,fontFamily:"'DM Sans'",fontSize:12,color:realHourlyRate>=idealHourlyRate?GREEN:RED}}>{realHourlyRate>=idealHourlyRate?"✓ Acima do valor ideal.":"⚠ Abaixo do valor ideal. Considere renegociar."}</div>}
                  </div>
                  <div style={card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2}}>TAREFAS — POR DEADLINE</div><button onClick={()=>{setTaskEdit({title:"",client_id:selectedClient.id,urgency:"normal",estimated_hours:1,deadline:today()});setTaskModal(true);}} style={{...btnGhost,fontSize:11,padding:"4px 10px"}}>+ Tarefa</button></div>
                    {pt.map(t=>(
                      <div key={t.id} className="hr" style={{display:"flex",alignItems:"center",gap:9,padding:"9px 7px",borderBottom:`1px solid ${BOR}`,borderRadius:4}}>
                        <div style={{width:5,height:5,borderRadius:1,background:{hot:RED,warn:ACCENT,normal:GREEN}[t.urgency||"normal"],flexShrink:0}}/>
                        <div style={{flex:1}}><div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500}}>{t.title}</div><div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{t.type||"Tarefa"} · {t.estimated_hours}h</div></div>
                        {t.deadline&&<span style={{background:`${deadlineColor(t.deadline)}20`,color:deadlineColor(t.deadline),borderRadius:4,padding:"2px 6px",fontSize:10,fontWeight:600}}>{deadlineLabel(t.deadline)}</span>}
                        <button onClick={()=>{setTaskEdit({...t});setTaskModal(true);}} style={{...btnGhost,padding:"2px 5px",fontSize:10}}>✏️</button>
                        <button onClick={()=>duplicateTask(t)} style={{...btnGhost,padding:"2px 5px",fontSize:10,color:BLUE,borderColor:`${BLUE}33`}}>⧉</button>
                        <button onClick={()=>completeTask(t.id)} style={{...btnGhost,padding:"2px 6px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>✓</button>
                        <button onClick={()=>deleteTask(t.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                      </div>
                    ))}
                    {pt.length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:16}}>Nenhuma tarefa pendente.</div>}
                  </div>
                  <div style={{...card,marginTop:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2}}>LEADS ({leads.filter(l=>!l.converted).length})</div><button onClick={()=>{setLeadEdit({name:"",contact:"",service:"",proposed_value:0,status:"novo",last_contact:today(),follow_up_date:"",notes:""});setLeadModal(true);}} style={{...btnGhost,fontSize:11,padding:"4px 10px"}}>+ Lead</button></div>
                    {leads.filter(l=>!l.converted).map(lead=>{
                      const LSTATUS={"novo":{l:"Novo",c:BLUE},"proposta_enviada":{l:"Proposta",c:ACCENT},"em_negociacao":{l:"Negociando",c:ORANGE},"fechado":{l:"Fechado",c:GREEN},"perdido":{l:"Perdido",c:RED}};
                      const ls=LSTATUS[lead.status]||LSTATUS["novo"];const fuDiff=lead.follow_up_date?deadlineDiff(lead.follow_up_date):null;
                      return(
                        <div key={lead.id} style={{...card,marginBottom:7,background:BG3}}>
                          <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                                <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1}}>{lead.name}</div>
                                <span style={{background:`${ls.c}20`,color:ls.c,borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:600}}>{ls.l}</span>
                                {lead.proposed_value>0&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT}}>R$ {lead.proposed_value.toLocaleString("pt-BR",{minimumFractionDigits:0})}</span>}
                              </div>
                              <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,display:"flex",gap:9,flexWrap:"wrap"}}>
                                {lead.contact&&<span>📱 {lead.contact}</span>}
                                {lead.service&&<span>🎯 {lead.service}</span>}
                                {fuDiff!==null&&<span style={{color:fuDiff<=0?RED:fuDiff<=2?ACCENT:MUTED}}>🔔 {fuDiff<=0?"Follow-up HOJE":`em ${fuDiff}d`}</span>}
                              </div>
                            </div>
                            <div style={{display:"flex",gap:4,flexShrink:0}}>
                              <button onClick={()=>{setLeadEdit({...lead});setLeadModal(true);}} style={{...btnGhost,padding:"3px 6px",fontSize:10}}>✏️</button>
                              <button onClick={()=>convertLead(lead)} style={{...btnGhost,padding:"3px 7px",fontSize:10,color:GREEN,borderColor:`${GREEN}44`}}>→ Cliente</button>
                              <button onClick={()=>deleteLead(lead.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {leads.filter(l=>!l.converted).length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:14}}>Nenhum lead ativo.</div>}
                  </div>
                </div>
              );
            })():(
              <div style={{...card,display:"flex",alignItems:"center",justifyContent:"center",minHeight:260}}><div style={{textAlign:"center",color:MUTED}}><div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:HINT,marginBottom:8}}>◈</div><div style={{fontFamily:"'DM Sans'",fontSize:14}}>Selecione um cliente</div></div></div>
            )}
          </div>
        </div>
      )}

      {/* ═══ FINANÇAS ═══ */}
      {activeTab===6&&(()=>{
        const SC={pendente:ACCENT,pago:GREEN,vencido:RED,cancelado:MUTED};
        const filtered=periodInvoices.filter(i=>invoiceFilter==="todos"||i.status===invoiceFilter).sort((a,b)=>(a.due_date||"").localeCompare(b.due_date||""));
        const MONTHS_LABELS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
        // Annual chart data
        const annualData=Array.from({length:12},(_,m)=>{
          const key=`${invoiceYear}-${String(m+1).padStart(2,"0")}`;
          const monthInvs=invoices.filter(i=>i.issued_date?.startsWith(key));
          return{month:MONTHS_LABELS[m],emitido:monthInvs.reduce((s,i)=>s+(i.amount||0),0),recebido:monthInvs.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0)};
        });
        const maxVal=Math.max(...annualData.map(d=>d.emitido),1);
        return(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>FINANÇAS</div>
              <button onClick={()=>{setInvoiceEdit({client_id:"",description:"",amount:0,status:"pendente",issued_date:today(),due_date:today(),notes:""});setInvoiceModal(true);}} style={btnGold}>+ NOVA NF</button>
            </div>

            {/* Period selector */}
            <div style={{...card,marginBottom:16}}>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:2}}>
                  {["mensal","anual"].map(p=><button key={p} onClick={()=>setInvoicePeriod(p)} style={{...btnGhost,fontSize:11,padding:"5px 14px",color:invoicePeriod===p?ACCENT:MUTED,borderColor:invoicePeriod===p?`${ACCENT}44`:BOR,background:invoicePeriod===p?`${ACCENT}10`:undefined}}>{p==="mensal"?"Mensal":"Anual"}</button>)}
                </div>
                <select value={invoiceYear} onChange={e=>setInvoiceYear(parseInt(e.target.value))} style={{...inp,width:"auto"}}>
                  {[new Date().getFullYear()-1,new Date().getFullYear(),new Date().getFullYear()+1].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                {invoicePeriod==="mensal"&&<select value={invoiceMonth} onChange={e=>setInvoiceMonth(parseInt(e.target.value))} style={{...inp,width:"auto"}}>
                  {MONTHS_LABELS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                </select>}
              </div>
            </div>

            {/* Summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {[{l:`Emitido`,v:totalEmitido,c:TEXT},{l:"Recebido",v:totalRecebido,c:GREEN},{l:"A receber",v:totalPendente,c:ACCENT},{l:"Vencido (total)",v:totalVencido,c:RED}].map(m=>(
                <div key={m.l} style={card}><span style={lbl}>{m.l}</span><div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1,color:m.c}}>{fmtCurrency(m.v)}</div></div>
              ))}
            </div>

            {/* Annual chart */}
            {invoicePeriod==="anual"&&(
              <div style={{...card,marginBottom:16}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2,marginBottom:14}}>FATURAMENTO {invoiceYear} — MENSAL</div>
                <div style={{display:"flex",gap:4,alignItems:"flex-end",height:120}}>
                  {annualData.map((d,i)=>(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:"100%",display:"flex",flexDirection:"column",gap:2,alignItems:"center",justifyContent:"flex-end",height:100}}>
                        <div style={{width:"100%",background:GREEN,borderRadius:"2px 2px 0 0",height:`${Math.round((d.recebido/maxVal)*90)}px`,minHeight:d.recebido>0?3:0,transition:"height .4s"}}/>
                        <div style={{width:"100%",background:`${ACCENT}60`,borderRadius:"2px 2px 0 0",height:`${Math.round(((d.emitido-d.recebido)/maxVal)*90)}px`,minHeight:d.emitido>d.recebido?2:0,transition:"height .4s"}}/>
                      </div>
                      <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{d.month}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:12,marginTop:8}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,background:GREEN,borderRadius:2}}/><span style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>Recebido</span></div><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,background:`${ACCENT}60`,borderRadius:2}}/><span style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>Pendente</span></div></div>
              </div>
            )}

            {/* Filter */}
            <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
              {["todos","pendente","pago","vencido","cancelado"].map(f=><button key={f} onClick={()=>setInvoiceFilter(f)} style={{...btnGhost,fontSize:11,color:invoiceFilter===f?ACCENT:MUTED,borderColor:invoiceFilter===f?`${ACCENT}44`:BOR,background:invoiceFilter===f?`${ACCENT}10`:undefined}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
            </div>

            <div style={card}>
              <div style={{display:"grid",gridTemplateColumns:"70px 1fr 110px 110px 95px 85px auto",padding:"5px 10px",borderBottom:`1px solid ${BOR}`,fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase"}}>
                <div>NF</div><div>Descrição</div><div>Cliente</div><div style={{textAlign:"right"}}>Valor</div><div style={{textAlign:"center"}}>Vencimento</div><div style={{textAlign:"center"}}>Status</div><div/>
              </div>
              {filtered.length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:28}}>Nenhuma nota fiscal neste período.</div>}
              {filtered.map(i=>(
                <div key={i.id} className="hr" style={{display:"grid",gridTemplateColumns:"70px 1fr 110px 110px 95px 85px auto",padding:"10px 10px",borderBottom:`1px solid ${BOR}`,alignItems:"center",borderRadius:4}}>
                  <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{i.number||"—"}</div>
                  <div><div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500}}>{i.description||"Sem descrição"}</div><div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>{fmtDate(i.issued_date)}</div></div>
                  <div><span style={{background:`${getClientColor(i.client_id)}20`,color:getClientColor(i.client_id),borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>{getClientName(i.client_id)}</span></div>
                  <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono'",fontWeight:600,fontSize:12,color:SC[i.status]||TEXT}}>{fmtCurrency(i.amount)}</div>
                  <div style={{textAlign:"center",fontFamily:"'IBM Plex Mono'",fontSize:10,color:deadlineColor(i.due_date)}}>{fmtDate(i.due_date)}</div>
                  <div style={{textAlign:"center"}}><span style={{background:`${SC[i.status]||TEXT}20`,color:SC[i.status]||TEXT,borderRadius:4,padding:"2px 6px",fontSize:10,fontWeight:600}}>{i.status}</span></div>
                  <div style={{display:"flex",gap:3}}>
                    {i.status==="pendente"&&<button onClick={()=>markInvoicePaid(i.id)} style={{...btnGhost,padding:"2px 6px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>✓</button>}
                    <button onClick={()=>{setInvoiceEdit({...i});setInvoiceModal(true);}} style={{...btnGhost,padding:"2px 5px",fontSize:10}}>✏️</button>
                    <button onClick={()=>duplicateInvoice(i)} style={{...btnGhost,padding:"2px 5px",fontSize:10,color:BLUE,borderColor:`${BLUE}33`}}>⧉</button>
                    <button onClick={()=>deleteInvoice(i.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{...card,marginTop:14}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,marginBottom:12}}>POR CLIENTE</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:9}}>
                {clients.map(c=>{const ci=invoices.filter(i=>i.client_id===c.id);const total=ci.reduce((s,i)=>s+(i.amount||0),0);const pago=ci.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0);if(!total)return null;return(<div key={c.id} style={{background:BG3,borderRadius:9,padding:"11px 12px",borderLeft:`3px solid ${c.color||ACCENT}`}}><div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,marginBottom:6}}>{c.name}</div><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>Total</span><span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,fontWeight:600}}>{fmtCurrency(total)}</span></div><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>Recebido</span><span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:GREEN,fontWeight:600}}>{fmtCurrency(pago)}</span></div><div style={{background:BG,borderRadius:2,height:3,overflow:"hidden"}}><div style={{height:"100%",width:`${total?Math.min(100,Math.round(pago/total*100)):0}%`,background:c.color||ACCENT,borderRadius:2}}/></div></div>);})}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ BIBLIOTECA ═══ */}
      {activeTab===7&&(()=>{
        const TC={hook:ACCENT,titulo:BLUE,cta:GREEN,thumbnail:PURP,template:RED};
        const TI={hook:"🎣",titulo:"📰",cta:"📣",thumbnail:"🖼",template:"📄"};
        const filtered=library.filter(l=>libFilter==="todos"||l.type===libFilter).filter(l=>!libSearch||l.content.toLowerCase().includes(libSearch.toLowerCase()));
        return(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>BIBLIOTECA</div><button onClick={()=>{setLibEdit({type:"hook",content:"",niche:"",score:0});setLibModal(true);}} style={btnGold}>+ ADICIONAR</button></div>
            <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              {["todos","hook","titulo","cta","thumbnail","template"].map(f=><button key={f} onClick={()=>setLibFilter(f)} style={{...btnGhost,fontSize:11,color:libFilter===f?ACCENT:MUTED,borderColor:libFilter===f?`${ACCENT}44`:BOR,background:libFilter===f?`${ACCENT}10`:undefined}}>{f==="todos"?"Todos":`${TI[f]||""} ${f}`}</button>)}
              <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...inp,width:200,marginLeft:"auto"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:11}}>
              {filtered.map(l=>(
                <div key={l.id} style={{...card,borderLeft:`3px solid ${TC[l.type]||ACCENT}`,marginBottom:0}} className="hc">
                  <div style={{display:"flex",gap:7,marginBottom:9,alignItems:"center"}}><span style={{background:`${TC[l.type]||ACCENT}20`,color:TC[l.type]||ACCENT,borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:600}}>{TI[l.type]||""} {l.type}</span>{l.niche&&<span style={{background:`${ACCENT}15`,color:ACCENT,borderRadius:4,padding:"1px 5px",fontSize:10}}>{l.niche}</span>}</div>
                  <div style={{fontFamily:"'DM Sans'",fontSize:13,lineHeight:1.65,marginBottom:10,fontStyle:l.type==="hook"||l.type==="cta"?"italic":"normal"}}>{l.content}</div>
                  <div style={{display:"flex",gap:5}}><button onClick={()=>navigator.clipboard.writeText(l.content)} style={{...btnGhost,fontSize:10,padding:"3px 8px",flex:1,color:ACCENT,borderColor:`${ACCENT}33`}}>📋 Copiar</button><button onClick={()=>{setLibEdit({...l});setLibModal(true);}} style={{...btnGhost,fontSize:10,padding:"3px 7px"}}>✏️</button><button onClick={()=>deleteLib(l.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button></div>
                </div>
              ))}
              {filtered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:MUTED,fontFamily:"'DM Sans'",fontSize:14}}>📚 Biblioteca vazia.</div>}
            </div>
          </div>
        );
      })()}

      {/* ═══ TRENDING ═══ */}
      {activeTab===8&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div><div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>🔥 TRENDING YOUTUBE</div>{lastUpdated&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginTop:4}}>Atualizado: {lastUpdated.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:activeNiches[0]?.name||"",subscribers:"",notes:""});setRefChannelModal(true);}} style={{...btnGhost,fontSize:11}}>+ Canal</button>
              <button onClick={fetchTrending} disabled={trendingLoading} style={{...btnGold,opacity:trendingLoading?.7:1}}>{trendingLoading?"BUSCANDO...":"🔄 ATUALIZAR AGORA"}</button>
            </div>
          </div>
          <div style={{display:"flex",gap:2,borderBottom:`1px solid ${BOR}`,marginBottom:20,overflowX:"auto"}}>
            {["brasil","mundial",...activeNiches.map(n=>n.name)].map(t=><button key={t} onClick={()=>setTrendingTab(t)} style={{fontFamily:"'DM Sans'",fontSize:12,color:trendingTab===t?ACCENT:MUTED,background:"transparent",border:"none",borderBottom:trendingTab===t?`2px solid ${ACCENT}`:"2px solid transparent",padding:"10px 14px",cursor:"pointer",whiteSpace:"nowrap",fontWeight:trendingTab===t?600:400}}>{t==="brasil"?"🇧🇷 Brasil":t==="mundial"?"🌍 Mundial":t}</button>)}
          </div>
          {(()=>{
            const list=trendingTab==="brasil"?trendingData.br:trendingTab==="mundial"?trendingData.global:trendingData.niches[trendingTab]||[];
            const virals=list.filter(v=>v.growth>50);
            if(trendingData.br.length===0&&trendingData.global.length===0)return(
              <div style={{...card,textAlign:"center",padding:48}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:MUTED,marginBottom:10}}>CONFIGURE A YOUTUBE API KEY</div>
                <div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,marginBottom:18}}>Adicione NEXT_PUBLIC_YOUTUBE_API_KEY no Vercel e clique em Atualizar.</div>
                <button onClick={fetchTrending} style={btnGold}>🔄 TENTAR BUSCAR</button>
              </div>
            );
            return(
              <div>
                {virals.length>0&&<div style={{...card,borderColor:`${RED}44`,marginBottom:18}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2,color:RED,marginBottom:10}}>🚀 VIRALIZANDO AGORA</div>
                  {virals.map(v=>(
                    <div key={v.id} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`1px solid ${BOR}`,alignItems:"center"}}>
                      {v.thumb&&<img src={v.thumb} alt="" style={{width:56,height:40,borderRadius:3,objectFit:"cover",flexShrink:0}}/>}
                      <div style={{flex:1,minWidth:0}}><a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{v.channel} · {v.views?.toLocaleString("pt-BR")} views</div></div>
                      <span style={{background:`${RED}20`,color:RED,borderRadius:4,padding:"2px 7px",fontFamily:"'IBM Plex Mono'",fontSize:11,fontWeight:600,flexShrink:0}}>🚀 +{v.growth}%</span>
                      <div style={{display:"flex",gap:5,flexShrink:0}}>
                        <button onClick={()=>saveQuickIdea(v.title)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>+ideia</button>
                        <button onClick={()=>setUseAsBaseModal(v)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:ACCENT,borderColor:`${ACCENT}33`}}>base</button>
                      </div>
                    </div>
                  ))}
                </div>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:11}}>
                  {list.map((v,i)=>(
                    <div key={v.id} style={{...card,display:"flex",gap:10,marginBottom:0,alignItems:"flex-start"}} className="hc">
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:HINT,width:26,flexShrink:0,marginTop:4}}>{i+1}</span>
                      {v.thumb&&<img src={v.thumb} alt="" style={{width:76,height:56,borderRadius:5,objectFit:"cover",flexShrink:0}}/>}
                      <div style={{flex:1,minWidth:0}}>
                        <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,color:TEXT,textDecoration:"none",display:"block",lineHeight:1.4,marginBottom:4}}>{v.title}</a>
                        <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:5}}>{v.channel} · {v.views?.toLocaleString("pt-BR")} views</div>
                        {v.growth>0&&<span style={{background:`${v.growth>50?RED:v.growth>20?ACCENT:GREEN}20`,color:v.growth>50?RED:v.growth>20?ACCENT:GREEN,borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:600,display:"inline-block",marginBottom:5}}>🚀 +{v.growth}%</span>}
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          <button onClick={()=>saveQuickIdea(v.title)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>+ ideia</button>
                          <button onClick={()=>setUseAsBaseModal(v)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:ACCENT,borderColor:`${ACCENT}33`}}>usar como base</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {list.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:MUTED,fontFamily:"'DM Sans'",fontSize:13}}>Clique em "Atualizar Agora" para buscar.</div>}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      </div>{/* /content */}

      {/* FAB */}
      <button onClick={()=>setQuickCapture(true)} style={{position:"fixed",bottom:26,right:26,width:50,height:50,borderRadius:"50%",background:ACCENT,color:"#111",border:"none",cursor:"pointer",fontSize:22,fontWeight:700,boxShadow:`0 4px 18px ${ACCENT}50`,zIndex:100}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>+</button>

      {/* ═══ MODAIS ═══ */}

      {/* Quick capture */}
      {quickCapture&&<div onClick={e=>e.target===e.currentTarget&&setQuickCapture(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:400,padding:26}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,marginBottom:14}}>CAPTURA RÁPIDA</div><textarea value={quickText} onChange={e=>setQuickText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&saveQuickCapture()} placeholder="Ideia, tarefa, pensamento..." style={{...inp,minHeight:70,marginBottom:12}} autoFocus/><div style={{display:"flex",gap:7,marginBottom:14}}>{[["idea","💡 Ideia"],["task","✓ Tarefa"]].map(([v,l])=><button key={v} onClick={()=>setQuickDest(v)} style={{...btnGhost,flex:1,color:quickDest===v?ACCENT:MUTED,borderColor:quickDest===v?`${ACCENT}44`:BOR,background:quickDest===v?`${ACCENT}10`:undefined}}>{l}</button>)}</div><button onClick={saveQuickCapture} style={{...btnGold,width:"100%"}}>SALVAR → ENTER</button></div></div>}

      {/* Task modal */}
      {taskModal&&taskEdit&&<div onClick={e=>e.target===e.currentTarget&&(setTaskModal(false),setTaskEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:520,padding:26,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{taskEdit.id?"EDITAR TAREFA":"NOVA TAREFA"}</div><button onClick={()=>{setTaskModal(false);setTaskEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Título</span><input value={taskEdit.title||""} onChange={e=>setTaskEdit({...taskEdit,title:e.target.value})} style={inp}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{marginBottom:12}}><span style={lbl}>Cliente</span><select value={taskEdit.client_id||""} onChange={e=>setTaskEdit({...taskEdit,client_id:e.target.value})} style={inp}><option value="">Sem cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div style={{marginBottom:12}}><span style={lbl}>Tipo</span><select value={taskEdit.type||"Roteiro"} onChange={e=>setTaskEdit({...taskEdit,type:e.target.value})} style={inp}>{TASK_TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div style={{marginBottom:12}}><span style={lbl}>Urgência</span><select value={taskEdit.urgency||"normal"} onChange={e=>setTaskEdit({...taskEdit,urgency:e.target.value})} style={inp}><option value="normal">Normal</option><option value="warn">Atenção</option><option value="hot">Urgente 🔥</option></select></div><div style={{marginBottom:12}}><span style={lbl}>Horas est.</span><input type="number" value={taskEdit.estimated_hours||1} step="0.5" min="0.5" onChange={e=>setTaskEdit({...taskEdit,estimated_hours:parseFloat(e.target.value)||1})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Deadline</span><input type="date" value={taskEdit.deadline||""} onChange={e=>setTaskEdit({...taskEdit,deadline:e.target.value})} style={inp}/></div></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={taskEdit.notes||""} onChange={e=>setTaskEdit({...taskEdit,notes:e.target.value})} style={{...inp,minHeight:55}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setTaskModal(false);setTaskEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveTask} style={btnGold}>SALVAR</button></div></div></div>}

      {/* Client modal */}
      {clientModal&&clientEdit&&<div onClick={e=>e.target===e.currentTarget&&(setClientModal(false),setClientEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:480,padding:26,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{clientEdit.id?"EDITAR CLIENTE":"NOVO CLIENTE"}</div><button onClick={()=>{setClientModal(false);setClientEdit(null);}} style={btnGhost}>✕</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{marginBottom:12}}><span style={lbl}>Nome</span><input value={clientEdit.name||""} onChange={e=>setClientEdit({...clientEdit,name:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Cor</span><input type="color" value={clientEdit.color||ACCENT} onChange={e=>setClientEdit({...clientEdit,color:e.target.value})} style={{...inp,padding:4,height:38}}/></div><div style={{marginBottom:12}}><span style={lbl}>Tipo</span><input value={clientEdit.type||""} onChange={e=>setClientEdit({...clientEdit,type:e.target.value})} placeholder="YouTube, Podcast..." style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Cadência</span><input value={clientEdit.frequency||""} onChange={e=>setClientEdit({...clientEdit,frequency:e.target.value})} placeholder="3x semana" style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Valor do contrato (R$)</span><input type="number" value={clientEdit.contract_value||0} onChange={e=>setClientEdit({...clientEdit,contract_value:parseFloat(e.target.value)||0})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>R$/hora ideal</span><input type="number" value={clientEdit.rate_per_hour||0} onChange={e=>setClientEdit({...clientEdit,rate_per_hour:parseFloat(e.target.value)||0})} style={inp}/></div></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={clientEdit.notes||""} onChange={e=>setClientEdit({...clientEdit,notes:e.target.value})} style={{...inp,minHeight:55}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setClientModal(false);setClientEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveClient} style={btnGold}>SALVAR</button></div></div></div>}

      {/* Invoice modal */}
      {invoiceModal&&invoiceEdit&&<div onClick={e=>e.target===e.currentTarget&&(setInvoiceModal(false),setInvoiceEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:480,padding:26,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{invoiceEdit.id?"EDITAR NF":"NOVA NF"}</div><button onClick={()=>{setInvoiceModal(false);setInvoiceEdit(null);}} style={btnGhost}>✕</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{marginBottom:12}}><span style={lbl}>Cliente</span><select value={invoiceEdit.client_id||""} onChange={e=>setInvoiceEdit({...invoiceEdit,client_id:e.target.value})} style={inp}><option value="">Selecionar...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div style={{marginBottom:12}}><span style={lbl}>Número NF</span><input value={invoiceEdit.number||""} onChange={e=>setInvoiceEdit({...invoiceEdit,number:e.target.value})} placeholder="NF-001" style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Valor (R$)</span><input type="number" value={invoiceEdit.amount||0} step="0.01" onChange={e=>setInvoiceEdit({...invoiceEdit,amount:parseFloat(e.target.value)||0})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Status</span><select value={invoiceEdit.status||"pendente"} onChange={e=>setInvoiceEdit({...invoiceEdit,status:e.target.value})} style={inp}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="vencido">Vencido</option><option value="cancelado">Cancelado</option></select></div><div style={{marginBottom:12}}><span style={lbl}>Emissão</span><input type="date" value={invoiceEdit.issued_date||""} onChange={e=>setInvoiceEdit({...invoiceEdit,issued_date:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Vencimento</span><input type="date" value={invoiceEdit.due_date||""} onChange={e=>setInvoiceEdit({...invoiceEdit,due_date:e.target.value})} style={inp}/></div></div><div style={{marginBottom:12}}><span style={lbl}>Descrição</span><input value={invoiceEdit.description||""} onChange={e=>setInvoiceEdit({...invoiceEdit,description:e.target.value})} placeholder="Produção de conteúdo..." style={inp}/></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={invoiceEdit.notes||""} onChange={e=>setInvoiceEdit({...invoiceEdit,notes:e.target.value})} style={{...inp,minHeight:50}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setInvoiceModal(false);setInvoiceEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveInvoice} style={btnGold}>SALVAR</button></div></div></div>}

      {/* Library modal */}
      {libModal&&libEdit&&<div onClick={e=>e.target===e.currentTarget&&(setLibModal(false),setLibEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:480,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{libEdit.id?"EDITAR":"NOVO ITEM"}</div><button onClick={()=>{setLibModal(false);setLibEdit(null);}} style={btnGhost}>✕</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><span style={lbl}>Tipo</span><select value={libEdit.type||"hook"} onChange={e=>setLibEdit({...libEdit,type:e.target.value})} style={inp}>{["hook","titulo","cta","thumbnail","template"].map(t=><option key={t}>{t}</option>)}</select></div><div><span style={lbl}>Nicho</span><select value={libEdit.niche||""} onChange={e=>setLibEdit({...libEdit,niche:e.target.value})} style={inp}><option value="">Geral</option>{activeNiches.map(n=><option key={n.id}>{n.name}</option>)}</select></div></div><div style={{marginBottom:14}}><span style={lbl}>Conteúdo</span><textarea value={libEdit.content||""} onChange={e=>setLibEdit({...libEdit,content:e.target.value})} style={{...inp,minHeight:90}} placeholder="Hook, título, CTA..."/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setLibModal(false);setLibEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveLib} style={btnGold}>SALVAR</button></div></div></div>}

      {/* Goal modal */}
      {goalModal&&goalEdit&&<div onClick={e=>e.target===e.currentTarget&&(setGoalModal(false),setGoalEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:460,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>NOVA META</div><button onClick={()=>{setGoalModal(false);setGoalEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Título da meta</span><input value={goalEdit.title||""} onChange={e=>setGoalEdit({...goalEdit,title:e.target.value})} placeholder="Ex: 100k inscritos no Waldemar" style={inp}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><span style={lbl}>Tipo</span><select value={goalEdit.type||"videos_mes"} onChange={e=>setGoalEdit({...goalEdit,type:e.target.value})} style={inp}>{Object.entries(GOAL_TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div><div><span style={lbl}>Horizonte</span><select value={goalEdit.horizon||"curto"} onChange={e=>setGoalEdit({...goalEdit,horizon:e.target.value})} style={inp}><option value="curto">Curto Prazo</option><option value="medio">Médio Prazo</option><option value="longo">Longo Prazo</option></select></div><div><span style={lbl}>Valor alvo</span><input type="number" value={goalEdit.target_value||0} onChange={e=>setGoalEdit({...goalEdit,target_value:parseFloat(e.target.value)||0})} style={inp}/></div><div><span style={lbl}>Valor atual</span><input type="number" value={goalEdit.current_value||0} onChange={e=>setGoalEdit({...goalEdit,current_value:parseFloat(e.target.value)||0})} style={inp}/></div><div><span style={lbl}>Data alvo</span><input type="date" value={goalEdit.target_date||""} onChange={e=>setGoalEdit({...goalEdit,target_date:e.target.value})} style={inp}/></div><div><span style={lbl}>Cliente/Projeto</span><select value={goalEdit.client_id||""} onChange={e=>setGoalEdit({...goalEdit,client_id:e.target.value||null})} style={inp}><option value="">Pessoal</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={goalEdit.notes||""} onChange={e=>setGoalEdit({...goalEdit,notes:e.target.value})} style={{...inp,minHeight:50}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setGoalModal(false);setGoalEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveGoal} style={btnGold}>SALVAR</button></div></div></div>}

      {/* Lead modal */}
      {leadModal&&leadEdit&&<div onClick={e=>e.target===e.currentTarget&&(setLeadModal(false),setLeadEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:480,padding:26,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{leadEdit.id?"EDITAR LEAD":"NOVO LEAD"}</div><button onClick={()=>{setLeadModal(false);setLeadEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Nome</span><input value={leadEdit.name||""} onChange={e=>setLeadEdit({...leadEdit,name:e.target.value})} style={inp}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{marginBottom:12}}><span style={lbl}>Contato</span><input value={leadEdit.contact||""} onChange={e=>setLeadEdit({...leadEdit,contact:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Serviço</span><input value={leadEdit.service||""} onChange={e=>setLeadEdit({...leadEdit,service:e.target.value})} placeholder="Gestão de canal..." style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Valor proposto (R$)</span><input type="number" value={leadEdit.proposed_value||0} onChange={e=>setLeadEdit({...leadEdit,proposed_value:parseFloat(e.target.value)||0})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Status</span><select value={leadEdit.status||"novo"} onChange={e=>setLeadEdit({...leadEdit,status:e.target.value})} style={inp}>{["novo","proposta_enviada","em_negociacao","fechado","perdido"].map(s=><option key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}</select></div><div style={{marginBottom:12}}><span style={lbl}>Último contato</span><input type="date" value={leadEdit.last_contact||""} onChange={e=>setLeadEdit({...leadEdit,last_contact:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Follow-up em</span><input type="date" value={leadEdit.follow_up_date||""} onChange={e=>setLeadEdit({...leadEdit,follow_up_date:e.target.value})} style={inp}/></div></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={leadEdit.notes||""} onChange={e=>setLeadEdit({...leadEdit,notes:e.target.value})} style={{...inp,minHeight:60}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setLeadModal(false);setLeadEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveLead} style={btnGold}>SALVAR</button></div></div></div>}

      {/* Idea modal */}
      {ideaModal&&ideaEdit&&<div onClick={e=>e.target===e.currentTarget&&(setIdeaModal(false),setIdeaEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:460,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{ideaEdit.id?"EDITAR IDEIA":"NOVA IDEIA"}</div><button onClick={()=>{setIdeaModal(false);setIdeaEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Título</span><input value={ideaEdit.title||""} onChange={e=>setIdeaEdit({...ideaEdit,title:e.target.value})} placeholder="Título da ideia..." style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Nicho</span><select value={ideaEdit.niche||""} onChange={e=>setIdeaEdit({...ideaEdit,niche:e.target.value})} style={inp}><option value="">Geral</option>{activeNiches.map(n=><option key={n.id}>{n.name}</option>)}</select></div><div style={{marginBottom:14}}><span style={lbl}>Descrição / Notas</span><textarea value={ideaEdit.description||""} onChange={e=>setIdeaEdit({...ideaEdit,description:e.target.value})} placeholder="Detalhes, ângulo, referências..." style={{...inp,minHeight:80}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setIdeaModal(false);setIdeaEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveIdeaEdit} style={btnGold}>SALVAR</button></div></div></div>}

      {/* Niche modal */}
      {nicheModal&&nicheEdit&&<div onClick={e=>e.target===e.currentTarget&&(setNicheModal(false),setNicheEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:440,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{nicheEdit.id?"EDITAR NICHO":"NOVO NICHO"}</div><button onClick={()=>{setNicheModal(false);setNicheEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Nome do nicho</span><input value={nicheEdit.name||""} onChange={e=>setNicheEdit({...nicheEdit,name:e.target.value})} placeholder="Ex: True Crime" style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Palavra-chave para busca (YouTube)</span><input value={nicheEdit.keyword||""} onChange={e=>setNicheEdit({...nicheEdit,keyword:e.target.value})} placeholder="Ex: crime real investigação" style={inp}/></div><div style={{marginBottom:14}}><span style={lbl}>CPM estimado</span><input value={nicheEdit.cpm||""} onChange={e=>setNicheEdit({...nicheEdit,cpm:e.target.value})} placeholder="Ex: $6–11" style={inp}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setNicheModal(false);setNicheEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveNiche} style={btnGold}>SALVAR</button></div></div></div>}

      {/* Ref channel modal */}
      {refChannelModal&&refChannelEdit&&<div onClick={e=>e.target===e.currentTarget&&(setRefChannelModal(false),setRefChannelEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:460,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{refChannelEdit.id?"EDITAR CANAL":"NOVO CANAL"}</div><button onClick={()=>{setRefChannelModal(false);setRefChannelEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Nome</span><input value={refChannelEdit.name||""} onChange={e=>setRefChannelEdit({...refChannelEdit,name:e.target.value})} style={inp}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><span style={lbl}>Nicho</span><select value={refChannelEdit.niche||""} onChange={e=>setRefChannelEdit({...refChannelEdit,niche:e.target.value})} style={inp}><option value="">Selecionar...</option>{niches.map(n=><option key={n.id}>{n.name}</option>)}</select></div><div><span style={lbl}>Inscritos</span><input value={refChannelEdit.subscribers||""} onChange={e=>setRefChannelEdit({...refChannelEdit,subscribers:e.target.value})} placeholder="Ex: 14M" style={inp}/></div></div><div style={{marginBottom:12}}><span style={lbl}>URL do canal</span><input value={refChannelEdit.url||""} onChange={e=>setRefChannelEdit({...refChannelEdit,url:e.target.value})} placeholder="https://youtube.com/@canal" style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Channel ID (para API)</span><input value={refChannelEdit.channel_id||""} onChange={e=>setRefChannelEdit({...refChannelEdit,channel_id:e.target.value})} placeholder="UCxxxxxxxxxx" style={inp}/></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={refChannelEdit.notes||""} onChange={e=>setRefChannelEdit({...refChannelEdit,notes:e.target.value})} style={{...inp,minHeight:55}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setRefChannelModal(false);setRefChannelEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveRefChannel} style={btnGold}>SALVAR</button></div></div></div>}

      {/* Use as base modal */}
      {useAsBaseModal&&<div onClick={e=>e.target===e.currentTarget&&setUseAsBaseModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:480,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>USAR COMO BASE</div><button onClick={()=>setUseAsBaseModal(null)} style={btnGhost}>✕</button></div><div style={{display:"flex",gap:12,marginBottom:18}}>{useAsBaseModal.thumb&&<img src={useAsBaseModal.thumb} alt="" style={{width:96,height:68,borderRadius:5,objectFit:"cover",flexShrink:0}}/>}<div style={{flex:1}}><div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,marginBottom:3,lineHeight:1.4}}>{useAsBaseModal.title}</div><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:3}}>{useAsBaseModal.channel}</div>{useAsBaseModal.views>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT}}>{useAsBaseModal.views?.toLocaleString("pt-BR")} views</div>}<a href={useAsBaseModal.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,color:BLUE,display:"block",marginTop:4}}>▶ Assistir no YouTube</a></div></div><div style={{marginBottom:16}}><span style={lbl}>Nicho</span><select value={useAsBaseModal.niche||activeNiches[0]?.name||""} onChange={e=>setUseAsBaseModal({...useAsBaseModal,niche:e.target.value})} style={inp}>{activeNiches.map(n=><option key={n.id}>{n.name}</option>)}</select></div><div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,marginBottom:14,padding:"9px 12px",background:BG3,borderRadius:6}}>Vai criar um vídeo na coluna <span style={{color:ACCENT,fontWeight:600}}>Roteiro</span> com esse vídeo como referência.</div><div style={{display:"flex",gap:9}}><button onClick={()=>setUseAsBaseModal(null)} style={btnGhost}>Cancelar</button><button onClick={()=>useVideoAsBase(useAsBaseModal,useAsBaseModal.niche)} style={{...btnGold,flex:1}}>🎬 CRIAR NO PIPELINE</button></div></div></div>}

      {/* Video detail modal */}
      {videoDetailModal&&<div onClick={e=>e.target===e.currentTarget&&setVideoDetailModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:150,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}><div style={{background:BG2,borderLeft:`1px solid ${BOR2}`,width:"100%",maxWidth:660,height:"100vh",overflowY:"auto",padding:30}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
          <div style={{flex:1,marginRight:14}}><input value={videoDetailModal.meu_titulo||videoDetailModal.title||""} onChange={e=>setVideoDetailModal({...videoDetailModal,meu_titulo:e.target.value})} style={{...inp,fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1,background:"transparent",border:"none",borderBottom:`1px solid ${BOR2}`,borderRadius:0,padding:"3px 0",width:"100%"}} placeholder="Título do vídeo..."/></div>
          <div style={{display:"flex",gap:7,flexShrink:0}}>
            {videoDetailModal.id?<button onClick={()=>saveVideoDetail(videoDetailModal)} style={btnGold}>💾 SALVAR</button>:<button onClick={()=>createVideo(videoDetailModal)} style={btnGold}>🎬 CRIAR</button>}
            <button onClick={()=>setVideoDetailModal(null)} style={btnGhost}>✕</button>
          </div>
        </div>
        <div style={{marginBottom:18}}><span style={lbl}>Etapa no pipeline</span><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{PIPELINE.map(s=>{const color=PIPELINE_COLORS[s];const active=videoDetailModal.status===s;return(<button key={s} onClick={()=>setVideoDetailModal({...videoDetailModal,status:s})} style={{...btnGhost,fontSize:11,padding:"4px 10px",color:active?color:MUTED,borderColor:active?`${color}55`:BOR,background:active?`${color}12`:undefined,fontWeight:active?600:400}}>{active?"● ":""}{s}</button>);})}</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          <div><span style={lbl}>Nicho</span><select value={videoDetailModal.niche||""} onChange={e=>setVideoDetailModal({...videoDetailModal,niche:e.target.value})} style={inp}>{activeNiches.map(n=><option key={n.id}>{n.name}</option>)}</select></div>
          <div><span style={lbl}>Data publicação</span><input type="date" value={videoDetailModal.publish_date||""} onChange={e=>setVideoDetailModal({...videoDetailModal,publish_date:e.target.value})} style={inp}/></div>
          <div><span style={lbl}>Plataformas</span><div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:4}}>{["YouTube","Instagram","TikTok","Shorts"].map(p=>{const plats=videoDetailModal.platforms||[];const active=plats.includes(p);return<button key={p} onClick={()=>setVideoDetailModal({...videoDetailModal,platforms:active?plats.filter(x=>x!==p):[...plats,p]})} style={{...btnGhost,padding:"2px 6px",fontSize:10,color:active?ACCENT:MUTED,borderColor:active?`${ACCENT}44`:BOR,background:active?`${ACCENT}10`:undefined}}>{p}</button>;})}</div></div>
        </div>
        {videoDetailModal.ref_url&&<div style={{...card,marginBottom:16,borderColor:`${BLUE}33`}}><span style={{...lbl,color:BLUE}}>📎 REFERÊNCIA</span><div style={{display:"flex",gap:10}}>{videoDetailModal.ref_thumb&&<img src={videoDetailModal.ref_thumb} alt="" style={{width:96,height:68,borderRadius:5,objectFit:"cover",flexShrink:0}}/>}<div style={{flex:1}}><a href={videoDetailModal.ref_url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,color:TEXT,textDecoration:"none",display:"block",marginBottom:3}}>{videoDetailModal.ref_titulo}</a><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{videoDetailModal.ref_canal}</div>{videoDetailModal.ref_views>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT}}>{videoDetailModal.ref_views?.toLocaleString("pt-BR")} views</div>}</div></div></div>}
        <div style={{marginBottom:14}}><span style={lbl}>Meu título</span><input value={videoDetailModal.meu_titulo||""} onChange={e=>setVideoDetailModal({...videoDetailModal,meu_titulo:e.target.value})} placeholder="Título otimizado para YouTube..." style={inp}/></div>
        <div style={{marginBottom:14}}><span style={lbl}>Ideia de thumbnail</span><textarea value={videoDetailModal.minha_thumbnail||""} onChange={e=>setVideoDetailModal({...videoDetailModal,minha_thumbnail:e.target.value})} placeholder="Descreva a ideia: cores, texto, imagem, estilo..." style={{...inp,minHeight:55}}/></div>
        <div style={{marginBottom:14}}><span style={lbl}>Transcrição (referência)</span><textarea value={videoDetailModal.transcricao||""} onChange={e=>setVideoDetailModal({...videoDetailModal,transcricao:e.target.value})} placeholder="Cole a transcrição do vídeo de referência..." style={{...inp,minHeight:110}}/></div>
        <div style={{marginBottom:14}}><span style={lbl}>Meu roteiro</span><textarea value={videoDetailModal.meu_roteiro||""} onChange={e=>setVideoDetailModal({...videoDetailModal,meu_roteiro:e.target.value})} placeholder="Escreva seu roteiro adaptado..." style={{...inp,minHeight:180}}/></div>
        <div style={{marginBottom:14}}><span style={lbl}>Descrição YouTube</span><textarea value={videoDetailModal.descricao_yt||""} onChange={e=>setVideoDetailModal({...videoDetailModal,descricao_yt:e.target.value})} placeholder="Descrição com timestamps, links, hashtags..." style={{...inp,minHeight:90}}/></div>
        <div style={{marginBottom:14}}><span style={lbl}>Hook (abertura)</span><input value={videoDetailModal.hook||""} onChange={e=>setVideoDetailModal({...videoDetailModal,hook:e.target.value})} placeholder="Em 1999, Joan Murray saltou de um avião..." style={inp}/></div>
        <div style={{marginBottom:14}}><span style={lbl}>📁 Link Drive — Locução em off</span><input value={videoDetailModal.drive_locuçao||""} onChange={e=>setVideoDetailModal({...videoDetailModal,drive_locuçao:e.target.value})} placeholder="https://drive.google.com/..." style={inp}/></div>
        <div style={{marginBottom:22}}><span style={lbl}>Notas</span><textarea value={videoDetailModal.notes||""} onChange={e=>setVideoDetailModal({...videoDetailModal,notes:e.target.value})} style={{...inp,minHeight:55}}/></div>
        <div style={{display:"flex",gap:9,paddingTop:14,borderTop:`1px solid ${BOR}`}}>
          {videoDetailModal.id?<><button onClick={()=>saveVideoDetail(videoDetailModal)} style={{...btnGold,flex:1}}>💾 SALVAR</button><button onClick={()=>openScript(videoDetailModal)} style={{...btnGhost,color:ACCENT,borderColor:`${ACCENT}44`}}>📄 Roteiro Joan</button><button onClick={()=>deleteVideo(videoDetailModal.id)} style={{...btnGhost,color:RED,borderColor:`${RED}33`}}>🗑</button></>:<button onClick={()=>createVideo(videoDetailModal)} style={{...btnGold,flex:1}}>🎬 CRIAR NO PIPELINE</button>}
        </div>
      </div></div>}

      {/* Approval modal */}
      {approvalModal&&<div onClick={e=>e.target===e.currentTarget&&setApprovalModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:`1px solid ${BOR2}`,borderRadius:12,width:"100%",maxWidth:460,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>LINK DE APROVAÇÃO</div><button onClick={()=>setApprovalModal(null)} style={btnGhost}>✕</button></div><div style={{background:BG3,border:`1px solid ${BOR}`,borderRadius:7,padding:"10px 12px",fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT,wordBreak:"break-all",marginBottom:14}}>{typeof window!=="undefined"?`${window.location.origin}/aprovacao/${approvalModal.approval_token}`:""}</div><button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/aprovacao/${approvalModal.approval_token}`);flash();}} style={{...btnGold,width:"100%"}}>📋 COPIAR LINK</button></div></div>}

      {/* Script modal */}
      {scriptModal&&scriptData&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:200,overflowY:"auto"}}><div style={{maxWidth:880,margin:"0 auto",padding:"28px 20px"}}>
        <div style={{marginBottom:22}}><div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>ROTEIRO FACELESS — NANO BANANA 2</div><div style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:-0.5,lineHeight:1,marginBottom:12}}>{scriptData.meu_titulo||scriptData.title}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["YouTube · 8–10 min","Reels · 60–75s","Faceless","Narração em off"].map(t=><div key={t} style={{border:`1px solid ${BOR}`,borderRadius:5,padding:"4px 10px",fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{t}</div>)}</div></div>
        <div style={{display:"flex",gap:2,borderBottom:`1px solid ${BOR}`,marginBottom:20}}>
          {["youtube","reels"].map(t=><button key={t} onClick={()=>{}} style={{background:"transparent",border:"none",borderBottom:t==="youtube"?`2px solid ${ACCENT}`:"2px solid transparent",color:t==="youtube"?ACCENT:MUTED,padding:"9px 18px",cursor:"pointer",fontFamily:"'DM Sans'",fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{t==="youtube"?"YOUTUBE":"REELS / SHORTS"}</button>)}
          <div style={{flex:1}}/>
          <button onClick={saveScript} style={{...btnGold,marginBottom:4}}>💾 SALVAR</button>
          <button onClick={()=>setScriptModal(false)} style={{...btnGhost,marginBottom:4,marginLeft:7}}>✕ FECHAR</button>
        </div>
        <div style={{...card,marginBottom:20}}><div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>ÂNGULOS</div><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>{CAMERA_ANGLES.map((a,i)=><div key={a} style={{display:"flex",alignItems:"center",gap:5,fontFamily:"'IBM Plex Mono'",fontSize:11,color:MUTED}}><span style={{width:18,height:18,border:`1.5px solid ${[ACCENT,BLUE,RED,GREEN,PURP,ACCENT][i]}`,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:[ACCENT,BLUE,RED,GREEN,PURP,ACCENT][i],fontWeight:700}}>{a}</span>{ANGLE_LABELS[a]}</div>)}</div></div>
        {SCRIPT_SECTIONS.map(section=>{
          const sTakes=scriptTakes.filter(t=>t.section===section);
          return(<div key={section} style={{marginBottom:32}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><div style={{fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:-0.5}}>{section}</div>{sTakes.length>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{sTakes[0]?.startTime} — {sTakes[sTakes.length-1]?.endTime}</div>}</div>
            <div style={{borderTop:`1px solid ${BOR}`,marginBottom:12}}/>
            {sTakes.map(take=>(
              <div key={take.id} style={{display:"grid",gridTemplateColumns:"105px 1fr",marginBottom:10,border:`1px solid ${BOR}`,borderRadius:9,overflow:"hidden"}}>
                <div style={{background:BG3,padding:"12px 9px",display:"flex",flexDirection:"column",gap:7,borderRight:`1px solid ${BOR}`}}>
                  <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>T-{String(scriptTakes.indexOf(take)+1).padStart(2,"0")}</div>
                  <input value={take.startTime||""} onChange={e=>updateTake(take.id,"startTime",e.target.value)} style={{...inp,background:"transparent",border:"none",color:ACCENT,fontFamily:"'Bebas Neue'",fontSize:15,fontWeight:600,padding:0,width:"80px"}} placeholder="00:00"/>
                  <input value={take.endTime||""} onChange={e=>updateTake(take.id,"endTime",e.target.value)} style={{...inp,background:"transparent",border:"none",color:ACCENT,fontFamily:"'Bebas Neue'",fontSize:15,fontWeight:600,padding:0,width:"80px"}} placeholder="00:07"/>
                  <select value={take.angle||"A"} onChange={e=>updateTake(take.id,"angle",e.target.value)} style={{...inp,background:BG3,padding:"2px 4px",fontSize:10,fontFamily:"'IBM Plex Mono'",width:65}}>{CAMERA_ANGLES.map(a=><option key={a}>ANG-{a}</option>)}</select>
                  <button onClick={()=>deleteTake(take.id)} style={{...btnGhost,padding:"2px 5px",fontSize:10,color:RED,borderColor:`${RED}44`,marginTop:"auto"}}>✕</button>
                </div>
                <div style={{background:CARD,padding:"12px 16px"}}>
                  <div style={{background:`${SECTION_COLORS[section]}20`,border:`1px solid ${SECTION_COLORS[section]}44`,borderRadius:3,padding:"1px 7px",display:"inline-block",fontFamily:"'IBM Plex Mono'",fontSize:10,color:SECTION_COLORS[section],marginBottom:10,letterSpacing:1}}>{section}</div>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>NARRAÇÃO</div>
                  <textarea value={take.narration||""} onChange={e=>updateTake(take.id,"narration",e.target.value)} placeholder="Narração em off..." style={{...inp,background:"transparent",border:"none",borderLeft:`2px solid ${BOR}`,borderRadius:0,padding:"4px 0 4px 10px",fontStyle:"italic",fontSize:13,minHeight:55,lineHeight:1.7}}/>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:5,marginTop:10}}>VISUAL</div>
                  <textarea value={take.visual||""} onChange={e=>updateTake(take.id,"visual",e.target.value)} placeholder="Descreva a cena..." style={{...inp,background:"transparent",border:"none",borderLeft:`2px solid ${BOR}`,borderRadius:0,padding:"4px 0 4px 10px",fontSize:12,minHeight:45,lineHeight:1.7}}/>
                  <div style={{background:`${GREEN}08`,border:`1px solid ${GREEN}22`,borderRadius:7,padding:"9px 10px",marginTop:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{width:6,height:6,borderRadius:"50%",background:GREEN,display:"inline-block"}}/><span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:GREEN,letterSpacing:1}}>PROMPT NANO BANANA 2</span></div>
                    <textarea value={take.prompt||""} onChange={e=>updateTake(take.id,"prompt",e.target.value)} placeholder="Fisheye POV shot looking straight up..." style={{...inp,background:"transparent",border:"none",color:GREEN,fontFamily:"'IBM Plex Mono'",fontSize:10,minHeight:55,lineHeight:1.6,padding:0}}/>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={()=>{const last=scriptTakes[scriptTakes.length-1];setScriptTakes(prev=>[...prev,{id:Date.now(),section,startTime:last?.endTime||"00:00",endTime:"",angle:"A",narration:"",visual:"",prompt:""}]);}} style={{...btnGhost,fontSize:11,color:SECTION_COLORS[section],borderColor:`${SECTION_COLORS[section]}44`}}>+ Take em {section}</button>
          </div>);
        })}
        <div style={{display:"flex",gap:9,marginTop:16,paddingTop:16,borderTop:`1px solid ${BOR}`}}><button onClick={()=>setScriptTakes(prev=>[...prev,{id:Date.now(),section:"GANCHO",startTime:"",endTime:"",angle:"A",narration:"",visual:"",prompt:""}])} style={btnGhost}>+ Take</button><button onClick={saveScript} style={btnGold}>💾 SALVAR ROTEIRO</button><button onClick={()=>setScriptModal(false)} style={{...btnGhost,marginLeft:"auto"}}>✕ FECHAR</button></div>
      </div></div>}

      {/* Confetti */}
      {confetti&&(
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999}}>
          {Array.from({length:20},(_,i)=>(
            <div key={i} style={{position:"absolute",left:(Math.random()*100)+"vw",top:"-10px",width:7,height:7,borderRadius:2,background:[ACCENT,GREEN,BLUE,RED,PURP][i%5],animation:"cf "+(1+Math.random())+"s ease-in "+(Math.random()*.5)+"s forwards"}}/>
          ))}
          <style dangerouslySetInnerHTML={{__html:"@keyframes cf{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}"}}/>
        </div>
      )}

    </div>
  );
}
