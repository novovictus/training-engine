#!/usr/bin/env node
const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync('practice-test/app.js','utf8');

function functionSource(name){
  const start=source.indexOf('function '+name+'(');
  if(start<0)throw new Error('missing function '+name);
  const open=source.indexOf('{',start);
  let depth=0;
  for(let index=open;index<source.length;index++){
    if(source[index]==='{')depth++;
    else if(source[index]==='}'&&!--depth)return source.slice(start,index+1);
  }
  throw new Error('unterminated function '+name);
}

const helpers=['isPlainObject','defaultState','progressStorageKey','corruptProgressBackupKey','loadStoredState','readCompatibleStoredState','preserveCorruptProgress','showCorruptProgressWarning','normalizeStateIdentity','mergeState','sanitizeActiveAttempt','sanitizeCompletedAttempt','clampQuestionCount'];
const helperSource=helpers.map(functionSource).join('\n');
const validState={version:2,bankId:'fixture',bankVersion:'1.0.0',settings:{questionCount:1,durationMinutes:0,includeMastered:false},mastery:{},attempts:[],activeAttempt:null};

function createStorage(seed={},backupWriteFails=false){
  const values=new Map(Object.entries(seed));
  return{
    values,
    getItem(key){return values.has(key)?values.get(key):null;},
    setItem(key,value){if(backupWriteFails&&key.startsWith('training-engine-corrupt-progress-v1:'))throw new Error('backup unavailable');values.set(key,String(value));},
    removeItem(key){values.delete(key);}
  };
}

function load(storage){
  const warnings=[];
  const context={localStorage:storage,showErrorHtml:html=>warnings.push(html)};
  vm.createContext(context);
  const setup="const STORAGE_KEY_PREFIX='training-engine-v1';const DEFAULT_QUESTION_COUNT=60;const OPTION_KEYS=['A','B','C','D'];const CORRUPT_PROGRESS_BACKUP_KEY_PREFIX='training-engine-corrupt-progress-v1:';let bankConfig={bankId:'fixture',bankVersion:'1.0.0'};let bank=[{id:'Q1'}];let questionLookup=new Map();let corruptProgressWarningShown=false;";
  vm.runInContext(setup+helperSource,context);
  const result=vm.runInContext('loadStoredState()',context);
  if(result.corruptProgress)vm.runInContext('showCorruptProgressWarning('+String(result.backupPreserved)+')',context);
  if(result.corruptProgress)vm.runInContext('showCorruptProgressWarning('+String(result.backupPreserved)+')',context);
  return{result,warnings,progressKey:vm.runInContext('progressStorageKey()',context),backupKey:vm.runInContext('corruptProgressBackupKey()',context)};
}

const progressKey='training-engine-v1:fixture:1.0.0';
let storage=createStorage();
let outcome=load(storage);
if(outcome.result.corruptProgress||outcome.warnings.length||storage.values.size)throw new Error('absent state must not create a warning or backup');

storage=createStorage({[progressKey]:JSON.stringify(validState)});
outcome=load(storage);
if(outcome.result.corruptProgress||outcome.warnings.length||storage.values.has(outcome.backupKey)||outcome.result.state.bankId!=='fixture')throw new Error('valid state changed behavior');

const malformed='{not json';
storage=createStorage({[progressKey]:malformed});
outcome=load(storage);
if(!outcome.result.corruptProgress||!outcome.result.backupPreserved||storage.values.get(outcome.backupKey)!==malformed||outcome.warnings.length!==1||outcome.result.state.attempts.length!==0)throw new Error('malformed JSON was not preserved with one safe fallback warning');
storage.setItem(progressKey,JSON.stringify(validState));
if(storage.values.get(outcome.backupKey)!==malformed)throw new Error('later active-state save removed the corrupt backup');

const structurallyInvalid='{"version":2}';
storage=createStorage({[progressKey]:structurallyInvalid});
outcome=load(storage);
if(!outcome.result.corruptProgress||storage.values.get(outcome.backupKey)!==structurallyInvalid)throw new Error('structurally invalid JSON was not preserved');

const nestedInvalid=JSON.stringify({...validState,attempts:[null]});
storage=createStorage({[progressKey]:nestedInvalid});
outcome=load(storage);
if(outcome.result.corruptProgress||outcome.result.state.attempts.length!==0||storage.values.has(outcome.backupKey))throw new Error('safe nested attempt normalization behavior changed');

storage=createStorage({[progressKey]:malformed,['training-engine-corrupt-progress-v1:fixture:1.0.0']:'first preserved raw value'});
outcome=load(storage);
if(storage.values.get(outcome.backupKey)!=='first preserved raw value')throw new Error('existing corrupt backup was overwritten');

storage=createStorage({[progressKey]:malformed},true);
outcome=load(storage);
if(!outcome.result.corruptProgress||outcome.result.backupPreserved||outcome.warnings.length!==1||!outcome.warnings[0].includes('could not preserve'))throw new Error('backup-write failure was not safely contained');

if(!source.includes('function writeLocalStorage(key,value)')||!source.includes('try{localStorage.setItem(key,value);return true;}catch{showPersistenceWarning();return false;}'))throw new Error('F-06 guarded write helper changed unexpectedly');
console.log('Corrupt progress recovery harness passed');
