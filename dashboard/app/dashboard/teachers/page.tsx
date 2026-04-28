"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import { MetricCard } from "../../../components/MetricCard";
import styles from "../../../components/dashboard.module.css";

type TeacherStatus = "active" | "invited" | "inactive";
interface Teacher {
  id: number; name: string; code: string; phone: string; email: string;
  subject: string; classes: string[]; studentCount: number; lastActive: string;
  commentsWeek: number; status: TeacherStatus; joinDate: string;
}

const TEACHERS: Teacher[] = [
  { id:1,  name:"Mrs. Anitha Rao",   code:"T001", phone:"+91 98765 43210", email:"anitha@greenfield.edu",  subject:"Mathematics",      classes:["Class 6-A","Class 7-B"],  studentCount:62, lastActive:"Today, 9:14 AM",     commentsWeek:23, status:"active",   joinDate:"2022-06-01" },
  { id:2,  name:"Mr. Sanjay Mehta",  code:"T002", phone:"+91 99001 23456", email:"sanjay@greenfield.edu",  subject:"Science",          classes:["Class 8-A","Class 8-B"],  studentCount:58, lastActive:"Today, 8:45 AM",     commentsWeek:31, status:"active",   joinDate:"2021-07-15" },
  { id:3,  name:"Ms. Deepa Varma",   code:"T003", phone:"+91 77889 00112", email:"deepa@greenfield.edu",   subject:"English",          classes:["Class 9-A","Class 10-A"], studentCount:66, lastActive:"Today, 10:02 AM",    commentsWeek:17, status:"active",   joinDate:"2023-01-10" },
  { id:4,  name:"Mr. Rajan Kumar",   code:"T004", phone:"+91 90011 22334", email:"rajan@greenfield.edu",   subject:"Social Studies",   classes:["Class 6-B","Class 7-A"],  studentCount:60, lastActive:"Yesterday, 4:30 PM", commentsWeek:9,  status:"active",   joinDate:"2020-08-01" },
  { id:5,  name:"Mrs. Kavya Nair",   code:"T005", phone:"+91 88776 55443", email:"kavya@greenfield.edu",   subject:"Hindi",            classes:["Class 11","Class 12"],    studentCount:74, lastActive:"Today, 9:50 AM",     commentsWeek:41, status:"active",   joinDate:"2019-06-12" },
  { id:6,  name:"Mr. Arjun Pillai",  code:"T006", phone:"+91 91234 56789", email:"arjun@greenfield.edu",   subject:"Physics",          classes:["Class 11","Class 12"],    studentCount:74, lastActive:"Today, 11:00 AM",    commentsWeek:28, status:"active",   joinDate:"2022-02-20" },
  { id:7,  name:"Ms. Sunita Kapoor", code:"T007", phone:"+91 87654 32109", email:"sunita@greenfield.edu",  subject:"Chemistry",        classes:["Class 10-A","Class 10-B"],studentCount:64, lastActive:"2 days ago",          commentsWeek:5,  status:"active",   joinDate:"2023-06-05" },
  { id:8,  name:"Mr. Rohan Das",     code:"T008", phone:"+91 96543 21098", email:"rohan@greenfield.edu",   subject:"Computer Science", classes:["Class 8-A"],              studentCount:34, lastActive:"Today, 7:55 AM",     commentsWeek:14, status:"active",   joinDate:"2024-01-08" },
  { id:9,  name:"Ms. Ritu Singh",    code:"",     phone:"+91 88776 11223", email:"ritu@gmail.com",         subject:"Biology",          classes:[],                         studentCount:0,  lastActive:"Never",               commentsWeek:0,  status:"invited",  joinDate:"" },
  { id:10, name:"Mr. Vikram Bose",   code:"",     phone:"+91 79988 77665", email:"vikram@gmail.com",       subject:"Geography",        classes:[],                         studentCount:0,  lastActive:"Never",               commentsWeek:0,  status:"invited",  joinDate:"" },
  { id:11, name:"Ms. Priya Iyer",    code:"",     phone:"+91 94433 55667", email:"",                       subject:"",                 classes:[],                         studentCount:0,  lastActive:"Never",               commentsWeek:0,  status:"inactive", joinDate:"" },
];
const ALL_CLASSES = ["Class 6-A","Class 6-B","Class 7-A","Class 7-B","Class 8-A","Class 8-B","Class 9-A","Class 10-A","Class 10-B","Class 11","Class 12"];
const STATUS_STYLE: Record<TeacherStatus,{c:string;bg:string}> = {
  active:   {c:"#00e09a", bg:"rgba(0,224,154,0.1)"},
  invited:  {c:"#ffb547", bg:"rgba(255,181,71,0.1)"},
  inactive: {c:"rgba(130,170,195,0.4)", bg:"rgba(255,255,255,0.04)"},
};
const fade   = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0} };
const stagger= { hidden:{}, show:{transition:{staggerChildren:0.05}} };

