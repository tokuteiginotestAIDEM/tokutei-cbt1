const SHEET_EXAMS = "試験一覧";
const SHEET_QUESTIONS = "問題一覧";
const SHEET_RESULTS = "受験結果";
const SHEET_SUBMISSIONS = "送信データ";

function setupCBT() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss,SHEET_EXAMS,["試験ID","試験名","サブタイトル","制限時間（分）","合格基準（％）","公開","更新日時"]);
  ensureSheet_(ss,SHEET_QUESTIONS,["試験ID","問題番号","分野","問題文","選択肢A","選択肢B","選択肢C","選択肢D","正解","解説"]);
  ensureSheet_(ss,SHEET_RESULTS,["受験日時","送信ID","試験ID","試験名","企業名","氏名","正解数","問題数","正答率（％）","合否","自動提出","分野別結果","弱点分野","解答詳細"]);
  ensureSheet_(ss,SHEET_SUBMISSIONS,["送信ID","処理完了","結果データ","作成日時"]);
}

function setAdminPassword() {
  // 下の文字列を管理者パスワードに変更して、この関数を1回実行してください。
  PropertiesService.getScriptProperties().setProperty("ADMIN_PASSWORD","CHANGE_ME_1234");
}

function doGet(e) {
  setupCBT();
  const action = e.parameter.action || "";
  const callback = e.parameter.callback || "callback";
  try {
    let data;
    if(action==="publicExams") data={ok:true,exams:getPublicExams_()};
    else if(action==="getExam") data={ok:true,exam:getPublicExam_(e.parameter.id)};
    else if(action==="submissionResult") data=getSubmissionResult_(e.parameter.submissionId);
    else if(action==="adminPing"){assertAdmin_(e.parameter.key);data={ok:true}}
    else if(action==="adminResults"){assertAdmin_(e.parameter.key);data={ok:true,results:getAdminResults_()}}
    else if(action==="adminExams"){assertAdmin_(e.parameter.key);data={ok:true,exams:getAdminExams_()}}
    else data={ok:false,error:"Unknown action"};
    return jsonp_(callback,data);
  } catch(err) {
    return jsonp_(callback,{ok:false,error:String(err.message||err)});
  }
}

function doPost(e) {
  setupCBT();
  try {
    const data=JSON.parse(e.postData.contents||"{}");
    if(data.action==="submit") submit_(data);
    else {
      assertAdmin_(data.adminKey);
      if(data.action==="saveExam") saveExam_(data.exam);
      else if(data.action==="setPublished") setPublished_(data.id,Boolean(data.published));
      else if(data.action==="deleteExam") deleteExam_(data.id);
      else throw new Error("Unknown admin action");
    }
  } catch(err) {
    console.error(err);
  }
  return ContentService.createTextOutput("OK");
}

function submit_(data) {
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const exams=getAdminExams_();
  const meta=exams.find(x=>x.id===data.examId);
  if(!meta) throw new Error("Exam not found");
  const qs=getQuestions_(data.examId);
  const answers=Array.isArray(data.answers)?data.answers:[];
  let correct=0; const cats={}; const details=[];
  qs.forEach((q,i)=>{
    const ans=(answers[i]===null||answers[i]===undefined)?null:Number(answers[i]);
    const ok=ans===q.correct;if(ok)correct++;
    if(!cats[q.category])cats[q.category]={category:q.category,correct:0,total:0};
    cats[q.category].total++;if(ok)cats[q.category].correct++;
    details.push({no:q.id,category:q.category,answer:ans,correct:q.correct,isCorrect:ok});
  });
  const categories=Object.values(cats).map(c=>({...c,percent:Math.round(c.correct/c.total*1000)/10}));
  const weakCategories=categories.filter(c=>c.percent<70).sort((a,b)=>a.percent-b.percent).map(c=>c.category);
  const percent=Math.round(correct/qs.length*1000)/10;
  const result={correct,total:qs.length,percent,passed:percent>=meta.passPercent,categories};
  const sh=ss.getSheetByName(SHEET_RESULTS);
  sh.appendRow([new Date(),data.submissionId,data.examId,meta.title,data.company||"",data.studentName||"",correct,qs.length,percent,result.passed,Boolean(data.autoSubmitted),JSON.stringify(categories),JSON.stringify(weakCategories),JSON.stringify(details)]);
  const cache=ss.getSheetByName(SHEET_SUBMISSIONS);
  cache.appendRow([data.submissionId,true,JSON.stringify({ok:true,ready:true,result}),new Date()]);
}

function getSubmissionResult_(id) {
  if(!id) return {ok:false,ready:false};
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SUBMISSIONS);
  const vals=sh.getDataRange().getValues();
  for(let i=vals.length-1;i>=1;i--) if(String(vals[i][0])===String(id)) return JSON.parse(vals[i][2]);
  return {ok:true,ready:false};
}

