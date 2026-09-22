const STORAGE_KEY_PREFIX='training-engine-v1';
const SUPPORTED_SCHEMA_VERSION=2;
const DEFAULT_QUESTION_COUNT=60;
const OPTION_KEYS=['A','B','C','D'];
const RUN_MODE_STORAGE_KEY_PREFIX='training-engine-run-mode:';
const CORRUPT_PROGRESS_BACKUP_KEY_PREFIX='training-engine-corrupt-progress-v1:';
const views=['start-view','exam-view','results-view','progress-view'];
const $=id=>document.getElementById(id);

let bankConfig=null;
let bank=[];
let questionLookup=new Map();
let state=null;
let active=null;
let index=0;
let ticker=null;
let controlsBound=false;
let blocked=false;
let currentResult=null;
let persistenceWarningShown=false;
let corruptProgressWarningShown=false;
let lastPersistedState=null;

function init(){
  try{
    const runtimeBank=discoverRuntimeBank();
    bankConfig=loadBankDefinition(runtimeBank.bank);
    $('bank-identity').textContent=runtimeBank.sourceName;
    window.TRAINING_ENGINE_BANKS?.setActiveBank(runtimeBank);
    bank=bankConfig.questions;
    questionLookup=new Map(bank.map(question=>[question.id,question]));
    bind();
    renderBankSummary();
    const loaded=loadStoredState();
    state=loaded.state;
    active=state.activeAttempt||null;
    if(loaded.corruptProgress)showCorruptProgressWarning(loaded.backupPreserved);else clearError();
    setControlsDisabled(false);renderHome();
  }catch(error){renderFatalError(error.message);}
}

function discoverRuntimeBank(){
  const stored=window.TRAINING_ENGINE_RUNTIME_BANK;
  if(stored&&isPlainObject(stored)&&typeof stored.sourceName==='string'&&stored.sourceName.trim())return{sourceName:stored.sourceName.trim(),bank:stored.bank};
  const matches=[];
  Object.keys(window).forEach(name=>{try{const candidate=window[name];loadBankDefinition(candidate);matches.push({sourceName:name,bank:candidate});}catch{}});
  if(!matches.length)throw new Error('No supported schemaVersion 2 question bank was found on window.');
  if(matches.length>1)throw new Error(`Multiple supported schemaVersion 2 question banks were found on window (${matches.map(match=>match.sourceName).join(', ')}).`);
  return matches[0];
}
function loadBankDefinition(raw){
  if(!isPlainObject(raw))throw new Error('Question bank did not load correctly.');
  if(raw.schemaVersion!==SUPPORTED_SCHEMA_VERSION)throw new Error(`Unsupported question-bank schema version: ${raw.schemaVersion}.`);
  if(typeof raw.bankId!=='string'||!raw.bankId.trim())throw new Error('Question bank is missing a non-empty bankId.');
  if(typeof raw.bankVersion!=='string'||!raw.bankVersion.trim())throw new Error('Question bank is missing a non-empty bankVersion.');
  if(typeof raw.title!=='string'||!raw.title.trim())throw new Error('Question bank is missing a non-empty title.');
  if(!Array.isArray(raw.questions)||!raw.questions.length)throw new Error('Question bank must provide a non-empty questions array.');
  const seenIds=new Set();
  const questions=raw.questions.map((question,position)=>validateQuestion(question,position,seenIds));
  return{schemaVersion:raw.schemaVersion,bankId:raw.bankId.trim(),bankVersion:raw.bankVersion.trim(),title:raw.title.trim(),questions};
}

function validateQuestion(question,position,seenIds){
  if(!isPlainObject(question))throw new Error(`Question ${position+1} is not an object.`);
  if(typeof question.id!=='string'||!question.id.trim())throw new Error(`Question ${position+1} is missing a non-empty id.`);
  if(seenIds.has(question.id))throw new Error(`Question IDs must be unique. Duplicate: ${question.id}`);
  seenIds.add(question.id);
  const questionKeys=Object.keys(question).sort();
  if(questionKeys.join(',')!==['answer','domain','id','options','stem','target'].join(','))throw new Error(`Question ${question.id} must define exactly id, domain, target, stem, options, and answer.`);
  if(typeof question.stem!=='string'||!question.stem.trim())throw new Error(`Question ${question.id} must have a non-empty stem.`);
  if(typeof question.target!=='string')throw new Error(`Question ${question.id} must have a string target.`);
  if(typeof question.domain!=='string')throw new Error(`Question ${question.id} must have a string domain.`);
  if(!isPlainObject(question.options))throw new Error(`Question ${question.id} must have an options object.`);
  const optionKeys=Object.keys(question.options).sort();
  if(optionKeys.join(',')!==OPTION_KEYS.join(','))throw new Error(`Question ${question.id} must define exactly options A, B, C, and D.`);
  OPTION_KEYS.forEach(key=>{if(typeof question.options[key]!=='string'||!question.options[key].trim())throw new Error(`Question ${question.id} option ${key} must be a non-empty string.`);});
  if(!OPTION_KEYS.includes(question.answer))throw new Error(`Question ${question.id} must have answer A, B, C, or D.`);
  return{id:question.id,domain:question.domain,target:question.target,stem:question.stem,options:{A:question.options.A,B:question.options.B,C:question.options.C,D:question.options.D},answer:question.answer};
}