function initials(n:string){return n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();}
function Avatar({name,size=40}:{name:string;size?:number}){
  const cols=["#4f46e5","#0891b2","#059669","#d97706","#7c3aed"];
  const c=cols[name.charCodeAt(0)%cols.length];
  return <div style={{width:size,height:size,borderRadius:size*0.28,background:c+"22",border:`1px solid ${c}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:size*0.33,color:c}}>{initials(name)}</div>;
}
function Pill({status}:{status:TeacherStatus}){
  const s=STATUS_STYLE[status];
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:s.bg,color:s.c,borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:600,textTransform:"capitalize"}}><span style={{width:5,height:5,borderRadius:"50%",background:s.c,display:"inline-block"}}/>{status}</span>;
}
function ClassChip({label}:{label:string}){
  return <span style={{background:"rgba(0,200,232,0.1)",border:"1px solid rgba(0,200,255,0.2)",color:"#00c8e8",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>;
}

function TeacherRow({t,onResend}:{t:Teacher;onResend:(id:number)=>void}){
  const [open,setOpen]=useState(false);
  return (
    <motion.div variants={fade} transition={{duration:0.3}} layout>
      <div onClick={()=>setOpen(v=>!v)} style={{background:"var(--surface)",border:"1px solid var(--stroke)",borderRadius:"var(--radius-md)",padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"border-color 0.2s,background 0.2s"}}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--stroke-bright)";(e.currentTarget as HTMLElement).style.background="var(--surface-raised)"}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--stroke)";(e.currentTarget as HTMLElement).style.background="var(--surface)"}}>
        <Avatar name={t.name}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:2}}>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:"var(--ink)"}}>{t.name}</span>
            {t.code&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--ink-dim)",background:"rgba(255,255,255,0.04)",border:"1px solid var(--stroke)",borderRadius:6,padding:"1px 7px"}}>{t.code}</span>}
          </div>
          <span style={{fontSize:12,color:"var(--ink-soft)"}}>{t.subject||"—"}</span>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",maxWidth:220}}>
          {t.classes.length>0?t.classes.slice(0,2).map(c=><ClassChip key={c} label={c}/>):<span style={{fontSize:12,color:"var(--ink-dim)"}}>No classes</span>}
          {t.classes.length>2&&<span style={{fontSize:11,color:"var(--ink-dim)",padding:"2px 6px",background:"var(--surface-raised)",borderRadius:6}}>+{t.classes.length-2}</span>}
        </div>
        <div style={{textAlign:"center",minWidth:56}}>
          <p style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"var(--brand)",lineHeight:1}}>{t.studentCount}</p>
          <p style={{fontSize:9,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Students</p>
        </div>
        <div style={{textAlign:"center",minWidth:48}}>
          <p style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:"#00e09a",lineHeight:1}}>{t.commentsWeek}</p>
          <p style={{fontSize:9,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Notes</p>
        </div>
        <div style={{textAlign:"right",minWidth:110}}>
          <Pill status={t.status}/>
          <p style={{fontSize:11,color:"var(--ink-dim)",marginTop:4}}>{t.lastActive}</p>
        </div>
        <span style={{color:"var(--ink-dim)",fontSize:11}}>{open?"▲":"▼"}</span>
      </div>
      <AnimatePresence>
        {open&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
            <div style={{background:"rgba(0,200,232,0.03)",border:"1px solid var(--stroke)",borderTop:"none",borderRadius:"0 0 var(--radius-md) var(--radius-md)",padding:"16px 20px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
              <div>
                <p style={{fontSize:10,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>Contact</p>
                <p style={{fontSize:13,color:"var(--ink-soft)",marginBottom:2}}>📱 {t.phone}</p>
                {t.email&&<p style={{fontSize:13,color:"var(--ink-soft)"}}>✉️ {t.email}</p>}
              </div>
              <div>
                <p style={{fontSize:10,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>All Classes</p>
                {t.classes.length>0?t.classes.map(c=><p key={c} style={{fontSize:13,color:"var(--ink-soft)"}}>{c}</p>):<p style={{fontSize:12,color:"var(--ink-dim)"}}>None assigned yet</p>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                {t.status==="invited"&&<button onClick={e=>{e.stopPropagation();onResend(t.id);}} style={{background:"rgba(255,181,71,0.1)",color:"#ffb547",border:"1px solid rgba(255,181,71,0.25)",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>📱 Resend invite SMS</button>}
                {t.status==="active"&&<button style={{background:"rgba(0,200,232,0.08)",color:"var(--brand)",border:"1px solid var(--stroke-bright)",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Assign class</button>}
                {t.joinDate&&<p style={{fontSize:11,color:"var(--ink-dim)"}}>Joined {new Date(t.joinDate).toLocaleDateString("en-IN",{dateStyle:"medium"})}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InvitePanel({onClose}:{onClose:()=>void}){
  const [form,setForm]=useState({name:"",phone:"",email:"",subject:"",classes:[] as string[]});
  const [step,setStep]=useState<"form"|"sent">("form");
  const [link,setLink]=useState("");
  function toggleClass(c:string){setForm(f=>({...f,classes:f.classes.includes(c)?f.classes.filter(x=>x!==c):[...f.classes,c]}));}
  async function send(){
    setStep("sent");
    setLink(`https://app.skippo.co.in/teacher/signup?token=${Math.random().toString(36).slice(2,10)}`);
  }
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,background:"rgba(4,13,20,0.85)",backdropFilter:"blur(10px)",zIndex:100,display:"flex",justifyContent:"flex-end"}} onClick={onClose}>
      <motion.aside initial={{x:420}} animate={{x:0}} exit={{x:420}} transition={{type:"spring",stiffness:320,damping:32}} onClick={e=>e.stopPropagation()} style={{width:440,background:"#071520",borderLeft:"1px solid var(--stroke-bright)",padding:32,display:"flex",flexDirection:"column",gap:20,overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><p style={{fontSize:10,color:"var(--brand)",textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>New teacher</p><h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:700,color:"var(--ink)"}}>Send Invite</h2></div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--ink-dim)",fontSize:20,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        {step==="sent"?(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,textAlign:"center"}}>
            <span style={{fontSize:52}}>✅</span>
            <div><p style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:"#00e09a",marginBottom:8}}>Invite sent!</p><p style={{fontSize:13,color:"var(--ink-soft)",lineHeight:1.7}}>SMS delivered to <strong style={{color:"var(--ink)"}}>{form.phone}</strong> for <strong style={{color:"var(--ink)"}}>{form.name}</strong>.</p></div>
            <div style={{background:"rgba(0,200,232,0.06)",border:"1px solid var(--stroke-bright)",borderRadius:10,padding:14,width:"100%"}}>
              <p style={{fontSize:10,color:"var(--ink-dim)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em"}}>Signup link sent</p>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--brand)",wordBreak:"break-all"}}>{link}</p>
            </div>
            <button onClick={onClose} style={{background:"var(--brand)",color:"#04121a",border:"none",borderRadius:10,padding:"11px 0",fontWeight:800,fontSize:14,cursor:"pointer",width:"100%"}}>Done</button>
          </div>
        ):(
          <>
            {[{label:"Full name *",key:"name",ph:"e.g. Mr. Rajesh Kumar",type:"text"},{label:"Phone number *",key:"phone",ph:"+91 9XXXXXXXXX — SMS invite sent here",type:"tel"},{label:"Email",key:"email",ph:"teacher@school.edu (optional)",type:"email"},{label:"Subject",key:"subject",ph:"e.g. Mathematics, Physics…",type:"text"}].map(f=>(
              <div key={f.key}>
                <label style={{display:"block",fontSize:10,fontWeight:600,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={{width:"100%",background:"var(--surface-raised)",border:"1px solid var(--stroke)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--ink)",outline:"none"}}/>
              </div>
            ))}
            <div>
              <label style={{display:"block",fontSize:10,fontWeight:600,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>Assign classes (optional)</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {ALL_CLASSES.map(c=>{const a=form.classes.includes(c);return(
                  <button key={c} onClick={()=>toggleClass(c)} style={{background:a?"rgba(0,200,232,0.15)":"var(--surface)",border:`1px solid ${a?"var(--stroke-bright)":"var(--stroke)"}`,color:a?"var(--brand)":"var(--ink-soft)",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:a?600:400,cursor:"pointer",transition:"all 0.15s"}}>{c}</button>
                );})}
              </div>
            </div>
            <div style={{background:"rgba(0,200,232,0.05)",border:"1px solid rgba(0,200,255,0.12)",borderRadius:10,padding:12}}>
              <p style={{fontSize:12,color:"var(--ink-soft)",lineHeight:1.7}}>📱 An SMS with a unique sign-up link is sent via the Skippo SMS service. The teacher sets their own PIN on first login.</p>
            </div>
            <button onClick={send} disabled={!form.name||!form.phone} style={{background:"var(--brand)",color:"#04121a",border:"none",borderRadius:12,padding:"13px 0",fontWeight:800,fontSize:15,cursor:"pointer",opacity:(!form.name||!form.phone)?0.4:1,transition:"opacity 0.2s",marginTop:"auto"}}>
              📱 Send SMS invite
            </button>
          </>
        )}
      </motion.aside>
    </motion.div>
  );
}

export default function TeachersPage(){
  const [teachers]=useState<Teacher[]>(TEACHERS);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState<"all"|TeacherStatus>("all");
  const [showInvite,setShowInvite]=useState(false);
  const active=teachers.filter(t=>t.status==="active").length;
  const invited=teachers.filter(t=>t.status==="invited").length;
  const notes=teachers.reduce((a,t)=>a+t.commentsWeek,0);
  const students=teachers.reduce((a,t)=>a+t.studentCount,0);
  const filtered=teachers.filter(t=>filter==="all"||t.status===filter).filter(t=>!search||t.name.toLowerCase().includes(search.toLowerCase())||t.subject.toLowerCase().includes(search.toLowerCase()));
  return (
    <DashboardShell>
      <AnimatePresence>{showInvite&&<InvitePanel onClose={()=>setShowInvite(false)}/>}</AnimatePresence>
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
        <div><p style={{fontSize:10,color:"var(--brand)",textTransform:"uppercase",letterSpacing:"0.16em",marginBottom:6}}>School Management</p><h1 style={{fontFamily:"'Syne',sans-serif",fontSize:34,fontWeight:700,letterSpacing:"-0.02em",color:"var(--ink)",lineHeight:1}}>Teachers</h1></div>
        <button onClick={()=>setShowInvite(true)} style={{background:"var(--brand)",color:"#04121a",border:"none",borderRadius:12,padding:"12px 22px",fontWeight:800,fontSize:14,cursor:"pointer"}}>+ Invite Teacher</button>
      </motion.div>
      <motion.section initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className={styles.kpiStrip} style={{marginBottom:28}}>
        <MetricCard label="Total Teachers"   value={String(teachers.length)} detail={`${active} active this week`}          color="brand"/>
        <MetricCard label="Invites Pending"  value={String(invited)}         detail="SMS sent, awaiting signup"              color="warning" badge="ACTION" badgeType="alert" variant={invited>0?"warning":undefined}/>
        <MetricCard label="Students Covered" value={String(students)}        detail="Across all active class sessions"       color="success"/>
        <MetricCard label="Notes This Week"  value={String(notes)}           detail="Parent-visible progress comments"       color="brand" badge="LIVE"/>
      </motion.section>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.15}} style={{display:"flex",gap:10,marginBottom:20,alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--ink-dim)",fontSize:14}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or subject…" style={{width:"100%",background:"var(--surface)",border:"1px solid var(--stroke)",borderRadius:10,padding:"10px 14px 10px 36px",fontSize:13,color:"var(--ink)",outline:"none"}}/>
        </div>
        {(["all","active","invited","inactive"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"10px 16px",borderRadius:10,border:`1px solid ${filter===f?"var(--stroke-bright)":"var(--stroke)"}`,background:filter===f?"rgba(0,200,232,0.1)":"var(--surface)",color:filter===f?"var(--brand)":"var(--ink-soft)",fontSize:13,fontWeight:filter===f?700:400,cursor:"pointer",textTransform:"capitalize"}}>{f}</button>
        ))}
      </motion.div>
      <motion.div variants={stagger} initial="hidden" animate="show" style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.length===0?(<div style={{textAlign:"center",padding:"60px 0",color:"var(--ink-dim)"}}><p style={{fontSize:32,marginBottom:8}}>👩‍🏫</p><p style={{fontSize:14,fontWeight:600}}>No teachers match your search</p></div>):filtered.map(t=><TeacherRow key={t.id} t={t} onResend={id=>alert(`SMS resent to teacher #${id}`)}/>)}
      </motion.div>
    </DashboardShell>
  );
}
