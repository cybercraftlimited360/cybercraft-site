"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const TOKEN_KEY = "cc360_admin_token";
const TABS = ["overview","clients","pipeline","finances","tasks","convos","activity","lauren","analytics","calendar","ebooks","website","ads","followups","competitors","roi","referrals","reports"] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Record<Tab,string> = { overview:"📊",clients:"👥",pipeline:"📋",finances:"💰",tasks:"✅",convos:"💬",activity:"🔔",lauren:"📞",analytics:"📈",calendar:"📅",ebooks:"📖",website:"🌐",ads:"🎯",followups:"🔁",competitors:"🕵️",roi:"📑",referrals:"🤝",reports:"📬" };
const TAB_LABELS: Record<Tab,string> = { overview:"Overview",clients:"Clients",pipeline:"Pipeline",finances:"Finances",tasks:"Tasks",convos:"Convos",activity:"Activity",lauren:"Lauren",analytics:"Analytics",calendar:"Calendar",ebooks:"eBooks",website:"Website",ads:"AI Ads",followups:"Follow-Ups",competitors:"Intel",roi:"ROI Report",referrals:"Referrals",reports:"Reports" };

// ── Auth ──────────────────────────────────────────────────────────────────────
function LoginScreen({ onAuth }: { onAuth:(t:string)=>void }) {
  const [pw,setPw]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);
  async function submit(e:React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    const actual=inputRef.current?.value||pw;
    const res=await fetch("/api/admin/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:actual})}).catch(()=>null);
    if(!res||!res.ok){setErr("Wrong password.");setPw("");setLoading(false);return;}
    const d=await res.json(); localStorage.setItem(TOKEN_KEY,d.token); onAuth(d.token); setLoading(false);
  }
  return (
    <div style={{minHeight:"100dvh",background:"#080a10",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:64,height:64,borderRadius:20,margin:"0 auto 16px",background:"linear-gradient(135deg,#00d4ff,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🔐</div>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.25em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",margin:"0 0 8px"}}>CyberCraft360</p>
          <h1 style={{fontSize:"1.6rem",fontWeight:800,color:"#fff",margin:0}}>Admin Dashboard</h1>
        </div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <input ref={inputRef} type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} autoFocus autoComplete="current-password"
            style={{padding:"16px 18px",borderRadius:14,background:"rgba(255,255,255,0.06)",border:`1px solid ${err?"rgba(239,68,68,0.5)":"rgba(255,255,255,0.1)"}`,color:"#fff",fontSize:16,outline:"none",letterSpacing:"0.12em"}} />
          {err&&<p style={{fontSize:13,color:"#ef4444",textAlign:"center",margin:0}}>{err}</p>}
          <button type="submit" disabled={loading} style={{padding:16,borderRadius:14,border:"none",background:loading?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#00d4ff,#7c3aed)",color:"#fff",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer"}}>
            {loading?"Verifying…":"Unlock →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AdminRoot() {
  const [token,setToken]=useState<string|null>(null); const [checked,setChecked]=useState(false);
  useEffect(()=>{
    const t=localStorage.getItem(TOKEN_KEY);
    if(t) fetch("/api/admin/auth",{headers:{"x-admin-token":t}}).then(r=>r.json()).then(d=>{if(d.ok)setToken(t);else localStorage.removeItem(TOKEN_KEY);}).catch(()=>{}).finally(()=>setChecked(true));
    else setChecked(true);
  },[]);
  if(!checked) return <Spinner/>;
  if(!token) return <LoginScreen onAuth={setToken}/>;
  return <Dashboard token={token} onLogout={()=>{localStorage.removeItem(TOKEN_KEY);setToken(null);}}/>;
}

// ── Dashboard card groups ─────────────────────────────────────────────────────
const CARD_GROUPS = [
  {
    label: "Core", color: "#00d4ff",
    cards: [
      { tab:"overview"   as Tab, icon:"📊", title:"Overview",    desc:"Revenue, MRR, pipeline at a glance" },
      { tab:"clients"    as Tab, icon:"👥", title:"Clients",     desc:"All active client accounts" },
      { tab:"pipeline"   as Tab, icon:"📋", title:"Pipeline",    desc:"Deals & proposal stages" },
      { tab:"finances"   as Tab, icon:"💰", title:"Finances",    desc:"Invoices, payments, cash flow" },
      { tab:"tasks"      as Tab, icon:"✅", title:"Tasks",       desc:"To-dos, deadlines, priorities" },
      { tab:"calendar"   as Tab, icon:"📅", title:"Calendar",    desc:"Upcoming bookings & calls" },
    ],
  },
  {
    label: "Leads & Conversations", color: "#e64dff",
    cards: [
      { tab:"convos"     as Tab, icon:"💬", title:"Convos",      desc:"IRIS chat conversations" },
      { tab:"activity"   as Tab, icon:"🔔", title:"Activity",    desc:"Live feed of all events" },
      { tab:"lauren"     as Tab, icon:"📞", title:"Lauren",      desc:"AI phone agent & call logs" },
      { tab:"followups"  as Tab, icon:"🔁", title:"Follow-Ups",  desc:"Overdue leads sorted by score" },
    ],
  },
  {
    label: "Marketing", color: "#f59e0b",
    cards: [
      { tab:"ads"        as Tab, icon:"🎯", title:"AI Ads",      desc:"Generate LinkedIn, Facebook & Instagram ads" },
      { tab:"ebooks"     as Tab, icon:"📖", title:"eBooks",      desc:"Lead magnet downloads & tracking" },
      { tab:"website"    as Tab, icon:"🌐", title:"Website",     desc:"Live site stats & quick edits" },
      { tab:"referrals"  as Tab, icon:"🤝", title:"Referrals",   desc:"Referral links & conversion tracking" },
    ],
  },
  {
    label: "Intelligence & Reports", color: "#22c55e",
    cards: [
      { tab:"analytics"  as Tab, icon:"📈", title:"Analytics",   desc:"Traffic, funnels & performance" },
      { tab:"competitors" as Tab, icon:"🕵️", title:"Intel",      desc:"AI competitive analysis & counter-angles" },
      { tab:"roi"        as Tab, icon:"📑", title:"ROI Report",  desc:"Generate branded client PDF reports" },
      { tab:"reports"    as Tab, icon:"📬", title:"Reports",     desc:"Weekly AI report + proposal writer" },
    ],
  },
];

// ── Dashboard Shell ───────────────────────────────────────────────────────────
function Dashboard({token,onLogout}:{token:string;onLogout:()=>void}) {
  const [tab,setTab]=useState<Tab|null>(null);
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);

  const load=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true); else setRefreshing(true);
    const res=await fetch("/api/admin/dashboard",{headers:{"x-admin-token":token}}).catch(()=>null);
    if(res?.ok)setData(await res.json());
    setLoading(false); setRefreshing(false);
  },[token]);

  useEffect(()=>{load();},[load]);
  const h=useAdminApi(token);

  const activeCard=tab ? CARD_GROUPS.flatMap(g=>g.cards).find(c=>c.tab===tab) : null;

  return (
    <div style={{minHeight:"100dvh",background:"#080a10",fontFamily:"system-ui,sans-serif"}}>
      {/* Top bar */}
      <div style={{background:"rgba(15,17,23,0.97)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
          {tab&&(
            <button onClick={()=>setTab(null)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",padding:"4px 6px 4px 2px",fontSize:18,flexShrink:0,lineHeight:1}}>←</button>
          )}
          <div style={{minWidth:0}}>
            {tab ? (
              <>
                <p style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",margin:"0 0 1px"}}>CyberCraft360 · Dashboard</p>
                <h1 style={{fontSize:"1rem",fontWeight:800,color:"#fff",margin:0,display:"flex",alignItems:"center",gap:6}}>
                  <span>{activeCard?.icon}</span> {activeCard?.title}
                </h1>
              </>
            ) : (
              <>
                <p style={{fontSize:9,fontWeight:700,letterSpacing:"0.25em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",margin:"0 0 2px"}}>CyberCraft360</p>
                <h1 style={{fontSize:"1.05rem",fontWeight:800,color:"#fff",margin:0}}>Admin Dashboard</h1>
              </>
            )}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          {refreshing&&<div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(0,212,255,0.3)",borderTopColor:"#00d4ff",animation:"spin 0.8s linear infinite"}}/>}
          <Btn onClick={()=>load(true)}>↻</Btn>
          {!tab&&<a href="/admin/invoice" style={{padding:"7px 10px",borderRadius:8,background:"linear-gradient(135deg,#00d4ff22,#7c3aed22)",border:"1px solid rgba(0,212,255,0.2)",color:"#00d4ff",fontSize:11,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>📄 Invoice</a>}
          <Btn onClick={onLogout} style={{color:"rgba(255,255,255,0.25)"}}>Out</Btn>
        </div>
      </div>

      <div style={{maxWidth:700,margin:"0 auto",padding:"20px 14px 40px"}}>
        {loading?(
          <div style={{textAlign:"center",padding:"80px 0"}}><Spinner inline/><p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:16}}>Loading…</p></div>
        ) : !tab ? (
          /* ── Home card grid ── */
          <div>
            {/* Quick stats strip */}
            {data&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:28}}>
                {[
                  {label:"MRR",      value:`$${(data.overview?.mrr||0).toLocaleString()}`,    color:"#00d4ff"},
                  {label:"Clients",  value: data.overview?.totalClients||0,                   color:"#e64dff"},
                  {label:"Pipeline", value:`$${(data.overview?.pipelineValue||0).toLocaleString()}`, color:"#7c3aed"},
                  {label:"Tasks",    value: data.overview?.openTasks||0,                      color: data.overview?.overdueTasks>0?"#ef4444":"#f59e0b"},
                ].map(s=>(
                  <div key={s.label} style={{padding:"10px 10px 9px",borderRadius:12,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",textAlign:"center"}}>
                    <p style={{fontSize:"1rem",fontWeight:800,color:s.color,margin:"0 0 2px",lineHeight:1}}>{s.value}</p>
                    <p style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",margin:0}}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {CARD_GROUPS.map(group=>(
              <div key={group.label} style={{marginBottom:28}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{width:3,height:16,borderRadius:2,background:group.color,flexShrink:0}}/>
                  <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",margin:0}}>{group.label}</p>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                  {group.cards.map(card=>(
                    <button key={card.tab} onClick={()=>setTab(card.tab)}
                      style={{padding:"16px 14px",borderRadius:16,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",textAlign:"left",cursor:"pointer",transition:"background 0.15s,border-color 0.15s",display:"flex",flexDirection:"column",gap:6}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)";(e.currentTarget as HTMLButtonElement).style.borderColor=`${group.color}44`;}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.025)";(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.07)";}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:22}}>{card.icon}</span>
                        <span style={{fontSize:14,color:"rgba(255,255,255,0.15)"}}>›</span>
                      </div>
                      <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:0,lineHeight:1.2}}>{card.title}</p>
                      <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",margin:0,lineHeight:1.4}}>{card.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : data ? (
          /* ── Section view ── */
          <>
            {tab==="overview"   &&<OverviewTab    data={data} token={token} h={h}/>}
            {tab==="clients"    &&<ClientsTab     data={data} token={token} h={h}/>}
            {tab==="pipeline"   &&<PipelineTab    data={data} token={token} onRefresh={()=>load(true)} h={h}/>}
            {tab==="finances"   &&<FinancesTab    data={data} token={token}/>}
            {tab==="tasks"      &&<TasksTab       data={data} token={token} onRefresh={()=>load(true)}/>}
            {tab==="convos"     &&<ConvosTab      data={data}/>}
            {tab==="activity"   &&<ActivityTab    data={data}/>}
            {tab==="lauren"     &&<LaurenTab      data={data} token={token} h={h}/>}
            {tab==="analytics"  &&<AnalyticsTab   data={data}/>}
            {tab==="calendar"   &&<CalendarTab    data={data}/>}
            {tab==="ebooks"     &&<EbooksTab      token={token} h={h}/>}
            {tab==="website"    &&<WebsiteTab     data={data}/>}
            {tab==="ads"        &&<AdsTab         token={token}/>}
            {tab==="followups"  &&<FollowUpsTab   token={token}/>}
            {tab==="competitors"&&<CompetitorTab  token={token}/>}
            {tab==="roi"        &&<ROIReportTab   token={token}/>}
            {tab==="referrals"  &&<ReferralTab    token={token}/>}
            {tab==="reports"    &&<ReportsTab     token={token}/>}
          </>
        ):(
          <p style={{color:"#ef4444",textAlign:"center",marginTop:60}}>Failed to load dashboard.</p>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}

// ── Shared API hook ───────────────────────────────────────────────────────────
function useAdminApi(token:string) {
  const hdrs=(extra?:any)=>({...{"x-admin-token":token},...extra});
  const get=(url:string)=>fetch(url,{headers:hdrs()}).then(r=>r.json()).catch(()=>null);
  const post=(url:string,body:any)=>fetch(url,{method:"POST",headers:{"Content-Type":"application/json",...hdrs()},body:JSON.stringify(body)}).then(r=>r.json()).catch(()=>null);
  return {get,post};
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({data,token,h}:{data:any;token:string;h:ReturnType<typeof useAdminApi>}) {
  const o=data.overview;
  const [goals,setGoals]=useState<any>(null);
  const [editGoals,setEditGoals]=useState(false);
  const [gForm,setGForm]=useState({monthlyRevenue:"",monthlyLeads:"",monthlyBookings:""});

  useEffect(()=>{h.get("/api/admin/goals").then(d=>{if(d)setGoals(d);});},[]);

  async function saveGoals(){
    const body:any={};
    if(gForm.monthlyRevenue)body.monthlyRevenue=Number(gForm.monthlyRevenue);
    if(gForm.monthlyLeads)body.monthlyLeads=Number(gForm.monthlyLeads);
    if(gForm.monthlyBookings)body.monthlyBookings=Number(gForm.monthlyBookings);
    const d=await h.post("/api/admin/goals",body);
    if(d?.goals)setGoals(d.goals);
    setEditGoals(false);
  }

  const now=new Date(); const mo=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const monthRevenue=data.invoices?.monthRevenue||0;
  const monthLeads=(data.leads?.recent||[]).filter((l:any)=>(l.capturedAt||"").startsWith(mo)).length;
  const monthBookings=(data.bookings?.upcomingList||[]).length;

  return (
    <div>
      <SectionTitle>At a Glance</SectionTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <BigStatCard label="Total Revenue" value={`$${(o.totalRevenue||0).toLocaleString()}`} accent="#22c55e" icon="💵"/>
        <BigStatCard label="MRR" value={`$${(o.mrr||0).toLocaleString()}`} accent="#00d4ff" icon="↻" sub="monthly recurring"/>
        <BigStatCard label="Pipeline Value" value={`$${(o.pipelineValue||0).toLocaleString()}`} accent="#7c3aed" icon="📋"/>
        <BigStatCard label="Total Clients" value={o.totalClients||0} accent="#e64dff" icon="👥"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        <MiniStat label="Leads" value={o.totalLeads||0} accent="#00d4ff"/>
        <MiniStat label="Bookings" value={o.upcomingBookings||0} accent="#22c55e" sub="upcoming"/>
        <MiniStat label="Tasks" value={o.openTasks||0} accent={o.overdueTasks>0?"#ef4444":"#f59e0b"} sub={o.overdueTasks>0?`${o.overdueTasks} overdue`:"open"}/>
      </div>

      {/* Revenue Goal Tracker */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <SectionTitle style={{margin:0}}>Monthly Goals</SectionTitle>
        <button onClick={()=>{setEditGoals(!editGoals);setGForm({monthlyRevenue:goals?.monthlyRevenue||"",monthlyLeads:goals?.monthlyLeads||"",monthlyBookings:goals?.monthlyBookings||""});}} style={{fontSize:11,color:"#00d4ff",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>
          {editGoals?"Cancel":"✏️ Edit"}
        </button>
      </div>
      {editGoals?(
        <Card style={{padding:16,marginBottom:16}}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input placeholder="Monthly Revenue Goal ($)" type="number" value={gForm.monthlyRevenue} onChange={e=>setGForm(f=>({...f,monthlyRevenue:e.target.value}))} style={miniInputStyle}/>
            <input placeholder="Monthly Leads Goal" type="number" value={gForm.monthlyLeads} onChange={e=>setGForm(f=>({...f,monthlyLeads:e.target.value}))} style={miniInputStyle}/>
            <input placeholder="Monthly Bookings Goal" type="number" value={gForm.monthlyBookings} onChange={e=>setGForm(f=>({...f,monthlyBookings:e.target.value}))} style={miniInputStyle}/>
            <button onClick={saveGoals} style={{padding:"10px",borderRadius:10,background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Goals</button>
          </div>
        </Card>
      ):(
        <Card style={{padding:16,marginBottom:24}}>
          {goals?(<>
            <GoalBar label="Revenue" current={monthRevenue} target={goals.monthlyRevenue||0} format="$" accent="#22c55e"/>
            <GoalBar label="Leads" current={monthLeads} target={goals.monthlyLeads||0} accent="#00d4ff"/>
            <GoalBar label="Bookings" current={monthBookings} target={goals.monthlyBookings||0} accent="#7c3aed"/>
          </>):<EmptyState>No goals set yet — tap Edit to add them</EmptyState>}
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <MiniStat label="Visitors Today" value={data.visitors?.today||0} accent="#00d4ff" sub="page loads"/>
        <MiniStat label="Total Visitors" value={data.visitors?.total||0} accent="#a78bfa" sub="all time"/>
      </div>

      <SectionTitle>Recent Visitors</SectionTitle>
      <Card style={{marginBottom:20}}>
        {data.visitors?.recent?.length>0?data.visitors.recent.slice(0,8).map((v:any,i:number)=>(
          <Row key={i} border={i>0}>
            <div>
              <Name style={{color:"#00d4ff"}}>{v.page||"/"}</Name>
              <Sub>{v.location?(v.location+(v.isp?` · ${v.isp}`:"")):v.referrer?`from ${v.referrer.replace(/^https?:\/\//,"").slice(0,40)}`:"Direct"}</Sub>
            </div>
            <Sub style={{flexShrink:0,marginLeft:8}}>{timeAgo(v.time)}</Sub>
          </Row>
        )):<EmptyState>No visitors tracked yet</EmptyState>}
      </Card>

      <SectionTitle>Upcoming Bookings</SectionTitle>
      <Card style={{marginBottom:20}}>
        {data.bookings.upcomingList?.length>0?data.bookings.upcomingList.slice(0,5).map((b:any,i:number)=>(
          <Row key={b.id} border={i>0}>
            <div><Name>{b.name}</Name><Sub>{b.company}</Sub></div>
            <div style={{textAlign:"right"}}><Name style={{color:"#00d4ff"}}>{b.date}</Name><Sub>{b.time}</Sub></div>
          </Row>
        )):<EmptyState>No upcoming bookings</EmptyState>}
      </Card>

      <SectionTitle>Recent Activity</SectionTitle>
      <Card>
        {data.activity?.slice(0,6).map((e:any,i:number)=>(
          <Row key={e.id} border={i>0}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:18}}>{activityIcon(e.type)}</span>
              <div><Name>{e.title}</Name><Sub>{e.detail}</Sub></div>
            </div>
            <Sub style={{flexShrink:0,marginLeft:8}}>{timeAgo(e.createdAt)}</Sub>
          </Row>
        ))}
        {(!data.activity||data.activity.length===0)&&<EmptyState>No activity yet</EmptyState>}
      </Card>
    </div>
  );
}

function GoalBar({label,current,target,format="",accent}:{label:string;current:number;target:number;format?:string;accent:string}) {
  const pct=target>0?Math.min(100,Math.round((current/target)*100)):0;
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:600}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color:pct>=100?"#22c55e":accent}}>{format}{current.toLocaleString()} / {format}{target.toLocaleString()} <span style={{color:"rgba(255,255,255,0.3)",fontWeight:400}}>({pct}%)</span></span>
      </div>
      <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.06)"}}>
        <div style={{height:"100%",borderRadius:3,background:pct>=100?"#22c55e":accent,width:`${pct}%`,transition:"width 0.6s ease"}}/>
      </div>
    </div>
  );
}

function clientHealth(c:any):{color:string;label:string}{
  const now=Date.now();
  const lastActive=Math.max(c.lastBooking?new Date(c.lastBooking).getTime():0,c.lastInvoice?new Date(c.lastInvoice).getTime():0,c.joinedAt?new Date(c.joinedAt).getTime():0);
  const days=(now-lastActive)/86400000;
  if(days<30)return{color:"#22c55e",label:"Healthy"};
  if(days<90)return{color:"#f59e0b",label:"At Risk"};
  return{color:"#ef4444",label:"Inactive"};
}

// ── Clients Tab ───────────────────────────────────────────────────────────────
function ClientsTab({data,token,h}:{data:any;token:string;h:ReturnType<typeof useAdminApi>}) {
  const [search,setSearch]=useState("");
  const [offboarding,setOffboarding]=useState<any>(null);
  const [offboardReason,setOffboardReason]=useState("");
  const [offboardDone,setOffboardDone]=useState(false);
  const [selectedClient,setSelectedClient]=useState<any>(null);
  const [notes,setNotes]=useState<any[]>([]);
  const [noteText,setNoteText]=useState("");
  const [onboarding,setOnboarding]=useState<any>(null);
  const [showOnboard,setShowOnboard]=useState(false);
  const clients:any[]=data.clients??[];
  const offboarded:any[]=data.offboarded??[];
  const offboardedEmails=new Set(offboarded.map((o:any)=>o.email?.toLowerCase()));
  const filtered=clients.filter(c=>!search||c.name?.toLowerCase().includes(search.toLowerCase())||c.email?.toLowerCase().includes(search.toLowerCase())||c.company?.toLowerCase().includes(search.toLowerCase()));

  async function openClient(c:any){
    setSelectedClient(c);
    const nk=c.email||c.name;
    const [n,ob]=await Promise.all([h.get(`/api/admin/notes?key=${encodeURIComponent(nk)}`),h.get(`/api/admin/onboarding?client=${encodeURIComponent(nk)}`)]);
    setNotes(Array.isArray(n)?n:[]);
    setOnboarding(ob);
  }

  async function addNote(){
    if(!noteText.trim()||!selectedClient)return;
    const nk=selectedClient.email||selectedClient.name;
    await h.post("/api/admin/notes",{action:"add",key:nk,text:noteText});
    setNoteText("");
    const n=await h.get(`/api/admin/notes?key=${encodeURIComponent(nk)}`);
    setNotes(Array.isArray(n)?n:[]);
  }

  async function deleteNote(id:string){
    await h.post("/api/admin/notes",{action:"delete",id});
    const nk=selectedClient?.email||selectedClient?.name;
    const n=await h.get(`/api/admin/notes?key=${encodeURIComponent(nk)}`);
    setNotes(Array.isArray(n)?n:[]);
  }

  async function toggleOnboardStep(idx:number){
    if(!onboarding||!selectedClient)return;
    const steps=[...onboarding.steps];
    steps[idx]={...steps[idx],done:!steps[idx].done};
    const nk=selectedClient.email||selectedClient.name;
    await h.post("/api/admin/onboarding",{clientKey:nk,steps});
    setOnboarding({...onboarding,steps});
  }

  async function confirmOffboard(){
    if(!offboarding)return;
    await fetch("/api/admin/offboard",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({clientName:offboarding.name,clientEmail:offboarding.email,reason:offboardReason})});
    setOffboardDone(true);
    setTimeout(()=>{setOffboarding(null);setOffboardReason("");setOffboardDone(false);},1500);
  }

  if(selectedClient){
    const health=clientHealth(selectedClient);
    const onboardDone=onboarding?.steps?.filter((s:any)=>s.done).length??0;
    const onboardTotal=onboarding?.steps?.length??0;
    return (
      <div>
        <button onClick={()=>setSelectedClient(null)} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"rgba(255,255,255,0.4)",background:"none",border:"none",cursor:"pointer",marginBottom:16,padding:0}}>← Back to Clients</button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#00d4ff22,#7c3aed22)",border:"1px solid rgba(0,212,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#00d4ff"}}>
            {selectedClient.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{selectedClient.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{selectedClient.company||selectedClient.email}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,fontWeight:700,color:health.color,padding:"3px 10px",borderRadius:20,background:`${health.color}18`,border:`1px solid ${health.color}30`}}>{health.label}</div>
            {selectedClient.totalSpent>0&&<div style={{fontSize:13,fontWeight:700,color:"#22c55e",marginTop:4}}>${selectedClient.totalSpent.toLocaleString()}</div>}
          </div>
        </div>

        {/* Onboarding checklist */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <SectionTitle style={{margin:0}}>Onboarding ({onboardDone}/{onboardTotal})</SectionTitle>
          <button onClick={()=>setShowOnboard(!showOnboard)} style={{fontSize:11,color:"#00d4ff",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>{showOnboard?"Hide":"Show"}</button>
        </div>
        {showOnboard&&onboarding&&(
          <Card style={{marginBottom:20}}>
            <div style={{padding:"4px 0"}}>
              {onboarding.steps.map((step:any,i:number)=>(
                <div key={i} onClick={()=>toggleOnboardStep(i)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderTop:i>0?"1px solid rgba(255,255,255,0.05)":"none",cursor:"pointer"}}>
                  <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${step.done?"#22c55e":"rgba(255,255,255,0.2)"}`,background:step.done?"rgba(34,197,94,0.15)":"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#22c55e",flexShrink:0}}>
                    {step.done?"✓":""}
                  </div>
                  <span style={{fontSize:13,color:step.done?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.8)",textDecoration:step.done?"line-through":"none"}}>{step.label}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"4px 16px 12px"}}>
              <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.06)"}}>
                <div style={{height:"100%",borderRadius:2,background:"#22c55e",width:`${onboardTotal>0?Math.round((onboardDone/onboardTotal)*100):0}%`,transition:"width 0.4s"}}/>
              </div>
            </div>
          </Card>
        )}

        {/* Notes */}
        <SectionTitle>Notes ({notes.length})</SectionTitle>
        <Card style={{marginBottom:20}}>
          {notes.length>0?notes.map((n,i)=>(
            <Row key={n.id} border={i>0}>
              <div style={{flex:1}}>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.75)",margin:0,lineHeight:1.5}}>{n.text}</p>
                <Sub>{timeAgo(n.createdAt)}</Sub>
              </div>
              <button onClick={()=>deleteNote(n.id)} style={{fontSize:12,color:"rgba(255,255,255,0.2)",background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0}}>✕</button>
            </Row>
          )):<EmptyState>No notes yet</EmptyState>}
          <div style={{padding:"12px 16px",borderTop:notes.length>0?"1px solid rgba(255,255,255,0.05)":"none",display:"flex",gap:8}}>
            <input placeholder="Add a note…" value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote()} style={{...miniInputStyle,flex:1}}/>
            <button onClick={addNote} style={{padding:"11px 16px",borderRadius:10,background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</button>
          </div>
        </Card>

        {/* Client stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <MiniStat label="Bookings" value={selectedClient.bookings||0} accent="#22c55e"/>
          <MiniStat label="Invoices" value={selectedClient.invoices||0} accent="#7c3aed"/>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <MiniStat label="Total Clients" value={clients.length} accent="#00d4ff"/>
        <MiniStat label="Churned" value={offboarded.length} accent="#ef4444" sub="left your services"/>
      </div>

      <SectionTitle>Active Clients</SectionTitle>
      <input placeholder="Search by name, email, company…" value={search} onChange={e=>setSearch(e.target.value)}
        style={{width:"100%",padding:"12px 16px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",color:"#fff",fontSize:14,outline:"none",marginBottom:14}}/>

      {offboarding&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
          <div style={{background:"#0f1117",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:24,width:"100%",maxWidth:360}}>
            {offboardDone?(<p style={{textAlign:"center",color:"#22c55e",fontSize:16,fontWeight:700,margin:0}}>✓ Client offboarded</p>):(<>
              <p style={{fontSize:15,fontWeight:700,color:"#fff",margin:"0 0 6px"}}>Offboard {offboarding.name}?</p>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",margin:"0 0 16px"}}>This will log them as churned.</p>
              <input placeholder="Reason (optional)" value={offboardReason} onChange={e=>setOffboardReason(e.target.value)} style={{...miniInputStyle,marginBottom:12}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={confirmOffboard} style={{flex:1,padding:11,borderRadius:10,background:"#ef4444",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Confirm</button>
                <button onClick={()=>{setOffboarding(null);setOffboardReason("");}} style={{flex:1,padding:11,borderRadius:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontSize:13,cursor:"pointer"}}>Cancel</button>
              </div>
            </>)}
          </div>
        </div>
      )}

      <Card style={{marginBottom:24}}>
        {filtered.length>0?filtered.map((c,i)=>{
          const isChurned=offboardedEmails.has(c.email?.toLowerCase());
          const health=clientHealth(c);
          return (
            <Row key={c.email||i} border={i>0} style={{opacity:isChurned?0.45:1,cursor:"pointer"}} onClick={()=>!isChurned&&openClient(c)}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:38,height:38,borderRadius:12,background:isChurned?"rgba(239,68,68,0.1)":"linear-gradient(135deg,#00d4ff22,#7c3aed22)",border:`1px solid ${isChurned?"rgba(239,68,68,0.3)":"rgba(0,212,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:isChurned?"#ef4444":"#00d4ff",flexShrink:0}}>
                  {c.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <Name>{c.name}{isChurned&&<span style={{fontSize:10,color:"#ef4444",marginLeft:6,fontWeight:700}}>CHURNED</span>}</Name>
                  <Sub>{c.company||c.email}</Sub>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}} onClick={e=>e.stopPropagation()}>
                {c.totalSpent>0&&<div style={{fontSize:13,fontWeight:700,color:"#22c55e",marginBottom:4}}>${c.totalSpent.toLocaleString()}</div>}
                {!isChurned&&<div style={{fontSize:10,fontWeight:700,color:health.color,marginBottom:4}}>{health.label}</div>}
                {!isChurned&&<button onClick={()=>setOffboarding(c)} style={{fontSize:10,color:"rgba(239,68,68,0.5)",background:"none",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"3px 8px",cursor:"pointer"}}>Offboard</button>}
              </div>
            </Row>
          );
        }):<EmptyState>No clients found</EmptyState>}
      </Card>

      {offboarded.length>0&&(<>
        <SectionTitle>Churned Clients ({offboarded.length})</SectionTitle>
        <Card>
          {offboarded.map((c:any,i:number)=>(
            <Row key={i} border={i>0} style={{opacity:0.5}}>
              <div><Name>{c.name}</Name><Sub>{c.email}</Sub></div>
              <div style={{textAlign:"right"}}>
                <Sub style={{color:"#ef4444"}}>{c.reason||"Cancelled"}</Sub>
                <Sub>{c.date?new Date(c.date).toLocaleDateString():""}</Sub>
              </div>
            </Row>
          ))}
        </Card>
      </>)}
    </div>
  );
}

// ── Pipeline Tab ──────────────────────────────────────────────────────────────
const STAGES=[
  {id:"new",label:"New",color:"#64748b"},
  {id:"contacted",label:"Contacted",color:"#3b82f6"},
  {id:"demo",label:"Demo",color:"#8b5cf6"},
  {id:"proposal",label:"Proposal",color:"#f59e0b"},
  {id:"won",label:"Won ✓",color:"#22c55e"},
  {id:"lost",label:"Lost",color:"#ef4444"},
];

function scoreLead(lead:any):number{
  let s=0;
  if(lead.phone)s+=2;
  if(lead.email)s+=1;
  if(lead.company)s+=1;
  if(lead.challenge&&lead.challenge.length>15)s+=2;
  const age=(Date.now()-new Date(lead.capturedAt||lead.createdAt||0).getTime())/86400000;
  if(age<7)s+=2;
  if(lead.source==="booking")s+=3;
  else if(lead.source==="form")s+=2;
  else if(lead.source==="chat")s+=1;
  return Math.min(10,s);
}

function ScoreBadge({score}:{score:number}){
  const color=score>=7?"#22c55e":score>=4?"#f59e0b":"#ef4444";
  return <span style={{fontSize:10,fontWeight:800,color,background:`${color}15`,border:`1px solid ${color}30`,borderRadius:6,padding:"2px 7px"}}>{score}/10</span>;
}

function PipelineTab({data,token,onRefresh,h}:{data:any;token:string;onRefresh:()=>void;h:ReturnType<typeof useAdminApi>}) {
  const [adding,setAdding]=useState(false);
  const [form,setForm]=useState({name:"",company:"",email:"",phone:"",service:"",value:"",stage:"new"});
  const [moving,setMoving]=useState<string|null>(null);
  const [reminders,setReminders]=useState<any[]>([]);
  const [showReminders,setShowReminders]=useState(false);
  const [rForm,setRForm]=useState({name:"",phone:"",email:"",company:"",note:"",dueDate:""});
  const pipeline:any[]=data.pipeline.leads??[];

  useEffect(()=>{h.get("/api/admin/reminders").then(d=>{if(Array.isArray(d))setReminders(d);});},[]);

  async function addLead(){
    if(!form.name)return;
    await fetch("/api/admin/pipeline",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"add",...form,value:form.value?Number(form.value):undefined})});
    setForm({name:"",company:"",email:"",phone:"",service:"",value:"",stage:"new"});setAdding(false);onRefresh();
  }
  async function moveStage(id:string,stage:string){
    setMoving(id);
    await fetch("/api/admin/pipeline",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"update_stage",id,stage})});
    setMoving(null);onRefresh();
  }
  async function deleteLead(id:string){
    await fetch("/api/admin/pipeline",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"delete",id})});
    onRefresh();
  }
  async function addReminder(){
    if(!rForm.name||!rForm.dueDate)return;
    await h.post("/api/admin/reminders",{action:"add",...rForm});
    setRForm({name:"",phone:"",email:"",company:"",note:"",dueDate:""});
    const d=await h.get("/api/admin/reminders");
    if(Array.isArray(d))setReminders(d);
  }
  async function doneReminder(id:string){
    await h.post("/api/admin/reminders",{action:"done",id});
    const d=await h.get("/api/admin/reminders");
    if(Array.isArray(d))setReminders(d);
  }
  async function deleteReminder(id:string){
    await h.post("/api/admin/reminders",{action:"delete",id});
    const d=await h.get("/api/admin/reminders");
    if(Array.isArray(d))setReminders(d);
  }

  const today=new Date().toISOString().slice(0,10);
  const overdueReminders=reminders.filter(r=>!r.done&&r.dueDate<today);
  const upcoming=reminders.filter(r=>!r.done&&r.dueDate>=today);

  return (
    <div>
      {/* Proposal Tracker */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        <MiniStat label="Proposals" value={data.pipeline.byStage.proposal||0} accent="#f59e0b" sub="sent"/>
        <MiniStat label="Won" value={data.pipeline.byStage.won||0} accent="#22c55e"/>
        <MiniStat label="Lost" value={data.pipeline.byStage.lost||0} accent="#ef4444"/>
      </div>

      {/* Follow-up Reminders */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <SectionTitle style={{margin:0}}>
          Follow-up Reminders{overdueReminders.length>0&&<span style={{marginLeft:6,fontSize:10,color:"#ef4444",fontWeight:800}}>⚠️ {overdueReminders.length} overdue</span>}
        </SectionTitle>
        <button onClick={()=>setShowReminders(!showReminders)} style={{fontSize:11,color:"#00d4ff",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>{showReminders?"Hide":"+ Add"}</button>
      </div>

      {showReminders&&(
        <Card style={{marginBottom:12,padding:14}}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <input placeholder="Lead Name *" value={rForm.name} onChange={e=>setRForm(f=>({...f,name:e.target.value}))} style={miniInputStyle}/>
              <input placeholder="Phone" value={rForm.phone} onChange={e=>setRForm(f=>({...f,phone:e.target.value}))} style={miniInputStyle}/>
            </div>
            <input placeholder="Note" value={rForm.note} onChange={e=>setRForm(f=>({...f,note:e.target.value}))} style={miniInputStyle}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8}}>
              <input type="date" value={rForm.dueDate} onChange={e=>setRForm(f=>({...f,dueDate:e.target.value}))} style={miniInputStyle}/>
              <button onClick={addReminder} style={{padding:"11px 16px",borderRadius:10,background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</button>
            </div>
          </div>
        </Card>
      )}

      {reminders.filter(r=>!r.done).length>0&&(
        <Card style={{marginBottom:20}}>
          {[...overdueReminders,...upcoming].map((r,i)=>{
            const overdue=r.dueDate<today;
            return (
              <Row key={r.id} border={i>0}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                    <Name>{r.name}</Name>
                    {overdue&&<span style={{fontSize:9,fontWeight:800,color:"#ef4444",background:"rgba(239,68,68,0.1)",padding:"1px 6px",borderRadius:4}}>OVERDUE</span>}
                  </div>
                  {r.note&&<Sub>{r.note}</Sub>}
                  <Sub style={{color:overdue?"#ef4444":"rgba(255,255,255,0.3)"}}>Due {r.dueDate}</Sub>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>doneReminder(r.id)} style={{fontSize:11,color:"#22c55e",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:7,padding:"4px 9px",cursor:"pointer",fontWeight:700}}>✓</button>
                  <button onClick={()=>deleteReminder(r.id)} style={{fontSize:12,color:"rgba(255,255,255,0.2)",background:"none",border:"none",cursor:"pointer"}}>✕</button>
                </div>
              </Row>
            );
          })}
        </Card>
      )}

      {/* Pipeline header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <SectionTitle style={{margin:0}}>Sales Pipeline</SectionTitle>
        <button onClick={()=>setAdding(!adding)} style={{padding:"8px 14px",borderRadius:10,background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add Lead</button>
      </div>

      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:16}}>
        {STAGES.map(s=>(
          <div key={s.id} style={{flexShrink:0,padding:"8px 12px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:`1px solid ${s.color}33`,textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:800,color:s.color}}>{data.pipeline.byStage[s.id]||0}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {adding&&(
        <Card style={{marginBottom:16,padding:16}}>
          <p style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 12px"}}>New Lead</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[["Name *","name","text"],["Company","company","text"],["Email","email","email"],["Phone","phone","tel"],["Service","service","text"],["Deal Value ($)","value","number"]].map(([label,key,type])=>(
              <input key={key} type={type} placeholder={label as string} value={(form as any)[key as string]} onChange={e=>setForm(f=>({...f,[key as string]:e.target.value}))} style={miniInputStyle}/>
            ))}
            <select value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))} style={miniInputStyle}>
              {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div style={{display:"flex",gap:8}}>
              <button onClick={addLead} style={{flex:1,padding:"10px",borderRadius:10,background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</button>
              <button onClick={()=>setAdding(false)} style={{flex:1,padding:"10px",borderRadius:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontSize:13,cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        </Card>
      )}

      {STAGES.filter(s=>pipeline.some(l=>l.stage===s.id)).map(s=>(
        <div key={s.id} style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:s.color}}/>
            <span style={{fontSize:11,fontWeight:700,color:s.color,textTransform:"uppercase",letterSpacing:"0.1em"}}>{s.label}</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>({pipeline.filter(l=>l.stage===s.id).length})</span>
          </div>
          <Card>
            {pipeline.filter(l=>l.stage===s.id).map((lead,i)=>{
              const score=scoreLead(lead);
              return (
                <div key={lead.id} style={{padding:"14px 16px",borderTop:i>0?"1px solid rgba(255,255,255,0.05)":"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                        <Name style={{margin:0}}>{lead.name}</Name>
                        <ScoreBadge score={score}/>
                      </div>
                      <Sub>{[lead.company,lead.service].filter(Boolean).join(" · ")}</Sub>
                      {lead.phone&&<Sub style={{color:"#22c55e"}}>📞 {lead.phone}</Sub>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      {lead.value>0&&<div style={{fontSize:14,fontWeight:700,color:"#22c55e",marginBottom:4}}>${lead.value.toLocaleString()}</div>}
                      <button onClick={()=>deleteLead(lead.id)} style={{fontSize:11,color:"rgba(255,255,255,0.2)",background:"none",border:"none",cursor:"pointer",padding:0}}>✕</button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {STAGES.filter(st=>st.id!==lead.stage).map(st=>(
                      <button key={st.id} onClick={()=>moveStage(lead.id,st.id)} disabled={moving===lead.id}
                        style={{padding:"4px 10px",borderRadius:6,background:`${st.color}18`,border:`1px solid ${st.color}44`,color:st.color,fontSize:10,fontWeight:700,cursor:"pointer"}}>
                        → {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      ))}
      {pipeline.length===0&&<EmptyState>No leads in pipeline yet. Add one above.</EmptyState>}
    </div>
  );
}

// ── Finances Tab ──────────────────────────────────────────────────────────────
function FinancesTab({data,token}:{data:any;token:string}) {
  const inv=data.invoices;
  const months=Object.entries(inv.revenueByMonth??{}).sort(([a],[b])=>a.localeCompare(b));
  const maxRev=Math.max(...months.map(([,v])=>v as number),1);
  const list:any[]=inv.list??[];
  const [showQI,setShowQI]=useState(false);
  const [qi,setQi]=useState({customerName:"",customerEmail:"",serviceName:"",amount:"",notes:""});
  const [qiStatus,setQiStatus]=useState<{ok:boolean;msg:string}|null>(null);
  const [qiLoading,setQiLoading]=useState(false);

  async function sendQuickInvoice(){
    if(!qi.customerName||!qi.customerEmail||!qi.amount)return;
    setQiLoading(true);setQiStatus(null);
    try{
      const res=await fetch("/api/admin/invoice/generate",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({...qi,total:Number(qi.amount)})});
      const d=await res.json();
      if(d.ok)setQiStatus({ok:true,msg:`✅ Invoice sent to ${qi.customerEmail}`});
      else setQiStatus({ok:false,msg:`❌ ${d.error||"Failed"}`});
    }catch(e:any){setQiStatus({ok:false,msg:`❌ ${e.message}`});}
    finally{setQiLoading(false);}
  }

  return (
    <div>
      <SectionTitle>Financial Overview</SectionTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <BigStatCard label="Total Collected" value={`$${(inv.totalRevenue||0).toLocaleString()}`} accent="#22c55e" icon="💵"/>
        <BigStatCard label="MRR" value={`$${(inv.mrr||0).toLocaleString()}`} accent="#00d4ff" icon="↻" sub="monthly recurring"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <BigStatCard label="Outstanding" value={`$${(inv.outstanding||0).toLocaleString()}`} accent="#f59e0b" icon="⏳"/>
        <BigStatCard label="This Month" value={`$${(inv.monthRevenue||0).toLocaleString()}`} accent="#7c3aed" icon="📅"/>
      </div>

      {/* Quick Invoice */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <SectionTitle style={{margin:0}}>Quick Invoice</SectionTitle>
        <button onClick={()=>setShowQI(!showQI)} style={{fontSize:11,color:"#00d4ff",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>{showQI?"Hide":"+ Create"}</button>
      </div>
      {showQI&&(
        <Card style={{padding:16,marginBottom:24}}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <input placeholder="Client Name *" value={qi.customerName} onChange={e=>setQi(f=>({...f,customerName:e.target.value}))} style={miniInputStyle}/>
              <input placeholder="Client Email *" type="email" value={qi.customerEmail} onChange={e=>setQi(f=>({...f,customerEmail:e.target.value}))} style={miniInputStyle}/>
            </div>
            <input placeholder="Service Name" value={qi.serviceName} onChange={e=>setQi(f=>({...f,serviceName:e.target.value}))} style={miniInputStyle}/>
            <input placeholder="Amount ($) *" type="number" value={qi.amount} onChange={e=>setQi(f=>({...f,amount:e.target.value}))} style={miniInputStyle}/>
            <textarea placeholder="Notes (optional)" value={qi.notes} onChange={e=>setQi(f=>({...f,notes:e.target.value}))} style={{...miniInputStyle,height:64,resize:"none"}}/>
            <button onClick={sendQuickInvoice} disabled={qiLoading} style={{padding:"11px",borderRadius:10,background:qiLoading?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:qiLoading?"not-allowed":"pointer"}}>
              {qiLoading?"Sending…":"📄 Send Invoice"}
            </button>
            {qiStatus&&<div style={{padding:"10px 14px",borderRadius:10,background:qiStatus.ok?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${qiStatus.ok?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`,fontSize:13,color:qiStatus.ok?"#22c55e":"#ef4444"}}>{qiStatus.msg}</div>}
          </div>
        </Card>
      )}

      {months.length>0&&(<>
        <SectionTitle>Revenue — Last 6 Months</SectionTitle>
        <Card style={{padding:"20px 16px",marginBottom:24}}>
          <div style={{display:"flex",alignItems:"flex-end",gap:8,height:80}}>
            {months.map(([month,value])=>(
              <div key={month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,height:"100%"}}>
                <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end",width:"100%"}}>
                  <div style={{background:"linear-gradient(180deg,#00d4ff,#7c3aed)",borderRadius:"4px 4px 0 0",height:`${((value as number)/maxRev)*100}%`,minHeight:(value as number)>0?4:0}}/>
                </div>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>{month.slice(5)}</span>
                {(value as number)>0&&<span style={{fontSize:9,color:"#00d4ff",fontWeight:700}}>${(value as number).toLocaleString()}</span>}
              </div>
            ))}
          </div>
        </Card>
      </>)}

      <SectionTitle>Invoice History ({list.length})</SectionTitle>
      <Card>
        {list.length>0?list.map((inv:any,i:number)=>(
          <Row key={inv.invoiceNumber} border={i>0}>
            <div>
              <Name>{inv.customerName}</Name>
              <Sub>{inv.serviceName} · #{inv.invoiceNumber}</Sub>
              <Sub>{inv.sentAt?new Date(inv.sentAt).toLocaleDateString():""}</Sub>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:15,fontWeight:700,color:"#00d4ff",marginBottom:4}}>${inv.total.toLocaleString()}</div>
              <InvoiceStatusBadge status={inv.status}/>
            </div>
          </Row>
        )):<EmptyState>No invoices sent yet</EmptyState>}
      </Card>
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({data,token,onRefresh}:{data:any;token:string;onRefresh:()=>void}) {
  const [adding,setAdding]=useState(false);
  const [form,setForm]=useState({title:"",clientName:"",dueDate:"",priority:"medium"});
  const tasks:any[]=data.tasks.all??[];
  const open=tasks.filter(t=>!t.done);
  const done=tasks.filter(t=>t.done);

  async function addTask(){if(!form.title)return;await fetch("/api/admin/tasks",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"add",...form})});setForm({title:"",clientName:"",dueDate:"",priority:"medium"});setAdding(false);onRefresh();}
  async function toggle(id:string){await fetch("/api/admin/tasks",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"toggle",id})});onRefresh();}
  async function del(id:string){await fetch("/api/admin/tasks",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"delete",id})});onRefresh();}

  const today=new Date().toISOString().slice(0,10);
  const PRIORITY_COLOR:Record<string,string>={high:"#ef4444",medium:"#f59e0b",low:"#22c55e"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <SectionTitle style={{margin:0}}>Tasks ({open.length} open)</SectionTitle>
        <button onClick={()=>setAdding(!adding)} style={{padding:"8px 14px",borderRadius:10,background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add Task</button>
      </div>
      {adding&&(<Card style={{marginBottom:16,padding:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input placeholder="Task description *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} style={miniInputStyle}/>
          <input placeholder="Client name (optional)" value={form.clientName} onChange={e=>setForm(f=>({...f,clientName:e.target.value}))} style={miniInputStyle}/>
          <input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} style={miniInputStyle}/>
          <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={miniInputStyle}>
            <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
          </select>
          <div style={{display:"flex",gap:8}}>
            <button onClick={addTask} style={{flex:1,padding:10,borderRadius:10,background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add Task</button>
            <button onClick={()=>setAdding(false)} style={{flex:1,padding:10,borderRadius:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontSize:13,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      </Card>)}
      <Card style={{marginBottom:20}}>
        {open.length>0?open.map((task,i)=>{
          const overdue=task.dueDate&&task.dueDate<today;
          return (<Row key={task.id} border={i>0}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",flex:1}}>
              <button onClick={()=>toggle(task.id)} style={{width:22,height:22,borderRadius:6,border:`2px solid ${PRIORITY_COLOR[task.priority]}`,background:"none",cursor:"pointer",flexShrink:0,marginTop:1}}/>
              <div style={{flex:1}}>
                <Name>{task.title}</Name>
                {task.clientName&&<Sub>👤 {task.clientName}</Sub>}
                {task.dueDate&&<Sub style={{color:overdue?"#ef4444":"rgba(255,255,255,0.3)"}}>{overdue?"⚠️ Overdue · ":"Due "}{task.dueDate}</Sub>}
              </div>
            </div>
            <button onClick={()=>del(task.id)} style={{fontSize:12,color:"rgba(255,255,255,0.2)",background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0}}>✕</button>
          </Row>);
        }):<EmptyState>No open tasks 🎉</EmptyState>}
      </Card>
      {done.length>0&&(<><SectionTitle>Completed ({done.length})</SectionTitle><Card>
        {done.map((task,i)=>(<Row key={task.id} border={i>0} style={{opacity:0.45}}>
          <div style={{display:"flex",gap:12,alignItems:"center",flex:1}}>
            <div style={{width:22,height:22,borderRadius:6,border:"2px solid #22c55e",background:"#22c55e22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#22c55e",flexShrink:0}}>✓</div>
            <Name style={{textDecoration:"line-through"}}>{task.title}</Name>
          </div>
          <button onClick={()=>del(task.id)} style={{fontSize:12,color:"rgba(255,255,255,0.2)",background:"none",border:"none",cursor:"pointer"}}>✕</button>
        </Row>))}
      </Card></>)}
    </div>
  );
}

// ── Convos Tab ────────────────────────────────────────────────────────────────
function ConvosTab({data}:{data:any}) {
  const [filter,setFilter]=useState<"all"|"iris"|"lauren">("all");
  const [expanded,setExpanded]=useState<string|null>(null);
  const irisConvs:any[]=data.conversations?.iris??[];
  const laurenConvs:any[]=data.conversations?.lauren??[];
  const allConvs=[...irisConvs.map((c:any)=>({...c,_source:"iris"})),...laurenConvs.map((c:any)=>({...c,_source:"lauren"}))].sort((a,b)=>b.date>a.date?1:-1);
  const visible=allConvs.filter(c=>filter==="all"||c._source===filter);
  const sourceColor=(s:string)=>s==="iris"?"#7c3aed":"#e64dff";
  const sourceLabel=(s:string)=>s==="iris"?"IRIS":"Lauren";

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        <MiniStat label="IRIS Chats" value={irisConvs.length} accent="#7c3aed"/>
        <MiniStat label="Lauren Calls" value={laurenConvs.length} accent="#e64dff"/>
        <MiniStat label="Chat Leads" value={data.chat?.totalLeads??0} accent="#00d4ff"/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {(["all","iris","lauren"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 16px",borderRadius:20,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:filter===f?(f==="iris"?"#7c3aed":f==="lauren"?"#e64dff":"#00d4ff"):"rgba(255,255,255,0.06)",color:filter===f?"#fff":"rgba(255,255,255,0.4)",textTransform:"capitalize"}}>{f==="all"?`All (${allConvs.length})`:f==="iris"?`IRIS (${irisConvs.length})`:`Lauren (${laurenConvs.length})`}</button>
        ))}
      </div>
      <Card>
        {visible.length===0?<EmptyState>No conversations yet</EmptyState>:visible.map((c:any,i:number)=>{
          const id=c.id||String(i); const isOpen=expanded===id;
          const msgs:any[]=c.messages??[];
          const preview=msgs.find((m:any)=>m.role==="user")?.content??"";
          const hasLead=c.hasLead||!!c.lead;
          return (
            <div key={id} style={{borderTop:i>0?"1px solid rgba(255,255,255,0.05)":"none"}}>
              <div onClick={()=>setExpanded(isOpen?null:id)} style={{padding:"14px 16px",cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.12em",padding:"2px 8px",borderRadius:6,background:`${sourceColor(c._source)}22`,color:sourceColor(c._source)}}>{sourceLabel(c._source)}</span>
                      {hasLead&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,background:"rgba(34,197,94,0.12)",color:"#22c55e"}}>LEAD</span>}
                      {c.lead?.name&&<span style={{fontSize:12,color:"rgba(255,255,255,0.6)",fontWeight:600}}>{c.lead.name}</span>}
                    </div>
                    <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.35)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{String(preview).slice(0,80)}</p>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <Sub>{c.date?new Date(c.date).toLocaleDateString():""}</Sub>
                    <Sub style={{color:"rgba(255,255,255,0.2)"}}>{msgs.length} msg{msgs.length!==1?"s":""}</Sub>
                    <div style={{fontSize:14,color:"rgba(255,255,255,0.2)",marginTop:2}}>{isOpen?"▲":"▼"}</div>
                  </div>
                </div>
              </div>
              {isOpen&&(<div style={{padding:"0 16px 16px",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                {c.lead&&(<div style={{padding:"10px 14px",borderRadius:10,background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.15)",marginBottom:12}}>
                  <p style={{margin:0,fontSize:11,color:"#22c55e",fontWeight:700,letterSpacing:"0.1em",marginBottom:4}}>LEAD CAPTURED</p>
                  <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.6)"}}>{c.lead.name} · {c.lead.company}{c.lead.phone?` · ${c.lead.phone}`:""}</p>
                </div>)}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {msgs.filter((m:any)=>m.role!=="system").map((m:any,mi:number)=>(
                    <div key={mi} style={{display:"flex",justifyContent:m.role==="user"||m.role==="caller"?"flex-end":"flex-start"}}>
                      <div style={{maxWidth:"80%",padding:"9px 12px",borderRadius:12,background:m.role==="user"||m.role==="caller"?"rgba(0,212,255,0.12)":"rgba(255,255,255,0.05)",border:`1px solid ${m.role==="user"||m.role==="caller"?"rgba(0,212,255,0.2)":"rgba(255,255,255,0.07)"}`}}>
                        <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:3,textTransform:"uppercase",fontWeight:700,letterSpacing:"0.1em"}}>{m.role==="user"||m.role==="caller"?(c._source==="lauren"?"Caller":"Visitor"):(c._source==="lauren"?"Lauren":"IRIS")}</p>
                        <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>{String(m.content).slice(0,500)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>)}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────
function ActivityTab({data}:{data:any}) {
  const events:any[]=data.activity??[];
  return (
    <div>
      <SectionTitle>Activity Feed</SectionTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        <MiniStat label="Conversations" value={data.chat.totalConversations} accent="#7c3aed"/>
        <MiniStat label="Chat Leads" value={data.chat.totalLeads} accent="#00d4ff"/>
        <MiniStat label="Lauren Calls" value={data.lauren.totalCalls} accent="#e64dff"/>
      </div>
      <Card>
        {events.length>0?events.map((e,i)=>(
          <Row key={e.id} border={i>0}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:36,height:36,borderRadius:10,background:activityBg(e.type),display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{activityIcon(e.type)}</div>
              <div><Name>{e.title}</Name><Sub>{e.detail}</Sub>{e.amount>0&&<Sub style={{color:"#22c55e",fontWeight:700}}>${e.amount.toLocaleString()}</Sub>}</div>
            </div>
            <Sub style={{flexShrink:0,marginLeft:8}}>{timeAgo(e.createdAt)}</Sub>
          </Row>
        )):<EmptyState>No activity recorded yet.</EmptyState>}
      </Card>
    </div>
  );
}

// ── Lauren Tab ────────────────────────────────────────────────────────────────
function LaurenTab({data,token,h}:{data:any;token:string;h:ReturnType<typeof useAdminApi>}) {
  const leads:any[]=data.leads?.recent??[];
  const [phone,setPhone]=useState(""); const [name,setName]=useState(""); const [company,setCompany]=useState(""); const [challenge,setChallenge]=useState("");
  const [calling,setCalling]=useState(false); const [result,setResult]=useState<{ok:boolean;message:string}|null>(null);
  const [callLog,setCallLog]=useState<any[]>([]);
  const [showLog,setShowLog]=useState(false);
  const [expandedCall,setExpandedCall]=useState<string|null>(null);
  const [schedMode,setSchedMode]=useState(false);
  const [schedDate,setSchedDate]=useState(""); const [schedTime,setSchedTime]=useState("");
  const [schedStatus,setSchedStatus]=useState<string|null>(null);

  useEffect(()=>{h.get("/api/admin/call-log").then(d=>{if(Array.isArray(d))setCallLog(d);});},[]);

  function fillFromLead(lead:any){setPhone(lead.phone||"");setName(lead.name||"");setCompany(lead.company||"");setChallenge(lead.challenge||"");setResult(null);}

  async function dial(){
    if(!phone)return; setCalling(true);setResult(null);
    try{
      const res=await fetch("/api/call",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({phone,name:name||"there",company:company||"your business",challenge})});
      const d=await res.json();
      if(d.ok)setResult({ok:true,message:`✅ Lauren is calling ${phone}. SID: ${d.callSid}`});
      else setResult({ok:false,message:`❌ ${d.error||"Call failed"}`});
    }catch(e:any){setResult({ok:false,message:`❌ ${e.message}`});}
    finally{setCalling(false);}
  }

  async function scheduleCall(){
    if(!phone||!schedDate||!schedTime)return;
    const scheduledFor=`${schedDate}T${schedTime}:00`;
    const log=await h.post("/api/admin/reminders",{action:"add",name:name||phone,phone,company,note:`Scheduled Lauren call: ${challenge||"(no context)"}`,dueDate:schedDate});
    setSchedStatus(`✅ Follow-up reminder set for ${schedDate} at ${schedTime}. Lauren will call when you trigger from the reminder.`);
  }

  const accent="#e64dff";
  const sectionStyle:React.CSSProperties={background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:20,marginBottom:16};
  const labelStyle:React.CSSProperties={fontSize:11,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:6,display:"block"};
  const inp:React.CSSProperties={...miniInputStyle,marginBottom:0};

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
        <div style={{width:36,height:36,borderRadius:10,background:`${accent}15`,border:`1px solid ${accent}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎙️</div>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>Lauren — AI Voice Agent</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Dial any lead. Lauren handles the conversation.</div>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={()=>setSchedMode(false)} style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:!schedMode?"linear-gradient(135deg,#e64dff,#7c3aed)":"rgba(255,255,255,0.04)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>📞 Call Now</button>
        <button onClick={()=>setSchedMode(true)} style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:schedMode?"linear-gradient(135deg,#e64dff,#7c3aed)":"rgba(255,255,255,0.04)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗓️ Schedule</button>
      </div>

      <div style={sectionStyle}>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:accent,marginBottom:16}}>{schedMode?"🗓️ Schedule a Call":"📞 Place a Call"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><label style={labelStyle}>Phone Number *</label><input style={inp} placeholder="+18321234567" value={phone} onChange={e=>{setPhone(e.target.value);setResult(null);}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={labelStyle}>Name</label><input style={inp} placeholder="Lead Name" value={name} onChange={e=>setName(e.target.value)}/></div>
            <div><label style={labelStyle}>Company</label><input style={inp} placeholder="Business" value={company} onChange={e=>setCompany(e.target.value)}/></div>
          </div>
          <div><label style={labelStyle}>Context / Challenge</label><input style={inp} placeholder="What Lauren should know" value={challenge} onChange={e=>setChallenge(e.target.value)}/></div>
          {schedMode&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={labelStyle}>Date</label><input type="date" style={inp} value={schedDate} onChange={e=>setSchedDate(e.target.value)}/></div>
            <div><label style={labelStyle}>Time</label><input type="time" style={inp} value={schedTime} onChange={e=>setSchedTime(e.target.value)}/></div>
          </div>)}
          <button onClick={schedMode?scheduleCall:dial} disabled={calling||!phone} style={{padding:"13px 20px",borderRadius:11,border:"none",fontWeight:700,fontSize:14,cursor:calling||!phone?"not-allowed":"pointer",background:calling||!phone?"rgba(255,255,255,0.05)":`linear-gradient(135deg,${accent},#7c3aed)`,color:"#fff"}}>
            {schedMode?"🗓️ Set Reminder":(calling?"⏳ Dialing…":"📞 Have Lauren Call Now")}
          </button>
          {result&&<div style={{padding:"12px 16px",borderRadius:10,background:result.ok?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${result.ok?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`,fontSize:13,color:result.ok?"#22c55e":"#ef4444"}}>{result.message}</div>}
          {schedStatus&&<div style={{padding:"12px 16px",borderRadius:10,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",fontSize:13,color:"#22c55e"}}>{schedStatus}</div>}
        </div>
      </div>

      {/* Quick dial */}
      {leads.filter((l:any)=>l.phone).length>0&&(
        <div style={sectionStyle}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:14}}>⚡ Quick Dial</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {leads.filter((l:any)=>l.phone).slice(0,10).map((lead:any,i:number)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{lead.name||"Unknown"}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{lead.company||""} · {lead.phone}</div>
                </div>
                <button onClick={()=>fillFromLead(lead)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${accent}40`,background:`${accent}10`,color:accent,fontSize:12,fontWeight:700,cursor:"pointer"}}>Fill →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={sectionStyle}>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:14}}>📈 Call Stats</div>
        <div style={{fontSize:28,fontWeight:800,color:accent}}>{data.lauren?.totalCalls??0}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:4}}>Total calls placed by Lauren</div>
      </div>

      {/* Call Log */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <SectionTitle style={{margin:0}}>Call History ({callLog.length})</SectionTitle>
        <button onClick={()=>setShowLog(!showLog)} style={{fontSize:11,color:"#00d4ff",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>{showLog?"Hide":"Show"}</button>
      </div>
      {showLog&&(
        <Card>
          {callLog.length>0?callLog.slice(0,30).map((c:any,i:number)=>{
            const callId=c.callSid||String(i);
            const isOpen=expandedCall===callId;
            const transcript:any[]=Array.isArray(c.transcript)?c.transcript:[];
            return (
              <div key={i} style={{borderTop:i>0?"1px solid rgba(255,255,255,0.05)":"none"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",cursor:transcript.length>0?"pointer":"default"}} onClick={()=>transcript.length>0&&setExpandedCall(isOpen?null:callId)}>
                  <div>
                    <Name>{c.name||c.to||"Unknown"}</Name>
                    <Sub>{c.company||""}{c.company&&c.challenge?" · ":""}{c.challenge||""}</Sub>
                    <Sub>{c.loggedAt?new Date(c.loggedAt).toLocaleString():""}</Sub>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <div style={{textAlign:"right"}}>
                      <span style={{fontSize:10,fontWeight:700,color:c.status==="completed"?"#22c55e":c.status==="busy"||c.status==="no-answer"?"#f59e0b":"#64748b",textTransform:"uppercase"}}>{c.status||"placed"}</span>
                      <Sub>{transcript.length>0?`${transcript.length} turns`:`${c.messages||0} msgs`}</Sub>
                    </div>
                    {transcript.length>0&&<span style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>{isOpen?"▲":"▼"}</span>}
                  </div>
                </div>
                {isOpen&&transcript.length>0&&(
                  <div style={{padding:"0 16px 16px",display:"flex",flexDirection:"column",gap:8}}>
                    {transcript.map((msg:any,mi:number)=>{
                      const isLauren=msg.role==="assistant";
                      return (
                        <div key={mi} style={{display:"flex",flexDirection:"column",alignItems:isLauren?"flex-start":"flex-end"}}>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:isLauren?"#e64dff":"#00d4ff",marginBottom:3}}>{isLauren?"Lauren":"Caller"}</div>
                          <div style={{maxWidth:"85%",padding:"9px 13px",borderRadius:isLauren?"4px 12px 12px 12px":"12px 4px 12px 12px",background:isLauren?"rgba(230,77,255,0.08)":"rgba(0,212,255,0.08)",border:`1px solid ${isLauren?"rgba(230,77,255,0.2)":"rgba(0,212,255,0.2)"}`,fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.5}}>{msg.content}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }):<EmptyState>No call history yet</EmptyState>}
        </Card>
      )}
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({data}:{data:any}) {
  const leads:any[]=data.leads?.recent??[];
  const convos:any[]=data.conversations?.iris??[];
  const bookings:any[]=data.bookings?.upcomingList??[];
  const pastBookings:any[]=data.bookings?.pastList??[];
  const allBookings=[...bookings,...pastBookings];
  const visitors=data.visitors?.total||0;
  const totalLeads=data.overview?.totalLeads||0;
  const totalBookings=allBookings.length;
  const won=data.pipeline?.byStage?.won||0;

  // Funnel
  const funnelSteps=[
    {label:"Visitors",value:visitors,color:"#00d4ff"},
    {label:"Leads",value:totalLeads,color:"#7c3aed"},
    {label:"Bookings",value:totalBookings,color:"#f59e0b"},
    {label:"Won",value:won,color:"#22c55e"},
  ];
  const funnelMax=Math.max(visitors,1);

  // Lead source breakdown
  const sourceMap:Record<string,number>={};
  leads.forEach((l:any)=>{const s=l.source||"direct";sourceMap[s]=(sourceMap[s]||0)+1;});
  const sourcePairs=Object.entries(sourceMap).sort(([,a],[,b])=>b-a);
  const sourceMax=Math.max(...sourcePairs.map(([,v])=>v),1);
  const SOURCE_COLORS:Record<string,string>={chat:"#7c3aed",form:"#00d4ff",booking:"#22c55e",ebook:"#f59e0b",direct:"#64748b",call:"#e64dff"};

  // Best day/time
  const dayMap:Record<number,number>={};
  const hourMap:Record<number,number>={};
  leads.forEach((l:any)=>{
    const d=new Date(l.capturedAt||0);
    if(!isNaN(d.getTime())){dayMap[d.getDay()]=(dayMap[d.getDay()]||0)+1;hourMap[d.getHours()]=(hourMap[d.getHours()]||0)+1;}
  });
  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const bestDay=Object.entries(dayMap).sort(([,a],[,b])=>b-a)[0];
  const bestHour=Object.entries(hourMap).sort(([,a],[,b])=>b-a)[0];
  const dayMax=Math.max(...Object.values(dayMap),1);

  // IRIS performance
  const totalIrisConvos=convos.length;
  const irisWithLeads=convos.filter((c:any)=>c.hasLead||c.lead).length;
  const avgMsgs=totalIrisConvos>0?Math.round(convos.reduce((s:number,c:any)=>(c.messages?.length||0)+s,0)/totalIrisConvos):0;
  const irisConvRate=totalIrisConvos>0?Math.round((irisWithLeads/totalIrisConvos)*100):0;

  return (
    <div>
      {/* Conversion Funnel */}
      <SectionTitle>Conversion Funnel</SectionTitle>
      <Card style={{padding:20,marginBottom:24}}>
        {funnelSteps.map((step,i)=>{
          const pct=funnelMax>0?Math.round((step.value/funnelMax)*100):0;
          const convRate=i>0&&funnelSteps[i-1].value>0?Math.round((step.value/funnelSteps[i-1].value)*100):null;
          return (
            <div key={step.label} style={{marginBottom:i<funnelSteps.length-1?16:0}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:700,color:step.color}}>{step.label}</span>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  {convRate!==null&&<span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>↓ {convRate}% from prev</span>}
                  <span style={{fontSize:13,fontWeight:800,color:step.color}}>{step.value.toLocaleString()}</span>
                </div>
              </div>
              <div style={{height:8,borderRadius:4,background:"rgba(255,255,255,0.05)"}}>
                <div style={{height:"100%",borderRadius:4,background:step.color,width:`${pct}%`,transition:"width 0.6s"}}/>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Lead Source Breakdown */}
      <SectionTitle>Lead Sources</SectionTitle>
      <Card style={{padding:16,marginBottom:24}}>
        {sourcePairs.length>0?sourcePairs.map(([src,count])=>{
          const pct=Math.round((count/sourceMax)*100);
          const color=SOURCE_COLORS[src]||"#64748b";
          return (
            <div key={src} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.6)",textTransform:"capitalize"}}>{src}</span>
                <span style={{fontSize:12,fontWeight:700,color}}>{count} lead{count!==1?"s":""}</span>
              </div>
              <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.05)"}}>
                <div style={{height:"100%",borderRadius:3,background:color,width:`${pct}%`}}/>
              </div>
            </div>
          );
        }):<EmptyState>No lead source data yet</EmptyState>}
      </Card>

      {/* Best day/time */}
      <SectionTitle>Best Day to Get Leads</SectionTitle>
      <Card style={{padding:16,marginBottom:24}}>
        {Object.values(dayMap).some(v=>v>0)?(
          <>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {days.map((d,i)=>{
                const count=dayMap[i]||0;
                const pct=dayMax>0?(count/dayMax)*100:0;
                return (
                  <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{width:"100%",height:48,borderRadius:6,background:"rgba(255,255,255,0.04)",display:"flex",flexDirection:"column",justifyContent:"flex-end",overflow:"hidden"}}>
                      <div style={{background:pct===100?"#22c55e":"#00d4ff",height:`${pct}%`,minHeight:count>0?3:0,borderRadius:"3px 3px 0 0",transition:"height 0.5s"}}/>
                    </div>
                    <span style={{fontSize:8,color:pct===100?"#22c55e":"rgba(255,255,255,0.3)",fontWeight:pct===100?800:400}}>{d}</span>
                    {count>0&&<span style={{fontSize:8,color:"rgba(255,255,255,0.3)"}}>{count}</span>}
                  </div>
                );
              })}
            </div>
            {bestDay&&<p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.5)",textAlign:"center"}}>Best day: <span style={{color:"#22c55e",fontWeight:700}}>{days[Number(bestDay[0])]}</span> · Best hour: <span style={{color:"#00d4ff",fontWeight:700}}>{bestHour?`${bestHour[0]}:00`:"-"}</span></p>}
          </>
        ):<EmptyState>Not enough lead data for day/time analysis yet</EmptyState>}
      </Card>

      {/* IRIS Performance */}
      <SectionTitle>IRIS Performance</SectionTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <BigStatCard label="Total Chats" value={totalIrisConvos} accent="#7c3aed" icon="💬"/>
        <BigStatCard label="Leads Captured" value={irisWithLeads} accent="#00d4ff" icon="🎯"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <MiniStat label="Conv. Rate" value={`${irisConvRate}%`} accent={irisConvRate>20?"#22c55e":irisConvRate>10?"#f59e0b":"#ef4444"} sub="chats → leads"/>
        <MiniStat label="Avg Messages" value={avgMsgs} accent="#a78bfa" sub="per conversation"/>
      </div>
    </div>
  );
}

// ── Calendar Tab ──────────────────────────────────────────────────────────────
function CalendarTab({data}:{data:any}) {
  const [viewDate,setViewDate]=useState(new Date());
  const upcoming:any[]=data.bookings?.upcomingList??[];
  const past:any[]=data.bookings?.pastList??[];
  const all=[...upcoming,...past];

  const y=viewDate.getFullYear(); const m=viewDate.getMonth();
  const firstDay=new Date(y,m,1).getDay();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const monthStr=`${y}-${String(m+1).padStart(2,"0")}`;
  const monthName=viewDate.toLocaleDateString("en-US",{month:"long",year:"numeric"});

  const bookingsByDate:Record<string,any[]>={};
  all.forEach((b:any)=>{
    const dateKey=b.date||"";
    if(dateKey.startsWith(monthStr)||(b.bookingDate||"").startsWith(monthStr)){
      const k=dateKey||b.bookingDate;
      if(!bookingsByDate[k])bookingsByDate[k]=[];
      bookingsByDate[k].push(b);
    }
  });

  const today=new Date(); const todayStr=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const cells:Array<{day:number|null;dateStr:string}>=[];
  for(let i=0;i<firstDay;i++)cells.push({day:null,dateStr:""});
  for(let d=1;d<=daysInMonth;d++)cells.push({day:d,dateStr:`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`});

  const [selected,setSelected]=useState<string|null>(null);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={()=>setViewDate(new Date(y,m-1,1))} style={{padding:"7px 12px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontSize:16,cursor:"pointer"}}>←</button>
        <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{monthName}</span>
        <button onClick={()=>setViewDate(new Date(y,m+1,1))} style={{padding:"7px 12px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontSize:16,cursor:"pointer"}}>→</button>
      </div>

      <Card style={{padding:12,marginBottom:20}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
            <div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.25)",padding:"4px 0"}}>{d}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {cells.map((cell,i)=>{
            if(!cell.day)return <div key={i}/>;
            const bookings=bookingsByDate[cell.dateStr]||[];
            const isToday=cell.dateStr===todayStr;
            const isSelected=cell.dateStr===selected;
            return (
              <div key={i} onClick={()=>setSelected(isSelected?null:cell.dateStr)} style={{padding:"6px 4px",borderRadius:8,background:isSelected?"rgba(0,212,255,0.15)":isToday?"rgba(255,255,255,0.06)":"none",border:isToday?"1px solid rgba(0,212,255,0.3)":isSelected?"1px solid rgba(0,212,255,0.5)":"1px solid transparent",cursor:bookings.length>0?"pointer":"default",textAlign:"center"}}>
                <div style={{fontSize:11,color:isToday?"#00d4ff":isSelected?"#00d4ff":"rgba(255,255,255,0.6)",fontWeight:isToday?700:400,marginBottom:2}}>{cell.day}</div>
                {bookings.length>0&&<div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",margin:"0 auto"}}/>}
              </div>
            );
          })}
        </div>
      </Card>

      {selected&&bookingsByDate[selected]&&(
        <div style={{marginBottom:20}}>
          <SectionTitle>Bookings on {selected}</SectionTitle>
          <Card>
            {bookingsByDate[selected].map((b:any,i:number)=>(
              <Row key={i} border={i>0}>
                <div><Name>{b.name}</Name><Sub>{b.company||b.service||""}</Sub><Sub>{b.email}</Sub></div>
                <div style={{textAlign:"right"}}><Name style={{color:"#00d4ff"}}>{b.time||""}</Name><Sub>{b.phone||""}</Sub></div>
              </Row>
            ))}
          </Card>
        </div>
      )}

      <SectionTitle>All Upcoming ({upcoming.length})</SectionTitle>
      <Card>
        {upcoming.length>0?upcoming.map((b:any,i:number)=>(
          <Row key={b.id||i} border={i>0}>
            <div><Name>{b.name}</Name><Sub>{b.company}</Sub></div>
            <div style={{textAlign:"right"}}><Name style={{color:"#00d4ff"}}>{b.date}</Name><Sub>{b.time}</Sub></div>
          </Row>
        )):<EmptyState>No upcoming bookings</EmptyState>}
      </Card>
    </div>
  );
}

// ── Website Tab ───────────────────────────────────────────────────────────────
function WebsiteTab({data}:{data:any}) {
  const visitors = data.visitors ?? {};
  const recent: any[] = visitors.recent ?? [];
  const dailyRaw: Record<string,number> = visitors.dailyRaw ?? {};

  // Build last 30 days array
  const days30 = Array.from({length:30},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-i);
    return d.toISOString().slice(0,10);
  }).reverse();

  // Build last 7 days and current month
  const today = new Date().toISOString().slice(0,10);
  const week7 = days30.slice(-7);
  const monthStr = today.slice(0,7);

  const totalToday = dailyRaw[today] ?? 0;
  const totalWeek = week7.reduce((s,d)=>s+(dailyRaw[d]??0),0);
  const totalMonth = Object.entries(dailyRaw).filter(([k])=>k.startsWith(monthStr)).reduce((s,[,v])=>s+v,0);
  const totalAll = visitors.total ?? 0;

  // Bar chart max
  const barMax = Math.max(...days30.map(d=>dailyRaw[d]??0), 1);

  // Top pages
  const pageCounts: Record<string,number> = {};
  for(const v of recent) { const p = v.page||"/"; pageCounts[p]=(pageCounts[p]??0)+1; }
  const topPages = Object.entries(pageCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);

  // Top locations
  const locCounts: Record<string,number> = {};
  for(const v of recent) { const l = v.location||"Unknown"; locCounts[l]=(locCounts[l]??0)+1; }
  const topLocs = Object.entries(locCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Top referrers
  const refCounts: Record<string,number> = {};
  for(const v of recent) { const r = v.referrer||"Direct"; refCounts[r]=(refCounts[r]??0)+1; }
  const topRefs = Object.entries(refCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // VPN stats
  const vpnCount = recent.filter(v=>v.isVpn||v.isDatacenter).length;
  const realCount = recent.filter(v=>!v.isVpn&&!v.isDatacenter).length;

  const [view,setView]=useState<"recent"|"pages"|"locations"|"referrers">("recent");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          {label:"Today",value:totalToday,accent:"#00d4ff",icon:"☀️"},
          {label:"This Week",value:totalWeek,accent:"#7c3aed",icon:"📅"},
          {label:"This Month",value:totalMonth,accent:"#f97316",icon:"📆"},
          {label:"All Time",value:totalAll,accent:"#22c55e",icon:"🌐"},
        ].map(s=>(
          <div key={s.label} style={{padding:"14px 12px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <p style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",margin:0}}>{s.label}</p>
              <span style={{fontSize:14}}>{s.icon}</span>
            </div>
            <p style={{fontSize:"1.4rem",fontWeight:800,color:s.accent,margin:0,lineHeight:1}}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* VPN vs Real */}
      {recent.length>0&&(
        <Card>
          <Row>
            <div style={{flex:1}}>
              <SectionTitle style={{margin:"0 0 10px"}}>Visitor Quality</SectionTitle>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:8,overflow:"hidden",height:10}}>
                  <div style={{height:"100%",background:"linear-gradient(90deg,#22c55e,#00d4ff)",width:`${recent.length>0?(realCount/recent.length)*100:0}%`,transition:"width 0.4s"}}/>
                </div>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",flexShrink:0,minWidth:70}}>{realCount} / {recent.length}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:16,flexShrink:0,marginLeft:16}}>
              <div style={{textAlign:"center"}}>
                <p style={{fontSize:"1.2rem",fontWeight:800,color:"#22c55e",margin:"0 0 2px"}}>{realCount}</p>
                <p style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.25)",margin:0,textTransform:"uppercase",letterSpacing:"0.1em"}}>Real</p>
              </div>
              <div style={{textAlign:"center"}}>
                <p style={{fontSize:"1.2rem",fontWeight:800,color:"#f59e0b",margin:"0 0 2px"}}>{vpnCount}</p>
                <p style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.25)",margin:0,textTransform:"uppercase",letterSpacing:"0.1em"}}>VPN/Bot</p>
              </div>
            </div>
          </Row>
        </Card>
      )}

      {/* 30-day bar chart */}
      <Card>
        <Row><SectionTitle style={{margin:0}}>Daily Visitors — Last 30 Days</SectionTitle></Row>
        <div style={{padding:"0 16px 16px",display:"flex",alignItems:"flex-end",gap:3,height:80}}>
          {days30.map(d=>{
            const val = dailyRaw[d]??0;
            const pct = barMax>0 ? val/barMax : 0;
            const isToday = d===today;
            return(
              <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}} title={`${d}: ${val} visitors`}>
                <div style={{width:"100%",borderRadius:"2px 2px 0 0",background:isToday?"#00d4ff":pct>0?"rgba(0,212,255,0.4)":"rgba(255,255,255,0.05)",height:`${Math.max(pct*56,pct>0?4:2)}px`,transition:"height 0.3s"}}/>
              </div>
            );
          })}
        </div>
        <div style={{padding:"0 16px 10px",display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:10,color:"rgba(255,255,255,0.2)"}}>{days30[0]}</span>
          <span style={{fontSize:10,color:"#00d4ff",fontWeight:700}}>Today: {totalToday}</span>
          <span style={{fontSize:10,color:"rgba(255,255,255,0.2)"}}>{today}</span>
        </div>
      </Card>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6}}>
        {(["recent","pages","locations","referrers"] as const).map(t=>(
          <button key={t} onClick={()=>setView(t)} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${view===t?"#00d4ff":"rgba(255,255,255,0.08)"}`,background:view===t?"rgba(0,212,255,0.08)":"none",color:view===t?"#00d4ff":"rgba(255,255,255,0.35)",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>
            {t==="recent"?"Recent Visitors":t==="pages"?"Top Pages":t==="locations"?"Locations":"Referrers"}
          </button>
        ))}
      </div>

      {/* Recent visitors */}
      {view==="recent" && (
        <Card>
          <Row><SectionTitle style={{margin:0}}>Recent Visitors</SectionTitle><span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>{recent.length} stored</span></Row>
          {recent.length===0
            ? <EmptyState>No visitors recorded yet.</EmptyState>
            : recent.slice(0,40).map((v,i)=>(
              <Row key={i} border={i>0}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                    <Name style={{fontSize:12,margin:0}}>{v.location||"Unknown location"}</Name>
                    {(v.isVpn||v.isDatacenter)&&(
                      <span style={{fontSize:9,fontWeight:700,color:"#f59e0b",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:4,padding:"1px 5px",letterSpacing:"0.08em",flexShrink:0}}>
                        {v.isVpn?"VPN":"DC"}
                      </span>
                    )}
                    {!v.isVpn&&!v.isDatacenter&&v.location!=="Unknown location"&&(
                      <span style={{fontSize:9,fontWeight:700,color:"#22c55e",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:4,padding:"1px 5px",letterSpacing:"0.08em",flexShrink:0}}>REAL</span>
                    )}
                  </div>
                  <Sub>{v.page||"/"} {v.referrer?`· from ${v.referrer}`:""}</Sub>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <p style={{fontSize:10,color:"rgba(255,255,255,0.25)",margin:"0 0 3px"}}>{timeAgo(v.time)}</p>
                  {v.isp&&<p style={{fontSize:10,color:"rgba(255,255,255,0.2)",margin:0}}>{v.isp.slice(0,24)}</p>}
                </div>
              </Row>
            ))}
        </Card>
      )}

      {/* Top pages */}
      {view==="pages" && (
        <Card>
          <Row><SectionTitle style={{margin:0}}>Top Pages</SectionTitle></Row>
          {topPages.length===0
            ? <EmptyState>No page data yet.</EmptyState>
            : topPages.map(([page,count],i)=>{
              const pct = topPages[0][1]>0?count/topPages[0][1]:0;
              return(
                <Row key={i} border={i>0}>
                  <div style={{flex:1,minWidth:0}}>
                    <Name style={{fontSize:12}}>{page}</Name>
                    <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",marginTop:6}}>
                      <div style={{height:"100%",borderRadius:2,background:"#00d4ff",width:`${pct*100}%`}}/>
                    </div>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:"#00d4ff",marginLeft:12,flexShrink:0}}>{count}</span>
                </Row>
              );
            })}
        </Card>
      )}

      {/* Top locations */}
      {view==="locations" && (
        <Card>
          <Row><SectionTitle style={{margin:0}}>Top Locations</SectionTitle></Row>
          {topLocs.length===0
            ? <EmptyState>No location data yet.</EmptyState>
            : topLocs.map(([loc,count],i)=>{
              const pct = topLocs[0][1]>0?count/topLocs[0][1]:0;
              return(
                <Row key={i} border={i>0}>
                  <div style={{flex:1,minWidth:0}}>
                    <Name style={{fontSize:12}}>{loc}</Name>
                    <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",marginTop:6}}>
                      <div style={{height:"100%",borderRadius:2,background:"#7c3aed",width:`${pct*100}%`}}/>
                    </div>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:"#7c3aed",marginLeft:12,flexShrink:0}}>{count}</span>
                </Row>
              );
            })}
        </Card>
      )}

      {/* Top referrers */}
      {view==="referrers" && (
        <Card>
          <Row><SectionTitle style={{margin:0}}>Traffic Sources</SectionTitle></Row>
          {topRefs.length===0
            ? <EmptyState>No referrer data yet.</EmptyState>
            : topRefs.map(([ref,count],i)=>{
              const pct = topRefs[0][1]>0?count/topRefs[0][1]:0;
              return(
                <Row key={i} border={i>0}>
                  <div style={{flex:1,minWidth:0}}>
                    <Name style={{fontSize:12}}>{ref||"Direct / none"}</Name>
                    <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",marginTop:6}}>
                      <div style={{height:"100%",borderRadius:2,background:"#f97316",width:`${pct*100}%`}}/>
                    </div>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:"#f97316",marginLeft:12,flexShrink:0}}>{count}</span>
                </Row>
              );
            })}
        </Card>
      )}
    </div>
  );
}

// ── eBooks Tab ────────────────────────────────────────────────────────────────
function EbooksTab({token,h}:{token:string;h:ReturnType<typeof useAdminApi>}) {
  const [ebooks,setEbooks]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState<any|null>(null);
  const [socialTab,setSocialTab]=useState<"linkedin"|"instagram"|"emails">("linkedin");

  useEffect(()=>{
    h.get("/api/admin/ebooks").then(d=>{
      if(d?.ebooks) setEbooks(d.ebooks);
      setLoading(false);
    });
  },[]);

  if(loading) return <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.3)"}}>Loading eBooks…</div>;

  if(selected) return (
    <div>
      <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer",padding:"0 0 16px",display:"flex",alignItems:"center",gap:6}}>← Back to all eBooks</button>
      <Card style={{marginBottom:14}}>
        <Row><div>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#f97316",margin:"0 0 4px"}}>📖 eBook</p>
          <Name>{selected.title||selected.topic}</Name>
          <Sub>{selected.businessName} · {selected.email}</Sub>
          <Sub>{new Date(selected.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</Sub>
        </div></Row>
      </Card>

      {selected.social ? (
        <div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {(["linkedin","instagram","emails"] as const).map(t=>(
              <button key={t} onClick={()=>setSocialTab(t)} style={{padding:"8px 14px",borderRadius:20,border:`1px solid ${socialTab===t?"#f97316":"rgba(255,255,255,0.08)"}`,background:socialTab===t?"rgba(249,115,22,0.1)":"none",color:socialTab===t?"#f97316":"rgba(255,255,255,0.4)",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>
                {t==="linkedin"?"LinkedIn (5)":t==="instagram"?"Instagram (10)":"Email Drafts (3)"}
              </button>
            ))}
          </div>

          {socialTab==="linkedin" && (selected.social.linkedin??[]).map((p:string,i:number)=>(
            <Card key={i} style={{marginBottom:10}}>
              <Row><div style={{width:"100%"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <p style={{fontSize:10,fontWeight:700,color:"#0077b5",margin:0,letterSpacing:"0.1em",textTransform:"uppercase"}}>Post {i+1}</p>
                  <button onClick={()=>navigator.clipboard.writeText(p)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:11,cursor:"pointer"}}>Copy</button>
                </div>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.7)",margin:0,lineHeight:1.65,whiteSpace:"pre-line"}}>{p}</p>
              </div></Row>
            </Card>
          ))}

          {socialTab==="instagram" && (selected.social.instagram??[]).map((p:string,i:number)=>(
            <Card key={i} style={{marginBottom:10}}>
              <Row><div style={{width:"100%"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <p style={{fontSize:10,fontWeight:700,color:"#e1306c",margin:0,letterSpacing:"0.1em",textTransform:"uppercase"}}>Caption {i+1}</p>
                  <button onClick={()=>navigator.clipboard.writeText(p)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:11,cursor:"pointer"}}>Copy</button>
                </div>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.7)",margin:0,lineHeight:1.65}}>{p}</p>
              </div></Row>
            </Card>
          ))}

          {socialTab==="emails" && (selected.social.emails??[]).map((e:any,i:number)=>(
            <Card key={i} style={{marginBottom:10}}>
              <Row><div style={{width:"100%"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#22c55e",margin:0}}>Subject: {e.subject}</p>
                  <button onClick={()=>navigator.clipboard.writeText(`Subject: ${e.subject}\n\n${e.body}`)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:11,cursor:"pointer"}}>Copy</button>
                </div>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.7)",margin:0,lineHeight:1.65,whiteSpace:"pre-line"}}>{e.body}</p>
              </div></Row>
            </Card>
          ))}
        </div>
      ):(
        <Card><EmptyState>Social content not available for this eBook — was generated before the social pipeline was added.</EmptyState></Card>
      )}
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <SectionTitle style={{margin:0}}>All Generated eBooks</SectionTitle>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{ebooks.length} total</span>
      </div>
      <Card>
        {ebooks.length===0
          ? <EmptyState>No eBooks generated yet. The form on the website will populate this.</EmptyState>
          : ebooks.map((eb,i)=>(
            <Row key={i} border={i>0} style={{cursor:"pointer"}} onClick={()=>{setSelected(eb);setSocialTab("linkedin");}}>
              <div style={{flex:1,minWidth:0}}>
                <Name style={{fontSize:12}}>{eb.title||eb.topic}</Name>
                <Sub>{eb.businessName} · {eb.email}</Sub>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <p style={{fontSize:10,color:"rgba(255,255,255,0.25)",margin:"0 0 4px"}}>{new Date(eb.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</p>
                {eb.social
                  ? <span style={{fontSize:9,fontWeight:700,color:"#22c55e",letterSpacing:"0.1em",textTransform:"uppercase"}}>✓ Social</span>
                  : <span style={{fontSize:9,color:"rgba(255,255,255,0.2)"}}>No social</span>}
              </div>
            </Row>
          ))}
      </Card>
    </div>
  );
}

// ── Ads Tab ───────────────────────────────────────────────────────────────────
function AdsTab({token}:{token:string}) {
  const accent="#f59e0b";
  const platforms=["linkedin","facebook","instagram"] as const;
  type Platform=typeof platforms[number];

  const [audience,setAudience]=useState("");
  const [goal,setGoal]=useState("book a free strategy call");
  const [tone,setTone]=useState("professional");
  const [generating,setGenerating]=useState(false);
  const [ads,setAds]=useState<Record<Platform,any[]>>({linkedin:[],facebook:[],instagram:[]});
  const [activePlatform,setActivePlatform]=useState<Platform>("linkedin");
  const [copiedKey,setCopiedKey]=useState<string|null>(null);
  const [savedPacks,setSavedPacks]=useState<any[]>([]);
  const [showSaved,setShowSaved]=useState(false);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    const saved=localStorage.getItem("cc360_ad_packs");
    if(saved) try{setSavedPacks(JSON.parse(saved));}catch{}
  },[]);

  async function generate(){
    if(!audience.trim()){setError("Enter a target audience first.");return;}
    setError(null); setGenerating(true); setAds({linkedin:[],facebook:[],instagram:[]});
    try{
      const res=await fetch("/api/admin/generate-ads",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-admin-token":token},
        body:JSON.stringify({audience,goal,tone}),
      });
      const d=await res.json();
      if(!res.ok){setError(d.error||"Generation failed.");return;}
      setAds(d.ads);
      // Save pack to localStorage
      const pack={id:Date.now(),audience,goal,tone,ads:d.ads,createdAt:new Date().toISOString()};
      const updated=[pack,...savedPacks].slice(0,20);
      setSavedPacks(updated);
      localStorage.setItem("cc360_ad_packs",JSON.stringify(updated));
    }catch(e:any){setError(e.message);}
    finally{setGenerating(false);}
  }

  function copy(text:string,key:string){
    navigator.clipboard.writeText(text).then(()=>{
      setCopiedKey(key);
      setTimeout(()=>setCopiedKey(null),2000);
    });
  }

  function copyAll(platform:Platform){
    const items=ads[platform];
    if(!items.length)return;
    const text=items.map((ad,i)=>`--- Variation ${i+1} ---\n${Object.entries(ad).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join("\n")}`).join("\n\n");
    copy(text,`all-${platform}`);
  }

  const platformConfig={
    linkedin:{icon:"💼",color:"#0077b5",label:"LinkedIn",charLimits:{headline:"150 chars",body:"700 chars",cta:""}},
    facebook:{icon:"📘",color:"#1877f2",label:"Facebook",charLimits:{headline:"40 chars",primary_text:"125 chars",description:"30 chars",cta:""}},
    instagram:{icon:"📸",color:"#e1306c",label:"Instagram",charLimits:{caption:"2200 chars",hook:"125 chars",hashtags:""}},
  };

  const inp:React.CSSProperties={width:"100%",padding:"11px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:13,outline:"none",fontFamily:"system-ui,sans-serif"};
  const sectionStyle:React.CSSProperties={background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:20,marginBottom:16};
  const labelStyle:React.CSSProperties={fontSize:11,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:6,display:"block"};

  const currentAds=ads[activePlatform];
  const pc=platformConfig[activePlatform];

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
        <div style={{width:36,height:36,borderRadius:10,background:`${accent}15`,border:`1px solid ${accent}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎯</div>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>AI Ad Generator</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Create LinkedIn, Facebook & Instagram ads in seconds</div>
        </div>
      </div>

      {/* Input form */}
      <div style={sectionStyle}>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:accent,marginBottom:16}}>⚙️ Campaign Brief</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <label style={labelStyle}>Target Audience *</label>
            <input style={inp} placeholder='e.g. "Houston restaurant owners who miss calls after hours"' value={audience} onChange={e=>{setAudience(e.target.value);setError(null);}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={labelStyle}>Campaign Goal</label>
              <select style={{...inp,cursor:"pointer"}} value={goal} onChange={e=>setGoal(e.target.value)}>
                <option value="book a free strategy call">Book a Free Strategy Call</option>
                <option value="get a free AI quote at cybercraft360.com/intake">Get a Free AI Quote</option>
                <option value="try the free eBook generator">Try Free eBook Generator</option>
                <option value="learn about AI for their business">Learn About AI</option>
                <option value="contact us to discuss AI solutions">Contact Us</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tone</label>
              <select style={{...inp,cursor:"pointer"}} value={tone} onChange={e=>setTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="bold and direct">Bold & Direct</option>
                <option value="conversational and friendly">Conversational</option>
                <option value="urgent and results-focused">Urgent</option>
                <option value="curious and question-led">Question-Led</option>
              </select>
            </div>
          </div>
          {error&&<div style={{padding:"10px 14px",borderRadius:9,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",fontSize:12,color:"#ef4444"}}>{error}</div>}
          <button onClick={generate} disabled={generating} style={{padding:"13px 20px",borderRadius:11,border:"none",fontWeight:700,fontSize:14,cursor:generating?"not-allowed":"pointer",background:generating?"rgba(255,255,255,0.05)":`linear-gradient(135deg,${accent},#ef4444)`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {generating?<><span style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite",display:"inline-block"}}/> Generating 3 variations per platform…</>:<>🎯 Generate Ad Pack — All 3 Platforms</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {(currentAds.length>0||ads.facebook.length>0||ads.instagram.length>0)&&(
        <div style={sectionStyle}>
          {/* Platform tabs */}
          <div style={{display:"flex",gap:6,marginBottom:18}}>
            {platforms.map(p=>{
              const cfg=platformConfig[p];
              const hasAds=ads[p].length>0;
              return(
                <button key={p} onClick={()=>setActivePlatform(p)} style={{flex:1,padding:"9px 6px",borderRadius:10,border:`1px solid ${activePlatform===p?cfg.color+"60":"rgba(255,255,255,0.07)"}`,background:activePlatform===p?`${cfg.color}15`:"rgba(255,255,255,0.02)",color:activePlatform===p?cfg.color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  <span>{cfg.icon}</span>{cfg.label}{hasAds&&<span style={{fontSize:9,background:`${cfg.color}20`,border:`1px solid ${cfg.color}30`,color:cfg.color,padding:"1px 5px",borderRadius:4}}>3</span>}
                </button>
              );
            })}
          </div>

          {/* Copy all */}
          {currentAds.length>0&&(
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>3 variations · {pc.label} · ready to paste</div>
              <button onClick={()=>copyAll(activePlatform)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${pc.color}40`,background:`${pc.color}10`,color:pc.color,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {copiedKey===`all-${activePlatform}`?"✓ Copied!":"📋 Copy All"}
              </button>
            </div>
          )}

          {/* Ad variations */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {currentAds.map((ad:any,i:number)=>(
              <div key={i} style={{borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.015)",overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,0.02)"}}>
                  <span style={{fontSize:11,fontWeight:700,color:pc.color,letterSpacing:"0.1em",textTransform:"uppercase"}}>Variation {i+1}</span>
                  <button onClick={()=>{
                    const text=Object.entries(ad).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join("\n");
                    copy(text,`ad-${i}`);
                  }} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${pc.color}30`,background:`${pc.color}10`,color:pc.color,fontSize:10,fontWeight:700,cursor:"pointer"}}>
                    {copiedKey===`ad-${i}`?"✓ Copied":"Copy"}
                  </button>
                </div>
                <div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
                  {Object.entries(ad).map(([field,value])=>(
                    <div key={field}>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",marginBottom:4}}>{field.replace(/_/g," ")}</div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.6,background:"rgba(255,255,255,0.02)",borderRadius:8,padding:"9px 12px",border:"1px solid rgba(255,255,255,0.05)",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                        {String(value)}
                      </div>
                      <button onClick={()=>copy(String(value),`field-${i}-${field}`)} style={{marginTop:4,padding:"3px 8px",borderRadius:5,border:"1px solid rgba(255,255,255,0.06)",background:"none",color:"rgba(255,255,255,0.2)",fontSize:10,cursor:"pointer"}}>
                        {copiedKey===`field-${i}-${field}`?"✓ Copied":"Copy field"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved packs */}
      {savedPacks.length>0&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Saved Ad Packs ({savedPacks.length})</span>
            <button onClick={()=>setShowSaved(!showSaved)} style={{fontSize:11,color:accent,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>{showSaved?"Hide":"Show"}</button>
          </div>
          {showSaved&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {savedPacks.map((pack:any)=>(
                <div key={pack.id} onClick={()=>{setAds(pack.ads);setAudience(pack.audience);setGoal(pack.goal);setTone(pack.tone);setShowSaved(false);}} style={{padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)",cursor:"pointer"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#fff",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pack.audience}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{pack.goal} · {new Date(pack.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Card({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){return <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,overflow:"hidden",...style}}>{children}</div>;}
function Row({children,border,style}:{children:React.ReactNode;border?:boolean;style?:React.CSSProperties}){return <div style={{padding:"14px 16px",borderTop:border?"1px solid rgba(255,255,255,0.05)":"none",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,...style}}>{children}</div>;}
function BigStatCard({label,value,accent,icon,sub}:{label:string;value:string|number;accent:string;icon:string;sub?:string}){return(<div style={{padding:"18px 16px",borderRadius:16,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><p style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",margin:0}}>{label}</p><span style={{fontSize:18}}>{icon}</span></div><p style={{fontSize:"1.5rem",fontWeight:800,color:accent,margin:sub?"0 0 3px":0,lineHeight:1}}>{value}</p>{sub&&<p style={{fontSize:10,color:"rgba(255,255,255,0.25)",margin:0}}>{sub}</p>}</div>);}
function MiniStat({label,value,accent,sub}:{label:string;value:string|number;accent:string;sub?:string}){return(<div style={{padding:"14px 12px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}><p style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",margin:"0 0 6px"}}>{label}</p><p style={{fontSize:"1.3rem",fontWeight:800,color:accent,margin:sub?"0 0 3px":0,lineHeight:1}}>{value}</p>{sub&&<p style={{fontSize:9,color:"rgba(255,255,255,0.25)",margin:0}}>{sub}</p>}</div>);}
function SectionTitle({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){return <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",margin:"0 0 10px",...style}}>{children}</p>;}
function Name({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){return <p style={{fontSize:13,fontWeight:600,color:"#fff",margin:"0 0 2px",...style}}>{children}</p>;}
function Sub({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){return <p style={{fontSize:11,color:"rgba(255,255,255,0.35)",margin:"0 0 2px",...style}}>{children}</p>;}
function EmptyState({children}:{children:React.ReactNode}){return <p style={{padding:"28px 20px",textAlign:"center",fontSize:13,color:"rgba(255,255,255,0.25)",margin:0,lineHeight:1.6}}>{children}</p>;}
function Btn({children,onClick,style}:{children:React.ReactNode;onClick?:()=>void;style?:React.CSSProperties}){return <button onClick={onClick} style={{padding:"7px 12px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontSize:12,cursor:"pointer",...style}}>{children}</button>;}
function InvoiceStatusBadge({status}:{status:string}){const map:Record<string,{color:string;label:string}>={sent:{color:"#f59e0b",label:"Sent"},paid:{color:"#22c55e",label:"Paid"},overdue:{color:"#ef4444",label:"Overdue"},cancelled:{color:"#64748b",label:"Cancelled"}};const s=map[status]??{color:"#64748b",label:status};return <span style={{fontSize:10,fontWeight:700,color:s.color,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</span>;}
function Spinner({inline}:{inline?:boolean}){return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:inline?undefined:"100dvh",background:inline?undefined:"#080a10"}}><div style={{width:32,height:32,borderRadius:"50%",border:"2px solid rgba(0,212,255,0.3)",borderTopColor:"#00d4ff",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);}

function activityIcon(type:string){return({lead:"🎯",booking:"📅",invoice:"📄",call:"📞",cancellation:"❌",payment:"💵"} as any)[type]??"🔔";}
function activityBg(type:string){return({lead:"rgba(0,212,255,0.08)",booking:"rgba(34,197,94,0.08)",invoice:"rgba(124,58,237,0.08)",call:"rgba(230,77,255,0.08)",payment:"rgba(34,197,94,0.12)"} as any)[type]??"rgba(255,255,255,0.04)";}
function timeAgo(iso:string){const diff=Date.now()-new Date(iso).getTime();if(diff<60000)return"just now";if(diff<3600000)return`${Math.floor(diff/60000)}m ago`;if(diff<86400000)return`${Math.floor(diff/3600000)}h ago`;return`${Math.floor(diff/86400000)}d ago`;}

const miniInputStyle:React.CSSProperties={width:"100%",padding:"11px 14px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:14,outline:"none"};

// ── Follow-Ups Tab ────────────────────────────────────────────────────────────
function FollowUpsTab({token}:{token:string}) {
  const [leads,setLeads]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [acting,setActing]=useState<string|null>(null);
  const [msg,setMsg]=useState("");
  const [qualifying,setQualifying]=useState<string|null>(null);
  const [qualifications,setQualifications]=useState<Record<string,any>>({});

  const load=async()=>{
    setLoading(true);
    const r=await fetch("/api/admin/follow-ups",{headers:{"x-admin-token":token}}).catch(()=>null);
    if(r?.ok){const d=await r.json();setLeads(d.due||[]);}
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  async function callLead(lead:any){
    if(!lead.phone){setMsg("No phone number for this lead.");return;}
    setActing(lead.name+lead.company); setMsg("");
    const r=await fetch("/api/admin/follow-ups",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"call",phone:lead.phone,name:lead.name,company:lead.company,challenge:lead.challenge})}).catch(()=>null);
    const d=await r?.json().catch(()=>({}));
    setMsg(d?.ok?`✅ Lauren is calling ${lead.name||"the lead"} now.`:`❌ ${d?.error||"Call failed."}`);
    setActing(null); load();
  }
  async function markDone(lead:any){
    setActing(lead.name+lead.company);
    await fetch("/api/admin/follow-ups",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"mark-done",leadName:lead.name,leadCompany:lead.company})}).catch(()=>null);
    setActing(null); load();
  }

  const scoreColor=(s:number)=>s>=70?"#22c55e":s>=40?"#f59e0b":"#ef4444";

  async function qualify(lead:any){
    const key=lead.name+lead.company;
    setQualifying(key);
    const r=await fetch("/api/admin/qualify-lead",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify(lead)}).catch(()=>null);
    const d=await r?.json().catch(()=>({}));
    if(d?.qualification) setQualifications(prev=>({...prev,[key]:d.qualification}));
    setQualifying(null);
  }

  return(
    <div style={{paddingTop:8}}>
      <SectionHeader icon="🔁" title="Automated Follow-Ups" sub="Leads that need a call — sorted by score. One click has Lauren dial them."/>
      {msg&&<div style={{padding:"10px 14px",borderRadius:10,background:msg.startsWith("✅")?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${msg.startsWith("✅")?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`,color:msg.startsWith("✅")?"#22c55e":"#ef4444",fontSize:13,marginBottom:14}}>{msg}</div>}
      {loading?<Spinner inline/>:leads.length===0?<EmptyState>🎉 No overdue follow-ups right now</EmptyState>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {leads.map(l=>{
            const key=l.name+l.company;
            const score=l.score??0;
            const isActing=acting===key;
            const age=l.capturedAt?Math.floor((Date.now()-new Date(l.capturedAt).getTime())/3600000):0;
            return(
              <div key={key} style={{padding:"14px 16px",borderRadius:14,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{l.name||"Unknown"}</span>
                      <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:`${scoreColor(score)}22`,color:scoreColor(score)}}>Score {score}</span>
                      <span style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{age}h ago</span>
                    </div>
                    {l.company&&<p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"0 0 4px"}}>{l.company}</p>}
                    {l.phone&&<p style={{fontSize:11,color:"rgba(0,212,255,0.6)",margin:"0 0 4px"}}>{l.phone}</p>}
                    {l.challenge&&<p style={{fontSize:11,color:"rgba(255,255,255,0.35)",margin:0,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{l.challenge}</p>}
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>qualify(l)} disabled={qualifying===key} style={{padding:"8px 10px",borderRadius:9,border:"1px solid rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.07)",color:"#a78bfa",fontSize:12,fontWeight:700,cursor:"pointer",opacity:qualifying===key?0.5:1}}>{qualifying===key?"…":"🧠"}</button>
                    <button onClick={()=>callLead(l)} disabled={isActing||!l.phone} style={{padding:"8px 12px",borderRadius:9,border:"none",background:l.phone?"linear-gradient(135deg,#e64dff,#7c3aed)":"rgba(255,255,255,0.05)",color:"#fff",fontSize:12,fontWeight:700,cursor:l.phone?"pointer":"not-allowed",opacity:isActing?0.6:1}}>{isActing?"…":"📞 Call"}</button>
                    <button onClick={()=>markDone(l)} disabled={isActing} style={{padding:"8px 12px",borderRadius:9,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer"}}>✓</button>
                  </div>
                </div>
                {qualifications[key]&&<QualificationCard q={qualifications[key]}/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Competitor Intelligence Tab ───────────────────────────────────────────────
function CompetitorTab({token}:{token:string}) {
  const [competitors,setCompetitors]=useState<any[]>([]);
  const [mentions,setMentions]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [seeding,setSeeding]=useState(false);
  const [scanning,setScanning]=useState(false);
  const [name,setName]=useState(""); const [website,setWebsite]=useState(""); const [notes,setNotes]=useState("");
  const [adding,setAdding]=useState(false); const [expanded,setExpanded]=useState<string|null>(null);
  const [reanalyzing,setReanalyzing]=useState<string|null>(null);
  const [showAdd,setShowAdd]=useState(false);

  const api=(body:any)=>fetch("/api/admin/competitors",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify(body)}).catch(()=>null);

  const load=async()=>{
    setLoading(true);
    const r=await fetch("/api/admin/competitors",{headers:{"x-admin-token":token}}).catch(()=>null);
    if(r?.ok){const d=await r.json();setCompetitors(d.competitors||[]);}
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  async function autoSeed(){
    setSeeding(true);
    const r=await api({action:"auto-seed"});
    const d=await r?.json().catch(()=>({}));
    if(d?.competitors)setCompetitors(d.competitors);
    setSeeding(false);
  }
  async function scanLeads(){
    setScanning(true);
    const r=await api({action:"scan-leads"});
    const d=await r?.json().catch(()=>({}));
    setMentions(d?.mentions||[]);
    setScanning(false);
  }
  async function add(){
    if(!name.trim())return;
    setAdding(true);
    await api({action:"add",name:name.trim(),website:website.trim(),notes:notes.trim()});
    setName(""); setWebsite(""); setNotes(""); setAdding(false); setShowAdd(false); load();
  }
  async function reanalyze(id:string){
    setReanalyzing(id);
    await api({action:"re-analyze",id});
    setReanalyzing(null); load();
  }
  async function del(id:string){
    await api({action:"delete",id});
    load();
  }

  const getMentionCount=(id:string)=>mentions.find(m=>m.competitorId===id)?.count||0;

  return(
    <div style={{paddingTop:8}}>
      <SectionHeader icon="🕵️" title="Competitor Intelligence" sub="AI-powered — auto-discovers competitors, scans your leads for mentions, refreshes analysis every Monday."/>

      {/* Automation action bar */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
        <button onClick={autoSeed} disabled={seeding} style={{padding:"13px 10px",borderRadius:12,border:"1px solid rgba(230,77,255,0.25)",background:"rgba(230,77,255,0.06)",color:seeding?"rgba(255,255,255,0.3)":"#e64dff",fontWeight:700,fontSize:12,cursor:seeding?"not-allowed":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <span style={{fontSize:20}}>{seeding?"⏳":"🤖"}</span>
          <span>{seeding?"Discovering…":"Auto-Discover"}</span>
          <span style={{fontSize:10,fontWeight:400,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>AI finds your top competitors</span>
        </button>
        <button onClick={scanLeads} disabled={scanning} style={{padding:"13px 10px",borderRadius:12,border:"1px solid rgba(0,212,255,0.25)",background:"rgba(0,212,255,0.06)",color:scanning?"rgba(255,255,255,0.3)":"#00d4ff",fontWeight:700,fontSize:12,cursor:scanning?"not-allowed":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <span style={{fontSize:20}}>{scanning?"⏳":"🔍"}</span>
          <span>{scanning?"Scanning…":"Scan Leads"}</span>
          <span style={{fontSize:10,fontWeight:400,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>Find mentions in your leads</span>
        </button>
      </div>

      {/* Mention results */}
      {mentions.length>0&&(
        <div style={{padding:"12px 14px",borderRadius:12,background:"rgba(0,212,255,0.04)",border:"1px solid rgba(0,212,255,0.12)",marginBottom:18}}>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(0,212,255,0.6)",margin:"0 0 8px"}}>🔍 Lead & Call Mentions</p>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {mentions.map(m=>(
              <div key={m.competitorId} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>{m.competitorName}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{m.leads.slice(0,3).join(", ")}{m.leads.length>3?` +${m.leads.length-3} more`:""}</span>
                  <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(239,68,68,0.15)",color:"#ef4444"}}>{m.count}×</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cron status note */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,padding:"8px 12px",borderRadius:10,background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.1)"}}>
        <span style={{fontSize:12}}>🔄</span>
        <p style={{fontSize:11,color:"rgba(34,197,94,0.6)",margin:0}}>Auto re-analysis runs every Monday 8am — all competitor intelligence stays fresh automatically.</p>
      </div>

      {/* Manual add toggle */}
      <div style={{marginBottom:16}}>
        <button onClick={()=>setShowAdd(!showAdd)} style={{padding:"9px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",fontWeight:600}}>
          {showAdd?"✕ Cancel":"＋ Add Competitor Manually"}
        </button>
      </div>
      {showAdd&&(
        <div style={{padding:"16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:20}}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Competitor name *" style={miniInputStyle}/>
            <input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="Website (optional)" style={miniInputStyle}/>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What do you know about them?" rows={2} style={{...miniInputStyle,resize:"vertical"}}/>
            <button onClick={add} disabled={adding||!name.trim()} style={{padding:"11px",borderRadius:10,border:"none",background:adding||!name.trim()?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#00d4ff,#7c3aed)",color:"#fff",fontWeight:700,fontSize:13,cursor:adding||!name.trim()?"not-allowed":"pointer"}}>
              {adding?"Analyzing…":"⚡ Add & Analyze"}
            </button>
          </div>
        </div>
      )}

      {loading?<Spinner inline/>:competitors.length===0?(
        <EmptyState>No competitors tracked yet. Hit Auto-Discover and let AI do the work.</EmptyState>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {competitors.map(c=>{
            const isOpen=expanded===c.id;
            const a=c.analysis;
            const mentionCount=getMentionCount(c.id);
            return(
              <div key={c.id} style={{borderRadius:14,background:"rgba(255,255,255,0.02)",border:`1px solid ${mentionCount>0?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.07)"}`,overflow:"hidden"}}>
                <div onClick={()=>setExpanded(isOpen?null:c.id)} style={{padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,color:"#fff",fontSize:14}}>{c.name}</span>
                      {c.autoSeeded&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:20,background:"rgba(230,77,255,0.1)",color:"#e64dff",letterSpacing:"0.1em",textTransform:"uppercase"}}>Auto</span>}
                      {mentionCount>0&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(239,68,68,0.12)",color:"#ef4444"}}>{mentionCount} mention{mentionCount!==1?"s":""}</span>}
                    </div>
                    {c.website&&<p style={{fontSize:11,color:"rgba(0,212,255,0.45)",margin:"2px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.website}</p>}
                    {a&&<p style={{fontSize:11,color:"rgba(255,255,255,0.3)",margin:"3px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.positioning}</p>}
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    <button onClick={e=>{e.stopPropagation();reanalyze(c.id);}} disabled={reanalyzing===c.id} style={{padding:"5px 9px",borderRadius:7,border:"1px solid rgba(0,212,255,0.2)",background:"rgba(0,212,255,0.05)",color:"#00d4ff",fontSize:11,cursor:"pointer"}}>{reanalyzing===c.id?"…":"↻"}</button>
                    <button onClick={e=>{e.stopPropagation();del(c.id);}} style={{padding:"5px 9px",borderRadius:7,border:"1px solid rgba(239,68,68,0.2)",background:"none",color:"rgba(239,68,68,0.5)",fontSize:11,cursor:"pointer"}}>✕</button>
                    <span style={{color:"rgba(255,255,255,0.25)",fontSize:12}}>{isOpen?"▲":"▼"}</span>
                  </div>
                </div>
                {isOpen&&a&&(
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
                    <IntelCard label="💪 Their Strengths" value={a.likely_strengths} color="#f59e0b"/>
                    <IntelCard label="🎯 Their Weaknesses" value={a.likely_weaknesses} color="#22c55e"/>
                    <IntelCard label="⚡ Your Counter-Angle" value={a.counter_angle} color="#00d4ff" bold/>
                    <div>
                      <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(0,212,255,0.5)",margin:"0 0 6px"}}>📢 Talking Points</p>
                      {(a.talking_points||"").split("\n").filter(Boolean).map((tp:string,i:number)=>(
                        <div key={i} style={{padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",marginBottom:5,fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>• {tp.replace(/^[-•\d.]\s*/,"")}</div>
                      ))}
                    </div>
                    {a.watch_for&&<IntelCard label="👀 Watch For" value={a.watch_for} color="rgba(255,255,255,0.35)"/>}
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.15)",margin:0}}>Last updated {new Date(c.updatedAt).toLocaleDateString()}{c.autoRefreshedAt?" · auto-refreshed":""}</p>
                  </div>
                )}
                {isOpen&&!a&&<div style={{padding:"12px 16px",borderTop:"1px solid rgba(255,255,255,0.06)",fontSize:12,color:"rgba(255,255,255,0.3)"}}>No analysis yet — click ↻</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function IntelCard({label,value,color,bold}:{label:string;value:string;color:string;bold?:boolean}){
  return(
    <div>
      <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",margin:"0 0 5px"}}>{label}</p>
      <p style={{fontSize:12,color,lineHeight:1.6,margin:0,fontWeight:bold?700:400}}>{value}</p>
    </div>
  );
}

// ── ROI Report Tab ────────────────────────────────────────────────────────────
function ROIReportTab({token}:{token:string}) {
  const [form,setForm]=useState({clientName:"",businessName:"",period:"",callsAnswered:"",leadsCaptures:"",hoursSaved:"",appointmentsBooked:"",avgOrderValue:"",missedCallsBefore:"",followUpTimeBefore:""});
  const [generating,setGenerating]=useState(false); const [err,setErr]=useState("");

  function set(k:string,v:string){setForm(f=>({...f,[k]:v}));}

  async function generate(){
    if(!form.clientName.trim()){setErr("Client name is required.");return;}
    setGenerating(true); setErr("");
    try{
      const payload=Object.fromEntries(Object.entries(form).map(([k,v])=>[k,isNaN(Number(v))||v===""?v:Number(v)]));
      const r=await fetch("/api/admin/roi-report",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify(payload)});
      if(!r.ok){const d=await r.json().catch(()=>({}));setErr(d.error||"Failed to generate.");return;}
      const blob=await r.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download=`CyberCraft360-ROI-${form.clientName.replace(/\s/g,"-")}.pdf`; a.click();
      URL.revokeObjectURL(url);
    }catch(e:any){setErr(e.message||"Error.");}
    finally{setGenerating(false);}
  }

  const F=({label,k,placeholder}:{label:string;k:string;placeholder?:string})=>(
    <div>
      <label style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",display:"block",marginBottom:5}}>{label}</label>
      <input value={(form as any)[k]} onChange={e=>set(k,e.target.value)} placeholder={placeholder||""} style={miniInputStyle}/>
    </div>
  );

  return(
    <div style={{paddingTop:8}}>
      <SectionHeader icon="📑" title="ROI Report Generator" sub="Generate a branded PDF you can send to any client showing the value of their AI system."/>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{padding:"16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <SectionTitle style={{marginBottom:12}}>Client Info</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <F label="Client Name *" k="clientName" placeholder="John Smith"/>
            <F label="Business Name" k="businessName" placeholder="Smith HVAC LLC"/>
          </div>
          <div style={{marginTop:10}}>
            <F label="Reporting Period" k="period" placeholder="June 2026"/>
          </div>
        </div>

        <div style={{padding:"16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <SectionTitle style={{marginBottom:12}}>AI Performance Numbers</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <F label="Calls Answered" k="callsAnswered" placeholder="248"/>
            <F label="Leads Captured" k="leadsCaptures" placeholder="62"/>
            <F label="Hours Saved / week" k="hoursSaved" placeholder="14"/>
            <F label="Appointments Booked" k="appointmentsBooked" placeholder="18"/>
          </div>
        </div>

        <div style={{padding:"16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <SectionTitle style={{marginBottom:12}}>Before AI (for comparison)</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <F label="Avg Order Value ($)" k="avgOrderValue" placeholder="320"/>
            <F label="Missed Calls / week (before)" k="missedCallsBefore" placeholder="12"/>
            <F label="Follow-Up Time (hours)" k="followUpTimeBefore" placeholder="42"/>
          </div>
        </div>

        {err&&<p style={{fontSize:12,color:"#ef4444",margin:0}}>{err}</p>}
        <button onClick={generate} disabled={generating} style={{padding:"14px",borderRadius:12,border:"none",background:generating?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#00d4ff,#7c3aed)",color:"#fff",fontWeight:700,fontSize:14,cursor:generating?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {generating?<><div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/> Generating PDF…</>:"📥 Download ROI Report PDF"}
        </button>
      </div>
    </div>
  );
}

// ── Referral Tracker Tab ──────────────────────────────────────────────────────
function ReferralTab({token}:{token:string}) {
  const [referrals,setReferrals]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [clientName,setClientName]=useState(""); const [email,setEmail]=useState(""); const [reward,setReward]=useState("1 month free");
  const [creating,setCreating]=useState(false); const [copied,setCopied]=useState<string|null>(null);
  const [msg,setMsg]=useState("");

  const load=async()=>{
    setLoading(true);
    const r=await fetch("/api/admin/referrals",{headers:{"x-admin-token":token}}).catch(()=>null);
    if(r?.ok){const d=await r.json();setReferrals(d.referrals||[]);}
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  async function create(){
    if(!clientName.trim())return;
    setCreating(true);
    const r=await fetch("/api/admin/referrals",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"create",clientName:clientName.trim(),email:email.trim(),reward:reward.trim()||"1 month free"})}).catch(()=>null);
    const d=await r?.json().catch(()=>({}));
    if(d?.ok){setMsg(`✅ Referral link created for ${clientName}!`);setClientName("");setEmail("");load();}
    else setMsg("❌ Failed to create.");
    setCreating(false);
  }

  function copyLink(code:string){
    const link=`${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(link).then(()=>{setCopied(code);setTimeout(()=>setCopied(null),2000);}).catch(()=>{});
  }

  async function markRewarded(id:string){
    await fetch("/api/admin/referrals",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"mark-rewarded",id})}).catch(()=>null);
    load();
  }
  async function del(id:string){
    await fetch("/api/admin/referrals",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action:"delete",id})}).catch(()=>null);
    load();
  }

  const totalConversions=referrals.reduce((s,r)=>s+(r.referrals?.length||0),0);

  return(
    <div style={{paddingTop:8}}>
      <SectionHeader icon="🤝" title="Referral Tracker" sub="Give clients a unique link — track every referral they send and reward them automatically."/>
      {/* Stats row */}
      {referrals.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
          <MiniStat label="Active Links" value={referrals.length} accent="#00d4ff"/>
          <MiniStat label="Total Referrals" value={totalConversions} accent="#22c55e"/>
          <MiniStat label="Rewarded" value={referrals.filter(r=>r.rewarded).length} accent="#f59e0b"/>
        </div>
      )}
      {msg&&<div style={{padding:"10px 14px",borderRadius:10,background:msg.startsWith("✅")?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${msg.startsWith("✅")?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`,color:msg.startsWith("✅")?"#22c55e":"#ef4444",fontSize:13,marginBottom:14}}>{msg}</div>}

      {/* Create form */}
      <div style={{padding:"16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:20}}>
        <SectionTitle>Create Referral Link</SectionTitle>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Client name *" style={miniInputStyle}/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Client email (optional)" style={miniInputStyle}/>
          <input value={reward} onChange={e=>setReward(e.target.value)} placeholder="Reward (e.g. 1 month free)" style={miniInputStyle}/>
          <button onClick={create} disabled={creating||!clientName.trim()} style={{padding:"11px",borderRadius:10,border:"none",background:creating||!clientName.trim()?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#00d4ff,#7c3aed)",color:"#fff",fontWeight:700,fontSize:13,cursor:creating||!clientName.trim()?"not-allowed":"pointer"}}>
            {creating?"Creating…":"🔗 Generate Link"}
          </button>
        </div>
      </div>

      {loading?<Spinner inline/>:referrals.length===0?<EmptyState>No referral links yet. Create one above.</EmptyState>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[...referrals].reverse().map(r=>{
            const link=`${typeof window!=="undefined"?window.location.origin:"https://cybercraft360.com"}/?ref=${r.code}`;
            return(
              <div key={r.id} style={{padding:"14px 16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:`1px solid ${r.rewarded?"rgba(245,158,11,0.25)":"rgba(255,255,255,0.07)"}`}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{r.clientName}</span>
                      {r.rewarded&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"rgba(245,158,11,0.15)",color:"#f59e0b"}}>Rewarded</span>}
                      <span style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{r.referrals?.length||0} referral{(r.referrals?.length||0)!==1?"s":""}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                      <code style={{fontSize:11,color:"rgba(0,212,255,0.7)",background:"rgba(0,212,255,0.07)",padding:"3px 8px",borderRadius:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200}}>{link}</code>
                      <button onClick={()=>copyLink(r.code)} style={{padding:"4px 9px",borderRadius:7,border:"1px solid rgba(0,212,255,0.2)",background:"rgba(0,212,255,0.05)",color:"#00d4ff",fontSize:11,cursor:"pointer",flexShrink:0}}>{copied===r.code?"✓ Copied":"Copy"}</button>
                    </div>
                    <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",margin:0}}>Reward: {r.reward}</p>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    {!r.rewarded&&(r.referrals?.length||0)>0&&<button onClick={()=>markRewarded(r.id)} style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.05)",color:"#f59e0b",fontSize:11,cursor:"pointer"}}>✓ Reward</button>}
                    <button onClick={()=>del(r.id)} style={{padding:"6px 9px",borderRadius:8,border:"1px solid rgba(239,68,68,0.2)",background:"none",color:"rgba(239,68,68,0.4)",fontSize:11,cursor:"pointer"}}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Qualification Card ────────────────────────────────────────────────────────
function QualificationCard({q}:{q:any}){
  const ratingColor=q.rating==="hot"?"#ef4444":q.rating==="warm"?"#f59e0b":"#64748b";
  const ratingBg=q.rating==="hot"?"rgba(239,68,68,0.08)":q.rating==="warm"?"rgba(245,158,11,0.08)":"rgba(100,116,139,0.08)";
  const priorityColor=q.priority==="call today"?"#ef4444":q.priority==="call this week"?"#f59e0b":"#64748b";
  return(
    <div style={{marginTop:10,padding:"12px 14px",borderRadius:11,background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.15)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#a78bfa"}}>🧠 AI Qualifier</span>
        <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:ratingBg,color:ratingColor,textTransform:"uppercase"}}>{q.rating}</span>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{q.score_out_of_10}/10</span>
        <span style={{fontSize:10,fontWeight:700,color:priorityColor,marginLeft:"auto"}}>{q.priority?.toUpperCase()}</span>
      </div>
      <p style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",margin:"0 0 6px",lineHeight:1.5}}>{q.one_line}</p>
      {q.opening_line&&(
        <div style={{padding:"8px 10px",borderRadius:8,background:"rgba(0,212,255,0.05)",border:"1px solid rgba(0,212,255,0.1)",marginBottom:6}}>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(0,212,255,0.5)",margin:"0 0 3px"}}>Opening line</p>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.7)",margin:0,lineHeight:1.5,fontStyle:"italic"}}>"{q.opening_line}"</p>
        </div>
      )}
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {q.estimated_deal_size&&<p style={{fontSize:11,color:"#22c55e",margin:0,fontWeight:700}}>{q.estimated_deal_size}</p>}
        {q.red_flags&&q.red_flags!=="None"&&<p style={{fontSize:11,color:"#f59e0b",margin:0}}>⚠️ {q.red_flags}</p>}
      </div>
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab({token}:{token:string}){
  const [view,setView]=useState<"reports"|"proposal">("reports");
  const [reports,setReports]=useState<any[]>([]);
  const [loadingReports,setLoadingReports]=useState(true);
  const [expanded,setExpanded]=useState<string|null>(null);
  const [generating,setGenerating]=useState(false);
  const [genErr,setGenErr]=useState("");

  // Proposal form
  const [form,setForm]=useState({clientName:"",businessName:"",industry:"",challenge:"",budget:"",services:"AI phone agent, chatbot, automation",timeline:"4–6 weeks",notes:""});
  const setF=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));

  useEffect(()=>{
    fetch("/api/admin/reports",{headers:{"x-admin-token":token}}).then(r=>r.ok?r.json():null).then(d=>{if(d)setReports(d.reports||[]);}).catch(()=>{}).finally(()=>setLoadingReports(false));
  },[token]);

  async function generateProposal(){
    if(!form.clientName.trim()||!form.challenge.trim()){setGenErr("Client name and challenge are required.");return;}
    setGenerating(true); setGenErr("");
    try{
      const r=await fetch("/api/admin/generate-proposal",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify(form)});
      if(!r.ok){const d=await r.json().catch(()=>({}));setGenErr(d.error||"Failed.");return;}
      const blob=await r.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download=`CyberCraft360-Proposal-${form.clientName.replace(/\s+/g,"-")}.pdf`; a.click();
      URL.revokeObjectURL(url);
    }catch(e:any){setGenErr(e.message||"Error.");}
    finally{setGenerating(false);}
  }

  const F=({label,k,placeholder,rows}:{label:string;k:string;placeholder?:string;rows?:number})=>(
    <div>
      <label style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",display:"block",marginBottom:5}}>{label}</label>
      {rows
        ? <textarea value={(form as any)[k]} onChange={e=>setF(k,e.target.value)} placeholder={placeholder||""} rows={rows} style={{...miniInputStyle,resize:"vertical"}}/>
        : <input value={(form as any)[k]} onChange={e=>setF(k,e.target.value)} placeholder={placeholder||""} style={miniInputStyle}/>
      }
    </div>
  );

  return(
    <div style={{paddingTop:8}}>
      <SectionHeader icon="📬" title="Reports" sub="Weekly AI business reports delivered to your inbox + AI proposal writer."/>

      {/* Toggle */}
      <div style={{display:"flex",gap:6,marginBottom:20,padding:4,borderRadius:12,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
        {(["reports","proposal"] as const).map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:view===v?"rgba(255,255,255,0.08)":"none",color:view===v?"#fff":"rgba(255,255,255,0.35)",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.15s"}}>
            {v==="reports"?"📊 Weekly Reports":"✍️ Proposal Writer"}
          </button>
        ))}
      </div>

      {view==="reports"&&(
        <>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,padding:"8px 12px",borderRadius:10,background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.1)"}}>
            <span style={{fontSize:12}}>🔄</span>
            <p style={{fontSize:11,color:"rgba(34,197,94,0.6)",margin:0}}>Auto-generated every Monday 7am — delivered to cybercraftlimited@gmail.com and saved here.</p>
          </div>
          {loadingReports?<Spinner inline/>:reports.length===0?(
            <EmptyState>No reports yet — first one arrives Monday morning at 7am.</EmptyState>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {reports.map(r=>{
                const isOpen=expanded===r.id;
                const s=r.summary;
                return(
                  <div key={r.id} style={{borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden"}}>
                    <div onClick={()=>setExpanded(isOpen?null:r.id)} style={{padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:"0 0 3px"}}>Week of {r.weekEnding}</p>
                        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                          <span style={{fontSize:11,color:"rgba(0,212,255,0.7)"}}>{s?.new_leads||0} leads</span>
                          <span style={{fontSize:11,color:"rgba(230,77,255,0.7)"}}>{s?.lauren_calls||0} calls</span>
                          <span style={{fontSize:11,color:"rgba(34,197,94,0.7)"}}>${(s?.pipeline_value||0).toLocaleString()} pipeline</span>
                        </div>
                      </div>
                      <span style={{color:"rgba(255,255,255,0.25)",fontSize:12,flexShrink:0}}>{isOpen?"▲":"▼"}</span>
                    </div>
                    {isOpen&&(
                      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"14px 16px"}}>
                        {/* Quick stats */}
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                          {[
                            {l:"New Leads",v:s?.new_leads||0,c:"#00d4ff"},
                            {l:"Hot Leads",v:s?.hot_leads||0,c:"#ef4444"},
                            {l:"Lauren Calls",v:s?.lauren_calls||0,c:"#e64dff"},
                            {l:"Active Clients",v:s?.active_clients||0,c:"#22c55e"},
                            {l:"Pipeline",v:`$${(s?.pipeline_value||0).toLocaleString()}`,c:"#7c3aed"},
                            {l:"Pending $",v:`$${(s?.pending_invoices||0).toLocaleString()}`,c:"#f59e0b"},
                          ].map(x=>(
                            <div key={x.l} style={{padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",textAlign:"center"}}>
                              <p style={{fontSize:"1rem",fontWeight:800,color:x.c,margin:"0 0 2px",lineHeight:1}}>{x.v}</p>
                              <p style={{fontSize:9,color:"rgba(255,255,255,0.25)",margin:0,letterSpacing:"0.08em",textTransform:"uppercase"}}>{x.l}</p>
                            </div>
                          ))}
                        </div>
                        {/* AI Narrative */}
                        <div style={{padding:"12px 14px",borderRadius:11,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                          <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(124,58,237,0.6)",margin:"0 0 8px"}}>🧠 AI Analysis</p>
                          <p style={{fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:1.7,margin:0,whiteSpace:"pre-wrap"}}>{r.narrative}</p>
                        </div>
                        {s?.top_lead&&(
                          <div style={{marginTop:10,padding:"10px 12px",borderRadius:10,background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.15)"}}>
                            <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#f59e0b",margin:"0 0 4px"}}>🔥 Top Lead</p>
                            <p style={{fontSize:12,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{s.top_lead.name} · {s.top_lead.company}</p>
                            <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:0}}>"{s.top_lead.challenge}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {view==="proposal"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{padding:"16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <SectionTitle style={{marginBottom:12}}>Client Details</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <F label="Client Name *" k="clientName" placeholder="John Smith"/>
              <F label="Business Name" k="businessName" placeholder="Smith Plumbing LLC"/>
            </div>
            <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <F label="Industry" k="industry" placeholder="HVAC, Legal, Dental…"/>
              <F label="Budget Range" k="budget" placeholder="$800–$1,200/mo"/>
            </div>
          </div>
          <div style={{padding:"16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <SectionTitle style={{marginBottom:12}}>Their Problem & Our Solution</SectionTitle>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <F label="Their Main Challenge *" k="challenge" placeholder="Missing calls after hours, losing leads to competitors…" rows={3}/>
              <F label="Services We're Proposing" k="services" placeholder="AI phone agent, chatbot, follow-up automation"/>
              <F label="Deployment Timeline" k="timeline" placeholder="4–6 weeks"/>
              <F label="Additional Notes" k="notes" placeholder="Anything else Groq should know about this client" rows={2}/>
            </div>
          </div>
          {genErr&&<p style={{fontSize:12,color:"#ef4444",margin:0}}>{genErr}</p>}
          <button onClick={generateProposal} disabled={generating} style={{padding:"14px",borderRadius:12,border:"none",background:generating?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#00d4ff,#7c3aed)",color:"#fff",fontWeight:700,fontSize:14,cursor:generating?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {generating?<><div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/> Writing proposal…</>:"✍️ Generate Proposal PDF"}
          </button>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.2)",textAlign:"center",margin:0}}>Groq writes a fully custom proposal in your voice — downloads as a branded PDF instantly.</p>
        </div>
      )}
    </div>
  );
}

// ── Reports API route (GET saved reports) ─────────────────────────────────────
// Note: this is a client-side fetch to /api/admin/reports which we need to create

// ── Shared section header ─────────────────────────────────────────────────────
function SectionHeader({icon,title,sub}:{icon:string;title:string;sub:string}){
  return(
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <span style={{fontSize:20}}>{icon}</span>
        <h2 style={{fontSize:"1.05rem",fontWeight:800,color:"#fff",margin:0}}>{title}</h2>
      </div>
      <p style={{fontSize:12,color:"rgba(255,255,255,0.35)",margin:0,lineHeight:1.5}}>{sub}</p>
    </div>
  );
}
