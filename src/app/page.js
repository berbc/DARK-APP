"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─── CONSTANTS ───────────────────────────────────────────────
const TABS = ["Dashboard","Focus OS","Agenda","Canais Dark","Clientes","Finanças","Biblioteca"];
const TAB_ICONS = ["⬛","⚡","📅","🎬","◈","💰","📚"];

const NICHES = ["Curiosidades Gerais","Psicologia & Comportamento","Mistério & Paranormal","True Crime","História Sombria","Ciência Sombria","Filosofia Existencial","Lendas Urbanas BR"];
const NICHE_CPM = {"Curiosidades Gerais":"$4–8","Psicologia & Comportamento":"$8–15","Mistério & Paranormal":"$5–9","True Crime":"$6–11","História Sombria":"$7–13","Ciência Sombria":"$8–14","Filosofia Existencial":"$10–18","Lendas Urbanas BR":"$4–7"};
const VIDEO_STATUSES = ["ideia","roteiro","gravando","editando","publicado"];
const TASK_TYPES = ["Roteiro","Gravação","Edição","Thumbnail","Revisão","Upload","Reunião","Pesquisa"];
const URGENCIES = ["normal","warn","hot"];
const PLATFORMS = ["YouTube","Instagram","TikTok","Shorts","Spotify"];
const SCRIPT_SECTIONS = ["GANCHO","CONSTRUÇÃO","A VIRADA","DESENVOLVIMENTO","DESFECHO","CTA"];
const SECTION_COLORS = {"GANCHO":"#F59E0B","CONSTRUÇÃO":"#FBBF24","A VIRADA":"#60A5FA","DESENVOLVIMENTO":"#A78BFA","DESFECHO":"#34D399","CTA":"#F0EDE4"};
const CAMERA_ANGLES = ["A","B","C","D","E","F"];
const ANGLE_LABELS = {"A":"Céu fisheye de baixo","B":"Over shoulder, terra abaixo","C":"Top-down aéreo","D":"Bottom-up contra o sol","E":"Raso do solo, impacto","F":"Macro / close dramático"};

// ─── STYLES ──────────────────────────────────────────────────
const BG    = "#0A0A08";
const BG2   = "#111110";
const BG3   = "#181816";
const SURF  = "#1E1E1B";
const SURF2 = "#252522";
const BOR   = "rgba(255,255,255,0.07)";
const BOR2  = "rgba(255,255,255,0.13)";
const TEXT  = "#F0EDE4";
const MUTED = "#7A7870";
const HINT  = "#454440";
const GOLD  = "#FBBF24";
const GREEN = "#4ADE80";
const RED   = "#F87171";
const BLUE  = "#60A5FA";
const PURP  = "#A78BFA";

const S = {
  card: { background: SURF, border: `0.5px solid ${BOR}`, borderRadius: 12, padding: 20 },
  lbl:  { color: MUTED, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'IBM Plex Mono'", marginBottom: 6, display: "block" },
  val:  { color: TEXT, fontSize: 14, lineHeight: 1.6, fontFamily: "'Instrument Sans'" },
  inp:  { background: BG3, border: `0.5px solid ${BOR2}`, borderRadius: 8, color: TEXT, padding: "9px 12px", fontFamily: "'Instrument Sans'", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" },
  btn:  { background: "transparent", color: TEXT, border: `0.5px solid ${BOR2}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "'Instrument Sans'", fontSize: 12, fontWeight: 600 },
  cta:  { background: GOLD, color: BG, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "'Syne'", fontSize: 13, fontWeight: 700 },
  mono: { fontFamily: "'IBM Plex Mono'", fontSize: 11 },
  syne: { fontFamily: "'Syne'", fontWeight: 800 },
};

const CLIENT_COLORS = {
  "Sr. Waldemar": GOLD,
  "Bulldog Show":  BLUE,
  "Charla":        RED,
  "F4":            PURP,
  "Canais Dark":   GREEN,
};

// ─── HELPERS ─────────────────────────────────────────────────
const toLocalDate = (d) => { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`; };
const today = () => toLocalDate(new Date());
const deadlineDiff = (d) => { if(!d) return 999; const now=new Date(); now.setHours(0,0,0,0); const dt=new Date(d+"T12:00:00"); return Math.round((dt-now)/86400000); };
const deadlineColor = (d) => { const diff=deadlineDiff(d); if(diff<0) return RED; if(diff<=1) return RED; if(diff<=3) return GOLD; return GREEN; };
const deadlineLabel = (d) => { if(!d) return ""; const diff=deadlineDiff(d); if(diff<0) return `${Math.abs(diff)}d atraso`; if(diff===0) return "Hoje!"; if(diff===1) return "Amanhã"; return `${diff}d`; };
const fmtCurrency = (v) => `R$ ${(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const fmtDate = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}) : "—";
const taskScore = (t) => { const u={hot:100,warn:50,normal:10}[t.urgency||"normal"]; const d=Math.max(0,10-deadlineDiff(t.deadline)); const s=(t.estimated_hours||1); return u + d*5 - s; };

// ─── SMALL COMPONENTS ────────────────────────────────────────
const Tag = ({children, color="#FBBF24", bg}) => (
  <span style={{background:bg||`${color}18`,color,border:`0.5px solid ${color}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:600,fontFamily:"'IBM Plex Mono'",letterSpacing:0.5}}>
    {children}
  </span>
);

const StatusDot = ({color}) => (
  <span style={{width:7,height:7,borderRadius:2,background:color,display:"inline-block",marginRight:6,flexShrink:0}} />
);

