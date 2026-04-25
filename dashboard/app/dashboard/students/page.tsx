"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import { MetricCard } from "../../../components/MetricCard";
import styles from "../../../components/dashboard.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type InviteStatus = "accepted" | "pending" | "not_sent";
interface Student {
  id:number; name:string; rollNo:string; classId:number; className:string;
  section:string; parentName:string; parentPhone:string; inviteStatus:InviteStatus;
}
interface ClassGroup {
  id:number; name:string; section:string; teacher:string; studentCount:number; attendance:number;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const CLASSES: ClassGroup[] = [
  {id:1, name:"Class 6-A", section:"A", teacher:"Mrs. Anitha Rao",   studentCount:32, attendance:97},
  {id:2, name:"Class 6-B", section:"B", teacher:"Mr. Rajan Kumar",   studentCount:30, attendance:94},
  {id:3, name:"Class 7-A", section:"A", teacher:"Mr. Rajan Kumar",   studentCount:31, attendance:92},
  {id:4, name:"Class 7-B", section:"B", teacher:"Mrs. Anitha Rao",   studentCount:30, attendance:96},
  {id:5, name:"Class 8-A", section:"A", teacher:"Mr. Sanjay Mehta",  studentCount:34, attendance:89},
  {id:6, name:"Class 8-B", section:"B", teacher:"Mr. Sanjay Mehta",  studentCount:33, attendance:91},
  {id:7, name:"Class 9-A", section:"A", teacher:"Ms. Deepa Varma",   studentCount:35, attendance:95},
  {id:8, name:"Class 10-A",section:"A", teacher:"Ms. Deepa Varma",   studentCount:36, attendance:93},
  {id:9, name:"Class 10-B",section:"B", teacher:"Ms. Sunita Kapoor", studentCount:35, attendance:88},
  {id:10,name:"Class 11",  section:"",  teacher:"Mrs. Kavya Nair",   studentCount:38, attendance:96},
  {id:11,name:"Class 12",  section:"",  teacher:"Mrs. Kavya Nair",   studentCount:36, attendance:94},
];

const STUDENTS: Student[] = [
  {id:1, name:"Arjun Sharma",     rollNo:"6A-01", classId:1, className:"Class 6-A", section:"A", parentName:"Priya Sharma",    parentPhone:"+91 98765 43210", inviteStatus:"accepted"},
  {id:2, name:"Meera Patel",      rollNo:"6A-02", classId:1, className:"Class 6-A", section:"A", parentName:"Rahul Patel",     parentPhone:"+91 99001 23456", inviteStatus:"accepted"},
  {id:3, name:"Rohan Gupta",      rollNo:"6A-03", classId:1, className:"Class 6-A", section:"A", parentName:"Sunita Gupta",    parentPhone:"+91 77889 00112", inviteStatus:"pending"},
  {id:4, name:"Diya Nair",        rollNo:"6A-04", classId:1, className:"Class 6-A", section:"A", parentName:"Arun Nair",       parentPhone:"+91 90011 22334", inviteStatus:"accepted"},
  {id:5, name:"Vikram Singh",     rollNo:"6B-01", classId:2, className:"Class 6-B", section:"B", parentName:"Deepa Singh",     parentPhone:"+91 88776 55443", inviteStatus:"accepted"},
  {id:6, name:"Ananya Reddy",     rollNo:"6B-02", classId:2, className:"Class 6-B", section:"B", parentName:"Kiran Reddy",     parentPhone:"+91 91234 56789", inviteStatus:"pending"},
  {id:7, name:"Kabir Mehta",      rollNo:"7A-01", classId:3, className:"Class 7-A", section:"A", parentName:"Sanjay Mehta",    parentPhone:"+91 87654 32109", inviteStatus:"accepted"},
  {id:8, name:"Sara Thomas",      rollNo:"7A-02", classId:3, className:"Class 7-A", section:"A", parentName:"John Thomas",     parentPhone:"+91 96543 21098", inviteStatus:"not_sent"},
  {id:9, name:"Aditya Kumar",     rollNo:"8A-01", classId:5, className:"Class 8-A", section:"A", parentName:"Rajesh Kumar",    parentPhone:"+91 88776 11223", inviteStatus:"accepted"},
  {id:10,name:"Pooja Iyer",       rollNo:"8A-02", classId:5, className:"Class 8-A", section:"A", parentName:"Venkat Iyer",     parentPhone:"+91 79988 77665", inviteStatus:"pending"},
  {id:11,name:"Rahul Verma",      rollNo:"10A-01",classId:8, className:"Class 10-A",section:"A", parentName:"Suresh Verma",    parentPhone:"+91 94433 55667", inviteStatus:"accepted"},
  {id:12,name:"Neha Kapoor",      rollNo:"10A-02",classId:8, className:"Class 10-A",section:"A", parentName:"Anil Kapoor",     parentPhone:"+91 93322 11001", inviteStatus:"accepted"},
  {id:13,name:"Tanish Roy",       rollNo:"12-01", classId:11,className:"Class 12",  section:"",  parentName:"Bikas Roy",       parentPhone:"+91 82233 44556", inviteStatus:"accepted"},
  {id:14,name:"Priya Das",        rollNo:"12-02", classId:11,className:"Class 12",  section:"",  parentName:"Subrata Das",     parentPhone:"+91 71122 33445", inviteStatus:"not_sent"},
];

// Preview data for Excel upload demo
const EXCEL_PREVIEW = [
  {name:"Amit Srivastava", class:"Class 6-A", roll:"6A-12", parentName:"Rakesh Srivastava", parentPhone:"+91 98001 12345"},
  {name:"Fatima Khan",     class:"Class 7-B", roll:"7B-08", parentName:"Mohammad Khan",      parentPhone:"+91 97002 23456"},
  {name:"Riya Joshi",      class:"Class 8-A", roll:"8A-15", parentName:"Sunil Joshi",        parentPhone:"+91 96003 34567"},
  {name:"Karan Malhotra",  class:"Class 9-A", roll:"9A-03", parentName:"Vinod Malhotra",     parentPhone:"+91 95004 45678"},
  {name:"Anjali Pillai",   class:"Class 10-B",roll:"10B-11",parentName:"Ramesh Pillai",      parentPhone:"+91 94005 56789"},
];

const fade   = {hidden:{opacity:0,y:16},show:{opacity:1,y:0}};
const stagger= {hidden:{},show:{transition:{staggerChildren:0.04}}};

// ── Helpers ───────────────────────────────────────────────────────────────────

const INVITE_STYLE: Record<InviteStatus,{c:string;bg:string;label:string}> = {
  accepted: {c:"#00e09a", bg:"rgba(0,224,154,0.1)", label:"Accepted"},
  pending:  {c:"#ffb547", bg:"rgba(255,181,71,0.1)", label:"Pending"},
  not_sent: {c:"rgba(130,170,195,0.4)", bg:"rgba(255,255,255,0.04)", label:"Not sent"},
};

function InvitePill({status}:{status:InviteStatus}){
  const s=INVITE_STYLE[status];
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:s.bg,color:s.c,borderRadius:999,padding:"2px 9px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}><span style={{width:4,height:4,borderRadius:"50%",background:s.c}}/>{s.label}</span>;
}

// ── Excel upload modal ────────────────────────────────────────────────────────

function UploadModal({onClose}:{onClose:()=>void}){
  const [step,setStep]=useState<"drop"|"review"|"importing"|"done">("drop");
  const [fileName,setFileName]=useState("");
  const fileRef=useRef<HTMLInputElement>(null);
  function handleFilePick(){
    setFileName("student_data_2026.xlsx");
    setTimeout(()=>setStep("review"),600);
  }
  async function handleImport(){
    setStep("importing");
    await new Promise(r=>setTimeout(r,1800));
    setStep("done");
  }
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,background:"rgba(4,13,20,0.9)",backdropFilter:"blur(12px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <motion.div initial={{scale:0.94,y:20}} animate={{scale:1,y:0}} exit={{scale:0.94,y:20}} onClick={e=>e.stopPropagation()} style={{background:"#071520",border:"1px solid var(--stroke-bright)",borderRadius:"var(--radius-xl)",padding:36,width:620,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div><p style={{fontSize:10,color:"var(--brand)",textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Bulk import</p><h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:700,color:"var(--ink)"}}>Upload Student Excel</h2></div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--ink-dim)",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {step==="drop"&&(
          <>
            <div onClick={()=>fileRef.current?.click()} style={{border:"2px dashed var(--stroke-bright)",borderRadius:"var(--radius-lg)",padding:"48px 24px",textAlign:"center",cursor:"pointer",background:"rgba(0,200,232,0.03)",transition:"background 0.2s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(0,200,232,0.06)"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="rgba(0,200,232,0.03)"}>
              <span style={{fontSize:48,display:"block",marginBottom:12}}>📊</span>
              <p style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:"var(--ink)",marginBottom:6}}>Drag & drop your Excel file</p>
              <p style={{fontSize:13,color:"var(--ink-soft)",marginBottom:16}}>or click to browse — .xlsx or .csv formats supported</p>
              <button style={{background:"var(--brand)",color:"#04121a",border:"none",borderRadius:10,padding:"10px 22px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Browse file</button>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{display:"none"}} onChange={handleFilePick}/>
            </div>
            <div style={{marginTop:20,background:"var(--surface)",border:"1px solid var(--stroke)",borderRadius:"var(--radius-md)",padding:16}}>
              <p style={{fontSize:11,fontWeight:600,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Required columns</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {[["Student Name","Full name of student"],["Class","e.g. Class 6-A"],["Roll Number","Unique roll within class"],["Parent Name","Primary guardian name"],["Parent Phone","For SMS invite — +91XXXXXXXXXX"]].map(([c,d])=>(
                  <div key={c} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{color:"var(--brand)",fontSize:12,marginTop:1}}>✓</span>
                    <div><p style={{fontSize:13,color:"var(--ink)",fontWeight:500}}>{c}</p><p style={{fontSize:11,color:"var(--ink-dim)"}}>{d}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{textAlign:"center",marginTop:16}}>
              <button onClick={handleFilePick} style={{background:"none",border:"none",color:"var(--brand)",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Use demo file instead →</button>
            </div>
          </>
        )}

        {step==="review"&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(0,224,154,0.08)",border:"1px solid rgba(0,224,154,0.2)",borderRadius:10,padding:"10px 16px",marginBottom:20}}>
              <span style={{fontSize:20}}>📄</span>
              <div><p style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{fileName||"student_data_2026.xlsx"}</p><p style={{fontSize:11,color:"#00e09a"}}>5 students detected · 5 unique parent contacts</p></div>
            </div>
            <div style={{marginBottom:16}}>
              <p style={{fontSize:11,fontWeight:600,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Preview (first 5 rows)</p>
              <div style={{overflowX:"auto",borderRadius:"var(--radius-md)",border:"1px solid var(--stroke)"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"var(--surface-raised)"}}>
                    {["Student","Class","Roll","Parent","Phone"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:600,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.1em",whiteSpace:"nowrap"}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {EXCEL_PREVIEW.map((r,i)=>(
                      <tr key={i} style={{borderTop:"1px solid var(--stroke)"}}>
                        <td style={{padding:"10px 14px",fontSize:13,color:"var(--ink)",fontWeight:500}}>{r.name}</td>
                        <td style={{padding:"10px 14px",fontSize:12,color:"var(--brand)"}}>{r.class}</td>
                        <td style={{padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,color:"var(--ink-soft)"}}>{r.roll}</td>
                        <td style={{padding:"10px 14px",fontSize:12,color:"var(--ink-soft)"}}>{r.parentName}</td>
                        <td style={{padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,color:"var(--ink-soft)"}}>{r.parentPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{background:"rgba(0,200,232,0.05)",border:"1px solid rgba(0,200,255,0.12)",borderRadius:10,padding:12,marginBottom:20}}>
              <p style={{fontSize:12,color:"var(--ink-soft)",lineHeight:1.7}}>📱 After import, SMS invites will be automatically sent to all 5 parent phone numbers via the Skippo SMS service.</p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep("drop")} style={{flex:1,background:"var(--surface)",border:"1px solid var(--stroke)",color:"var(--ink-soft)",borderRadius:10,padding:"12px 0",fontWeight:600,fontSize:14,cursor:"pointer"}}>← Back</button>
              <button onClick={handleImport} style={{flex:2,background:"var(--brand)",color:"#04121a",border:"none",borderRadius:10,padding:"12px 0",fontWeight:800,fontSize:14,cursor:"pointer"}}>Import 5 students + send invites</button>
            </div>
          </>
        )}

        {step==="importing"&&(
          <div style={{textAlign:"center",padding:"48px 0"}}>
            <div style={{width:48,height:48,border:"3px solid var(--stroke)",borderTop:"3px solid var(--brand)",borderRadius:"50%",margin:"0 auto 20px",animation:"spin 0.8s linear infinite"}}/>
            <p style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:"var(--ink)",marginBottom:8}}>Importing students…</p>
            <p style={{fontSize:13,color:"var(--ink-soft)"}}>Saving to database and sending SMS invites</p>
          </div>
        )}

        {step==="done"&&(
          <div style={{textAlign:"center",padding:"24px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <span style={{fontSize:56}}>🎉</span>
            <div>
              <p style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color:"#00e09a",marginBottom:8}}>Import complete!</p>
              <p style={{fontSize:13,color:"var(--ink-soft)",lineHeight:1.7}}>5 students added to the database.<br/>5 SMS invites sent to parents.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%",marginTop:8}}>
              {[{v:"5",l:"Students added",c:"var(--brand)"},{v:"5",l:"SMS invites sent",c:"#00e09a"},{v:"0",l:"Duplicates skipped",c:"var(--ink-dim)"},{v:"0",l:"Errors",c:"var(--ink-dim)"}].map(s=>(
                <div key={s.l} style={{background:"var(--surface)",border:"1px solid var(--stroke)",borderRadius:12,padding:"14px",textAlign:"center"}}>
                  <p style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:s.c}}>{s.v}</p>
                  <p style={{fontSize:11,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.l}</p>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{background:"var(--brand)",color:"#04121a",border:"none",borderRadius:10,padding:"12px 0",fontWeight:800,fontSize:14,cursor:"pointer",width:"100%"}}>Done</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── By-class view ─────────────────────────────────────────────────────────────

function ClassCard({cls}:{cls:ClassGroup}){
  const [open,setOpen]=useState(false);
  const students=STUDENTS.filter(s=>s.classId===cls.id);
  const pct=cls.attendance;
  const color=pct>=95?"#00e09a":pct>=88?"#ffb547":"#ff4d6a";
  return (
    <motion.div variants={fade} transition={{duration:0.3}} layout>
      <div onClick={()=>setOpen(v=>!v)} style={{background:"var(--surface)",border:"1px solid var(--stroke)",borderRadius:"var(--radius-md)",padding:"16px 20px",cursor:"pointer",transition:"border-color 0.2s,background 0.2s",display:"flex",alignItems:"center",gap:16}}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--stroke-bright)";(e.currentTarget as HTMLElement).style.background="var(--surface-raised)"}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--stroke)";(e.currentTarget as HTMLElement).style.background="var(--surface)"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"rgba(0,200,232,0.1)",border:"1px solid var(--stroke-bright)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,color:"var(--brand)",flexShrink:0,textAlign:"center",lineHeight:1.2}}>
          {cls.name.replace("Class ","")}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:"var(--ink)",marginBottom:2}}>{cls.name}</p>
          <p style={{fontSize:12,color:"var(--ink-soft)"}}>🧑‍🏫 {cls.teacher}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <div style={{textAlign:"center"}}>
            <p style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,color:"var(--brand)",lineHeight:1}}>{cls.studentCount}</p>
            <p style={{fontSize:9,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Students</p>
          </div>
          <div style={{textAlign:"center"}}>
            <p style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,color,lineHeight:1}}>{pct}%</p>
            <p style={{fontSize:9,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Attendance</p>
          </div>
          <div style={{width:6,height:40,borderRadius:3,background:"var(--surface-raised)",overflow:"hidden",flexShrink:0}}>
            <div style={{width:"100%",height:`${pct}%`,background:`linear-gradient(180deg, transparent, ${color})`,borderRadius:3}}/>
          </div>
        </div>
        <span style={{color:"var(--ink-dim)",fontSize:11,marginLeft:4}}>{open?"▲":"▼"}</span>
      </div>
      <AnimatePresence>
        {open&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
            <div style={{background:"rgba(0,200,232,0.03)",border:"1px solid var(--stroke)",borderTop:"none",borderRadius:"0 0 var(--radius-md) var(--radius-md)",padding:"0 20px 16px"}}>
              {students.length===0?(
                <p style={{fontSize:13,color:"var(--ink-dim)",padding:"16px 0"}}>No students loaded for this class yet.</p>
              ):students.map(s=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--stroke)"}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--ink-dim)",minWidth:52}}>{s.rollNo}</span>
                  <p style={{flex:1,fontSize:13,fontWeight:500,color:"var(--ink)"}}>{s.name}</p>
                  <p style={{fontSize:12,color:"var(--ink-soft)",minWidth:140}}>👨‍👩‍👦 {s.parentName}</p>
                  <InvitePill status={s.inviteStatus}/>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={e=>e.stopPropagation()} title={`Call ${s.parentPhone}`} onClick={e=>{e.stopPropagation();window.location.href=`tel:${s.parentPhone}`;}} style={{background:"rgba(0,200,232,0.08)",border:"1px solid var(--stroke-bright)",color:"var(--brand)",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>📞 Call</button>
                    {s.inviteStatus!=="accepted"&&<button onClick={e=>e.stopPropagation()} style={{background:"rgba(255,181,71,0.08)",border:"1px solid rgba(255,181,71,0.2)",color:"#ffb547",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>📱 Invite</button>}
                  </div>
                </div>
              ))}
              {students.length<cls.studentCount&&<p style={{fontSize:11,color:"var(--ink-dim)",paddingTop:12,textAlign:"center"}}>+{cls.studentCount-students.length} more students (showing sample)</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage(){
  const [tab,setTab]=useState<"all"|"by-class"|"pending">("by-class");
  const [search,setSearch]=useState("");
  const [showUpload,setShowUpload]=useState(false);
  const totalStudents=CLASSES.reduce((a,c)=>a+c.studentCount,0);
  const accepted=STUDENTS.filter(s=>s.inviteStatus==="accepted").length;
  const pending=STUDENTS.filter(s=>s.inviteStatus==="pending").length;
  const notSent=STUDENTS.filter(s=>s.inviteStatus==="not_sent").length;
  const filteredStudents=STUDENTS.filter(s=>!search||s.name.toLowerCase().includes(search.toLowerCase())||s.className.toLowerCase().includes(search.toLowerCase())||s.parentName.toLowerCase().includes(search.toLowerCase()));
  const pendingStudents=STUDENTS.filter(s=>s.inviteStatus!=="accepted");
  return (
    <DashboardShell>
      <AnimatePresence>{showUpload&&<UploadModal onClose={()=>setShowUpload(false)}/>}</AnimatePresence>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
        <div><p style={{fontSize:10,color:"var(--brand)",textTransform:"uppercase",letterSpacing:"0.16em",marginBottom:6}}>School Management</p><h1 style={{fontFamily:"'Syne',sans-serif",fontSize:34,fontWeight:700,letterSpacing:"-0.02em",color:"var(--ink)",lineHeight:1}}>Students</h1></div>
        <button onClick={()=>setShowUpload(true)} style={{background:"var(--brand)",color:"#04121a",border:"none",borderRadius:12,padding:"12px 22px",fontWeight:800,fontSize:14,cursor:"pointer"}}>📊 Upload Excel</button>
      </motion.div>
      <motion.section initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className={styles.kpiStrip} style={{marginBottom:28}}>
        <MetricCard label="Total Students"   value={String(totalStudents)} detail={`Across ${CLASSES.length} classes`}    color="brand"/>
        <MetricCard label="Parents Signed Up"value={String(accepted)}      detail="App access confirmed"                  color="success" badge="LIVE"/>
        <MetricCard label="Invites Pending"  value={String(pending)}       detail="SMS sent, awaiting parent signup"      color="warning" badge="ACTION" badgeType="alert" variant={pending>0?"warning":undefined}/>
        <MetricCard label="Not Yet Invited"  value={String(notSent)}       detail="No invite sent — send now"             color="danger"  variant={notSent>0?"danger":undefined}/>
      </motion.section>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.15}} style={{display:"flex",gap:4,marginBottom:20,background:"var(--surface-raised)",borderRadius:"var(--radius-md)",padding:4}}>
        {([["by-class","📚 By Class"],["all","👤 All Students"],["pending","📱 Pending Invites"]] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 0",border:"none",borderRadius:"var(--radius-sm)",background:tab===t?"var(--surface-highlight)":"transparent",color:tab===t?"var(--brand)":"var(--ink-soft)",fontWeight:tab===t?700:400,fontSize:13,cursor:"pointer",transition:"all 0.15s"}}>{l}</button>
        ))}
      </motion.div>

      {tab==="by-class"&&(
        <motion.div variants={stagger} initial="hidden" animate="show" style={{display:"flex",flexDirection:"column",gap:8}}>
          {CLASSES.map(c=><ClassCard key={c.id} cls={c}/>)}
        </motion.div>
      )}

      {tab==="all"&&(
        <>
          <div style={{marginBottom:16}}>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--ink-dim)",fontSize:14}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student, class, or parent name…" style={{width:"100%",background:"var(--surface)",border:"1px solid var(--stroke)",borderRadius:10,padding:"10px 14px 10px 36px",fontSize:13,color:"var(--ink)",outline:"none"}}/>
            </div>
          </div>
          <div style={{background:"var(--surface)",border:"1px solid var(--stroke)",borderRadius:"var(--radius-lg)",overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"var(--surface-raised)"}}>
                  {["Student","Roll","Class","Parent","Phone","Parent Invite","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:600,color:"var(--ink-dim)",textTransform:"uppercase",letterSpacing:"0.1em",whiteSpace:"nowrap"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredStudents.map((s,i)=>(
                    <tr key={s.id} style={{borderTop:"1px solid var(--stroke)",transition:"background 0.15s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--surface-raised)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                      <td style={{padding:"12px 16px",fontWeight:500,color:"var(--ink)",fontSize:13}}>{s.name}</td>
                      <td style={{padding:"12px 16px",fontFamily:"'DM Mono',monospace",fontSize:12,color:"var(--ink-dim)"}}>{s.rollNo}</td>
                      <td style={{padding:"12px 16px"}}><span style={{background:"rgba(0,200,232,0.1)",color:"var(--brand)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:500}}>{s.className}</span></td>
                      <td style={{padding:"12px 16px",fontSize:13,color:"var(--ink-soft)"}}>{s.parentName}</td>
                      <td style={{padding:"12px 16px",fontFamily:"'DM Mono',monospace",fontSize:12,color:"var(--ink-soft)"}}>{s.parentPhone}</td>
                      <td style={{padding:"12px 16px"}}><InvitePill status={s.inviteStatus}/></td>
                      <td style={{padding:"12px 16px"}}>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>window.location.href=`tel:${s.parentPhone}`} style={{background:"rgba(0,200,232,0.08)",border:"1px solid var(--stroke-bright)",color:"var(--brand)",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>📞 Call</button>
                          {s.inviteStatus!=="accepted"&&<button style={{background:"rgba(255,181,71,0.08)",border:"1px solid rgba(255,181,71,0.2)",color:"#ffb547",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>📱 Invite</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--ink-dim)"}}><p style={{fontSize:14,fontWeight:600}}>No students match</p></div>}
          </div>
        </>
      )}

      {tab==="pending"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
            <button style={{background:"rgba(255,181,71,0.1)",border:"1px solid rgba(255,181,71,0.25)",color:"#ffb547",borderRadius:10,padding:"10px 18px",fontWeight:700,fontSize:13,cursor:"pointer"}}>📱 Send invites to all ({pendingStudents.length})</button>
          </div>
          {pendingStudents.map(s=>(
            <div key={s.id} style={{background:"var(--surface)",border:"1px solid var(--stroke)",borderRadius:"var(--radius-md)",padding:"14px 20px",display:"flex",alignItems:"center",gap:14,transition:"border-color 0.2s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor="var(--stroke-bright)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor="var(--stroke)"}>
              <div style={{flex:1}}>
                <p style={{fontWeight:600,fontSize:13,color:"var(--ink)",marginBottom:2}}>{s.parentName} <span style={{color:"var(--ink-dim)",fontWeight:400}}>— parent of</span> {s.name}</p>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"var(--ink-soft)"}}>{s.parentPhone} · {s.className} · Roll {s.rollNo}</p>
              </div>
              <InvitePill status={s.inviteStatus}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>window.location.href=`tel:${s.parentPhone}`} style={{background:"rgba(0,200,232,0.08)",border:"1px solid var(--stroke-bright)",color:"var(--brand)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>📞 Call</button>
                <button style={{background:"rgba(255,181,71,0.08)",border:"1px solid rgba(255,181,71,0.2)",color:"#ffb547",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>📱 Send SMS invite</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