function defaultState(){
  return{version:2,bankId:bankConfig.bankId,bankVersion:bankConfig.bankVersion,settings:{questionCount:Math.min(DEFAULT_QUESTION_COUNT,bank.length),durationMinutes:60,includeMastered:false},mastery:{},attempts:[],activeAttempt:null};
}

function progressStorageKey(){return`${STORAGE_KEY_PREFIX}:${bankConfig.bankId}:${bankConfig.bankVersion}`;}
function corruptProgressBackupKey(){return`${CORRUPT_PROGRESS_BACKUP_KEY_PREFIX}${bankConfig.bankId}:${bankConfig.bankVersion}`;}

function loadStoredState(){
  const fallback=defaultState();
  const canonical=readCompatibleStoredState(progressStorageKey());
  if(canonical.state)return{state:canonical.state,corruptProgress:false,backupPreserved:false};
  if(canonical.corrupt)return{state:fallback,corruptProgress:true,backupPreserved:preserveCorruptProgress(canonical.raw)};
  return{state:fallback,corruptProgress:false,backupPreserved:false};
}

function readCompatibleStoredState(key){
  let serialized;
  try{serialized=localStorage.getItem(key);}catch{return{state:null,corrupt:false};}
  if(serialized===null)return{state:null,corrupt:false};
  try{
    const normalized=normalizeStateIdentity(JSON.parse(serialized),false);
    if(normalized.bankId!==bankConfig.bankId||normalized.bankVersion!==bankConfig.bankVersion)throw new Error('Stored progress belongs to a different bank identity.');
    return{state:mergeState(normalized),corrupt:false};
  }catch{return{state:null,corrupt:true,raw:serialized};}
}

function preserveCorruptProgress(raw){
  try{
    const key=corruptProgressBackupKey();
    if(localStorage.getItem(key)!==null)return true;
    localStorage.setItem(key,raw);
    return true;
  }catch{return false;}
}

function showCorruptProgressWarning(backupPreserved){
  if(corruptProgressWarningShown)return;
  corruptProgressWarningShown=true;
  const recovery=backupPreserved?' A raw recovery copy was preserved locally.':' The browser could not preserve a recovery copy.';
  showErrorHtml('<strong>Stored progress could not be loaded.</strong><br>A safe default state was started.'+recovery);
}

function normalizeStateIdentity(raw,allowLegacy){
  if(!isPlainObject(raw)||raw.version!==2||!Array.isArray(raw.attempts)||!isPlainObject(raw.mastery)||!isPlainObject(raw.settings))throw new Error('Unsupported progress data.');
  const normalized={...raw};
  const hasBankId=typeof normalized.bankId==='string'&&normalized.bankId.trim();
  const hasBankVersion=typeof normalized.bankVersion==='string'&&normalized.bankVersion.trim();
  if(!hasBankId||!hasBankVersion){
    throw new Error('Progress data is missing bank identity.');
  }else{
    normalized.bankId=normalized.bankId.trim();
    normalized.bankVersion=normalized.bankVersion.trim();
  }
  return normalized;
}

function mergeState(data){
  const merged=defaultState();
  const settings=isPlainObject(data.settings)?data.settings:{};
  merged.bankId=data.bankId;
  merged.bankVersion=data.bankVersion;
  merged.mastery=isPlainObject(data.mastery)?data.mastery:{};
  merged.attempts=Array.isArray(data.attempts)?data.attempts.map(sanitizeCompletedAttempt).filter(Boolean):[];
  merged.settings={questionCount:clampQuestionCount(settings.questionCount,bank.length),durationMinutes:Math.max(0,Number(settings.durationMinutes)||0),includeMastered:Boolean(settings.includeMastered)};
  merged.activeAttempt=sanitizeActiveAttempt(data.activeAttempt);
  return merged;
}

function sanitizeActiveAttempt(attempt){
  if(!isPlainObject(attempt)||!Array.isArray(attempt.items)||!isPlainObject(attempt.responses)||!attempt.items.length)return null;
  const items=attempt.items
    .filter(item=>isPlainObject(item)&&typeof item.questionId==='string'&&questionLookup.has(item.questionId)&&isOptionOrder(item.optionOrder))
    .map(item=>({questionId:item.questionId,optionOrder:[...item.optionOrder]}));
  if(!items.length)return null;
  const responses=Object.fromEntries(items.map(item=>{
    const response=isPlainObject(attempt.responses[item.questionId])?attempt.responses[item.questionId]:{};
    return[item.questionId,createResponseState(response)];
  }));
  return{id:typeof attempt.id==='string'&&attempt.id?attempt.id:`attempt-${Number(attempt.startedAt)||Date.now()}`,startedAt:Number(attempt.startedAt)||Date.now(),durationMinutes:Math.max(0,Number(attempt.durationMinutes)||0),expiresAt:attempt.expiresAt===null?null:Number(attempt.expiresAt)||null,currentIndex:Math.max(0,Math.min(Number(attempt.currentIndex)||0,items.length-1)),mode:sanitizeRunMode(attempt.mode),items,responses};
}

