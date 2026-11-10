#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'practice-test/app.js'),'utf8').replace(/\binit\(\);\s*$/,'');
const bootstrap=fs.readFileSync(path.join(root,'practice-test/bootstrap.js'),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const question=(id,revision=1)=>({id,revision,domain:'general',target:'Target',stem:`Original ${id}`,options:{A:'One',B:'Two',C:'Three',D:'Four'},answer:'A'});
const bank=(questions,bankVersion='1.0.0')=>({schemaVersion:3,bankId:'iterative-fixture',bankVersion,title:'Original bank',questions});
const initial=bank(['Q-A','Q-B','Q-C'].map(id=>question(id)));
const updated=bank([question('Q-D'),question('Q-B',2),question('Q-A')],'1.1.0');
updated.title='Updated bank';
updated.questions[1].stem='Revised question';
updated.questions[1].options.A='Revised option';
updated.questions[1].answer='B';
const key='training-engine-v2:iterative-fixture';
let assertions=0;
function check(condition,message){assert.ok(condition,message);assertions++;}

function harness(definition=initial,seed={}){
  const values=new Map(Object.entries(seed));
  const nodes=new Map();
  function element(){return{hidden:false,innerHTML:'',textContent:'',style:{},children:[],events:{},addEventListener(name,handler){this.events[name]=handler;},close(){},append(...children){this.children.push(...children);},replaceChildren(){this.children=[];},classList:{toggle(){}},querySelectorAll(){return[];}};}
  const document={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,createTextNode:text=>({textContent:text}),querySelectorAll:()=>[],querySelector:()=>({value:'practice'})};
  const localStorage={getItem:k=>values.get(k)??null,setItem(k,v){values.set(k,String(v));},removeItem:k=>values.delete(k)};
  const context={window:{},document,localStorage,console,confirm:()=>true,alert:()=>{},clearInterval:()=>{},setInterval:()=>0,setTimeout:()=>0,location:{reload(){}}};
  vm.createContext(context);
  vm.runInContext(app,context);
  const run=code=>vm.runInContext(code,context);
  run('Math.random=()=>0.25;let testNow=1700000000000;Date.now=()=>testNow++;');
  const setBank=definition=>{
    context.definition=clone(definition);
    run('bankConfig=loadBankDefinition(definition);bank=bankConfig.questions;questionLookup=new Map(bank.map(q=>[q.id,q]));');
  };
  setBank(definition);
  run('state=defaultState();');
  return{context,run,setBank,values,nodes,localStorage};
}

const h=harness();
// Complete actual runs through production start/submit logic, including three-correct mastery.
h.run("startExam=()=>{};renderResults=result=>{currentResult=result;};state.settings.questionCount=3;");
for(let round=0;round<3;round++){
  h.run("startNew();for(const item of active.items)active.responses[item.questionId].answer=item.questionId==='Q-C'?'B':'A';submit(false);");
}
const original=h.run('JSON.parse(JSON.stringify(state))');
check(original.mastery['Q-A'].mastered&&original.mastery['Q-B'].mastered&&!original.mastery['Q-C'].mastered,'initial three-correct mastery rule');
check(original.attempts.every(a=>a.items.every(q=>q.revision===1)),'completed snapshots record revisions');
check(original.attempts.every(a=>a.bank.bankVersion==='1.0.0'),'completed snapshots record source bank');
h.run('state.settings.includeMastered=true;startNew();');
const activeState=clone(h.run('state'));
check(activeState.activeAttempt.bankVersion==='1.0.0'&&activeState.activeAttempt.items.every(q=>q.revision===1),'active attempts record version and revision');

function reconcile(definition,source=activeState){
  const t=harness(definition,{[key]:JSON.stringify(source)});
  t.run('loaded=loadStoredState();state=loaded.state;active=state.activeAttempt;');
  return t;
}
const revised=reconcile(updated);
check(revised.run("masteryFor('Q-A').mastered"),'unchanged question retains mastery');
check(revised.run("!masteryFor('Q-B').mastered&&masteryFor('Q-B').correct===0"),'revised question resets');
check(revised.run("!Object.hasOwn(state.mastery,'Q-C')&&!questionLookup.has('Q-C')"),'removed question omitted');
check(revised.run("masteryFor('Q-D').correct===0&&!masteryFor('Q-D').mastered"),'new question fresh');
revised.run('state.settings.includeMastered=false;');
assert.deepEqual(clone(revised.run('eligibleQuestions().map(q=>q.id)')).sort(),['Q-B','Q-D']);assertions++;
check(revised.run('bank.filter(q=>masteryFor(q.id).mastered).length')===1,'current mastery total excludes removed question');
check(revised.run('loaded.activeInvalidated&&!loaded.corruptProgress&&active===null'),'bank update invalidates active attempt without corruption');
check(revised.run('state.bankVersion')==='1.1.0','reconciled state records loaded version');
assert.deepEqual(clone(revised.run('state.attempts')),clone(original.attempts));assertions++;
const exported=revised.run('buildRunExportRecord(state.attempts[0],new Date(0))');
check(exported.schemaVersion===2&&exported.bank.bankVersion==='1.0.0'&&exported.bank.title==='Original bank'&&exported.bank.questionCount===3,'historical export uses original bank metadata');
check(exported.questions.every(q=>q.revision===1)&&exported.questions.find(q=>q.questionId==='Q-B').stem==='Original Q-B','historical export uses original question revision/content');
check(exported.questions.find(q=>q.questionId==='Q-B').options.A==='One'&&exported.questions.find(q=>q.questionId==='Q-B').correctAnswer==='A','historical options and answer retained');
check(revised.run('buildRunTextReport(buildRunExportRecord(state.attempts[0],new Date(0)))').includes('Question revision: 1'),'text export contains revision');
revised.run('saveState();');
const reloaded=reconcile(updated,JSON.parse(revised.values.get(key)));
check(reloaded.run("!loaded.activeInvalidated&&masteryFor('Q-A').mastered"),'saved reconciliation survives reload');

for(const [label,definition,invalidated] of [
  ['reorder',bank([...initial.questions].reverse()),false],
  ['version only',bank(initial.questions,'1.0.1'),true],
  ['addition',bank([...initial.questions,question('Q-D')],'1.1.0'),true],
  ['removal',bank(initial.questions.slice(0,2),'1.1.0'),true]
]){
  const t=reconcile(definition);
  check(t.run("masteryFor('Q-A').mastered&&masteryFor('Q-B').mastered"),label+' retains unrelated mastery');
  check(Boolean(t.run('loaded.activeInvalidated'))===invalidated,label+' active behavior');
  check(t.run('state.attempts.length')===3,label+' history preserved');
}
const downgraded=clone(original);downgraded.mastery['Q-B'].revision=2;
check(!reconcile(initial,downgraded).run("masteryFor('Q-B').mastered"),'lower revision resets rather than resurrecting mastery');
const unversionedEdit=clone(initial);unversionedEdit.questions[1].revision=2;
check(reconcile(unversionedEdit).run('loaded.activeInvalidated'),'revision mismatch invalidates entire active run even without version bump');
for(const mutate of [s=>s.activeAttempt.items.push(s.activeAttempt.items[0]),s=>s.activeAttempt.items[0].questionId='missing',s=>delete s.activeAttempt.bankVersion,s=>s.activeAttempt.items[0].optionOrder=['A','A','C','D']]){
  const source=clone(activeState);mutate(source);
  check(reconcile(initial,source).run('active===null&&state.attempts.length===3'),'invalid active run is discarded whole; history retained');
}

const validation=harness();
validation.context.window.TRAINING_ENGINE_FIXTURE_BANK=initial;
vm.runInContext(bootstrap,validation.context);
const shape=validation.context.window.TRAINING_ENGINE_BANKS.validBankShape;
for(const [label,mutate] of [
  ['v2',b=>b.schemaVersion=2],['missing revision',b=>delete b.questions[0].revision],
  ['zero',b=>b.questions[0].revision=0],['fraction',b=>b.questions[0].revision=1.5],
  ['string revision',b=>b.questions[0].revision='1'],['negative',b=>b.questions[0].revision=-1],
  ['duplicate',b=>b.questions[1].id=b.questions[0].id],['empty ID',b=>b.questions[0].id=' '],
  ...['__proto__','constructor','prototype'].map(id=>[id,b=>b.questions[0].id=id]),
  ['extra question field',b=>b.questions[0].extra=true],['extra bank field',b=>b.extra=true],
  ['extra option',b=>b.questions[0].options.E='extra'],['empty option',b=>b.questions[0].options.A=''],
  ['invalid answer',b=>b.questions[0].answer='E']
]){
  const candidate=clone(initial);mutate(candidate);validation.context.candidate=candidate;
  assert.throws(()=>validation.run('loadBankDefinition(candidate)'),undefined,label);assertions++;
  check(!shape(candidate),'bootstrap rejects '+label);
}
validation.context.candidate={...initial,schemaVersion:2};
assert.throws(()=>validation.run('loadBankDefinition(candidate)'),/BANK-MIGRATION-V2-TO-V3\.md/);assertions++;
const arbitrary=bank([question('not a naming convention <&"'),question('toString'),question('hasOwnProperty')]);
validation.setBank(arbitrary);
check(shape(arbitrary),'valid arbitrary IDs accepted');
validation.run('state=defaultState();state.settings.questionCount=3;startExam=()=>{};renderResults=()=>{};startNew();for(const item of active.items)active.responses[item.questionId].answer="A";submit(false);');
check(validation.run('Object.getPrototypeOf(state.mastery)===null&&state.mastery.toString.correct===1'),'mastery keys cannot inherit object properties');
validation.run("state.attempts[0].items[0].domain='__proto__';");
check(validation.run("buildRunExportRecord(state.attempts[0],new Date(0)).domains.__proto__.presented===1"),'domain export aggregation safely handles object keys');

const legacy=harness(initial,{['training-engine-v1:iterative-fixture:1.0.0']:JSON.stringify({...original,version:2})});
check(legacy.run('loadStoredState().state.attempts.length')===0&&legacy.values.size===1,'old v2 storage is neither read nor changed');
const wrongBank=clone(original);wrongBank.bankId='another-bank';
check(reconcile(initial,wrongBank).run('loaded.corruptProgress'),'stored progress for other bank rejected');
const malformed=clone(original);malformed.mastery['Q-A']={revision:1,attempts:-1,correct:99,mastered:true};
check(!reconcile(initial,malformed).run("masteryFor('Q-A').mastered"),'malformed mastery does not fabricate mastery');

async function testImports(){
  const t=harness(updated);
  t.context.importEvent={target:{files:[{text:async()=>JSON.stringify(activeState)}],value:'fixture'}};
  await t.run('importProgress(importEvent)');
  check(t.run("masteryFor('Q-A').mastered&&!masteryFor('Q-B').mastered&&state.attempts.length===3&&active===null"),'cross-version progress import reconciles');
  check(t.nodes.get('error').innerHTML.includes('unfinished run was discarded'),'import displays active update notice');
  const before=t.run('JSON.stringify(state)');
  for(const invalid of [wrongBank,{...original,version:2}]){
    t.context.importEvent.target.files=[{text:async()=>JSON.stringify(invalid)}];
    await t.run('importProgress(importEvent)');
    check(t.run('JSON.stringify(state)')===before,'invalid progress import leaves state unchanged');
    check(t.nodes.get('error').innerHTML.includes('Import failed'),'invalid progress import reports error');
  }
  const boot=harness(updated,{[key]:JSON.stringify(activeState)});
  boot.context.window.TRAINING_ENGINE_RUNTIME_BANK={bank:updated,sourceName:'fixture'};
  boot.run('init();');
  check(boot.nodes.get('error').innerHTML.includes('unfinished run was discarded'),'startup displays active update notice');
  check(JSON.parse(boot.values.get(key)).activeAttempt===null,'startup persists invalidation');
  boot.run('renderProgress();');
  const content=boot.nodes.get('progress-content');
  const table=content.children.at(-1),body=table.children[1];
  const button=body.children[0].children.at(-1).children[0];
  button.onclick();
  check(boot.run('currentResult.bank.bankVersion')==='1.0.0','history View run opens historical snapshot');
  const failed=harness(updated,{[key]:JSON.stringify(activeState)});
  failed.localStorage.setItem=()=>{throw new Error('quota');};
  failed.context.window.TRAINING_ENGINE_RUNTIME_BANK={bank:updated,sourceName:'fixture'};
  failed.run('init();');
  check(failed.run('!blocked&&state.attempts.length===3&&active===null'),'failed reconciliation save does not block session or lose history');
  check(failed.nodes.get('error').innerHTML.includes('could not be saved'),'failed reconciliation save retains persistence warning');
  const storedV2={...initial,schemaVersion:2};
  const bootContext={window:{TRAINING_ENGINE_FIXTURE_BANK:initial},localStorage:{getItem:k=>k==='training-engine-custom-bank'?JSON.stringify({bank:storedV2,sourceName:'old.json'}):'custom'}};
  vm.createContext(bootContext);vm.runInContext(bootstrap,bootContext);
  check(bootContext.window.TRAINING_ENGINE_RUNTIME_BANK.bank.schemaVersion===2,'selected stored v2 bank reaches explicit rejection instead of silent fallback');
  const rejected=harness();
  rejected.context.window.TRAINING_ENGINE_RUNTIME_BANK={bank:storedV2,sourceName:'old.json'};
  let recovered=false;
  rejected.context.window.TRAINING_ENGINE_BANKS={selected:{kind:'custom'},useBundled(){recovered=true;}};
  rejected.run('init();');
  check(rejected.run('blocked')&&rejected.nodes.get('error').innerHTML.includes('BANK-MIGRATION-V2-TO-V3.md'),'stored v2 startup fails with migration instructions');
  rejected.nodes.get('recover-bundled-bank').onclick();
  check(recovered,'rejected custom bank provides bundled-bank recovery');
  const noActive=harness(updated,{[key]:JSON.stringify(original)});
  noActive.context.window.TRAINING_ENGINE_RUNTIME_BANK={bank:updated,sourceName:'fixture'};
  noActive.run('init();');
  check(JSON.parse(noActive.values.get(key)).bankVersion==='1.1.0'&&!Object.hasOwn(JSON.parse(noActive.values.get(key)).mastery,'Q-C'),'load persists reconciliation even without an active run');
  check(!noActive.nodes.get('error').innerHTML,'valid update without active run has no migration banner');
  const page=harness(initial,{[key]:JSON.stringify(activeState)});
  page.context.window.TRAINING_ENGINE_FIXTURE_BANK=initial;
  vm.runInContext(bootstrap,page.context);page.run('init();startExam=()=>{};');
  vm.runInContext(fs.readFileSync(path.join(root,'practice-test/page.js'),'utf8'),page.context);
  page.run("$('question-limit').value=3;$('time-limit').value=0;$('include-mastered').checked=true;");
  page.nodes.get('save-customize').onclick({preventDefault(){}});
  check(page.run("active.mode==='practice'&&active.bankVersion==='1.0.0'&&active.items.every(q=>q.revision===1)"),'mode restart preserves bank version and item revisions');
  check(reconcile(initial,JSON.parse(page.values.get(key))).run("active.mode==='practice'"),'restarted run safely resumes');
  page.run('renderResults(state.attempts[0]);');
  check(page.nodes.get('review-list').innerHTML.includes('r1'),'page review shows historical revision');
  const fileInput=page.nodes.get('bank-file-input');
  fileInput.files=[{name:'updated.json',text:async()=>JSON.stringify(updated)}];
  await fileInput.events.change({target:fileInput});
  check(JSON.parse(page.values.get('training-engine-custom-bank')).bank.bankVersion==='1.1.0','JSON file import accepts v3 update');
  let bankError='';page.context.alert=message=>{bankError=message;};
  fileInput.files=[{name:'old.json',text:async()=>JSON.stringify(storedV2)}];
  await fileInput.events.change({target:fileInput});
  check(bankError.includes('Unsupported question-bank schema version: 2')&&bankError.includes('BANK-MIGRATION-V2-TO-V3.md'),'JSON file import clearly rejects v2');
  check(JSON.parse(page.values.get('training-engine-custom-bank')).bank.bankVersion==='1.1.0','rejected bank leaves selected bank unchanged');
  console.log(`Iterative bank regression harness passed (${assertions} checks).`);
}
testImports().catch(error=>{console.error(error);process.exitCode=1;});
