[app.js](https://github.com/user-attachments/files/31209295/app.js)
const TEAMS={
  "North Team": [
    "Senan Alkawamleh",
    "Carlo Mendez",
    "Ummer Mohd",
    "Mohamed Alanazi",
    "Jamjom",
    "Faizal",
    "Momen Hasan"
  ],
  "Central Team": [
    "Muhanned Hassan",
    "Sheikoli Mydeen",
    "Mogtaba Ahmad",
    "Muaaz Hezam",
    "Ahmed Nasser",
    "Khalid Erhaim"
  ],
  "East Team": [
    "Moataz Tammam",
    "Nayyar Abbas",
    "Marwan Elgurshi",
    "Elmer Salcedo",
    "Hassan Alkhabbaz",
    "Musa Elsiddig",
    "Nhec Inao"
  ],
  "South Team": [
    "Abdullah Gomaa",
    "El-Sayed Eissa",
    "Mohammed Arif",
    "Abdulrahim Bawazeer",
    "Hussain Al Zeidan",
    "Amri Alkhidder",
    "Arsalan khan"
  ],
  "Al-Kharj Team": [
    "Devid Gromio",
    "Ibrahim Qaysi"
  ],
  "Hail Team": [
    "Ieyad Khany",
    "Ahmed Tawhal"
  ],
  "Qassim Team": [
    "Mamdouh Saibi",
    "Manzul Kasim",
    "Rehmatullah",
    "Joel Malicdem",
    "Yousif Yassen",
    "Tariq Elobaid"
  ],
  "Dawadmi Team": [
    "Sherif Wagdi"
  ]
};
const ALIASES={
"NHEC NJ INAO":"Nhec Inao","NHEC NJ A INAO":"Nhec Inao",
"MARWAN ELGORSCH":"Marwan Elgurshi","MARWAN ELGORSH":"Marwan Elgurshi",
"HASSAN ALKABBAZ":"Hassan Alkhabbaz","HASSAN ALKHABBAZ":"Hassan Alkhabbaz"
};

/* Requested performance rules:
SLM=0% lower better; CCPDW=4 higher better; Re-trip=0% lower better;
SLA=100% higher better; Utilization=100% higher better;
Fundamentals=100% higher better; Closed SRs higher better; Response Opp lower better.
Closed SRs and Response Opp have no fixed target, so they are percentile-ranked
against employees in the same current comparison set. */
const RULES={
slm:{label:"7 Day SLM Revisit",target:0,dir:"low"},
ccpdw:{label:"CCPDW",target:4,dir:"high"},
retrip:{label:"Re-trip",target:0,dir:"low"},
sla:{label:"SLA Response",target:1,dir:"high"},
util:{label:"Utilization",target:1,dir:"high"},
fund:{label:"Call Fundamentals",target:1,dir:"high"},
closed:{label:"Closed SRs",target:null,dir:"high"},
opp:{label:"Response Opp",target:null,dir:"low"}
};
const KW={
name:["ce name","employee name","engineer name","employee","engineer","name"],
code:["ce code","employee code","emp code","engineer code","cecode","code"],
slm:["7 day slm revisit","slm revisit","7 day revisit","revisit"],
ccpdw:["ccpdw"],retrip:["re-trip","retrip","re trip"],
sla:["sla response","response sla","sla"],util:["utilization","utilisation"],
fund:["call fundamentals","fundamentals"],
closed:["closed srs","closed sr","closed calls","calls closed","closed"],
opp:["response opp","response opportunities","response opportunity"],
date:["date","period","week","month","created date","close date","completed date","activity date"]
};
const S={records:JSON.parse(localStorage.getItem("cePerfV5")||"[]"),view:"dashboard",team:"ALL",period:"ALL",search:""};
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const norm=x=>String(x??"").trim().toUpperCase().replace(/[^A-Z0-9]+/g," ").replace(/\s+/g," ").trim();
const compact=x=>norm(x).replace(/\s/g,"");
const num=x=>{if(x===null||x===undefined||x==="")return null;if(typeof x==="number")return x;let s=String(x).replace(/,/g,"").replace(/\s/g,"");let p=s.includes("%");s=s.replace("%","");let n=parseFloat(s);return Number.isNaN(n)?null:(p?n/100:n)};
const pct=x=>x==null?"—":(x*100).toFixed(1)+"%";
const fmt=x=>x==null?"—":Number(x).toLocaleString(undefined,{maximumFractionDigits:2});
function col(h,keys){let a=h.map(norm);for(const k of keys){let i=a.indexOf(norm(k));if(i>=0)return i}for(const k of keys){let i=a.findIndex(v=>v.includes(norm(k)));if(i>=0)return i}return -1}
function cname(x){let n=norm(x);if(ALIASES[n])return ALIASES[n];for(const t in TEAMS){let m=TEAMS[t].find(v=>norm(v)===n||compact(v)===compact(x));if(m)return m}return String(x||"").trim()}
function team(x){let n=cname(x);for(const t in TEAMS)if(TEAMS[t].some(v=>norm(v)===norm(n)))return t;return"Unassigned"}
function periods(row,i){if(i<0)return{week:"Current Snapshot",month:"Current Snapshot"};let x=row[i],d=x instanceof Date?x:(typeof x==="number"&&x>20000?new Date((x-25569)*864e5):new Date(x));if(isNaN(d))return{week:"Current Snapshot",month:"Current Snapshot"};let y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),f=new Date(y,0,1),day=Math.floor((d-f)/864e5),w=Math.ceil((day+f.getDay()+1)/7);return{week:`${y}-W${String(w).padStart(2,"0")}`,month:`${y}-${m}`}}
function parseRows(rows,h,file){let ix={};for(const k in KW)ix[k]=col(h,KW[k]);let out=[];rows.forEach((r,i)=>{let raw=ix.name>=0?String(r[ix.name]??"").trim():"",code=ix.code>=0?String(r[ix.code]??"").trim():"";if(!raw&&!code)return;let n=cname(raw||code),p=periods(r,ix.date);out.push({id:Date.now()+"_"+i+"_"+Math.random(),file,name:n,code,team:team(n),week:p.week,month:p.month,slm:ix.slm>=0?num(r[ix.slm]):null,ccpdw:ix.ccpdw>=0?num(r[ix.ccpdw]):null,retrip:ix.retrip>=0?num(r[ix.retrip]):null,sla:ix.sla>=0?num(r[ix.sla]):null,util:ix.util>=0?num(r[ix.util]):null,fund:ix.fund>=0?num(r[ix.fund]):null,closed:ix.closed>=0?num(r[ix.closed]):null,opp:ix.opp>=0?num(r[ix.opp]):null});});return out}