function nonNegativeInteger(value,fallback=0){const number=Number(value);return Number.isInteger(number)&&number>=0?number:fallback;}
function nonNegativeFinite(value,fallback=0){const number=Number(value);return Number.isFinite(number)&&number>=0?number:fallback;}
function safeString(value,fallback=''){return typeof value==='string'?value:fallback;}
function sanitizeCompletedItem(item){
  if(!isPlainObject(item)||!safeString(item.id).trim())return null;
  const options=isPlainObject(item.options)?item.options:{};
  return{
    id:safeString(item.id).trim(),number:nonNegativeInteger(item.number),questionNumber:Number.isInteger(Number(item.questionNumber))&&Number(item.questionNumber)>0?Number(item.questionNumber):null,
    domain:safeString(item.domain),target:safeString(item.target),stem:safeString(item.stem),
    options:{A:safeString(options.A),B:safeString(options.B),C:safeString(options.C),D:safeString(options.D)},
    answer:isOptionKey(item.answer)?item.answer:null,correctAnswer:isOptionKey(item.correctAnswer)?item.correctAnswer:null,
    correct:Boolean(item.correct),optionOrder:isOptionOrder(item.optionOrder)?[...item.optionOrder]:[],
    displayedAnswer:safeString(item.displayedAnswer,null),displayedCorrectAnswer:safeString(item.displayedCorrectAnswer,null),
    confidence:isConfidenceValue(item.confidence)?Number(item.confidence):null,flagged:Boolean(item.flagged),newlyMastered:Boolean(item.newlyMastered),note:sanitizeNote(item.note)
  };
}
function sanitizeCompletedAttempt(attempt){
  if(!isPlainObject(attempt)||!Array.isArray(attempt.items))return null;
  const items=attempt.items.map(sanitizeCompletedItem).filter(Boolean);
  if(items.length!==attempt.items.length)return null;
  return{
    id:safeString(attempt.id)||`attempt-${nonNegativeInteger(attempt.startedAt)}`,
    startedAt:nonNegativeFinite(attempt.startedAt),finishedAt:nonNegativeFinite(attempt.finishedAt),durationSeconds:nonNegativeInteger(attempt.durationSeconds),
    configuredQuestionCount:nonNegativeInteger(attempt.configuredQuestionCount),configuredMinutes:nonNegativeFinite(attempt.configuredMinutes),
    expired:Boolean(attempt.expired),correct:nonNegativeInteger(attempt.correct),total:nonNegativeInteger(attempt.total),percent:nonNegativeFinite(attempt.percent),
    runMode:sanitizeRunMode(attempt.runMode),items
  };
}
function saveState(){
  if(!state)return false;
  state.bankId=bankConfig.bankId;
  state.bankVersion=bankConfig.bankVersion;
  state.activeAttempt=active;
  let serialized;
  try{serialized=JSON.stringify(state);}catch{showPersistenceWarning();return false;}
  if(serialized===lastPersistedState){clearPersistenceWarning();return true;}
  if(!writeLocalStorage(progressStorageKey(),serialized))return false;
  lastPersistedState=serialized;
  clearPersistenceWarning();
  return true;
}

function showPersistenceWarning(){
  if(persistenceWarningShown)return;
  persistenceWarningShown=true;
  showErrorHtml('<strong>Local progress could not be saved.</strong><br>Your current session can continue, but changes may be lost when you close the page. Export progress or free browser storage before closing the page.');
}

function writeLocalStorage(key,value){
  try{localStorage.setItem(key,value);return true;}catch{showPersistenceWarning();return false;}
}

function clearPersistenceWarning(){
  if(!persistenceWarningShown)return;
  persistenceWarningShown=false;
  $('error').hidden=true;$('error').innerHTML='';
}

window.TRAINING_ENGINE_NOTIFY_PERSISTENCE_FAILURE=showPersistenceWarning;

function bind(){
  if(controlsBound)return;
  controlsBound=true;
  $('start-btn').onclick=startNew;
  $('customize-btn').onclick=openCustomize;
  $('save-customize').onclick=saveCustomize;
  $('resume-btn').onclick=resume;
  $('history-btn').onclick=renderProgress;$('progress-btn').onclick=renderProgress;$('progress-home-btn').onclick=renderHome;$('home-btn').onclick=renderHome;
  $('prev-btn').onclick=()=>move(-1);$('next-btn').onclick=()=>move(1);$('flag-btn').onclick=toggleFlag;
  $('navigator-btn').onclick=()=>{$('navigator').hidden=!$('navigator').hidden;renderNavigator();};
  $('submit-btn').onclick=()=>submit(false);$('export-btn').onclick=exportProgress;$('export-run-btn').onclick=()=>{if(currentResult)exportRun(currentResult);};$('import-input').onchange=importProgress;$('reset-btn').onclick=()=>resetProgress(true);
  document.querySelectorAll('input[name="confidence"]').forEach(el=>el.onchange=e=>{if(blocked)return;currentResponse().confidence=Number(e.target.value);saveState();renderNavigator();});
  $('question-note').oninput=e=>{if(blocked||!active)return;currentResponse().note=e.target.value;saveState();};
}

function showView(id){views.forEach(viewId=>$(viewId).hidden=viewId!==id);$('timer').style.visibility=id==='exam-view'&&active?.durationMinutes>0?'visible':'hidden';}

function renderBankSummary(){
  $('bank-summary').textContent=`${bankConfig.title} · v${bankConfig.bankVersion} · ${bank.length} question${bank.length===1?'':'s'}`;
}

function renderHome(){
  if(blocked)return;
  currentResult=null;
  clearInterval(ticker);showView('start-view');$('resume-btn').hidden=!active;
  renderBankSummary();
  const mastered=bank.filter(question=>masteryFor(question.id).mastered).length;
  const attempts=state.attempts||[];
  $('history-summary').innerHTML=`<strong>${bank.length}</strong> questions · <strong>${mastered}</strong> mastered · <strong>${bank.length-mastered}</strong> remaining · <strong>${attempts.length}</strong> completed run${attempts.length===1?'':'s'}`;
}

