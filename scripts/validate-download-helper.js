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

const calls=[];
const timers=[];
let createdBlob=null;
const link={href:'',download:'',click(){calls.push('click');}};
const context={
  Blob:function(parts,options){createdBlob={parts,options};calls.push('blob');},
  document:{createElement(tag){if(tag!=='a')throw new Error('expected anchor');calls.push('anchor');return link;}},
  URL:{createObjectURL(blob){if(!blob)throw new Error('missing blob');calls.push('create');return'blob:fixture';},revokeObjectURL(url){calls.push('revoke:'+url);}},
  setTimeout(callback,delay){calls.push('schedule:'+delay);timers.push(callback);}
};
vm.createContext(context);
vm.runInContext(functionSource('downloadFile'),context,{filename:'app.js'});
vm.runInContext("downloadFile('payload','export.json','application/json')",context);
if(createdBlob?.parts?.[0]!=='payload'||createdBlob?.options?.type!=='application/json')throw new Error('blob payload or MIME type changed');
if(link.href!=='blob:fixture'||link.download!=='export.json')throw new Error('URL or filename behavior changed');
if(calls.join(',')!=='blob,anchor,create,click,schedule:0')throw new Error('URL was not created and clicked before deferred cleanup: '+calls.join(','));
if(timers.length!==1)throw new Error('expected one deferred revocation');
timers[0]();
if(calls.join(',')!=='blob,anchor,create,click,schedule:0,revoke:blob:fixture')throw new Error('deferred revocation did not occur exactly once: '+calls.join(','));
console.log('download helper creates URL, clicks anchor, then defers one revocation');
