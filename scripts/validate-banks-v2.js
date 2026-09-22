#!/usr/bin/env node
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const optionKeys=['A','B','C','D'];
const questionKeys=['answer','domain','id','options','stem','target'];
const reservedQuestionIds=new Set(['__proto__','constructor','prototype']);
const expected={
  'cysa-plus-cs0-003-focused-bank-v4.1.json':{count:100,digest:'65cc81c16cff4d7409f729f735f7af704192bbd1ebbbfd705fc0582290d3b754'},
  'test-fixture-bank.json':{count:4,digest:'2aced199b9aa6168938db5e3feb9b63d9041da8be6c8edc01d6ed3f11104264c'},
  'secai-plus-cy0-001-comprehensive-bank-v1.json':{count:168,digest:'ee3ae47f9a19b8ee6de35ce7e4fd9e4355412c75e1f5579dc37b75d9de71688a'},
  'secai-plus-cy0-001-terminology-drill-bank-v1.json':{count:195,digest:'1928c12939259ef5b53fe4612ced24aed76e29d75d84db1acf1c2f8f8fb260f7'},
  'secai-plus-minimal-independent-bank-v1.json':{count:60,digest:'7e78c41edd70a1b705c6a85a8dcef6ed036fca136705fabf3b3d4e2629d6a971'}
};

function fail(file,message){throw new Error(file+': '+message);}
function validate(file,bank){
  if(!bank||typeof bank!=='object'||Array.isArray(bank)||bank.schemaVersion!==2)fail(file,'schemaVersion must be 2');
  for(const key of ['bankId','bankVersion','title'])if(typeof bank[key]!=='string'||!bank[key].trim())fail(file,key+' must be a non-empty string');
  if(!Array.isArray(bank.questions)||!bank.questions.length)fail(file,'questions must be a non-empty array');
  const ids=new Set();
  for(const question of bank.questions){
    if(!question||typeof question!=='object'||Array.isArray(question)||Object.keys(question).sort().join(',')!==questionKeys.join(','))fail(file,'question fields must be exactly id/domain/target/stem/options/answer');
    if(typeof question.id!=='string'||!question.id.trim()||reservedQuestionIds.has(question.id)||ids.has(question.id))fail(file,'question IDs must be unique non-empty, non-reserved strings');
    ids.add(question.id);
    for(const key of ['domain','target'])if(typeof question[key]!=='string')fail(file,question.id+' '+key+' must be a string');
    if(typeof question.stem!=='string'||!question.stem.trim())fail(file,question.id+' stem must be non-empty');
    if(!question.options||typeof question.options!=='object'||Array.isArray(question.options)||Object.keys(question.options).sort().join(',')!==optionKeys.join(','))fail(file,question.id+' options must be exactly A-D');
    for(const key of optionKeys)if(typeof question.options[key]!=='string'||!question.options[key].trim())fail(file,question.id+' option '+key+' must be non-empty');
    if(!optionKeys.includes(question.answer))fail(file,question.id+' answer must be A-D');
  }
}

const bundledContext={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},location:{reload:()=>{}}};
vm.createContext(bundledContext);
for(const file of ['questions.js','bootstrap.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','practice-test',file),'utf8'),bundledContext,{filename:file});
const bundledRuntime=bundledContext.window.TRAINING_ENGINE_RUNTIME_BANK;
if(!bundledRuntime||typeof bundledRuntime.sourceName!=='string'||!bundledRuntime.sourceName||!bundledRuntime.bank)fail('bundled bootstrap','did not expose a runtime bank');
validate('bundled bootstrap',bundledRuntime.bank);
const bundledMatches=Object.values(bundledContext.window).filter(value=>{try{validate('bundled candidate',value);return true;}catch{return false;}});
if(bundledMatches.length!==1||bundledMatches[0]!==bundledRuntime.bank)fail('bundled bootstrap','did not resolve exactly one supported schemaVersion 2 bank');
console.log('bundled questions.js + bootstrap.js: one schemaVersion 2 runtime bank validated');

function functionSource(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0)fail('app.js test harness','missing function '+name);
  const open=source.indexOf('{',start);
  let depth=0;
  for(let index=open;index<source.length;index++){
    if(source[index]==='{')depth++;
    else if(source[index]==='}'&&!--depth)return source.slice(start,index+1);
  }
  fail('app.js test harness','unterminated function '+name);
}
const appSource=fs.readFileSync(path.join(__dirname,'..','practice-test','app.js'),'utf8');
const appContext={};
vm.createContext(appContext);
vm.runInContext("const SUPPORTED_SCHEMA_VERSION=2;const OPTION_KEYS=['A','B','C','D'];const RESERVED_QUESTION_IDS=new Set(['__proto__','constructor','prototype']);"+['isPlainObject','loadBankDefinition','validateQuestion'].map(name=>functionSource(appSource,name)).join('\n'),appContext,{filename:'app.js'});
function testBankWithId(id){
  const candidate=JSON.parse(JSON.stringify(bundledRuntime.bank));
  candidate.questions[0].id=id;
  return candidate;
}
function assertRuntimeAcceptance(id){
  const candidate=testBankWithId(id);
  if(!bundledContext.window.TRAINING_ENGINE_BANKS.validBankShape(candidate))fail('reserved-ID test','bootstrap rejected normal ID '+id);
  appContext.testBank=candidate;
  try{vm.runInContext('loadBankDefinition(testBank)',appContext);}catch(error){fail('reserved-ID test','app rejected normal ID '+id+': '+error.message);}
}
function assertRuntimeRejection(id){
  const candidate=testBankWithId(id);
  if(bundledContext.window.TRAINING_ENGINE_BANKS.validBankShape(candidate))fail('reserved-ID test','bootstrap accepted reserved ID '+id);
  appContext.testBank=candidate;
  try{vm.runInContext('loadBankDefinition(testBank)',appContext);fail('reserved-ID test','app accepted reserved ID '+id);}catch(error){if(!String(error.message).includes('reserved'))fail('reserved-ID test','app did not report reserved ID '+id);}
}
assertRuntimeAcceptance('Q001');
for(const id of reservedQuestionIds)assertRuntimeRejection(id);
const duplicate=testBankWithId('Q001');
duplicate.questions[1].id='Q001';
if(bundledContext.window.TRAINING_ENGINE_BANKS.validBankShape(duplicate))fail('reserved-ID test','bootstrap accepted duplicate ID');
appContext.testBank=duplicate;
try{vm.runInContext('loadBankDefinition(testBank)',appContext);fail('reserved-ID test','app accepted duplicate ID');}catch(error){if(!String(error.message).includes('unique'))fail('reserved-ID test','app did not report duplicate ID');}
console.log('reserved question ID and duplicate-ID validation passed through bootstrap and app validators');

for(const [file,manifest] of Object.entries(expected)){
  const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'..','test-banks',file),'utf8'));
  validate(file,bank);
  if(bank.questions.length!==manifest.count)fail(file,'expected '+manifest.count+' questions');
  const digest=crypto.createHash('sha256').update(JSON.stringify(bank.questions)).digest('hex');
  if(digest!==manifest.digest)fail(file,'question content digest differs from the expected bank content');
  console.log(file+': '+bank.questions.length+' questions validated');
}
