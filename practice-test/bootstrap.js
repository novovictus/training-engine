(()=>{
  const SELECTED_SOURCE_KEY='training-engine-selected-bank-source';
  const CUSTOM_BANK_KEY='training-engine-custom-bank';
  const BUNDLED_BANK={source:'questions.js',kind:'bundled',globalName:'TRAINING_ENGINE_FIXTURE_BANK'};
  const OPTION_KEYS=['A','B','C','D'];
  const RESERVED_QUESTION_IDS=new Set(['__proto__','constructor','prototype']);
  const QUESTION_KEYS=['answer','domain','id','options','stem','target'];

  function validBankShape(bank){
    if(!bank||typeof bank!=='object'||Array.isArray(bank)||bank.schemaVersion!==2||!['bankId','bankVersion','title'].every(key=>typeof bank[key]==='string'&&bank[key].trim())||!Array.isArray(bank.questions)||!bank.questions.length)return false;
    const ids=new Set();
    return bank.questions.every(question=>{
      if(!question||typeof question!=='object'||Array.isArray(question)||Object.keys(question).sort().join(',')!==QUESTION_KEYS.join(',')||typeof question.id!=='string'||!question.id.trim()||RESERVED_QUESTION_IDS.has(question.id)||ids.has(question.id)||typeof question.domain!=='string'||typeof question.target!=='string'||typeof question.stem!=='string'||!question.stem.trim()||!question.options||typeof question.options!=='object'||Array.isArray(question.options)||Object.keys(question.options).sort().join(',')!==OPTION_KEYS.join(',')||!OPTION_KEYS.every(key=>typeof question.options[key]==='string'&&question.options[key].trim())||!OPTION_KEYS.includes(question.answer))return false;
      ids.add(question.id);
      return true;
    });
  }

  function readCustomBank(){
    try{
      const parsed=JSON.parse(localStorage.getItem(CUSTOM_BANK_KEY));
      const stored=validBankShape(parsed?.bank)?parsed:validBankShape(parsed)?{bank:parsed,sourceName:'Custom bank'}:null;
      if(!stored)return null;
      return{bank:stored.bank,sourceName:typeof stored.sourceName==='string'&&stored.sourceName.trim()?stored.sourceName.trim():'Custom bank'};
    }catch{return null;}
  }

  const customBank=readCustomBank();
  const useCustom=localStorage.getItem(SELECTED_SOURCE_KEY)==='custom'&&customBank;
  const selected={kind:useCustom?'custom':'bundled',source:BUNDLED_BANK.source};

  function switchToCustom(runtime){
    if(!runtime||!validBankShape(runtime.bank)||typeof runtime.sourceName!=='string'||!runtime.sourceName.trim())throw new Error('Selected file does not contain a supported schemaVersion 2 question bank.');
    try{
      localStorage.setItem(CUSTOM_BANK_KEY,JSON.stringify({bank:runtime.bank,sourceName:runtime.sourceName.trim()}));
      localStorage.setItem(SELECTED_SOURCE_KEY,'custom');
    }catch{window.TRAINING_ENGINE_NOTIFY_PERSISTENCE_FAILURE?.();return false;}
    location.reload();
    return true;
  }

  function useBundled(){
    if(selected.kind==='bundled')return false;
    try{localStorage.setItem(SELECTED_SOURCE_KEY,'bundled');}
    catch{window.TRAINING_ENGINE_NOTIFY_PERSISTENCE_FAILURE?.();return false;}
    location.reload();
    return true;
  }

  function setActiveBank(runtime){Object.assign(selected,{id:runtime.bank.bankId,version:runtime.bank.bankVersion,title:runtime.bank.title,questionCount:runtime.bank.questions.length,sourceName:runtime.sourceName});}
  window.TRAINING_ENGINE_BANKS={selected,switchToCustom,useBundled,validBankShape,setActiveBank};
  if(useCustom){
    window.TRAINING_ENGINE_RUNTIME_BANK=customBank;
  }else{
    const bundledRuntime={sourceName:BUNDLED_BANK.globalName,bank:window[BUNDLED_BANK.globalName]};
    if(validBankShape(bundledRuntime.bank))window.TRAINING_ENGINE_RUNTIME_BANK=bundledRuntime;
  }
})();
