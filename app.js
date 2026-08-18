const EAST_TEAM = [
  "NHEC NJ INAO",
  "ELMER SALCEDO",
  "MARWAN ELGORSH",
  "MUSA ELSIDDIG",
  "HASSAN ALKABBAZ",
  "NAYYAR ABBAS"
];

const DEFAULT_WEIGHTS = {
  slm: 0.20, ccpdw: 0.15, retrip: 0.20,
  sla: 0.15, utilization: 0.15, fundamentals: 0.15
};

const KEYWORDS = {
  code:["ce code","employee code","emp code","code","engineer code"],
  name:["ce name","employee name","engineer name","name","custodian"],
  slm:["7 day slm revisit","slm revisit","7 day","revisit"],
  ccpdw:["ccpdw"],
  retrip:["retrip","re-trip"],
  sla:["response sla","sla","response"],
  utilization:["utilization","utilisation"],
  fundamentals:["call fundamentals","fundamentals"],
  closed:["closed srs","closed sr","closed calls","calls closed","total closed"],
  responseOpp:["response opp","response opportunities","sla opportunities"],
  date:["date","period","week","month","created date","close date","completed date"]
};

let state = {
  records: JSON.parse(localStorage.getItem("cePerformanceRecords") || "[]"),
  weights: JSON.parse(localStorage.getItem("cePerformanceWeights") || JSON.stringify(DEFAULT_WEIGHTS)),
  view:"dashboard", team:"ALL", period:"ALL", search:""
};

const $ = id => document.getElementById(id);
const norm = s => String(s ?? "").trim().toUpperCase().replace(/\s+/g," ");
const num = v => {
  if(v===null || v===undefined || v==="") return null;
  if(typeof v==="number") return v > 1 && v <= 100 ? v/100 : v;
  const x=parseFloat(String(v).replace(/[%,$\s,]/g,""));
  if(Number.isNaN(x)) return null;
  return x>1 && x<=100 ? x/100 : x;
};
const findCol = (headers, keys) => {
  const hs=headers.map(h=>norm(h));
  for(const k of keys){ const i=hs.findIndex(h=>h===norm(k)); if(i>=0)return i; }
  for(const k of keys){ const i=hs.findIndex(h=>h.includes(norm(k))); if(i>=0)return i; }
  return -1;
};
const esc = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const pct = v => v==null ? "—" : (v*100).toFixed(1)+"%";
const scoreFmt = v => v==null ? "—" : Number(v).toFixed(1);
const teamOf = name => EAST_TEAM.includes(norm(name)) ? "EAST" : "OTHER";

function periodFrom(row, dateIndex){
  if(dateIndex<0) return "Current Snapshot";
  const raw=row[dateIndex];
  let d;
  if(raw instanceof Date) d=raw;
  else if(typeof raw==="number" && raw>20000) d=new Date(Math.round((raw-25569)*86400*1000));
  else d=new Date(raw);
  if(isNaN(d)) return "Current Snapshot";
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0");
  const oneJan=new Date(y,0,1);
  const day=Math.floor((d-oneJan)/86400000);
  const week=Math.ceil((day+oneJan.getDay()+1)/7);
  return `${y}-W${String(week).padStart(2,"0")}|${y}-${m}`;
}

function normalizeRows(rows, headers, filename){
  const idx={};
  for(const k in KEYWORDS) idx[k]=findCol(headers,KEYWORDS[k]);
  const result=[];
  rows.forEach((r,ri)=>{
    const name=idx.name>=0 ? String(r[idx.name]??"").trim() : "";
    const code=idx.code>=0 ? String(r[idx.code]??"").trim() : "";
    if(!name && !code) return;
    const [week,month]=periodFrom(r,idx.date).split("|");
    result.push({
      id: `${Date.now()}_${ri}_${Math.random().toString(36).slice(2)}`,
      importedAt:new Date().toISOString(), sourceFile:filename,
      code,name,team:teamOf(name),week:week||"Current Snapshot",month:month||"Current Snapshot",
      slm:num(idx.slm>=0?r[idx.slm]:null),
      ccpdw:num(idx.ccpdw>=0?r[idx.ccpdw]:null),
      retrip:num(idx.retrip>=0?r[idx.retrip]:null),
      sla:num(idx.sla>=0?r[idx.sla]:null),
      utilization:num(idx.utilization>=0?r[idx.utilization]:null),
      fundamentals:num(idx.fundamentals>=0?r[idx.fundamentals]:null),
      closed:idx.closed>=0?r[idx.closed]:"",
      responseOpp:idx.responseOpp>=0?r[idx.responseOpp]:""
    });
  });
  return result;
}

