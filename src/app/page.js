"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

const BG="#1C1C1E",BG2="#232325",BG3="#2A2A2D",CARD="#2C2C2F";
const BOR="rgba(255,255,255,0.09)",BOR2="rgba(255,255,255,0.16)";
const TEXT="#F5F5F5",MUTED="#8A8A8E",HINT="#4A4A4E";
const ACCENT="#FBBF24",GREEN="#10B981",RED="#EF4444",BLUE="#60A5FA",PURP="#8B5CF6",ORANGE="#FB923C";
const card={background:CARD,border:"1px solid "+BOR,borderRadius:10,padding:18,marginBottom:10};
const lbl={color:MUTED,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:6,fontFamily:"'DM Sans'",display:"block"};
const inp={background:BG3,border:"1px solid "+BOR,borderRadius:6,color:TEXT,padding:"8px 12px",fontFamily:"'DM Sans'",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"};
const btnGold={background:ACCENT,color:"#111",border:"none",borderRadius:6,padding:"8px 18px",cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1};
const btnGhost={background:"transparent",color:MUTED,border:"1px solid "+BOR,borderRadius:6,padding:"8px 18px",cursor:"pointer",fontFamily:"'DM Sans'",fontSize:13};

const TABS=["🏠 Dashboard","⚡ Focus OS","🎯 Metas","📅 Agenda","🎬 Canais Dark","⭐ Sr. Waldemar","◈ Clientes","💰 Finanças","📚 Biblioteca","🔥 Trending"];
const PIPELINE=["Roteiro","Locução","Geração de Imagens","Edição","Thumb e Título","Postagem"];
const PIPELINE_COLORS={"Roteiro":ACCENT,"Locução":BLUE,"Geração de Imagens":PURP,"Edição":RED,"Thumb e Título":ORANGE,"Postagem":GREEN};
const TASK_TYPES=["Roteiro","Gravação","Edição","Thumbnail","Revisão","Upload","Reunião","Pesquisa","Postagem"];
const SCRIPT_SECTIONS=["GANCHO","CONSTRUÇÃO","A VIRADA","DESENVOLVIMENTO","DESFECHO","CTA"];
const SECTION_COLORS={"GANCHO":"#F59E0B","CONSTRUÇÃO":ACCENT,"A VIRADA":BLUE,"DESENVOLVIMENTO":PURP,"DESFECHO":GREEN,"CTA":TEXT};
const GOAL_TYPE_LABELS={"videos_mes":"Vídeos/mês","seguidores":"Seguidores","adsense_mes":"AdSense/mês","faturamento_mes":"Faturamento/mês","clientes":"Nº de clientes","views_mes":"Views/mês","personalizada":"Personalizada"};
const YT_BENCH={cpm_br:8,views_per_video:5000,subs_per_1k:0.8};
const DEFAULT_NICHES=[{name:"Curiosidades Gerais",keyword:"curiosidades fatos incríveis",cpm:"$4–8",active:true},{name:"Psicologia & Comportamento",keyword:"psicologia comportamento humano",cpm:"$8–15",active:true},{name:"Mistério & Paranormal",keyword:"misterio paranormal sobrenatural",cpm:"$5–9",active:true},{name:"True Crime",keyword:"crime real investigação",cpm:"$6–11",active:true},{name:"História Sombria",keyword:"historia sombria chocante",cpm:"$7–13",active:true},{name:"Ciência Sombria",keyword:"ciencia sombria experimentos",cpm:"$8–14",active:true},{name:"Filosofia Existencial",keyword:"filosofia existencial vida",cpm:"$10–18",active:true},{name:"Lendas Urbanas BR",keyword:"lendas urbanas brasil",cpm:"$4–7",active:true}];
const FLAMENGO_CATEGORIES=[{name:"História",icon:"📜",color:RED},{name:"Jogadores Lendários",icon:"⚽",color:ACCENT},{name:"Partidas Históricas",icon:"🏆",color:GREEN},{name:"Mascote & Símbolos",icon:"🦅",color:ORANGE},{name:"Fundação & Origem",icon:"🏛",color:BLUE},{name:"Rivalidades",icon:"🔥",color:RED},{name:"Títulos",icon:"🥇",color:ACCENT},{name:"Curiosidades",icon:"💡",color:PURP}];
const IDEA_SEEDS=[{title:"A história secreta da fundação do Flamengo em 1895",category:"Fundação & Origem"},{title:"Zico: o maior jogador da história do Flamengo",category:"Jogadores Lendários"},{title:"A maior goleada da história do Flamengo",category:"Partidas Históricas"},{title:"O Urubu: a história do mascote mais famoso do Brasil",category:"Mascote & Símbolos"},{title:"Flamengo x Fluminense: a maior rivalidade do Rio",category:"Rivalidades"},{title:"Libertadores 2019: a noite que parou o Brasil",category:"Títulos"},{title:"Por que o Flamengo tem mais torcedores que qualquer time do mundo?",category:"Curiosidades"},{title:"Adriano Imperador: ascensão e queda de um gênio",category:"Jogadores Lendários"},{title:"A história da Gávea: o CT mais famoso do futebol brasileiro",category:"História"},{title:"Gabigol: o herói que virou lenda em uma noite",category:"Jogadores Lendários"}];

const toLocalDate=d=>{const dt=new Date(d);return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");};
const today=()=>toLocalDate(new Date());
const thisMonth=()=>new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0");
const deadlineDiff=d=>{if(!d)return 999;const now=new Date();now.setHours(0,0,0,0);return Math.round((new Date(d+"T12:00:00")-now)/86400000);};
const deadlineColor=d=>{const df=deadlineDiff(d);if(df<0||df<=1)return RED;if(df<=3)return ACCENT;return GREEN;};
const deadlineLabel=d=>{if(!d)return"";const df=deadlineDiff(d);if(df<0)return Math.abs(df)+"d atraso";if(df===0)return"Hoje!";if(df===1)return"Amanhã";return df+"d";};
const fmtCurrency=v=>"R$ "+(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2});
const fmtDate=d=>d?new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}):"—";
const greeting=()=>{const h=new Date().getHours();return h<12?"BOM DIA,":h<18?"BOA TARDE,":"BOA NOITE,";};