function renderFatalError(message){
  blocked=true;
  clearInterval(ticker);setControlsDisabled(true);showView('start-view');
  $('history-summary').innerHTML='';$('resume-btn').hidden=true;$('bank-summary').textContent='';
  showErrorHtml(`<strong>Test engine failed to load.</strong><br>${escapeHtml(message)}`);
}

function setControlsDisabled(disabled){
  ['start-btn','customize-btn','resume-btn','history-btn','export-btn','import-input','reset-btn'].forEach(id=>{const element=$(id);if(element)element.disabled=disabled;});
}

function clearError(){if(persistenceWarningShown||corruptProgressWarningShown)return;$('error').hidden=true;$('error').innerHTML='';}

function showErrorHtml(html,action){
  $('error').hidden=false;
  $('error').innerHTML=`${html}${action?`<div class="actions compact"><button id="${action.id}" type="button" class="${action.className||''}">${escapeHtml(action.label)}</button></div>`:''}`;
  if(action)$(action.id).onclick=action.onclick;
}

function openCustomize(){
  if(blocked)return;
  const settings=state.settings;$('question-limit').max=bank.length;$('question-limit').value=clampQuestionCount(settings.questionCount,bank.length);$('time-limit').value=settings.durationMinutes;$('include-mastered').checked=settings.includeMastered;
  document.querySelectorAll('input[name="run-mode"]').forEach(input=>{input.checked=input.value===storedRunMode();});
  updateCustomizeSummary();updateBuildNote();['question-limit','time-limit','include-mastered'].forEach(id=>$(id).oninput=updateCustomizeSummary);$('customize-dialog').showModal();
}

function updateCustomizeSummary(){
  const include=$('include-mastered').checked;const eligible=bank.filter(question=>include||!masteryFor(question.id).mastered).length;const maxAllowed=Math.max(1,Math.min(eligible||bank.length,bank.length));
  $('question-limit').max=maxAllowed;$('question-limit').value=clampQuestionCount($('question-limit').value,maxAllowed);$('customize-summary').textContent=`${eligible} questions currently eligible.`;
}

async function updateBuildNote(){
  const summary=$('customize-summary');
  if(!summary)return;
  let note=$('build-note');
  if(!note){
    note=document.createElement('small');
    note.id='build-note';
    note.className='setting-note';
    summary.insertAdjacentElement('afterend',note);
  }
  note.textContent='Build: checking...';
  let value=document.lastModified;
  try{
    const response=await fetch('app.js',{method:'HEAD',cache:'no-store'});
    value=response.headers.get('Last-Modified')||value;
  }catch{}
  const modified=new Date(value);
  note.textContent=Number.isNaN(modified.getTime())
    ?`Build: ${value||'unknown'}`
    :`Build: ${modified.toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'})}`;
}

function saveCustomize(event){
  if(blocked)return;
  event.preventDefault();const include=$('include-mastered').checked;const eligible=bank.filter(question=>include||!masteryFor(question.id).mastered).length;
  writeLocalStorage(runModeStorageKey(),selectedRunMode());
  state.settings={questionCount:clampQuestionCount($('question-limit').value,eligible||bank.length),durationMinutes:Math.max(0,Number($('time-limit').value)||0),includeMastered:include};saveState();$('customize-dialog').close();renderHome();
}

function eligibleQuestions(){const include=state.settings.includeMastered;return bank.filter(question=>include||!masteryFor(question.id).mastered);}

function startNew(){
  if(blocked)return;
  if(active&&!confirm('A practice run is already in progress. Replace it?'))return;
  let pool=eligibleQuestions();if(!pool.length){alert('All questions are mastered. Enable Include mastered questions to continue.');return;}
  const configuredCount=state.settings.questionCount;
  if(configuredCount>pool.length&&!confirm(`Only ${pool.length} questions are currently eligible because mastered questions are excluded. Start a ${pool.length}-question run?`))return;
  pool=shuffle(pool);const selected=pool.slice(0,Math.min(configuredCount,pool.length));const now=Date.now();
  const items=selected.map(question=>({questionId:question.id,optionOrder:shuffle(OPTION_KEYS)}));
  active={id:`attempt-${now}`,startedAt:now,durationMinutes:state.settings.durationMinutes,expiresAt:state.settings.durationMinutes?now+state.settings.durationMinutes*60000:null,currentIndex:0,mode:storedRunMode(),items,responses:Object.fromEntries(items.map(item=>[item.questionId,createResponseState()]))};
  index=0;saveState();startExam();
}

function resume(){if(blocked||!active)return;index=Math.min(active.currentIndex||0,active.items.length-1);startExam();}

function startExam(){showView('exam-view');renderQuestion();clearInterval(ticker);updateTimer();if(active.durationMinutes>0)ticker=setInterval(updateTimer,1000);}