function percentileScores(records, key, high){
  const valid=records.filter(r=>r[key]!=null);
  if(!valid.length) return new Map();
  const vals=valid.map(r=>r[key]);
  const map=new Map();
  valid.forEach(r=>{
    const v=r[key];
    const better=vals.filter(x=>high?x>v:x<v).length;
    const ties=vals.filter(x=>x===v).length;
    const avgRank=better+(ties+1)/2;
    map.set(r.id, vals.length<=1 ? 100 : 100*(vals.length-avgRank)/(vals.length-1));
  });
  return map;
}

function calculate(records){
  const s1=percentileScores(records,"slm",false);
  const s2=percentileScores(records,"ccpdw",false);
  const s3=percentileScores(records,"retrip",false);
  const s4=percentileScores(records,"sla",true);
  const s5=percentileScores(records,"utilization",true);
  const s6=percentileScores(records,"fundamentals",true);
  return records.map(r=>{
    const pairs=[
      [s1.get(r.id),state.weights.slm],[s2.get(r.id),state.weights.ccpdw],
      [s3.get(r.id),state.weights.retrip],[s4.get(r.id),state.weights.sla],
      [s5.get(r.id),state.weights.utilization],[s6.get(r.id),state.weights.fundamentals]
    ].filter(x=>x[0]!=null);
    const totalW=pairs.reduce((a,x)=>a+x[1],0);
    const score=pairs.length?pairs.reduce((a,x)=>a+x[0]*x[1],0)/totalW:null;
    return {...r,metricScores:{slm:s1.get(r.id),ccpdw:s2.get(r.id),retrip:s3.get(r.id),sla:s4.get(r.id),utilization:s5.get(r.id),fundamentals:s6.get(r.id)},score};
  });
}

function filtered(){
  let r=calculate(state.records);
  if(state.team!=="ALL") r=r.filter(x=>x.team===state.team);
  if(state.period!=="ALL") r=r.filter(x=>x.week===state.period || x.month===state.period);
  if(state.search){
    const q=norm(state.search); r=r.filter(x=>norm(x.name).includes(q)||norm(x.code).includes(q));
  }
  return r;
}

function ranked(records){
  return [...records].sort((a,b)=>(b.score??-1)-(a.score??-1)).map((r,i)=>({...r,rank:i+1}));
}
function band(s){
  if(s==null)return ["No Score",""];
  if(s>=85)return ["Outstanding","outstanding"];
  if(s>=70)return ["Strong","strong"];
  if(s>=55)return ["Developing","developing"];
  return ["Needs Improvement","needs"];
}
function badge(s){const b=band(s);return `<span class="badge ${b[1]}">${b[0]}</span>`}

function populatePeriods(){
  const vals=[...new Set(state.records.flatMap(r=>[r.week,r.month]).filter(Boolean))].sort().reverse();
  $("periodFilter").innerHTML='<option value="ALL">All Periods</option>'+vals.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
  $("periodFilter").value=state.period;
}

function render(){
  populatePeriods();
  $("teamFilter").value=state.team;
  $("searchFilter").value=state.search;
  const titles={dashboard:["Dashboard","Overall performance overview"],ranking:["Employee Ranking","Rank all employees using the configured performance weights"],weekly:["Weekly Performance","Compare CE performance week by week"],monthly:["Monthly Performance","Monthly ranking and trend"],employees:["Employee History","Search an employee and review historical performance"],upload:["Upload Excel","Import the latest performance export"],settings:["Settings","Configure team members and scoring weights"]};
  $("pageTitle").textContent=titles[state.view][0]; $("pageSubtitle").textContent=titles[state.view][1];
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.view===state.view));
  const f=filtered();
  if(state.view==="dashboard") renderDashboard(f);
  else if(state.view==="ranking") renderRanking(f);
  else if(state.view==="weekly") renderPeriod("week",f);
  else if(state.view==="monthly") renderPeriod("month",f);
  else if(state.view==="employees") renderEmployees(f);
  else if(state.view==="upload") renderUpload();
  else renderSettings();
}

