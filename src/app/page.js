"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─── DESIGN TOKENS (Bulldog base, preto/amarelo) ─────────────
const BG    = "#0A0A08";
const BG2   = "#111110";
const CARD  = "#141412";
const BORDER= "rgba(251,191,36,0.2)";
const BORDER2="rgba(251,191,36,0.4)";
const TEXT  = "#F0EDE4";
const MUTED = "#7A7870";
const ACCENT= "#FBBF24";
const GREEN = "#10B981";
const RED   = "#EF4444";
const BLUE  = "#60A5FA";
const PURP  = "#8B5CF6";

const card  = {background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:18,marginBottom:10};
const lbl   = {color:MUTED,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:6,fontFamily:"'DM Sans'"};
const inp   = {background:"#0A0A08",border:`1px solid ${BORDER}`,borderRadius:6,color:TEXT,padding:"8px 12px",fontFamily:"'DM Sans'",fontSize:13,outline:"none",width:"100%"};
const btnGold  = {background:ACCENT,color:BG,border:"none",borderRadius:6,padding:"8px 18px",cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1};
const btnGhost = {background:"transparent",color:MUTED,border:`1px solid ${BORDER}`,borderRadius:6,padding:"8px 18px",cursor:"pointer",fontFamily:"'DM Sans'",fontSize:13};

// ─── CONSTANTS ───────────────────────────────────────────────
const TABS = ["🏠 Dashboard","⚡ Focus OS","📅 Agenda","🎬 Canais Dark","◈ Clientes","💰 Finanças","📚 Biblioteca","🔥 Trending"];
const NICHES = ["Curiosidades Gerais","Psicologia & Comportamento","Mistério & Paranormal","True Crime","História Sombria","Ciência Sombria","Filosofia Existencial","Lendas Urbanas BR"];
const NICHE_KEYWORDS = {"Curiosidades Gerais":"curiosidades fatos incríveis","Psicologia & Comportamento":"psicologia comportamento humano","Mistério & Paranormal":"misterio paranormal sobrenatural","True Crime":"crime real investigação","História Sombria":"historia sombria chocante","Ciência Sombria":"ciencia sombria experimentos","Filosofia Existencial":"filosofia existencial vida morte","Lendas Urbanas BR":"lendas urbanas brasil"};
const NICHE_CPM = {"Curiosidades Gerais":"$4–8","Psicologia & Comportamento":"$8–15","Mistério & Paranormal":"$5–9","True Crime":"$6–11","História Sombria":"$7–13","Ciência Sombria":"$8–14","Filosofia Existencial":"$10–18","Lendas Urbanas BR":"$4–7"};
const PIPELINE = ["Roteiro","Locução","Geração de Imagens","Edição","Thumb e Título","Postagem"];
const PIPELINE_COLORS = {"Roteiro":ACCENT,"Locução":BLUE,"Geração de Imagens":PURP,"Edição":RED,"Thumb e Título":"#FB923C","Postagem":GREEN};
const TASK_TYPES = ["Roteiro","Gravação","Edição","Thumbnail","Revisão","Upload","Reunião","Pesquisa"];
const SCRIPT_SECTIONS = ["GANCHO","CONSTRUÇÃO","A VIRADA","DESENVOLVIMENTO","DESFECHO","CTA"];
const SECTION_COLORS = {"GANCHO":"#F59E0B","CONSTRUÇÃO":ACCENT,"A VIRADA":BLUE,"DESENVOLVIMENTO":PURP,"DESFECHO":GREEN,"CTA":TEXT};
const CAMERA_ANGLES = ["A","B","C","D","E","F"];
const ANGLE_LABELS = {"A":"Céu fisheye de baixo","B":"Over shoulder","C":"Top-down aéreo","D":"Bottom-up contra o sol","E":"Raso do solo","F":"Macro / close dramático"};