function updateTimer(){
  if(!active||active.durationMinutes===0)return;
  const ms=Math.max(0,active.expiresAt-Date.now()),total=Math.ceil(ms/1000);$('timer').textContent=`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;if(ms<=0)submit(true);
}

function currentItem(){return active.items[index];}
function currentQuestion(){return questionById(currentItem().questionId);}
function currentResponse(){return active.responses[currentItem().questionId];}
function questionById(id){return questionLookup.get(id);}
function masteryFor(id){return state.mastery[id]||{attempts:0,correct:0,mastered:false};}
function displayedLetter(item,canonicalKey){const position=item.optionOrder.indexOf(canonicalKey);return position<0?null:String.fromCharCode(65+position);}
function runModeStorageKey(){return`${RUN_MODE_STORAGE_KEY_PREFIX}${bankConfig.bankId}:${bankConfig.bankVersion}`;}
function sanitizeRunMode(value){return value==='practice'?'practice':'exam';}
function storedRunMode(){return sanitizeRunMode(localStorage.getItem(runModeStorageKey()));}
function selectedRunMode(){return sanitizeRunMode(document.querySelector('input[name="run-mode"]:checked')?.value);}
function activeRunMode(){return sanitizeRunMode(active?.mode);}
function isPracticeMode(){return activeRunMode()==='practice';}
function isLockedPracticeResponse(response=currentResponse()){return isPracticeMode()&&Boolean(response.locked);}

function renderAnswerReveal(item,question,response){
  const controls=$('answer-reveal-controls');
  const box=$('answer-reveal');
  document.querySelectorAll('#options .option').forEach(option=>option.classList.remove('answer-correct','answer-incorrect'));
  if(!isLockedPracticeResponse(response)){controls.hidden=true;box.hidden=true;box.textContent='';return;}
  const correctDisplayed=displayedLetter(item,question.answer);
  const selectedDisplayed=response.answer?`${displayedLetter(item,response.answer)}. ${question.options[response.answer]}`:'Not answered';
  const correct=response.answer===question.answer;
  box.innerHTML=`<strong class="${correct?'correct':'incorrect'}">${correct?'Correct':'Incorrect'}</strong><br>Correct answer: <strong>${escapeHtml(correctDisplayed)}. ${escapeHtml(question.options[question.answer])}</strong>${correct?'':`<br>Your answer: <strong>${escapeHtml(selectedDisplayed)}</strong>`}`;
  controls.hidden=false;
  box.hidden=false;
  document.querySelectorAll('#options .option').forEach(option=>{
    const input=option.querySelector('input[name="answer"]');
    if(!input)return;
    option.classList.toggle('answer-correct',input.value===question.answer);
    option.classList.toggle('answer-incorrect',response.answer!==null&&input.value===response.answer&&response.answer!==question.answer);
  });
}

function renderQuestion(){
  const item=currentItem(),question=currentQuestion(),response=currentResponse();active.currentIndex=index;saveState();
  $('question-count').textContent=`Question ${index+1} of ${active.items.length} · ${question.id} · Domain ${question.domain} · Mastery ${Math.min(masteryFor(question.id).correct,3)}/3`;
  $('question-stem').textContent=question.stem;
  $('options').innerHTML=item.optionOrder.map((key,position)=>`<label class="option"><input type="radio" name="answer" value="${key}" ${response.answer===key?'checked':''}><strong>${String.fromCharCode(65+position)}.</strong><span>${escapeHtml(question.options[key])}</span></label>`).join('');
  const locked=isLockedPracticeResponse(response);
  document.querySelectorAll('input[name="answer"]').forEach(el=>{el.disabled=locked;el.onchange=e=>{response.answer=e.target.value;saveState();renderNavigator();};});
  document.querySelectorAll('input[name="confidence"]').forEach(el=>el.checked=String(response.confidence)===el.value);
  $('question-note').value=sanitizeNote(response.note);
  $('flag-btn').classList.toggle('flagged',response.flagged);$('flag-btn').textContent=response.flagged?'Flagged':'Flag';$('prev-btn').disabled=index===0;$('next-btn').textContent=isPracticeMode()?(locked?(index===active.items.length-1?'Finish run':'Next'):'Submit answer'):(index===active.items.length-1?'Review':'Next');renderAnswerReveal(item,question,response);renderNavigator();
}

function move(delta){
  if(blocked)return;
  if(delta>0&&isPracticeMode()){
    const response=currentResponse();
    if(!response.locked){
      response.locked=true;saveState();renderQuestion();return;
    }
    if(index===active.items.length-1){submit(false);return;}
  }
  if(delta>0&&!isPracticeMode()&&index===active.items.length-1){
    const firstUnanswered=active.items.findIndex(item=>!active.responses[item.questionId].answer);
    const firstFlagged=active.items.findIndex(item=>active.responses[item.questionId].flagged);
    index=firstUnanswered>=0?firstUnanswered:firstFlagged>=0?firstFlagged:0;
    $('navigator').hidden=false;
    renderQuestion();
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  index=Math.max(0,Math.min(active.items.length-1,index+delta));renderQuestion();window.scrollTo({top:0,behavior:'smooth'});
}
function toggleFlag(){if(blocked)return;const response=currentResponse();response.flagged=!response.flagged;saveState();renderQuestion();}

function renderNavigator(){
  $('navigator').innerHTML=active.items.map((item,itemIndex)=>{const response=active.responses[item.questionId];return`<button type="button" data-i="${itemIndex}" class="${response.answer?'answered ':''}${response.flagged?'flagged ':''}${itemIndex===index?'current':''}">${itemIndex+1}</button>`;}).join('');
  $('navigator').querySelectorAll('button').forEach(button=>button.onclick=()=>{index=Number(button.dataset.i);renderQuestion();});
}

function submit(expired){
  if(blocked||!active)return;
  const unanswered=active.items.filter(item=>!active.responses[item.questionId].answer).length;
  if(!expired&&!confirm(unanswered?`Submit with ${unanswered} unanswered question${unanswered===1?'':'s'}?`:'Submit this practice run?'))return;
  const runMode=activeRunMode();
  clearInterval(ticker);const finishedAt=Date.now();
  const configuredQuestionCount=state.settings.questionCount;
  const items=active.items.map((runtime,number)=>{
    const question=questionById(runtime.questionId),response=active.responses[question.id],correct=Boolean(response.answer)&&response.answer===question.answer;
    const previous=masteryFor(question.id),wasMastered=previous.mastered;
    if(response.answer){state.mastery[question.id]={attempts:previous.attempts+1,correct:previous.correct+(correct?1:0),mastered:wasMastered||(correct&&previous.correct+1>=3),lastAttempt:finishedAt};}
    const current=masteryFor(question.id);
    return{...response,id:question.id,number:number+1,questionNumber:number+1,domain:question.domain,target:question.target,stem:question.stem,options:{A:question.options.A,B:question.options.B,C:question.options.C,D:question.options.D},correct,correctAnswer:question.answer,optionOrder:[...runtime.optionOrder],displayedAnswer:response.answer?displayedLetter(runtime,response.answer):null,displayedCorrectAnswer:displayedLetter(runtime,question.answer),newlyMastered:!wasMastered&&current.mastered,note:sanitizeNote(response.note)};
  });
  const correct=items.filter(item=>item.correct).length;const result={id:active.id,startedAt:active.startedAt,finishedAt,durationSeconds:Math.round((finishedAt-active.startedAt)/1000),configuredQuestionCount,configuredMinutes:active.durationMinutes,expired,correct,total:items.length,percent:Math.round(correct/items.length*100),runMode,items};
  state.attempts.push(result);active=null;saveState();renderResults(result);
}

function renderResults(result){
  currentResult=result;
  showView('results-view');const unanswered=result.items.filter(item=>!item.answer).length;const newlyMastered=result.items.filter(item=>item.newlyMastered).length;
  $('score-card').innerHTML=`<div class="score-number">${result.percent}%</div><p>${result.correct} of ${result.total} correct · ${formatDuration(result.durationSeconds)} · ${unanswered} unanswered · ${newlyMastered} newly mastered</p><p><strong>Run mode:</strong> ${sanitizeRunMode(result.runMode)==='practice'?'Practice':'Exam'}</p>`;
  const mastered=bank.filter(question=>masteryFor(question.id).mastered).length;$('readiness-card').innerHTML=`<strong>${mastered} of ${bank.length} mastered</strong><br>A question is mastered after three correct completions.`;
  const review=result.items.filter(item=>item.answer||item.flagged||item.confidence!==null).sort((a,b)=>a.number-b.number);
  $('review-list').innerHTML=review.length?`<h2>Review queue</h2>${review.map(item=>{const status=!item.answer?'Not answered':item.correct?'Correct':'Incorrect';const statusClass=item.correct?'correct':item.answer?'incorrect':'';const flagBadge=item.flagged?' <span class="review-flag">Flagged</span>':'';return`<article class="review-item"><h3>Question ${item.number} · ${item.id}${flagBadge}: <span class="${statusClass}">${status}</span></h3><p>${escapeHtml(item.stem)}</p><p>Your answer: <strong>${item.displayedAnswer||'Not answered'}</strong> · Correct answer: <strong>${item.displayedCorrectAnswer}</strong> · Confidence: <strong>${item.confidence??'Not set'}</strong></p><p><strong>Target:</strong> ${escapeHtml(item.target)}</p></article>`;}).join('')}`:'<p>No answered, flagged, or confidence-marked questions to review.</p>';
}

function appendProgressMetric(container,label,value){const metric=document.createElement('div'),strong=document.createElement('strong'),lineBreak=document.createElement('br');metric.className='metric';strong.textContent=label;metric.append(strong,lineBreak,document.createTextNode(String(value)));container.append(metric);}
function renderProgress(){
  if(blocked)return;
  currentResult=null;
  clearInterval(ticker);showView('progress-view');
  const attempts=Array.isArray(state.attempts)?state.attempts:[],mastered=bank.filter(question=>masteryFor(question.id).mastered).length,content=$('progress-content');
  content.replaceChildren();
  const metrics=document.createElement('div');metrics.className='metric-grid';
  appendProgressMetric(metrics,'Question bank',bank.length);appendProgressMetric(metrics,'Mastered',mastered);appendProgressMetric(metrics,'Remaining',bank.length-mastered);appendProgressMetric(metrics,'Completed runs',attempts.length);content.append(metrics);
  if(!attempts.length){const empty=document.createElement('p');empty.textContent='No completed runs yet.';content.append(empty);return;}
  const heading=document.createElement('h3');heading.textContent='Attempt history';content.append(heading);
  const table=document.createElement('table'),head=document.createElement('thead'),headRow=document.createElement('tr'),body=document.createElement('tbody');table.className='history-table';
  ['Date','Questions','Score','Time','Result'].forEach(label=>{const cell=document.createElement('th');cell.textContent=label;headRow.append(cell);});head.append(headRow);
  [...attempts].reverse().forEach(attempt=>{const row=document.createElement('tr'),date=attempt.finishedAt?new Date(attempt.finishedAt).toLocaleDateString():'Unknown';[date,attempt.total,`${attempt.percent}%`,formatDuration(attempt.durationSeconds),attempt.expired?'Expired':'Submitted'].forEach(value=>{const cell=document.createElement('td');cell.textContent=String(value);row.append(cell);});body.append(row);});
  table.append(head,body);content.append(table);
}
function exportRun(result){
  if(blocked||!result)return;
  clearError();
  const exportedAt=new Date();
  const exportRecord=buildRunExportRecord(result,exportedAt);
  const filenameBase=buildRunFilenameBase(exportedAt);
  downloadJson(exportRecord,`${filenameBase}.json`);
  downloadText(buildRunTextReport(exportRecord),`${filenameBase}.txt`);
}

function exportProgress(){
  if(blocked)return;
  clearError();
  downloadJson(state,`training-engine-progress-${new Date().toISOString().slice(0,10)}.json`);
}

async function importProgress(event){
  if(blocked)return;
  const file=event.target.files[0];if(!file)return;
  try{
    const normalized=normalizeStateIdentity(JSON.parse(await file.text()),true);
    if(normalized.bankId!==bankConfig.bankId||normalized.bankVersion!==bankConfig.bankVersion)throw new Error(`Progress file belongs to ${normalized.bankId} v${normalized.bankVersion}, but the loaded bank is ${bankConfig.bankId} v${bankConfig.bankVersion}.`);
    state=mergeState(normalized);active=state.activeAttempt||null;if(saveState())clearError();renderHome();
  }catch(error){showErrorHtml(`<strong>Import failed.</strong><br>${escapeHtml(error.message)}`);}
  finally{event.target.value='';}
}

function resetProgress(confirmReset){
  if(confirmReset&&!confirm('Delete all locally stored attempts, mastery, settings, and active progress for this bank?'))return;
  try{localStorage.removeItem(progressStorageKey());lastPersistedState=null;}catch{showPersistenceWarning();return;}
  blocked=false;state=defaultState();active=null;currentResult=null;if(saveState())clearError();setControlsDisabled(false);renderHome();
}

function clampQuestionCount(requested,maxAllowed){
  const max=Math.max(1,Math.min(Number(maxAllowed)||bank.length,bank.length));
  return Math.max(1,Math.min(Number(requested)||1,max));
}

function createResponseState(response={}){
  return{answer:isOptionKey(response.answer)?response.answer:null,confidence:isConfidenceValue(response.confidence)?Number(response.confidence):null,flagged:Boolean(response.flagged),locked:Boolean(response.locked),note:sanitizeNote(response.note)};
}

function sanitizeNote(value){return typeof value==='string'?value:'';}

function hasNote(note){return sanitizeNote(note).trim().length>0;}

function buildRunFilenameBase(exportedAt){return`${sanitizeFilenamePart(bankConfig.bankId)}_run_${buildLocalTimestamp(exportedAt)}`;}

function buildLocalTimestamp(exportedAt){return`${exportedAt.getFullYear()}-${String(exportedAt.getMonth()+1).padStart(2,'0')}-${String(exportedAt.getDate()).padStart(2,'0')}_${String(exportedAt.getHours()).padStart(2,'0')}${String(exportedAt.getMinutes()).padStart(2,'0')}${String(exportedAt.getSeconds()).padStart(2,'0')}`;}

function sanitizeFilenamePart(value){return String(value).replace(/[^A-Za-z0-9._-]+/g,'-');}

function buildRunExportRecord(result,exportedAt){
  const answeredCount=result.items.filter(item=>item.answer).length;
  const unansweredCount=result.items.length-answeredCount;
  const incorrectCount=result.items.filter(item=>item.answer&&!item.correct).length;
  const flaggedCount=result.items.filter(item=>item.flagged).length;
  const notedCount=result.items.filter(item=>hasNote(item.note)).length;
  const domains={};
  result.items.forEach(item=>{
    if(!domains[item.domain])domains[item.domain]={presented:0,answered:0,correct:0,incorrect:0,unanswered:0};
    const stats=domains[item.domain];
    stats.presented+=1;
    if(item.answer){
      stats.answered+=1;
      if(item.correct)stats.correct+=1;
      else stats.incorrect+=1;
    }else stats.unanswered+=1;
  });
  Object.values(domains).forEach(stats=>{stats.percentCorrect=stats.presented?Math.round(stats.correct/stats.presented*100):0;});
  return{
    schemaVersion:1,
    recordType:'practice-run',
    bank:{bankId:bankConfig.bankId,bankVersion:bankConfig.bankVersion,title:bankConfig.title,questionCount:bank.length},
    run:{
      attemptId:result.id,
      startedAt:toIsoString(result.startedAt),
      finishedAt:toIsoString(result.finishedAt),
      exportedAt:exportedAt.toISOString(),
      mode:sanitizeRunMode(result.runMode),
      durationSeconds:result.durationSeconds,
      configuredQuestionCount:result.configuredQuestionCount??result.total,
      configuredTimeLimitMinutes:result.configuredMinutes,
      expired:Boolean(result.expired),
      totalPresented:result.total,
      totalAnswered:answeredCount,
      totalUnanswered:unansweredCount,
      totalCorrect:result.correct,
      totalIncorrect:incorrectCount,
      scorePercent:result.percent,
      flaggedQuestionCount:flaggedCount,
      notedQuestionCount:notedCount
    },
    domains,
    questions:result.items.map(item=>({
      runPosition:item.number,
      questionId:item.id,
      questionNumber:item.questionNumber??null,
      domain:item.domain,
      target:item.target,
      stem:item.stem,
      options:{A:item.options?.A??null,B:item.options?.B??null,C:item.options?.C??null,D:item.options?.D??null},
      correctAnswer:item.correctAnswer,
      displayOrder:Array.isArray(item.optionOrder)?[...item.optionOrder]:[],
      displayedCorrectAnswer:item.displayedCorrectAnswer??null,
      selectedAnswer:item.answer??null,
      displayedSelectedAnswer:item.displayedAnswer??null,
      answered:Boolean(item.answer),
      correct:Boolean(item.correct),
      incorrect:Boolean(item.answer&&!item.correct),
      confidence:item.confidence??null,
      flagged:Boolean(item.flagged),
      note:sanitizeNote(item.note),
      newlyMastered:Boolean(item.newlyMastered)
    }))
  };
}

function buildRunTextReport(record){
  const lines=[
    `${record.bank.title}`,
    `Bank ID: ${record.bank.bankId}`,
    `Bank version: ${record.bank.bankVersion}`,
    `Base-bank question count: ${record.bank.questionCount}`,
    `Attempt ID: ${record.run.attemptId}`,
    `Start time: ${record.run.startedAt}`,
    `Finish time: ${record.run.finishedAt}`,
    `Export time: ${record.run.exportedAt}`,
    `Run mode: ${record.run.mode==='practice'?'Practice':'Exam'}`,
    `Duration seconds: ${record.run.durationSeconds}`,
    `Configured question count: ${record.run.configuredQuestionCount}`,
    `Configured time limit: ${record.run.configuredTimeLimitMinutes}`,
    `Expired: ${record.run.expired?'Yes':'No'}`,
    '',
    'Run summary',
    `Total presented: ${record.run.totalPresented}`,
    `Total answered: ${record.run.totalAnswered}`,
    `Total unanswered: ${record.run.totalUnanswered}`,
    `Total correct: ${record.run.totalCorrect}`,
    `Total incorrect: ${record.run.totalIncorrect}`,
    `Score percentage: ${record.run.scorePercent}`,
    `Flagged-question count: ${record.run.flaggedQuestionCount}`,
    `Noted-question count: ${record.run.notedQuestionCount}`,
    '',
    'Domain summary'
  ];
  Object.entries(record.domains).forEach(([domain,stats])=>{
    lines.push(`Domain ${domain}`);
    lines.push(`Presented: ${stats.presented}`);
    lines.push(`Answered: ${stats.answered}`);
    lines.push(`Unanswered: ${stats.unanswered}`);
    lines.push(`Correct: ${stats.correct}`);
    lines.push(`Incorrect: ${stats.incorrect}`);
    lines.push(`Percentage correct: ${stats.percentCorrect}`);
    lines.push('');
  });
  record.questions.forEach(question=>{
    const note=sanitizeNote(question.note);
    lines.push('===============================================================================');
    lines.push(`Question ${question.runPosition} of ${record.run.totalPresented}`);
    lines.push(`Question ID: ${question.questionId}`);
    lines.push(`Bank question: ${question.questionNumber}`);
    lines.push(`Domain: ${question.domain}`);
    lines.push(`Target: ${question.target}`);
    lines.push('');
    lines.push('Question:');
    lines.push(question.stem);
    lines.push('');
    lines.push('Canonical options:');
    lines.push(`A. ${question.options.A}`);
    lines.push(`B. ${question.options.B}`);
    lines.push(`C. ${question.options.C}`);
    lines.push(`D. ${question.options.D}`);
    lines.push(`Displayed order: ${question.displayOrder.join(', ')}`);
    lines.push(`Correct answer: ${question.correctAnswer}`);
    lines.push(`Displayed correct answer: ${question.displayedCorrectAnswer??'Unanswered'}`);
    lines.push(`Selected answer: ${question.selectedAnswer??'Unanswered'}`);
    lines.push(`Displayed selected answer: ${question.displayedSelectedAnswer??'Unanswered'}`);
    lines.push(`Answered: ${question.answered?'Yes':'No'}`);
    lines.push(`Correct: ${question.correct?'Yes':'No'}`);
    lines.push(`Incorrect: ${question.incorrect?'Yes':'No'}`);
    lines.push(`Confidence: ${question.confidence??'None'}`);
    lines.push(`Flagged: ${question.flagged?'Yes':'No'}`);
    lines.push(`Newly mastered: ${question.newlyMastered?'Yes':'No'}`);
    lines.push(`Note present: ${hasNote(note)?'Yes':'No'}`);
    lines.push('');
    lines.push('Note:');
    lines.push(note);
    lines.push('');
  });
  return lines.join('\n');
}

function downloadJson(value,filename){
  downloadFile(JSON.stringify(value,null,2),filename,'application/json');
}

function downloadText(value,filename){downloadFile(value,filename,'text/plain;charset=utf-8');}

function downloadFile(value,filename,type){
  const blob=new Blob([value],{type}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename;link.click();URL.revokeObjectURL(link.href);
}

function toIsoString(value){return new Date(value).toISOString();}

function shuffle(values){const shuffled=[...values];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}return shuffled;}
function formatDuration(seconds){return`${Math.floor(seconds/60)}m ${seconds%60}s`;}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
function isPlainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function isOptionKey(value){return OPTION_KEYS.includes(value);}
function isOptionOrder(value){return Array.isArray(value)&&value.length===OPTION_KEYS.length&&new Set(value).size===OPTION_KEYS.length&&OPTION_KEYS.every(key=>value.includes(key));}
function isConfidenceValue(value){return value!==null&&value!==''&&[0,1,2,3].includes(Number(value));}

init();
