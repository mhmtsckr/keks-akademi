;(function(){
  'use strict';

  const PROD_ORIGIN='https://keksakademi.vercel.app';

  function config(){
    const qs=new URLSearchParams(window.location.search);
    return {
      token:qs.get('keks_session')||'',
      callback:qs.get('keks_callback')||'',
      returnUrl:qs.get('keks_return')||'',
      embedded:qs.get('keks_embed')==='1'
    };
  }

  function validateCallback(url){
    const parsed=new URL(url);
    if(parsed.origin!==PROD_ORIGIN){
      throw new Error('Geçersiz KEKS callback adresi.');
    }
    return parsed;
  }

  async function submit(input){
    const cfg=config();
    if(!cfg.token||!cfg.callback){
      return {ok:false,skipped:true,reason:'KEKS oturum bilgisi bulunamadı.'};
    }

    const callbackUrl=validateCallback(cfg.callback);
    const response=await fetch(callbackUrl.toString(),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        token:cfg.token,
        formVersion:input.formVersion||'CHATGPT_SITE_V1',
        answers:input.answers||{},
        scores:input.scores||{},
        report:input.report||{},
        externalSubmissionId:input.externalSubmissionId||
          (globalThis.crypto&&crypto.randomUUID?crypto.randomUUID():String(Date.now())),
        completedAt:input.completedAt||new Date().toISOString()
      })
    });

    let result={};
    try{ result=await response.json(); }catch{}

    if(!response.ok){
      throw new Error(result.error||'KEKS aktarımı başarısız.');
    }

    const parentOrigin=cfg.returnUrl?new URL(cfg.returnUrl).origin:PROD_ORIGIN;
    try{
      window.parent&&window.parent.postMessage({
        type:'KEKS_ASSESSMENT_COMPLETED',
        assessmentId:result.assessmentId||null,
        preInterviewOpened:Boolean(result.preInterviewOpened)
      },parentOrigin);
    }catch{}

    return result;
  }

  function returnToKeks(){
    const cfg=config();
    if(cfg.returnUrl)window.location.assign(cfg.returnUrl);
  }

  window.KEKSAssessmentBridge={
    submit,
    config,
    returnToKeks,
    version:'1.0.0'
  };

  window.dispatchEvent(new CustomEvent('keks-assessment-bridge-ready'));
})();