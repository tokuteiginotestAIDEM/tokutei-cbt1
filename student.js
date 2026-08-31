const app=document.getElementById("app");
let state={exam:null,current:0,answers:[],marked:[],remaining:0,timerId:null,company:"",studentName:"",locked:false};
const $=id=>document.getElementById(id);

const MASCOTS = [
  "assets/character-01.png","assets/character-02.png","assets/character-03.png","assets/character-04.png",
  "assets/character-05.png","assets/character-06.png","assets/character-07.png","assets/character-08.png"
];
function brandBar(title="", timer=false){
  return `<div class="brandbar">
    <div class="brand-logos">
      <img src="assets/aidem-logo.png" class="brand-logo aidem" alt="AIDEM">
      <span class="brand-sep">›</span>
      <img src="assets/aidem-global-logo.png" class="brand-logo global" alt="アイデムグローバル">
      <span class="brand-sep">›</span>
      <div class="team-brand"><img src="assets/aitoku-logo.png" class="brand-logo aitoku" alt="アイトク"></div>
    </div>
    <div class="brand-title">${esc(title)}</div>
    ${timer?'<div id="timer" class="timer">--:--</div>':""}
  </div>`;
}
function mascotFor(i){ return MASCOTS[i % MASCOTS.length]; }

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function clearTimer(){if(state.timerId){clearInterval(state.timerId);state.timerId=null}}
function jsonp(params){
  return new Promise((resolve,reject)=>{
    if(!CBT_CONFIG.apiUrl){reject(new Error("API URL chưa được cài"));return}
    const cb="cb_"+Date.now()+"_"+Math.random().toString(36).slice(2);
    const script=document.createElement("script");
    const timer=setTimeout(()=>{cleanup();reject(new Error("Timeout"))},15000);
    function cleanup(){clearTimeout(timer);delete window[cb];script.remove()}
    window[cb]=(data)=>{cleanup();resolve(data)};
    const qs=new URLSearchParams({...params,callback:cb});
    script.src=CBT_CONFIG.apiUrl+"?"+qs.toString();script.onerror=()=>{cleanup();reject(new Error("Network error"))};
    document.body.appendChild(script);
  });
}
async function home(){
  clearTimer();state.locked=false;
  app.innerHTML=`${brandBar(CBT_CONFIG.siteTitle)}<div class="page"><div class="hero"><h1>飲食料品製造業 模擬試験</h1><p>受験する模擬試験を選択してください。</p></div><div id="examList" class="exam-list"><div class="panel">試験データを読み込んでいます...</div></div></div>`;
  try{
    const data=await jsonp({action:"publicExams"});
    if(!data.ok)throw new Error(data.error||"Load failed");
    $("examList").innerHTML=data.exams.map((e,i)=>`<div class="exam-card"><div class="exam-card-visual"><img src="${mascotFor(i)}" alt="" class="exam-mascot"></div><h2>${esc(e.title)}</h2><div class="meta">${esc(e.subtitle||"飲食料品製造業")}<br>${e.questionCount}問 ・ ${e.durationMinutes}分 ・ 合格基準 ${e.passPercent}%</div><button class="btn primary full" onclick="openExam('${e.id}')">試験を選択</button></div>`).join("") || `<div class="panel">現在公開中の試験はありません。</div>`;
  }catch(e){$("examList").innerHTML=`<div class="panel">試験を読み込めませんでした。管理者に連絡してください。<div class="note">${esc(e.message)}</div></div>`}
}
window.openExam=async function(id){
  app.innerHTML=`${brandBar("試験データ読み込み中")}<div class="form-card">試験を読み込んでいます...</div>`;
  try{
    const data=await jsonp({action:"getExam",id});
    if(!data.ok)throw new Error(data.error||"Load failed");
    state.exam=data.exam;
    app.innerHTML=`${brandBar(state.exam.title)}<div class="form-card"><h2>${esc(state.exam.title)}</h2><p>${esc(state.exam.subtitle||"飲食料品製造業")}</p>
      <div class="field"><label>企業名 / 企業名</label><input id="companyInput"></div>
      <div class="field"><label>氏名 / 氏名</label><input id="nameInput"></div>
      <div class="rules">問題数：${state.exam.questions.length}問<br>制限時間：${state.exam.durationMinutes}分<br>合格基準：${state.exam.passPercent}%<br>時間が終了すると自動的に提出され、その後は回答できません。</div>
      <button class="btn primary full" onclick="startExam()">試験を開始する</button><button class="btn secondary full" style="margin-top:8px" onclick="home()">戻る</button></div>`;
  }catch(e){alert("試験を読み込めませんでした。");home()}
}
window.startExam=function(){
  const company=$("companyInput").value.trim(),name=$("nameInput").value.trim();
  if(!company){alert("企業名を入力してください。");return}
  if(!name){alert("氏名を入力してください。");return}
  state.company=company;state.studentName=name;state.current=0;state.answers=Array(state.exam.questions.length).fill(null);state.marked=Array(state.exam.questions.length).fill(false);state.remaining=(state.exam.durationMinutes||70)*60;state.locked=false;
  renderExam();state.timerId=setInterval(tick,1000);updateTimer();
}
function renderExam(){
  if(state.locked)return;
  const q=state.exam.questions[state.current];
  app.innerHTML=`${brandBar(state.exam.title,true)}
  <div class="exam-layout"><aside class="sidebar"><div class="student-box"><small>企業名</small><br><b>${esc(state.company)}</b><br><small>受験者</small><br><b>${esc(state.studentName)}</b></div><b>問題一覧</b><div id="questionGrid" class="question-grid"></div><div class="legend">青：現在　緑：回答済み　黄線：見直し</div><div class="sidebar-mascot"><img src="assets/character-07.png" alt=""></div><button class="submit" onclick="confirmSubmit()">試験を終了する</button></aside>
  <section class="exam-main"><div class="q-head"><div><span class="badge">${esc(q.category||"")}</span>　<b>問題 ${state.current+1} / ${state.exam.questions.length}</b></div><button class="mark ${state.marked[state.current]?"active":""}" onclick="toggleMark()">${state.marked[state.current]?"★":"☆"} 見直し</button></div>
  <div class="q-card"><div class="question">${esc(q.question)}</div>${q.choices.map((c,i)=>`<div class="choice ${state.answers[state.current]===i?"selected":""}" onclick="choose(${i})"><span class="letter">${String.fromCharCode(65+i)}</span><span>${esc(c)}</span></div>`).join("")}</div>
  <div class="nav"><button class="secondary" onclick="prevQ()" ${state.current===0?"disabled":""}>← 前の問題</button><button class="primary" onclick="nextQ()">${state.current===state.exam.questions.length-1?"確認する":"次の問題 →"}</button></div></section></div>`;
  renderGrid();updateTimer();
}
function renderGrid(){$("questionGrid").innerHTML=state.exam.questions.map((_,i)=>`<button class="q-btn ${i===state.current?"current":""} ${state.answers[i]!==null?"answered":""} ${state.marked[i]?"marked":""}" onclick="jumpQ(${i})">${i+1}</button>`).join("")}
window.choose=i=>{if(state.locked)return;state.answers[state.current]=i;renderExam()}
window.toggleMark=()=>{if(state.locked)return;state.marked[state.current]=!state.marked[state.current];renderExam()}
window.prevQ=()=>{if(!state.locked&&state.current>0){state.current--;renderExam()}}
window.nextQ=()=>{if(state.locked)return;if(state.current<state.exam.questions.length-1){state.current++;renderExam()}else confirmSubmit()}
window.jumpQ=i=>{if(!state.locked){state.current=i;renderExam()}}
window.confirmSubmit=function(){if(state.locked)return;const n=state.answers.filter(x=>x===null).length;if(confirm(n?`未回答が ${n} 問あります。提出しますか？`:"試験を提出しますか？"))submitExam(false)}
function tick(){if(state.locked)return;state.remaining--;updateTimer();if(state.remaining<=0){state.remaining=0;updateTimer();state.locked=true;clearTimer();alert("試験時間が終了しました。70分が終了したため、自動的に提出します。");submitExam(true)}}
function updateTimer(){const el=$("timer");if(!el)return;const t=Math.max(0,state.remaining),m=Math.floor(t/60).toString().padStart(2,"0"),s=(t%60).toString().padStart(2,"0");el.textContent=`${m}:${s}`}
async function submitExam(auto){
  if(!state.locked){state.locked=true;clearTimer()}
  app.innerHTML=`${brandBar("採点中")}<div class="form-card">採点中です...</div>`;
  const payload={action:"submit",examId:state.exam.id,company:state.company,studentName:state.studentName,answers:state.answers,autoSubmitted:auto};
  try{
    const data=await postOpaqueThenJsonp(payload);
    if(!data.ok)throw new Error(data.error||"Submit failed");
    renderResult(data.result,auto);
  }catch(e){
    app.innerHTML=`<div class="form-card"><h2>送信エラー</h2><p>結果を送信できませんでした。ネットワークを確認して、もう一度送信してください。</p><button class="btn primary full" onclick='retrySubmit(${auto?"true":"false"})'>再送信</button></div>`;
  }
}
window.retrySubmit=submitExam;
async function postOpaqueThenJsonp(payload){
  const submissionId="s_"+Date.now()+"_"+Math.random().toString(36).slice(2);
  payload.submissionId=submissionId;
  await fetch(CBT_CONFIG.apiUrl,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
  for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,500));const d=await jsonp({action:"submissionResult",submissionId});if(d&&d.ready)return d}
  throw new Error("Result timeout");
}
function renderResult(r,auto){
  app.innerHTML=`${brandBar(state.exam.title)}<div class="result-wrap"><div class="result-mascot"><img src="assets/character-06.png" alt=""></div><h2 style="text-align:center">試験結果</h2><div class="score">${r.percent}%</div><div class="${r.passed?"pass":"fail"}">${r.passed?"合格":"不合格"}${auto?"（時間切れ）":""}</div>
  <div class="summary-grid"><div class="summary-card">正解数<b>${r.correct}/${r.total}</b></div>${r.categories.map(c=>`<div class="summary-card">${esc(c.category)}<b>${c.correct}/${c.total} = ${c.percent}%</b></div>`).join("")}</div>
  <div class="note">学生画面では基本結果のみ表示されます。正答・詳細分析は管理者画面で確認できます。</div><button class="btn primary full" style="margin-top:18px" onclick="home()">終了</button></div>`;
}
let calcExpr="";
document.getElementById("calcFab").onclick=()=>document.getElementById("calculator").classList.toggle("hidden");
document.getElementById("calcClose").onclick=()=>document.getElementById("calculator").classList.add("hidden");
document.querySelectorAll("[data-calc]").forEach(b=>b.onclick=()=>{const v=b.dataset.calc;if(v==="C")calcExpr="";else if(v==="DEL")calcExpr=calcExpr.slice(0,-1);else if(v==="="){try{if(!/^[0-9+\-*/%.() ]+$/.test(calcExpr))throw 0;calcExpr=String(Function('"use strict";return ('+calcExpr+')')())}catch{calcExpr="Error"}}else{if(calcExpr==="Error")calcExpr="";calcExpr+=v}document.getElementById("calcDisplay").value=calcExpr||"0"});
home();