function getPublicExams_(){
  return getAdminExams_().filter(e=>e.published).map(e=>({id:e.id,title:e.title,subtitle:e.subtitle,durationMinutes:e.durationMinutes,passPercent:e.passPercent,questionCount:e.questionCount}));
}
function getPublicExam_(id){
  const meta=getAdminExams_().find(e=>e.id===id&&e.published);if(!meta)throw new Error("Exam is not published");
  const qs=getQuestions_(id).map(q=>({id:q.id,category:q.category,question:q.question,choices:q.choices}));
  return {...meta,questions:qs};
}
function getAdminExams_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(SHEET_EXAMS),vals=sh.getDataRange().getValues();
  const counts={};getQuestionsAll_().forEach(q=>counts[q.examId]=(counts[q.examId]||0)+1);
  return vals.slice(1).filter(r=>r[0]).map(r=>({id:String(r[0]),title:String(r[1]),subtitle:String(r[2]),durationMinutes:Number(r[3])||70,passPercent:Number(r[4])||70,published:r[5]===true||String(r[5]).toLowerCase()==="true",updatedAt:r[6],questionCount:counts[String(r[0])]||0}));
}
function getQuestionsAll_(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_QUESTIONS),vals=sh.getDataRange().getValues();
  return vals.slice(1).filter(r=>r[0]).map(r=>({examId:String(r[0]),id:Number(r[1]),category:String(r[2]),question:String(r[3]),choices:[String(r[4]),String(r[5]),String(r[6]),String(r[7])],correct:Number(r[8]),explanation:String(r[9]||"")}));
}
function getQuestions_(id){return getQuestionsAll_().filter(q=>q.examId===id).sort((a,b)=>a.id-b.id)}
function saveExam_(exam){
  if(!exam||!exam.id||!exam.title||!Array.isArray(exam.questions))throw new Error("Invalid exam");
  const ss=SpreadsheetApp.getActiveSpreadsheet(),esh=ss.getSheetByName(SHEET_EXAMS),qsh=ss.getSheetByName(SHEET_QUESTIONS);
  deleteRowsByValue_(esh,1,exam.id);deleteRowsByValue_(qsh,1,exam.id);
  esh.appendRow([exam.id,exam.title,exam.subtitle||"飲食料品製造業",Number(exam.durationMinutes)||70,Number(exam.passPercent)||70,Boolean(exam.published),new Date()]);
  const rows=exam.questions.map((q,i)=>[exam.id,Number(q.id)||i+1,q.category||"",q.question||"",q.choices[0]||"",q.choices[1]||"",q.choices[2]||"",q.choices[3]||"",Number(q.correct),q.explanation||""]);
  if(rows.length)qsh.getRange(qsh.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows);
}
function setPublished_(id,published){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_EXAMS),vals=sh.getDataRange().getValues();
  for(let i=1;i<vals.length;i++)if(String(vals[i][0])===String(id)){sh.getRange(i+1,6).setValue(published);return}
  throw new Error("Exam not found");
}
function deleteExam_(id){const ss=SpreadsheetApp.getActiveSpreadsheet();deleteRowsByValue_(ss.getSheetByName(SHEET_EXAMS),1,id);deleteRowsByValue_(ss.getSheetByName(SHEET_QUESTIONS),1,id)}
function getAdminResults_(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RESULTS),vals=sh.getDataRange().getValues();
  return vals.slice(1).filter(r=>r[0]).reverse().map(r=>({timestamp:Utilities.formatDate(new Date(r[0]),Session.getScriptTimeZone(),"yyyy-MM-dd HH:mm"),submissionId:String(r[1]),examId:String(r[2]),examTitle:String(r[3]),company:String(r[4]),studentName:String(r[5]),correct:Number(r[6]),total:Number(r[7]),percent:Number(r[8]),passed:r[9]===true||String(r[9]).toLowerCase()==="true",autoSubmitted:r[10]===true||String(r[10]).toLowerCase()==="true",categories:JSON.parse(r[11]||"[]"),weakCategories:JSON.parse(r[12]||"[]")}));
}
function assertAdmin_(key){const p=PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");if(!p||String(key)!==String(p))throw new Error("Unauthorized")}
function ensureSheet_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.appendRow(headers)}return sh}
function deleteRowsByValue_(sh,col,value){const vals=sh.getDataRange().getValues();for(let i=vals.length-1;i>=1;i--)if(String(vals[i][col-1])===String(value))sh.deleteRow(i+1)}
function jsonp_(callback,obj){const safe=/^[A-Za-z0-9_$.]+$/.test(callback)?callback:"callback";return ContentService.createTextOutput(safe+"("+JSON.stringify(obj)+");").setMimeType(ContentService.MimeType.JAVASCRIPT)}