/* Target scoring. Target metrics score up to 100. */
function target(v,t,d){if(v==null)return null;if(d==="high")return t===0?100:Math.max(0,Math.min(100,v/t*100));if(t===0)return v<=0?100:Math.max(0,100-v*100);return v<=t?100:Math.max(0,t/v*100)}
function percentile(rs,key,dir){let a=rs.filter(x=>x[key]!=null).map(x=>Number(x[key])),m=new Map();rs.filter(x=>x[key]!=null).forEach(x=>{let v=Number(x[key]),better=dir==="high"?a.filter(z=>z>v).length:a.filter(z=>z<v).length,ties=a.filter(z=>z===v).length,rank=better+(ties+1)/2;m.set(x.id,a.length<=1?100:100*(a.length-rank)/(a.length-1))});return m}
function calc(rs){let cp=percentile(rs,"closed","high"),op=percentile(rs,"opp","low");return rs.map(x=>{let ms={},sum=0,n=0;for(const k of ["slm","ccpdw","retrip","sla","util","fund"]){let r=RULES[k],s=target(x[k],r.target,r.dir);ms[k]=s;if(s!=null){sum+=s;n++}}ms.closed=cp.get(x.id)??null;ms.opp=op.get(x.id)??null;if(ms.closed!=null){sum+=ms.closed;n++}if(ms.opp!=null){sum+=ms.opp;n++}return{...x,ms,score:n?sum/n:null}})}
function filtered(){let r=S.records.slice();if(S.team!=="ALL")r=r.filter(x=>x.team===S.team);if(S.period!=="ALL")r=r.filter(x=>x.week===S.period||x.month===S.period);let q=norm(S.search),c=compact(S.search);if(q)r=r.filter(x=>norm(x.name).includes(q)||norm(x.code).includes(q)||compact(x.name).includes(c)||compact(x.code).includes(c));return r}
function ranked(rs){return calc(rs).sort((a,b)=>(b.score??-1)-(a.score??-1)).map((x,i)=>({...x,rank:i+1}))}
function badge(s){let t=s==null?["No Score","none"]:s>=85?["Outstanding","out"]:s>=70?["Strong","strong"]:s>=55?["Developing","dev"]:["Needs Improvement","need"];return`<span class="badge ${t[1]}">${t[0]}</span>`}
function table(rs){let r=ranked(rs);if(!r.length)return`<div class="empty">No matching records. Try another team, period, name or CE code.</div>`;return`<div class="tablewrap"><table><thead><tr><th>#</th><th>CE Name</th><th>CE Code</th><th>Team</th><th>Score</th><th>Performance</th><th>SLM</th><th>CCPDW</th><th>Re-trip</th><th>SLA</th><th>Util.</th><th>Fund.</th><th>Closed SRs</th><th>Response Opp</th></tr></thead><tbody>${r.map(x=>`<tr><td class="rank">#${x.rank}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.code)}</td><td>${esc(x.team)}</td><td><b>${x.score==null?"—":x.score.toFixed(1)}</b></td><td>${badge(x.score)}</td><td>${pct(x.slm)}</td><td>${fmt(x.ccpdw)}</td><td>${pct(x.retrip)}</td><td>${pct(x.sla)}</td><td>${pct(x.util)}</td><td>${pct(x.fund)}</td><td>${fmt(x.closed)}</td><td>${fmt(x.opp)}</td></tr>`).join("")}</tbody></table></div>`}
function setFilters(){let ts=$("team"),ps=$("period");ts.innerHTML='<option value="ALL">All Teams</option>'+Object.keys(TEAMS).map(x=>`<option>${esc(x)}</option>`).join("");ts.value=S.team;let p=[...new Set(S.records.flatMap(x=>[x.week,x.month]))].sort().reverse();ps.innerHTML='<option value="ALL">All Periods</option>'+p.map(x=>`<option>${esc(x)}</option>`).join("");ps.value=S.period;$("search").value=S.search}
function content(){let r=filtered();if(S.view==="dashboard")dash(r);else if(S.view==="ranking")$("content").innerHTML=`<div class="panel"><h2>🏆 Employee Ranking (${r.length})</h2>${table(r)}</div>`;else if(S.view==="weekly")period(r,"week");else if(S.view==="monthly")period(r,"month");else if(S.view==="employees")employees(r);else if(S.view==="upload")uploadView();else if(S.view==="teams")teamsView();else settingsView()}
function dash(r){let q=ranked(r),scores=q.map(x=>x.score).filter(x=>x!=null),avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,total=Object.values(TEAMS).reduce((a,b)=>a+b.length,0);$("content").innerHTML=`<div class="cards"><div class="card"><div class="label">Records</div><div class="value">${q.length}</div><div class="sub">Current filter</div></div><div class="card"><div class="label">Average Score</div><div class="value">${avg==null?"—":avg.toFixed(1)}</div><div class="sub">Out of 100</div></div><div class="card"><div class="label">Top Performer</div><div class="value" style="font-size:17px">${esc(q[0]?.name||"—")}</div><div class="sub">${q[0]&&q[0].score!=null?q[0].score.toFixed(1)+" points":"—"}</div></div><div class="card"><div class="label">Teams</div><div class="value">${Object.keys(TEAMS).length}</div><div class="sub">Configured areas</div></div><div class="card"><div class="label">Employees</div><div class="value">${total}</div><div class="sub">38 configured</div></div></div>${!S.records.length?`<div class="panel empty"><h2>No Excel data uploaded</h2><p>Click Upload Excel to start.</p></div>`:`<div class="grid2"><div class="panel"><h2>🏆 Top 10</h2>${table(q.slice(0,10))}</div><div class="panel"><h2>Performance Rules</h2><div class="metricgrid">${Object.values(RULES).map(r=>`<div class="metric"><b>${r.label}</b><strong>${r.target==null?"Percentile":(r.target*100+(r.label==="CCPDW"?0:0))+(r.label==="CCPDW"?"":"%")} • ${r.dir==="high"?"Higher":"Lower"} is better</strong></div>`).join("")}</div></div></div>`}
function period(r,k){let p=[...new Set(r.map(x=>x[k]))].sort().reverse();$("content").innerHTML=p.length?p.map(x=>`<div class="panel"><h2>${k==="week"?"📅":"📆"} ${esc(x)}</h2>${table(r.filter(y=>y[k]===x))}</div>`).join(""):`<div class="panel empty">No period data.</div>`}
function employees(r){let names=[...new Set(r.map(x=>x.name))].sort();$("content").innerHTML=`<div class="panel"><h2>Employee History</h2>${names.length?`<div class="tablewrap"><table><thead><tr><th>Employee</th><th>CE Code</th><th>Team</th><th>Records</th><th>Average</th><th>Best</th></tr></thead><tbody>${names.map(n=>{let h=calc(r.filter(x=>x.name===n)),s=h.map(x=>x.score).filter(x=>x!=null),a=s.length?s.reduce((u,v)=>u+v,0)/s.length:null,b=s.length?Math.max(...s):null;return`<tr><td><b>${esc(n)}</b></td><td>${esc(h[0]?.code||"")}</td><td>${esc(h[0]?.team||"")}</td><td>${h.length}</td><td>${a==null?"—":a.toFixed(1)}</td><td>${b==null?"—":b.toFixed(1)}</td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">No employees found.</div>`}</div>`}
function uploadView(){$("content").innerHTML=`<div class="panel"><h2>📤 Upload Excel</h2><div class="notice"><b>Automatic team matching:</b> uploaded names are assigned to one of the 8 configured teams. Unknown names become Unassigned.</div><div class="drop" id="pageDrop">📤<br><b>Click to select Excel</b><small>.xlsx, .xls, .csv</small></div><p>Stored records: <b>${S.records.length}</b></p></div>`;$("pageDrop").onclick=()=>$("file").click()}
function teamsView(){$("content").innerHTML=`<div class="panel"><h2>👥 Team Database — 38 Employees</h2><div class="teamgrid">${Object.entries(TEAMS).map(([t,m])=>`<div class="teamcard"><h3>${esc(t)} (${m.length})</h3><ul>${m.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div></div>`}
function settingsView(){$("content").innerHTML=`<div class="panel"><h2>⚙️ Performance Rules</h2><table><thead><tr><th>Metric</th><th>Target</th><th>Direction</th></tr></thead><tbody>${Object.values(RULES).map(r=>`<tr><td>${esc(r.label)}</td><td>${r.target==null?"No fixed target":r.label==="CCPDW"?"4":(r.target*100)+"%"}</td><td>${r.dir==="high"?"Higher is better":"Lower is better"}</td></tr>`).join("")}</tbody></table></div><div class="panel"><h2>Browser Database</h2><p class="small">Records stored: ${S.records.length}</p><button class="secondary" id="backup">Export Backup</button> <button class="secondary" id="wipe">Clear Data</button></div>`;$("backup").onclick=()=>download("CE_Performance_Backup.json",JSON.stringify({teams:TEAMS,records:S.records,exportedAt:new Date().toISOString()},null,2),"application/json");$("wipe").onclick=()=>{if(confirm("Delete all performance records?")){S.records=[];localStorage.removeItem("cePerfV5");render()}}}
function render(){setFilters();let titles={dashboard:["Dashboard","Weekly and monthly CE performance ranking"],ranking:["Employee Ranking","Overall ranking"],weekly:["Weekly Performance","Weekly comparison"],monthly:["Monthly Performance","Monthly comparison"],employees:["Employee History","Employee records"],upload:["Upload Excel","Import the latest Excel"],teams:["Team Database","38 employees in 8 areas"],settings:["Performance Rules","Requested scoring rules"]};$("title").textContent=titles[S.view][0];$("subtitle").textContent=titles[S.view][1];document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.view===S.view));content()}
async function readFile(f){$("status").textContent="Reading Excel...";let wb=XLSX.read(await f.arrayBuffer(),{type:"array",cellDates:true}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});if(rows.length<2)throw Error("Excel sheet is empty.");let p=parseRows(rows.slice(1),rows[0],f.name);if(!p.length)throw Error("No CE Name/Employee Name/CE Code column or employee rows detected.");S.records.push(...p);localStorage.setItem("cePerfV5",JSON.stringify(S.records));$("status").textContent=`Upload complete: ${p.length} records added.`;setTimeout(()=>{$("modal").classList.remove("show");S.view="dashboard";render()},1000)}
function download(n,d,t){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([d],{type:t}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

$("uploadBtn").onclick=()=>$("modal").classList.add("show");$("close").onclick=()=>$("modal").classList.remove("show");$("drop").onclick=()=>$("file").click();
$("file").onchange=e=>{let f=e.target.files[0];if(f)readFile(f).catch(x=>alert(x.message));e.target.value=""};
$("drop").ondragover=e=>e.preventDefault();$("drop").ondrop=e=>{e.preventDefault();let f=e.dataTransfer.files[0];if(f)readFile(f).catch(x=>alert(x.message))};
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>{S.view=n.dataset.view;render()});
$("team").onchange=e=>{S.team=e.target.value;content()};
$("period").onchange=e=>{S.period=e.target.value;content()};
/* SEARCH BUG FIX: only the results section is rendered; the search input is never recreated. */
$("search").oninput=e=>{S.search=e.target.value;content()};
$("clear").onclick=()=>{S.team="ALL";S.period="ALL";S.search="";$("search").value="";render()};
render();