const ProgressBar = ({value, max, color=GOLD, height=5}) => (
  <div style={{background:BG3,borderRadius:3,height,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.min(100,Math.round((value/Math.max(1,max))*100))}%`,background:color,borderRadius:3,transition:"width .5s ease"}} />
  </div>
);

const XPBar = ({xp, level}) => {
  const LEVELS = [0,100,250,500,1000,2000,4000];
  const cur = LEVELS[level-1]||0;
  const nxt = LEVELS[level]||cur+500;
  return (
    <div>
      <ProgressBar value={xp-cur} max={nxt-cur} color={GREEN} height={4} />
    </div>
  );
};

const Confetti = ({show}) => {
  const colors = [GOLD,GREEN,BLUE,RED,PURP];
  if(!show) return null;
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999}}>
      {Array.from({length:20},(_,i) => (
        <div key={i} style={{
          position:"absolute",
          left:`${Math.random()*100}vw`,
          top:"-10px",
          width:8,height:8,
          borderRadius:2,
          background:colors[i%colors.length],
          animation:`fall ${1+Math.random()}s ease-in ${Math.random()*0.5}s forwards`,
        }}/>
      ))}
      <style>{`@keyframes fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function BernardoOS() {
  // AUTH
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // DATA
  const [clients, setClients]     = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [videos, setVideos]       = useState([]);
  const [ideas, setIdeas]         = useState([]);
  const [posts, setPosts]         = useState([]);
  const [invoices, setInvoices]   = useState([]);
  const [goals, setGoals]         = useState([]);
  const [library, setLibrary]     = useState([]);
  const [userStats, setUserStats] = useState({xp:0,level:1,streak:0,tasks_completed:0,pomodoros_completed:0});
  const [trending, setTrending]   = useState({br:[],global:[]});
  const [loading, setLoading]     = useState(true);

  // UI
  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved]         = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const [confetti, setConfetti]   = useState(false);
  const [quickCapture, setQuickCapture] = useState(false);
  const [quickText, setQuickText] = useState("");
  const [quickDest, setQuickDest] = useState("idea");

  // FOCUS OS
  const [focusTaskId, setFocusTaskId]     = useState(null);
  const [timerRunning, setTimerRunning]   = useState(false);
  const [timerSeconds, setTimerSeconds]   = useState(25*60);
  const [timerMode, setTimerMode]         = useState("work");
  const [activeEntry, setActiveEntry]     = useState(null);
  const timerRef = useRef(null);

  // AGENDA
  const [weekOffset, setWeekOffset] = useState(0);

  // DARK VIDEOS
  const [selectedVideo, setSelectedVideo]   = useState(null);
  const [videoModal, setVideoModal]         = useState(false);
  const [videoEdit, setVideoEdit]           = useState(null);
  const [scriptModal, setScriptModal]       = useState(false);
  const [scriptData, setScriptData]         = useState(null);
  const [scriptTakes, setScriptTakes]       = useState([]);
  const [scriptTab, setScriptTab]           = useState("youtube");
  const [dragOver, setDragOver]             = useState(null);
  const [nicheFilter, setNicheFilter]       = useState("todos");

  // CLIENTES
  const [clientModal, setClientModal]   = useState(false);
  const [clientEdit, setClientEdit]     = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [taskModal, setTaskModal]       = useState(false);
  const [taskEdit, setTaskEdit]         = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);

  // FINANÇAS
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceEdit, setInvoiceEdit]   = useState(null);
  const [invoiceFilter, setInvoiceFilter] = useState("todos");
  const [invoiceClient, setInvoiceClient] = useState("todos");

  // BIBLIOTECA
  const [libModal, setLibModal]     = useState(false);
  const [libEdit, setLibEdit]       = useState(null);
  const [libFilter, setLibFilter]   = useState("todos");
  const [libSearch, setLibSearch]   = useState("");

  // GOALS
  const [goalModal, setGoalModal] = useState(false);
  const [goalEdit, setGoalEdit]   = useState(null);

  // ── FLASH ──
  const flash = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };
  const flashError = (m) => { setErrorMsg(m); setTimeout(()=>setErrorMsg(""),4000); };
  const triggerConfetti = () => { setConfetti(true); setTimeout(()=>setConfetti(false),2500); };

  // ── AUTH ──
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user??null);setCheckingAuth(false);});
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user??null));
    return ()=>subscription.unsubscribe();
  },[]);

  const login = async () => {
    setLoginLoading(true); setLoginError("");
    const {error} = await supabase.auth.signInWithPassword({email:loginEmail,password:loginPassword});
    if(error) setLoginError(error.message);
    setLoginLoading(false);
  };
  const logout = async () => await supabase.auth.signOut();

  // ── LOAD DATA ──
  const loadAll = useCallback(async()=>{
    setLoading(true);
    try {
      const [cl,tk,vi,id,po,inv,go,lib,us] = await Promise.all([
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
      if(cl.data) setClients(cl.data);
      if(tk.data) setTasks(tk.data);
      if(vi.data) setVideos(vi.data);
      if(id.data) setIdeas(id.data);
      if(po.data) setPosts(po.data);
      if(inv.data) setInvoices(inv.data);
      if(go.data) setGoals(go.data);
      if(lib.data) setLibrary(lib.data);
      if(us.data?.[0]) setUserStats(us.data[0]);
      else {
        const {data:ns} = await supabase.from("user_stats").insert({xp:0,level:1,streak:0,tasks_completed:0,pomodoros_completed:0,last_active:today()}).select().single();
        if(ns) setUserStats(ns);
      }
    } catch(e){ flashError("Erro ao carregar dados"); }
    setLoading(false);
  },[]);

  useEffect(()=>{ if(user) loadAll(); },[user,loadAll]);

  // ── TRENDING (cache 6h) ──
  const loadTrending = useCallback(async()=>{
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if(!apiKey) return;
    try {
      // Check cache
      const {data:cache} = await supabase.from("trending_cache").select("*").order("fetched_at",{ascending:false}).limit(2);
      const brCache  = cache?.find(c=>c.region==="BR");
      const glCache  = cache?.find(c=>c.region==="US");
      const now = new Date();
      const stale = (c) => !c || (now - new Date(c.fetched_at)) > 6*60*60*1000;

      const fetchRegion = async (region) => {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&maxResults=10&key=${apiKey}`);
        const d = await res.json();
        return (d.items||[]).map(v=>({id:v.id,title:v.snippet?.title,channel:v.snippet?.channelTitle,thumb:v.snippet?.thumbnails?.medium?.url,views:parseInt(v.statistics?.viewCount||0),region}));
      };

      let br = brCache?.data || [];
      let gl = glCache?.data || [];
      if(stale(brCache)){ br = await fetchRegion("BR"); await supabase.from("trending_cache").upsert({region:"BR",data:br,fetched_at:now.toISOString()},{onConflict:"region"}); }
      if(stale(glCache)){ gl = await fetchRegion("US"); await supabase.from("trending_cache").upsert({region:"US",data:gl,fetched_at:now.toISOString()},{onConflict:"region"}); }
      setTrending({br, global:gl});
    } catch(e){ console.log("Trending error",e); }
  },[]);

  useEffect(()=>{ if(user) loadTrending(); },[user,loadTrending]);

  // ── TIMER ──
  useEffect(()=>{
    if(timerRunning){
      timerRef.current = setInterval(()=>{
        setTimerSeconds(s=>{
          if(s<=1){
            clearInterval(timerRef.current);
            setTimerRunning(false);
            handleTimerEnd();
            return timerMode==="work" ? 5*60 : 25*60;
          }
          return s-1;
        });
      },1000);
    } else { clearInterval(timerRef.current); }
    return ()=>clearInterval(timerRef.current);
  },[timerRunning]);

  const handleTimerEnd = async () => {
    if(timerMode==="work"){
      triggerConfetti();
      const newStats = {...userStats, xp:(userStats.xp||0)+25, pomodoros_completed:(userStats.pomodoros_completed||0)+1};
      setUserStats(newStats);
      if(userStats.id) await supabase.from("user_stats").update(newStats).eq("id",userStats.id);
      setTimerMode("break");
    } else {
      setTimerMode("work");
      setTimerSeconds(25*60);
    }
  };

  const startTimer = async (taskId) => {
    if(activeEntry) await stopTimeEntry();
    setFocusTaskId(taskId);
    setTimerRunning(true);
    setTimerSeconds(25*60);
    setTimerMode("work");
    const task = tasks.find(t=>t.id===taskId);
    if(!task) return;
    const {data} = await supabase.from("time_entries").insert({task_id:taskId,client_id:task.client_id,started_at:new Date().toISOString()}).select().single();
    if(data) setActiveEntry(data);
  };

  const stopTimeEntry = async () => {
    if(!activeEntry) return;
    const now = new Date();
    const mins = Math.round((now - new Date(activeEntry.started_at))/60000);
    await supabase.from("time_entries").update({ended_at:now.toISOString(),duration_minutes:mins}).eq("id",activeEntry.id);
    setActiveEntry(null);
    setTimerRunning(false);
  };

  const completeTask = async (taskId) => {
    await stopTimeEntry();
    const {data} = await supabase.from("tasks").update({done:true,done_at:new Date().toISOString()}).eq("id",taskId).select().single();
    if(data){
      setTasks(prev=>prev.map(t=>t.id===taskId?data:t));
      triggerConfetti();
      const newStats = {...userStats, xp:(userStats.xp||0)+50, tasks_completed:(userStats.tasks_completed||0)+1};
      setUserStats(newStats);
      if(userStats.id) await supabase.from("user_stats").update(newStats).eq("id",userStats.id);
      setFocusTaskId(null);
      flash();
    }
  };

  // ── QUICK CAPTURE ──
  const saveQuickCapture = async () => {
    if(!quickText.trim()) return;
    if(quickDest==="idea"){
      const {data} = await supabase.from("ideas").insert({title:quickText.trim(),source:"quick"}).select().single();
      if(data) setIdeas(prev=>[data,...prev]);
    } else {
      const {data} = await supabase.from("tasks").insert({title:quickText.trim(),urgency:"normal",estimated_hours:1}).select().single();
      if(data) setTasks(prev=>[data,...prev]);
    }
    setQuickText(""); setQuickCapture(false); flash();
  };

  // ── CLIENTS CRUD ──
  const saveClient = async () => {
    if(!clientEdit?.name?.trim()) return;
    let data;
    if(clientEdit.id){
      const res = await supabase.from("clients").update(clientEdit).eq("id",clientEdit.id).select().single();
      data = res.data;
      if(data) setClients(prev=>prev.map(c=>c.id===data.id?data:c));
    } else {
      const res = await supabase.from("clients").insert({...clientEdit,active:true}).select().single();
      data = res.data;
      if(data) setClients(prev=>[...prev,data]);
    }
    setClientModal(false); setClientEdit(null); flash();
  };

  const deleteClient = async (id) => {
    if(!confirm("Excluir cliente? Todas as tarefas e vídeos serão removidos.")) return;
    await supabase.from("clients").update({active:false}).eq("id",id);
    setClients(prev=>prev.filter(c=>c.id!==id));
  };

  // ── TASKS CRUD ──
  const saveTask = async () => {
    if(!taskEdit?.title?.trim()) return;
    let data;
    if(taskEdit.id){
      const res = await supabase.from("tasks").update(taskEdit).eq("id",taskEdit.id).select().single();
      data = res.data;
      if(data) setTasks(prev=>prev.map(t=>t.id===data.id?data:t));
    } else {
      const res = await supabase.from("tasks").insert(taskEdit).select().single();
      data = res.data;
      if(data) setTasks(prev=>[data,...prev]);
    }
    setTaskModal(false); setTaskEdit(null); flash();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id",id);
    setTasks(prev=>prev.filter(t=>t.id!==id));
  };

  // ── VIDEOS CRUD ──
  const saveVideo = async () => {
    if(!videoEdit?.title?.trim()) return;
    let data;
    if(videoEdit.id){
      const res = await supabase.from("videos").update(videoEdit).eq("id",videoEdit.id).select().single();
      data = res.data;
      if(data) setVideos(prev=>prev.map(v=>v.id===data.id?data:v));
    } else {
      const darkClient = clients.find(c=>c.name==="Canais Dark");
      const res = await supabase.from("videos").insert({...videoEdit,client_id:darkClient?.id}).select().single();
      data = res.data;
      if(data) setVideos(prev=>[data,...prev]);
    }
    setVideoModal(false); setVideoEdit(null); flash();
  };

  const deleteVideo = async (id) => {
    if(!confirm("Excluir vídeo?")) return;
    await supabase.from("videos").delete().eq("id",id);
    setVideos(prev=>prev.filter(v=>v.id!==id));
  };

  const moveVideo = async (videoId, newStatus) => {
    const {data} = await supabase.from("videos").update({status:newStatus}).eq("id",videoId).select().single();
    if(data) setVideos(prev=>prev.map(v=>v.id===data.id?data:v));
  };

  // ── SCRIPT ──
  const openScript = (video) => {
    setScriptData({...video});
    const takes = video.script ? JSON.parse(video.script||"[]") : [];
    setScriptTakes(takes.length ? takes : [{id:Date.now(),section:"GANCHO",startTime:"00:00",endTime:"00:07",angle:"A",narration:"",visual:"",prompt:""}]);
    setScriptModal(true);
  };

  const addTake = () => {
    const last = scriptTakes[scriptTakes.length-1];
    setScriptTakes(prev=>[...prev,{id:Date.now(),section:last?.section||"GANCHO",startTime:last?.endTime||"00:00",endTime:"",angle:"A",narration:"",visual:"",prompt:""}]);
  };

  const updateTake = (id, field, value) => setScriptTakes(prev=>prev.map(t=>t.id===id?{...t,[field]:value}:t));
  const deleteTake = (id) => setScriptTakes(prev=>prev.filter(t=>t.id!==id));

  const saveScript = async () => {
    if(!scriptData) return;
    const {data} = await supabase.from("videos").update({script:JSON.stringify(scriptTakes)}).eq("id",scriptData.id).select().single();
    if(data){ setVideos(prev=>prev.map(v=>v.id===data.id?data:v)); flash(); }
  };

  // ── INVOICES CRUD ──
  const saveInvoice = async () => {
    if(!invoiceEdit?.amount||!invoiceEdit?.client_id) return;
    let data;
    if(invoiceEdit.id){
      const res = await supabase.from("invoices").update(invoiceEdit).eq("id",invoiceEdit.id).select().single();
      data = res.data;
      if(data) setInvoices(prev=>prev.map(i=>i.id===data.id?data:i));
    } else {
      const res = await supabase.from("invoices").insert(invoiceEdit).select().single();
      data = res.data;
      if(data) setInvoices(prev=>[...prev,data]);
    }
    setInvoiceModal(false); setInvoiceEdit(null); flash();
  };

  const deleteInvoice = async (id) => {
    await supabase.from("invoices").delete().eq("id",id);
    setInvoices(prev=>prev.filter(i=>i.id!==id));
  };

  const markInvoicePaid = async (id) => {
    const {data} = await supabase.from("invoices").update({status:"pago",paid_date:today()}).eq("id",id).select().single();
    if(data) setInvoices(prev=>prev.map(i=>i.id===data.id?data:i));
    flash();
  };

  // ── LIBRARY CRUD ──
  const saveLib = async () => {
    if(!libEdit?.content?.trim()) return;
    let data;
    if(libEdit.id){
      const res = await supabase.from("library").update(libEdit).eq("id",libEdit.id).select().single();
      data = res.data;
      if(data) setLibrary(prev=>prev.map(l=>l.id===data.id?data:l));
    } else {
      const res = await supabase.from("library").insert(libEdit).select().single();
      data = res.data;
      if(data) setLibrary(prev=>[data,...prev]);
    }
    setLibModal(false); setLibEdit(null); flash();
  };

  const deleteLib = async (id) => {
    await supabase.from("library").delete().eq("id",id);
    setLibrary(prev=>prev.filter(l=>l.id!==id));
  };

  // ── GOALS ──
  const saveGoal = async () => {
    if(!goalEdit) return;
    let data;
    if(goalEdit.id){
      const res = await supabase.from("goals").update(goalEdit).eq("id",goalEdit.id).select().single();
      data = res.data;
      if(data) setGoals(prev=>prev.map(g=>g.id===data.id?data:g));
    } else {
      const res = await supabase.from("goals").insert(goalEdit).select().single();
      data = res.data;
      if(data) setGoals(prev=>[...prev,data]);
    }
    setGoalModal(false); setGoalEdit(null); flash();
  };

  // ── IDEAS ──
  const saveIdea = async (title, niche="") => {
    const {data} = await supabase.from("ideas").insert({title,niche,source:"manual"}).select().single();
    if(data) setIdeas(prev=>[data,...prev]);
    flash();
  };

  const markIdeaUsed = async (id) => {
    const {data} = await supabase.from("ideas").update({used:true}).eq("id",id).select().single();
    if(data) setIdeas(prev=>prev.map(i=>i.id===data.id?data:i));
  };

  const deleteIdea = async (id) => {
    await supabase.from("ideas").delete().eq("id",id);
    setIdeas(prev=>prev.filter(i=>i.id!==id));
  };

  // ── COMPUTED ──
  const todayTasks = tasks.filter(t=>!t.done && (deadlineDiff(t.deadline)<=0 || t.day_of_week===new Date().getDay())).sort((a,b)=>taskScore(b)-taskScore(a));
  const urgentTasks = tasks.filter(t=>!t.done && t.urgency==="hot").sort((a,b)=>deadlineDiff(a.deadline)-deadlineDiff(b.deadline));
  const thisMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
  const monthInvoices = invoices.filter(i=>i.issued_date?.startsWith(thisMonthKey));
  const totalEmitido  = monthInvoices.reduce((s,i)=>s+(i.amount||0),0);
  const totalRecebido = monthInvoices.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0);
  const totalPendente = monthInvoices.filter(i=>i.status==="pendente").reduce((s,i)=>s+(i.amount||0),0);
  const totalVencido  = monthInvoices.filter(i=>i.status==="vencido"||( i.status==="pendente" && deadlineDiff(i.due_date)<0)).reduce((s,i)=>s+(i.amount||0),0);

  const getClientColor = (clientId) => { const c = clients.find(c=>c.id===clientId); return c?.color || CLIENT_COLORS[c?.name] || GOLD; };
  const getClientName  = (clientId) => clients.find(c=>c.id===clientId)?.name || "—";
  const currentGoals   = goals.filter(g=>g.month===thisMonthKey);

  const timerFmt = (s) => { const m=Math.floor(s/60), sec=s%60; return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`; };

  const getWeekDates = (offset=0) => {
    const days = ["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];
    const now = new Date(); const dow = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate()-(dow===0?6:dow-1)+offset*7); mon.setHours(0,0,0,0);
    return Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return {date:toLocalDate(d),label:days[i],dayNum:d.getDate()}; });
  };

  // ─── LOGIN SCREEN ──────────────────────────────────────────
  if(checkingAuth) return <div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:GOLD,...S.syne,fontSize:20,letterSpacing:4}}>CARREGANDO...</div></div>;

  if(!user) return (
    <div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{...S.card,width:"100%",maxWidth:400,border:`0.5px solid ${BOR2}`}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{...S.syne,fontSize:28,letterSpacing:4,color:TEXT}}>BERNARDO OS</div>
          <div style={{...S.mono,color:MUTED,marginTop:4,letterSpacing:2}}>PRODUCTION · FOCUS · FINANCE</div>
        </div>
        <div style={{marginBottom:14}}>
          <span style={S.lbl}>Email</span>
          <input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type="email" placeholder="seu@email.com" style={S.inp} />
        </div>
        <div style={{marginBottom:24}}>
          <span style={S.lbl}>Senha</span>
          <input value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type="password" placeholder="••••••••" style={S.inp} />
        </div>
        {loginError && <div style={{color:RED,fontSize:12,marginBottom:12,fontFamily:"'Instrument Sans'"}}>{loginError}</div>}
        <button onClick={login} disabled={loginLoading} style={{...S.cta,width:"100%",opacity:loginLoading?.7:1}}>{loginLoading?"ENTRANDO...":"ENTRAR"}</button>
      </div>
    </div>
  );

  // ─── RENDER TABS ──────────────────────────────────────────
  return (
    <div style={{background:BG,minHeight:"100vh",color:TEXT}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${SURF2};border-radius:2px}
        input,textarea,select{transition:border-color .15s}
        input:focus,textarea:focus,select:focus{border-color:${GOLD}!important;outline:none}
        .hover-row:hover{background:${SURF2}!important}
        .hover-card:hover{border-color:${BOR2}!important;transform:translateY(-1px)}
        .hover-btn:hover{background:${SURF}!important}
        .drag-over{border-color:${GOLD}!important;background:${GOLD}11!important}
        textarea{resize:vertical}
        .mono-green{font-family:'IBM Plex Mono';font-size:11px;color:#4ADE80}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{background:BG2,borderBottom:`0.5px solid ${BOR}`,padding:"0 24px",display:"flex",alignItems:"center",height:54,position:"sticky",top:0,zIndex:50,gap:16}}>
        <div style={{...S.syne,fontSize:16,letterSpacing:3,color:GOLD}}>B·OS</div>
        <div style={{flex:1}}/>
        {saved && <Tag color={GREEN}>✓ Salvo</Tag>}
        {errorMsg && <Tag color={RED}>⚠ {errorMsg}</Tag>}
        {timerRunning && (
          <div style={{display:"flex",alignItems:"center",gap:8,background:timerMode==="work"?`${GOLD}15`:`${GREEN}15`,border:`0.5px solid ${timerMode==="work"?GOLD:GREEN}44`,borderRadius:8,padding:"4px 12px"}}>
            <span style={{...S.mono,fontSize:14,color:timerMode==="work"?GOLD:GREEN,fontWeight:600}}>{timerFmt(timerSeconds)}</span>
            <button onClick={()=>setTimerRunning(false)} style={{...S.btn,padding:"2px 6px",fontSize:10}}>⏸</button>
          </div>
        )}
        <div style={{...S.mono,color:MUTED,fontSize:10}}>{user.email}</div>
        <button onClick={logout} style={{...S.btn,fontSize:11}}>Sair</button>
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",gap:2,padding:"0 24px",background:BG2,borderBottom:`0.5px solid ${BOR}`,overflowX:"auto"}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setActiveTab(i)} style={{
            background:activeTab===i?`${GOLD}15`:"transparent",
            color:activeTab===i?GOLD:MUTED,
            border:"none",
            borderBottom:activeTab===i?`2px solid ${GOLD}`:"2px solid transparent",
            padding:"14px 18px",
            cursor:"pointer",
            fontFamily:"'Instrument Sans'",
            fontSize:12,
            fontWeight:activeTab===i?600:400,
            whiteSpace:"nowrap",
            transition:"all .15s",
          }}>
            {TAB_ICONS[i]} {t}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:1400,margin:"0 auto",padding:"28px 24px",minHeight:"calc(100vh - 110px)"}}>

        {/* ════════════════ TAB 0: DASHBOARD ════════════════ */}
        {activeTab===0 && <DashboardTab
          clients={clients} tasks={tasks} videos={videos} invoices={invoices}
          goals={goals} trending={trending} ideas={ideas} userStats={userStats}
          todayTasks={todayTasks} urgentTasks={urgentTasks}
          totalEmitido={totalEmitido} totalRecebido={totalRecebido} totalPendente={totalPendente} totalVencido={totalVencido}
          thisMonthKey={thisMonthKey} currentGoals={currentGoals}
          getClientColor={getClientColor} getClientName={getClientName}
          onSwitchTab={setActiveTab} onStartTask={startTimer} onCompleteTask={completeTask}
          onSaveIdea={saveIdea} onMarkIdeaUsed={markIdeaUsed}
          onOpenGoal={()=>{setGoalEdit({month:thisMonthKey,videos_target:0,revenue_target:0,hours_target:0});setGoalModal(true);}}
          timerRunning={timerRunning} focusTaskId={focusTaskId}
        />}

        {/* ════════════════ TAB 1: FOCUS OS ════════════════ */}
        {activeTab===1 && <FocusTab
          tasks={tasks} clients={clients}
          getClientColor={getClientColor} getClientName={getClientName}
          focusTaskId={focusTaskId} timerRunning={timerRunning} timerSeconds={timerSeconds} timerMode={timerMode}
          timerFmt={timerFmt} userStats={userStats}
          onStartTask={startTimer} onStopTimer={()=>{setTimerRunning(false);stopTimeEntry();}}
          onCompleteTask={completeTask} onSkip={()=>setFocusTaskId(null)}
          onAddTask={()=>{setTaskEdit({title:"",urgency:"hot",estimated_hours:1,deadline:today()});setTaskModal(true);}}
          todayTasks={todayTasks}
        />}

        {/* ════════════════ TAB 2: AGENDA ════════════════ */}
        {activeTab===2 && <AgendaTab
          tasks={tasks} posts={posts} clients={clients}
          getClientColor={getClientColor} getClientName={getClientName}
          weekOffset={weekOffset} setWeekOffset={setWeekOffset}
          getWeekDates={getWeekDates}
          onAddTask={()=>{setTaskEdit({title:"",urgency:"normal",estimated_hours:1});setTaskModal(true);}}
        />}

        {/* ════════════════ TAB 3: CANAIS DARK ════════════════ */}
        {activeTab===3 && <DarkTab
          videos={videos} ideas={ideas} clients={clients}
          nicheFilter={nicheFilter} setNicheFilter={setNicheFilter}
          dragOver={dragOver} setDragOver={setDragOver}
          onAddVideo={()=>{setVideoEdit({title:"",niche:"Curiosidades Gerais",status:"ideia",hook:"",notes:""});setVideoModal(true);}}
          onEditVideo={(v)=>{setVideoEdit({...v});setVideoModal(true);}}
          onDeleteVideo={deleteVideo}
          onMoveVideo={moveVideo}
          onOpenScript={openScript}
          onAddIdea={saveIdea}
          onMarkIdeaUsed={markIdeaUsed}
          onDeleteIdea={deleteIdea}
          onApproval={(v)=>setApprovalModal(v)}
        />}

        {/* ════════════════ TAB 4: CLIENTES ════════════════ */}
        {activeTab===4 && <ClientsTab
          clients={clients} tasks={tasks} videos={videos} invoices={invoices}
          selectedClient={selectedClient} setSelectedClient={setSelectedClient}
          getClientColor={getClientColor}
          onAddClient={()=>{setClientEdit({name:"",color:GOLD,type:"YouTube",frequency:"",rate_per_hour:0,notes:""});setClientModal(true);}}
          onEditClient={(c)=>{setClientEdit({...c});setClientModal(true);}}
          onDeleteClient={deleteClient}
          onAddTask={(clientId)=>{setTaskEdit({title:"",client_id:clientId,urgency:"normal",estimated_hours:1,deadline:today()});setTaskModal(true);}}
          onEditTask={(t)=>{setTaskEdit({...t});setTaskModal(true);}}
          onDeleteTask={deleteTask}
          onCompleteTask={completeTask}
        />}

        {/* ════════════════ TAB 5: FINANÇAS ════════════════ */}
        {activeTab===5 && <FinanceTab
          invoices={invoices} clients={clients}
          invoiceFilter={invoiceFilter} setInvoiceFilter={setInvoiceFilter}
          invoiceClient={invoiceClient} setInvoiceClient={setInvoiceClient}
          totalEmitido={totalEmitido} totalRecebido={totalRecebido} totalPendente={totalPendente} totalVencido={totalVencido}
          getClientColor={getClientColor} getClientName={getClientName}
          onAdd={()=>{setInvoiceEdit({client_id:"",description:"",amount:0,status:"pendente",issued_date:today(),due_date:today(),notes:""});setInvoiceModal(true);}}
          onEdit={(i)=>{setInvoiceEdit({...i});setInvoiceModal(true);}}
          onDelete={deleteInvoice}
          onMarkPaid={markInvoicePaid}
        />}

        {/* ════════════════ TAB 6: BIBLIOTECA ════════════════ */}
        {activeTab===6 && <LibraryTab
          library={library} clients={clients}
          libFilter={libFilter} setLibFilter={setLibFilter}
          libSearch={libSearch} setLibSearch={setLibSearch}
          getClientColor={getClientColor} getClientName={getClientName}
          onAdd={()=>{setLibEdit({type:"hook",content:"",niche:"",score:0});setLibModal(true);}}
          onEdit={(l)=>{setLibEdit({...l});setLibModal(true);}}
          onDelete={deleteLib}
        />}
      </div>

      {/* ── QUICK CAPTURE BUTTON ── */}
      <button onClick={()=>setQuickCapture(true)} style={{
        position:"fixed",bottom:28,right:28,
        width:52,height:52,borderRadius:"50%",
        background:GOLD,color:BG,
        border:"none",cursor:"pointer",
        fontSize:22,fontWeight:700,
        boxShadow:"0 4px 20px rgba(251,191,36,.4)",
        zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",
        transition:"transform .15s",
      }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        +
      </button>

      {/* ── QUICK CAPTURE MODAL ── */}
      {quickCapture && (
        <Modal onClose={()=>setQuickCapture(false)} title="Captura Rápida" maxWidth={420}>
          <textarea value={quickText} onChange={e=>setQuickText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&saveQuickCapture()} placeholder="Ideia, tarefa, pensamento..." style={{...S.inp,minHeight:80,marginBottom:14}} autoFocus />
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[["idea","💡 Banco de Ideias"],["task","✓ Tarefa"]].map(([v,l])=>(
              <button key={v} onClick={()=>setQuickDest(v)} style={{...S.btn,flex:1,background:quickDest===v?`${GOLD}20`:undefined,borderColor:quickDest===v?GOLD:undefined,color:quickDest===v?GOLD:TEXT}}>{l}</button>
            ))}
          </div>
          <button onClick={saveQuickCapture} style={{...S.cta,width:"100%"}}>Salvar → Enter</button>
        </Modal>
      )}

      {/* ── TASK MODAL ── */}
      {taskModal && taskEdit && (
        <Modal onClose={()=>{setTaskModal(false);setTaskEdit(null);}} title={taskEdit.id?"Editar Tarefa":"Nova Tarefa"}>
          <FormRow label="Título"><input value={taskEdit.title||""} onChange={e=>setTaskEdit({...taskEdit,title:e.target.value})} style={S.inp} /></FormRow>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormRow label="Cliente">
              <select value={taskEdit.client_id||""} onChange={e=>setTaskEdit({...taskEdit,client_id:e.target.value})} style={S.inp}>
                <option value="">Sem cliente</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormRow>
            <FormRow label="Tipo">
              <select value={taskEdit.type||"Roteiro"} onChange={e=>setTaskEdit({...taskEdit,type:e.target.value})} style={S.inp}>
                {TASK_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </FormRow>
            <FormRow label="Urgência">
              <select value={taskEdit.urgency||"normal"} onChange={e=>setTaskEdit({...taskEdit,urgency:e.target.value})} style={S.inp}>
                <option value="normal">Normal</option>
                <option value="warn">Atenção</option>
                <option value="hot">Urgente 🔥</option>
              </select>
            </FormRow>
            <FormRow label="Horas estimadas">
              <input type="number" value={taskEdit.estimated_hours||1} step="0.5" min="0.5" onChange={e=>setTaskEdit({...taskEdit,estimated_hours:parseFloat(e.target.value)||1})} style={S.inp} />
            </FormRow>
            <FormRow label="Deadline">
              <input type="date" value={taskEdit.deadline||""} onChange={e=>setTaskEdit({...taskEdit,deadline:e.target.value})} style={S.inp} />
            </FormRow>
            <FormRow label="Dia da semana">
              <select value={taskEdit.day_of_week??""} onChange={e=>setTaskEdit({...taskEdit,day_of_week:e.target.value===""?null:parseInt(e.target.value)})} style={S.inp}>
                <option value="">Qualquer dia</option>
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d,i)=><option key={i} value={i}>{d}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Notas"><textarea value={taskEdit.notes||""} onChange={e=>setTaskEdit({...taskEdit,notes:e.target.value})} style={{...S.inp,minHeight:60}} /></FormRow>
          <ModalActions onCancel={()=>{setTaskModal(false);setTaskEdit(null);}} onSave={saveTask} />
        </Modal>
      )}

      {/* ── CLIENT MODAL ── */}
      {clientModal && clientEdit && (
        <Modal onClose={()=>{setClientModal(false);setClientEdit(null);}} title={clientEdit.id?"Editar Cliente":"Novo Cliente"}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormRow label="Nome"><input value={clientEdit.name||""} onChange={e=>setClientEdit({...clientEdit,name:e.target.value})} style={S.inp} /></FormRow>
            <FormRow label="Cor">
              <input type="color" value={clientEdit.color||GOLD} onChange={e=>setClientEdit({...clientEdit,color:e.target.value})} style={{...S.inp,padding:4,height:40}} />
            </FormRow>
            <FormRow label="Tipo"><input value={clientEdit.type||""} onChange={e=>setClientEdit({...clientEdit,type:e.target.value})} placeholder="YouTube, Podcast..." style={S.inp} /></FormRow>
            <FormRow label="Cadência"><input value={clientEdit.frequency||""} onChange={e=>setClientEdit({...clientEdit,frequency:e.target.value})} placeholder="3x semana" style={S.inp} /></FormRow>
            <FormRow label="Valor/hora (R$)"><input type="number" value={clientEdit.rate_per_hour||0} onChange={e=>setClientEdit({...clientEdit,rate_per_hour:parseFloat(e.target.value)||0})} style={S.inp} /></FormRow>
          </div>
          <FormRow label="Notas"><textarea value={clientEdit.notes||""} onChange={e=>setClientEdit({...clientEdit,notes:e.target.value})} style={{...S.inp,minHeight:60}} /></FormRow>
          <ModalActions onCancel={()=>{setClientModal(false);setClientEdit(null);}} onSave={saveClient} />
        </Modal>
      )}

      {/* ── VIDEO MODAL ── */}
      {videoModal && videoEdit && (
        <Modal onClose={()=>{setVideoModal(false);setVideoEdit(null);}} title={videoEdit.id?"Editar Vídeo":"Novo Vídeo"}>
          <FormRow label="Título"><input value={videoEdit.title||""} onChange={e=>setVideoEdit({...videoEdit,title:e.target.value})} style={S.inp} /></FormRow>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormRow label="Nicho">
              <select value={videoEdit.niche||"Curiosidades Gerais"} onChange={e=>setVideoEdit({...videoEdit,niche:e.target.value})} style={S.inp}>
                {NICHES.map(n=><option key={n}>{n}</option>)}
              </select>
            </FormRow>
            <FormRow label="Status">
              <select value={videoEdit.status||"ideia"} onChange={e=>setVideoEdit({...videoEdit,status:e.target.value})} style={S.inp}>
                {VIDEO_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </FormRow>
            <FormRow label="Data publicação"><input type="date" value={videoEdit.publish_date||""} onChange={e=>setVideoEdit({...videoEdit,publish_date:e.target.value})} style={S.inp} /></FormRow>
          </div>
          <FormRow label="Hook (frase de abertura)"><input value={videoEdit.hook||""} onChange={e=>setVideoEdit({...videoEdit,hook:e.target.value})} placeholder="Em 1999, Joan Murray saltou de um avião..." style={S.inp} /></FormRow>
          <FormRow label="Notas"><textarea value={videoEdit.notes||""} onChange={e=>setVideoEdit({...videoEdit,notes:e.target.value})} style={{...S.inp,minHeight:60}} /></FormRow>
          <ModalActions onCancel={()=>{setVideoModal(false);setVideoEdit(null);}} onSave={saveVideo} />
        </Modal>
      )}

      {/* ── INVOICE MODAL ── */}
      {invoiceModal && invoiceEdit && (
        <Modal onClose={()=>{setInvoiceModal(false);setInvoiceEdit(null);}} title={invoiceEdit.id?"Editar NF":"Nova Nota Fiscal"}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormRow label="Cliente">
              <select value={invoiceEdit.client_id||""} onChange={e=>setInvoiceEdit({...invoiceEdit,client_id:e.target.value})} style={S.inp}>
                <option value="">Selecionar...</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormRow>
            <FormRow label="Número NF"><input value={invoiceEdit.number||""} onChange={e=>setInvoiceEdit({...invoiceEdit,number:e.target.value})} placeholder="NF-001" style={S.inp} /></FormRow>
            <FormRow label="Valor (R$)"><input type="number" value={invoiceEdit.amount||0} step="0.01" onChange={e=>setInvoiceEdit({...invoiceEdit,amount:parseFloat(e.target.value)||0})} style={S.inp} /></FormRow>
            <FormRow label="Status">
              <select value={invoiceEdit.status||"pendente"} onChange={e=>setInvoiceEdit({...invoiceEdit,status:e.target.value})} style={S.inp}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </FormRow>
            <FormRow label="Data emissão"><input type="date" value={invoiceEdit.issued_date||""} onChange={e=>setInvoiceEdit({...invoiceEdit,issued_date:e.target.value})} style={S.inp} /></FormRow>
            <FormRow label="Data vencimento"><input type="date" value={invoiceEdit.due_date||""} onChange={e=>setInvoiceEdit({...invoiceEdit,due_date:e.target.value})} style={S.inp} /></FormRow>
          </div>
          <FormRow label="Descrição"><input value={invoiceEdit.description||""} onChange={e=>setInvoiceEdit({...invoiceEdit,description:e.target.value})} placeholder="Produção de conteúdo - Abril 2026" style={S.inp} /></FormRow>
          <FormRow label="Notas"><textarea value={invoiceEdit.notes||""} onChange={e=>setInvoiceEdit({...invoiceEdit,notes:e.target.value})} style={{...S.inp,minHeight:60}} /></FormRow>
          <ModalActions onCancel={()=>{setInvoiceModal(false);setInvoiceEdit(null);}} onSave={saveInvoice} />
        </Modal>
      )}

      {/* ── LIBRARY MODAL ── */}
      {libModal && libEdit && (
        <Modal onClose={()=>{setLibModal(false);setLibEdit(null);}} title={libEdit.id?"Editar Item":"Novo Item da Biblioteca"}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FormRow label="Tipo">
              <select value={libEdit.type||"hook"} onChange={e=>setLibEdit({...libEdit,type:e.target.value})} style={S.inp}>
                {["hook","titulo","cta","thumbnail","template"].map(t=><option key={t}>{t}</option>)}
              </select>
            </FormRow>
            <FormRow label="Nicho">
              <select value={libEdit.niche||""} onChange={e=>setLibEdit({...libEdit,niche:e.target.value})} style={S.inp}>
                <option value="">Geral</option>
                {NICHES.map(n=><option key={n}>{n}</option>)}
              </select>
            </FormRow>
            <FormRow label="Cliente">
              <select value={libEdit.client_id||""} onChange={e=>setLibEdit({...libEdit,client_id:e.target.value||null})} style={S.inp}>
                <option value="">Todos</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormRow>
            <FormRow label="Views / Score">
              <input type="number" value={libEdit.views||0} onChange={e=>setLibEdit({...libEdit,views:parseInt(e.target.value)||0})} placeholder="Views" style={S.inp} />
            </FormRow>
          </div>
          <FormRow label="Conteúdo"><textarea value={libEdit.content||""} onChange={e=>setLibEdit({...libEdit,content:e.target.value})} style={{...S.inp,minHeight:100}} placeholder="Hook, título, CTA ou descrição da thumbnail..." /></FormRow>
          <ModalActions onCancel={()=>{setLibModal(false);setLibEdit(null);}} onSave={saveLib} />
        </Modal>
      )}

      {/* ── GOAL MODAL ── */}
      {goalModal && goalEdit && (
        <Modal onClose={()=>{setGoalModal(false);setGoalEdit(null);}} title="Meta Mensal" maxWidth={400}>
          <FormRow label="Mês (AAAA-MM)"><input value={goalEdit.month||""} onChange={e=>setGoalEdit({...goalEdit,month:e.target.value})} placeholder="2026-04" style={S.inp} /></FormRow>
          <FormRow label="Cliente">
            <select value={goalEdit.client_id||""} onChange={e=>setGoalEdit({...goalEdit,client_id:e.target.value||null})} style={S.inp}>
              <option value="">Geral</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormRow>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <FormRow label="Vídeos"><input type="number" value={goalEdit.videos_target||0} onChange={e=>setGoalEdit({...goalEdit,videos_target:parseInt(e.target.value)||0})} style={S.inp} /></FormRow>
            <FormRow label="Receita (R$)"><input type="number" value={goalEdit.revenue_target||0} onChange={e=>setGoalEdit({...goalEdit,revenue_target:parseFloat(e.target.value)||0})} style={S.inp} /></FormRow>
            <FormRow label="Horas"><input type="number" value={goalEdit.hours_target||0} onChange={e=>setGoalEdit({...goalEdit,hours_target:parseFloat(e.target.value)||0})} style={S.inp} /></FormRow>
          </div>
          <ModalActions onCancel={()=>{setGoalModal(false);setGoalEdit(null);}} onSave={saveGoal} />
        </Modal>
      )}

      {/* ── SCRIPT MODAL ── */}
      {scriptModal && scriptData && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:200,overflowY:"auto"}}>
          <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
            {/* Header */}
            <div style={{marginBottom:28}}>
              <div style={{...S.mono,color:MUTED,letterSpacing:2,marginBottom:8}}>ROTEIRO COMPLETO — FACELESS VIDEO</div>
              <div style={{...S.syne,fontSize:40,letterSpacing:-1,lineHeight:1}}>
                {scriptData.title?.split(" ").map((w,i)=>(
                  <span key={i} style={{color:i===Math.floor(scriptData.title.split(" ").length/2)?GOLD:TEXT}}>{w} </span>
                ))}
              </div>
              <div style={{display:"flex",gap:12,marginTop:16,flexWrap:"wrap"}}>
                {["YouTube · 8–10 min","Reels · 60–75s","Faceless · Narração em off","Nano Banana 2 · Prompts incluídos"].map(t=>(
                  <div key={t} style={{border:`0.5px solid ${BOR2}`,borderRadius:6,padding:"5px 12px",...S.mono,fontSize:10,color:MUTED}}>{t}</div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:0,borderBottom:`0.5px solid ${BOR}`,marginBottom:28}}>
              {["youtube","reels"].map(t=>(
                <button key={t} onClick={()=>setScriptTab(t)} style={{background:"transparent",border:"none",borderBottom:scriptTab===t?`2px solid ${GOLD}`:"2px solid transparent",color:scriptTab===t?GOLD:MUTED,padding:"10px 20px",cursor:"pointer",fontFamily:"'Instrument Sans'",fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>
                  {t==="youtube"?"YOUTUBE":"REELS / SHORTS"}
                </button>
              ))}
              <div style={{flex:1}}/>
              <button onClick={saveScript} style={{...S.cta,marginBottom:6}}>💾 Salvar Roteiro</button>
              <button onClick={()=>setScriptModal(false)} style={{...S.btn,marginBottom:6,marginLeft:8}}>✕ Fechar</button>
            </div>

            {/* Camera angles legend */}
            <div style={{background:SURF,border:`0.5px solid ${BOR}`,borderRadius:10,padding:"14px 18px",marginBottom:28}}>
              <div style={{...S.mono,color:MUTED,letterSpacing:1,marginBottom:10,fontSize:10}}>ÂNGULOS DE CÂMERA</div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {CAMERA_ANGLES.map((a,i)=>(
                  <div key={a} style={{display:"flex",alignItems:"center",gap:6,...S.mono,fontSize:11,color:MUTED}}>
                    <span style={{width:18,height:18,border:`1.5px solid ${[GOLD,BLUE,RED,GREEN,PURP,GOLD][i]}`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:[GOLD,BLUE,RED,GREEN,PURP,GOLD][i],fontWeight:700}}>{a}</span>
                    {ANGLE_LABELS[a]}
                  </div>
                ))}
              </div>
            </div>

            {/* Takes grouped by section */}
            {SCRIPT_SECTIONS.map(section=>{
              const sectionTakes = scriptTakes.filter(t=>t.section===section);
              if(!sectionTakes.length && scriptTab==="youtube") return null;
              return (
                <div key={section} style={{marginBottom:40}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                    <div style={{...S.syne,fontSize:28,letterSpacing:-0.5,color:TEXT}}>{section}</div>
                    {sectionTakes.length>0 && (
                      <div style={{...S.mono,color:MUTED,fontSize:11}}>{sectionTakes[0]?.startTime} — {sectionTakes[sectionTakes.length-1]?.endTime}</div>
                    )}
                  </div>
                  <div style={{borderTop:`1px solid ${BOR}`,marginBottom:20}}/>
                  {sectionTakes.map((take,ti)=>(
                    <div key={take.id} style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:0,marginBottom:16,border:`0.5px solid ${BOR}`,borderRadius:10,overflow:"hidden"}}>
                      {/* Left column */}
                      <div style={{background:BG3,padding:"16px 12px",display:"flex",flexDirection:"column",gap:8,alignItems:"flex-start",borderRight:`0.5px solid ${BOR}`}}>
                        <div style={{...S.mono,color:MUTED,fontSize:10}}>T-{String(scriptTakes.indexOf(take)+1).padStart(2,"0")}</div>
                        <input value={take.startTime||""} onChange={e=>updateTake(take.id,"startTime",e.target.value)} style={{...S.inp,background:"transparent",border:"none",color:GOLD,...S.mono,fontSize:16,fontWeight:600,padding:0,width:"80px"}} placeholder="00:00"/>
                        <input value={take.endTime||""} onChange={e=>updateTake(take.id,"endTime",e.target.value)} style={{...S.inp,background:"transparent",border:"none",color:GOLD,...S.mono,fontSize:16,fontWeight:600,padding:0,width:"80px"}} placeholder="00:07"/>
                        <select value={take.angle||"A"} onChange={e=>updateTake(take.id,"angle",e.target.value)} style={{...S.inp,background:BG3,padding:"3px 6px",fontSize:10,...S.mono,width:70}}>
                          {CAMERA_ANGLES.map(a=><option key={a}>ANG-{a}</option>)}
                        </select>
                        <button onClick={()=>deleteTake(take.id)} style={{...S.btn,padding:"3px 8px",fontSize:10,color:RED,borderColor:`${RED}44`,marginTop:"auto"}}>✕</button>
                      </div>
                      {/* Right column */}
                      <div style={{background:SURF,padding:"16px 20px"}}>
                        <div style={{background:SECTION_COLORS[section]+"22",border:`0.5px solid ${SECTION_COLORS[section]}44`,borderRadius:4,padding:"3px 10px",display:"inline-block",...S.mono,fontSize:10,color:SECTION_COLORS[section],marginBottom:14,letterSpacing:1}}>{section}</div>
                        <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1,marginBottom:6}}>NARRAÇÃO</div>
                        <textarea value={take.narration||""} onChange={e=>updateTake(take.id,"narration",e.target.value)} placeholder="Em 1999, Joan Murray saltou de um avião..." style={{...S.inp,background:"transparent",border:"none",borderLeft:`2px solid ${BOR2}`,borderRadius:0,padding:"6px 0 6px 12px",fontStyle:"italic",fontSize:14,minHeight:60,lineHeight:1.7}} />
                        <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1,marginBottom:6,marginTop:14}}>VISUAL</div>
                        <textarea value={take.visual||""} onChange={e=>updateTake(take.id,"visual",e.target.value)} placeholder="Céu aberto, fisheye de baixo pra cima..." style={{...S.inp,background:"transparent",border:"none",borderLeft:`2px solid ${BOR2}`,borderRadius:0,padding:"6px 0 6px 12px",fontSize:13,minHeight:50,lineHeight:1.7}} />
                        <div style={{background:`${GREEN}10`,border:`0.5px solid ${GREEN}30`,borderRadius:8,padding:"12px 14px",marginTop:14}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:GREEN,display:"inline-block"}}/>
                            <span style={{...S.mono,fontSize:10,color:GREEN,letterSpacing:1}}>PROMPT NANO BANANA 2</span>
                          </div>
                          <textarea value={take.prompt||""} onChange={e=>updateTake(take.id,"prompt",e.target.value)} placeholder="Fisheye POV shot looking straight up at open blue sky, scattered cirrus clouds..." style={{...S.inp,background:"transparent",border:"none",color:GREEN,...S.mono,fontSize:12,minHeight:60,lineHeight:1.6,padding:0}} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>setScriptTakes(prev=>[...prev,{id:Date.now(),section,startTime:"",endTime:"",angle:"A",narration:"",visual:"",prompt:""}])} style={{...S.btn,fontSize:11,color:SECTION_COLORS[section],borderColor:`${SECTION_COLORS[section]}44`}}>+ Take em {section}</button>
                </div>
              );
            })}

            <div style={{display:"flex",gap:10,marginTop:20,paddingTop:20,borderTop:`0.5px solid ${BOR}`}}>
              <button onClick={addTake} style={{...S.btn}}>+ Novo Take</button>
              <button onClick={saveScript} style={{...S.cta}}>💾 Salvar Roteiro</button>
              <button onClick={()=>setScriptModal(false)} style={{...S.btn,marginLeft:"auto"}}>✕ Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── APPROVAL MODAL ── */}
      {approvalModal && (
        <Modal onClose={()=>setApprovalModal(null)} title="Link de Aprovação" maxWidth={500}>
          <div style={{...S.val,marginBottom:12}}>Compartilhe este link com o cliente para aprovar o roteiro:</div>
          <div style={{background:BG3,border:`0.5px solid ${BOR2}`,borderRadius:8,padding:"12px 14px",...S.mono,fontSize:12,color:GOLD,wordBreak:"break-all",marginBottom:16}}>
            {typeof window!=="undefined"?`${window.location.origin}/aprovacao/${approvalModal.approval_token}`:""}
          </div>
          <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/aprovacao/${approvalModal.approval_token}`);flash();}} style={{...S.cta,width:"100%"}}>📋 Copiar Link</button>
        </Modal>
      )}

      <Confetti show={confetti} />
    </div>
  );
}

// ─── REUSABLE COMPONENTS ─────────────────────────────────────
function Modal({children, onClose, title, maxWidth=600}){
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:BG2,border:`0.5px solid ${BOR2}`,borderRadius:14,width:"100%",maxWidth,maxHeight:"90vh",overflowY:"auto",padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:18,color:TEXT}}>{title}</div>
          <button onClick={onClose} style={{...S.btn,padding:"4px 10px"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormRow({label,children}){
  return (
    <div style={{marginBottom:14}}>
      <span style={S.lbl}>{label}</span>
      {children}
    </div>
  );
}

function ModalActions({onCancel, onSave, saveLabel="Salvar"}){
  return (
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
      <button onClick={onCancel} style={S.btn}>Cancelar</button>
      <button onClick={onSave} style={S.cta}>{saveLabel}</button>
    </div>
  );
}

// ─── DASHBOARD TAB ───────────────────────────────────────────
function DashboardTab({clients,tasks,videos,invoices,goals,trending,ideas,userStats,todayTasks,urgentTasks,totalEmitido,totalRecebido,totalPendente,totalVencido,thisMonthKey,currentGoals,getClientColor,getClientName,onSwitchTab,onStartTask,onCompleteTask,onSaveIdea,onMarkIdeaUsed,onOpenGoal,timerRunning,focusTaskId}){
  const [ideaInput, setIdeaInput] = useState("");
  const nextTask = todayTasks.find(t=>!t.done);
  const publishedThisMonth = videos.filter(v=>v.status==="publicado"&&v.publish_date?.startsWith(thisMonthKey)).length;
  const pendingTasks = tasks.filter(t=>!t.done).length;

  return (
    <div>
      {/* Greeting */}
      <div style={{marginBottom:28}}>
        <div style={{fontFamily:"'Syne'",fontWeight:800,fontSize:32,letterSpacing:-1,lineHeight:1.2}}>
          Bora, <span style={{color:GOLD}}>Bernardo</span>. 🎯
        </div>
        <div style={{color:MUTED,fontSize:13,marginTop:6,fontFamily:"'Instrument Sans'"}}>
          {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})} · {pendingTasks} tarefas pendentes
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:24}}>
        {[
          {label:"Emitido este mês", value:fmtCurrency(totalEmitido), color:GOLD, tab:5},
          {label:"Recebido",         value:fmtCurrency(totalRecebido), color:GREEN, tab:5},
          {label:"Pendente",         value:fmtCurrency(totalPendente), color:GOLD, tab:5},
          {label:"Vencido",          value:fmtCurrency(totalVencido),  color:RED,  tab:5},
        ].map(m=>(
          <div key={m.label} onClick={()=>onSwitchTab(m.tab)} style={{...S.card,cursor:"pointer",transition:"border-color .15s"}} className="hover-card">
            <span style={S.lbl}>{m.label}</span>
            <div style={{fontFamily:"'Syne'",fontSize:22,fontWeight:700,color:m.color}}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:20}}>
        <div>
          {/* FOCO AGORA */}
          {nextTask ? (
            <div style={{background:SURF,border:`0.5px solid ${BOR2}`,borderRadius:14,padding:24,marginBottom:20,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:nextTask.urgency==="hot"?RED:nextTask.urgency==="warn"?GOLD:GREEN}}/>
              <div style={{...S.mono,color:GOLD,fontSize:10,letterSpacing:1.5,marginBottom:8}}>⚡ FOCO AGORA</div>
              <div style={{fontFamily:"'Syne'",fontSize:22,fontWeight:700,marginBottom:6}}>{nextTask.title}</div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <Tag color={getClientColor(nextTask.client_id)}>{getClientName(nextTask.client_id)}</Tag>
                {nextTask.deadline && <Tag color={deadlineColor(nextTask.deadline)}>{deadlineLabel(nextTask.deadline)}</Tag>}
                <Tag color={MUTED}>{nextTask.estimated_hours}h est.</Tag>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>onStartTask(nextTask.id)} style={{...S.cta,opacity:timerRunning&&focusTaskId===nextTask.id?.5:1}}>
                  {timerRunning&&focusTaskId===nextTask.id?"⏸ Pausar":"▶ Iniciar pomodoro"}
                </button>
                <button onClick={()=>onCompleteTask(nextTask.id)} style={{...S.btn,color:GREEN,borderColor:`${GREEN}44`}}>✓ Concluir</button>
              </div>
            </div>
          ) : (
            <div style={{...S.card,marginBottom:20,textAlign:"center",padding:32}}>
              <div style={{fontSize:32,marginBottom:8}}>🎉</div>
              <div style={{fontFamily:"'Syne'",fontSize:18,fontWeight:700,color:GREEN}}>Tudo em dia!</div>
              <div style={{color:MUTED,fontSize:13,marginTop:4}}>Nenhuma tarefa urgente pendente.</div>
            </div>
          )}

          {/* Tarefas urgentes */}
          {urgentTasks.length>0 && (
            <div style={{...S.card,marginBottom:20}}>
              <div style={{...S.mono,color:RED,fontSize:10,letterSpacing:1,marginBottom:14}}>🔥 URGENTE</div>
              {urgentTasks.slice(0,5).map(t=>(
                <div key={t.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`0.5px solid ${BOR}`,cursor:"pointer"}} onClick={()=>onStartTask(t.id)}>
                  <StatusDot color={getClientColor(t.client_id)}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500}}>{t.title}</div>
                    <div style={{fontSize:11,color:MUTED,fontFamily:"'IBM Plex Mono'"}}>{getClientName(t.client_id)}</div>
                  </div>
                  <Tag color={deadlineColor(t.deadline)}>{deadlineLabel(t.deadline)}</Tag>
                </div>
              ))}
            </div>
          )}

          {/* Metas do mês */}
          <div style={{...S.card,marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1}}>🎯 METAS DO MÊS</div>
              <button onClick={onOpenGoal} style={{...S.btn,fontSize:10,padding:"4px 10px"}}>+ Meta</button>
            </div>
            {currentGoals.length===0 ? (
              <div style={{color:MUTED,fontSize:12,textAlign:"center",padding:16}}>Nenhuma meta definida. Adicione uma meta para o mês.</div>
            ) : currentGoals.map(g=>(
              <div key={g.id} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:500}}>{g.client_id?getClientName(g.client_id):"Geral"}</span>
                  <span style={{...S.mono,fontSize:10,color:MUTED}}>{g.videos_done||0}/{g.videos_target} vídeos</span>
                </div>
                <ProgressBar value={g.videos_done||0} max={g.videos_target||1} color={GOLD}/>
              </div>
            ))}
          </div>

          {/* Captura de ideias rápida */}
          <div style={{...S.card}}>
            <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1,marginBottom:12}}>💡 IDEIAS RÁPIDAS</div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input value={ideaInput} onChange={e=>setIdeaInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&ideaInput.trim()){onSaveIdea(ideaInput.trim());setIdeaInput("");}}} placeholder="Ideia para vídeo, pauta, tema..." style={{...S.inp,flex:1}} />
              <button onClick={()=>{if(ideaInput.trim()){onSaveIdea(ideaInput.trim());setIdeaInput("");}}} style={S.cta}>+</button>
            </div>
            {ideas.filter(i=>!i.used).slice(0,5).map(i=>(
              <div key={i.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",borderBottom:`0.5px solid ${BOR}`}}>
                <span style={{flex:1,fontSize:12}}>{i.title}</span>
                {i.niche && <Tag color={MUTED}>{i.niche}</Tag>}
                <button onClick={()=>onMarkIdeaUsed(i.id)} style={{...S.btn,padding:"2px 8px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>usar</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Trending */}
        <div>
          <div style={{...S.card}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1}}>🔥 TRENDING YOUTUBE</div>
              <Tag color={GOLD}>Atualiza 6h</Tag>
            </div>
            <div style={{...S.mono,color:MUTED,fontSize:9,letterSpacing:1,marginBottom:10}}>BRASIL</div>
            {trending.br.length===0 ? (
              <div style={{color:MUTED,fontSize:12,marginBottom:16}}>Configure a YouTube API Key nas variáveis de ambiente.</div>
            ) : trending.br.slice(0,5).map((v,i)=>(
              <div key={v.id} className="hover-row" style={{display:"flex",gap:10,padding:"8px 6px",borderBottom:`0.5px solid ${BOR}`,cursor:"pointer"}}>
                <span style={{...S.mono,color:HINT,fontSize:11,width:16}}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                  <div style={{fontSize:11,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div>
                </div>
                <button onClick={()=>onSaveIdea(v.title,"Trending BR")} style={{...S.btn,padding:"2px 6px",fontSize:9,flexShrink:0}}>+ideia</button>
              </div>
            ))}
            <div style={{...S.mono,color:MUTED,fontSize:9,letterSpacing:1,marginTop:16,marginBottom:10}}>MUNDIAL</div>
            {trending.global.slice(0,5).map((v,i)=>(
              <div key={v.id} className="hover-row" style={{display:"flex",gap:10,padding:"8px 6px",borderBottom:`0.5px solid ${BOR}`,cursor:"pointer"}}>
                <span style={{...S.mono,color:HINT,fontSize:11,width:16}}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                  <div style={{fontSize:11,color:MUTED}}>{v.views?.toLocaleString("pt-BR")} views</div>
                </div>
                <button onClick={()=>onSaveIdea(v.title,"Trending Global")} style={{...S.btn,padding:"2px 6px",fontSize:9,flexShrink:0}}>+ideia</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FOCUS OS TAB ─────────────────────────────────────────────
function FocusTab({tasks,clients,getClientColor,getClientName,focusTaskId,timerRunning,timerSeconds,timerMode,timerFmt,userStats,onStartTask,onStopTimer,onCompleteTask,onSkip,onAddTask,todayTasks}){
  const LEVELS = [{n:1,label:"Iniciante",xp:0},{n:2,label:"Freelancer",xp:100},{n:3,label:"Creator",xp:250},{n:4,label:"Producer",xp:500},{n:5,label:"Director",xp:1000},{n:6,label:"Studio Boss",xp:2000}];
  const currentLevel = LEVELS.filter(l=>l.xp<=(userStats.xp||0)).pop()||LEVELS[0];
  const nextLevel = LEVELS.find(l=>l.xp>(userStats.xp||0));
  const pendingTasks = tasks.filter(t=>!t.done).sort((a,b)=>{
    const sa={hot:100,warn:50,normal:10}[a.urgency||"normal"]+(10-Math.min(10,deadlineDiff(a.deadline)||10))*5-(a.estimated_hours||1);
    const sb={hot:100,warn:50,normal:10}[b.urgency||"normal"]+(10-Math.min(10,deadlineDiff(b.deadline)||10))*5-(b.estimated_hours||1);
    return sb-sa;
  });
  const focusTask = pendingTasks.find(t=>t.id===focusTaskId) || pendingTasks[0];
  const urgColors = {hot:RED,warn:GOLD,normal:GREEN};

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:20}}>
      <div>
        {/* FOCO ATUAL */}
        {focusTask && (
          <div style={{background:SURF,border:`0.5px solid ${BOR2}`,borderRadius:14,padding:28,marginBottom:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:urgColors[focusTask.urgency||"normal"]}}/>
            <div style={{...S.mono,color:GOLD,fontSize:10,letterSpacing:2,marginBottom:10}}>⚡ TAREFA EM FOCO</div>
            <div style={{fontFamily:"'Syne'",fontSize:24,fontWeight:800,marginBottom:8,lineHeight:1.2}}>{focusTask.title}</div>
            <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
              <Tag color={getClientColor(focusTask.client_id)}>{getClientName(focusTask.client_id)}</Tag>
              {focusTask.deadline && <Tag color={deadlineColor(focusTask.deadline)}>{deadlineLabel(focusTask.deadline)}</Tag>}
              <Tag color={MUTED}>{focusTask.type||"Tarefa"}</Tag>
              <Tag color={MUTED}>{focusTask.estimated_hours}h est.</Tag>
            </div>

            {/* Timer */}
            <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:20}}>
              <div style={{fontFamily:"'IBM Plex Mono'",fontSize:52,fontWeight:600,color:timerMode==="work"?GOLD:GREEN,letterSpacing:-2,lineHeight:1}}>
                {timerFmt(timerSeconds)}
              </div>
              <div>
                <div style={{fontSize:12,color:MUTED,marginBottom:4}}>{timerMode==="work"?"Modo trabalho (25min)":"Modo descanso (5min)"}</div>
                <Tag color={timerMode==="work"?GOLD:GREEN}>{timerMode==="work"?"🍅 Pomodoro":"☕ Descanso"}</Tag>
              </div>
            </div>

            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {!timerRunning ? (
                <button onClick={()=>onStartTask(focusTask.id)} style={S.cta}>▶ Iniciar Pomodoro</button>
              ) : (
                <button onClick={onStopTimer} style={{...S.btn,color:GOLD,borderColor:`${GOLD}44`}}>⏸ Pausar</button>
              )}
              <button onClick={()=>onCompleteTask(focusTask.id)} style={{...S.btn,color:GREEN,borderColor:`${GREEN}44`}}>✓ Concluir tarefa</button>
              <button onClick={onSkip} style={{...S.btn,fontSize:11}}>→ Pular</button>
            </div>
          </div>
        )}

        {/* Plano do dia */}
        <div style={{...S.card}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1}}>📋 PLANO DO DIA — ORDENADO POR PRIORIDADE</div>
            <button onClick={onAddTask} style={{...S.btn,fontSize:10,padding:"4px 10px"}}>+ Tarefa</button>
          </div>
          {pendingTasks.length===0 && <div style={{color:MUTED,fontSize:13,textAlign:"center",padding:20}}>🎉 Nenhuma tarefa pendente!</div>}
          {pendingTasks.map((t,i)=>{
            const isFocus = t.id===focusTaskId||(!focusTaskId&&i===0);
            return (
              <div key={t.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:10,padding:"11px 8px",borderBottom:`0.5px solid ${BOR}`,background:isFocus?`${GOLD}08`:undefined,borderRadius:isFocus?8:0,cursor:"pointer"}} onClick={()=>onStartTask(t.id)}>
                <span style={{...S.mono,color:HINT,fontSize:11,width:24,flexShrink:0}}>#{i+1}</span>
                <div style={{width:4,height:4,borderRadius:1,background:urgColors[t.urgency||"normal"],flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:isFocus?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                  <div style={{fontSize:11,color:MUTED,fontFamily:"'IBM Plex Mono'"}}>{getClientName(t.client_id)} · {t.type||"Tarefa"}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                  {t.deadline && <Tag color={deadlineColor(t.deadline)}>{deadlineLabel(t.deadline)}</Tag>}
                  <Tag color={MUTED}>{t.estimated_hours}h</Tag>
                  <button onClick={e=>{e.stopPropagation();onCompleteTask(t.id);}} style={{...S.btn,padding:"2px 8px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>✓</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: XP + Stats */}
      <div>
        <div style={{...S.card,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:16}}>LVL {currentLevel.n}</div>
            <Tag color={GOLD}>{currentLevel.label}</Tag>
          </div>
          <div style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:MUTED,marginBottom:6}}>{userStats.xp||0} / {nextLevel?.xp||"MAX"} XP</div>
          <XPBar xp={userStats.xp||0} level={currentLevel.n} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:16}}>
            {[
              {label:"Tarefas feitas",val:userStats.tasks_completed||0},
              {label:"Pomodoros",val:userStats.pomodoros_completed||0},
              {label:"Streak",val:`🔥 ${userStats.streak||0} dias`},
              {label:"XP total",val:userStats.xp||0},
            ].map(s=>(
              <div key={s.label} style={{background:BG3,borderRadius:8,padding:"10px 12px"}}>
                <div style={{...S.mono,fontSize:9,color:HINT,marginBottom:4}}>{s.label.toUpperCase()}</div>
                <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:18,color:GOLD}}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Level roadmap */}
        <div style={{...S.card}}>
          <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1,marginBottom:14}}>JORNADA DE NÍVEIS</div>
          {LEVELS.map(l=>{
            const done = (userStats.xp||0)>=l.xp;
            const current = l.n===currentLevel.n;
            return (
              <div key={l.n} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`0.5px solid ${BOR}`}}>
                <div style={{width:28,height:28,borderRadius:"50%",border:`1.5px solid ${done?GREEN:current?GOLD:BOR2}`,background:done?`${GREEN}20`:current?`${GOLD}15`:undefined,display:"flex",alignItems:"center",justifyContent:"center",...S.mono,fontSize:11,color:done?GREEN:current?GOLD:HINT,fontWeight:600,flexShrink:0}}>
                  {done?"✓":l.n}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:current?600:400,color:current?GOLD:done?GREEN:MUTED}}>LVL {l.n} — {l.label}</div>
                </div>
                <div style={{...S.mono,fontSize:10,color:HINT}}>{l.xp} XP</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AGENDA TAB ───────────────────────────────────────────────
function AgendaTab({tasks,posts,clients,getClientColor,getClientName,weekOffset,setWeekOffset,getWeekDates,onAddTask}){
  const weekDates = getWeekDates(weekOffset);
  const todayStr = toLocalDate(new Date());

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div style={{fontFamily:"'Syne'",fontWeight:800,fontSize:22}}>Agenda Semanal</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setWeekOffset(o=>o-1)} style={S.btn}>← Anterior</button>
          <button onClick={()=>setWeekOffset(0)} style={{...S.btn,color:GOLD,borderColor:`${GOLD}44`}}>Hoje</button>
          <button onClick={()=>setWeekOffset(o=>o+1)} style={S.btn}>Próxima →</button>
          <button onClick={onAddTask} style={S.cta}>+ Tarefa</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
        {weekDates.map(({date,label,dayNum})=>{
          const isToday = date===todayStr;
          const dayTasks = tasks.filter(t=>t.deadline===date||t.day_of_week===["DOM","SEG","TER","QUA","QUI","SEX","SÁB"].indexOf(label));
          const dayPosts = posts.filter(p=>p.scheduled_date===date);
          const totalH = dayTasks.reduce((s,t)=>s+(t.estimated_hours||0),0);
          const loadColor = totalH>8?RED:totalH>5?GOLD:GREEN;

          return (
            <div key={date} style={{background:isToday?`${GOLD}08`:SURF,border:`0.5px solid ${isToday?GOLD:BOR}`,borderRadius:10,overflow:"hidden",minHeight:200}}>
              <div style={{padding:"10px 10px 8px",borderBottom:`0.5px solid ${BOR}`,background:isToday?`${GOLD}12`:BG3}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{...S.mono,fontSize:10,color:isToday?GOLD:MUTED,letterSpacing:1}}>{label}</span>
                  {isToday && <span style={{background:GOLD,color:BG,fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:3,...S.mono}}>HOJE</span>}
                </div>
                <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:20,color:isToday?GOLD:TEXT}}>{dayNum}</div>
                {totalH>0 && (
                  <div style={{marginTop:4}}>
                    <ProgressBar value={Math.min(totalH,10)} max={10} color={loadColor} height={3}/>
                    <div style={{...S.mono,fontSize:9,color:loadColor,marginTop:2}}>{totalH}h</div>
                  </div>
                )}
              </div>
              <div style={{padding:6,display:"flex",flexDirection:"column",gap:4}}>
                {dayTasks.map(t=>(
                  <div key={t.id} style={{padding:"6px 8px",borderRadius:6,background:getClientColor(t.client_id)+"18",borderLeft:`2px solid ${getClientColor(t.client_id)}`,fontSize:11,fontWeight:500,lineHeight:1.3,opacity:t.done?.5:1}}>
                    <div style={{...S.mono,fontSize:9,color:getClientColor(t.client_id),marginBottom:2}}>{getClientName(t.client_id)}</div>
                    {t.title}
                  </div>
                ))}
                {dayPosts.map(p=>(
                  <div key={p.id} style={{padding:"6px 8px",borderRadius:6,background:`${PURP}18`,borderLeft:`2px solid ${PURP}`,fontSize:11,fontWeight:500}}>
                    <div style={{...S.mono,fontSize:9,color:PURP,marginBottom:2}}>📤 POST</div>
                    {p.title||p.platform}
                  </div>
                ))}
                {dayTasks.length===0 && dayPosts.length===0 && (
                  <div style={{color:HINT,fontSize:11,padding:"8px 4px",textAlign:"center"}}>—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deadlines próximas */}
      <div style={{...S.card,marginTop:24}}>
        <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1,marginBottom:16}}>📌 PRÓXIMAS DEADLINES</div>
        {tasks.filter(t=>!t.done&&t.deadline&&deadlineDiff(t.deadline)<=7).sort((a,b)=>deadlineDiff(a.deadline)-deadlineDiff(b.deadline)).map(t=>(
          <div key={t.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 8px",borderBottom:`0.5px solid ${BOR}`}}>
            <div style={{width:10,height:10,borderRadius:2,background:deadlineColor(t.deadline),flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500}}>{t.title}</div>
              <div style={{fontSize:11,color:MUTED}}>{getClientName(t.client_id)}</div>
            </div>
            <Tag color={deadlineColor(t.deadline)}>{fmtDate(t.deadline)} · {deadlineLabel(t.deadline)}</Tag>
            <Tag color={MUTED}>{t.estimated_hours}h</Tag>
          </div>
        ))}
        {tasks.filter(t=>!t.done&&t.deadline&&deadlineDiff(t.deadline)<=7).length===0 && (
          <div style={{color:MUTED,fontSize:13,textAlign:"center",padding:20}}>Nenhuma deadline nos próximos 7 dias 🎉</div>
        )}
      </div>
    </div>
  );
}

// ─── DARK CHANNELS TAB ────────────────────────────────────────
function DarkTab({videos,ideas,clients,nicheFilter,setNicheFilter,dragOver,setDragOver,onAddVideo,onEditVideo,onDeleteVideo,onMoveVideo,onOpenScript,onAddIdea,onMarkIdeaUsed,onDeleteIdea,onApproval}){
  const [ideaInput, setIdeaInput] = useState("");
  const [activeSection, setActiveSection] = useState("kanban");
  const STATUS_LABELS = {ideia:"💡 Ideia",roteiro:"📝 Roteiro",gravando:"🎙 Gravando",editando:"✂️ Editando",publicado:"✅ Publicado"};
  const STATUS_COLORS = {ideia:GOLD,roteiro:BLUE,gravando:RED,editando:PURP,publicado:GREEN};
  const filteredVideos = nicheFilter==="todos" ? videos : videos.filter(v=>v.niche===nicheFilter);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontFamily:"'Syne'",fontWeight:800,fontSize:22}}>Canais Dark</div>
        <div style={{display:"flex",gap:8}}>
          {["kanban","ideias","nichos"].map(s=>(
            <button key={s} onClick={()=>setActiveSection(s)} style={{...S.btn,color:activeSection===s?GOLD:MUTED,borderColor:activeSection===s?`${GOLD}44`:BOR}}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
          ))}
          <button onClick={onAddVideo} style={S.cta}>+ Novo Vídeo</button>
        </div>
      </div>

      {activeSection==="kanban" && (
        <div>
          {/* Niche filter */}
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {["todos",...NICHES].map(n=>(
              <button key={n} onClick={()=>setNicheFilter(n)} style={{...S.btn,fontSize:10,padding:"4px 10px",color:nicheFilter===n?GOLD:MUTED,borderColor:nicheFilter===n?`${GOLD}44`:BOR,background:nicheFilter===n?`${GOLD}10`:undefined}}>
                {n==="todos"?"Todos":n}
              </button>
            ))}
          </div>

          {/* Kanban board */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
            {VIDEO_STATUSES.map(status=>{
              const colVideos = filteredVideos.filter(v=>v.status===status);
              return (
                <div key={status}
                  onDragOver={e=>{e.preventDefault();setDragOver(status);}}
                  onDragLeave={()=>setDragOver(null)}
                  onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("videoId");if(id)onMoveVideo(id,status);setDragOver(null);}}
                  style={{background:dragOver===status?`${STATUS_COLORS[status]}08`:BG3,border:`0.5px solid ${dragOver===status?STATUS_COLORS[status]:BOR}`,borderRadius:12,overflow:"hidden",minHeight:300,transition:"all .15s"}}
                  className={dragOver===status?"drag-over":""}
                >
                  <div style={{padding:"12px 12px 10px",borderBottom:`2px solid ${STATUS_COLORS[status]}`,background:`${STATUS_COLORS[status]}10`}}>
                    <div style={{...S.mono,fontSize:12,color:STATUS_COLORS[status],fontWeight:600}}>{STATUS_LABELS[status]}</div>
                    <div style={{...S.mono,fontSize:10,color:MUTED,marginTop:2}}>{colVideos.length}</div>
                  </div>
                  <div style={{padding:8,display:"flex",flexDirection:"column",gap:6}}>
                    {colVideos.map(v=>(
                      <div key={v.id} draggable onDragStart={e=>e.dataTransfer.setData("videoId",v.id)}
                        style={{background:SURF,border:`0.5px solid ${BOR}`,borderRadius:8,padding:"10px 12px",cursor:"grab",transition:"all .15s"}}
                        className="hover-card"
                      >
                        <div style={{fontSize:12,fontWeight:600,marginBottom:6,lineHeight:1.35}}>{v.title}</div>
                        <Tag color={GOLD} >{v.niche}</Tag>
                        {v.publish_date && <div style={{...S.mono,fontSize:10,color:MUTED,marginTop:6}}>📅 {fmtDate(v.publish_date)}</div>}
                        <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                          <button onClick={()=>onOpenScript(v)} style={{...S.btn,padding:"2px 6px",fontSize:9,color:GOLD,borderColor:`${GOLD}33`}}>📄 Roteiro</button>
                          <button onClick={()=>onEditVideo(v)} style={{...S.btn,padding:"2px 6px",fontSize:9}}>✏️</button>
                          <button onClick={()=>onApproval(v)} style={{...S.btn,padding:"2px 6px",fontSize:9,color:BLUE,borderColor:`${BLUE}33`}}>🔗</button>
                          <button onClick={()=>onDeleteVideo(v.id)} style={{...S.btn,padding:"2px 6px",fontSize:9,color:RED,borderColor:`${RED}33`}}>✕</button>
                        </div>
                      </div>
                    ))}
                    {colVideos.length===0 && <div style={{color:HINT,fontSize:11,textAlign:"center",padding:16}}>Arraste aqui</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily steps guide */}
          <div style={{...S.card,marginTop:24}}>
            <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1,marginBottom:16}}>📅 CRONOGRAMA DIÁRIO — COMO AVANÇAR UM VÍDEO</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
              {[
                {dia:"DIA 1",cor:GOLD,items:["Escolher ideia do banco","Pesquisar referências","Definir hook"]},
                {dia:"DIA 2",cor:BLUE,items:["Escrever roteiro completo","Adicionar takes no app","Revisar narração"]},
                {dia:"DIA 3",cor:RED,items:["Gravar narração","Testar prompts NanoBanana","Gerar imagens"]},
                {dia:"DIA 4",cor:PURP,items:["Editar vídeo","Animar no Kling/Seedance","Adicionar legendas"]},
                {dia:"DIA 5",cor:GREEN,items:["Criar thumbnail","Escrever descrição","Upload + agendar"]},
              ].map(({dia,cor,items})=>(
                <div key={dia} style={{background:BG3,borderRadius:10,padding:"14px 12px",borderTop:`2px solid ${cor}`}}>
                  <div style={{...S.mono,fontSize:11,color:cor,fontWeight:600,marginBottom:10}}>{dia}</div>
                  {items.map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:6}}>
                      <span style={{color:cor,fontSize:10,flexShrink:0,marginTop:1}}>→</span>
                      <span style={{fontSize:11,lineHeight:1.4,color:MUTED}}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection==="ideias" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div>
            <div style={{...S.card}}>
              <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1,marginBottom:14}}>💡 BANCO DE IDEIAS</div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                <input value={ideaInput} onChange={e=>setIdeaInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&ideaInput.trim()){onAddIdea(ideaInput.trim());setIdeaInput("");}}} placeholder="Nova ideia de vídeo..." style={{...S.inp,flex:1}} />
                <button onClick={()=>{if(ideaInput.trim()){onAddIdea(ideaInput.trim());setIdeaInput("");}}} style={S.cta}>+</button>
              </div>
              {ideas.filter(i=>!i.used).map(i=>(
                <div key={i.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 6px",borderBottom:`0.5px solid ${BOR}`}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500}}>{i.title}</div>
                    {i.niche && <div style={{...S.mono,fontSize:10,color:MUTED,marginTop:2}}>{i.niche}</div>}
                  </div>
                  <button onClick={()=>onMarkIdeaUsed(i.id)} style={{...S.btn,padding:"2px 8px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>usar →</button>
                  <button onClick={()=>onDeleteIdea(i.id)} style={{...S.btn,padding:"2px 8px",fontSize:10,color:RED,borderColor:`${RED}33`}}>✕</button>
                </div>
              ))}
              {ideas.filter(i=>!i.used).length===0 && <div style={{color:MUTED,fontSize:13,textAlign:"center",padding:20}}>Banco de ideias vazio. Adicione ideias acima!</div>}
            </div>
          </div>
          <div>
            <div style={{...S.card}}>
              <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1,marginBottom:14}}>✓ IDEIAS USADAS</div>
              {ideas.filter(i=>i.used).map(i=>(
                <div key={i.id} style={{display:"flex",gap:10,padding:"8px 6px",borderBottom:`0.5px solid ${BOR}`,opacity:.5}}>
                  <span style={{fontSize:12,textDecoration:"line-through",flex:1}}>{i.title}</span>
                  {i.niche && <Tag color={MUTED}>{i.niche}</Tag>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection==="nichos" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {NICHES.map(n=>{
            const vids = videos.filter(v=>v.niche===n);
            const pub  = vids.filter(v=>v.status==="publicado").length;
            return (
              <div key={n} style={{...S.card}} className="hover-card">
                <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:15,marginBottom:8}}>{n}</div>
                <div style={{...S.mono,color:GOLD,fontSize:12,marginBottom:12}}>CPM: {NICHE_CPM[n]||"$4–8"}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  <div style={{background:BG3,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{...S.mono,fontSize:9,color:HINT}}>TOTAL</div>
                    <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:18,color:TEXT}}>{vids.length}</div>
                  </div>
                  <div style={{background:BG3,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{...S.mono,fontSize:9,color:HINT}}>PUBLICADOS</div>
                    <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:18,color:GREEN}}>{pub}</div>
                  </div>
                </div>
                <ProgressBar value={pub} max={Math.max(vids.length,1)} color={GREEN}/>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CLIENTS TAB ──────────────────────────────────────────────
function ClientsTab({clients,tasks,videos,invoices,selectedClient,setSelectedClient,getClientColor,onAddClient,onEditClient,onDeleteClient,onAddTask,onEditTask,onDeleteTask,onCompleteTask}){
  const urgColors={hot:RED,warn:GOLD,normal:GREEN};

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontFamily:"'Syne'",fontWeight:800,fontSize:22}}>Clientes</div>
        <button onClick={onAddClient} style={S.cta}>+ Novo Cliente</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20}}>
        {/* Client list */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {clients.map(c=>{
            const pending = tasks.filter(t=>t.client_id===c.id&&!t.done).length;
            const isSelected = selectedClient?.id===c.id;
            return (
              <div key={c.id} onClick={()=>setSelectedClient(isSelected?null:c)} style={{...S.card,cursor:"pointer",border:`0.5px solid ${isSelected?c.color||GOLD:BOR}`,background:isSelected?`${c.color||GOLD}08`:SURF,transition:"all .15s"}} className="hover-card">
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:8,background:`${c.color||GOLD}20`,border:`1px solid ${c.color||GOLD}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne'",fontWeight:800,fontSize:13,color:c.color||GOLD,flexShrink:0}}>
                    {c.name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                    <div style={{fontSize:11,color:MUTED}}>{c.type} · {c.frequency}</div>
                  </div>
                  {pending>0 && <Tag color={RED}>{pending}</Tag>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Client detail */}
        {selectedClient ? (
          <div>
            <div style={{...S.card,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <div style={{width:52,height:52,borderRadius:12,background:`${selectedClient.color||GOLD}20`,border:`1px solid ${selectedClient.color||GOLD}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne'",fontWeight:800,fontSize:18,color:selectedClient.color||GOLD}}>
                    {selectedClient.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontFamily:"'Syne'",fontWeight:800,fontSize:22}}>{selectedClient.name}</div>
                    <div style={{color:MUTED,fontSize:13}}>{selectedClient.type} · {selectedClient.frequency}</div>
                    {selectedClient.rate_per_hour>0 && <div style={{...S.mono,fontSize:11,color:GOLD,marginTop:2}}>R$ {selectedClient.rate_per_hour}/h</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>onEditClient(selectedClient)} style={S.btn}>✏️ Editar</button>
                  <button onClick={()=>onDeleteClient(selectedClient.id)} style={{...S.btn,color:RED,borderColor:`${RED}44`}}>🗑 Excluir</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[
                  {label:"Tarefas ativas",val:tasks.filter(t=>t.client_id===selectedClient.id&&!t.done).length,col:GOLD},
                  {label:"Concluídas",    val:tasks.filter(t=>t.client_id===selectedClient.id&&t.done).length,col:GREEN},
                  {label:"Vídeos",        val:videos.filter(v=>v.client_id===selectedClient.id).length,col:BLUE},
                  {label:"NFs",           val:invoices.filter(i=>i.client_id===selectedClient.id).length,col:PURP},
                ].map(s=>(
                  <div key={s.label} style={{background:BG3,borderRadius:8,padding:"12px 14px"}}>
                    <div style={{...S.mono,fontSize:9,color:HINT,marginBottom:4}}>{s.label.toUpperCase()}</div>
                    <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:22,color:s.col}}>{s.val}</div>
                  </div>
                ))}
              </div>
              {selectedClient.notes && <div style={{marginTop:16,padding:"12px 14px",background:BG3,borderRadius:8,fontSize:13,color:MUTED,lineHeight:1.6}}>{selectedClient.notes}</div>}
            </div>

            {/* Tasks */}
            <div style={{...S.card}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1}}>TAREFAS</div>
                <button onClick={()=>onAddTask(selectedClient.id)} style={{...S.btn,fontSize:10,padding:"4px 10px"}}>+ Tarefa</button>
              </div>
              {tasks.filter(t=>t.client_id===selectedClient.id).sort((a,b)=>(a.done?1:-1)||taskScore(b)-taskScore(a)).map(t=>(
                <div key={t.id} className="hover-row" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px",borderBottom:`0.5px solid ${BOR}`,opacity:t.done?.5:1}}>
                  <div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${t.done?GREEN:BOR2}`,background:t.done?GREEN:undefined,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}} onClick={()=>!t.done&&onCompleteTask(t.id)}>
                    {t.done && <span style={{color:BG,fontSize:10}}>✓</span>}
                  </div>
                  <div style={{width:6,height:6,borderRadius:1,background:urgColors[t.urgency||"normal"],flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,textDecoration:t.done?"line-through":undefined}}>{t.title}</div>
                    <div style={{fontSize:11,color:MUTED,...S.mono}}>{t.type||"Tarefa"} · {t.estimated_hours}h</div>
                  </div>
                  {t.deadline && <Tag color={deadlineColor(t.deadline)}>{deadlineLabel(t.deadline)}</Tag>}
                  <button onClick={()=>onEditTask(t)} style={{...S.btn,padding:"2px 6px",fontSize:10}}>✏️</button>
                  <button onClick={()=>onDeleteTask(t.id)} style={{...S.btn,padding:"2px 6px",fontSize:10,color:RED,borderColor:`${RED}33`}}>✕</button>
                </div>
              ))}
              {tasks.filter(t=>t.client_id===selectedClient.id).length===0 && <div style={{color:MUTED,fontSize:13,textAlign:"center",padding:20}}>Nenhuma tarefa. Adicione uma acima.</div>}
            </div>
          </div>
        ) : (
          <div style={{...S.card,display:"flex",alignItems:"center",justifyContent:"center",minHeight:300}}>
            <div style={{textAlign:"center",color:MUTED}}>
              <div style={{fontSize:32,marginBottom:8}}>◈</div>
              <div style={{fontSize:14}}>Selecione um cliente para ver detalhes</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FINANCE TAB ──────────────────────────────────────────────
function FinanceTab({invoices,clients,invoiceFilter,setInvoiceFilter,invoiceClient,setInvoiceClient,totalEmitido,totalRecebido,totalPendente,totalVencido,getClientColor,getClientName,onAdd,onEdit,onDelete,onMarkPaid}){
  const STATUS_COLORS = {pendente:GOLD,pago:GREEN,vencido:RED,cancelado:HINT};
  const filtered = invoices
    .filter(i=>invoiceFilter==="todos"||i.status===invoiceFilter)
    .filter(i=>invoiceClient==="todos"||i.client_id===invoiceClient)
    .sort((a,b)=>a.due_date?.localeCompare(b.due_date)||0);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontFamily:"'Syne'",fontWeight:800,fontSize:22}}>Finanças</div>
        <button onClick={onAdd} style={S.cta}>+ Nova NF</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[
          {label:"Emitido este mês",val:totalEmitido,col:TEXT},
          {label:"Recebido",        val:totalRecebido,col:GREEN},
          {label:"Pendente",        val:totalPendente,col:GOLD},
          {label:"Vencido",         val:totalVencido, col:RED},
        ].map(m=>(
          <div key={m.label} style={{...S.card}}>
            <span style={S.lbl}>{m.label}</span>
            <div style={{fontFamily:"'Syne'",fontWeight:700,fontSize:24,color:m.col}}>{fmtCurrency(m.val)}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["todos","pendente","pago","vencido","cancelado"].map(f=>(
          <button key={f} onClick={()=>setInvoiceFilter(f)} style={{...S.btn,fontSize:11,color:invoiceFilter===f?GOLD:MUTED,borderColor:invoiceFilter===f?`${GOLD}44`:BOR,background:invoiceFilter===f?`${GOLD}10`:undefined}}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
        <select value={invoiceClient} onChange={e=>setInvoiceClient(e.target.value)} style={{...S.inp,width:"auto",padding:"6px 10px"}}>
          <option value="todos">Todos os clientes</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{...S.card}}>
        <div style={{display:"grid",gridTemplateColumns:"auto 1fr 120px 100px 100px 100px auto",gap:0,padding:"8px 12px",borderBottom:`0.5px solid ${BOR}`,...S.mono,fontSize:10,color:HINT}}>
          <div style={{width:30}}>NF</div>
          <div>DESCRIÇÃO</div>
          <div>CLIENTE</div>
          <div style={{textAlign:"right"}}>VALOR</div>
          <div style={{textAlign:"center"}}>VENCIMENTO</div>
          <div style={{textAlign:"center"}}>STATUS</div>
          <div style={{width:90}}/>
        </div>
        {filtered.length===0 && <div style={{color:MUTED,fontSize:13,textAlign:"center",padding:32}}>Nenhuma nota fiscal encontrada.</div>}
        {filtered.map(i=>(
          <div key={i.id} className="hover-row" style={{display:"grid",gridTemplateColumns:"auto 1fr 120px 100px 100px 100px auto",gap:0,padding:"12px 12px",borderBottom:`0.5px solid ${BOR}`,alignItems:"center"}}>
            <div style={{width:30,...S.mono,fontSize:11,color:MUTED}}>{i.number||"—"}</div>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>{i.description||"Sem descrição"}</div>
              <div style={{...S.mono,fontSize:10,color:MUTED}}>{fmtDate(i.issued_date)}</div>
            </div>
            <div>
              <Tag color={getClientColor(i.client_id)}>{getClientName(i.client_id)}</Tag>
            </div>
            <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono'",fontWeight:600,fontSize:13,color:STATUS_COLORS[i.status]||TEXT}}>
              {fmtCurrency(i.amount)}
            </div>
            <div style={{textAlign:"center",...S.mono,fontSize:11,color:deadlineColor(i.due_date)}}>
              {fmtDate(i.due_date)}
            </div>
            <div style={{textAlign:"center"}}>
              <Tag color={STATUS_COLORS[i.status]||TEXT}>{i.status}</Tag>
            </div>
            <div style={{display:"flex",gap:4,width:90,justifyContent:"flex-end"}}>
              {i.status==="pendente" && <button onClick={()=>onMarkPaid(i.id)} style={{...S.btn,padding:"2px 7px",fontSize:10,color:GREEN,borderColor:`${GREEN}33`}}>✓ Pago</button>}
              <button onClick={()=>onEdit(i)} style={{...S.btn,padding:"2px 6px",fontSize:10}}>✏️</button>
              <button onClick={()=>onDelete(i.id)} style={{...S.btn,padding:"2px 6px",fontSize:10,color:RED,borderColor:`${RED}33`}}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Por cliente */}
      <div style={{...S.card,marginTop:20}}>
        <div style={{...S.mono,color:MUTED,fontSize:10,letterSpacing:1,marginBottom:16}}>RESUMO POR CLIENTE</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {clients.map(c=>{
            const cInv = invoices.filter(i=>i.client_id===c.id);
            const total = cInv.reduce((s,i)=>s+(i.amount||0),0);
            const pago = cInv.filter(i=>i.status==="pago").reduce((s,i)=>s+(i.amount||0),0);
            if(total===0) return null;
            return (
              <div key={c.id} style={{background:BG3,borderRadius:10,padding:"14px 16px",borderLeft:`3px solid ${c.color||GOLD}`}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>{c.name}</div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:MUTED}}>Total</span>
                  <span style={{...S.mono,fontSize:12,color:TEXT,fontWeight:600}}>{fmtCurrency(total)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:11,color:MUTED}}>Recebido</span>
                  <span style={{...S.mono,fontSize:12,color:GREEN,fontWeight:600}}>{fmtCurrency(pago)}</span>
                </div>
                <ProgressBar value={pago} max={total} color={c.color||GOLD}/>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LIBRARY TAB ──────────────────────────────────────────────
function LibraryTab({library,clients,libFilter,setLibFilter,libSearch,setLibSearch,getClientColor,getClientName,onAdd,onEdit,onDelete}){
  const TYPE_COLORS = {hook:GOLD,titulo:BLUE,cta:GREEN,thumbnail:PURP,template:RED};
  const TYPE_ICONS  = {hook:"🎣",titulo:"📰",cta:"📣",thumbnail:"🖼",template:"📄"};
  const filtered = library
    .filter(l=>libFilter==="todos"||l.type===libFilter)
    .filter(l=>!libSearch||l.content.toLowerCase().includes(libSearch.toLowerCase())||l.niche?.toLowerCase().includes(libSearch.toLowerCase()));

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontFamily:"'Syne'",fontWeight:800,fontSize:22}}>Biblioteca</div>
        <button onClick={onAdd} style={S.cta}>+ Adicionar</button>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {["todos","hook","titulo","cta","thumbnail","template"].map(f=>(
          <button key={f} onClick={()=>setLibFilter(f)} style={{...S.btn,fontSize:11,color:libFilter===f?GOLD:MUTED,borderColor:libFilter===f?`${GOLD}44`:BOR,background:libFilter===f?`${GOLD}10`:undefined}}>
            {f==="todos"?"Todos":`${TYPE_ICONS[f]||""} ${f}`}
          </button>
        ))}
        <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="🔍 Buscar..." style={{...S.inp,width:200,marginLeft:"auto"}}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
        {filtered.map(l=>(
          <div key={l.id} style={{...S.card,borderLeft:`3px solid ${TYPE_COLORS[l.type]||GOLD}`,position:"relative"}} className="hover-card">
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <Tag color={TYPE_COLORS[l.type]||GOLD}>{TYPE_ICONS[l.type]||""} {l.type}</Tag>
              {l.niche && <Tag color={MUTED}>{l.niche}</Tag>}
              {l.views>0 && <Tag color={GREEN}>{l.views.toLocaleString("pt-BR")} views</Tag>}
            </div>
            <div style={{fontSize:13,lineHeight:1.65,color:TEXT,marginBottom:12,fontStyle:l.type==="hook"||l.type==="cta"?"italic":"normal"}}>{l.content}</div>
            {l.client_id && <div style={{marginBottom:10}}><Tag color={getClientColor(l.client_id)}>{getClientName(l.client_id)}</Tag></div>}
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>copyToClipboard(l.content)} style={{...S.btn,fontSize:10,padding:"3px 8px",flex:1,color:GOLD,borderColor:`${GOLD}33`}}>📋 Copiar</button>
              <button onClick={()=>onEdit(l)} style={{...S.btn,fontSize:10,padding:"3px 8px"}}>✏️</button>
              <button onClick={()=>onDelete(l.id)} style={{...S.btn,fontSize:10,padding:"3px 8px",color:RED,borderColor:`${RED}33`}}>✕</button>
            </div>
          </div>
        ))}
        {filtered.length===0 && (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:MUTED}}>
            <div style={{fontSize:32,marginBottom:8}}>📚</div>
            <div>Biblioteca vazia. Adicione hooks, títulos e CTAs que funcionaram!</div>
          </div>
        )}
      </div>
    </div>
  );
}