function renderDashboard(r){
  const rank=ranked(r), avg=rank.length?rank.reduce((a,x)=>a+(x.score||0),0)/rank.length:null;
  $("content").innerHTML=`
  <div class="cards">
    <div class="card"><div class="label">Employees</div><div class="value">${rank.length}</div><div class="sub">${state.team==="EAST"?"East Team":"Current filter"}</div></div>
    <div class="card"><div class="label">Average Score</div><div class="value">${scoreFmt(avg)}</div><div class="sub">Performance points / 100</div></div>
    <div class="card"><div class="label">Top Performer</div><div class="value" style="font-size:19px">${esc(rank[0]?.name||"—")}</div><div class="sub">${rank[0]?scoreFmt(rank[0].score)+" points":"—"}</div></div>
    <div class="card"><div class="label">East Team</div><div class="value">${state.records.filter(x=>x.team==="EAST").length}</div><div class="sub">6 configured members</div></div>
  </div>
  ${!state.records.length?`<div class="panel empty">No data yet. Click <b>Upload Excel</b> and select your performance export.</div>`:`
  <div class="grid2">
    <div class="panel"><h2>🏆 Top 10</h2>${table(rank.slice(0,10))}</div>
    <div class="panel"><h2>Performance Distribution</h2>${distribution(rank)}</div>
  </div>
  <div class="panel"><h2>Scoring Model</h2><div class="metric-grid">
    ${metric("7 Day SLM Revisit",state.weights.slm,"LOWER IS BETTER")}
    ${metric("CCPDW",state.weights.ccpdw,"LOWER IS BETTER")}
    ${metric("Retrip",state.weights.retrip,"LOWER IS BETTER")}
    ${metric("Response SLA",state.weights.sla,"HIGHER IS BETTER")}
    ${metric("Utilization",state.weights.utilization,"HIGHER IS BETTER")}
    ${metric("Call Fundamentals",state.weights.fundamentals,"HIGHER IS BETTER")}
  </div></div>`}`;
}
function metric(n,w,d){return `<div class="metric"><b>${n} — ${(w*100).toFixed(0)}%</b><strong>${d}</strong></div>`}
function distribution(r){
  const counts={Outstanding:0,Strong:0,Developing:0,"Needs Improvement":0};
  r.forEach(x=>{const b=band(x.score)[0];if(counts[b]!=null)counts[b]++});
  return Object.entries(counts).map(([k,v])=>`<div style="margin:15px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><span>${k}</span><b>${v}</b></div><div class="bar"><span style="width:${r.length?100*v/r.length:0}%"></span></div></div>`).join("");
}
function table(r){
  if(!r.length)return `<div class="empty">No matching records.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Rank</th><th>CE</th><th>Team</th><th>Score</th><th>Performance</th><th>SLM</th><th>CCPDW</th><th>Retrip</th><th>SLA</th><th>Util.</th><th>Fund.</th></tr></thead><tbody>
  ${r.map((x,i)=>`<tr><td class="rank">#${x.rank??i+1}</td><td><b>${esc(x.name)}</b><br><small>${esc(x.code)}</small></td><td>${x.team==="EAST"?"EAST":"Other"}</td><td><b>${scoreFmt(x.score)}</b></td><td>${badge(x.score)}</td><td>${pct(x.slm)}</td><td>${pct(x.ccpdw)}</td><td>${pct(x.retrip)}</td><td>${pct(x.sla)}</td><td>${pct(x.utilization)}</td><td>${pct(x.fundamentals)}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function renderRanking(r){
  $("content").innerHTML=`<div class="panel"><h2>🏆 Full Employee Ranking (${r.length})</h2>${table(ranked(r))}</div>`;
}
function renderPeriod(type,r){
  const key=type==="week"?"week":"month";
  const periods=[...new Set(r.map(x=>x[key]).filter(Boolean))].sort().reverse();
  $("content").innerHTML=periods.length?periods.map(p=>{
    const rr=ranked(r.filter(x=>x[key]===p));
    return `<div class="panel"><h2>${type==="week"?"📅":"📆"} ${esc(p)} — ${rr.length} Employees</h2>${table(rr)}</div>`;
  }).join(""):`<div class="panel empty">No ${type} records found. If your Excel has no date/period column, the upload is stored as Current Snapshot.</div>`;
}
function renderEmployees(r){
  const names=[...new Map(r.map(x=>[x.name,x])).values()];
  $("content").innerHTML=`<div class="panel"><h2>Employee History</h2>${names.length?`<div class="table-wrap"><table><thead><tr><th>Employee</th><th>Team</th><th>Records</th><th>Latest Score</th><th>Average Score</th><th>Best Rank</th></tr></thead><tbody>${names.map(n=>{
    const hist=ranked(r.filter(x=>x.name===n.name)); const avg=hist.reduce((a,x)=>a+(x.score||0),0)/(hist.length||1);
    return `<tr><td><b>${esc(n.name)}</b><br><small>${esc(n.code)}</small></td><td>${n.team}</td><td>${hist.length}</td><td>${scoreFmt(hist[0]?.score)}</td><td>${scoreFmt(avg)}</td><td>#${Math.min(...hist.map(x=>x.rank||999))}</td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">No employees.</div>`}</div>`;
}
function renderUpload(){
  $("content").innerHTML=`<div class="panel"><h2>Upload New Excel</h2><div class="notice"><b>Important:</b> Uploading a file adds a new snapshot; previous records are not deleted. For weekly/monthly history, include a date/period column in the export.</div><div class="dropzone" onclick="$('fileInput').click()">📤<br><b>Click to upload Excel</b><br><small>.xlsx, .xls or .csv</small></div><div style="margin-top:18px"><b>Stored records:</b> ${state.records.length}</div></div>`;
}
function renderSettings(){
  const w=state.weights;
  $("content").innerHTML=`<div class="panel"><h2>East Team Members</h2><p style="color:#718096;font-size:12px">These names are automatically classified as EAST. Matching is case-insensitive.</p>${EAST_TEAM.map(x=>`<div style="padding:9px;border-bottom:1px solid #edf1f5">${esc(x)}</div>`).join("")}</div>
  <div class="panel"><h2>Performance Weights</h2><div class="metric-grid">${weightInput("slm","7 Day SLM Revisit",w.slm)}${weightInput("ccpdw","CCPDW",w.ccpdw)}${weightInput("retrip","Retrip",w.retrip)}${weightInput("sla","Response SLA",w.sla)}${weightInput("utilization","Utilization",w.utilization)}${weightInput("fundamentals","Call Fundamentals",w.fundamentals)}</div><button class="primary" style="margin-top:15px" id="saveWeights">Save Weights</button><span id="weightMsg" style="margin-left:10px"></span></div>
  <div class="panel"><h2>Data Management</h2><p style="font-size:12px;color:#718096">Records: ${state.records.length}. Clearing data cannot be undone.</p><button class="secondary" id="exportJson">Export Backup</button> <button class="secondary" id="clearData">Clear All Data</button></div>`;
  $("saveWeights").onclick=()=>{
    const nw={};["slm","ccpdw","retrip","sla","utilization","fundamentals"].forEach(k=>nw[k]=parseFloat($("w_"+k).value)/100);
    const total=Object.values(nw).reduce((a,b)=>a+b,0);
    if(Math.abs(total-1)>0.001){$("weightMsg").textContent="Weights must total 100%.";return}
    state.weights=nw;localStorage.setItem("cePerformanceWeights",JSON.stringify(nw));$("weightMsg").textContent="Saved.";render();
  };
  $("clearData").onclick=()=>{if(confirm("Delete all uploaded performance records?")){state.records=[];localStorage.removeItem("cePerformanceRecords");render()}};
  $("exportJson").onclick=()=>download("ce-performance-backup.json",JSON.stringify({records:state.records,weights:state.weights},null,2),"application/json");
}
function weightInput(k,n,v){return `<div class="metric"><b>${n}</b><input id="w_${k}" type="number" min="0" max="100" step="1" value="${(v*100).toFixed(0)}" style="width:100%;margin-top:8px;padding:8px;border:1px solid #ccd6e0;border-radius:6px">%</div>`}

async function processFile(file){
  $("uploadStatus").textContent="Reading Excel...";
  const data=await file.arrayBuffer();
  const wb=XLSX.read(data,{type:"array",cellDates:true});
  const sheet=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:""});
  if(rows.length<2) throw new Error("The Excel sheet is empty.");
  const headers=rows[0];
  const parsed=normalizeRows(rows.slice(1),headers,file.name);
  if(!parsed.length) throw new Error("No employee rows were detected. Check the CE Name/Employee Name column.");
  state.records=[...state.records,...parsed];
  localStorage.setItem("cePerformanceRecords",JSON.stringify(state.records));
  $("uploadStatus").innerHTML=`<b>Upload complete:</b> ${parsed.length} employee records added. Total stored: ${state.records.length}.`;
  setTimeout(()=>{$("uploadModal").classList.remove("show");state.view="dashboard";render()},900);
}

$("fileInput").addEventListener("change",e=>{if(e.target.files[0])processFile(e.target.files[0]).catch(err=>alert(err.message))});
$("quickUpload").onclick=()=>$("uploadModal").classList.add("show");
$("closeModal").onclick=()=>$("uploadModal").classList.remove("show");
$("dropzone").onclick=()=>$("fileInput").click();
$("dropzone").addEventListener("dragover",e=>{e.preventDefault();$("dropzone").style.background="#eaf4ff"});
$("dropzone").addEventListener("dragleave",()=>$("dropzone").style.background="");
$("dropzone").addEventListener("drop",e=>{e.preventDefault();$("dropzone").style.background="";const f=e.dataTransfer.files[0];if(f)processFile(f).catch(err=>alert(err.message))});
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>{state.view=n.dataset.view;render()});
$("teamFilter").onchange=e=>{state.team=e.target.value;render()};
$("periodFilter").onchange=e=>{state.period=e.target.value;render()};
$("searchFilter").oninput=e=>{state.search=e.target.value;render()};
$("clearFilters").onclick=()=>{state.team="ALL";state.period="ALL";state.search="";render()};

render();
