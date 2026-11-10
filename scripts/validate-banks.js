#!/usr/bin/env node
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const bankKeys=['bankId','bankVersion','questions','schemaVersion','title'];
const optionKeys=['A','B','C','D'];
const questionKeys=['answer','domain','id','options','revision','stem','target'];
const reservedQuestionIds=new Set(['__proto__','constructor','prototype']);
const expected={
  'cysa-plus-cs0-003-baseline-v1.json':{count:20,digest:'872732739360cd358cad930ec955e0ef5cc8474b62908fa0b4690d8071191bbe'},
  'cysa-plus-cs0-003-nightmare-bank-v1.json':{count:25,digest:'3c07e061be78dd447af1ac104fbefd1752b68890bc72a06c8489c3454f6b0a17'},
  'cysa-plus-cs0-003-nightmare-bank-v2.json':{count:25,digest:'43d946381c803e35893362698dc59bd934d578555608f4d25caf40b6695f1a5c'},
  'cysa-plus-cs0-003-focused-bank-v4.1.json':{count:100,digest:'65cc81c16cff4d7409f729f735f7af704192bbd1ebbbfd705fc0582290d3b754'},
  'cysa-plus-cs0-003-ultra-violence-bank-v1.json':{count:25,digest:'01b36c3df72e69112c038e6076759133e76c1e6703638b605a181bd5a9f982af'},
  'test-fixture-bank.json':{count:4,digest:'2aced199b9aa6168938db5e3feb9b63d9041da8be6c8edc01d6ed3f11104264c'},
  'secai-plus-cy0-001-comprehensive-bank-v1.json':{count:168,digest:'ee3ae47f9a19b8ee6de35ce7e4fd9e4355412c75e1f5579dc37b75d9de71688a'},
  'secai-plus-cy0-001-terminology-drill-bank-v1.json':{count:195,digest:'1928c12939259ef5b53fe4612ced24aed76e29d75d84db1acf1c2f8f8fb260f7'},
  'secai-plus-minimal-independent-bank-v1.json':{count:60,digest:'7e78c41edd70a1b705c6a85a8dcef6ed036fca136705fabf3b3d4e2629d6a971'}
};

function fail(file,message){throw new Error(file+': '+message);}
function validate(file,bank){
  if(!bank||typeof bank!=='object'||Array.isArray(bank))fail(file,'bank must be an object');
  if(Object.keys(bank).sort().join(',')!==bankKeys.join(','))fail(file,'bank fields must be exactly schemaVersion/bankId/bankVersion/title/questions');
  if(bank.schemaVersion!==3)fail(file,'schemaVersion must be 3');
  for(const key of ['bankId','bankVersion','title'])if(typeof bank[key]!=='string'||!bank[key].trim())fail(file,key+' must be a non-empty string');
  if(!Array.isArray(bank.questions)||!bank.questions.length)fail(file,'questions must be a non-empty array');
  const ids=new Set();
  for(const question of bank.questions){
    if(!question||typeof question!=='object'||Array.isArray(question)||Object.keys(question).sort().join(',')!==questionKeys.join(','))fail(file,'question fields must be exactly id/revision/domain/target/stem/options/answer');
    if(typeof question.id!=='string'||!question.id.trim()||reservedQuestionIds.has(question.id)||ids.has(question.id))fail(file,'question IDs must be unique non-empty, non-reserved strings');
    if(!Number.isInteger(question.revision)||question.revision<1)fail(file,'revision must be an integer >= 1');
    ids.add(question.id);
    for(const key of ['domain','target'])if(typeof question[key]!=='string')fail(file,question.id+' '+key+' must be a string');
    if(typeof question.stem!=='string'||!question.stem.trim())fail(file,question.id+' stem must be non-empty');
    if(!question.options||typeof question.options!=='object'||Array.isArray(question.options)||Object.keys(question.options).sort().join(',')!==optionKeys.join(','))fail(file,question.id+' options must be exactly A-D');
    for(const key of optionKeys)if(typeof question.options[key]!=='string'||!question.options[key].trim())fail(file,question.id+' option '+key+' must be non-empty');
    if(!optionKeys.includes(question.answer))fail(file,question.id+' answer must be A-D');
  }
}