const calcGoalPlan=goal=>{
  const now=new Date();
  const target=goal.target_date?new Date(goal.target_date+"T12:00:00"):new Date(now.getFullYear()+1,now.getMonth(),1);
  const monthsLeft=Math.max(1,Math.round((target-now)/(1000*60*60*24*30)));
  const current=goal.current_value||0;const target_val=goal.target_value||0;
  const remaining=Math.max(0,target_val-current);const perMonth=remaining/monthsLeft;
  const pct=Math.min(100,Math.round((current/Math.max(1,target_val))*100));
  const onTrack=current>=(target_val*(1-monthsLeft/Math.max(1,monthsLeft+1)))*.85;
  const milestones=[];
  for(let i=1;i<=Math.min(monthsLeft,6);i++){
    const d=new Date(now.getFullYear(),now.getMonth()+i,1);
    const actions=[];
    if(goal.type==="videos_mes"){actions.push("Publicar "+Math.ceil(perMonth)+" vídeos este mês");actions.push(i<=2?"Consistência acima da perfeição":"Replique os formatos que mais performam");}
    else if(goal.type==="seguidores"){const v=Math.ceil(perMonth/YT_BENCH.subs_per_1k*1000);actions.push(v.toLocaleString("pt-BR")+" views necessárias");actions.push(Math.ceil(v/YT_BENCH.views_per_video)+" vídeos necessários");}
    else if(goal.type==="faturamento_mes"){actions.push("R$ "+Math.ceil(perMonth).toLocaleString("pt-BR")+" em novos contratos");actions.push(i<=2?"Prospectar 5 leads novos":"Reajuste com clientes existentes");}
    else{actions.push("Avançar "+Math.ceil(perMonth).toLocaleString("pt-BR")+" unidades");}
    milestones.push({month:d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"),label:d.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}),expected:Math.round(current+perMonth*i),actions});
  }
  return{monthsLeft,perMonth,onTrack,milestones,pct};
};

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
  const [focusTaskId,setFocusTaskId]=useState(()=>{try{return localStorage.getItem("dark_focus_task")||null;}catch{return null;}});
  const [timerRunning,setTimerRunning]=useState(false);
  const [timerSeconds,setTimerSeconds]=useState(()=>{try{const s=parseInt(localStorage.getItem("dark_timer_seconds"));return isNaN(s)?25*60:s;}catch{return 25*60;}});
  const [timerMode,setTimerMode]=useState(()=>{try{return localStorage.getItem("dark_timer_mode")||"work";}catch{return "work";}});
  const [activeEntry,setActiveEntry]=useState(null);
  const timerRef=useRef(null);
  const [videoDetailModal,setVideoDetailModal]=useState(null);
  const [scriptModal,setScriptModal]=useState(false);
  const [scriptData,setScriptData]=useState(null);
  const [scriptTakes,setScriptTakes]=useState([]);
  const [pipelineFilter,setPipelineFilter]=useState("todos");
  const [darkSection,setDarkSection]=useState("pipeline");
  const [wSection,setWSection]=useState("ideias");
  const [wInput,setWInput]=useState("");
  const [useAsBaseModal,setUseAsBaseModal]=useState(null);
  const [clientModal,setClientModal]=useState(false);
  const [clientEdit,setClientEdit]=useState(null);
  const [selectedClient,setSelectedClient]=useState(null);
  const [taskModal,setTaskModal]=useState(false);
  const [taskEdit,setTaskEdit]=useState(null);
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
  const [trendingRefChannels,setTrendingRefChannels]=useState([]);
  const [trendingRefModal,setTrendingRefModal]=useState(false);
  const [trendingRefEdit,setTrendingRefEdit]=useState(null);
  const [trendingRefVideos,setTrendingRefVideos]=useState({});
  const [trendingRefLoading,setTrendingRefLoading]=useState(null);
  const [nicheEdit,setNicheEdit]=useState(null);
  const [proposalModal,setProposalModal]=useState(null);
  const [leadFilter,setLeadFilter]=useState("todos");
  const [leadSearch,setLeadSearch]=useState("");
  const [wRefSection,setWRefSection]=useState("buscar");
  const [wRefVideos,setWRefVideos]=useState({});
  const [wRefLoading,setWRefLoading]=useState(null);
  const [cmdK,setCmdK]=useState(false);
  const [cmdKQuery,setCmdKQuery]=useState("");
  const trendingAutoRef=useRef(null);

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
      if(cl.data){const seen=new Set();setClients(cl.data.filter(c=>{if(seen.has(c.name))return false;seen.add(c.name);return true;}));}
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
      if(ni.data&&ni.data.length>0){const seen=new Set();setNiches(ni.data.filter(n=>{if(seen.has(n.name))return false;seen.add(n.name);return true;}));}
      else{const{data:ins}=await supabase.from("niches").insert(DEFAULT_NICHES.map((n,i)=>({...n,sort_order:i}))).select();if(ins)setNiches(ins);else setNiches(DEFAULT_NICHES.map((n,i)=>({...n,id:i,sort_order:i})));}
    }catch(e){flashError("Erro ao carregar dados");}
    setLoading(false);
  },[]);
  useEffect(()=>{if(user)loadAll();},[user,loadAll]);

  // CMD+K global search
  useEffect(()=>{
    const handler=e=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setCmdK(o=>!o);setCmdKQuery("");}if(e.key==="Escape")setCmdK(false);};
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  // Auto-trending: update every 15min regardless of active tab, and on app load
  useEffect(()=>{
    const check=()=>{const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;if(!apiKey)return;const mins=lastUpdated?Math.round((new Date()-lastUpdated)/60000):999;if(mins>=15&&!trendingLoading)fetchTrending();};
    check(); // fetch on mount
    trendingAutoRef.current=setInterval(check,15*60*1000);
    return()=>clearInterval(trendingAutoRef.current);
  },[]);// eslint-disable-line

  const activeNiches=niches.filter(n=>n.active!==false);

  const timerStartRef=useRef(null);
  const timerBaseRef=useRef(0);
  useEffect(()=>{
    if(timerRunning){
      timerStartRef.current=Date.now();
      timerBaseRef.current=timerSeconds;
      timerRef.current=setInterval(()=>{
        const elapsed=Math.floor((Date.now()-timerStartRef.current)/1000);
        const next=Math.max(0,timerBaseRef.current-elapsed);
        setTimerSeconds(next);
        try{localStorage.setItem("dark_timer_seconds",next);}catch{}
        if(next<=0){clearInterval(timerRef.current);setTimerRunning(false);handleTimerEnd();}
      },250);
    } else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[timerRunning]);// eslint-disable-line
  useEffect(()=>{try{localStorage.setItem("dark_timer_mode",timerMode);}catch{}},[timerMode]);
  useEffect(()=>{try{if(focusTaskId)localStorage.setItem("dark_focus_task",focusTaskId);else localStorage.removeItem("dark_focus_task");}catch{}},[focusTaskId]);

  const handleTimerEnd=async()=>{
    if(timerMode==="work"){
      triggerConfetti();
      const ns={...userStats,xp:(userStats.xp||0)+25,pomodoros_completed:(userStats.pomodoros_completed||0)+1};
      setUserStats(ns);if(userStats.id)await supabase.from("user_stats").update(ns).eq("id",userStats.id);
      setTimerMode("break");setTimerSeconds(5*60);
      try{localStorage.setItem("dark_timer_mode","break");localStorage.setItem("dark_timer_seconds",5*60);}catch{}
    } else {
      setTimerMode("work");setTimerSeconds(25*60);
      try{localStorage.setItem("dark_timer_mode","work");localStorage.setItem("dark_timer_seconds",25*60);}catch{}
    }
  };
  const startTimer=async taskId=>{
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
  const completeTask=async taskId=>{
    await stopTimeEntry();
    const{data}=await supabase.from("tasks").update({done:true,done_at:new Date().toISOString()}).eq("id",taskId).select().single();
    if(data){setTasks(prev=>prev.map(t=>t.id===taskId?data:t));triggerConfetti();const ns={...userStats,xp:(userStats.xp||0)+50,tasks_completed:(userStats.tasks_completed||0)+1};setUserStats(ns);if(userStats.id)await supabase.from("user_stats").update(ns).eq("id",userStats.id);setFocusTaskId(null);flash();}
  };
  const saveTask=async()=>{
    if(!taskEdit?.title?.trim())return;
    if(taskEdit.id){const r=await supabase.from("tasks").update(taskEdit).eq("id",taskEdit.id).select().single();if(r.data)setTasks(prev=>prev.map(t=>t.id===r.data.id?r.data:t));}
    else{const r=await supabase.from("tasks").insert(taskEdit).select().single();if(r.data)setTasks(prev=>[r.data,...prev]);}
    setTaskModal(false);setTaskEdit(null);flash();
  };
  const deleteTask=async id=>{await supabase.from("tasks").delete().eq("id",id);setTasks(prev=>prev.filter(t=>t.id!==id));};
  const duplicateTask=async t=>{const{id,created_at,done_at,...rest}=t;const{data}=await supabase.from("tasks").insert({...rest,done:false,title:rest.title+" (cópia)"}).select().single();if(data)setTasks(prev=>[...prev,data]);flash();};
  const saveClient=async()=>{
    if(!clientEdit?.name?.trim())return;
    if(clientEdit.id){const r=await supabase.from("clients").update(clientEdit).eq("id",clientEdit.id).select().single();if(r.data)setClients(prev=>prev.map(c=>c.id===r.data.id?r.data:c));}
    else{const r=await supabase.from("clients").insert({...clientEdit,active:true}).select().single();if(r.data)setClients(prev=>[...prev,r.data]);}
    setClientModal(false);setClientEdit(null);flash();
  };
  const deleteClient=async id=>{if(!confirm("Excluir cliente?"))return;await supabase.from("clients").update({active:false}).eq("id",id);setClients(prev=>prev.filter(c=>c.id!==id));};
  const getClientStats=cId=>{
    const cTasks=tasks.filter(t=>t.client_id===cId);
    const hoursWorked=timeEntries.filter(e=>e.client_id===cId).reduce((s,e)=>s+(e.duration_minutes||0),0)/60;
    const client=clients.find(c=>c.id===cId);
    const contractValue=client?.contract_value||0;
    const realHourlyRate=hoursWorked>0&&contractValue>0?contractValue/hoursWorked:0;
    return{hoursWorked:Math.round(hoursWorked*10)/10,contractValue,realHourlyRate:Math.round(realHourlyRate),idealHourlyRate:client?.rate_per_hour||0,pendingTasks:cTasks.filter(t=>!t.done).sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999")),doneTasks:cTasks.filter(t=>t.done).length};
  };
  const saveVideoDetail=async vd=>{
    if(!vd?.id)return;
    const{data}=await supabase.from("videos").update({title:vd.title,niche:vd.niche,status:vd.status,publish_date:vd.publish_date||null,platforms:vd.platforms||[],meu_titulo:vd.meu_titulo||"",minha_thumbnail:vd.minha_thumbnail||"",transcricao:vd.transcricao||"",meu_roteiro:vd.meu_roteiro||"",descricao_yt:vd.descricao_yt||"",hook:vd.hook||"",notes:vd.notes||"",escopo:vd.escopo||"",ref_titulo:vd.ref_titulo||"",ref_thumb:vd.ref_thumb||"",ref_url:vd.ref_url||"",ref_canal:vd.ref_canal||"",ref_views:vd.ref_views||0,ref_link_manual:vd.ref_link_manual||"",short_script:vd.short_script||"",short_status:vd.short_status||"pendente",short_platforms:vd.short_platforms||[]}).eq("id",vd.id).select().single();
    if(data){setVideos(prev=>prev.map(v=>v.id===data.id?data:v));setVideoDetailModal(data);flash();}
  };
  const createVideo=async initial=>{
    const dc=clients.find(c=>c.name==="Canais Dark");
    const{data}=await supabase.from("videos").insert({title:initial?.title||"Novo Vídeo",niche:initial?.niche||activeNiches[0]?.name||"Curiosidades",status:"Roteiro",client_id:initial?.client_id||dc?.id,...(initial||{})}).select().single();
    if(data){setVideos(prev=>[data,...prev]);setVideoDetailModal(data);}
  };
  const deleteVideo=async id=>{if(!confirm("Excluir?"))return;await supabase.from("videos").delete().eq("id",id);setVideos(prev=>prev.filter(v=>v.id!==id));setVideoDetailModal(null);};
  const moveVideo=async(id,status)=>{const{data}=await supabase.from("videos").update({status}).eq("id",id).select().single();if(data)setVideos(prev=>prev.map(v=>v.id===data.id?data:v));};
  const useVideoAsBase=async(rv,niche)=>{
    const isWalde=niche==="Sr. Waldemar";
    const dc=clients.find(c=>c.name===(isWalde?"Sr. Waldemar":"Canais Dark"));
    const{data}=await supabase.from("videos").insert({title:rv.title,niche:isWalde?"Sr. Waldemar":niche||activeNiches[0]?.name||"Curiosidades",status:"Roteiro",client_id:dc?.id,ref_titulo:rv.title,ref_thumb:rv.thumb||"",ref_url:rv.url||"",ref_canal:rv.channel||"",ref_views:rv.views||0}).select().single();
    if(data){setVideos(prev=>[data,...prev]);setVideoDetailModal(data);setUseAsBaseModal(null);setActiveTab(isWalde?5:4);flash();}
  };
  const openScript=v=>{setScriptData({...v});const takes=v.script?JSON.parse(v.script||"[]"):[];setScriptTakes(takes.length?takes:[{id:Date.now(),section:"GANCHO",startTime:"00:00",endTime:"00:07",angle:"A",narration:"",visual:"",prompt:""}]);setScriptModal(true);};
  const updateTake=(id,f,val)=>setScriptTakes(prev=>prev.map(t=>t.id===id?{...t,[f]:val}:t));
  const saveScript=async()=>{if(!scriptData)return;const{data}=await supabase.from("videos").update({script:JSON.stringify(scriptTakes)}).eq("id",scriptData.id).select().single();if(data){setVideos(prev=>prev.map(v=>v.id===data.id?data:v));flash();}};
  const saveInvoice=async()=>{
    if(!invoiceEdit?.amount||!invoiceEdit?.client_id)return;
    if(invoiceEdit.id){const r=await supabase.from("invoices").update(invoiceEdit).eq("id",invoiceEdit.id).select().single();if(r.data)setInvoices(prev=>prev.map(i=>i.id===r.data.id?r.data:i));}
    else{const r=await supabase.from("invoices").insert(invoiceEdit).select().single();if(r.data)setInvoices(prev=>[...prev,r.data]);}
    setInvoiceModal(false);setInvoiceEdit(null);flash();
  };
  const deleteInvoice=async id=>{await supabase.from("invoices").delete().eq("id",id);setInvoices(prev=>prev.filter(i=>i.id!==id));};
  const markInvoicePaid=async id=>{const{data}=await supabase.from("invoices").update({status:"pago",paid_date:today()}).eq("id",id).select().single();if(data)setInvoices(prev=>prev.map(i=>i.id===data.id?data:i));flash();};
  const duplicateInvoice=inv=>{const{id,created_at,paid_date,...rest}=inv;setInvoiceEdit({...rest,status:"pendente",issued_date:today(),due_date:today(),number:(rest.number||"")+" (cópia)"});setInvoiceModal(true);};
  const saveLib=async()=>{
    if(!libEdit?.content?.trim())return;
    if(libEdit.id){const r=await supabase.from("library").update(libEdit).eq("id",libEdit.id).select().single();if(r.data)setLibrary(prev=>prev.map(l=>l.id===r.data.id?r.data:l));}
    else{const r=await supabase.from("library").insert(libEdit).select().single();if(r.data)setLibrary(prev=>[r.data,...prev]);}
    setLibModal(false);setLibEdit(null);flash();
  };
  const deleteLib=async id=>{await supabase.from("library").delete().eq("id",id);setLibrary(prev=>prev.filter(l=>l.id!==id));};
  const saveGoal=async()=>{
    if(!goalEdit?.title?.trim())return;
    if(goalEdit.id){const r=await supabase.from("goals").update(goalEdit).eq("id",goalEdit.id).select().single();if(r.data)setGoals(prev=>prev.map(g=>g.id===r.data.id?r.data:g));}
    else{const r=await supabase.from("goals").insert(goalEdit).select().single();if(r.data)setGoals(prev=>[r.data,...prev]);}
    setGoalModal(false);setGoalEdit(null);flash();
  };
  const deleteGoal=async id=>{await supabase.from("goals").delete().eq("id",id);setGoals(prev=>prev.filter(g=>g.id!==id));};
  const updateGoalProgress=async(id,val)=>{const{data}=await supabase.from("goals").update({current_value:val}).eq("id",id).select().single();if(data)setGoals(prev=>prev.map(g=>g.id===data.id?data:g));flash();};
  const saveLead=async()=>{
    if(!leadEdit?.name?.trim())return;
    if(leadEdit.id){const r=await supabase.from("leads").update(leadEdit).eq("id",leadEdit.id).select().single();if(r.data)setLeads(prev=>prev.map(l=>l.id===r.data.id?r.data:l));}
    else{const r=await supabase.from("leads").insert(leadEdit).select().single();if(r.data)setLeads(prev=>[r.data,...prev]);}
    setLeadModal(false);setLeadEdit(null);flash();
  };
  const deleteLead=async id=>{await supabase.from("leads").delete().eq("id",id);setLeads(prev=>prev.filter(l=>l.id!==id));};
  const convertLead=async lead=>{const{data}=await supabase.from("clients").insert({name:lead.name,color:ACCENT,type:"YouTube",frequency:"",rate_per_hour:0,active:true,notes:lead.notes||""}).select().single();if(data){setClients(prev=>[...prev,data]);await supabase.from("leads").update({converted:true,client_id:data.id}).eq("id",lead.id);setLeads(prev=>prev.map(l=>l.id===lead.id?{...l,converted:true}:l));flash();}};
  const saveIdeaEdit=async()=>{
    if(!ideaEdit?.title?.trim())return;
    if(ideaEdit.id){const r=await supabase.from("ideas").update(ideaEdit).eq("id",ideaEdit.id).select().single();if(r.data)setIdeas(prev=>prev.map(i=>i.id===r.data.id?r.data:i));}
    else{const r=await supabase.from("ideas").insert(ideaEdit).select().single();if(r.data)setIdeas(prev=>[r.data,...prev]);}
    setIdeaModal(false);setIdeaEdit(null);flash();
  };
  const saveIdea=async(title,opts={})=>{const{data}=await supabase.from("ideas").insert({title,source:opts.source||"quick",niche:opts.niche||"",description:opts.description||""}).select().single();if(data)setIdeas(prev=>[data,...prev]);flash();};
  const saveQuickIdea=async title=>saveIdea(title);
  const saveWaldeIdea=async(title,category)=>saveIdea(title,{source:"waldemar",niche:"Sr. Waldemar",description:category||""});
  const createWaldeVideo=async initial=>{const wc=clients.find(c=>c.name==="Sr. Waldemar");const{data}=await supabase.from("videos").insert({title:initial?.title||"Novo Vídeo",niche:"Sr. Waldemar",status:"Roteiro",client_id:wc?.id,...(initial||{})}).select().single();if(data){setVideos(prev=>[data,...prev]);setVideoDetailModal(data);}};
  const useWaldeIdeaAsVideo=async idea=>{const wc=clients.find(c=>c.name==="Sr. Waldemar");const{data}=await supabase.from("videos").insert({title:idea.title,niche:"Sr. Waldemar",status:"Roteiro",client_id:wc?.id,notes:idea.description||""}).select().single();if(data){setVideos(prev=>[data,...prev]);await supabase.from("ideas").update({used:true}).eq("id",idea.id);setIdeas(prev=>prev.map(i=>i.id===idea.id?{...i,used:true}:i));setVideoDetailModal(data);flash();}};
  const createWaldeVideo=async initial=>{
    const wc=clients.find(c=>c.name==="Sr. Waldemar");
    const{data}=await supabase.from("videos").insert({title:initial?.title||"Novo Vídeo",niche:"Sr. Waldemar",status:"Roteiro",client_id:wc?.id,...(initial||{})}).select().single();
    if(data){setVideos(prev=>[data,...prev]);setVideoDetailModal(data);}
  };
  const deleteIdea=async id=>{await supabase.from("ideas").delete().eq("id",id);setIdeas(prev=>prev.filter(i=>i.id!==id));};
  const restoreIdea=async id=>{const{data}=await supabase.from("ideas").update({used:false}).eq("id",id).select().single();if(data)setIdeas(prev=>prev.map(i=>i.id===data.id?data:i));flash();};
  const useIdeaAsVideo=async idea=>{const dc=clients.find(c=>c.name==="Canais Dark");const{data}=await supabase.from("videos").insert({title:idea.title,niche:idea.niche||activeNiches[0]?.name||"Curiosidades",status:"Roteiro",client_id:dc?.id,notes:idea.description||""}).select().single();if(data){setVideos(prev=>[data,...prev]);await supabase.from("ideas").update({used:true}).eq("id",idea.id);setIdeas(prev=>prev.map(i=>i.id===idea.id?{...i,used:true}:i));setVideoDetailModal(data);flash();}};
  const saveRefChannel=async()=>{
    if(!refChannelEdit?.name?.trim())return;
    if(refChannelEdit.id){const r=await supabase.from("ref_channels").update(refChannelEdit).eq("id",refChannelEdit.id).select().single();if(r.data)setRefChannels(prev=>prev.map(c=>c.id===r.data.id?r.data:c));}
    else{const r=await supabase.from("ref_channels").insert(refChannelEdit).select().single();if(r.data)setRefChannels(prev=>[...prev,r.data]);}
    setRefChannelModal(false);setRefChannelEdit(null);flash();
  };
  const deleteRefChannel=async id=>{await supabase.from("ref_channels").delete().eq("id",id);setRefChannels(prev=>prev.filter(c=>c.id!==id));};
  const saveNiche=async()=>{
    if(!nicheEdit?.name?.trim())return;
    if(nicheEdit.id){const r=await supabase.from("niches").update(nicheEdit).eq("id",nicheEdit.id).select().single();if(r.data)setNiches(prev=>prev.map(n=>n.id===r.data.id?r.data:n));}
    else{const r=await supabase.from("niches").insert({...nicheEdit,active:true,sort_order:niches.length}).select().single();if(r.data)setNiches(prev=>[...prev,r.data]);}
    setNicheModal(false);setNicheEdit(null);flash();
  };
  const deleteNiche=async id=>{await supabase.from("niches").delete().eq("id",id);setNiches(prev=>prev.filter(n=>n.id!==id));};

  const loadTrendingRefChannels=async()=>{const{data}=await supabase.from("trending_ref_channels").select("*").order("name");if(data)setTrendingRefChannels(data);};
  useEffect(()=>{if(user)loadTrendingRefChannels();},[user]);// eslint-disable-line
  const saveTrendingRefChannel=async()=>{
    if(!trendingRefEdit?.name?.trim())return;
    if(trendingRefEdit.id){const r=await supabase.from("trending_ref_channels").update(trendingRefEdit).eq("id",trendingRefEdit.id).select().single();if(r.data)setTrendingRefChannels(prev=>prev.map(c=>c.id===r.data.id?r.data:c));}
    else{const r=await supabase.from("trending_ref_channels").insert(trendingRefEdit).select().single();if(r.data)setTrendingRefChannels(prev=>[...prev,r.data]);}
    setTrendingRefModal(false);setTrendingRefEdit(null);flash();
  };
  const deleteTrendingRefChannel=async id=>{await supabase.from("trending_ref_channels").delete().eq("id",id);setTrendingRefChannels(prev=>prev.filter(c=>c.id!==id));};
  const fetchTrendingRefVideos=async ch=>{
    const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if(!apiKey||!ch.channel_id||trendingRefVideos[ch.id])return;
    setTrendingRefLoading(ch.id);
    try{
      const r=await fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&channelId="+ch.channel_id+"&order=viewCount&maxResults=10&type=video&key="+apiKey);
      const d=await r.json();const ids=(d.items||[]).map(i=>i.id?.videoId).filter(Boolean).join(",");
      if(!ids){setTrendingRefLoading(null);return;}
      const s=await fetch("https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id="+ids+"&key="+apiKey);
      const sd=await s.json();
      setTrendingRefVideos(prev=>({...prev,[ch.id]:(sd.items||[]).map(v=>({id:v.id,title:v.snippet?.title,channel:v.snippet?.channelTitle,thumb:v.snippet?.thumbnails?.medium?.url,views:parseInt(v.statistics?.viewCount||0),url:"https://youtube.com/watch?v="+v.id})).sort((a,b)=>b.views-a.views)}));
    }catch(e){flashError("Erro ao buscar vídeos");}
    setTrendingRefLoading(null);
  };
  const reopenTask=async id=>{const{data}=await supabase.from("tasks").update({done:false,done_at:null}).eq("id",id).select().single();if(data)setTasks(prev=>prev.map(t=>t.id===data.id?data:t));flash();};

  const WALDEMAR_THEMES=[{name:"História do Clube",kw:"história do Flamengo clube"},{name:"Ídolos e Jogadores",kw:"ídolos Flamengo jogadores lendários"},{name:"Jogos Inesquecíveis",kw:"Flamengo jogos inesquecíveis finais"},{name:"Fundação e Origem",kw:"fundação Flamengo origem 1895"},{name:"Torcida",kw:"torcida Flamengo maior brasil"},{name:"Títulos e Conquistas",kw:"Flamengo títulos conquistas campeonatos"},{name:"Rivalidades",kw:"Flamengo Fluminense Vasco rivalidade"},{name:"Libertadores 2019",kw:"Flamengo Libertadores 2019 Lima"}];
  const fetchWaldeRefVideos=async theme=>{
    const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if(!apiKey||wRefVideos[theme.name])return;
    setWRefLoading(theme.name);
    try{
      const r=await fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&q="+encodeURIComponent(theme.kw)+"&type=video&order=viewCount&maxResults=8&key="+apiKey);
      const d=await r.json();
      const ids=(d.items||[]).map(i=>i.id?.videoId).filter(Boolean).join(",");
      if(!ids){setWRefLoading(null);return;}
      const s=await fetch("https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id="+ids+"&key="+apiKey);
      const sd=await s.json();
      setWRefVideos(prev=>({...prev,[theme.name]:(sd.items||[]).map(v=>({id:v.id,title:v.snippet?.title,channel:v.snippet?.channelTitle,thumb:v.snippet?.thumbnails?.medium?.url,views:parseInt(v.statistics?.viewCount||0),url:"https://youtube.com/watch?v="+v.id})).sort((a,b)=>b.views-a.views)}));
    }catch(e){flashError("Erro ao buscar referências");}
    setWRefLoading(null);
  };

  const generateProposal=lead=>{setProposalModal(lead);};
  const getProposalHTML=lead=>{
    const bruto=(lead.video_minutes||0)*6000;
    const desconto=lead.discount_pct||0;
    const final=lead.proposed_value||Math.round(bruto*(1-desconto/100));
    const pmLabels={"50_50":"50% na aprovação + 50% na entrega","100_entrega":"100% na entrega","100_entrada":"100% antecipado","parcelado":"Parcelado (a combinar)"};
    return{bruto,desconto,final,pmLabel:pmLabels[lead.payment_method]||lead.payment_method||"A combinar"};
  };
  const toggleNicheActive=async n=>{const{data}=await supabase.from("niches").update({active:!n.active}).eq("id",n.id).select().single();if(data)setNiches(prev=>prev.map(x=>x.id===data.id?data:x));};

  const fetchTrending=useCallback(async()=>{
    const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if(!apiKey)return;
    setTrendingLoading(true);
    try{
      const prev={...trendingPrev};
      const mapV=v=>({id:v.id,title:v.snippet?.title,channel:v.snippet?.channelTitle,thumb:v.snippet?.thumbnails?.medium?.url,views:parseInt(v.statistics?.viewCount||0),url:"https://youtube.com/watch?v="+v.id,growth:prev[v.id]?Math.round(((parseInt(v.statistics?.viewCount||0)-prev[v.id])/Math.max(1,prev[v.id]))*100):0});
      const fetchRegion=async region=>{const r=await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode="+region+"&maxResults=15&key="+apiKey);const d=await r.json();return(d.items||[]).filter(v=>![10].includes(parseInt(v.snippet?.categoryId))).map(mapV);};
      const fetchNiche=async kw=>{const r=await fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&q="+encodeURIComponent(kw)+"&type=video&order=viewCount&regionCode=BR&maxResults=8&key="+apiKey);const d=await r.json();const ids=(d.items||[]).map(i=>i.id?.videoId).filter(Boolean).join(",");if(!ids)return[];const s=await fetch("https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id="+ids+"&key="+apiKey);const sd=await s.json();return(sd.items||[]).map(mapV);};
      const[br,gl,...nr]=await Promise.all([fetchRegion("BR"),fetchRegion("US"),...activeNiches.map(n=>fetchNiche(n.keyword||n.name))]);
      const newPrev={};[...br,...gl,...nr.flat()].forEach(v=>{newPrev[v.id]=v.views;});
      setTrendingPrev(newPrev);
      const nm={};activeNiches.forEach((n,i)=>{nm[n.name]=nr[i]||[];});
      setTrendingData({br,global:gl,niches:nm});
      setLastUpdated(new Date());
    }catch(e){flashError("Erro ao buscar trending");}
    setTrendingLoading(false);
  },[trendingPrev,activeNiches]);// eslint-disable-line

  const fetchChannelVideos=async ch=>{
    const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if(!apiKey||!ch.channel_id||channelVideos[ch.id])return;
    setChannelLoading(ch.id);
    try{
      const r=await fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&channelId="+ch.channel_id+"&order=viewCount&maxResults=10&type=video&key="+apiKey);
      const d=await r.json();const ids=(d.items||[]).map(i=>i.id?.videoId).filter(Boolean).join(",");
      if(!ids){setChannelLoading(null);return;}
      const s=await fetch("https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id="+ids+"&key="+apiKey);
      const sd=await s.json();
      setChannelVideos(prev=>({...prev,[ch.id]:(sd.items||[]).map(v=>({id:v.id,title:v.snippet?.title,channel:v.snippet?.channelTitle,thumb:v.snippet?.thumbnails?.medium?.url,views:parseInt(v.statistics?.viewCount||0),url:"https://youtube.com/watch?v="+v.id})).sort((a,b)=>b.views-a.views)}));
    }catch(e){flashError("Erro ao buscar vídeos");}
    setChannelLoading(null);
  };

  const pendingTasks=tasks.filter(t=>!t.done).sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999"));
  const activeGoals=goals.filter(g=>!g.completed);
  const overdueLeads=leads.filter(l=>!l.converted&&l.follow_up_date&&deadlineDiff(l.follow_up_date)<=0);
  const getClientColor=cId=>{const c=clients.find(c=>c.id===cId);return c?.color||ACCENT;};
  const getClientName=cId=>clients.find(c=>c.id===cId)?.name||"—";
  const timerFmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  const getWeekDates=(offset=0)=>{const days=["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];const now=new Date();const dow=now.getDay();const mon=new Date(now);mon.setDate(now.getDate()-(dow===0?6:dow-1)+offset*7);mon.setHours(0,0,0,0);return Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return{date:toLocalDate(d),label:days[i]};});};
  const MONTHS_LABELS=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const getInvoicesByPeriod=()=>{if(invoicePeriod==="anual")return invoices.filter(i=>i.issued_date?.startsWith(String(invoiceYear)));return invoices.filter(i=>{const d=i.issued_date||"";return d.startsWith(invoiceYear+"-"+String(invoiceMonth).padStart(2,"0"));});};
  const periodInvoices=getInvoicesByPeriod();
  const totalEmitido=periodInvoices.reduce((s,i)=>s+(i.amount||0),0);
  const totalRecebido=periodInvoices.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0);
  const totalPendente=periodInvoices.filter(i=>i.status==="pendente").reduce((s,i)=>s+(i.amount||0),0);
  const totalVencido=invoices.filter(i=>i.status==="vencido"||(i.status==="pendente"&&deadlineDiff(i.due_date)<0)).reduce((s,i)=>s+(i.amount||0),0);
  const vencendoBreve=invoices.filter(i=>i.status==="pendente"&&deadlineDiff(i.due_date)<=3&&deadlineDiff(i.due_date)>=0);

  if(checkingAuth)return <div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:ACCENT,fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:3}}>CARREGANDO...</div></div>;

  if(!user)return(
    <div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{background:CARD,border:"1px solid "+BOR2,borderRadius:14,padding:40,width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}><div style={{fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:4,color:TEXT}}>DARK APP</div><div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,letterSpacing:2}}>PRODUCTION · FOCUS · FINANCE</div></div>
        <div style={{marginBottom:14}}><span style={lbl}>Email</span><input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type="email" placeholder="seu@email.com" style={inp}/></div>
        <div style={{marginBottom:24}}><span style={lbl}>Senha</span><input value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type="password" placeholder="••••••••" style={inp}/></div>
        {loginError&&<div style={{color:RED,fontSize:12,marginBottom:12,fontFamily:"'DM Sans'"}}>{loginError}</div>}
        <button onClick={login} disabled={loginLoading} style={{...btnGold,width:"100%",opacity:loginLoading?.7:1}}>{loginLoading?"ENTRANDO...":"ENTRAR"}</button>
      </div>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────
  const urgentToday=pendingTasks.filter(t=>t.urgency==="hot"||deadlineDiff(t.deadline)<=0);
  const nextTask=pendingTasks[0];
  const stuckVideos=videos.filter(v=>v.status!=="Postagem").sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).slice(0,3);
  const topGoals=activeGoals.slice(0,3).map(g=>({...g,plan:calcGoalPlan(g)}));
  const weekTasks=pendingTasks.filter(t=>t.deadline&&deadlineDiff(t.deadline)<=7&&deadlineDiff(t.deadline)>0);
  const thisMonthKey=thisMonth();
  const wVideos=videos.filter(v=>v.client_id===clients.find(c=>c.name==="Sr. Waldemar")?.id);
  const wIdeas=ideas.filter(i=>i.niche==="Sr. Waldemar"||i.source==="waldemar");

  return (
    <div style={{background:BG,minHeight:"100vh",color:TEXT}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#3A3A3E;border-radius:2px}.hr:hover{background:#323235!important}.hc:hover{transform:translateY(-1px)}input:focus,textarea:focus,select:focus{border-color:${ACCENT}!important;outline:none}textarea{resize:vertical}`}</style>

      <div style={{background:BG2,borderBottom:"1px solid "+BOR,padding:"0 24px",display:"flex",alignItems:"center",height:54,position:"sticky",top:0,zIndex:50,gap:16}}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:4,color:ACCENT}}>DARK APP</div>
        <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,letterSpacing:2}}>PRODUCTION · FOCUS · FINANCE</div>
        <div style={{flex:1}}/>
        <button onClick={()=>{setCmdK(true);setCmdKQuery("");}} style={{...btnGhost,fontSize:11,padding:"4px 12px",display:"flex",alignItems:"center",gap:6,color:MUTED,borderColor:BOR}}>🔍 <span>Buscar</span><kbd style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:HINT,background:BG3,border:"1px solid "+BOR,borderRadius:3,padding:"1px 4px"}}>⌘K</kbd></button>
        {saved&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:GREEN,background:GREEN+"15",padding:"3px 12px",borderRadius:20}}>✓ Salvo</div>}
        {errorMsg&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:RED,background:RED+"15",padding:"3px 12px",borderRadius:20}}>⚠ {errorMsg}</div>}
        {timerRunning&&<div style={{display:"flex",alignItems:"center",gap:8,background:(timerMode==="work"?ACCENT:GREEN)+"15",border:"1px solid "+(timerMode==="work"?ACCENT:GREEN)+"33",borderRadius:8,padding:"4px 12px"}}><span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:timerMode==="work"?ACCENT:GREEN,letterSpacing:2}}>{timerFmt(timerSeconds)}</span><button onClick={()=>setTimerRunning(false)} style={{...btnGhost,padding:"1px 6px",fontSize:10}}>⏸</button></div>}
        <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>{user.email}</div>
        <button onClick={logout} style={{...btnGhost,fontSize:11,padding:"4px 10px"}}>Sair</button>
      </div>

      <div style={{display:"flex",background:BG2,borderBottom:"1px solid "+BOR,overflowX:"auto"}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setActiveTab(i)} style={{fontFamily:"'DM Sans'",fontSize:12,color:activeTab===i?ACCENT:MUTED,background:"transparent",border:"none",borderBottom:activeTab===i?"2px solid "+ACCENT:"2px solid transparent",padding:"13px 16px",cursor:"pointer",whiteSpace:"nowrap",fontWeight:activeTab===i?600:400,transition:"all .15s"}}>{t}</button>
        ))}
      </div>

      <div style={{maxWidth:1400,margin:"0 auto",padding:"24px"}}>

        {activeTab===0&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:1}}>{greeting()} <span style={{color:ACCENT}}>BERNARDO.</span></div>
                <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,marginTop:4}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})} · {pendingTasks.length} pendentes</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div style={card}>
                <div style={{fontFamily:"'DM Sans'",fontSize:10,color:urgentToday.length>0?RED:GREEN,letterSpacing:1,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>⚡ HOJE — {urgentToday.length} tarefas</div>
                {urgentToday.length===0&&nextTask&&(
                  <div>
                    <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:8}}>Próxima tarefa:</div>
                    <div style={{padding:"10px 12px",background:BG3,borderRadius:8,marginBottom:10,cursor:"pointer"}} onClick={()=>startTimer(nextTask.id)}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500,marginBottom:4}}>{nextTask.title}</div>
                      <div style={{display:"flex",gap:6}}>
                        <span style={{background:getClientColor(nextTask.client_id)+"20",color:getClientColor(nextTask.client_id),borderRadius:4,padding:"1px 6px",fontSize:10}}>{getClientName(nextTask.client_id)}</span>
                        {nextTask.deadline&&<span style={{background:deadlineColor(nextTask.deadline)+"20",color:deadlineColor(nextTask.deadline),borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>{deadlineLabel(nextTask.deadline)}</span>}
                      </div>
                    </div>
                    <button onClick={()=>startTimer(nextTask.id)} style={{...btnGold,width:"100%",fontSize:13}}>▶ INICIAR POMODORO</button>
                  </div>
                )}
                {urgentToday.length===0&&!nextTask&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:GREEN,padding:"8px 0"}}>🎉 Tudo em dia!</div>}
                {urgentToday.slice(0,4).map(t=>(
                  <div key={t.id} className="hr" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 5px",borderBottom:"1px solid "+BOR,cursor:"pointer",borderRadius:4}} onClick={()=>startTimer(t.id)}>
                    <div style={{width:5,height:5,borderRadius:1,background:{hot:RED,warn:ACCENT,normal:GREEN}[t.urgency||"normal"],flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>{getClientName(t.client_id)}</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();completeTask(t.id);}} style={{...btnGhost,padding:"1px 6px",fontSize:10,color:GREEN,borderColor:GREEN+"33"}}>✓</button>
                    <span style={{background:deadlineColor(t.deadline)+"20",color:deadlineColor(t.deadline),borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600,flexShrink:0}}>{deadlineLabel(t.deadline)||"🔥"}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>🎬 PIPELINE DARK</div>
                {PIPELINE.map(s=>{const count=videos.filter(v=>v.status===s).length;const color=PIPELINE_COLORS[s];return(
                  <div key={s} className="hr" style={{display:"flex",alignItems:"center",gap:8,padding:"5px 4px",borderBottom:"1px solid "+BOR,cursor:"pointer",borderRadius:4}} onClick={()=>setActiveTab(4)}>
                    <div style={{width:7,height:7,borderRadius:2,background:color,flexShrink:0}}/>
                    <span style={{fontFamily:"'DM Sans'",fontSize:12,flex:1}}>{s}</span>
                    <span style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:count>0?color:HINT,fontWeight:600}}>{count}</span>
                  </div>
                );})}
                {stuckVideos.length>0&&(
                  <div style={{marginTop:8}}>
                    <div style={{fontFamily:"'DM Sans'",fontSize:9,color:ORANGE,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>⏱ Parados</div>
                    {stuckVideos.map(v=>(
                      <div key={v.id} style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer",padding:"2px 0"}} onClick={()=>{setVideoDetailModal({...v});setActiveTab(4);}}>→ {v.meu_titulo||v.title}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div style={card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>🎯 METAS</div>
                  <button onClick={()=>setActiveTab(2)} style={{...btnGhost,fontSize:10,padding:"2px 8px",color:ACCENT,borderColor:ACCENT+"33"}}>ver todas →</button>
                </div>
                {topGoals.length===0?<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,padding:"8px 0"}}>Nenhuma meta. <span style={{color:ACCENT,cursor:"pointer"}} onClick={()=>setActiveTab(2)}>Criar →</span></div>:topGoals.map(g=>{
                  const hc={curto:ACCENT,medio:BLUE,longo:PURP}[g.horizon||"curto"];
                  return(
                    <div key={g.id} style={{marginBottom:12,cursor:"pointer"}} onClick={()=>setActiveTab(2)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500}}>{g.title}</span>
                        <span style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:g.plan.onTrack?GREEN:RED,fontWeight:600}}>{g.plan.pct}%</span>
                      </div>
                      <div style={{background:BG,borderRadius:3,height:5,overflow:"hidden"}}><div style={{height:"100%",width:g.plan.pct+"%",background:g.plan.onTrack?hc:RED,borderRadius:3,transition:"width .5s"}}/></div>
                      {g.plan.milestones[0]?.actions[0]&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginTop:3}}>→ {g.plan.milestones[0].actions[0]}</div>}
                    </div>
                  );
                })}
              </div>
              <div style={card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>💡 IDEIAS</div>
                  <button onClick={()=>{setIdeaEdit({title:"",description:"",niche:""});setIdeaModal(true);}} style={{...btnGhost,fontSize:10,padding:"2px 8px"}}>+ Nova</button>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <input value={dashIdeaInput} onChange={e=>setDashIdeaInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&dashIdeaInput.trim()){saveQuickIdea(dashIdeaInput.trim());setDashIdeaInput("");}}} placeholder="Capturar ideia..." style={{...inp,flex:1,fontSize:12,padding:"6px 10px"}}/>
                  <button onClick={()=>{if(dashIdeaInput.trim()){saveQuickIdea(dashIdeaInput.trim());setDashIdeaInput("");}}} style={{...btnGold,padding:"6px 12px",fontSize:13}}>+</button>
                </div>
                {ideas.filter(i=>!i.used&&i.source!=="waldemar"&&i.niche!=="Sr. Waldemar").slice(0,5).map(i=>(
                  <div key={i.id} className="hr" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 5px",borderBottom:"1px solid "+BOR,borderRadius:4}}>
                    <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>{setIdeaEdit({...i});setIdeaModal(true);}}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.title}</div>
                      {(i.niche||i.description)&&<div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.niche||i.description}</div>}
                    </div>
                    <button onClick={()=>useIdeaAsVideo(i)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:GREEN+"33",flexShrink:0}}>usar →</button>
                    <button onClick={()=>deleteIdea(i.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                ))}
                {ideas.filter(i=>!i.used&&i.source!=="waldemar"&&i.niche!=="Sr. Waldemar").length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:12}}>Capture sua próxima ideia acima.</div>}
              </div>
            </div>
            {weekTasks.length>0&&(
              <div style={{...card,marginTop:0}}>
                <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:12,fontWeight:600}}>📅 ESTA SEMANA — {weekTasks.length} vencendo</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
                  {clients.map(c=>{
                    const ct=weekTasks.filter(t=>t.client_id===c.id);
                    if(!ct.length)return null;
                    return(
                      <div key={c.id} style={{background:BG3,borderRadius:8,padding:"10px 12px",borderLeft:"3px solid "+(c.color||ACCENT)}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontFamily:"'Bebas Neue'",fontSize:13,color:c.color||ACCENT}}>{c.name}</span>
                          <span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{ct.length}x</span>
                        </div>
                        <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ct[0]?.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {(trendingData.br.length>0||trendingData.global.length>0)&&(
              <div style={{...card,marginTop:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>🔥 TRENDING AGORA</div>
                  <button onClick={()=>setActiveTab(9)} style={{...btnGhost,fontSize:10,padding:"2px 8px",color:ACCENT,borderColor:ACCENT+"33"}}>ver tudo →</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {[{label:"🇧🇷 Brasil",list:trendingData.br.slice(0,5)},{label:"🌍 Mundial",list:trendingData.global.slice(0,5)}].map(({label,list})=>(
                    <div key={label}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>{label}</div>
                      {list.map((v,i)=>(
                        <div key={v.id} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 0",borderBottom:"1px solid "+BOR}}>
                          <span style={{fontFamily:"'Bebas Neue'",fontSize:14,color:HINT,width:18,flexShrink:0}}>{i+1}</span>
                          {v.thumb&&<img src={v.thumb} alt="" style={{width:44,height:32,borderRadius:3,objectFit:"cover",flexShrink:0}}/>}
                          <div style={{flex:1,minWidth:0}}>
                            <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,fontWeight:500,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                            <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div>
                          </div>
                          {v.growth>50&&<span style={{background:RED+"20",color:RED,borderRadius:3,padding:"1px 5px",fontSize:9,fontWeight:600,flexShrink:0}}>🚀+{v.growth}%</span>}
                          <button onClick={()=>saveQuickIdea(v.title)} style={{...btnGhost,padding:"1px 5px",fontSize:9,color:GREEN,borderColor:GREEN+"33",flexShrink:0}}>+</button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {activeNiches.slice(0,2).map(n=>{
                  const list=(trendingData.niches[n.name]||[]).slice(0,3);
                  if(!list.length)return null;
                  return(
                    <div key={n.name} style={{marginTop:14}}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:10,color:ACCENT,letterSpacing:1,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>{n.name}</div>
                      {list.map((v,i)=>(
                        <div key={v.id} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 0",borderBottom:"1px solid "+BOR}}>
                          <span style={{fontFamily:"'Bebas Neue'",fontSize:14,color:HINT,width:18,flexShrink:0}}>{i+1}</span>
                          {v.thumb&&<img src={v.thumb} alt="" style={{width:44,height:32,borderRadius:3,objectFit:"cover",flexShrink:0}}/>}
                          <div style={{flex:1,minWidth:0}}>
                            <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,fontWeight:500,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                            <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div>
                          </div>
                          <button onClick={()=>saveQuickIdea(v.title)} style={{...btnGhost,padding:"1px 5px",fontSize:9,color:GREEN,borderColor:GREEN+"33",flexShrink:0}}>+</button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab===1&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>FOCUS OS</div>
              <button onClick={()=>{setTaskEdit({title:"",urgency:"hot",estimated_hours:1,deadline:today()});setTaskModal(true);}} style={btnGold}>+ NOVA TAREFA</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20}}>
              <div>
                <div style={{...card,marginBottom:14,border:"1px solid "+(timerMode==="work"?ACCENT:GREEN)+"44"}}>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:timerMode==="work"?ACCENT:GREEN,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{timerMode==="work"?"🍅 Pomodoro 25min":"☕ Descanso 5min"}</div>
                  {pendingTasks.find(t=>t.id===focusTaskId||(!focusTaskId&&t===pendingTasks[0]))&&<div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,marginBottom:10}}>{(pendingTasks.find(t=>t.id===focusTaskId)||pendingTasks[0])?.title}</div>}
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:52,letterSpacing:-2,color:timerMode==="work"?ACCENT:GREEN,lineHeight:1,marginBottom:16}}>{timerFmt(timerSeconds)}</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {!timerRunning?<button onClick={()=>pendingTasks[0]&&startTimer((pendingTasks.find(t=>t.id===focusTaskId)||pendingTasks[0])?.id)} style={{...btnGold,opacity:pendingTasks.length?1:.5}}>▶ INICIAR</button>:<button onClick={()=>{setTimerRunning(false);stopTimeEntry();}} style={{...btnGhost,color:ACCENT,borderColor:ACCENT+"44"}}>⏸ PAUSAR</button>}
                    {(pendingTasks.find(t=>t.id===focusTaskId)||pendingTasks[0])&&<button onClick={()=>completeTask((pendingTasks.find(t=>t.id===focusTaskId)||pendingTasks[0])?.id)} style={{...btnGhost,color:GREEN,borderColor:GREEN+"44"}}>✓ CONCLUIR</button>}
                    {focusTaskId&&<button onClick={()=>setFocusTaskId(null)} style={btnGhost}>→ Pular</button>}
                  </div>
                </div>
                <div style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2}}>PLANO DO DIA</div>
                    <button onClick={()=>{setTaskEdit({title:"",urgency:"normal",estimated_hours:1,deadline:today()});setTaskModal(true);}} style={{...btnGhost,fontSize:10,padding:"3px 8px"}}>+ Tarefa</button>
                  </div>
                  {pendingTasks.length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:20}}>🎉 Nenhuma tarefa pendente!</div>}
                  {pendingTasks.map((t,i)=>(
                    <div key={t.id} className="hr" onClick={()=>startTimer(t.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 8px",borderBottom:"1px solid "+BOR,background:t.id===focusTaskId||(!focusTaskId&&i===0)?ACCENT+"06":undefined,borderRadius:t.id===focusTaskId||(!focusTaskId&&i===0)?6:0,cursor:"pointer"}}>
                      <span style={{fontFamily:"'IBM Plex Mono'",color:HINT,fontSize:10,width:20,flexShrink:0}}>#{i+1}</span>
                      <div style={{width:5,height:5,borderRadius:1,background:{hot:RED,warn:ACCENT,normal:GREEN}[t.urgency||"normal"],flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:t.id===focusTaskId||(!focusTaskId&&i===0)?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                        <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{getClientName(t.client_id)} · {t.type||"Tarefa"}</div>
                      </div>
                      <div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center"}}>
                        {t.deadline&&<span style={{background:deadlineColor(t.deadline)+"20",color:deadlineColor(t.deadline),borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:600}}>{deadlineLabel(t.deadline)}</span>}
                        <span style={{background:BG3,color:MUTED,borderRadius:4,padding:"1px 5px",fontSize:10}}>{t.estimated_hours}h</span>
                        <button onClick={e=>{e.stopPropagation();completeTask(t.id);}} style={{...btnGhost,padding:"1px 6px",fontSize:10,color:GREEN,borderColor:GREEN+"33"}}>✓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{...card,marginBottom:14}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,marginBottom:10}}>XP & NÍVEL</div>
                  <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED,marginBottom:6}}>{userStats.xp||0} XP</div>
                  <div style={{background:BG,borderRadius:3,height:6,overflow:"hidden",marginBottom:12}}><div style={{height:"100%",width:Math.min(100,Math.round(((userStats.xp||0)/2000)*100))+"%",background:GREEN,borderRadius:3}}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{l:"Tarefas",v:userStats.tasks_completed||0},{l:"Pomodoros",v:userStats.pomodoros_completed||0},{l:"Streak",v:"🔥 "+(userStats.streak||0)+"d"},{l:"XP",v:userStats.xp||0}].map(s=>(
                      <div key={s.l} style={{background:BG3,borderRadius:7,padding:"9px 10px"}}>
                        <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{s.l}</div>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACCENT}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab===2&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>🎯 METAS</div>
              <button onClick={()=>{setGoalEdit({title:"",type:"videos_mes",horizon:goalHorizon,target_value:0,current_value:0,target_date:"",notes:""});setGoalModal(true);}} style={btnGold}>+ NOVA META</button>
            </div>
            <div style={{display:"flex",gap:2,borderBottom:"1px solid "+BOR,marginBottom:24}}>
              {["curto","medio","longo"].map(h=>{const hc={curto:ACCENT,medio:BLUE,longo:PURP}[h];return(<button key={h} onClick={()=>setGoalHorizon(h)} style={{fontFamily:"'DM Sans'",fontSize:12,color:goalHorizon===h?hc:MUTED,background:"transparent",border:"none",borderBottom:goalHorizon===h?"2px solid "+hc:"2px solid transparent",padding:"10px 20px",cursor:"pointer",fontWeight:goalHorizon===h?600:400}}>{h==="curto"?"⚡ Curto Prazo":h==="medio"?"📈 Médio Prazo":"🚀 Longo Prazo"}</button>);})}
            </div>
            {goals.filter(g=>(g.horizon||"curto")===goalHorizon).map(g=>{
              const plan=calcGoalPlan(g);const hc={curto:ACCENT,medio:BLUE,longo:PURP}[g.horizon||"curto"];const isSel=selectedGoal?.id===g.id;
              return(
                <div key={g.id} style={{...card,border:"1px solid "+(isSel?hc:BOR),marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1}}>{g.title}</div>
                        <span style={{background:hc+"20",color:hc,borderRadius:4,padding:"1px 8px",fontSize:10,fontWeight:600}}>{GOAL_TYPE_LABELS[g.type]||g.type}</span>
                      </div>
                      <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:8}}>
                        <div style={{fontFamily:"'IBM Plex Mono'",fontSize:13,fontWeight:600}}>{(g.current_value||0).toLocaleString("pt-BR")} <span style={{color:MUTED}}>/ {(g.target_value||0).toLocaleString("pt-BR")}</span></div>
                        <div style={{fontFamily:"'DM Sans'",fontSize:12,color:plan.onTrack?GREEN:RED,fontWeight:600}}>{plan.onTrack?"✓ No ritmo":"⚠ Atrasado"}</div>
                        {g.target_date&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>até {fmtDate(g.target_date)}</div>}
                      </div>
                      <div style={{background:BG,borderRadius:4,height:7,overflow:"hidden",marginBottom:4}}><div style={{height:"100%",width:plan.pct+"%",background:plan.onTrack?hc:RED,borderRadius:4,transition:"width .6s"}}/></div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{plan.pct}% · {plan.monthsLeft} meses · {plan.perMonth.toLocaleString("pt-BR",{maximumFractionDigits:1})}/mês necessário</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>setSelectedGoal(isSel?null:g)} style={{...btnGhost,padding:"4px 10px",fontSize:11,color:hc,borderColor:hc+"44"}}>{isSel?"▲":"▼ plano"}</button>
                      <button onClick={()=>{setGoalEdit({...g});setGoalModal(true);}} style={{...btnGhost,padding:"4px 8px",fontSize:11}}>✏️</button>
                      <button onClick={()=>deleteGoal(g.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:isSel?16:0,alignItems:"center"}}>
                    <input type="number" defaultValue={g.current_value||0} onBlur={e=>updateGoalProgress(g.id,parseFloat(e.target.value)||0)} style={{...inp,width:130,fontSize:13,fontFamily:"'IBM Plex Mono'"}} placeholder="Valor atual"/>
                    <span style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>atualizar progresso</span>
                  </div>
                  {isSel&&(
                    <div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:12,marginTop:8}}>CRONOGRAMA — PASSO A PASSO</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
                        {plan.milestones.map((m,idx)=>(
                          <div key={m.month} style={{background:BG3,borderRadius:9,padding:"12px 12px",borderTop:"2px solid "+hc,opacity:new Date(m.month+"-01")<new Date()&&m.month!==thisMonthKey?.6:1}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,color:m.month===thisMonthKey?hc:TEXT,marginBottom:6}}>{m.label.toUpperCase()}{m.month===thisMonthKey&&<span style={{background:hc+"20",color:hc,borderRadius:3,padding:"1px 5px",fontSize:9,fontWeight:600,marginLeft:6}}>AGORA</span>}</div>
                            <div style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:hc,fontWeight:600,marginBottom:7}}>{m.expected.toLocaleString("pt-BR")}</div>
                            {m.actions.map((a,j)=><div key={j} style={{display:"flex",gap:4,marginBottom:4}}><span style={{color:hc,fontSize:9,flexShrink:0,marginTop:2}}>→</span><span style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,lineHeight:1.4}}>{a}</span></div>)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {goals.filter(g=>(g.horizon||"curto")===goalHorizon).length===0&&<div style={{...card,textAlign:"center",padding:36,color:MUTED,fontFamily:"'DM Sans'",fontSize:14}}>Nenhuma meta de {goalHorizon} prazo ainda.</div>}
          </div>
        )}

        {activeTab===3&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>AGENDA</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setWeekOffset(o=>o-1)} style={btnGhost}>← Anterior</button>
                <button onClick={()=>setWeekOffset(0)} style={{...btnGhost,color:ACCENT,borderColor:ACCENT+"44"}}>Hoje</button>
                <button onClick={()=>setWeekOffset(o=>o+1)} style={btnGhost}>Próxima →</button>
                <button onClick={()=>{setTaskEdit({title:"",urgency:"normal",estimated_hours:1});setTaskModal(true);}} style={btnGold}>+ TAREFA</button>
              </div>
            </div>
            {getWeekDates(weekOffset).map(({date,label})=>{
              const isToday=date===today();
              const dayTasks=tasks.filter(t=>t.deadline===date&&!t.done);
              const totalH=dayTasks.reduce((s,t)=>s+(t.estimated_hours||0),0);
              const lc=totalH>8?RED:totalH>5?ACCENT:GREEN;
              return(
                <div key={date} style={{marginBottom:8}}>
                  <div style={{display:"grid",gridTemplateColumns:"130px 1fr auto",gap:14,alignItems:"flex-start",background:isToday?ACCENT+"06":"transparent",border:"1px solid "+(isToday?ACCENT:BOR),borderRadius:10,padding:"13px 16px"}}>
                    <div>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2,color:isToday?ACCENT:TEXT}}>{label}</div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{new Date(date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long"})}</div>
                      {isToday&&<span style={{background:ACCENT,color:"#111",borderRadius:8,padding:"1px 7px",fontFamily:"'DM Sans'",fontSize:9,fontWeight:600}}>HOJE</span>}
                      {totalH>0&&<div style={{marginTop:5}}><div style={{background:BG3,borderRadius:2,height:3,overflow:"hidden",width:70}}><div style={{height:"100%",width:Math.min(100,(totalH/10)*100)+"%",background:lc}}/></div><div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:lc,marginTop:2}}>{totalH}h</div></div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {dayTasks.length===0?<div style={{fontFamily:"'DM Sans'",fontSize:12,color:HINT}}>—</div>:dayTasks.map(t=>(
                        <div key={t.id} onClick={()=>{setTaskEdit({...t});setTaskModal(true);}} style={{display:"flex",gap:10,padding:"10px 12px",background:getClientColor(t.client_id)+"07",border:"1px solid "+getClientColor(t.client_id)+"22",borderRadius:7,cursor:"pointer",alignItems:"center"}}>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,color:getClientColor(t.client_id)}}>{getClientName(t.client_id).toUpperCase()}</div>
                            <div style={{fontFamily:"'DM Sans'",fontSize:13,textDecoration:t.done?"line-through":"none",opacity:t.done?.6:1}}>{t.title}</div>
                            <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{t.type||"Tarefa"} · {t.estimated_hours}h</div>
                          </div>
                          {t.done?<span style={{color:GREEN,fontSize:16}}>✓</span>:<span style={{background:deadlineColor(t.deadline)+"20",color:deadlineColor(t.deadline),borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:600,flexShrink:0}}>{t.urgency==="hot"?"🔥":"OK"}</span>}
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>{setTaskEdit({title:"",urgency:"normal",estimated_hours:1,deadline:date});setTaskModal(true);}} style={{...btnGhost,fontSize:11,padding:"5px 10px",flexShrink:0}}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab===4&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>CANAIS DARK</div>
              <div style={{display:"flex",gap:8}}>
                {["pipeline","ideias","nichos","referencias"].map(s=>(
                  <button key={s} onClick={()=>setDarkSection(s)} style={{...btnGhost,color:darkSection===s?ACCENT:MUTED,borderColor:darkSection===s?ACCENT+"44":BOR,fontSize:12}}>{s==="referencias"?"Referências":s.charAt(0).toUpperCase()+s.slice(1)}</button>
                ))}
                <button onClick={()=>createVideo()} style={btnGold}>+ NOVO VÍDEO</button>
              </div>
            </div>
            {darkSection==="pipeline"&&(
              <div>
                <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
                  {["todos",...PIPELINE].map(s=>(
                    <button key={s} onClick={()=>setPipelineFilter(s)} style={{...btnGhost,fontSize:10,padding:"3px 9px",color:pipelineFilter===s?(PIPELINE_COLORS[s]||ACCENT):MUTED,borderColor:pipelineFilter===s?(PIPELINE_COLORS[s]||ACCENT)+"44":BOR,background:pipelineFilter===s?(PIPELINE_COLORS[s]||ACCENT)+"10":undefined}}>{s==="todos"?"Todos":s}</button>
                  ))}
                </div>
                <div style={{overflowX:"auto",paddingBottom:8}}>
                  <div style={{display:"flex",gap:10,minWidth:"max-content"}}>
                    {PIPELINE.map(status=>{
                      const colVids=(pipelineFilter==="todos"?videos:videos.filter(v=>v.status===pipelineFilter)).filter(v=>v.status===status);
                      const color=PIPELINE_COLORS[status];
                      return(
                        <div key={status} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("vid");if(id)moveVideo(id,status);}} style={{width:230,flexShrink:0,background:BG3,border:"1px solid "+BOR,borderRadius:10,overflow:"hidden",minHeight:260}}>
                          <div style={{padding:"9px 10px 7px",borderBottom:"2px solid "+color,background:color+"10"}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,color}}>{status}</div>
                            <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>{colVids.length}</div>
                          </div>
                          <div style={{padding:6,display:"flex",flexDirection:"column",gap:5}}>
                            {colVids.map(v=>(
                              <div key={v.id} draggable onDragStart={e=>e.dataTransfer.setData("vid",v.id)} onClick={()=>setVideoDetailModal({...v})} style={{background:CARD,border:"1px solid "+(v.ref_url?BLUE:BOR),borderRadius:7,padding:"9px 10px",cursor:"pointer"}} className="hc">
                                {v.ref_thumb&&<img src={v.ref_thumb} alt="" style={{width:"100%",height:52,objectFit:"cover",borderRadius:3,marginBottom:5}}/>}
                                <div style={{fontFamily:"'DM Sans'",fontSize:11,fontWeight:600,lineHeight:1.3,marginBottom:4}}>{v.meu_titulo||v.title}</div>
                                <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                                  <span style={{background:ACCENT+"15",color:ACCENT,borderRadius:3,padding:"1px 5px",fontSize:9}}>{(v.niche||"").split(" ")[0]}</span>
                                  {v.ref_url&&<span style={{background:BLUE+"15",color:BLUE,borderRadius:3,padding:"1px 5px",fontSize:9}}>📎</span>}
                                  {v.short_script&&<span style={{background:PURP+"15",color:PURP,borderRadius:3,padding:"1px 5px",fontSize:9}}>📱</span>}
                                  {v.publish_date&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>📅{fmtDate(v.publish_date)}</span>}
                                </div>
                              </div>
                            ))}
                            {colVids.length===0&&<div style={{color:HINT,fontSize:11,textAlign:"center",padding:14}}>Arraste aqui</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {darkSection==="ideias"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                <div style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2}}>💡 BANCO DE IDEIAS</div>
                    <button onClick={()=>{setIdeaEdit({title:"",description:"",niche:""});setIdeaModal(true);}} style={{...btnGhost,fontSize:11,padding:"3px 9px"}}>+ Nova</button>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    <input value={wInput} onChange={e=>setWInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&wInput.trim()){saveQuickIdea(wInput.trim());setWInput("");}}} placeholder="Nova ideia..." style={{...inp,flex:1}}/>
                    <button onClick={()=>{if(wInput.trim()){saveQuickIdea(wInput.trim());setWInput("");}}} style={btnGold}>+</button>
                  </div>
                  {ideas.filter(i=>!i.used).map(i=>(
                    <div key={i.id} className="hr" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 5px",borderBottom:"1px solid "+BOR,borderRadius:4}}>
                      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>{setIdeaEdit({...i});setIdeaModal(true);}}>
                        <div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.title}</div>
                        {i.niche&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{i.niche}</div>}
                      </div>
                      <button onClick={()=>useIdeaAsVideo(i)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:GREEN+"33",flexShrink:0}}>usar →</button>
                      <button onClick={()=>deleteIdea(i.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  ))}
                  {ideas.filter(i=>!i.used).length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:16}}>Banco vazio.</div>}
                </div>
                <div style={card}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,marginBottom:12}}>✓ USADAS</div>
                  {ideas.filter(i=>i.used).map(i=>(
                    <div key={i.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid "+BOR}}>
                      <div style={{flex:1,fontFamily:"'DM Sans'",fontSize:12,textDecoration:"line-through",opacity:.5}}>{i.title}</div>
                      <button onClick={()=>restoreIdea(i.id)} style={{...btnGhost,padding:"2px 8px",fontSize:10,color:ACCENT,borderColor:ACCENT+"33",flexShrink:0}}>↩ devolver</button>
                    </div>
                  ))}
                  {ideas.filter(i=>i.used).length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>Nenhuma ideia usada ainda.</div>}
                </div>
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
                          <div>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:1}}>{n.name}</div>
                            {n.cpm&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:ACCENT}}>CPM {n.cpm}</div>}
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>toggleNicheActive(n)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:n.active===false?MUTED:GREEN,borderColor:n.active===false?BOR:GREEN+"33"}}>{n.active===false?"off":"on"}</button>
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
                            <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px"}}>
                              <a href={ch.url} target="_blank" rel="noreferrer" style={{flex:1,fontFamily:"'DM Sans'",fontSize:11,fontWeight:600,color:TEXT,textDecoration:"none"}}>{ch.name}</a>
                              {ch.subscribers&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{ch.subscribers}</span>}
                              <button onClick={()=>fetchChannelVideos(ch)} disabled={!!channelLoading} style={{...btnGhost,padding:"1px 6px",fontSize:9,color:ACCENT,borderColor:ACCENT+"33",opacity:channelLoading===ch.id?.5:1}}>{channelLoading===ch.id?"...":"▶"}</button>
                              <button onClick={()=>deleteRefChannel(ch.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:10}}>✕</button>
                            </div>
                            {channelVideos[ch.id]&&channelVideos[ch.id].map((v,i)=>(
                              <div key={v.id} style={{display:"flex",gap:5,padding:"4px 8px",borderTop:"1px solid "+BOR,alignItems:"center"}}>
                                <span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:HINT,width:14,flexShrink:0}}>{i+1}</span>
                                {v.thumb&&<img src={v.thumb} alt="" style={{width:40,height:28,borderRadius:2,objectFit:"cover",flexShrink:0}}/>}
                                <div style={{flex:1,minWidth:0}}>
                                  <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:10,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                                  <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div>
                                </div>
                                <div style={{display:"flex",gap:3,flexShrink:0}}>
                                  <button onClick={()=>saveQuickIdea(v.title)} style={{...btnGhost,padding:"1px 4px",fontSize:9,color:GREEN,borderColor:GREEN+"33"}}>+</button>
                                  <button onClick={()=>setUseAsBaseModal({...v,niche:n.name})} style={{...btnGhost,padding:"1px 4px",fontSize:9,color:ACCENT,borderColor:ACCENT+"33"}}>base</button>
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
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>CANAIS DE REFERÊNCIA</div>
                  <button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:activeNiches[0]?.name||"",subscribers:"",notes:""});setRefChannelModal(true);}} style={btnGold}>+ CANAL</button>
                </div>
                {niches.map(n=>{
                  const channels=refChannels.filter(c=>c.niche===n.name);
                  if(!channels.length)return null;
                  return(
                    <div key={n.name} style={{marginBottom:18}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,color:ACCENT,marginBottom:8,paddingBottom:5,borderBottom:"1px solid "+BOR}}>{n.name}</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:10}}>
                        {channels.map(ch=>(
                          <div key={ch.id} style={{...card,marginBottom:0}} className="hc">
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                              <div>
                                <a href={ch.url} target="_blank" rel="noreferrer" style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,color:TEXT,textDecoration:"none",display:"block"}}>{ch.name}</a>
                                {ch.subscribers&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{ch.subscribers} inscritos</div>}
                              </div>
                              <div style={{display:"flex",gap:3}}>
                                <button onClick={()=>{setRefChannelEdit({...ch});setRefChannelModal(true);}} style={{...btnGhost,padding:"2px 5px",fontSize:10}}>✏️</button>
                                <button onClick={()=>deleteRefChannel(ch.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:11}}>✕</button>
                              </div>
                            </div>
                            {ch.notes&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:7,lineHeight:1.5}}>{ch.notes}</div>}
                            <button onClick={()=>fetchChannelVideos(ch)} disabled={!!channelLoading} style={{...btnGhost,width:"100%",fontSize:11,color:ACCENT,borderColor:ACCENT+"33",opacity:channelLoading===ch.id?.5:1}}>{channelLoading===ch.id?"Carregando...":channelVideos[ch.id]?"✓ "+channelVideos[ch.id].length+" vídeos":"▶ Carregar top 10"}</button>
                            {channelVideos[ch.id]&&channelVideos[ch.id].slice(0,5).map((v,i)=>(
                              <div key={v.id} style={{display:"flex",gap:7,padding:"5px 0",borderTop:"1px solid "+BOR,alignItems:"center",marginTop:4}}>
                                <span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:HINT,width:14}}>{i+1}</span>
                                <div style={{flex:1,minWidth:0}}>
                                  <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                                  <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div>
                                </div>
                                <button onClick={()=>setUseAsBaseModal({...v,niche:n.name})} style={{...btnGhost,padding:"1px 5px",fontSize:9,color:ACCENT,borderColor:ACCENT+"33",flexShrink:0}}>base</button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {refChannels.length===0&&<div style={{...card,textAlign:"center",padding:36}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:MUTED,marginBottom:8}}>NENHUM CANAL</div><button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:activeNiches[0]?.name||"",subscribers:"",notes:""});setRefChannelModal(true);}} style={btnGold}>+ ADICIONAR</button></div>}
              </div>
            )}
          </div>
        )}

        {activeTab===5&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>⭐ SR. WALDEMAR</div>
                <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>AI Entertainment · Flamengo · PT/EN/ES</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                {["ideias","pipeline","referencias","stats"].map(s=>(
                  <button key={s} onClick={()=>setWSection(s)} style={{...btnGhost,color:wSection===s?ACCENT:MUTED,borderColor:wSection===s?ACCENT+"44":BOR,fontSize:12}}>{s==="ideias"?"💡 Ideias":s==="pipeline"?"🎬 Pipeline":s==="referencias"?"📺 Referências":"📊 Stats"}</button>
                ))}
                <button onClick={()=>createWaldeVideo()} style={btnGold}>+ NOVO VÍDEO</button>
              </div>
            </div>
            {wSection==="ideias"&&(
              <div>
                <div style={{...card,marginBottom:16}}>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>CAPTURAR IDEIA</div>
                  <div style={{display:"flex",gap:8}}>
                    <input value={wInput} onChange={e=>setWInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&wInput.trim()){saveWaldeIdea(wInput.trim());setWInput("");}}} placeholder="Nova ideia sobre Flamengo..." style={{...inp,flex:1}}/>
                    <button onClick={()=>{if(wInput.trim()){saveWaldeIdea(wInput.trim());setWInput("");}}} style={btnGold}>+</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14,marginBottom:20}}>
                  {FLAMENGO_CATEGORIES.map(cat=>{
                    const catIdeas=wIdeas.filter(i=>(i.description===cat.name||i.category===cat.name)&&!i.used);
                    return(
                      <div key={cat.name} style={{...card,borderLeft:"3px solid "+cat.color,marginBottom:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1}}>{cat.icon} {cat.name}</div>
                          <span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{catIdeas.length} ideias</span>
                        </div>
                        {catIdeas.slice(0,3).map(i=>(
                          <div key={i.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid "+BOR}}>
                            <div style={{flex:1,fontFamily:"'DM Sans'",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.title}</div>
                            <button onClick={()=>useWaldeIdeaAsVideo(i)} style={{...btnGhost,padding:"1px 7px",fontSize:10,color:GREEN,borderColor:GREEN+"33",flexShrink:0}}>→</button>
                            <button onClick={()=>deleteIdea(i.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:11}}>✕</button>
                          </div>
                        ))}
                        {catIdeas.length===0&&(
                          <button onClick={()=>saveWaldeIdea(IDEA_SEEDS.find(s=>s.category===cat.name)?.title||"Ideia sobre "+cat.name,cat.name)} style={{...btnGhost,width:"100%",fontSize:11,color:cat.color,borderColor:cat.color+"33"}}>+ Sugestão automática</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={card}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,marginBottom:12}}>💡 SUGESTÕES PRONTAS</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {IDEA_SEEDS.filter(s=>!ideas.find(i=>i.title===s.title)).map((s,idx)=>(
                      <button key={idx} onClick={()=>saveWaldeIdea(s.title,s.category)} style={{...btnGhost,fontSize:11,padding:"5px 12px",color:ACCENT,borderColor:ACCENT+"33",textAlign:"left"}}>+ {s.title}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {wSection==="pipeline"&&(
              <div style={{overflowX:"auto",paddingBottom:8}}>
                <div style={{display:"flex",gap:10,minWidth:"max-content"}}>
                  {PIPELINE.map(status=>{
                    const colVids=wVideos.filter(v=>v.status===status);
                    const color=PIPELINE_COLORS[status];
                    return(
                      <div key={status} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("vid");if(id)moveVideo(id,status);}} style={{width:220,flexShrink:0,background:BG3,border:"1px solid "+BOR,borderRadius:10,overflow:"hidden",minHeight:240}}>
                        <div style={{padding:"9px 10px 7px",borderBottom:"2px solid "+color,background:color+"10"}}>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,color}}>{status}</div>
                          <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>{colVids.length}</div>
                        </div>
                        <div style={{padding:6,display:"flex",flexDirection:"column",gap:5}}>
                          {colVids.map(v=>(
                            <div key={v.id} draggable onDragStart={e=>e.dataTransfer.setData("vid",v.id)} onClick={()=>setVideoDetailModal({...v})} style={{background:CARD,border:"1px solid "+BOR,borderRadius:7,padding:"9px 10px",cursor:"pointer"}} className="hc">
                              <div style={{fontFamily:"'DM Sans'",fontSize:11,fontWeight:600,lineHeight:1.3,marginBottom:4}}>{v.meu_titulo||v.title}</div>
                              {v.publish_date&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>📅 {fmtDate(v.publish_date)}</div>}
                            </div>
                          ))}
                          {colVids.length===0&&<div style={{color:HINT,fontSize:11,textAlign:"center",padding:14}}>Arraste aqui</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {wSection==="referencias"&&(
              <div>
                <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,flex:1}}>📺 REFERÊNCIAS — FLAMENGO</div>
                  <button onClick={()=>{WALDEMAR_THEMES.forEach(t=>fetchWaldeRefVideos(t));}} style={{...btnGold,fontSize:12}}>🔄 BUSCAR TODOS</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
                  {WALDEMAR_THEMES.map(theme=>(
                    <div key={theme.name} style={{...card,marginBottom:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,color:ACCENT}}>{theme.name}</div>
                        <button onClick={()=>fetchWaldeRefVideos(theme)} disabled={wRefLoading===theme.name} style={{...btnGhost,fontSize:10,padding:"2px 8px",color:ACCENT,borderColor:ACCENT+"33",opacity:wRefLoading===theme.name?.5:1}}>{wRefLoading===theme.name?"...":wRefVideos[theme.name]?"✓ "+wRefVideos[theme.name].length:"▶ Buscar"}</button>
                      </div>
                      {wRefVideos[theme.name]?.map((v,i)=>(
                        <div key={v.id} style={{display:"flex",gap:7,padding:"5px 0",borderBottom:"1px solid "+BOR,alignItems:"center"}}>
                          <span style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:HINT,width:14,flexShrink:0}}>{i+1}</span>
                          {v.thumb&&<img src={v.thumb} alt="" style={{width:48,height:34,borderRadius:3,objectFit:"cover",flexShrink:0}}/>}
                          <div style={{flex:1,minWidth:0}}>
                            <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,fontWeight:500,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                            <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.channel} · {v.views?.toLocaleString("pt-BR")} views</div>
                          </div>
                          <div style={{display:"flex",gap:3,flexShrink:0}}>
                            <button onClick={()=>saveWaldeIdea(v.title,theme.name)} style={{...btnGhost,padding:"1px 5px",fontSize:9,color:GREEN,borderColor:GREEN+"33"}}>+ideia</button>
                            <button onClick={()=>useVideoAsBase(v,"Sr. Waldemar")} style={{...btnGhost,padding:"1px 5px",fontSize:9,color:ACCENT,borderColor:ACCENT+"33"}}>base</button>
                          </div>
                        </div>
                      ))}
                      {!wRefVideos[theme.name]&&wRefLoading!==theme.name&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:HINT,padding:"8px 0"}}>Clique em Buscar para carregar.</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {wSection==="stats"&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                {[{l:"Total de vídeos",v:wVideos.length,c:ACCENT},{l:"Publicados",v:wVideos.filter(v=>v.status==="Postagem").length,c:GREEN},{l:"Em produção",v:wVideos.filter(v=>v.status!=="Postagem").length,c:BLUE},{l:"Ideias no banco",v:wIdeas.length,c:PURP}].map(s=>(
                  <div key={s.l} style={card}>
                    <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{s.l}</div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab===6&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>CLIENTES</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setLeadEdit({name:"",contact:"",service:"",proposed_value:0,status:"novo",last_contact:today(),follow_up_date:"",notes:""});setLeadModal(true);}} style={{...btnGhost,color:ACCENT,borderColor:ACCENT+"44",fontSize:12}}>+ Lead</button>
                <button onClick={()=>{setClientEdit({name:"",color:ACCENT,type:"YouTube",frequency:"",rate_per_hour:0,contract_value:0,notes:""});setClientModal(true);}} style={btnGold}>+ NOVO CLIENTE</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"250px 1fr",gap:18}}>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {clients.map(c=>{
                  const{pendingTasks:pt}=getClientStats(c.id);
                  const isSel=selectedClient?.id===c.id;
                  return(
                    <div key={c.id} onClick={()=>setSelectedClient(isSel?null:c)} style={{...card,cursor:"pointer",border:"1px solid "+(isSel?c.color||ACCENT:BOR),background:isSel?c.color||ACCENT+"06":CARD,marginBottom:0,transition:"all .15s"}} className="hc">
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <div style={{width:32,height:32,borderRadius:7,background:(c.color||ACCENT)+"20",border:"1px solid "+(c.color||ACCENT)+"40",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue'",fontSize:11,color:c.color||ACCENT,flexShrink:0}}>{c.name.slice(0,2).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                          <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{c.type}</div>
                        </div>
                        {pt.length>0&&<span style={{background:RED+"20",color:RED,borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:600}}>{pt.length}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedClient?(()=>{
                const{hoursWorked,contractValue,realHourlyRate,idealHourlyRate,pendingTasks:pt,doneTasks}=getClientStats(selectedClient.id);
                return(
                  <div>
                    <div style={{...card,marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                        <div style={{display:"flex",gap:12,alignItems:"center"}}>
                          <div style={{width:48,height:48,borderRadius:10,background:(selectedClient.color||ACCENT)+"20",border:"1px solid "+(selectedClient.color||ACCENT)+"40",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue'",fontSize:16,color:selectedClient.color||ACCENT}}>{selectedClient.name.slice(0,2).toUpperCase()}</div>
                          <div>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1}}>{selectedClient.name}</div>
                            <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>{selectedClient.type} · {selectedClient.frequency}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:7}}>
                          <button onClick={()=>{setClientEdit({...selectedClient});setClientModal(true);}} style={btnGhost}>✏️ Editar</button>
                          <button onClick={()=>deleteClient(selectedClient.id)} style={{...btnGhost,color:RED,borderColor:RED+"44"}}>🗑</button>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:9}}>
                        {[{l:"Contrato",v:fmtCurrency(contractValue),c:ACCENT},{l:"Horas trabalhadas",v:hoursWorked+"h",c:BLUE},{l:"R$/h real",v:realHourlyRate>0?"R$ "+realHourlyRate:"-",c:realHourlyRate>0&&idealHourlyRate>0?(realHourlyRate>=idealHourlyRate?GREEN:RED):MUTED},{l:"R$/h ideal",v:idealHourlyRate>0?"R$ "+idealHourlyRate:"-",c:MUTED},{l:"Concluídas",v:doneTasks,c:GREEN}].map(s=>(
                          <div key={s.l} style={{background:BG3,borderRadius:7,padding:"9px 10px"}}>
                            <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{s.l}</div>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:s.c}}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={card}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2}}>TAREFAS</div>
                        <button onClick={()=>{setTaskEdit({title:"",client_id:selectedClient.id,urgency:"normal",estimated_hours:1,deadline:today()});setTaskModal(true);}} style={{...btnGhost,fontSize:11,padding:"4px 10px"}}>+ Tarefa</button>
                      </div>
                      {pt.map(t=>(
                        <div key={t.id} className="hr" style={{display:"flex",alignItems:"center",gap:9,padding:"9px 7px",borderBottom:"1px solid "+BOR,borderRadius:4}}>
                          <div style={{width:5,height:5,borderRadius:1,background:{hot:RED,warn:ACCENT,normal:GREEN}[t.urgency||"normal"],flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500}}>{t.title}</div>
                            <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{t.type||"Tarefa"} · {t.estimated_hours}h</div>
                          </div>
                          {t.deadline&&<span style={{background:deadlineColor(t.deadline)+"20",color:deadlineColor(t.deadline),borderRadius:4,padding:"2px 6px",fontSize:10,fontWeight:600}}>{deadlineLabel(t.deadline)}</span>}
                          <button onClick={()=>{setTaskEdit({...t});setTaskModal(true);}} style={{...btnGhost,padding:"2px 5px",fontSize:10}}>✏️</button>
                          <button onClick={()=>duplicateTask(t)} style={{...btnGhost,padding:"2px 5px",fontSize:10,color:BLUE,borderColor:BLUE+"33"}}>⧉</button>
                          <button onClick={()=>completeTask(t.id)} style={{...btnGhost,padding:"2px 6px",fontSize:10,color:GREEN,borderColor:GREEN+"33"}}>✓</button>
                          <button onClick={()=>deleteTask(t.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                        </div>
                      ))}
                      {pt.length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:16}}>Nenhuma tarefa pendente.</div>}
                      {(()=>{const done=tasks.filter(t=>t.done&&t.client_id===selectedClient.id).sort((a,b)=>(b.done_at||"").localeCompare(a.done_at||""));if(!done.length)return null;return(<div style={{marginTop:14}}><div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:8,paddingTop:10,borderTop:"1px solid "+BOR}}>✓ CONCLUÍDAS ({done.length})</div>{done.map(t=>(<div key={t.id} className="hr" style={{display:"flex",alignItems:"center",gap:9,padding:"8px 7px",borderBottom:"1px solid "+BOR,borderRadius:4,opacity:.7}}><div style={{width:5,height:5,borderRadius:1,background:GREEN,flexShrink:0}}/><div style={{flex:1}}><div style={{fontFamily:"'DM Sans'",fontSize:13,textDecoration:"line-through",color:MUTED}}>{t.title}</div><div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:HINT}}>{t.type||"Tarefa"} · {t.done_at?new Date(t.done_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}):""}</div></div><button onClick={()=>{setTaskEdit({...t});setTaskModal(true);}} style={{...btnGhost,padding:"2px 5px",fontSize:10}}>✏️</button><button onClick={()=>reopenTask(t.id)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:ACCENT,borderColor:ACCENT+"33"}}>↩ reabrir</button></div>))}</div>);})()}
                    </div>
                    <div style={{...card,marginTop:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2}}>LEADS</div>
                        <button onClick={()=>{setLeadEdit({name:"",contact:"",service:"",proposed_value:0,status:"novo",last_contact:today(),follow_up_date:"",notes:""});setLeadModal(true);}} style={{...btnGhost,fontSize:11,padding:"4px 10px"}}>+ Lead</button>
                      </div>
                      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                        {["todos","novo","proposta_enviada","em_negociacao","fechado","perdido","followup"].map(f=>{
                          const lbs={"todos":"Todos","novo":"Novo","proposta_enviada":"Proposta","em_negociacao":"Negociando","fechado":"Fechado","perdido":"Perdido","followup":"🔔 Follow-up"};
                          const cnt=f==="todos"?leads.filter(l=>!l.converted).length:f==="followup"?leads.filter(l=>!l.converted&&l.follow_up_date&&deadlineDiff(l.follow_up_date)<=0).length:leads.filter(l=>!l.converted&&l.status===f).length;
                          const isActive=leadFilter===f;
                          return(<button key={f} onClick={()=>setLeadFilter(f)} style={{...btnGhost,fontSize:10,padding:"3px 9px",color:isActive?ACCENT:MUTED,borderColor:isActive?ACCENT+"44":BOR,background:isActive?ACCENT+"10":undefined}}>{lbs[f]} {cnt>0&&<span style={{background:f==="followup"?RED+"30":ACCENT+"20",color:f==="followup"?RED:ACCENT,borderRadius:10,padding:"0 5px",marginLeft:3,fontSize:9}}>{cnt}</span>}</button>);
                        })}
                        <input value={leadSearch} onChange={e=>setLeadSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...inp,width:150,fontSize:11,padding:"4px 8px",marginLeft:"auto"}}/>
                      </div>
                      {(()=>{
                        const totalPipeline=leads.filter(l=>!l.converted&&["novo","proposta_enviada","em_negociacao"].includes(l.status)).reduce((s,l)=>s+(l.proposed_value||0),0);
                        const filtered=leads.filter(l=>{
                          if(l.converted)return false;
                          if(leadSearch&&!l.name.toLowerCase().includes(leadSearch.toLowerCase()))return false;
                          if(leadFilter==="todos")return true;
                          if(leadFilter==="followup")return l.follow_up_date&&deadlineDiff(l.follow_up_date)<=0;
                          return l.status===leadFilter;
                        });
                        const LSTATUS={"novo":{l:"Novo",c:BLUE},"proposta_enviada":{l:"Proposta",c:ACCENT},"em_negociacao":{l:"Negociando",c:ORANGE},"fechado":{l:"Fechado",c:GREEN},"perdido":{l:"Perdido",c:RED}};
                        return(
                          <div>
                            {totalPipeline>0&&<div style={{background:ACCENT+"10",border:"1px solid "+ACCENT+"22",borderRadius:6,padding:"6px 10px",marginBottom:10,fontFamily:"'DM Sans'",fontSize:12,color:ACCENT}}>💰 Pipeline total: <strong>{fmtCurrency(totalPipeline)}</strong></div>}
                            {filtered.map(lead=>{
                              const ls=LSTATUS[lead.status]||LSTATUS["novo"];
                              const fuDiff=lead.follow_up_date?deadlineDiff(lead.follow_up_date):null;
                              const fuOverdue=fuDiff!==null&&fuDiff<=0;
                              return(
                                <div key={lead.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 8px",borderBottom:"1px solid "+BOR,background:fuOverdue?RED+"06":undefined,borderRadius:4}}>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                                      <span style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1}}>{lead.name}</span>
                                      <span style={{background:ls.c+"20",color:ls.c,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>{ls.l}</span>
                                      {lead.proposed_value>0&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:ACCENT,fontWeight:600}}>{fmtCurrency(lead.proposed_value)}</span>}
                                      {fuDiff!==null&&<span style={{fontSize:10,color:fuOverdue?RED:fuDiff<=2?ACCENT:MUTED}}>🔔{fuOverdue?"HOJE":fuDiff+"d"}</span>}
                                    </div>
                                    <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,display:"flex",gap:8,flexWrap:"wrap"}}>
                                      {lead.contact&&<span>📱 {lead.contact}</span>}
                                      {lead.service&&<span>🎯 {lead.service}</span>}
                                      {lead.video_minutes>0&&<span>⏱ {lead.video_minutes}min</span>}
                                    </div>
                                  </div>
                                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                                    <button onClick={()=>generateProposal(lead)} style={{...btnGhost,padding:"3px 7px",fontSize:10,color:PURP,borderColor:PURP+"44"}}>📄 Proposta</button>
                                    <button onClick={()=>{setLeadEdit({...lead});setLeadModal(true);}} style={{...btnGhost,padding:"3px 6px",fontSize:10}}>✏️</button>
                                    <button onClick={()=>convertLead(lead)} style={{...btnGhost,padding:"3px 7px",fontSize:10,color:GREEN,borderColor:GREEN+"44"}}>→ Cliente</button>
                                    <button onClick={()=>deleteLead(lead.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                                  </div>
                                </div>
                              );
                            })}
                            {filtered.length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:16}}>Nenhum lead neste filtro.</div>}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })():(
                <div style={{...card,display:"flex",alignItems:"center",justifyContent:"center",minHeight:260}}>
                  <div style={{textAlign:"center",color:MUTED}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:HINT,marginBottom:8}}>◈</div>
                    <div style={{fontFamily:"'DM Sans'",fontSize:14}}>Selecione um cliente</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab===7&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>FINANÇAS</div>
              <button onClick={()=>{setInvoiceEdit({client_id:"",description:"",amount:0,status:"pendente",issued_date:today(),due_date:today(),notes:""});setInvoiceModal(true);}} style={btnGold}>+ NOVA NF</button>
            </div>
            <div style={{...card,marginBottom:16}}>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:2}}>
                  {["mensal","anual"].map(p=>(
                    <button key={p} onClick={()=>setInvoicePeriod(p)} style={{...btnGhost,fontSize:11,padding:"5px 14px",color:invoicePeriod===p?ACCENT:MUTED,borderColor:invoicePeriod===p?ACCENT+"44":BOR,background:invoicePeriod===p?ACCENT+"10":undefined}}>{p==="mensal"?"Mensal":"Anual"}</button>
                  ))}
                </div>
                <select value={invoiceYear} onChange={e=>setInvoiceYear(parseInt(e.target.value))} style={{...inp,width:"auto"}}>
                  {[new Date().getFullYear()-1,new Date().getFullYear(),new Date().getFullYear()+1].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                {invoicePeriod==="mensal"&&(
                  <select value={invoiceMonth} onChange={e=>setInvoiceMonth(parseInt(e.target.value))} style={{...inp,width:"auto"}}>
                    {MONTHS_LABELS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {[{l:"Emitido",v:totalEmitido,c:TEXT},{l:"Recebido",v:totalRecebido,c:GREEN},{l:"A receber",v:totalPendente,c:ACCENT},{l:"Vencido",v:totalVencido,c:RED}].map(m=>(
                <div key={m.l} style={card}><span style={lbl}>{m.l}</span><div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1,color:m.c}}>{fmtCurrency(m.v)}</div></div>
              ))}
            </div>
            {invoicePeriod==="anual"&&(
              <div style={{...card,marginBottom:16}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2,marginBottom:14}}>FATURAMENTO {invoiceYear}</div>
                <div style={{display:"flex",gap:4,alignItems:"flex-end",height:120}}>
                  {Array.from({length:12},(_,m)=>{
                    const key=invoiceYear+"-"+String(m+1).padStart(2,"0");
                    const monthInvs=invoices.filter(i=>i.issued_date?.startsWith(key));
                    const emitido=monthInvs.reduce((s,i)=>s+(i.amount||0),0);
                    const recebido=monthInvs.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0);
                    const maxVal=Math.max(...Array.from({length:12},(_,mm)=>{const k=invoiceYear+"-"+String(mm+1).padStart(2,"0");return invoices.filter(i=>i.issued_date?.startsWith(k)).reduce((s,i)=>s+(i.amount||0),0);}),1);
                    return(
                      <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        <div style={{width:"100%",display:"flex",flexDirection:"column",gap:2,alignItems:"center",justifyContent:"flex-end",height:100}}>
                          <div style={{width:"100%",background:GREEN,borderRadius:"2px 2px 0 0",height:Math.round((recebido/maxVal)*90)+"px",minHeight:recebido>0?3:0,transition:"height .4s"}}/>
                          <div style={{width:"100%",background:ACCENT+"60",borderRadius:"2px 2px 0 0",height:Math.round(((emitido-recebido)/maxVal)*90)+"px",minHeight:emitido>recebido?2:0,transition:"height .4s"}}/>
                        </div>
                        <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{MONTHS_LABELS[m]}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:12,marginTop:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,background:GREEN,borderRadius:2}}/><span style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>Recebido</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,background:ACCENT+"60",borderRadius:2}}/><span style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>Pendente</span></div>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
              {["todos","pendente","pago","vencido","cancelado"].map(f=>(
                <button key={f} onClick={()=>setInvoiceFilter(f)} style={{...btnGhost,fontSize:11,color:invoiceFilter===f?ACCENT:MUTED,borderColor:invoiceFilter===f?ACCENT+"44":BOR,background:invoiceFilter===f?ACCENT+"10":undefined}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
              ))}
            </div>
            <div style={card}>
              <div style={{display:"grid",gridTemplateColumns:"70px 1fr 120px 120px 100px 100px 120px",padding:"5px 10px",borderBottom:"1px solid "+BOR,fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase"}}>
                <div>NF</div><div>Descrição</div><div>Cliente</div><div style={{textAlign:"right"}}>Valor</div><div style={{textAlign:"center"}}>Vencimento</div><div style={{textAlign:"center"}}>Status</div><div style={{textAlign:"center"}}>Ações</div>
              </div>
              {periodInvoices.filter(i=>invoiceFilter==="todos"||i.status===invoiceFilter).map(i=>{
                const SC={pendente:ACCENT,pago:GREEN,vencido:RED,cancelado:MUTED};
                return(
                  <div key={i.id} className="hr" style={{display:"grid",gridTemplateColumns:"70px 1fr 120px 120px 100px 100px 120px",padding:"10px 10px",borderBottom:"1px solid "+BOR,alignItems:"center",borderRadius:4}}>
                    <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{i.number||"—"}</div>
                    <div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500}}>{i.description||"Sem descrição"}</div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>{fmtDate(i.issued_date)}</div>
                    </div>
                    <div><span style={{background:getClientColor(i.client_id)+"20",color:getClientColor(i.client_id),borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>{getClientName(i.client_id)}</span></div>
                    <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono'",fontWeight:600,fontSize:12,color:SC[i.status]||TEXT}}>{fmtCurrency(i.amount)}</div>
                    <div style={{textAlign:"center",fontFamily:"'IBM Plex Mono'",fontSize:10,color:deadlineColor(i.due_date)}}>{fmtDate(i.due_date)}</div>
                    <div style={{textAlign:"center"}}><span style={{background:(SC[i.status]||TEXT)+"20",color:SC[i.status]||TEXT,borderRadius:4,padding:"2px 6px",fontSize:10,fontWeight:600}}>{i.status}</span></div>
                    <div style={{display:"flex",gap:3,justifyContent:"center"}}>
                      {i.status==="pendente"&&<button onClick={()=>markInvoicePaid(i.id)} style={{...btnGhost,padding:"2px 6px",fontSize:10,color:GREEN,borderColor:GREEN+"33"}}>✓</button>}
                      <button onClick={()=>{setInvoiceEdit({...i});setInvoiceModal(true);}} style={{...btnGhost,padding:"2px 5px",fontSize:10}}>✏️</button>
                      <button onClick={()=>duplicateInvoice(i)} style={{...btnGhost,padding:"2px 5px",fontSize:10,color:BLUE,borderColor:BLUE+"33"}}>⧉</button>
                      <button onClick={()=>deleteInvoice(i.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  </div>
                );
              })}
              {periodInvoices.length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:28}}>Nenhuma nota fiscal neste período.</div>}
            </div>
            <div style={{...card,marginTop:14}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,marginBottom:12}}>POR CLIENTE</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:9}}>
                {clients.map(c=>{
                  const ci=invoices.filter(i=>i.client_id===c.id);
                  const total=ci.reduce((s,i)=>s+(i.amount||0),0);
                  const pago=ci.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0);
                  if(!total)return null;
                  return(
                    <div key={c.id} style={{background:BG3,borderRadius:9,padding:"11px 12px",borderLeft:"3px solid "+(c.color||ACCENT)}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,marginBottom:6}}>{c.name}</div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>Total</span><span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,fontWeight:600}}>{fmtCurrency(total)}</span></div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED}}>Recebido</span><span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:GREEN,fontWeight:600}}>{fmtCurrency(pago)}</span></div>
                      <div style={{background:BG,borderRadius:2,height:3,overflow:"hidden"}}><div style={{height:"100%",width:(total?Math.min(100,Math.round(pago/total*100)):0)+"%",background:c.color||ACCENT,borderRadius:2}}/></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab===8&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>BIBLIOTECA</div>
              <button onClick={()=>{setLibEdit({type:"hook",content:"",niche:"",score:0});setLibModal(true);}} style={btnGold}>+ ADICIONAR</button>
            </div>
            <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              {["todos","hook","titulo","cta","thumbnail","template"].map(f=>(
                <button key={f} onClick={()=>setLibFilter(f)} style={{...btnGhost,fontSize:11,color:libFilter===f?ACCENT:MUTED,borderColor:libFilter===f?ACCENT+"44":BOR,background:libFilter===f?ACCENT+"10":undefined}}>{f==="todos"?"Todos":f}</button>
              ))}
              <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...inp,width:200,marginLeft:"auto"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:11}}>
              {library.filter(l=>libFilter==="todos"||l.type===libFilter).filter(l=>!libSearch||l.content.toLowerCase().includes(libSearch.toLowerCase())).map(l=>{
                const TC={hook:ACCENT,titulo:BLUE,cta:GREEN,thumbnail:PURP,template:RED};
                return(
                  <div key={l.id} style={{...card,borderLeft:"3px solid "+(TC[l.type]||ACCENT),marginBottom:0}} className="hc">
                    <div style={{display:"flex",gap:7,marginBottom:9,alignItems:"center"}}>
                      <span style={{background:(TC[l.type]||ACCENT)+"20",color:TC[l.type]||ACCENT,borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:600}}>{l.type}</span>
                      {l.niche&&<span style={{background:ACCENT+"15",color:ACCENT,borderRadius:4,padding:"1px 5px",fontSize:10}}>{l.niche}</span>}
                    </div>
                    <div style={{fontFamily:"'DM Sans'",fontSize:13,lineHeight:1.65,marginBottom:10}}>{l.content}</div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>navigator.clipboard.writeText(l.content)} style={{...btnGhost,fontSize:10,padding:"3px 8px",flex:1,color:ACCENT,borderColor:ACCENT+"33"}}>📋 Copiar</button>
                      <button onClick={()=>{setLibEdit({...l});setLibModal(true);}} style={{...btnGhost,fontSize:10,padding:"3px 7px"}}>✏️</button>
                      <button onClick={()=>deleteLib(l.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  </div>
                );
              })}
              {library.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:MUTED,fontFamily:"'DM Sans'",fontSize:14}}>📚 Biblioteca vazia.</div>}
            </div>
          </div>
        )}

        {activeTab===9&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>🔥 TRENDING YOUTUBE</div>
                {lastUpdated&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginTop:4}}>Atualizado: {lastUpdated.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:activeNiches[0]?.name||"",subscribers:"",notes:""});setRefChannelModal(true);}} style={{...btnGhost,fontSize:11}}>+ Canal</button>
                <button onClick={fetchTrending} disabled={trendingLoading} style={{...btnGold,opacity:trendingLoading?.7:1}}>{trendingLoading?"BUSCANDO...":"🔄 ATUALIZAR AGORA"}</button>
              </div>
            </div>
            <div style={{display:"flex",gap:2,borderBottom:"1px solid "+BOR,marginBottom:20,overflowX:"auto"}}>
              {["brasil","mundial",...activeNiches.map(n=>n.name),"canais_ref"].map(t=>(
                <button key={t} onClick={()=>setTrendingTab(t)} style={{fontFamily:"'DM Sans'",fontSize:12,color:trendingTab===t?ACCENT:MUTED,background:"transparent",border:"none",borderBottom:trendingTab===t?"2px solid "+ACCENT:"2px solid transparent",padding:"10px 14px",cursor:"pointer",whiteSpace:"nowrap",fontWeight:trendingTab===t?600:400}}>{t==="brasil"?"🇧🇷 Brasil":t==="mundial"?"🌍 Mundial":t==="canais_ref"?"📺 Canais Referências":t}</button>
              ))}
            </div>
            {(()=>{
              if(trendingTab==="canais_ref") return(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>Adicione canais e busque os vídeos mais vistos de cada um.</div>
                    <button onClick={()=>{setTrendingRefEdit({name:"",channel_id:"",url:"",notes:""});setTrendingRefModal(true);}} style={btnGold}>+ CANAL</button>
                  </div>
                  {trendingRefChannels.length===0&&(
                    <div style={{...card,textAlign:"center",padding:36}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:MUTED,marginBottom:8}}>NENHUM CANAL CADASTRADO</div>
                      <button onClick={()=>{setTrendingRefEdit({name:"",channel_id:"",url:"",notes:""});setTrendingRefModal(true);}} style={btnGold}>+ ADICIONAR CANAL</button>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
                    {trendingRefChannels.map(ch=>(
                      <div key={ch.id} style={{...card,marginBottom:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1}}>{ch.name}</div>
                            {ch.url&&<a href={ch.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,color:BLUE,textDecoration:"none"}}>▶ Ver canal</a>}
                            {ch.notes&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginTop:3}}>{ch.notes}</div>}
                          </div>
                          <div style={{display:"flex",gap:5,flexShrink:0}}>
                            <button onClick={()=>fetchTrendingRefVideos(ch)} disabled={trendingRefLoading===ch.id} style={{...btnGhost,fontSize:11,padding:"3px 10px",color:ACCENT,borderColor:ACCENT+"44",opacity:trendingRefLoading===ch.id?.5:1}}>{trendingRefLoading===ch.id?"...":trendingRefVideos[ch.id]?"✓ "+trendingRefVideos[ch.id].length+" vídeos":"▶ Buscar"}</button>
                            <button onClick={()=>{setTrendingRefEdit({...ch});setTrendingRefModal(true);}} style={{...btnGhost,padding:"3px 6px",fontSize:10}}>✏️</button>
                            <button onClick={()=>deleteTrendingRefChannel(ch.id)} style={{background:"none",border:"none",color:HINT,cursor:"pointer",fontSize:12}}>✕</button>
                          </div>
                        </div>
                        {trendingRefVideos[ch.id]?.map((v,i)=>(
                          <div key={v.id} style={{display:"flex",gap:8,padding:"6px 0",borderTop:"1px solid "+BOR,alignItems:"center"}}>
                            <span style={{fontFamily:"'Bebas Neue'",fontSize:14,color:HINT,width:22,flexShrink:0}}>{i+1}</span>
                            {v.thumb&&<img src={v.thumb} alt="" style={{width:56,height:40,borderRadius:3,objectFit:"cover",flexShrink:0}}/>}
                            <div style={{flex:1,minWidth:0}}>
                              <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                              <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div>
                            </div>
                            <div style={{display:"flex",gap:4,flexShrink:0}}>
                              <button onClick={()=>saveQuickIdea(v.title)} style={{...btnGhost,padding:"1px 6px",fontSize:9,color:GREEN,borderColor:GREEN+"33"}}>+ideia</button>
                              <button onClick={()=>setUseAsBaseModal(v)} style={{...btnGhost,padding:"1px 6px",fontSize:9,color:ACCENT,borderColor:ACCENT+"33"}}>base</button>
                            </div>
                          </div>
                        ))}
                        {!trendingRefVideos[ch.id]&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:HINT,padding:"8px 0"}}>Clique em Buscar para carregar os vídeos.</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
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
                  {virals.length>0&&(
                    <div style={{...card,borderColor:RED+"44",marginBottom:18}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2,color:RED,marginBottom:10}}>🚀 VIRALIZANDO AGORA</div>
                      {virals.map(v=>(
                        <div key={v.id} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"1px solid "+BOR,alignItems:"center"}}>
                          {v.thumb&&<img src={v.thumb} alt="" style={{width:56,height:40,borderRadius:3,objectFit:"cover",flexShrink:0}}/>}
                          <div style={{flex:1,minWidth:0}}>
                            <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                            <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{v.channel} · {v.views?.toLocaleString("pt-BR")} views</div>
                          </div>
                          <span style={{background:RED+"20",color:RED,borderRadius:4,padding:"2px 7px",fontFamily:"'IBM Plex Mono'",fontSize:11,fontWeight:600,flexShrink:0}}>🚀 +{v.growth}%</span>
                          <div style={{display:"flex",gap:5,flexShrink:0}}>
                            <button onClick={()=>saveQuickIdea(v.title)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:GREEN+"33"}}>+ideia</button>
                            <button onClick={()=>setUseAsBaseModal(v)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:ACCENT,borderColor:ACCENT+"33"}}>base</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:11}}>
                    {list.map((v,i)=>(
                      <div key={v.id} style={{...card,display:"flex",gap:10,marginBottom:0,alignItems:"flex-start"}} className="hc">
                        <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:HINT,width:26,flexShrink:0,marginTop:4}}>{i+1}</span>
                        {v.thumb&&<img src={v.thumb} alt="" style={{width:76,height:56,borderRadius:5,objectFit:"cover",flexShrink:0}}/>}
                        <div style={{flex:1,minWidth:0}}>
                          <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,color:TEXT,textDecoration:"none",display:"block",lineHeight:1.4,marginBottom:4}}>{v.title}</a>
                          <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:5}}>{v.channel} · {v.views?.toLocaleString("pt-BR")} views</div>
                          {v.growth>0&&<span style={{background:(v.growth>50?RED:v.growth>20?ACCENT:GREEN)+"20",color:v.growth>50?RED:v.growth>20?ACCENT:GREEN,borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:600,display:"inline-block",marginBottom:5}}>🚀 +{v.growth}%</span>}
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            <button onClick={()=>saveQuickIdea(v.title)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:GREEN+"33"}}>+ ideia</button>
                            <button onClick={()=>setUseAsBaseModal(v)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:ACCENT,borderColor:ACCENT+"33"}}>usar como base</button>
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

      </div>

      <button onClick={()=>setQuickCapture(true)} style={{position:"fixed",bottom:26,right:26,width:50,height:50,borderRadius:"50%",background:ACCENT,color:"#111",border:"none",cursor:"pointer",fontSize:22,fontWeight:700,boxShadow:"0 4px 18px "+ACCENT+"50",zIndex:100}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>+</button>

      {quickCapture&&<div onClick={e=>e.target===e.currentTarget&&setQuickCapture(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:400,padding:26}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,marginBottom:14}}>CAPTURA RÁPIDA</div><textarea value={quickText} onChange={e=>setQuickText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&saveQuickCapture&&null} placeholder="Ideia, tarefa, pensamento..." style={{...inp,minHeight:70,marginBottom:12}} autoFocus/><div style={{display:"flex",gap:7,marginBottom:14}}>{[["idea","💡 Ideia"],["task","✓ Tarefa"]].map(([v,l])=><button key={v} onClick={()=>setQuickDest(v)} style={{...btnGhost,flex:1,color:quickDest===v?ACCENT:MUTED,borderColor:quickDest===v?ACCENT+"44":BOR,background:quickDest===v?ACCENT+"10":undefined}}>{l}</button>)}</div><div style={{display:"flex",gap:9}}><button onClick={()=>setQuickCapture(false)} style={btnGhost}>Cancelar</button><button onClick={async()=>{if(!quickText.trim())return;if(quickDest==="idea"){const{data}=await supabase.from("ideas").insert({title:quickText.trim(),source:"quick"}).select().single();if(data)setIdeas(prev=>[data,...prev]);}else{const{data}=await supabase.from("tasks").insert({title:quickText.trim(),urgency:"normal",estimated_hours:1}).select().single();if(data)setTasks(prev=>[data,...prev]);}setQuickText("");setQuickCapture(false);flash();}} style={{...btnGold,flex:1}}>SALVAR</button></div></div></div>}

      {taskModal&&taskEdit&&<div onClick={e=>e.target===e.currentTarget&&(setTaskModal(false),setTaskEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:520,padding:26,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{taskEdit.id?"EDITAR TAREFA":"NOVA TAREFA"}</div><button onClick={()=>{setTaskModal(false);setTaskEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Título</span><input value={taskEdit.title||""} onChange={e=>setTaskEdit({...taskEdit,title:e.target.value})} style={inp}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{marginBottom:12}}><span style={lbl}>Cliente</span><select value={taskEdit.client_id||""} onChange={e=>setTaskEdit({...taskEdit,client_id:e.target.value})} style={inp}><option value="">Sem cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div style={{marginBottom:12}}><span style={lbl}>Tipo</span><select value={taskEdit.type||"Roteiro"} onChange={e=>setTaskEdit({...taskEdit,type:e.target.value})} style={inp}>{TASK_TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div style={{marginBottom:12}}><span style={lbl}>Urgência</span><select value={taskEdit.urgency||"normal"} onChange={e=>setTaskEdit({...taskEdit,urgency:e.target.value})} style={inp}><option value="normal">Normal</option><option value="warn">Atenção</option><option value="hot">Urgente 🔥</option></select></div><div style={{marginBottom:12}}><span style={lbl}>Horas est.</span><input type="number" value={taskEdit.estimated_hours||1} step="0.5" min="0.5" onChange={e=>setTaskEdit({...taskEdit,estimated_hours:parseFloat(e.target.value)||1})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Data</span><input type="date" value={taskEdit.deadline||""} onChange={e=>setTaskEdit({...taskEdit,deadline:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Horário</span><input type="time" value={taskEdit.task_time||""} onChange={e=>setTaskEdit({...taskEdit,task_time:e.target.value})} style={inp}/></div></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={taskEdit.notes||""} onChange={e=>setTaskEdit({...taskEdit,notes:e.target.value})} style={{...inp,minHeight:55}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setTaskModal(false);setTaskEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveTask} style={btnGold}>SALVAR</button></div></div></div>}

      {clientModal&&clientEdit&&<div onClick={e=>e.target===e.currentTarget&&(setClientModal(false),setClientEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:480,padding:26,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{clientEdit.id?"EDITAR CLIENTE":"NOVO CLIENTE"}</div><button onClick={()=>{setClientModal(false);setClientEdit(null);}} style={btnGhost}>✕</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{marginBottom:12}}><span style={lbl}>Nome</span><input value={clientEdit.name||""} onChange={e=>setClientEdit({...clientEdit,name:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Cor</span><input type="color" value={clientEdit.color||ACCENT} onChange={e=>setClientEdit({...clientEdit,color:e.target.value})} style={{...inp,padding:4,height:38}}/></div><div style={{marginBottom:12}}><span style={lbl}>Tipo</span><input value={clientEdit.type||""} onChange={e=>setClientEdit({...clientEdit,type:e.target.value})} placeholder="YouTube, Podcast..." style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Cadência</span><input value={clientEdit.frequency||""} onChange={e=>setClientEdit({...clientEdit,frequency:e.target.value})} placeholder="3x semana" style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Valor do contrato (R$)</span><input type="number" value={clientEdit.contract_value||0} onChange={e=>setClientEdit({...clientEdit,contract_value:parseFloat(e.target.value)||0})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>R$/hora ideal</span><input type="number" value={clientEdit.rate_per_hour||0} onChange={e=>setClientEdit({...clientEdit,rate_per_hour:parseFloat(e.target.value)||0})} style={inp}/></div></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={clientEdit.notes||""} onChange={e=>setClientEdit({...clientEdit,notes:e.target.value})} style={{...inp,minHeight:55}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setClientModal(false);setClientEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveClient} style={btnGold}>SALVAR</button></div></div></div>}

      {invoiceModal&&invoiceEdit&&<div onClick={e=>e.target===e.currentTarget&&(setInvoiceModal(false),setInvoiceEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:480,padding:26,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{invoiceEdit.id?"EDITAR NF":"NOVA NF"}</div><button onClick={()=>{setInvoiceModal(false);setInvoiceEdit(null);}} style={btnGhost}>✕</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{marginBottom:12}}><span style={lbl}>Cliente</span><select value={invoiceEdit.client_id||""} onChange={e=>setInvoiceEdit({...invoiceEdit,client_id:e.target.value})} style={inp}><option value="">Selecionar...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div style={{marginBottom:12}}><span style={lbl}>Número NF</span><input value={invoiceEdit.number||""} onChange={e=>setInvoiceEdit({...invoiceEdit,number:e.target.value})} placeholder="NF-001" style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Valor (R$)</span><input type="number" value={invoiceEdit.amount||0} step="0.01" onChange={e=>setInvoiceEdit({...invoiceEdit,amount:parseFloat(e.target.value)||0})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Status</span><select value={invoiceEdit.status||"pendente"} onChange={e=>setInvoiceEdit({...invoiceEdit,status:e.target.value})} style={inp}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="vencido">Vencido</option><option value="cancelado">Cancelado</option></select></div><div style={{marginBottom:12}}><span style={lbl}>Emissão</span><input type="date" value={invoiceEdit.issued_date||""} onChange={e=>setInvoiceEdit({...invoiceEdit,issued_date:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Vencimento</span><input type="date" value={invoiceEdit.due_date||""} onChange={e=>setInvoiceEdit({...invoiceEdit,due_date:e.target.value})} style={inp}/></div></div><div style={{marginBottom:12}}><span style={lbl}>Descrição</span><input value={invoiceEdit.description||""} onChange={e=>setInvoiceEdit({...invoiceEdit,description:e.target.value})} placeholder="Produção de conteúdo..." style={inp}/></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={invoiceEdit.notes||""} onChange={e=>setInvoiceEdit({...invoiceEdit,notes:e.target.value})} style={{...inp,minHeight:50}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setInvoiceModal(false);setInvoiceEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveInvoice} style={btnGold}>SALVAR</button></div></div></div>}

      {libModal&&libEdit&&<div onClick={e=>e.target===e.currentTarget&&(setLibModal(false),setLibEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:480,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{libEdit.id?"EDITAR":"NOVO ITEM"}</div><button onClick={()=>{setLibModal(false);setLibEdit(null);}} style={btnGhost}>✕</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><span style={lbl}>Tipo</span><select value={libEdit.type||"hook"} onChange={e=>setLibEdit({...libEdit,type:e.target.value})} style={inp}>{["hook","titulo","cta","thumbnail","template"].map(t=><option key={t}>{t}</option>)}</select></div><div><span style={lbl}>Nicho</span><select value={libEdit.niche||""} onChange={e=>setLibEdit({...libEdit,niche:e.target.value})} style={inp}><option value="">Geral</option>{activeNiches.map(n=><option key={n.id}>{n.name}</option>)}</select></div></div><div style={{marginBottom:14}}><span style={lbl}>Conteúdo</span><textarea value={libEdit.content||""} onChange={e=>setLibEdit({...libEdit,content:e.target.value})} style={{...inp,minHeight:90}} placeholder="Hook, título, CTA..."/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setLibModal(false);setLibEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveLib} style={btnGold}>SALVAR</button></div></div></div>}

      {goalModal&&goalEdit&&<div onClick={e=>e.target===e.currentTarget&&(setGoalModal(false),setGoalEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:460,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>NOVA META</div><button onClick={()=>{setGoalModal(false);setGoalEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Título</span><input value={goalEdit.title||""} onChange={e=>setGoalEdit({...goalEdit,title:e.target.value})} placeholder="Ex: 100k inscritos" style={inp}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><span style={lbl}>Tipo</span><select value={goalEdit.type||"videos_mes"} onChange={e=>setGoalEdit({...goalEdit,type:e.target.value})} style={inp}>{Object.entries(GOAL_TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div><div><span style={lbl}>Horizonte</span><select value={goalEdit.horizon||"curto"} onChange={e=>setGoalEdit({...goalEdit,horizon:e.target.value})} style={inp}><option value="curto">Curto Prazo</option><option value="medio">Médio Prazo</option><option value="longo">Longo Prazo</option></select></div><div><span style={lbl}>Valor alvo</span><input type="number" value={goalEdit.target_value||0} onChange={e=>setGoalEdit({...goalEdit,target_value:parseFloat(e.target.value)||0})} style={inp}/></div><div><span style={lbl}>Valor atual</span><input type="number" value={goalEdit.current_value||0} onChange={e=>setGoalEdit({...goalEdit,current_value:parseFloat(e.target.value)||0})} style={inp}/></div><div><span style={lbl}>Data alvo</span><input type="date" value={goalEdit.target_date||""} onChange={e=>setGoalEdit({...goalEdit,target_date:e.target.value})} style={inp}/></div></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setGoalModal(false);setGoalEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveGoal} style={btnGold}>SALVAR</button></div></div></div>}

      {leadModal&&leadEdit&&<div onClick={e=>e.target===e.currentTarget&&(setLeadModal(false),setLeadEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:500,padding:26,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{leadEdit.id?"EDITAR LEAD":"NOVO LEAD"}</div><button onClick={()=>{setLeadModal(false);setLeadEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Nome</span><input value={leadEdit.name||""} onChange={e=>setLeadEdit({...leadEdit,name:e.target.value})} style={inp}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{marginBottom:12}}><span style={lbl}>Contato</span><input value={leadEdit.contact||""} onChange={e=>setLeadEdit({...leadEdit,contact:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Serviço</span><input value={leadEdit.service||""} onChange={e=>setLeadEdit({...leadEdit,service:e.target.value})} placeholder="Gestão de canal..." style={inp}/></div>
      <div style={{marginBottom:12,gridColumn:"1/-1"}}><span style={lbl}>📐 CALCULADORA DE PROPOSTA</span><div style={{background:BG3,borderRadius:8,padding:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}><div><span style={{...lbl,marginBottom:4}}>Duração (min)</span><input type="number" value={leadEdit.video_minutes||0} step="0.5" min="0" onChange={e=>{const min=parseFloat(e.target.value)||0;const desc=leadEdit.discount_pct||0;const bruto=min*6000;const final=bruto*(1-desc/100);setLeadEdit({...leadEdit,video_minutes:min,bruto_value:bruto,proposed_value:Math.round(final)});}} style={inp} placeholder="3.5"/></div><div><span style={{...lbl,marginBottom:4}}>Desconto %</span><input type="number" value={leadEdit.discount_pct||0} min="0" max="100" onChange={e=>{const desc=parseFloat(e.target.value)||0;const min=leadEdit.video_minutes||0;const bruto=min*6000;const final=bruto*(1-desc/100);setLeadEdit({...leadEdit,discount_pct:desc,bruto_value:bruto,proposed_value:Math.round(final)});}} style={inp} placeholder="30"/></div><div><span style={{...lbl,marginBottom:4}}>Valor final</span><div style={{background:BG2,border:"1px solid "+ACCENT+"44",borderRadius:6,padding:"8px 12px",fontFamily:"'Bebas Neue'",fontSize:16,color:ACCENT}}>{fmtCurrency(leadEdit.proposed_value||0)}</div></div></div>{(leadEdit.video_minutes||0)>0&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{leadEdit.video_minutes}min × R$6.000 = {fmtCurrency((leadEdit.video_minutes||0)*6000)}{(leadEdit.discount_pct||0)>0?" — "+leadEdit.discount_pct+"% = "+fmtCurrency(leadEdit.proposed_value||0):""}</div>}</div></div>
      <div style={{marginBottom:12}}><span style={lbl}>Status</span><select value={leadEdit.status||"novo"} onChange={e=>setLeadEdit({...leadEdit,status:e.target.value})} style={inp}>{["novo","proposta_enviada","em_negociacao","fechado","perdido"].map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select></div><div style={{marginBottom:12}}><span style={lbl}>Nº alterações permitidas</span><input type="number" value={leadEdit.max_revisions||2} min="0" onChange={e=>setLeadEdit({...leadEdit,max_revisions:parseInt(e.target.value)||0})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Forma de pagamento</span><select value={leadEdit.payment_method||""} onChange={e=>setLeadEdit({...leadEdit,payment_method:e.target.value})} style={inp}><option value="">Selecionar...</option><option value="50_50">50% entrada + 50% entrega</option><option value="100_entrega">100% na entrega</option><option value="100_entrada">100% entrada</option><option value="parcelado">Parcelado</option></select></div><div style={{marginBottom:12}}><span style={lbl}>Prazo de entrega</span><input type="date" value={leadEdit.deadline||""} onChange={e=>setLeadEdit({...leadEdit,deadline:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Follow-up em</span><input type="date" value={leadEdit.follow_up_date||""} onChange={e=>setLeadEdit({...leadEdit,follow_up_date:e.target.value})} style={inp}/></div></div><div style={{marginBottom:12}}><span style={lbl}>Escopo <span style={{color:HINT,fontSize:9,textTransform:"none",letterSpacing:0}}>aparece na proposta</span></span><textarea value={leadEdit.escopo||""} onChange={e=>setLeadEdit({...leadEdit,escopo:e.target.value})} placeholder="- Animação de personagens&#10;- Criação de cenários&#10;- Edição do clipe" style={{...inp,minHeight:90,whiteSpace:"pre-wrap"}}/></div><div style={{marginBottom:14}}><span style={{...lbl,color:HINT}}>Notas internas</span><textarea value={leadEdit.notes||""} onChange={e=>setLeadEdit({...leadEdit,notes:e.target.value})} style={{...inp,minHeight:50}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setLeadModal(false);setLeadEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveLead} style={btnGold}>SALVAR</button></div></div></div>}

      {ideaModal&&ideaEdit&&<div onClick={e=>e.target===e.currentTarget&&(setIdeaModal(false),setIdeaEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:460,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{ideaEdit.id?"EDITAR IDEIA":"NOVA IDEIA"}</div><button onClick={()=>{setIdeaModal(false);setIdeaEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Título</span><input value={ideaEdit.title||""} onChange={e=>setIdeaEdit({...ideaEdit,title:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Nicho</span><select value={ideaEdit.niche||""} onChange={e=>setIdeaEdit({...ideaEdit,niche:e.target.value})} style={inp}><option value="">Geral</option>{activeNiches.map(n=><option key={n.id}>{n.name}</option>)}</select></div><div style={{marginBottom:14}}><span style={lbl}>Descrição</span><textarea value={ideaEdit.description||""} onChange={e=>setIdeaEdit({...ideaEdit,description:e.target.value})} style={{...inp,minHeight:80}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setIdeaModal(false);setIdeaEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveIdeaEdit} style={btnGold}>SALVAR</button></div></div></div>}

      {nicheModal&&nicheEdit&&<div onClick={e=>e.target===e.currentTarget&&(setNicheModal(false),setNicheEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:440,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{nicheEdit.id?"EDITAR NICHO":"NOVO NICHO"}</div><button onClick={()=>{setNicheModal(false);setNicheEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Nome do nicho</span><input value={nicheEdit.name||""} onChange={e=>setNicheEdit({...nicheEdit,name:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Palavra-chave</span><input value={nicheEdit.keyword||""} onChange={e=>setNicheEdit({...nicheEdit,keyword:e.target.value})} style={inp}/></div><div style={{marginBottom:14}}><span style={lbl}>CPM estimado</span><input value={nicheEdit.cpm||""} onChange={e=>setNicheEdit({...nicheEdit,cpm:e.target.value})} placeholder="$6–11" style={inp}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setNicheModal(false);setNicheEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveNiche} style={btnGold}>SALVAR</button></div></div></div>}

      {refChannelModal&&refChannelEdit&&<div onClick={e=>e.target===e.currentTarget&&(setRefChannelModal(false),setRefChannelEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:460,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{refChannelEdit.id?"EDITAR CANAL":"NOVO CANAL"}</div><button onClick={()=>{setRefChannelModal(false);setRefChannelEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Nome</span><input value={refChannelEdit.name||""} onChange={e=>setRefChannelEdit({...refChannelEdit,name:e.target.value})} style={inp}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><span style={lbl}>Nicho</span><select value={refChannelEdit.niche||""} onChange={e=>setRefChannelEdit({...refChannelEdit,niche:e.target.value})} style={inp}><option value="">Selecionar...</option>{niches.map(n=><option key={n.id}>{n.name}</option>)}</select></div><div><span style={lbl}>Inscritos</span><input value={refChannelEdit.subscribers||""} onChange={e=>setRefChannelEdit({...refChannelEdit,subscribers:e.target.value})} placeholder="14M" style={inp}/></div></div><div style={{marginBottom:12}}><span style={lbl}>URL</span><input value={refChannelEdit.url||""} onChange={e=>setRefChannelEdit({...refChannelEdit,url:e.target.value})} style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Channel ID</span><input value={refChannelEdit.channel_id||""} onChange={e=>setRefChannelEdit({...refChannelEdit,channel_id:e.target.value})} placeholder="UCxxxxxxxxxx" style={inp}/></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={refChannelEdit.notes||""} onChange={e=>setRefChannelEdit({...refChannelEdit,notes:e.target.value})} style={{...inp,minHeight:55}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setRefChannelModal(false);setRefChannelEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveRefChannel} style={btnGold}>SALVAR</button></div></div></div>}

      {cmdK&&(
        <div onClick={()=>setCmdK(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:120}}>
          <div onClick={e=>e.stopPropagation()} style={{background:BG2,border:"1px solid "+BOR2,borderRadius:14,width:"100%",maxWidth:560,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:"1px solid "+BOR}}>
              <span style={{color:MUTED,fontSize:16}}>🔍</span>
              <input autoFocus value={cmdKQuery} onChange={e=>setCmdKQuery(e.target.value)} placeholder="Buscar tarefa, cliente, vídeo, ideia..." style={{...inp,background:"transparent",border:"none",fontSize:15,flex:1,padding:0}} onKeyDown={e=>e.key==="Escape"&&setCmdK(false)}/>
              <kbd style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED,background:BG3,border:"1px solid "+BOR,borderRadius:4,padding:"2px 6px"}}>ESC</kbd>
            </div>
            <div style={{maxHeight:400,overflowY:"auto",padding:8}}>
              {cmdKQuery.trim().length<2?(
                <div>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",padding:"8px 10px 4px"}}>Atalhos rápidos</div>
                  {[{label:"Dashboard",icon:"🏠",tab:0},{label:"Focus OS",icon:"⚡",tab:1},{label:"Metas",icon:"🎯",tab:2},{label:"Canais Dark",icon:"🎬",tab:4},{label:"Sr. Waldemar",icon:"⭐",tab:5},{label:"Clientes",icon:"◈",tab:6},{label:"Finanças",icon:"💰",tab:7},{label:"Trending",icon:"🔥",tab:9}].map(item=>(
                    <div key={item.tab} onClick={()=>{setActiveTab(item.tab);setCmdK(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:7,cursor:"pointer",fontFamily:"'DM Sans'",fontSize:13}} className="hr">
                      <span style={{fontSize:16}}>{item.icon}</span><span>{item.label}</span>
                    </div>
                  ))}
                </div>
              ):(()=>{
                const q=cmdKQuery.toLowerCase();
                const results=[];
                tasks.filter(t=>!t.done&&t.title.toLowerCase().includes(q)).slice(0,4).forEach(t=>results.push({type:"tarefa",icon:"✓",label:t.title,sub:getClientName(t.client_id),action:()=>{setTaskEdit({...t});setTaskModal(true);setCmdK(false);}}));
                clients.filter(c=>c.name.toLowerCase().includes(q)).slice(0,3).forEach(c=>results.push({type:"cliente",icon:"◈",label:c.name,sub:c.type,action:()=>{setActiveTab(6);setSelectedClient(c);setCmdK(false);}}));
                videos.filter(v=>(v.meu_titulo||v.title||"").toLowerCase().includes(q)).slice(0,4).forEach(v=>results.push({type:"vídeo",icon:"🎬",label:v.meu_titulo||v.title,sub:v.status+" · "+v.niche,action:()=>{setVideoDetailModal({...v});setCmdK(false);}}));
                ideas.filter(i=>!i.used&&i.title.toLowerCase().includes(q)).slice(0,3).forEach(i=>results.push({type:"ideia",icon:"💡",label:i.title,sub:i.niche||"Geral",action:()=>{setIdeaEdit({...i});setIdeaModal(true);setCmdK(false);}}));
                leads.filter(l=>!l.converted&&l.name.toLowerCase().includes(q)).slice(0,3).forEach(l=>results.push({type:"lead",icon:"📋",label:l.name,sub:l.service||l.status,action:()=>{setLeadEdit({...l});setLeadModal(true);setCmdK(false);}}));
                if(!results.length)return <div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:24}}>Nenhum resultado para "{cmdKQuery}"</div>;
                const types=[...new Set(results.map(r=>r.type))];
                return types.map(type=>(
                  <div key={type}>
                    <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",padding:"8px 10px 4px"}}>{type}s</div>
                    {results.filter(r=>r.type===type).map((r,i)=>(
                      <div key={i} onClick={r.action} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:7,cursor:"pointer"}} className="hr">
                        <span style={{fontSize:14,flexShrink:0}}>{r.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label}</div>
                          <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{r.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
            <div style={{padding:"8px 14px",borderTop:"1px solid "+BOR,display:"flex",gap:12}}>
              <span style={{fontFamily:"'DM Sans'",fontSize:11,color:HINT}}>⌘K para abrir · ESC para fechar</span>
              <span style={{fontFamily:"'DM Sans'",fontSize:11,color:HINT,marginLeft:"auto"}}>Busca: tarefas, clientes, vídeos, ideias, leads</span>
            </div>
          </div>
        </div>
      )}
      {proposalModal&&(()=>{
        const lead=proposalModal;
        const{bruto,desconto,final,pmLabel}=getProposalHTML(lead);
        const LSTATUS={"novo":"Novo","proposta_enviada":"Proposta Enviada","em_negociacao":"Em Negociação","fechado":"Fechado","perdido":"Perdido"};
        const proposalText=`PROPOSTA COMERCIAL\n\nCliente: ${lead.name}\nServiço: ${lead.service||"Produção de vídeo"}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nESCOPO DO PROJETO\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${lead.notes||"Produção de vídeo animado com locução em off."}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nINVESTIMENTO\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDuração: ${lead.video_minutes||0} minutos\nValor por minuto: R$ 6.000,00\nValor bruto: ${fmtCurrency(bruto)}${desconto>0?"\nDesconto: "+desconto+"%\nValor final: "+fmtCurrency(final):""}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCONDIÇÕES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nForma de pagamento: ${pmLabel}\nNº de alterações inclusas: ${lead.max_revisions||2}\nPrazo de entrega: ${lead.deadline?fmtDate(lead.deadline):"A combinar"}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nOBSERVAÇÕES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Alterações além do limite acordado serão cobradas à parte\n• O prazo inicia após aprovação do roteiro e pagamento da entrada\n• Revisões devem ser solicitadas em até 48h após entrega\n\nProposta válida por 7 dias.`;
        return(
          <div onClick={e=>e.target===e.currentTarget&&setProposalModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:600,maxHeight:"90vh",overflowY:"auto",padding:30}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:2}}>📄 PROPOSTA COMERCIAL</div>
                <button onClick={()=>setProposalModal(null)} style={btnGhost}>✕</button>
              </div>
              <div style={{background:BG3,borderRadius:10,padding:24,marginBottom:20,border:"1px solid "+BOR2}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:4}}>{lead.name}</div>
                <div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,marginBottom:20}}>{lead.service||"Produção de vídeo"}</div>
                <div style={{borderTop:"1px solid "+BOR,paddingTop:16,marginBottom:16}}>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Investimento</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div style={{background:BG2,borderRadius:7,padding:"10px 12px"}}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,marginBottom:3}}>Duração</div>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:TEXT}}>{lead.video_minutes||0} minutos</div>
                    </div>
                    <div style={{background:BG2,borderRadius:7,padding:"10px 12px"}}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,marginBottom:3}}>Valor por minuto</div>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:TEXT}}>R$ 6.000</div>
                    </div>
                  </div>
                  {desconto>0&&(
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontFamily:"'DM Sans'",fontSize:12}}>
                      <span style={{color:MUTED}}>Valor bruto</span>
                      <span style={{textDecoration:"line-through",color:MUTED}}>{fmtCurrency(bruto)}</span>
                    </div>
                  )}
                  {desconto>0&&(
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontFamily:"'DM Sans'",fontSize:12}}>
                      <span style={{color:GREEN}}>Desconto {desconto}%</span>
                      <span style={{color:GREEN}}>- {fmtCurrency(bruto-final)}</span>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderTop:"1px solid "+BOR,marginTop:6}}>
                    <span style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1}}>VALOR FINAL</span>
                    <span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACCENT}}>{fmtCurrency(final)}</span>
                  </div>
                </div>
                <div style={{borderTop:"1px solid "+BOR,paddingTop:16,marginBottom:16}}>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Condições</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{l:"Pagamento",v:pmLabel},{l:"Alterações",v:(lead.max_revisions||2)+" inclusas"},{l:"Prazo",v:lead.deadline?fmtDate(lead.deadline):"A combinar"},{l:"Status",v:LSTATUS[lead.status]||"Novo"}].map(s=>(
                      <div key={s.l} style={{background:BG2,borderRadius:6,padding:"8px 10px"}}>
                        <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{s.l}</div>
                        <div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {(lead.escopo||lead.notes)&&(
                  <div style={{borderTop:"1px solid "+BOR,paddingTop:16}}>
                    <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Escopo</div>
                    <div style={{fontFamily:"'DM Sans'",fontSize:12,color:TEXT,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{lead.escopo||lead.notes}</div>
                  </div>
                )}
                <div style={{borderTop:"1px solid "+BOR,paddingTop:16,marginTop:16}}>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Observações</div>
                  {["Alterações além do limite serão cobradas à parte","Prazo inicia após aprovação do roteiro e pagamento da entrada","Revisões devem ser solicitadas em até 48h após entrega","Proposta válida por 7 dias"].map((o,i)=>(
                    <div key={i} style={{display:"flex",gap:6,marginBottom:5}}><span style={{color:ACCENT,fontSize:10,marginTop:2}}>→</span><span style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>{o}</span></div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>{navigator.clipboard.writeText(proposalText);flash();}} style={{...btnGhost,flex:1,color:BLUE,borderColor:BLUE+"44"}}>📋 Copiar texto</button>
                <button onClick={()=>{setLeadEdit({...lead});setProposalModal(null);setLeadModal(true);}} style={{...btnGhost,flex:1}}>✏️ Editar lead</button>
                <button onClick={()=>setProposalModal(null)} style={btnGold}>✓ Fechar</button>
              </div>
            </div>
          </div>
        );
      })()}
      {useAsBaseModal&&<div onClick={e=>e.target===e.currentTarget&&setUseAsBaseModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:480,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>USAR COMO BASE</div><button onClick={()=>setUseAsBaseModal(null)} style={btnGhost}>✕</button></div><div style={{display:"flex",gap:12,marginBottom:18}}>{useAsBaseModal.thumb&&<img src={useAsBaseModal.thumb} alt="" style={{width:96,height:68,borderRadius:5,objectFit:"cover",flexShrink:0}}/>}<div style={{flex:1}}><div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,marginBottom:3,lineHeight:1.4}}>{useAsBaseModal.title}</div><div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:3}}>{useAsBaseModal.channel}</div>{useAsBaseModal.views>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT}}>{useAsBaseModal.views?.toLocaleString("pt-BR")} views</div>}<a href={useAsBaseModal.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,color:BLUE,display:"block",marginTop:4}}>▶ Assistir</a></div></div><div style={{marginBottom:16}}><span style={lbl}>Nicho</span><select value={useAsBaseModal.niche||activeNiches[0]?.name||""} onChange={e=>setUseAsBaseModal({...useAsBaseModal,niche:e.target.value})} style={inp}>{activeNiches.map(n=><option key={n.id} value={n.name}>{n.name}</option>)}</select></div><div style={{display:"flex",gap:9}}><button onClick={()=>setUseAsBaseModal(null)} style={btnGhost}>Cancelar</button><button onClick={()=>useVideoAsBase(useAsBaseModal,useAsBaseModal.niche)} style={{...btnGold,flex:1}}>🎬 CRIAR NO PIPELINE</button></div></div></div>}

      {videoDetailModal&&(
        <div onClick={e=>e.target===e.currentTarget&&setVideoDetailModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:CARD,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:680,maxHeight:"90vh",overflowY:"auto",padding:28}}>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
              <div style={{flex:1,marginRight:14}}>
                <input value={videoDetailModal.meu_titulo||videoDetailModal.title||""} onChange={e=>setVideoDetailModal({...videoDetailModal,meu_titulo:e.target.value})} style={{...inp,fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:1,background:"transparent",border:"none",borderBottom:"1px solid "+BOR2,borderRadius:0,padding:"3px 0",width:"100%"}} placeholder="Título do vídeo..."/>
              </div>
              <div style={{display:"flex",gap:7,flexShrink:0}}>
                {videoDetailModal.id?<button onClick={()=>saveVideoDetail(videoDetailModal)} style={btnGold}>💾 SALVAR</button>:<button onClick={()=>{const isW=videoDetailModal.niche==="Sr. Waldemar";isW?createWaldeVideo(videoDetailModal):createVideo(videoDetailModal);}} style={btnGold}>🎬 CRIAR</button>}
                <button onClick={()=>setVideoDetailModal(null)} style={btnGhost}>✕</button>
              </div>
            </div>

            {/* Status pipeline */}
            <div style={{marginBottom:18}}>
              <div style={lbl}>Etapa no pipeline</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {PIPELINE.map(s=>{const color=PIPELINE_COLORS[s];const active=videoDetailModal.status===s;return(<button key={s} onClick={()=>setVideoDetailModal({...videoDetailModal,status:s})} style={{...btnGhost,fontSize:11,padding:"4px 10px",color:active?color:MUTED,borderColor:active?color+"55":BOR,background:active?color+"12":undefined,fontWeight:active?600:400}}>{active?"● ":""}{s}</button>);})}
              </div>
            </div>

            {/* Informações */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
              <div><div style={lbl}>Nicho</div><select value={videoDetailModal.niche||""} onChange={e=>setVideoDetailModal({...videoDetailModal,niche:e.target.value})} style={inp}><option value="Sr. Waldemar">⭐ Sr. Waldemar</option>{activeNiches.map(n=><option key={n.id}>{n.name}</option>)}</select></div>
              <div><div style={lbl}>Data publicação</div><input type="date" value={videoDetailModal.publish_date||""} onChange={e=>setVideoDetailModal({...videoDetailModal,publish_date:e.target.value})} style={inp}/></div>
              <div><div style={lbl}>Plataformas</div><div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:4}}>{["YouTube","Instagram","TikTok","Shorts"].map(p=>{const plats=videoDetailModal.platforms||[];const active=plats.includes(p);return<button key={p} onClick={()=>setVideoDetailModal({...videoDetailModal,platforms:active?plats.filter(x=>x!==p):[...plats,p]})} style={{...btnGhost,padding:"2px 6px",fontSize:10,color:active?ACCENT:MUTED,borderColor:active?ACCENT+"44":BOR,background:active?ACCENT+"10":undefined}}>{p}</button>;})}</div></div>
            </div>

            {/* Referência */}
            <div style={{marginBottom:18,borderTop:"1px solid "+BOR,paddingTop:16}}>
              <div style={lbl}>📎 Referência</div>
              <div style={{marginBottom:10}}><div style={{...lbl,fontSize:10}}>Link YouTube manual</div><input value={videoDetailModal.ref_link_manual||""} onChange={e=>setVideoDetailModal({...videoDetailModal,ref_link_manual:e.target.value})} placeholder="https://youtube.com/watch?v=... (para vídeos que não aparecem na API)" style={inp}/></div>
              {(videoDetailModal.ref_url||videoDetailModal.ref_link_manual)&&(
                <div style={{background:BG3,borderRadius:8,padding:12,border:"1px solid "+BLUE+"33",display:"flex",gap:10}}>
                  {videoDetailModal.ref_thumb&&<img src={videoDetailModal.ref_thumb} alt="" style={{width:96,height:68,borderRadius:5,objectFit:"cover",flexShrink:0}}/>}
                  <div style={{flex:1}}>
                    <a href={videoDetailModal.ref_url||videoDetailModal.ref_link_manual} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,color:TEXT,textDecoration:"none",display:"block",marginBottom:3}}>{videoDetailModal.ref_titulo||"Ver referência"}</a>
                    {videoDetailModal.ref_canal&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{videoDetailModal.ref_canal}</div>}
                    {videoDetailModal.ref_views>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT}}>{videoDetailModal.ref_views?.toLocaleString("pt-BR")} views</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Roteiro */}
            <div style={{marginBottom:18,borderTop:"1px solid "+BOR,paddingTop:16}}>
              <div style={lbl}>📝 Roteiro</div>
              <div style={{marginBottom:12}}><div style={{...lbl,fontSize:10}}>Hook (abertura)</div><input value={videoDetailModal.hook||""} onChange={e=>setVideoDetailModal({...videoDetailModal,hook:e.target.value})} placeholder="Em 1999, Joan Murray saltou de um avião..." style={inp}/></div>
              <div><div style={{...lbl,fontSize:10}}>Roteiro completo <span style={{color:HINT,fontSize:9,textTransform:"none"}}>[STOCK] [IMG-AI] [ANIM]</span></div><textarea value={videoDetailModal.meu_roteiro||""} onChange={e=>setVideoDetailModal({...videoDetailModal,meu_roteiro:e.target.value})} placeholder="Use [STOCK] para footage, [IMG-AI] para imagem estática, [ANIM] para animação..." style={{...inp,minHeight:180}}/></div>
            </div>

            {/* Short/Reel */}
            <div style={{marginBottom:18,borderTop:"1px solid "+BOR,paddingTop:16,background:PURP+"08",borderRadius:8,padding:16,marginTop:16}}>
              <div style={{...lbl,color:PURP}}>📱 Short / Reel (60-90s)</div>
              <div style={{marginBottom:10}}><div style={{...lbl,fontSize:10}}>Script para clone HeyGen</div><textarea value={videoDetailModal.short_script||""} onChange={e=>setVideoDetailModal({...videoDetailModal,short_script:e.target.value})} placeholder="Script do short..." style={{...inp,minHeight:80}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><div style={{...lbl,fontSize:10}}>Status</div><select value={videoDetailModal.short_status||"pendente"} onChange={e=>setVideoDetailModal({...videoDetailModal,short_status:e.target.value})} style={inp}><option value="pendente">Pendente</option><option value="gravando">Gravando clone</option><option value="editando">Editando</option><option value="publicado">Publicado</option></select></div>
                <div><div style={{...lbl,fontSize:10}}>Plataformas</div><div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:4}}>{["Shorts","Reels","TikTok"].map(p=>{const plats=videoDetailModal.short_platforms||[];const active=plats.includes(p);return<button key={p} onClick={()=>setVideoDetailModal({...videoDetailModal,short_platforms:active?plats.filter(x=>x!==p):[...plats,p]})} style={{...btnGhost,padding:"2px 6px",fontSize:10,color:active?PURP:MUTED,borderColor:active?PURP+"44":BOR,background:active?PURP+"10":undefined}}>{p}</button>;})}</div></div>
              </div>
            </div>

            {/* Produção */}
            <div style={{marginBottom:18,borderTop:"1px solid "+BOR,paddingTop:16}}>
              <div style={lbl}>🎬 Produção</div>
              <div style={{marginBottom:12}}><div style={{...lbl,fontSize:10}}>Thumbnail</div><textarea value={videoDetailModal.minha_thumbnail||""} onChange={e=>setVideoDetailModal({...videoDetailModal,minha_thumbnail:e.target.value})} placeholder="Descreva a ideia da thumbnail..." style={{...inp,minHeight:55}}/></div>
              <div style={{marginBottom:12}}><div style={{...lbl,fontSize:10}}>Descrição YouTube</div><textarea value={videoDetailModal.descricao_yt||""} onChange={e=>setVideoDetailModal({...videoDetailModal,descricao_yt:e.target.value})} style={{...inp,minHeight:70}}/></div>
              <div><div style={{...lbl,fontSize:10}}>📁 Link Drive — Locução</div><input value={videoDetailModal["drive_locuçao"]||""} onChange={e=>setVideoDetailModal({...videoDetailModal,"drive_locuçao":e.target.value})} placeholder="https://drive.google.com/..." style={inp}/></div>
            </div>

            {/* Escopo (público - aparece na proposta) */}
            <div style={{marginBottom:18,borderTop:"1px solid "+BOR,paddingTop:16}}>
              <div style={lbl}>📋 Escopo <span style={{color:HINT,fontSize:9,textTransform:"none",fontFamily:"'DM Sans'",letterSpacing:0}}>aparece na proposta</span></div>
              <textarea value={videoDetailModal.escopo||""} onChange={e=>setVideoDetailModal({...videoDetailModal,escopo:e.target.value})} placeholder="- Animação de personagens&#10;- Criação de cenários&#10;- Edição do clipe" style={{...inp,minHeight:100,whiteSpace:"pre-wrap"}}/>
            </div>

            {/* Notas (interno) */}
            <div style={{marginBottom:22,borderTop:"1px solid "+BOR,paddingTop:16}}>
              <div style={{...lbl,color:HINT}}>🔒 Notas internas <span style={{color:HINT,fontSize:9,textTransform:"none",fontFamily:"'DM Sans'",letterSpacing:0}}>não aparece na proposta</span></div>
              <textarea value={videoDetailModal.notes||""} onChange={e=>setVideoDetailModal({...videoDetailModal,notes:e.target.value})} style={{...inp,minHeight:55}}/>
            </div>

            {/* Footer */}
            <div style={{display:"flex",gap:9,paddingTop:14,borderTop:"1px solid "+BOR}}>
              {videoDetailModal.id?<><button onClick={()=>saveVideoDetail(videoDetailModal)} style={{...btnGold,flex:1}}>💾 SALVAR</button><button onClick={()=>deleteVideo(videoDetailModal.id)} style={{...btnGhost,color:RED,borderColor:RED+"33"}}>🗑</button></>:<button onClick={()=>{const isW=videoDetailModal.niche==="Sr. Waldemar";isW?createWaldeVideo(videoDetailModal):createVideo(videoDetailModal);}} style={{...btnGold,flex:1}}>🎬 CRIAR NO PIPELINE</button>}
            </div>

          </div>
        </div>
      )}

      {trendingRefModal&&trendingRefEdit&&<div onClick={e=>e.target===e.currentTarget&&(setTrendingRefModal(false),setTrendingRefEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:BG2,border:"1px solid "+BOR2,borderRadius:12,width:"100%",maxWidth:460,padding:26}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>{trendingRefEdit.id?"EDITAR CANAL":"NOVO CANAL REFERÊNCIA"}</div><button onClick={()=>{setTrendingRefModal(false);setTrendingRefEdit(null);}} style={btnGhost}>✕</button></div><div style={{marginBottom:12}}><span style={lbl}>Nome do canal</span><input value={trendingRefEdit.name||""} onChange={e=>setTrendingRefEdit({...trendingRefEdit,name:e.target.value})} placeholder="Ex: Cansei de ser Ot4rio" style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>Channel ID <span style={{color:HINT,fontSize:9,textTransform:"none"}}>para buscar vídeos via API</span></span><input value={trendingRefEdit.channel_id||""} onChange={e=>setTrendingRefEdit({...trendingRefEdit,channel_id:e.target.value})} placeholder="UCxxxxxxxxxx" style={inp}/></div><div style={{marginBottom:12}}><span style={lbl}>URL do canal</span><input value={trendingRefEdit.url||""} onChange={e=>setTrendingRefEdit({...trendingRefEdit,url:e.target.value})} placeholder="https://youtube.com/@canal" style={inp}/></div><div style={{marginBottom:14}}><span style={lbl}>Notas</span><textarea value={trendingRefEdit.notes||""} onChange={e=>setTrendingRefEdit({...trendingRefEdit,notes:e.target.value})} placeholder="Por que esse canal é referência..." style={{...inp,minHeight:55}}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button onClick={()=>{setTrendingRefModal(false);setTrendingRefEdit(null);}} style={btnGhost}>Cancelar</button><button onClick={saveTrendingRefChannel} style={btnGold}>SALVAR</button></div></div></div>}

            {confetti&&(
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999}}>
          {Array.from({length:20},(_,i)=>(
            <div key={i} style={{position:"absolute",left:Math.random()*100+"vw",top:"-10px",width:7,height:7,borderRadius:2,background:[ACCENT,GREEN,BLUE,RED,PURP][i%5],animation:"cf "+(1+Math.random())+"s ease-in "+(Math.random()*.5)+"s forwards"}}/>
          ))}
          <style dangerouslySetInnerHTML={{__html:"@keyframes cf{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}"}}/>
        </div>
      )}

    </div>
  );
}