// ─── HELPERS ─────────────────────────────────────────────────
const toLocalDate = d=>{const dt=new Date(d);return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;};
const today = ()=>toLocalDate(new Date());
const deadlineDiff = d=>{if(!d)return 999;const now=new Date();now.setHours(0,0,0,0);return Math.round((new Date(d+"T12:00:00")-now)/86400000);};
const deadlineColor = d=>{const diff=deadlineDiff(d);if(diff<0||diff<=1)return RED;if(diff<=3)return ACCENT;return GREEN;};
const deadlineLabel = d=>{if(!d)return"";const diff=deadlineDiff(d);if(diff<0)return`${Math.abs(diff)}d atraso`;if(diff===0)return"Hoje!";if(diff===1)return"Amanhã";return`${diff}d`;};
const fmtCurrency = v=>`R$ ${(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const fmtDate = d=>d?new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}):"—";
const taskScore = t=>({hot:100,warn:50,normal:10}[t.urgency||"normal"]+(10-Math.min(10,deadlineDiff(t.deadline)||10))*5-(t.estimated_hours||1));

// ─── MAIN ────────────────────────────────────────────────────
export default function DarkApp() {
  // AUTH
  const [user,setUser]=useState(null);
  const [loginEmail,setLoginEmail]=useState("");
  const [loginPassword,setLoginPassword]=useState("");
  const [loginError,setLoginError]=useState("");
  const [loginLoading,setLoginLoading]=useState(false);
  const [checkingAuth,setCheckingAuth]=useState(true);

  // DATA
  const [clients,setClients]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [videos,setVideos]=useState([]);
  const [ideas,setIdeas]=useState([]);
  const [posts,setPosts]=useState([]);
  const [invoices,setInvoices]=useState([]);
  const [goals,setGoals]=useState([]);
  const [library,setLibrary]=useState([]);
  const [userStats,setUserStats]=useState({xp:0,level:1,streak:0,tasks_completed:0,pomodoros_completed:0});
  const [trendingData,setTrendingData]=useState({br:[],global:[],niches:{}});
  const [trendingPrev,setTrendingPrev]=useState({});
  const [trendingLoading,setTrendingLoading]=useState(false);
  const [lastUpdated,setLastUpdated]=useState(null);
  const [loading,setLoading]=useState(true);

  // UI
  const [activeTab,setActiveTab]=useState(0);
  const [saved,setSaved]=useState(false);
  const [errorMsg,setErrorMsg]=useState("");
  const [confetti,setConfetti]=useState(false);
  const [quickCapture,setQuickCapture]=useState(false);
  const [quickText,setQuickText]=useState("");
  const [quickDest,setQuickDest]=useState("idea");
  const [weekOffset,setWeekOffset]=useState(0);

  // Focus
  const [focusTaskId,setFocusTaskId]=useState(null);
  const [timerRunning,setTimerRunning]=useState(false);
  const [timerSeconds,setTimerSeconds]=useState(25*60);
  const [timerMode,setTimerMode]=useState("work");
  const [activeEntry,setActiveEntry]=useState(null);
  const timerRef=useRef(null);

  // Dark videos
  const [selectedVideo,setSelectedVideo]=useState(null);
  const [videoModal,setVideoModal]=useState(false);
  const [videoEdit,setVideoEdit]=useState(null);
  const [scriptModal,setScriptModal]=useState(false);
  const [scriptData,setScriptData]=useState(null);
  const [scriptTakes,setScriptTakes]=useState([]);
  const [scriptTab,setScriptTab]=useState("youtube");
  const [pipelineFilter,setPipelineFilter]=useState("todos");
  const [darkSection,setDarkSection]=useState("pipeline");

  // Clients / Tasks
  const [clientModal,setClientModal]=useState(false);
  const [clientEdit,setClientEdit]=useState(null);
  const [selectedClient,setSelectedClient]=useState(null);
  const [taskModal,setTaskModal]=useState(false);
  const [taskEdit,setTaskEdit]=useState(null);
  const [approvalModal,setApprovalModal]=useState(null);

  // Finance
  const [invoiceModal,setInvoiceModal]=useState(false);
  const [invoiceEdit,setInvoiceEdit]=useState(null);
  const [invoiceFilter,setInvoiceFilter]=useState("todos");

  // Library
  const [libModal,setLibModal]=useState(false);
  const [libEdit,setLibEdit]=useState(null);
  const [libFilter,setLibFilter]=useState("todos");
  const [libSearch,setLibSearch]=useState("");

  // Goals
  const [goalModal,setGoalModal]=useState(false);
  const [goalEdit,setGoalEdit]=useState(null);

  // Trending
  const [trendingTab,setTrendingTab]=useState("brasil");
  const [trendingNicheChannel,setTrendingNicheChannel]=useState(null);
  const [channelVideos,setChannelVideos]=useState({});
  const [channelLoading,setChannelLoading]=useState(null);
  const [refChannels,setRefChannels]=useState([]);
  const [refChannelModal,setRefChannelModal]=useState(false);
  const [refChannelEdit,setRefChannelEdit]=useState(null);
  const [useAsBaseModal,setUseAsBaseModal]=useState(null);

  // Video detail modal (Canais Dark)
  const [videoDetailModal,setVideoDetailModal]=useState(null);

  // Leads
  const [leads,setLeads]=useState([]);
  const [leadModal,setLeadModal]=useState(false);
  const [leadEdit,setLeadEdit]=useState(null);

  // Local states
  const [dashIdeaInput,setDashIdeaInput]=useState("");
  const [darkIdeaInput,setDarkIdeaInput]=useState("");

  // ── FLASH ──
  const flash=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const flashError=m=>{setErrorMsg(m);setTimeout(()=>setErrorMsg(""),4000);};
  const triggerConfetti=()=>{setConfetti(true);setTimeout(()=>setConfetti(false),2500);};

  // ── AUTH ──
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user??null);setCheckingAuth(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user??null));
    return()=>subscription.unsubscribe();
  },[]);
  const login=async()=>{setLoginLoading(true);setLoginError("");const{error}=await supabase.auth.signInWithPassword({email:loginEmail,password:loginPassword});if(error)setLoginError(error.message);setLoginLoading(false);};
  const logout=async()=>await supabase.auth.signOut();

  // ── LOAD ──
  const loadAll=useCallback(async()=>{
    setLoading(true);
    try{
      const[cl,tk,vi,id,po,inv,go,lib,us]=await Promise.all([
        supabase.from("clients").select("*").eq("active",true).order("name"),
        supabase.from("tasks").select("*").order("created_at",{ascending:false}),
        supabase.from("videos").select("*").order("created_at",{ascending:false}),
        supabase.from("ideas").select("*").order("created_at",{ascending:false}),
        supabase.from("posts").select("*").order("scheduled_date"),
        supabase.from("invoices").select("*").order("due_date"),
        supabase.from("goals").select("*"),
        supabase.from("library").select("*").order("score",{ascending:false}),
        supabase.from("user_stats").select("*").limit(1),
      ]);
      if(cl.data)setClients(cl.data);
      if(tk.data)setTasks(tk.data);
      if(vi.data)setVideos(vi.data);
      if(id.data)setIdeas(id.data);
      if(po.data)setPosts(po.data);
      if(inv.data)setInvoices(inv.data);
      if(go.data)setGoals(go.data);
      if(lib.data)setLibrary(lib.data);
      if(us.data?.[0])setUserStats(us.data[0]);
      else{const{data:ns}=await supabase.from("user_stats").insert({xp:0,level:1,streak:0,tasks_completed:0,pomodoros_completed:0,last_active:today()}).select().single();if(ns)setUserStats(ns);}
    }catch(e){flashError("Erro ao carregar dados");}
    setLoading(false);
  },[]);
  useEffect(()=>{if(user)loadAll();},[user,loadAll]);

  const loadLeads=useCallback(async()=>{
    const{data}=await supabase.from("leads").select("*").order("created_at",{ascending:false});
    if(data)setLeads(data);
  },[]);
  useEffect(()=>{if(user)loadLeads();},[user,loadLeads]);

  const loadRefChannels=useCallback(async()=>{
    const{data}=await supabase.from("ref_channels").select("*").order("niche,name");
    if(data)setRefChannels(data);
  },[]);
  useEffect(()=>{if(user)loadRefChannels();},[user,loadRefChannels]);

  // ── TRENDING ──
  const fetchTrending=useCallback(async()=>{
    const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if(!apiKey)return;
    setTrendingLoading(true);
    try{
      const prev={...trendingPrev};
      const mapVideo=(v)=>({
        id:v.id,title:v.snippet?.title,channel:v.snippet?.channelTitle,
        thumb:v.snippet?.thumbnails?.medium?.url,
        views:parseInt(v.statistics?.viewCount||0),
        url:`https://youtube.com/watch?v=${v.id?.videoId||v.id}`,
        prevViews:prev[v.id?.videoId||v.id]||0,
        growth:prev[v.id?.videoId||v.id]?Math.round(((parseInt(v.statistics?.viewCount||0)-prev[v.id?.videoId||v.id])/Math.max(1,prev[v.id?.videoId||v.id]))*100):0,
      });

      const fetchRegion=async(region)=>{
        const res=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&maxResults=15&key=${apiKey}`);
        const d=await res.json();
        return(d.items||[]).map(mapVideo);
      };

      const fetchNiche=async(keyword)=>{
        const res=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&order=viewCount&regionCode=BR&maxResults=8&key=${apiKey}`);
        const d=await res.json();
        const ids=(d.items||[]).map(i=>i.id?.videoId).filter(Boolean).join(",");
        if(!ids)return[];
        const stats=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${apiKey}`);
        const sd=await stats.json();
        return(sd.items||[]).map(mapVideo);
      };

      const[br,global,...nicheResults]=await Promise.all([
        fetchRegion("BR"),fetchRegion("US"),
        ...NICHES.map(n=>fetchNiche(NICHE_KEYWORDS[n])),
      ]);

      const newPrev={};
      [...br,...global,...nicheResults.flat()].forEach(v=>{newPrev[v.id]=v.views;});
      setTrendingPrev(newPrev);

      const nicheMap={};
      NICHES.forEach((n,i)=>{nicheMap[n]=nicheResults[i]||[];});
      setTrendingData({br,global,niches:nicheMap});
      setLastUpdated(new Date());
    }catch(e){flashError("Erro ao buscar trending");}
    setTrendingLoading(false);
  },[trendingPrev]);

  // ── TIMER ──
  useEffect(()=>{
    if(timerRunning){
      timerRef.current=setInterval(()=>{
        setTimerSeconds(s=>{
          if(s<=1){clearInterval(timerRef.current);setTimerRunning(false);handleTimerEnd();return timerMode==="work"?5*60:25*60;}
          return s-1;
        });
      },1000);
    }else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[timerRunning]);

  const handleTimerEnd=async()=>{
    if(timerMode==="work"){
      triggerConfetti();
      const ns={...userStats,xp:(userStats.xp||0)+25,pomodoros_completed:(userStats.pomodoros_completed||0)+1};
      setUserStats(ns);if(userStats.id)await supabase.from("user_stats").update(ns).eq("id",userStats.id);
      setTimerMode("break");
    }else{setTimerMode("work");setTimerSeconds(25*60);}
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
    if(data){setTasks(prev=>prev.map(t=>t.id===taskId?data:t));triggerConfetti();
      const ns={...userStats,xp:(userStats.xp||0)+50,tasks_completed:(userStats.tasks_completed||0)+1};
      setUserStats(ns);if(userStats.id)await supabase.from("user_stats").update(ns).eq("id",userStats.id);
      setFocusTaskId(null);flash();}
  };

  // ── QUICK CAPTURE ──
  const saveQuickCapture=async()=>{
    if(!quickText.trim())return;
    if(quickDest==="idea"){const{data}=await supabase.from("ideas").insert({title:quickText.trim(),source:"quick"}).select().single();if(data)setIdeas(prev=>[data,...prev]);}
    else{const{data}=await supabase.from("tasks").insert({title:quickText.trim(),urgency:"normal",estimated_hours:1}).select().single();if(data)setTasks(prev=>[data,...prev]);}
    setQuickText("");setQuickCapture(false);flash();
  };

  // ── CLIENTS ──
  const saveClient=async()=>{
    if(!clientEdit?.name?.trim())return;
    let data;
    if(clientEdit.id){const r=await supabase.from("clients").update(clientEdit).eq("id",clientEdit.id).select().single();data=r.data;if(data)setClients(prev=>prev.map(c=>c.id===data.id?data:c));}
    else{const r=await supabase.from("clients").insert({...clientEdit,active:true}).select().single();data=r.data;if(data)setClients(prev=>[...prev,data]);}
    setClientModal(false);setClientEdit(null);flash();
  };
  const deleteClient=async(id)=>{if(!confirm("Excluir cliente?"))return;await supabase.from("clients").update({active:false}).eq("id",id);setClients(prev=>prev.filter(c=>c.id!==id));};

  // ── TASKS ──
  const saveTask=async()=>{
    if(!taskEdit?.title?.trim())return;
    let data;
    if(taskEdit.id){const r=await supabase.from("tasks").update(taskEdit).eq("id",taskEdit.id).select().single();data=r.data;if(data)setTasks(prev=>prev.map(t=>t.id===data.id?data:t));}
    else{const r=await supabase.from("tasks").insert(taskEdit).select().single();data=r.data;if(data)setTasks(prev=>[data,...prev]);}
    setTaskModal(false);setTaskEdit(null);flash();
  };
  const deleteTask=async(id)=>{await supabase.from("tasks").delete().eq("id",id);setTasks(prev=>prev.filter(t=>t.id!==id));};

  // ── VIDEOS ──
  const saveVideo=async()=>{
    if(!videoEdit?.title?.trim())return;
    let data;
    const darkClient=clients.find(c=>c.name==="Canais Dark");
    if(videoEdit.id){const r=await supabase.from("videos").update(videoEdit).eq("id",videoEdit.id).select().single();data=r.data;if(data)setVideos(prev=>prev.map(v=>v.id===data.id?data:v));}
    else{const r=await supabase.from("videos").insert({...videoEdit,client_id:videoEdit.client_id||darkClient?.id}).select().single();data=r.data;if(data)setVideos(prev=>[data,...prev]);}
    setVideoModal(false);setVideoEdit(null);flash();
  };
  const deleteVideo=async(id)=>{if(!confirm("Excluir vídeo?"))return;await supabase.from("videos").delete().eq("id",id);setVideos(prev=>prev.filter(v=>v.id!==id));};
  const moveVideo=async(videoId,newStatus)=>{
    const{data}=await supabase.from("videos").update({status:newStatus}).eq("id",videoId).select().single();
    if(data)setVideos(prev=>prev.map(v=>v.id===data.id?data:v));
  };

  const useIdeaAsVideo=async(idea)=>{
    const darkClient=clients.find(c=>c.name==="Canais Dark");
    const{data}=await supabase.from("videos").insert({title:idea.title,niche:idea.niche||"Curiosidades Gerais",status:"Roteiro",client_id:darkClient?.id,notes:idea.description||""}).select().single();
    if(data){
      setVideos(prev=>[data,...prev]);
      await supabase.from("ideas").update({used:true}).eq("id",idea.id);
      setIdeas(prev=>prev.map(i=>i.id===idea.id?{...i,used:true}:i));
      setVideoEdit({...data});setVideoModal(true);flash();
    }
  };

  // ── SCRIPT ──
  const openScript=video=>{
    setScriptData({...video});
    const takes=video.script?JSON.parse(video.script||"[]"):[];
    setScriptTakes(takes.length?takes:[{id:Date.now(),section:"GANCHO",startTime:"00:00",endTime:"00:07",angle:"A",narration:"",visual:"",prompt:""}]);
    setScriptModal(true);
  };
  const addTake=section=>{const last=scriptTakes[scriptTakes.length-1];setScriptTakes(prev=>[...prev,{id:Date.now(),section:section||last?.section||"GANCHO",startTime:last?.endTime||"00:00",endTime:"",angle:"A",narration:"",visual:"",prompt:""}]);};
  const updateTake=(id,field,value)=>setScriptTakes(prev=>prev.map(t=>t.id===id?{...t,[field]:value}:t));
  const deleteTake=id=>setScriptTakes(prev=>prev.filter(t=>t.id!==id));
  const saveScript=async()=>{
    if(!scriptData)return;
    const{data}=await supabase.from("videos").update({script:JSON.stringify(scriptTakes)}).eq("id",scriptData.id).select().single();
    if(data){setVideos(prev=>prev.map(v=>v.id===data.id?data:v));flash();}
  };

  // ── INVOICES ──
  const saveInvoice=async()=>{
    if(!invoiceEdit?.amount||!invoiceEdit?.client_id)return;
    let data;
    if(invoiceEdit.id){const r=await supabase.from("invoices").update(invoiceEdit).eq("id",invoiceEdit.id).select().single();data=r.data;if(data)setInvoices(prev=>prev.map(i=>i.id===data.id?data:i));}
    else{const r=await supabase.from("invoices").insert(invoiceEdit).select().single();data=r.data;if(data)setInvoices(prev=>[...prev,data]);}
    setInvoiceModal(false);setInvoiceEdit(null);flash();
  };
  const deleteInvoice=async(id)=>{await supabase.from("invoices").delete().eq("id",id);setInvoices(prev=>prev.filter(i=>i.id!==id));};
  const markInvoicePaid=async(id)=>{const{data}=await supabase.from("invoices").update({status:"pago",paid_date:today()}).eq("id",id).select().single();if(data)setInvoices(prev=>prev.map(i=>i.id===data.id?data:i));flash();};

  // ── LIBRARY ──
  const saveLib=async()=>{
    if(!libEdit?.content?.trim())return;
    let data;
    if(libEdit.id){const r=await supabase.from("library").update(libEdit).eq("id",libEdit.id).select().single();data=r.data;if(data)setLibrary(prev=>prev.map(l=>l.id===data.id?data:l));}
    else{const r=await supabase.from("library").insert(libEdit).select().single();data=r.data;if(data)setLibrary(prev=>[data,...prev]);}
    setLibModal(false);setLibEdit(null);flash();
  };
  const deleteLib=async(id)=>{await supabase.from("library").delete().eq("id",id);setLibrary(prev=>prev.filter(l=>l.id!==id));};

  // ── GOALS ──
  const saveGoal=async()=>{
    if(!goalEdit)return;
    let data;
    if(goalEdit.id){const r=await supabase.from("goals").update(goalEdit).eq("id",goalEdit.id).select().single();data=r.data;if(data)setGoals(prev=>prev.map(g=>g.id===data.id?data:g));}
    else{const r=await supabase.from("goals").insert(goalEdit).select().single();data=r.data;if(data)setGoals(prev=>[...prev,data]);}
    setGoalModal(false);setGoalEdit(null);flash();
  };

  // ── IDEAS ──
  const saveIdea=async(title,niche="")=>{const{data}=await supabase.from("ideas").insert({title,niche,source:"manual"}).select().single();if(data)setIdeas(prev=>[data,...prev]);flash();};
  const deleteIdea=async(id)=>{await supabase.from("ideas").delete().eq("id",id);setIdeas(prev=>prev.filter(i=>i.id!==id));};

  // ── LEADS ──
  const saveLead=async()=>{
    if(!leadEdit?.name?.trim())return;
    let data;
    if(leadEdit.id){const r=await supabase.from("leads").update(leadEdit).eq("id",leadEdit.id).select().single();data=r.data;if(data)setLeads(prev=>prev.map(l=>l.id===data.id?data:l));}
    else{const r=await supabase.from("leads").insert(leadEdit).select().single();data=r.data;if(data)setLeads(prev=>[data,...prev]);}
    setLeadModal(false);setLeadEdit(null);flash();
  };
  const deleteLead=async(id)=>{await supabase.from("leads").delete().eq("id",id);setLeads(prev=>prev.filter(l=>l.id!==id));};
  const convertLead=async(lead)=>{
    const{data}=await supabase.from("clients").insert({name:lead.name,color:ACCENT,type:"YouTube",frequency:"",rate_per_hour:0,notes:lead.notes||"",active:true}).select().single();
    if(data){
      setClients(prev=>[...prev,data]);
      await supabase.from("leads").update({converted:true,client_id:data.id}).eq("id",lead.id);
      setLeads(prev=>prev.map(l=>l.id===lead.id?{...l,converted:true,client_id:data.id}:l));
      flash();
    }
  };

  // ── REF CHANNELS ──
  const saveRefChannel=async()=>{
    if(!refChannelEdit?.name?.trim())return;
    let data;
    if(refChannelEdit.id){const r=await supabase.from("ref_channels").update(refChannelEdit).eq("id",refChannelEdit.id).select().single();data=r.data;if(data)setRefChannels(prev=>prev.map(c=>c.id===data.id?data:c));}
    else{const r=await supabase.from("ref_channels").insert(refChannelEdit).select().single();data=r.data;if(data)setRefChannels(prev=>[...prev,data]);}
    setRefChannelModal(false);setRefChannelEdit(null);flash();
  };
  const deleteRefChannel=async(id)=>{await supabase.from("ref_channels").delete().eq("id",id);setRefChannels(prev=>prev.filter(c=>c.id!==id));};

  // ── FETCH CHANNEL VIDEOS ──
  const fetchChannelVideos=async(channel)=>{
    const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if(!apiKey||!channel.channel_id||channelVideos[channel.id])return;
    setChannelLoading(channel.id);
    try{
      const res=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.channel_id}&order=viewCount&maxResults=10&type=video&key=${apiKey}`);
      const d=await res.json();
      const ids=(d.items||[]).map(i=>i.id?.videoId).filter(Boolean).join(",");
      if(!ids){setChannelLoading(null);return;}
      const stats=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${apiKey}`);
      const sd=await stats.json();
      const vids=(sd.items||[]).map(v=>({
        id:v.id,title:v.snippet?.title,channel:v.snippet?.channelTitle,
        thumb:v.snippet?.thumbnails?.medium?.url,
        views:parseInt(v.statistics?.viewCount||0),
        url:`https://youtube.com/watch?v=${v.id}`,
      })).sort((a,b)=>b.views-a.views);
      setChannelVideos(prev=>({...prev,[channel.id]:vids}));
    }catch(e){flashError("Erro ao buscar vídeos do canal");}
    setChannelLoading(null);
  };

  // ── USE VIDEO AS BASE ──
  const useVideoAsBase=async(refVideo,niche)=>{
    const darkClient=clients.find(c=>c.name==="Canais Dark");
    const{data}=await supabase.from("videos").insert({
      title:refVideo.title,
      niche:niche||"Curiosidades Gerais",
      status:"Roteiro",
      client_id:darkClient?.id,
      ref_titulo:refVideo.title,
      ref_thumb:refVideo.thumb,
      ref_url:refVideo.url,
      ref_canal:refVideo.channel,
      ref_views:refVideo.views||0,
    }).select().single();
    if(data){
      setVideos(prev=>[data,...prev]);
      setVideoDetailModal(data);
      setUseAsBaseModal(null);
      flash();
    }
  };

  // ── SAVE VIDEO DETAIL ──
  const saveVideoDetail=async(videoData)=>{
    if(!videoData?.id)return;
    const{data}=await supabase.from("videos").update({
      title:videoData.title,
      niche:videoData.niche,
      status:videoData.status,
      publish_date:videoData.publish_date||null,
      platforms:videoData.platforms||[],
      meu_titulo:videoData.meu_titulo||"",
      minha_thumbnail:videoData.minha_thumbnail||"",
      transcricao:videoData.transcricao||"",
      meu_roteiro:videoData.meu_roteiro||"",
      descricao_yt:videoData.descricao_yt||"",
      drive_locuçao:videoData.drive_locuçao||"",
      hook:videoData.hook||"",
      notes:videoData.notes||"",
      ref_titulo:videoData.ref_titulo||"",
      ref_thumb:videoData.ref_thumb||"",
      ref_url:videoData.ref_url||"",
      ref_canal:videoData.ref_canal||"",
      ref_views:videoData.ref_views||0,
    }).eq("id",videoData.id).select().single();
    if(data){setVideos(prev=>prev.map(v=>v.id===data.id?data:v));setVideoDetailModal(data);flash();}
  };

  // ── COMPUTED ──
  const pendingTasks=tasks.filter(t=>!t.done).sort((a,b)=>taskScore(b)-taskScore(a));
  const thisMonthKey=`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
  const monthInvoices=invoices.filter(i=>i.issued_date?.startsWith(thisMonthKey));
  const totalEmitido=monthInvoices.reduce((s,i)=>s+(i.amount||0),0);
  const totalRecebido=monthInvoices.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0);
  const totalPendente=monthInvoices.filter(i=>i.status==="pendente").reduce((s,i)=>s+(i.amount||0),0);
  const totalVencido=monthInvoices.filter(i=>i.status==="vencido"||(i.status==="pendente"&&deadlineDiff(i.due_date)<0)).reduce((s,i)=>s+(i.amount||0),0);
  const getClientColor=cId=>{const c=clients.find(c=>c.id===cId);return c?.color||ACCENT;};
  const getClientName=cId=>clients.find(c=>c.id===cId)?.name||"—";
  const currentGoals=goals.filter(g=>g.month===thisMonthKey);
  const timerFmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const getWeekDates=(offset=0)=>{
    const days=["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];
    const now=new Date();const dow=now.getDay();
    const mon=new Date(now);mon.setDate(now.getDate()-(dow===0?6:dow-1)+offset*7);mon.setHours(0,0,0,0);
    return Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return{date:toLocalDate(d),label:days[i],dayNum:d.getDate()};});
  };

  // ── LOGIN ──
  if(checkingAuth)return<div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:ACCENT,fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:3}}>CARREGANDO...</div></div>;

  if(!user)return(
    <div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{background:CARD,border:`1px solid ${BORDER2}`,borderRadius:14,padding:40,width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:4,color:TEXT}}>DARK APP</div>
          <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,letterSpacing:2}}>PRODUCTION · FOCUS · FINANCE</div>
        </div>
        <div style={{marginBottom:16}}><div style={lbl}>Email</div><input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type="email" placeholder="seu@email.com" style={inp}/></div>
        <div style={{marginBottom:24}}><div style={lbl}>Senha</div><input value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type="password" placeholder="••••••••" style={inp}/></div>
        {loginError&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:RED,marginBottom:12}}>{loginError}</div>}
        <button onClick={login} disabled={loginLoading} style={{...btnGold,width:"100%",opacity:loginLoading?.7:1}}>{loginLoading?"ENTRANDO...":"ENTRAR"}</button>
      </div>
    </div>
  );

  return(
    <div style={{background:BG,minHeight:"100vh",color:TEXT}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0A0A08}::-webkit-scrollbar-thumb{background:${BORDER2};border-radius:2px}
        .hover-row:hover{background:rgba(251,191,36,0.05)!important}
        .hover-card:hover{transform:translateY(-2px);border-color:${BORDER2}!important}
        textarea{resize:vertical}
        input:focus,textarea:focus,select:focus{border-color:${ACCENT}!important;outline:none}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{background:BG2,borderBottom:`1px solid ${BORDER}`,padding:"0 24px",display:"flex",alignItems:"center",gap:16,height:56,position:"sticky",top:0,zIndex:50}}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:4,color:ACCENT}}>DARK APP</div>
        <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,letterSpacing:2}}>PRODUCTION · FOCUS · FINANCE</div>
        <div style={{flex:1}}/>
        {saved&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:GREEN,background:"rgba(16,185,129,0.1)",padding:"4px 12px",borderRadius:20}}>✓ Salvo</div>}
        {errorMsg&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:RED,background:"rgba(239,68,68,0.1)",padding:"4px 12px",borderRadius:20}}>⚠️ {errorMsg}</div>}
        {timerRunning&&(
          <div style={{display:"flex",alignItems:"center",gap:8,background:`${timerMode==="work"?ACCENT:GREEN}15`,border:`1px solid ${timerMode==="work"?ACCENT:GREEN}44`,borderRadius:8,padding:"4px 12px"}}>
            <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:timerMode==="work"?ACCENT:GREEN,letterSpacing:2}}>{timerFmt(timerSeconds)}</span>
            <button onClick={()=>setTimerRunning(false)} style={{...btnGhost,padding:"2px 6px",fontSize:10}}>⏸</button>
          </div>
        )}
        <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>{user.email}</div>
        <button onClick={logout} style={{...btnGhost,fontSize:11,padding:"5px 12px"}}>Sair</button>
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",gap:2,padding:"0 24px",borderBottom:`1px solid ${BORDER}`,background:BG2,overflowX:"auto"}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setActiveTab(i)} style={{fontFamily:"'DM Sans'",fontSize:13,color:activeTab===i?ACCENT:MUTED,background:"transparent",border:"none",borderBottom:activeTab===i?`2px solid ${ACCENT}`:"2px solid transparent",padding:"14px 18px",cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap",fontWeight:activeTab===i?600:400}}>{t}</button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:1400,margin:"0 auto",padding:"24px 24px"}}>

        {/* ═══ DASHBOARD ═══ */}
        {activeTab===0&&(()=>{
          const nextTask=pendingTasks[0];
          const urgentTasks=pendingTasks.filter(t=>t.urgency==="hot");
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
                <div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:2,color:TEXT}}>BOM DIA, <span style={{color:ACCENT}}>BERNARDO.</span></div>
                  <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,marginTop:4}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})} · {pendingTasks.length} tarefas pendentes</div>
                </div>
                <button onClick={()=>{setGoalEdit({month:thisMonthKey,videos_target:0,revenue_target:0,hours_target:0});setGoalModal(true);}} style={{...btnGhost,fontSize:11}}>+ Meta do mês</button>
              </div>

              {/* FOCO AGORA */}
              {nextTask?(
                <div style={{...card,padding:24,borderColor:nextTask.urgency==="hot"?RED:BORDER2,marginBottom:20,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:nextTask.urgency==="hot"?RED:nextTask.urgency==="warn"?ACCENT:GREEN}}/>
                  <div style={{fontFamily:"'DM Sans'",fontSize:10,color:ACCENT,letterSpacing:2,marginBottom:8}}>⚡ FOCO AGORA</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:1,marginBottom:6}}>{nextTask.title}</div>
                  <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                    <span style={{background:`${getClientColor(nextTask.client_id)}22`,color:getClientColor(nextTask.client_id),border:`1px solid ${getClientColor(nextTask.client_id)}44`,borderRadius:4,padding:"2px 8px",fontFamily:"'DM Sans'",fontSize:11,fontWeight:600}}>{getClientName(nextTask.client_id)}</span>
                    {nextTask.deadline&&<span style={{background:`${deadlineColor(nextTask.deadline)}22`,color:deadlineColor(nextTask.deadline),border:`1px solid ${deadlineColor(nextTask.deadline)}44`,borderRadius:4,padding:"2px 8px",fontFamily:"'DM Sans'",fontSize:11,fontWeight:600}}>{deadlineLabel(nextTask.deadline)}</span>}
                    <span style={{background:"rgba(255,255,255,0.05)",color:MUTED,border:`1px solid ${BORDER}`,borderRadius:4,padding:"2px 8px",fontFamily:"'DM Sans'",fontSize:11}}>{nextTask.estimated_hours}h est.</span>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>startTimer(nextTask.id)} style={btnGold}>▶ INICIAR POMODORO</button>
                    <button onClick={()=>completeTask(nextTask.id)} style={{...btnGhost,color:GREEN,borderColor:`${GREEN}44`}}>✓ Concluir</button>
                  </div>
                </div>
              ):(
                <div style={{...card,textAlign:"center",padding:32,marginBottom:20}}>
                  <div style={{fontSize:32,marginBottom:8}}>🎉</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:GREEN,letterSpacing:2}}>TUDO EM DIA!</div>
                  <div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,marginTop:4}}>Nenhuma tarefa pendente.</div>
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20}}>
                <div>
                  {/* Follow-up leads vencidos */}
                  {leads.filter(l=>!l.converted&&l.follow_up_date&&deadlineDiff(l.follow_up_date)<=0).length>0&&(
                    <div style={{...card,marginBottom:16,borderColor:`${ACCENT}44`}}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:11,color:ACCENT,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>🔔 FOLLOW-UP PENDENTE</div>
                      {leads.filter(l=>!l.converted&&l.follow_up_date&&deadlineDiff(l.follow_up_date)<=0).map(lead=>(
                        <div key={lead.id} className="hover-row" onClick={()=>setActiveTab(4)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${BORDER}`,cursor:"pointer"}}>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500}}>{lead.name}</div>
                            <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{lead.service||"Lead"} · {lead.contact}</div>
                          </div>
                          {lead.proposed_value>0&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT,flexShrink:0}}>R$ {lead.proposed_value.toLocaleString("pt-BR",{minimumFractionDigits:0})}</span>}
                          <span style={{background:`${RED}22`,color:RED,border:`1px solid ${RED}44`,borderRadius:4,padding:"2px 6px",fontSize:10,fontWeight:600,flexShrink:0}}>follow-up!</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Urgentes */}
                  {urgentTasks.length>0&&(
                    <div style={{...card,marginBottom:16}}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:11,color:RED,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>🔥 URGENTE</div>
                      {urgentTasks.slice(0,5).map(t=>(
                        <div key={t.id} className="hover-row" onClick={()=>startTimer(t.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${BORDER}`,cursor:"pointer"}}>
                          <div style={{width:4,height:4,borderRadius:1,background:RED,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500}}>{t.title}</div>
                            <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{getClientName(t.client_id)}</div>
                          </div>
                          <span style={{background:`${deadlineColor(t.deadline)}22`,color:deadlineColor(t.deadline),border:`1px solid ${deadlineColor(t.deadline)}44`,borderRadius:4,padding:"2px 8px",fontFamily:"'DM Sans'",fontSize:10,fontWeight:600}}>{deadlineLabel(t.deadline)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metas */}
                  <div style={{...card,marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2}}>METAS DO MÊS</div>
                      <button onClick={()=>{setGoalEdit({month:thisMonthKey,videos_target:0,revenue_target:0,hours_target:0});setGoalModal(true);}} style={{...btnGhost,fontSize:11,padding:"4px 10px"}}>+ Meta</button>
                    </div>
                    {currentGoals.length===0?(
                      <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,textAlign:"center",padding:16}}>Nenhuma meta definida.</div>
                    ):currentGoals.map(g=>(
                      <div key={g.id} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500}}>{g.client_id?getClientName(g.client_id):"Geral"}</span>
                          <span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{g.videos_done||0}/{g.videos_target} vídeos</span>
                        </div>
                        <div style={{background:BG,borderRadius:3,height:5,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.min(100,Math.round(((g.videos_done||0)/Math.max(1,g.videos_target))*100))}%`,background:ACCENT,borderRadius:3,transition:"width .5s"}}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ideias rápidas */}
                  <div style={{...card}}>
                    <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>💡 IDEIAS RÁPIDAS</div>
                    <div style={{display:"flex",gap:8,marginBottom:14}}>
                      <input value={dashIdeaInput} onChange={e=>setDashIdeaInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&dashIdeaInput.trim()){saveIdea(dashIdeaInput.trim());setDashIdeaInput("");}}} placeholder="Ideia para vídeo, pauta, tema..." style={{...inp,flex:1}}/>
                      <button onClick={()=>{if(dashIdeaInput.trim()){saveIdea(dashIdeaInput.trim());setDashIdeaInput("");}}} style={btnGold}>+</button>
                    </div>
                    {ideas.filter(i=>!i.used).slice(0,5).map(i=>(
                      <div key={i.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${BORDER}`}}>
                        <span style={{flex:1,fontFamily:"'DM Sans'",fontSize:12}}>{i.title}</span>
                        {i.niche&&<span style={{background:`${ACCENT}15`,color:ACCENT,border:`1px solid ${ACCENT}33`,borderRadius:4,padding:"1px 6px",fontSize:10}}>{i.niche}</span>}
                        <button onClick={()=>useIdeaAsVideo(i)} style={{...btnGhost,padding:"2px 8px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>usar →</button>
                        <button onClick={()=>deleteIdea(i.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:12}}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending mini */}
                <div style={{...card}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2}}>🔥 TRENDING</div>
                    <button onClick={()=>setActiveTab(7)} style={{...btnGhost,fontSize:10,padding:"3px 8px",color:ACCENT,borderColor:`${ACCENT}44`}}>Ver tudo →</button>
                  </div>
                  {trendingData.br.length===0?(
                    <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,textAlign:"center",padding:20}}>
                      <div style={{marginBottom:8}}>Configure a YouTube API Key.</div>
                      <button onClick={()=>setActiveTab(7)} style={btnGold}>IR PARA TRENDING</button>
                    </div>
                  ):trendingData.br.slice(0,6).map((v,i)=>(
                    <div key={v.id} className="hover-row" style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${BORDER}`}}>
                      <span style={{fontFamily:"'IBM Plex Mono'",color:MUTED,fontSize:11,width:16,flexShrink:0}}>{i+1}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:500,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                        <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views {v.growth>50?`🚀 +${v.growth}%`:""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══ FOCUS OS ═══ */}
        {activeTab===1&&(()=>{
          const LEVELS=[{n:1,label:"Iniciante",xp:0},{n:2,label:"Freelancer",xp:100},{n:3,label:"Creator",xp:250},{n:4,label:"Producer",xp:500},{n:5,label:"Director",xp:1000},{n:6,label:"Studio Boss",xp:2000}];
          const currentLevel=LEVELS.filter(l=>l.xp<=(userStats.xp||0)).pop()||LEVELS[0];
          const nextLevel=LEVELS.find(l=>l.xp>(userStats.xp||0));
          const focusTask=pendingTasks.find(t=>t.id===focusTaskId)||pendingTasks[0];
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>FOCUS OS</div>
                <button onClick={()=>{setTaskEdit({title:"",urgency:"hot",estimated_hours:1,deadline:today()});setTaskModal(true);}} style={btnGold}>+ NOVA TAREFA</button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20}}>
                <div>
                  {/* TIMER SEMPRE VISÍVEL */}
                  <div style={{...card,padding:24,marginBottom:16,borderColor:timerMode==="work"?ACCENT:GREEN}}>
                    <div style={{fontFamily:"'DM Sans'",fontSize:10,color:timerMode==="work"?ACCENT:GREEN,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>
                      {timerMode==="work"?"🍅 Pomodoro — 25min":"☕ Descanso — 5min"}
                    </div>
                    {focusTask&&<div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1,marginBottom:12,color:TEXT}}>{focusTask.title}</div>}
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:56,letterSpacing:-2,color:timerMode==="work"?ACCENT:GREEN,lineHeight:1,marginBottom:16}}>{timerFmt(timerSeconds)}</div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      {!timerRunning?(
                        <button onClick={()=>focusTask&&startTimer(focusTask.id)} style={{...btnGold,opacity:focusTask?1:.5}}>▶ INICIAR POMODORO</button>
                      ):(
                        <button onClick={()=>{setTimerRunning(false);stopTimeEntry();}} style={{...btnGhost,color:ACCENT,borderColor:`${ACCENT}44`}}>⏸ PAUSAR</button>
                      )}
                      {focusTask&&<button onClick={()=>completeTask(focusTask.id)} style={{...btnGhost,color:GREEN,borderColor:`${GREEN}44`}}>✓ CONCLUIR</button>}
                      {focusTask&&<button onClick={()=>setFocusTaskId(null)} style={{...btnGhost,fontSize:11}}>→ Pular</button>}
                    </div>
                  </div>

                  {/* Lista de tarefas */}
                  <div style={card}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,marginBottom:16}}>PLANO DO DIA — <span style={{color:MUTED,fontSize:14}}>ORDENADO POR PRIORIDADE</span></div>
                    {pendingTasks.length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:20}}>🎉 Nenhuma tarefa pendente!</div>}
                    {pendingTasks.map((t,i)=>{
                      const isFocus=t.id===focusTaskId||(i===0&&!focusTaskId);
                      return(
                        <div key={t.id} className="hover-row" onClick={()=>startTimer(t.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 8px",borderBottom:`1px solid ${BORDER}`,background:isFocus?`${ACCENT}08`:undefined,borderRadius:isFocus?6:0,cursor:"pointer",transition:"all .15s"}}>
                          <span style={{fontFamily:"'IBM Plex Mono'",color:MUTED,fontSize:11,width:24,flexShrink:0}}>#{i+1}</span>
                          <div style={{width:5,height:5,borderRadius:1,background:{hot:RED,warn:ACCENT,normal:GREEN}[t.urgency||"normal"],flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:isFocus?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                            <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{getClientName(t.client_id)} · {t.type||"Tarefa"}</div>
                          </div>
                          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                            {t.deadline&&<span style={{background:`${deadlineColor(t.deadline)}22`,color:deadlineColor(t.deadline),border:`1px solid ${deadlineColor(t.deadline)}44`,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>{deadlineLabel(t.deadline)}</span>}
                            <span style={{background:"rgba(255,255,255,0.05)",color:MUTED,borderRadius:4,padding:"1px 6px",fontSize:10}}>{t.estimated_hours}h</span>
                            <button onClick={e=>{e.stopPropagation();completeTask(t.id);}} style={{...btnGhost,padding:"2px 8px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>✓</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* XP + Níveis */}
                <div>
                  <div style={{...card,marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2}}>LVL {currentLevel.n}</div>
                      <span style={{background:`${ACCENT}22`,color:ACCENT,border:`1px solid ${ACCENT}44`,borderRadius:4,padding:"2px 8px",fontFamily:"'DM Sans'",fontSize:11,fontWeight:600}}>{currentLevel.label}</span>
                    </div>
                    <div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:MUTED,marginBottom:6}}>{userStats.xp||0} / {nextLevel?.xp||"MAX"} XP</div>
                    <div style={{background:BG,borderRadius:3,height:6,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(100,Math.round(((userStats.xp||0)-(currentLevel.xp||0))/Math.max(1,(nextLevel?.xp||500)-(currentLevel.xp||0))*100))}%`,background:GREEN,borderRadius:3,transition:"width .8s"}}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}>
                      {[{l:"Tarefas",v:userStats.tasks_completed||0},{l:"Pomodoros",v:userStats.pomodoros_completed||0},{l:"Streak",v:`🔥 ${userStats.streak||0}d`},{l:"XP Total",v:userStats.xp||0}].map(s=>(
                        <div key={s.l} style={{background:BG,borderRadius:8,padding:"10px 12px"}}>
                          <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{s.l}</div>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1,color:ACCENT}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={card}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,marginBottom:14}}>JORNADA DE NÍVEIS</div>
                    {LEVELS.map(l=>{
                      const done=(userStats.xp||0)>=(LEVELS[l.n]?.xp||9999);
                      const current=l.n===currentLevel.n;
                      return(
                        <div key={l.n} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${BORDER}`}}>
                          <div style={{width:28,height:28,borderRadius:"50%",border:`1.5px solid ${done?GREEN:current?ACCENT:BORDER}`,background:done?`${GREEN}20`:current?`${ACCENT}15`:undefined,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono'",fontSize:11,color:done?GREEN:current?ACCENT:MUTED,fontWeight:600,flexShrink:0}}>
                            {done?"✓":l.n}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:current?600:400,color:current?ACCENT:done?GREEN:MUTED}}>LVL {l.n} — {l.label}</div>
                          </div>
                          <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{l.xp} XP</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══ AGENDA ═══ */}
        {activeTab===2&&(()=>{
          const weekDates=getWeekDates(weekOffset);
          const todayStr=today();
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>AGENDA SEMANAL</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <button onClick={()=>setWeekOffset(o=>o-1)} style={{...btnGhost,padding:"6px 14px"}}>← Anterior</button>
                  <button onClick={()=>setWeekOffset(0)} style={{...btnGhost,padding:"6px 14px",color:ACCENT,borderColor:`${ACCENT}44`}}>Hoje</button>
                  <button onClick={()=>setWeekOffset(o=>o+1)} style={{...btnGhost,padding:"6px 14px"}}>Próxima →</button>
                  <button onClick={()=>{setTaskEdit({title:"",urgency:"normal",estimated_hours:1});setTaskModal(true);}} style={btnGold}>+ TAREFA</button>
                </div>
              </div>

              {weekDates.map(({date,label,dayNum})=>{
                const isToday=date===todayStr;
                const dayTasks=tasks.filter(t=>t.deadline===date&&!t.done);
                const totalH=dayTasks.reduce((s,t)=>s+(t.estimated_hours||0),0);
                const loadColor=totalH>8?RED:totalH>5?ACCENT:GREEN;
                const hasContent=dayTasks.length>0;
                return(
                  <div key={date} style={{marginBottom:10}}>
                    <div style={{display:"grid",gridTemplateColumns:"140px 1fr auto",gap:16,alignItems:"flex-start",background:isToday?"rgba(251,191,36,0.05)":hasContent?"rgba(255,255,255,0.02)":"transparent",border:`1px solid ${isToday?BORDER2:hasContent?BORDER:"rgba(255,255,255,0.04)"}`,borderRadius:10,padding:"14px 18px"}}>
                      <div>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:2,color:isToday?ACCENT:hasContent?TEXT:MUTED}}>{label}</div>
                        <div style={{fontFamily:"'DM Sans'",fontSize:12,color:isToday?ACCENT:MUTED}}>{new Date(date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long"})}</div>
                        {isToday&&<span style={{background:ACCENT,color:BG,borderRadius:10,padding:"1px 8px",fontFamily:"'DM Sans'",fontSize:9,fontWeight:600,letterSpacing:1}}>HOJE</span>}
                        {totalH>0&&<div style={{marginTop:6,background:BG,borderRadius:3,height:3,overflow:"hidden",width:80}}><div style={{height:"100%",width:`${Math.min(100,(totalH/10)*100)}%`,background:loadColor,borderRadius:3}}/></div>}
                        {totalH>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:loadColor,marginTop:2}}>{totalH}h</div>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {hasContent?dayTasks.map(t=>(
                          <div key={t.id} onClick={()=>{setTaskEdit({...t});setTaskModal(true);}} style={{display:"flex",gap:14,padding:"12px 16px",background:`${getClientColor(t.client_id)}08`,border:`1px solid ${getClientColor(t.client_id)}33`,borderRadius:8,cursor:"pointer",alignItems:"center"}}>
                            <div style={{flexShrink:0,minWidth:50,textAlign:"center"}}>
                              <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,color:MUTED,lineHeight:1}}>{t.estimated_hours}H</div>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                                <span style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,color:getClientColor(t.client_id)}}>{getClientName(t.client_id).toUpperCase()}</span>
                              </div>
                              <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1,color:TEXT}}>{t.title}</div>
                              <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginTop:2}}>{t.type||"Tarefa"}</div>
                            </div>
                            <span style={{background:`${deadlineColor(t.deadline)}22`,color:deadlineColor(t.deadline),border:`1px solid ${deadlineColor(t.deadline)}44`,borderRadius:4,padding:"2px 8px",fontFamily:"'DM Sans'",fontSize:10,fontWeight:600,flexShrink:0}}>{t.urgency==="hot"?"🔥 URGENTE":t.urgency==="warn"?"⚠️ Atenção":"OK"}</span>
                          </div>
                        )):<div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>Nenhuma tarefa</div>}
                      </div>
                      <button onClick={()=>{setTaskEdit({title:"",urgency:"normal",estimated_hours:1,deadline:date});setTaskModal(true);}} style={{...btnGhost,fontSize:11,padding:"5px 12px",flexShrink:0}}>+ Tarefa</button>
                    </div>
                  </div>
                );
              })}

              {/* Próximas deadlines */}
              <div style={{...card,marginTop:20}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,marginBottom:14}}>📌 PRÓXIMAS DEADLINES</div>
                {tasks.filter(t=>!t.done&&t.deadline&&deadlineDiff(t.deadline)<=7).sort((a,b)=>deadlineDiff(a.deadline)-deadlineDiff(b.deadline)).map(t=>(
                  <div key={t.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 8px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer"}} onClick={()=>{setTaskEdit({...t});setTaskModal(true);}}>
                    <div style={{width:10,height:10,borderRadius:2,background:deadlineColor(t.deadline),flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500}}>{t.title}</div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{getClientName(t.client_id)}</div>
                    </div>
                    <span style={{background:`${deadlineColor(t.deadline)}22`,color:deadlineColor(t.deadline),border:`1px solid ${deadlineColor(t.deadline)}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:600}}>{fmtDate(t.deadline)} · {deadlineLabel(t.deadline)}</span>
                  </div>
                ))}
                {tasks.filter(t=>!t.done&&t.deadline&&deadlineDiff(t.deadline)<=7).length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:20}}>Nenhuma deadline nos próximos 7 dias 🎉</div>}
              </div>
            </div>
          );
        })()}

        {/* ═══ CANAIS DARK ═══ */}
        {activeTab===3&&(()=>{
          const filteredVideos=pipelineFilter==="todos"?videos:videos.filter(v=>v.status===pipelineFilter);
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>CANAIS DARK</div>
                <div style={{display:"flex",gap:8}}>
                  {["pipeline","ideias","nichos","referencias"].map(s=>(
                    <button key={s} onClick={()=>setDarkSection(s)} style={{...btnGhost,color:darkSection===s?ACCENT:MUTED,borderColor:darkSection===s?`${ACCENT}44`:BORDER}}>{s==="referencias"?"Referências":s.charAt(0).toUpperCase()+s.slice(1)}</button>
                  ))}
                  <button onClick={()=>{setVideoEdit({title:"",niche:"Curiosidades Gerais",status:"Roteiro",hook:"",notes:""});setVideoModal(true);}} style={btnGold}>+ NOVO VÍDEO</button>
                </div>
              </div>

              {darkSection==="pipeline"&&(
                <div>
                  {/* Filter */}
                  <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
                    {["todos",...PIPELINE].map(s=>(
                      <button key={s} onClick={()=>setPipelineFilter(s)} style={{...btnGhost,fontSize:11,padding:"4px 12px",color:pipelineFilter===s?PIPELINE_COLORS[s]||ACCENT:MUTED,borderColor:pipelineFilter===s?`${PIPELINE_COLORS[s]||ACCENT}44`:BORDER,background:pipelineFilter===s?`${PIPELINE_COLORS[s]||ACCENT}10`:undefined}}>
                        {s==="todos"?"Todos":s}
                      </button>
                    ))}
                  </div>

                  {/* Timeline / Pipeline colunas */}
                  <div style={{overflowX:"auto",paddingBottom:8}}>
                    <div style={{display:"flex",gap:12,minWidth:"max-content"}}>
                      {PIPELINE.map(status=>{
                        const colVideos=filteredVideos.filter(v=>v.status===status);
                        const color=PIPELINE_COLORS[status]||ACCENT;
                        return(
                          <div key={status}
                            onDragOver={e=>e.preventDefault()}
                            onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("videoId");if(id)moveVideo(id,status);}}
                            style={{width:250,flexShrink:0,background:"rgba(255,255,255,0.02)",border:`1px solid ${BORDER}`,borderRadius:10,overflow:"hidden",minHeight:300}}
                          >
                            <div style={{padding:"12px 12px 10px",borderBottom:`2px solid ${color}`,background:`${color}10`}}>
                              <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,color}}>{status}</div>
                              <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,marginTop:2}}>{colVideos.length} vídeo{colVideos.length!==1?"s":""}</div>
                            </div>
                            <div style={{padding:8,display:"flex",flexDirection:"column",gap:6}}>
                              {colVideos.map(v=>(
                                <div key={v.id} draggable onDragStart={e=>e.dataTransfer.setData("videoId",v.id)}
                                  onClick={()=>setVideoDetailModal({...v})}
                                  style={{background:CARD,border:`1px solid ${v.ref_url?BLUE:BORDER}`,borderRadius:8,padding:"10px 12px",cursor:"pointer",transition:"all .15s"}}
                                  className="hover-card"
                                >
                                  {v.ref_thumb&&<img src={v.ref_thumb} alt="" style={{width:"100%",height:60,objectFit:"cover",borderRadius:4,marginBottom:6}}/>}
                                  <div style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:600,marginBottom:4,lineHeight:1.35}}>{v.meu_titulo||v.title}</div>
                                  <div style={{display:"flex",gap:4,marginBottom:4,flexWrap:"wrap"}}>
                                    <span style={{background:`${ACCENT}15`,color:ACCENT,border:`1px solid ${ACCENT}33`,borderRadius:4,padding:"1px 6px",fontSize:10}}>{v.niche}</span>
                                    {v.ref_url&&<span style={{background:`${BLUE}15`,color:BLUE,border:`1px solid ${BLUE}33`,borderRadius:4,padding:"1px 6px",fontSize:10}}>📎 ref</span>}
                                  </div>
                                  {v.publish_date&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>📅 {fmtDate(v.publish_date)}</div>}
                                </div>
                              ))}
                              {colVideos.length===0&&<div style={{color:MUTED,fontSize:11,textAlign:"center",padding:16}}>Arraste aqui</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cronograma diário */}
                  <div style={{...card,marginTop:20}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,marginBottom:14}}>📅 COMO AVANÇAR UM VÍDEO</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
                      {[
                        {dia:"DIA 1",cor:ACCENT,items:["Escolher ideia","Pesquisar referências","Definir hook"]},
                        {dia:"DIA 2",cor:BLUE,items:["Escrever roteiro","Adicionar takes","Revisar narração"]},
                        {dia:"DIA 3",cor:RED,items:["Gravar locução","Testar prompts NanoBanana","Gerar imagens"]},
                        {dia:"DIA 4",cor:PURP,items:["Editar vídeo","Animar no Kling/Seedance","Adicionar legendas"]},
                        {dia:"DIA 5",cor:"#FB923C",items:["Criar thumbnail","Escrever título","Escrever descrição"]},
                        {dia:"DIA 6",cor:GREEN,items:["Revisão final","Upload","Agendar publicação"]},
                      ].map(({dia,cor,items})=>(
                        <div key={dia} style={{background:BG,borderRadius:8,padding:"12px 10px",borderTop:`2px solid ${cor}`}}>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:12,color:cor,letterSpacing:1,marginBottom:8}}>{dia}</div>
                          {items.map((item,i)=>(
                            <div key={i} style={{display:"flex",gap:5,alignItems:"flex-start",marginBottom:5}}>
                              <span style={{color:cor,fontSize:9,flexShrink:0,marginTop:2}}>→</span>
                              <span style={{fontFamily:"'DM Sans'",fontSize:11,lineHeight:1.4,color:MUTED}}>{item}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {darkSection==="ideias"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                  <div style={card}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,marginBottom:14}}>💡 BANCO DE IDEIAS</div>
                    <div style={{display:"flex",gap:8,marginBottom:16}}>
                      <input value={darkIdeaInput} onChange={e=>setDarkIdeaInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&darkIdeaInput.trim()){saveIdea(darkIdeaInput.trim());setDarkIdeaInput("");}}} placeholder="Nova ideia de vídeo..." style={{...inp,flex:1}}/>
                      <button onClick={()=>{if(darkIdeaInput.trim()){saveIdea(darkIdeaInput.trim());setDarkIdeaInput("");}}} style={btnGold}>+</button>
                    </div>
                    {ideas.filter(i=>!i.used).map(i=>(
                      <div key={i.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 6px",borderBottom:`1px solid ${BORDER}`}}>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500}}>{i.title}</div>
                          {i.niche&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED,marginTop:2}}>{i.niche}</div>}
                        </div>
                        <button onClick={()=>useIdeaAsVideo(i)} style={{...btnGhost,padding:"3px 10px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>usar →</button>
                        <button onClick={()=>deleteIdea(i.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:12}}>✕</button>
                      </div>
                    ))}
                    {ideas.filter(i=>!i.used).length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:20}}>Banco vazio. Adicione ideias acima!</div>}
                  </div>
                  <div style={card}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,marginBottom:14}}>✓ IDEIAS USADAS</div>
                    {ideas.filter(i=>i.used).map(i=>(
                      <div key={i.id} style={{display:"flex",gap:10,padding:"8px 6px",borderBottom:`1px solid ${BORDER}`,opacity:.5}}>
                        <span style={{fontFamily:"'DM Sans'",fontSize:12,textDecoration:"line-through",flex:1}}>{i.title}</span>
                        {i.niche&&<span style={{background:`${ACCENT}15`,color:ACCENT,border:`1px solid ${ACCENT}33`,borderRadius:4,padding:"1px 6px",fontSize:10}}>{i.niche}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {darkSection==="nichos"&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
                  {NICHES.map(n=>{
                    const vids=videos.filter(v=>v.niche===n);
                    const pub=vids.filter(v=>v.status==="Postagem").length;
                    return(
                      <div key={n} style={card} className="hover-card">
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1,marginBottom:6}}>{n}</div>
                        <div style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:ACCENT,marginBottom:12}}>CPM: {NICHE_CPM[n]}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                          <div style={{background:BG,borderRadius:6,padding:"8px 10px"}}>
                            <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,textTransform:"uppercase",letterSpacing:1}}>Total</div>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:TEXT}}>{vids.length}</div>
                          </div>
                          <div style={{background:BG,borderRadius:6,padding:"8px 10px"}}>
                            <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,textTransform:"uppercase",letterSpacing:1}}>Publicados</div>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:GREEN}}>{pub}</div>
                          </div>
                        </div>
                        <div style={{background:BG,borderRadius:3,height:4,overflow:"hidden"}}><div style={{height:"100%",width:`${vids.length?Math.min(100,Math.round(pub/vids.length*100)):0}%`,background:GREEN,borderRadius:3}}/></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ CLIENTES ═══ */}
        {activeTab===4&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>CLIENTES</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setLeadEdit({name:"",contact:"",service:"",proposed_value:0,status:"novo",last_contact:today(),follow_up_date:"",notes:""});setLeadModal(true);}} style={{...btnGhost,color:ACCENT,borderColor:`${ACCENT}44`}}>+ Lead</button>
                <button onClick={()=>{setClientEdit({name:"",color:ACCENT,type:"YouTube",frequency:"",rate_per_hour:0,notes:""});setClientModal(true);}} style={btnGold}>+ NOVO CLIENTE</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20}}>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {clients.map(c=>{
                  const pending=tasks.filter(t=>t.client_id===c.id&&!t.done).length;
                  const isSelected=selectedClient?.id===c.id;
                  return(
                    <div key={c.id} onClick={()=>setSelectedClient(isSelected?null:c)} style={{...card,cursor:"pointer",border:`1px solid ${isSelected?c.color||ACCENT:BORDER}`,background:isSelected?`${c.color||ACCENT}08`:CARD,marginBottom:0,transition:"all .15s"}} className="hover-card">
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:8,background:`${c.color||ACCENT}20`,border:`1px solid ${c.color||ACCENT}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue'",fontSize:13,color:c.color||ACCENT,flexShrink:0}}>
                          {c.name.slice(0,2).toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                          <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{c.type} · {c.frequency}</div>
                        </div>
                        {pending>0&&<span style={{background:`${RED}22`,color:RED,border:`1px solid ${RED}44`,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>{pending}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedClient?(
                <div>
                  <div style={{...card,marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                      <div style={{display:"flex",gap:14,alignItems:"center"}}>
                        <div style={{width:52,height:52,borderRadius:12,background:`${selectedClient.color||ACCENT}20`,border:`1px solid ${selectedClient.color||ACCENT}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue'",fontSize:18,color:selectedClient.color||ACCENT}}>
                          {selectedClient.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:2}}>{selectedClient.name}</div>
                          <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED}}>{selectedClient.type} · {selectedClient.frequency}</div>
                          {selectedClient.rate_per_hour>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT,marginTop:2}}>R$ {selectedClient.rate_per_hour}/h</div>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>{setClientEdit({...selectedClient});setClientModal(true);}} style={btnGhost}>✏️ Editar</button>
                        <button onClick={()=>deleteClient(selectedClient.id)} style={{...btnGhost,color:RED,borderColor:`${RED}44`}}>🗑 Excluir</button>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                      {[{l:"Tarefas ativas",v:tasks.filter(t=>t.client_id===selectedClient.id&&!t.done).length,c:ACCENT},{l:"Concluídas",v:tasks.filter(t=>t.client_id===selectedClient.id&&t.done).length,c:GREEN},{l:"Vídeos",v:videos.filter(v=>v.client_id===selectedClient.id).length,c:BLUE},{l:"NFs",v:invoices.filter(i=>i.client_id===selectedClient.id).length,c:PURP}].map(s=>(
                        <div key={s.l} style={{background:BG,borderRadius:8,padding:"12px 14px"}}>
                          <div style={{fontFamily:"'DM Sans'",fontSize:9,color:MUTED,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{s.l}</div>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:1,color:s.c}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    {selectedClient.notes&&<div style={{marginTop:14,padding:"12px 14px",background:BG,borderRadius:8,fontFamily:"'DM Sans'",fontSize:13,color:MUTED,lineHeight:1.6}}>{selectedClient.notes}</div>}
                  </div>

                  <div style={card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2}}>TAREFAS</div>
                      <button onClick={()=>{setTaskEdit({title:"",client_id:selectedClient.id,urgency:"normal",estimated_hours:1,deadline:today()});setTaskModal(true);}} style={{...btnGhost,fontSize:11,padding:"4px 10px"}}>+ Tarefa</button>
                    </div>
                    {tasks.filter(t=>t.client_id===selectedClient.id).sort((a,b)=>(a.done?1:-1)).map(t=>(
                      <div key={t.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px",borderBottom:`1px solid ${BORDER}`,opacity:t.done?.5:1}}>
                        <div onClick={()=>!t.done&&completeTask(t.id)} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${t.done?GREEN:BORDER2}`,background:t.done?GREEN:undefined,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                          {t.done&&<span style={{color:BG,fontSize:10}}>✓</span>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500,textDecoration:t.done?"line-through":undefined}}>{t.title}</div>
                          <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{t.type||"Tarefa"} · {t.estimated_hours}h</div>
                        </div>
                        {t.deadline&&<span style={{background:`${deadlineColor(t.deadline)}22`,color:deadlineColor(t.deadline),border:`1px solid ${deadlineColor(t.deadline)}44`,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>{deadlineLabel(t.deadline)}</span>}
                        <button onClick={()=>{setTaskEdit({...t});setTaskModal(true);}} style={{...btnGhost,padding:"2px 6px",fontSize:10}}>✏️</button>
                        <button onClick={()=>deleteTask(t.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:12}}>✕</button>
                      </div>
                    ))}
                    {tasks.filter(t=>t.client_id===selectedClient.id).length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:20}}>Nenhuma tarefa. Adicione acima.</div>}
                  </div>
                </div>
              ):(
                <div style={{...card,display:"flex",alignItems:"center",justifyContent:"center",minHeight:300}}>
                  <div style={{textAlign:"center",color:MUTED}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:32,color:BORDER,marginBottom:8}}>◈</div>
                    <div style={{fontFamily:"'DM Sans'",fontSize:14}}>Selecione um cliente para ver detalhes</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LEADS */}
          <div style={{marginTop:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>LEADS <span style={{fontSize:14,color:MUTED}}>({leads.filter(l=>!l.converted).length} ativos)</span></div>
              <button onClick={()=>{setLeadEdit({name:"",contact:"",service:"",proposed_value:0,status:"novo",last_contact:today(),follow_up_date:"",notes:""});setLeadModal(true);}} style={{...btnGhost,fontSize:11}}>+ Novo Lead</button>
            </div>
            {leads.filter(l=>!l.converted).length===0&&<div style={{...card,textAlign:"center",padding:24,color:MUTED,fontFamily:"'DM Sans'",fontSize:13}}>Nenhum lead ativo. Adicione prospects que pediram orçamento.</div>}
            {leads.filter(l=>!l.converted).map(lead=>{
              const LSTATUS = {"novo":{l:"Novo",c:"#60A5FA"},"proposta_enviada":{l:"Proposta Enviada",c:ACCENT},"em_negociacao":{l:"Em Negociação",c:"#FB923C"},"fechado":{l:"Fechado",c:GREEN},"perdido":{l:"Perdido",c:RED}};
              const ls = LSTATUS[lead.status]||LSTATUS["novo"];
              const followUpDiff = lead.follow_up_date?deadlineDiff(lead.follow_up_date):null;
              return(
                <div key={lead.id} style={{...card,marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1}}>{lead.name}</div>
                        <span style={{background:`${ls.c}22`,color:ls.c,border:`1px solid ${ls.c}44`,borderRadius:4,padding:"1px 8px",fontSize:10,fontFamily:"'DM Sans'",fontWeight:600}}>{ls.l}</span>
                        {lead.proposed_value>0&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT}}>R$ {lead.proposed_value.toLocaleString("pt-BR",{minimumFractionDigits:0})}</span>}
                      </div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,display:"flex",gap:12,flexWrap:"wrap"}}>
                        {lead.contact&&<span>📱 {lead.contact}</span>}
                        {lead.service&&<span>🎯 {lead.service}</span>}
                        {lead.last_contact&&<span>📅 Último contato: {fmtDate(lead.last_contact)}</span>}
                        {followUpDiff!==null&&<span style={{color:followUpDiff<=0?RED:followUpDiff<=2?ACCENT:MUTED}}>🔔 Follow-up: {followUpDiff<=0?"HOJE/VENCIDO":`em ${followUpDiff}d`}</span>}
                      </div>
                      {lead.notes&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,marginTop:4}}>{lead.notes}</div>}
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>{setLeadEdit({...lead});setLeadModal(true);}} style={{...btnGhost,padding:"4px 8px",fontSize:11}}>✏️</button>
                      <button onClick={()=>convertLead(lead)} style={{...btnGhost,padding:"4px 10px",fontSize:11,color:GREEN,borderColor:`${GREEN}44`}}>→ Cliente</button>
                      <button onClick={()=>deleteLead(lead.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ FINANÇAS ═══ */}
        {activeTab===5&&(()=>{
          const STATUS_COLORS={pendente:ACCENT,pago:GREEN,vencido:RED,cancelado:MUTED};
          const filtered=invoices.filter(i=>invoiceFilter==="todos"||i.status===invoiceFilter).sort((a,b)=>(a.due_date||"").localeCompare(b.due_date||""));
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>FINANÇAS</div>
                <button onClick={()=>{setInvoiceEdit({client_id:"",description:"",amount:0,status:"pendente",issued_date:today(),due_date:today(),notes:""});setInvoiceModal(true);}} style={btnGold}>+ NOVA NF</button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
                {[{l:"Emitido este mês",v:totalEmitido,c:TEXT},{l:"Recebido",v:totalRecebido,c:GREEN},{l:"Pendente",v:totalPendente,c:ACCENT},{l:"Vencido",v:totalVencido,c:RED}].map(m=>(
                  <div key={m.l} style={card}>
                    <div style={lbl}>{m.l}</div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:2,color:m.c}}>{fmtCurrency(m.v)}</div>
                  </div>
                ))}
              </div>

              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                {["todos","pendente","pago","vencido","cancelado"].map(f=>(
                  <button key={f} onClick={()=>setInvoiceFilter(f)} style={{...btnGhost,fontSize:11,color:invoiceFilter===f?ACCENT:MUTED,borderColor:invoiceFilter===f?`${ACCENT}44`:BORDER,background:invoiceFilter===f?`${ACCENT}10`:undefined}}>
                    {f.charAt(0).toUpperCase()+f.slice(1)}
                  </button>
                ))}
              </div>

              <div style={card}>
                <div style={{display:"grid",gridTemplateColumns:"80px 1fr 120px 120px 100px 100px auto",gap:0,padding:"8px 12px",borderBottom:`1px solid ${BORDER}`,fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase"}}>
                  <div>NF</div><div>Descrição</div><div>Cliente</div><div style={{textAlign:"right"}}>Valor</div><div style={{textAlign:"center"}}>Vencimento</div><div style={{textAlign:"center"}}>Status</div><div style={{width:100}}/>
                </div>
                {filtered.length===0&&<div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,textAlign:"center",padding:32}}>Nenhuma nota fiscal.</div>}
                {filtered.map(i=>(
                  <div key={i.id} className="hover-row" style={{display:"grid",gridTemplateColumns:"80px 1fr 120px 120px 100px 100px auto",gap:0,padding:"12px 12px",borderBottom:`1px solid ${BORDER}`,alignItems:"center"}}>
                    <div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:MUTED}}>{i.number||"—"}</div>
                    <div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:500}}>{i.description||"Sem descrição"}</div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{fmtDate(i.issued_date)}</div>
                    </div>
                    <div><span style={{background:`${getClientColor(i.client_id)}22`,color:getClientColor(i.client_id),border:`1px solid ${getClientColor(i.client_id)}44`,borderRadius:4,padding:"2px 8px",fontSize:11,fontFamily:"'DM Sans'",fontWeight:600}}>{getClientName(i.client_id)}</span></div>
                    <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono'",fontWeight:600,fontSize:13,color:STATUS_COLORS[i.status]||TEXT}}>{fmtCurrency(i.amount)}</div>
                    <div style={{textAlign:"center",fontFamily:"'IBM Plex Mono'",fontSize:11,color:deadlineColor(i.due_date)}}>{fmtDate(i.due_date)}</div>
                    <div style={{textAlign:"center"}}><span style={{background:`${STATUS_COLORS[i.status]||TEXT}22`,color:STATUS_COLORS[i.status]||TEXT,border:`1px solid ${STATUS_COLORS[i.status]||TEXT}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontFamily:"'DM Sans'",fontWeight:600}}>{i.status}</span></div>
                    <div style={{display:"flex",gap:4,width:100,justifyContent:"flex-end"}}>
                      {i.status==="pendente"&&<button onClick={()=>markInvoicePaid(i.id)} style={{...btnGhost,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>✓ Pago</button>}
                      <button onClick={()=>{setInvoiceEdit({...i});setInvoiceModal(true);}} style={{...btnGhost,padding:"2px 6px",fontSize:10}}>✏️</button>
                      <button onClick={()=>deleteInvoice(i.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Por cliente */}
              <div style={{...card,marginTop:16}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,marginBottom:14}}>RESUMO POR CLIENTE</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                  {clients.map(c=>{
                    const cInv=invoices.filter(i=>i.client_id===c.id);
                    const total=cInv.reduce((s,i)=>s+(i.amount||0),0);
                    const pago=cInv.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0);
                    if(total===0)return null;
                    return(
                      <div key={c.id} style={{background:BG,borderRadius:10,padding:"14px 16px",borderLeft:`3px solid ${c.color||ACCENT}`}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,marginBottom:8}}>{c.name}</div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>Total</span>
                          <span style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:TEXT,fontWeight:600}}>{fmtCurrency(total)}</span>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>Recebido</span>
                          <span style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:GREEN,fontWeight:600}}>{fmtCurrency(pago)}</span>
                        </div>
                        <div style={{background:BG2,borderRadius:3,height:4,overflow:"hidden"}}><div style={{height:"100%",width:`${total?Math.min(100,Math.round(pago/total*100)):0}%`,background:c.color||ACCENT,borderRadius:3}}/></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══ BIBLIOTECA ═══ */}
        {activeTab===6&&(()=>{
          const TYPE_COLORS={hook:ACCENT,titulo:BLUE,cta:GREEN,thumbnail:PURP,template:RED};
          const TYPE_ICONS={hook:"🎣",titulo:"📰",cta:"📣",thumbnail:"🖼",template:"📄"};
          const filtered=library.filter(l=>libFilter==="todos"||l.type===libFilter).filter(l=>!libSearch||l.content.toLowerCase().includes(libSearch.toLowerCase()));
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>BIBLIOTECA</div>
                <button onClick={()=>{setLibEdit({type:"hook",content:"",niche:"",score:0});setLibModal(true);}} style={btnGold}>+ ADICIONAR</button>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                {["todos","hook","titulo","cta","thumbnail","template"].map(f=>(
                  <button key={f} onClick={()=>setLibFilter(f)} style={{...btnGhost,fontSize:11,color:libFilter===f?ACCENT:MUTED,borderColor:libFilter===f?`${ACCENT}44`:BORDER,background:libFilter===f?`${ACCENT}10`:undefined}}>
                    {f==="todos"?"Todos":`${TYPE_ICONS[f]||""} ${f}`}
                  </button>
                ))}
                <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...inp,width:200,marginLeft:"auto"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
                {filtered.map(l=>(
                  <div key={l.id} style={{...card,borderLeft:`3px solid ${TYPE_COLORS[l.type]||ACCENT}`,marginBottom:0}} className="hover-card">
                    <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                      <span style={{background:`${TYPE_COLORS[l.type]||ACCENT}22`,color:TYPE_COLORS[l.type]||ACCENT,border:`1px solid ${TYPE_COLORS[l.type]||ACCENT}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontFamily:"'DM Sans'",fontWeight:600}}>{TYPE_ICONS[l.type]||""} {l.type}</span>
                      {l.niche&&<span style={{background:`${ACCENT}15`,color:ACCENT,border:`1px solid ${ACCENT}33`,borderRadius:4,padding:"2px 6px",fontSize:10}}>{l.niche}</span>}
                      {l.views>0&&<span style={{background:`${GREEN}15`,color:GREEN,border:`1px solid ${GREEN}33`,borderRadius:4,padding:"2px 6px",fontSize:10}}>{l.views.toLocaleString("pt-BR")} views</span>}
                    </div>
                    <div style={{fontFamily:"'DM Sans'",fontSize:13,lineHeight:1.65,color:TEXT,marginBottom:12,fontStyle:l.type==="hook"||l.type==="cta"?"italic":"normal"}}>{l.content}</div>
                    {l.client_id&&<div style={{marginBottom:10}}><span style={{background:`${getClientColor(l.client_id)}22`,color:getClientColor(l.client_id),border:`1px solid ${getClientColor(l.client_id)}44`,borderRadius:4,padding:"2px 8px",fontSize:11,fontFamily:"'DM Sans'",fontWeight:600}}>{getClientName(l.client_id)}</span></div>}
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>navigator.clipboard.writeText(l.content)} style={{...btnGhost,fontSize:10,padding:"3px 8px",flex:1,color:ACCENT,borderColor:`${ACCENT}33`}}>📋 Copiar</button>
                      <button onClick={()=>{setLibEdit({...l});setLibModal(true);}} style={{...btnGhost,fontSize:10,padding:"3px 8px"}}>✏️</button>
                      <button onClick={()=>deleteLib(l.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  </div>
                ))}
                {filtered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:MUTED}}><div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:BORDER,marginBottom:8}}>📚</div><div style={{fontFamily:"'DM Sans'",fontSize:14}}>Biblioteca vazia. Adicione hooks, títulos e CTAs!</div></div>}
              </div>
            </div>
          );
        })()}

        {/* ═══ TRENDING ═══ */}
        {/* ═══ TRENDING ═══ */}
        {activeTab===7&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>🔥 TRENDING YOUTUBE</div>
                {lastUpdated&&<div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginTop:4}}>Atualizado: {lastUpdated.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:NICHES[0],subscribers:"",notes:""});setRefChannelModal(true);}} style={{...btnGhost,fontSize:11}}>+ Canal de referência</button>
                <button onClick={fetchTrending} disabled={trendingLoading} style={{...btnGold,opacity:trendingLoading?.7:1}}>
                  {trendingLoading?"BUSCANDO...":"🔄 ATUALIZAR AGORA"}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:2,borderBottom:`1px solid ${BORDER}`,marginBottom:20,overflowX:"auto"}}>
              {["brasil","mundial","nichos","referencias"].map(t=>(
                <button key={t} onClick={()=>setTrendingTab(t)} style={{fontFamily:"'DM Sans'",fontSize:12,color:trendingTab===t?ACCENT:MUTED,background:"transparent",border:"none",borderBottom:trendingTab===t?`2px solid ${ACCENT}`:"2px solid transparent",padding:"10px 16px",cursor:"pointer",whiteSpace:"nowrap",fontWeight:trendingTab===t?600:400,transition:"all .15s"}}>
                  {t==="brasil"?"🇧🇷 Brasil":t==="mundial"?"🌍 Mundial":t==="nichos"?"🎯 Por Nicho":"📌 Referências"}
                </button>
              ))}
            </div>

            {/* BRASIL / MUNDIAL */}
            {(trendingTab==="brasil"||trendingTab==="mundial")&&(()=>{
              const list=trendingTab==="brasil"?trendingData.br:trendingData.global;
              const virals=list.filter(v=>v.growth>50);
              return(
                <div>
                  {trendingData.br.length===0&&(
                    <div style={{...card,textAlign:"center",padding:48}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:MUTED,marginBottom:12}}>CONFIGURE A YOUTUBE API KEY</div>
                      <div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,marginBottom:20}}>Adicione NEXT_PUBLIC_YOUTUBE_API_KEY no Vercel e clique em Atualizar.</div>
                      <button onClick={fetchTrending} style={btnGold}>🔄 TENTAR BUSCAR</button>
                    </div>
                  )}
                  {virals.length>0&&(
                    <div style={{...card,borderColor:`${RED}44`,marginBottom:20}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,color:RED,marginBottom:12}}>🚀 VIRALIZANDO AGORA</div>
                      {virals.map(v=>(
                        <div key={v.id} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:`1px solid ${BORDER}`,alignItems:"center"}}>
                          {v.thumb&&<img src={v.thumb} alt="" style={{width:60,height:45,borderRadius:4,objectFit:"cover",flexShrink:0}}/>}
                          <div style={{flex:1,minWidth:0}}>
                            <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                            <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED}}>{v.channel} · {v.views?.toLocaleString("pt-BR")} views</div>
                          </div>
                          <span style={{background:`${RED}22`,color:RED,border:`1px solid ${RED}44`,borderRadius:4,padding:"2px 8px",fontFamily:"'IBM Plex Mono'",fontSize:11,fontWeight:600,flexShrink:0}}>🚀 +{v.growth}%</span>
                          <div style={{display:"flex",gap:6,flexShrink:0}}>
                            <button onClick={()=>saveIdea(v.title,"Trending")} style={{...btnGhost,padding:"2px 8px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>+ ideia</button>
                            <button onClick={()=>setUseAsBaseModal(v)} style={{...btnGhost,padding:"2px 8px",fontSize:10,color:ACCENT,borderColor:`${ACCENT}33`}}>usar como base</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12}}>
                    {list.map((v,i)=>(
                      <div key={v.id} style={{...card,display:"flex",gap:12,marginBottom:0,alignItems:"flex-start"}} className="hover-card">
                        <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:MUTED,width:28,flexShrink:0,lineHeight:1,marginTop:4}}>{i+1}</span>
                        {v.thumb&&<img src={v.thumb} alt="" style={{width:80,height:58,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
                        <div style={{flex:1,minWidth:0}}>
                          <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,color:TEXT,textDecoration:"none",display:"block",lineHeight:1.4,marginBottom:4}}>{v.title}</a>
                          <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:6}}>{v.channel} · {v.views?.toLocaleString("pt-BR")} views</div>
                          {v.growth>0&&<span style={{background:`${v.growth>50?RED:v.growth>20?ACCENT:GREEN}22`,color:v.growth>50?RED:v.growth>20?ACCENT:GREEN,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600,marginBottom:6,display:"inline-block"}}>🚀 +{v.growth}%</span>}
                          <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                            <button onClick={()=>saveIdea(v.title,"Trending")} style={{...btnGhost,padding:"2px 8px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>+ ideia</button>
                            <button onClick={()=>setUseAsBaseModal(v)} style={{...btnGhost,padding:"2px 8px",fontSize:10,color:ACCENT,borderColor:`${ACCENT}33`}}>usar como base</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {list.length===0&&trendingData.br.length>0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:MUTED,fontFamily:"'DM Sans'",fontSize:13}}>Nenhum vídeo encontrado.</div>}
                  </div>
                </div>
              );
            })()}

            {/* POR NICHO */}
            {trendingTab==="nichos"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16,marginBottom:24}}>
                  {NICHES.map(niche=>{
                    const channels=refChannels.filter(c=>c.niche===niche);
                    return(
                      <div key={niche} style={{...card,marginBottom:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:1}}>{niche}</div>
                            <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:ACCENT}}>CPM {NICHE_CPM[niche]}</div>
                          </div>
                          <button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche,subscribers:"",notes:""});setRefChannelModal(true);}} style={{...btnGhost,padding:"2px 8px",fontSize:10}}>+ canal</button>
                        </div>
                        {channels.length===0?(
                          <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,padding:"8px 0"}}>Nenhum canal. Adicione canais de referência.</div>
                        ):channels.map(ch=>(
                          <div key={ch.id} style={{marginBottom:10,background:BG,borderRadius:8,overflow:"hidden"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:`1px solid ${BORDER}`}}>
                              <div style={{flex:1}}>
                                <a href={ch.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:12,fontWeight:600,color:TEXT,textDecoration:"none"}}>{ch.name}</a>
                                {ch.subscribers&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{ch.subscribers} inscritos</div>}
                              </div>
                              <div style={{display:"flex",gap:4}}>
                                <button onClick={()=>fetchChannelVideos(ch)} disabled={!!channelLoading} style={{...btnGhost,padding:"2px 8px",fontSize:10,color:ACCENT,borderColor:`${ACCENT}33`,opacity:channelLoading===ch.id?.5:1}}>
                                  {channelLoading===ch.id?"...":"▶ ver top 10"}
                                </button>
                                <button onClick={()=>deleteRefChannel(ch.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:11}}>✕</button>
                              </div>
                            </div>
                            {channelVideos[ch.id]&&(
                              <div style={{padding:"6px 0"}}>
                                {channelVideos[ch.id].map((v,i)=>(
                                  <div key={v.id} style={{display:"flex",gap:8,padding:"6px 10px",borderBottom:`1px solid ${BORDER}`,alignItems:"center"}}>
                                    <span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED,width:18,flexShrink:0}}>{i+1}</span>
                                    {v.thumb&&<img src={v.thumb} alt="" style={{width:50,height:36,borderRadius:3,objectFit:"cover",flexShrink:0}}/>}
                                    <div style={{flex:1,minWidth:0}}>
                                      <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,fontWeight:500,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                                      <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div>
                                    </div>
                                    <div style={{display:"flex",gap:4,flexShrink:0}}>
                                      <button onClick={()=>saveIdea(v.title,niche)} style={{...btnGhost,padding:"1px 6px",fontSize:9,color:GREEN,borderColor:`${GREEN}33`}}>+</button>
                                      <button onClick={()=>setUseAsBaseModal({...v,niche})} style={{...btnGhost,padding:"1px 6px",fontSize:9,color:ACCENT,borderColor:`${ACCENT}33`}}>base</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* REFERÊNCIAS */}
            {trendingTab==="referencias"&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>CANAIS DE REFERÊNCIA</div>
                  <button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:NICHES[0],subscribers:"",notes:""});setRefChannelModal(true);}} style={btnGold}>+ ADICIONAR CANAL</button>
                </div>
                {NICHES.map(niche=>{
                  const channels=refChannels.filter(c=>c.niche===niche);
                  if(channels.length===0)return null;
                  return(
                    <div key={niche} style={{marginBottom:20}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1,color:ACCENT,marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${BORDER}`}}>{niche}</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
                        {channels.map(ch=>(
                          <div key={ch.id} style={{...card,marginBottom:0}} className="hover-card">
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                              <div>
                                <a href={ch.url} target="_blank" rel="noreferrer" style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1,color:TEXT,textDecoration:"none",display:"block"}}>{ch.name}</a>
                                {ch.subscribers&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{ch.subscribers} inscritos</div>}
                              </div>
                              <div style={{display:"flex",gap:4}}>
                                <button onClick={()=>{setRefChannelEdit({...ch});setRefChannelModal(true);}} style={{...btnGhost,padding:"2px 6px",fontSize:10}}>✏️</button>
                                <button onClick={()=>deleteRefChannel(ch.id)} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:11}}>✕</button>
                              </div>
                            </div>
                            {ch.notes&&<div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,lineHeight:1.5}}>{ch.notes}</div>}
                            <button onClick={()=>fetchChannelVideos(ch)} disabled={!!channelLoading} style={{...btnGhost,width:"100%",marginTop:8,fontSize:11,color:ACCENT,borderColor:`${ACCENT}33`,opacity:channelLoading===ch.id?.5:1}}>
                              {channelLoading===ch.id?"Carregando...":channelVideos[ch.id]?`✓ ${channelVideos[ch.id].length} vídeos carregados`:"▶ Carregar top 10 vídeos"}
                            </button>
                            {channelVideos[ch.id]&&(
                              <div style={{marginTop:8}}>
                                {channelVideos[ch.id].slice(0,5).map((v,i)=>(
                                  <div key={v.id} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:`1px solid ${BORDER}`,alignItems:"center"}}>
                                    <span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED,width:16}}>{i+1}</span>
                                    <div style={{flex:1,minWidth:0}}>
                                      <a href={v.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,color:TEXT,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</a>
                                      <div style={{fontFamily:"'IBM Plex Mono'",fontSize:9,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div>
                                    </div>
                                    <button onClick={()=>setUseAsBaseModal({...v,niche:ch.niche})} style={{...btnGhost,padding:"1px 6px",fontSize:9,color:ACCENT,borderColor:`${ACCENT}33`,flexShrink:0}}>usar base</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {refChannels.length===0&&(
                  <div style={{...card,textAlign:"center",padding:40}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:MUTED,marginBottom:8}}>NENHUM CANAL CADASTRADO</div>
                    <div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,marginBottom:16}}>Adicione canais de referência por nicho para acompanhar os melhores conteúdos.</div>
                    <button onClick={()=>{setRefChannelEdit({name:"",channel_id:"",url:"",niche:NICHES[0],subscribers:"",notes:""});setRefChannelModal(true);}} style={btnGold}>+ ADICIONAR CANAL</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>{/* /content */}

      {/* ── QUICK CAPTURE BUTTON ── */}
      <button onClick={()=>setQuickCapture(true)} style={{position:"fixed",bottom:28,right:28,width:52,height:52,borderRadius:"50%",background:ACCENT,color:BG,border:"none",cursor:"pointer",fontSize:24,fontWeight:700,boxShadow:`0 4px 20px ${ACCENT}44`,zIndex:100,transition:"transform .15s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>+</button>

      {/* ── MODAIS ── */}

      {/* Quick capture */}
      {quickCapture&&(
        <div onClick={e=>e.target===e.currentTarget&&setQuickCapture(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:420,padding:28}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2,marginBottom:16}}>CAPTURA RÁPIDA</div>
            <textarea value={quickText} onChange={e=>setQuickText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&saveQuickCapture()} placeholder="Ideia, tarefa, pensamento..." style={{...inp,minHeight:80,marginBottom:14}} autoFocus/>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[["idea","💡 Banco de Ideias"],["task","✓ Tarefa"]].map(([v,l])=>(
                <button key={v} onClick={()=>setQuickDest(v)} style={{...btnGhost,flex:1,color:quickDest===v?ACCENT:MUTED,borderColor:quickDest===v?`${ACCENT}44`:BORDER,background:quickDest===v?`${ACCENT}10`:undefined}}>{l}</button>
              ))}
            </div>
            <button onClick={saveQuickCapture} style={{...btnGold,width:"100%"}}>SALVAR → ENTER</button>
          </div>
        </div>
      )}

      {/* Task modal */}
      {taskModal&&taskEdit&&(
        <div onClick={e=>e.target===e.currentTarget&&(setTaskModal(false),setTaskEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:540,padding:28,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>{taskEdit.id?"EDITAR TAREFA":"NOVA TAREFA"}</div>
              <button onClick={()=>{setTaskModal(false);setTaskEdit(null);}} style={btnGhost}>✕</button>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Título</div><input value={taskEdit.title||""} onChange={e=>setTaskEdit({...taskEdit,title:e.target.value})} style={inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{marginBottom:14}}><div style={lbl}>Cliente</div><select value={taskEdit.client_id||""} onChange={e=>setTaskEdit({...taskEdit,client_id:e.target.value})} style={inp}><option value="">Sem cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Tipo</div><select value={taskEdit.type||"Roteiro"} onChange={e=>setTaskEdit({...taskEdit,type:e.target.value})} style={inp}>{TASK_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Urgência</div><select value={taskEdit.urgency||"normal"} onChange={e=>setTaskEdit({...taskEdit,urgency:e.target.value})} style={inp}><option value="normal">Normal</option><option value="warn">Atenção</option><option value="hot">Urgente 🔥</option></select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Horas estimadas</div><input type="number" value={taskEdit.estimated_hours||1} step="0.5" min="0.5" onChange={e=>setTaskEdit({...taskEdit,estimated_hours:parseFloat(e.target.value)||1})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Deadline</div><input type="date" value={taskEdit.deadline||""} onChange={e=>setTaskEdit({...taskEdit,deadline:e.target.value})} style={inp}/></div>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Notas</div><textarea value={taskEdit.notes||""} onChange={e=>setTaskEdit({...taskEdit,notes:e.target.value})} style={{...inp,minHeight:60}}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setTaskModal(false);setTaskEdit(null);}} style={btnGhost}>Cancelar</button>
              <button onClick={saveTask} style={btnGold}>SALVAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Client modal */}
      {clientModal&&clientEdit&&(
        <div onClick={e=>e.target===e.currentTarget&&(setClientModal(false),setClientEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:500,padding:28,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>{clientEdit.id?"EDITAR CLIENTE":"NOVO CLIENTE"}</div>
              <button onClick={()=>{setClientModal(false);setClientEdit(null);}} style={btnGhost}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{marginBottom:14}}><div style={lbl}>Nome</div><input value={clientEdit.name||""} onChange={e=>setClientEdit({...clientEdit,name:e.target.value})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Cor</div><input type="color" value={clientEdit.color||ACCENT} onChange={e=>setClientEdit({...clientEdit,color:e.target.value})} style={{...inp,padding:4,height:40}}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Tipo</div><input value={clientEdit.type||""} onChange={e=>setClientEdit({...clientEdit,type:e.target.value})} placeholder="YouTube, Podcast..." style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Cadência</div><input value={clientEdit.frequency||""} onChange={e=>setClientEdit({...clientEdit,frequency:e.target.value})} placeholder="3x semana" style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Valor/hora (R$)</div><input type="number" value={clientEdit.rate_per_hour||0} onChange={e=>setClientEdit({...clientEdit,rate_per_hour:parseFloat(e.target.value)||0})} style={inp}/></div>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Notas</div><textarea value={clientEdit.notes||""} onChange={e=>setClientEdit({...clientEdit,notes:e.target.value})} style={{...inp,minHeight:60}}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setClientModal(false);setClientEdit(null);}} style={btnGhost}>Cancelar</button>
              <button onClick={saveClient} style={btnGold}>SALVAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Video modal */}
      {videoModal&&videoEdit&&(
        <div onClick={e=>e.target===e.currentTarget&&(setVideoModal(false),setVideoEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:580,padding:28,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>{videoEdit.id?"EDITAR VÍDEO":"NOVO VÍDEO"}</div>
              <button onClick={()=>{setVideoModal(false);setVideoEdit(null);}} style={btnGhost}>✕</button>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Título</div><input value={videoEdit.title||""} onChange={e=>setVideoEdit({...videoEdit,title:e.target.value})} style={inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{marginBottom:14}}><div style={lbl}>Nicho</div><select value={videoEdit.niche||"Curiosidades Gerais"} onChange={e=>setVideoEdit({...videoEdit,niche:e.target.value})} style={inp}>{NICHES.map(n=><option key={n}>{n}</option>)}</select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Status / Etapa</div><select value={videoEdit.status||"Roteiro"} onChange={e=>setVideoEdit({...videoEdit,status:e.target.value})} style={inp}>{PIPELINE.map(s=><option key={s}>{s}</option>)}</select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Data publicação</div><input type="date" value={videoEdit.publish_date||""} onChange={e=>setVideoEdit({...videoEdit,publish_date:e.target.value})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>CPM nicho</div><input value={NICHE_CPM[videoEdit.niche]||"$4–8"} readOnly style={{...inp,opacity:.6}}/></div>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Hook (frase de abertura)</div><input value={videoEdit.hook||""} onChange={e=>setVideoEdit({...videoEdit,hook:e.target.value})} placeholder="Em 1999, Joan Murray saltou de um avião..." style={inp}/></div>
            <div style={{marginBottom:14}}><div style={lbl}>Plataformas de postagem</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                {["YouTube","Instagram","TikTok","Shorts"].map(plat=>{
                  const plats=videoEdit.platforms||[];
                  const active=plats.includes(plat);
                  return<button key={plat} onClick={()=>setVideoEdit({...videoEdit,platforms:active?plats.filter(p=>p!==plat):[...plats,plat]})} style={{...btnGhost,fontSize:11,color:active?ACCENT:MUTED,borderColor:active?`${ACCENT}44`:BORDER,background:active?`${ACCENT}10`:undefined}}>{plat}</button>;
                })}
              </div>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Notas</div><textarea value={videoEdit.notes||""} onChange={e=>setVideoEdit({...videoEdit,notes:e.target.value})} style={{...inp,minHeight:80}}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setVideoModal(false);setVideoEdit(null);}} style={btnGhost}>Cancelar</button>
              <button onClick={()=>openScript(videoEdit)} style={{...btnGhost,color:ACCENT,borderColor:`${ACCENT}44`}}>📄 Roteiro</button>
              <button onClick={saveVideo} style={btnGold}>SALVAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {invoiceModal&&invoiceEdit&&(
        <div onClick={e=>e.target===e.currentTarget&&(setInvoiceModal(false),setInvoiceEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:500,padding:28,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>{invoiceEdit.id?"EDITAR NF":"NOVA NOTA FISCAL"}</div>
              <button onClick={()=>{setInvoiceModal(false);setInvoiceEdit(null);}} style={btnGhost}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{marginBottom:14}}><div style={lbl}>Cliente</div><select value={invoiceEdit.client_id||""} onChange={e=>setInvoiceEdit({...invoiceEdit,client_id:e.target.value})} style={inp}><option value="">Selecionar...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Número NF</div><input value={invoiceEdit.number||""} onChange={e=>setInvoiceEdit({...invoiceEdit,number:e.target.value})} placeholder="NF-001" style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Valor (R$)</div><input type="number" value={invoiceEdit.amount||0} step="0.01" onChange={e=>setInvoiceEdit({...invoiceEdit,amount:parseFloat(e.target.value)||0})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Status</div><select value={invoiceEdit.status||"pendente"} onChange={e=>setInvoiceEdit({...invoiceEdit,status:e.target.value})} style={inp}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="vencido">Vencido</option><option value="cancelado">Cancelado</option></select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Data emissão</div><input type="date" value={invoiceEdit.issued_date||""} onChange={e=>setInvoiceEdit({...invoiceEdit,issued_date:e.target.value})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Data vencimento</div><input type="date" value={invoiceEdit.due_date||""} onChange={e=>setInvoiceEdit({...invoiceEdit,due_date:e.target.value})} style={inp}/></div>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Descrição</div><input value={invoiceEdit.description||""} onChange={e=>setInvoiceEdit({...invoiceEdit,description:e.target.value})} placeholder="Produção de conteúdo - Abril 2026" style={inp}/></div>
            <div style={{marginBottom:14}}><div style={lbl}>Notas</div><textarea value={invoiceEdit.notes||""} onChange={e=>setInvoiceEdit({...invoiceEdit,notes:e.target.value})} style={{...inp,minHeight:60}}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setInvoiceModal(false);setInvoiceEdit(null);}} style={btnGhost}>Cancelar</button>
              <button onClick={saveInvoice} style={btnGold}>SALVAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Library modal */}
      {libModal&&libEdit&&(
        <div onClick={e=>e.target===e.currentTarget&&(setLibModal(false),setLibEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:500,padding:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>{libEdit.id?"EDITAR ITEM":"NOVO ITEM"}</div>
              <button onClick={()=>{setLibModal(false);setLibEdit(null);}} style={btnGhost}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{marginBottom:14}}><div style={lbl}>Tipo</div><select value={libEdit.type||"hook"} onChange={e=>setLibEdit({...libEdit,type:e.target.value})} style={inp}>{["hook","titulo","cta","thumbnail","template"].map(t=><option key={t}>{t}</option>)}</select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Nicho</div><select value={libEdit.niche||""} onChange={e=>setLibEdit({...libEdit,niche:e.target.value})} style={inp}><option value="">Geral</option>{NICHES.map(n=><option key={n}>{n}</option>)}</select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Cliente</div><select value={libEdit.client_id||""} onChange={e=>setLibEdit({...libEdit,client_id:e.target.value||null})} style={inp}><option value="">Todos</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Views</div><input type="number" value={libEdit.views||0} onChange={e=>setLibEdit({...libEdit,views:parseInt(e.target.value)||0})} style={inp}/></div>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Conteúdo</div><textarea value={libEdit.content||""} onChange={e=>setLibEdit({...libEdit,content:e.target.value})} style={{...inp,minHeight:100}} placeholder="Hook, título, CTA ou descrição..."/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setLibModal(false);setLibEdit(null);}} style={btnGhost}>Cancelar</button>
              <button onClick={saveLib} style={btnGold}>SALVAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Goal modal */}
      {goalModal&&goalEdit&&(
        <div onClick={e=>e.target===e.currentTarget&&(setGoalModal(false),setGoalEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:400,padding:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>META MENSAL</div>
              <button onClick={()=>{setGoalModal(false);setGoalEdit(null);}} style={btnGhost}>✕</button>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Mês (AAAA-MM)</div><input value={goalEdit.month||""} onChange={e=>setGoalEdit({...goalEdit,month:e.target.value})} placeholder="2026-04" style={inp}/></div>
            <div style={{marginBottom:14}}><div style={lbl}>Cliente</div><select value={goalEdit.client_id||""} onChange={e=>setGoalEdit({...goalEdit,client_id:e.target.value||null})} style={inp}><option value="">Geral</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <div style={{marginBottom:14}}><div style={lbl}>Vídeos</div><input type="number" value={goalEdit.videos_target||0} onChange={e=>setGoalEdit({...goalEdit,videos_target:parseInt(e.target.value)||0})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Receita (R$)</div><input type="number" value={goalEdit.revenue_target||0} onChange={e=>setGoalEdit({...goalEdit,revenue_target:parseFloat(e.target.value)||0})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Horas</div><input type="number" value={goalEdit.hours_target||0} onChange={e=>setGoalEdit({...goalEdit,hours_target:parseFloat(e.target.value)||0})} style={inp}/></div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setGoalModal(false);setGoalEdit(null);}} style={btnGhost}>Cancelar</button>
              <button onClick={saveGoal} style={btnGold}>SALVAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Approval modal */}
      {approvalModal&&(
        <div onClick={e=>e.target===e.currentTarget&&setApprovalModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:480,padding:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>LINK DE APROVAÇÃO</div>
              <button onClick={()=>setApprovalModal(null)} style={btnGhost}>✕</button>
            </div>
            <div style={{fontFamily:"'DM Sans'",fontSize:13,color:MUTED,marginBottom:12}}>Compartilhe com o cliente para aprovar o roteiro:</div>
            <div style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:8,padding:"12px 14px",fontFamily:"'IBM Plex Mono'",fontSize:12,color:ACCENT,wordBreak:"break-all",marginBottom:16}}>
              {typeof window!=="undefined"?`${window.location.origin}/aprovacao/${approvalModal.approval_token}`:""}
            </div>
            <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/aprovacao/${approvalModal.approval_token}`);flash();}} style={{...btnGold,width:"100%"}}>📋 COPIAR LINK</button>
          </div>
        </div>
      )}

      {/* Script modal */}
      {scriptModal&&scriptData&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:200,overflowY:"auto"}}>
          <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
            <div style={{marginBottom:28}}>
              <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>ROTEIRO COMPLETO — FACELESS VIDEO</div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:40,letterSpacing:-0.5,lineHeight:1,marginBottom:16}}>
                {scriptData.title?.split(" ").map((w,i,arr)=><span key={i} style={{color:i===Math.floor(arr.length/2)?ACCENT:TEXT}}>{w} </span>)}
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {["YouTube · 8–10 min","Reels · 60–75s","Faceless · Narração em off","Nano Banana 2 · Prompts incluídos"].map(t=>(
                  <div key={t} style={{border:`1px solid ${BORDER}`,borderRadius:6,padding:"5px 12px",fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>{t}</div>
                ))}
              </div>
            </div>

            <div style={{display:"flex",gap:2,borderBottom:`1px solid ${BORDER}`,marginBottom:24}}>
              {["youtube","reels"].map(t=>(
                <button key={t} onClick={()=>setScriptTab(t)} style={{background:"transparent",border:"none",borderBottom:scriptTab===t?`2px solid ${ACCENT}`:"2px solid transparent",color:scriptTab===t?ACCENT:MUTED,padding:"10px 20px",cursor:"pointer",fontFamily:"'DM Sans'",fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>
                  {t==="youtube"?"YOUTUBE":"REELS / SHORTS"}
                </button>
              ))}
              <div style={{flex:1}}/>
              <button onClick={saveScript} style={{...btnGold,marginBottom:4}}>💾 SALVAR</button>
              <button onClick={()=>setScriptModal(false)} style={{...btnGhost,marginBottom:4,marginLeft:8}}>✕ FECHAR</button>
            </div>

            {/* Ângulos */}
            <div style={{...card,marginBottom:24}}>
              <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>ÂNGULOS DE CÂMERA</div>
              <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                {CAMERA_ANGLES.map((a,i)=>(
                  <div key={a} style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono'",fontSize:11,color:MUTED}}>
                    <span style={{width:20,height:20,border:`1.5px solid ${[ACCENT,BLUE,RED,GREEN,PURP,ACCENT][i]}`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:[ACCENT,BLUE,RED,GREEN,PURP,ACCENT][i],fontWeight:700}}>{a}</span>
                    {ANGLE_LABELS[a]}
                  </div>
                ))}
              </div>
            </div>

            {/* Takes por seção */}
            {SCRIPT_SECTIONS.map(section=>{
              const sectionTakes=scriptTakes.filter(t=>t.section===section);
              return(
                <div key={section} style={{marginBottom:36}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:-0.5,color:TEXT}}>{section}</div>
                    {sectionTakes.length>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:MUTED}}>{sectionTakes[0]?.startTime} — {sectionTakes[sectionTakes.length-1]?.endTime}</div>}
                  </div>
                  <div style={{borderTop:`1px solid ${BORDER}`,marginBottom:16}}/>
                  {sectionTakes.map(take=>(
                    <div key={take.id} style={{display:"grid",gridTemplateColumns:"110px 1fr",marginBottom:12,border:`1px solid ${BORDER}`,borderRadius:10,overflow:"hidden"}}>
                      <div style={{background:BG,padding:"14px 10px",display:"flex",flexDirection:"column",gap:8,borderRight:`1px solid ${BORDER}`}}>
                        <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:MUTED}}>T-{String(scriptTakes.indexOf(take)+1).padStart(2,"0")}</div>
                        <input value={take.startTime||""} onChange={e=>updateTake(take.id,"startTime",e.target.value)} style={{...inp,background:"transparent",border:"none",color:ACCENT,fontFamily:"'Bebas Neue'",fontSize:16,fontWeight:600,padding:0,width:"80px"}} placeholder="00:00"/>
                        <input value={take.endTime||""} onChange={e=>updateTake(take.id,"endTime",e.target.value)} style={{...inp,background:"transparent",border:"none",color:ACCENT,fontFamily:"'Bebas Neue'",fontSize:16,fontWeight:600,padding:0,width:"80px"}} placeholder="00:07"/>
                        <select value={take.angle||"A"} onChange={e=>updateTake(take.id,"angle",e.target.value)} style={{...inp,background:BG,padding:"3px 4px",fontSize:10,fontFamily:"'IBM Plex Mono'",width:65}}>
                          {CAMERA_ANGLES.map(a=><option key={a}>ANG-{a}</option>)}
                        </select>
                        <button onClick={()=>deleteTake(take.id)} style={{...btnGhost,padding:"2px 6px",fontSize:10,color:RED,borderColor:`${RED}44`,marginTop:"auto"}}>✕</button>
                      </div>
                      <div style={{background:CARD,padding:"14px 18px"}}>
                        <div style={{background:`${SECTION_COLORS[section]}22`,border:`1px solid ${SECTION_COLORS[section]}44`,borderRadius:4,padding:"2px 8px",display:"inline-block",fontFamily:"'IBM Plex Mono'",fontSize:10,color:SECTION_COLORS[section],marginBottom:12,letterSpacing:1}}>{section}</div>
                        <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>NARRAÇÃO</div>
                        <textarea value={take.narration||""} onChange={e=>updateTake(take.id,"narration",e.target.value)} placeholder="Em 1999, Joan Murray saltou de um avião..." style={{...inp,background:"transparent",border:"none",borderLeft:`2px solid ${BORDER}`,borderRadius:0,padding:"5px 0 5px 12px",fontStyle:"italic",fontSize:14,minHeight:60,lineHeight:1.7}}/>
                        <div style={{fontFamily:"'DM Sans'",fontSize:10,color:MUTED,letterSpacing:1,textTransform:"uppercase",marginBottom:6,marginTop:12}}>VISUAL</div>
                        <textarea value={take.visual||""} onChange={e=>updateTake(take.id,"visual",e.target.value)} placeholder="Céu aberto, fisheye de baixo pra cima..." style={{...inp,background:"transparent",border:"none",borderLeft:`2px solid ${BORDER}`,borderRadius:0,padding:"5px 0 5px 12px",fontSize:13,minHeight:50,lineHeight:1.7}}/>
                        <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:8,padding:"10px 12px",marginTop:12}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                            <span style={{width:7,height:7,borderRadius:"50%",background:GREEN,display:"inline-block"}}/>
                            <span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:GREEN,letterSpacing:1}}>PROMPT NANO BANANA 2</span>
                          </div>
                          <textarea value={take.prompt||""} onChange={e=>updateTake(take.id,"prompt",e.target.value)} placeholder="Fisheye POV shot looking straight up at open blue sky..." style={{...inp,background:"transparent",border:"none",color:GREEN,fontFamily:"'IBM Plex Mono'",fontSize:11,minHeight:60,lineHeight:1.6,padding:0}}/>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>addTake(section)} style={{...btnGhost,fontSize:11,color:SECTION_COLORS[section],borderColor:`${SECTION_COLORS[section]}44`}}>+ Take em {section}</button>
                </div>
              );
            })}

            <div style={{display:"flex",gap:10,marginTop:20,paddingTop:20,borderTop:`1px solid ${BORDER}`}}>
              <button onClick={()=>addTake()} style={btnGhost}>+ Novo Take</button>
              <button onClick={saveScript} style={btnGold}>💾 SALVAR ROTEIRO</button>
              <button onClick={()=>setScriptModal(false)} style={{...btnGhost,marginLeft:"auto"}}>✕ FECHAR</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEO DETAIL MODAL (Canais Dark) ── */}
      {videoDetailModal&&(
        <div onClick={e=>e.target===e.currentTarget&&setVideoDetailModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:150,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}>
          <div style={{background:BG2,borderLeft:`1px solid ${BORDER2}`,width:"100%",maxWidth:680,height:"100vh",overflowY:"auto",padding:32}}>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
              <div style={{flex:1,marginRight:16}}>
                <input value={videoDetailModal.meu_titulo||videoDetailModal.title||""} onChange={e=>setVideoDetailModal({...videoDetailModal,meu_titulo:e.target.value})} style={{...inp,fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:1,background:"transparent",border:"none",borderBottom:`1px solid ${BORDER2}`,borderRadius:0,padding:"4px 0",width:"100%"}} placeholder="Título do vídeo..."/>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <button onClick={()=>saveVideoDetail(videoDetailModal)} style={btnGold}>💾 SALVAR</button>
                <button onClick={()=>setVideoDetailModal(null)} style={btnGhost}>✕</button>
              </div>
            </div>

            {/* Status pipeline */}
            <div style={{marginBottom:20}}>
              <div style={lbl}>Etapa no pipeline</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {PIPELINE.map(s=>{
                  const color=PIPELINE_COLORS[s]||ACCENT;
                  const active=videoDetailModal.status===s;
                  return(
                    <button key={s} onClick={()=>setVideoDetailModal({...videoDetailModal,status:s})} style={{...btnGhost,fontSize:11,padding:"5px 12px",color:active?color:MUTED,borderColor:active?`${color}66`:BORDER,background:active?`${color}15`:undefined,fontWeight:active?600:400}}>
                      {active?"● ":""}{s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metadados */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
              <div>
                <div style={lbl}>Nicho</div>
                <select value={videoDetailModal.niche||""} onChange={e=>setVideoDetailModal({...videoDetailModal,niche:e.target.value})} style={inp}>
                  {NICHES.map(n=><option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <div style={lbl}>Data publicação</div>
                <input type="date" value={videoDetailModal.publish_date||""} onChange={e=>setVideoDetailModal({...videoDetailModal,publish_date:e.target.value})} style={inp}/>
              </div>
              <div>
                <div style={lbl}>Plataformas</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>
                  {["YouTube","Instagram","TikTok","Shorts"].map(p=>{
                    const plats=videoDetailModal.platforms||[];
                    const active=plats.includes(p);
                    return<button key={p} onClick={()=>setVideoDetailModal({...videoDetailModal,platforms:active?plats.filter(x=>x!==p):[...plats,p]})} style={{...btnGhost,padding:"2px 8px",fontSize:10,color:active?ACCENT:MUTED,borderColor:active?`${ACCENT}44`:BORDER,background:active?`${ACCENT}10`:undefined}}>{p}</button>;
                  })}
                </div>
              </div>
            </div>

            {/* Referência */}
            {videoDetailModal.ref_url&&(
              <div style={{...card,marginBottom:20,borderColor:`${BLUE}33`}}>
                <div style={{fontFamily:"'DM Sans'",fontSize:10,color:BLUE,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>📎 VÍDEO DE REFERÊNCIA</div>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  {videoDetailModal.ref_thumb&&<img src={videoDetailModal.ref_thumb} alt="" style={{width:100,height:70,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
                  <div style={{flex:1}}>
                    <a href={videoDetailModal.ref_url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,color:TEXT,textDecoration:"none",display:"block",marginBottom:4}}>{videoDetailModal.ref_titulo}</a>
                    <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:4}}>{videoDetailModal.ref_canal}</div>
                    {videoDetailModal.ref_views>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT}}>{videoDetailModal.ref_views?.toLocaleString("pt-BR")} views</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Meu título */}
            <div style={{marginBottom:16}}>
              <div style={lbl}>Meu título</div>
              <input value={videoDetailModal.meu_titulo||""} onChange={e=>setVideoDetailModal({...videoDetailModal,meu_titulo:e.target.value})} placeholder="Título otimizado para YouTube..." style={inp}/>
            </div>

            {/* Minha thumbnail */}
            <div style={{marginBottom:16}}>
              <div style={lbl}>Ideia de thumbnail</div>
              <textarea value={videoDetailModal.minha_thumbnail||""} onChange={e=>setVideoDetailModal({...videoDetailModal,minha_thumbnail:e.target.value})} placeholder="Descreva a ideia da thumbnail: cores, texto, imagem, estilo..." style={{...inp,minHeight:60}}/>
            </div>

            {/* Transcrição */}
            <div style={{marginBottom:16}}>
              <div style={lbl}>Transcrição do vídeo de referência</div>
              <textarea value={videoDetailModal.transcricao||""} onChange={e=>setVideoDetailModal({...videoDetailModal,transcricao:e.target.value})} placeholder="Cole aqui a transcrição do vídeo de referência..." style={{...inp,minHeight:120}}/>
            </div>

            {/* Meu roteiro */}
            <div style={{marginBottom:16}}>
              <div style={lbl}>Meu roteiro</div>
              <textarea value={videoDetailModal.meu_roteiro||""} onChange={e=>setVideoDetailModal({...videoDetailModal,meu_roteiro:e.target.value})} placeholder="Escreva seu roteiro adaptado aqui..." style={{...inp,minHeight:200}}/>
            </div>

            {/* Descrição YouTube */}
            <div style={{marginBottom:16}}>
              <div style={lbl}>Descrição YouTube</div>
              <textarea value={videoDetailModal.descricao_yt||""} onChange={e=>setVideoDetailModal({...videoDetailModal,descricao_yt:e.target.value})} placeholder="Descrição completa para o YouTube com timestamps, links, hashtags..." style={{...inp,minHeight:100}}/>
            </div>

            {/* Hook */}
            <div style={{marginBottom:16}}>
              <div style={lbl}>Hook (frase de abertura)</div>
              <input value={videoDetailModal.hook||""} onChange={e=>setVideoDetailModal({...videoDetailModal,hook:e.target.value})} placeholder="Em 1999, Joan Murray saltou de um avião..." style={inp}/>
            </div>

            {/* Drive locução */}
            <div style={{marginBottom:16}}>
              <div style={lbl}>📁 Link Google Drive — Arquivo de locução</div>
              <input value={videoDetailModal["drive_locuçao"]||""} onChange={e=>setVideoDetailModal({...videoDetailModal,"drive_locuçao":e.target.value})} placeholder="https://drive.google.com/... (para a equipe de edição)" style={inp}/>
            </div>

            {/* Notas */}
            <div style={{marginBottom:24}}>
              <div style={lbl}>Notas</div>
              <textarea value={videoDetailModal.notes||""} onChange={e=>setVideoDetailModal({...videoDetailModal,notes:e.target.value})} placeholder="Observações, ideias soltas..." style={{...inp,minHeight:60}}/>
            </div>

            <div style={{display:"flex",gap:10,paddingTop:16,borderTop:`1px solid ${BORDER}`}}>
              <button onClick={()=>saveVideoDetail(videoDetailModal)} style={{...btnGold,flex:1}}>💾 SALVAR</button>
              <button onClick={()=>openScript(videoDetailModal)} style={{...btnGhost,color:ACCENT,borderColor:`${ACCENT}44`}}>📄 Roteiro Joan Murray</button>
              <button onClick={()=>{deleteVideo(videoDetailModal.id);setVideoDetailModal(null);}} style={{...btnGhost,color:RED,borderColor:`${RED}33`}}>🗑 Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ── USE AS BASE MODAL ── */}
      {useAsBaseModal&&(
        <div onClick={e=>e.target===e.currentTarget&&setUseAsBaseModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:160,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:500,padding:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>USAR COMO BASE</div>
              <button onClick={()=>setUseAsBaseModal(null)} style={btnGhost}>✕</button>
            </div>
            <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"flex-start"}}>
              {useAsBaseModal.thumb&&<img src={useAsBaseModal.thumb} alt="" style={{width:100,height:72,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
              <div style={{flex:1}}>
                <div style={{fontFamily:"'DM Sans'",fontSize:13,fontWeight:600,marginBottom:4,lineHeight:1.4}}>{useAsBaseModal.title}</div>
                <div style={{fontFamily:"'DM Sans'",fontSize:11,color:MUTED,marginBottom:4}}>{useAsBaseModal.channel}</div>
                {useAsBaseModal.views>0&&<div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:ACCENT}}>{useAsBaseModal.views?.toLocaleString("pt-BR")} views</div>}
                <a href={useAsBaseModal.url} target="_blank" rel="noreferrer" style={{fontFamily:"'DM Sans'",fontSize:11,color:BLUE,display:"block",marginTop:4}}>▶ Assistir no YouTube</a>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={lbl}>Nicho para o seu vídeo</div>
              <select value={useAsBaseModal.niche||NICHES[0]} onChange={e=>setUseAsBaseModal({...useAsBaseModal,niche:e.target.value})} style={inp}>
                {NICHES.map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
            <div style={{fontFamily:"'DM Sans'",fontSize:12,color:MUTED,marginBottom:16,padding:"10px 12px",background:BG,borderRadius:6}}>
              Isso vai criar um novo vídeo na coluna <span style={{color:ACCENT,fontWeight:600}}>Roteiro</span> do Canais Dark com esse vídeo como referência.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setUseAsBaseModal(null)} style={btnGhost}>Cancelar</button>
              <button onClick={()=>useVideoAsBase(useAsBaseModal,useAsBaseModal.niche)} style={{...btnGold,flex:1}}>🎬 CRIAR NO PIPELINE</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REF CHANNEL MODAL ── */}
      {refChannelModal&&refChannelEdit&&(
        <div onClick={e=>e.target===e.currentTarget&&(setRefChannelModal(false),setRefChannelEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:160,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:480,padding:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>{refChannelEdit.id?"EDITAR CANAL":"NOVO CANAL DE REFERÊNCIA"}</div>
              <button onClick={()=>{setRefChannelModal(false);setRefChannelEdit(null);}} style={btnGhost}>✕</button>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Nome do canal</div><input value={refChannelEdit.name||""} onChange={e=>setRefChannelEdit({...refChannelEdit,name:e.target.value})} placeholder="Ex: Fatos Desconhecidos" style={inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{marginBottom:14}}><div style={lbl}>Nicho</div><select value={refChannelEdit.niche||NICHES[0]} onChange={e=>setRefChannelEdit({...refChannelEdit,niche:e.target.value})} style={inp}>{NICHES.map(n=><option key={n}>{n}</option>)}</select></div>
              <div style={{marginBottom:14}}><div style={lbl}>Inscritos</div><input value={refChannelEdit.subscribers||""} onChange={e=>setRefChannelEdit({...refChannelEdit,subscribers:e.target.value})} placeholder="Ex: 14M" style={inp}/></div>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>URL do canal</div><input value={refChannelEdit.url||""} onChange={e=>setRefChannelEdit({...refChannelEdit,url:e.target.value})} placeholder="https://youtube.com/@canal" style={inp}/></div>
            <div style={{marginBottom:14}}><div style={lbl}>Channel ID (para buscar vídeos via API)</div><input value={refChannelEdit.channel_id||""} onChange={e=>setRefChannelEdit({...refChannelEdit,channel_id:e.target.value})} placeholder="UCxxxxxxxxxx (encontre em about do canal)" style={inp}/></div>
            <div style={{marginBottom:20}}><div style={lbl}>Notas</div><textarea value={refChannelEdit.notes||""} onChange={e=>setRefChannelEdit({...refChannelEdit,notes:e.target.value})} placeholder="Por que este canal é referência, o que funciona nele..." style={{...inp,minHeight:60}}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setRefChannelModal(false);setRefChannelEdit(null);}} style={btnGhost}>Cancelar</button>
              <button onClick={saveRefChannel} style={btnGold}>SALVAR</button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEADS MODAL ── */}
      {leadModal&&leadEdit&&(
        <div onClick={e=>e.target===e.currentTarget&&(setLeadModal(false),setLeadEdit(null))} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:160,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:BG2,border:`1px solid ${BORDER2}`,borderRadius:12,width:"100%",maxWidth:500,padding:28,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>{leadEdit.id?"EDITAR LEAD":"NOVO LEAD"}</div>
              <button onClick={()=>{setLeadModal(false);setLeadEdit(null);}} style={btnGhost}>✕</button>
            </div>
            <div style={{marginBottom:14}}><div style={lbl}>Nome</div><input value={leadEdit.name||""} onChange={e=>setLeadEdit({...leadEdit,name:e.target.value})} style={inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{marginBottom:14}}><div style={lbl}>Contato (email/tel)</div><input value={leadEdit.contact||""} onChange={e=>setLeadEdit({...leadEdit,contact:e.target.value})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Serviço solicitado</div><input value={leadEdit.service||""} onChange={e=>setLeadEdit({...leadEdit,service:e.target.value})} placeholder="Ex: Gestão de canal YouTube" style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Valor proposto (R$)</div><input type="number" value={leadEdit.proposed_value||0} onChange={e=>setLeadEdit({...leadEdit,proposed_value:parseFloat(e.target.value)||0})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Status</div>
                <select value={leadEdit.status||"novo"} onChange={e=>setLeadEdit({...leadEdit,status:e.target.value})} style={inp}>
                  {["novo","proposta_enviada","em_negociacao","fechado","perdido"].map(s=><option key={s} value={s}>{s.replace(/_/g," ").replace(/\w/g,c=>c.toUpperCase())}</option>)}
                </select>
              </div>
              <div style={{marginBottom:14}}><div style={lbl}>Último contato</div><input type="date" value={leadEdit.last_contact||""} onChange={e=>setLeadEdit({...leadEdit,last_contact:e.target.value})} style={inp}/></div>
              <div style={{marginBottom:14}}><div style={lbl}>Follow-up em</div><input type="date" value={leadEdit.follow_up_date||""} onChange={e=>setLeadEdit({...leadEdit,follow_up_date:e.target.value})} style={inp}/></div>
            </div>
            <div style={{marginBottom:20}}><div style={lbl}>Notas</div><textarea value={leadEdit.notes||""} onChange={e=>setLeadEdit({...leadEdit,notes:e.target.value})} style={{...inp,minHeight:70}}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setLeadModal(false);setLeadEdit(null);}} style={btnGhost}>Cancelar</button>
              <button onClick={saveLead} style={btnGold}>SALVAR</button>
            </div>
          </div>
        </div>
      )}

            {/* Confetti */}
      {confetti&&(
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999}}>
          {Array.from({length:24},(_,i)=>(
            <div key={i} style={{position:"absolute",left:`${Math.random()*100}vw`,top:"-10px",width:8,height:8,borderRadius:2,background:[ACCENT,GREEN,BLUE,RED,PURP][i%5],animation:`conffall ${1+Math.random()}s ease-in ${Math.random()*.5}s forwards`}}/>
          ))}
          <style>{`@keyframes conffall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
        </div>
      )}

    </div>
  );
}