const requestedBank=process.argv[2];
if(process.argv.length>3)fail('usage','node scripts/validate-banks.js [bank.json]');
if(requestedBank){
  const candidatePath=path.resolve(process.cwd(),requestedBank);
  let bank;
  try{
    bank=JSON.parse(fs.readFileSync(candidatePath,'utf8'));
  }catch(error){
    fail(requestedBank,'could not read or parse JSON: '+error.message);
  }
  validate(requestedBank,bank);
  console.log(requestedBank+': '+bank.questions.length+' questions validated against schemaVersion 3');
  process.exit(0);
}

const bundledContext={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},location:{reload:()=>{}}};
vm.createContext(bundledContext);
for(const file of ['questions.js','bootstrap.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','practice-test',file),'utf8'),bundledContext,{filename:file});
const bundledRuntime=bundledContext.window.TRAINING_ENGINE_RUNTIME_BANK;
if(!bundledRuntime||typeof bundledRuntime.sourceName!=='string'||!bundledRuntime.sourceName||!bundledRuntime.bank)fail('bundled bootstrap','did not expose a runtime bank');
validate('bundled bootstrap',bundledRuntime.bank);
const bundledMatches=Object.values(bundledContext.window).filter(value=>{try{validate('bundled candidate',value);return true;}catch{return false;}});
if(bundledMatches.length!==1||bundledMatches[0]!==bundledRuntime.bank)fail('bundled bootstrap','did not resolve exactly one supported schemaVersion 3 bank');
console.log('bundled questions.js + bootstrap.js: one schemaVersion 3 runtime bank validated');

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
vm.runInContext("const SUPPORTED_SCHEMA_VERSION=3;const OPTION_KEYS=['A','B','C','D'];const RESERVED_QUESTION_IDS=new Set(['__proto__','constructor','prototype']);"+['isPlainObject','loadBankDefinition','validateQuestion'].map(name=>functionSource(appSource,name)).join('\n'),appContext,{filename:'app.js'});
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

for(const [label,mutate] of [
  ['v2',bank=>bank.schemaVersion=2],
  ['missing revision',bank=>delete bank.questions[0].revision],
  ['zero revision',bank=>bank.questions[0].revision=0],
  ['fractional revision',bank=>bank.questions[0].revision=1.5],
  ['string revision',bank=>bank.questions[0].revision='1'],
  ['duplicate ID',bank=>bank.questions[1].id=bank.questions[0].id],
  ['reserved ID',bank=>bank.questions[0].id='__proto__'],
  ['extra field',bank=>bank.questions[0].extra=true],
  ['fifth option',bank=>bank.questions[0].options.E='extra'],
  ['empty option',bank=>bank.questions[0].options.A=''],
  ['invalid answer',bank=>bank.questions[0].answer='E']
]){
  const candidate=JSON.parse(JSON.stringify(bundledRuntime.bank));mutate(candidate);
  let rejected=false;
  try{validate(label,candidate);}catch{rejected=true;}
  if(!rejected)fail(label,'validator accepted invalid bank');
}
console.log('validator negative schema/revision/content cases passed');

const retainedFiles=fs.readdirSync(path.join(__dirname,'..','test-banks')).filter(file=>file.endsWith('.json')).sort();
if(JSON.stringify(retainedFiles)!==JSON.stringify(Object.keys(expected).sort()))fail('manifest','retained JSON banks and expected manifest differ; update the manifest for every retained bank');

for(const [file,manifest] of Object.entries(expected)){
  const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'..','test-banks',file),'utf8'));
  validate(file,bank);
  if(bank.questions.length!==manifest.count)fail(file,'expected '+manifest.count+' questions');
  const digest=crypto.createHash('sha256').update(JSON.stringify(bank.questions.map(({revision,...content})=>content))).digest('hex');
  if(digest!==manifest.digest)fail(file,'question content digest differs from the expected bank content');
  const answers=Object.fromEntries(optionKeys.map(key=>[key,bank.questions.filter(question=>question.answer===key).length]));
  const review=bank.questions.filter(question=>/\b(only|always|never|all|must|immediately)\b/i.test([question.stem,...Object.values(question.options)].join(' '))).map(question=>question.id);
  console.log(file+': '+bank.questions.length+' questions validated; canonical answers '+JSON.stringify(answers));
  console.log('  High-risk wording review (not automatic failures): '+(review.join(', ')||'none'));
  if(Math.max(...Object.values(answers))/bank.questions.length>0.4)console.log('  Review canonical-answer imbalance (>40% for one answer).');
}
