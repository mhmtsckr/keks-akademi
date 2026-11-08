'use client';

import {createElement,useCallback,useEffect,useRef,useState} from 'react';

export type KeksDraftKind='ONBOARDING'|'CONTEXT'|'SCREENING'|'INTERVIEW';
export type KeksDraftStatus='loading'|'local'|'saving'|'saved'|'error';
type Draft<T>={data:T;updatedAt:number};
const AGE_LIMIT=14*24*60*60*1000;
const endpoint='/api/student/form-draft';

export function useKeksFormDraft<T>({
 kind,scope,studentId,onRestore
}:{kind:KeksDraftKind;scope:string|null;studentId:string;onRestore:(data:T)=>void}){
 const [ready,setReady]=useState(false);
 const [status,setStatus]=useState<KeksDraftStatus>('loading');
 const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const queue=useRef<Promise<unknown>>(Promise.resolve());
 const last=useRef<Draft<T>|null>(null);
 const changed=useRef(0);
 const pending=useRef(false);
 const localAvailable=useRef(true);
 const activeScope=useRef<string|null>(null);
 const active=useRef(true);
 const restoreCallback=useRef(onRestore);
 restoreCallback.current=onRestore;
 const key=scope&&studentId?'keks:form:v1:'+studentId+':'+kind+':'+scope:null;
 const url=scope?endpoint+'?kind='+encodeURIComponent(kind)+'&scope='+encodeURIComponent(scope):null;

 const persist=useCallback((_item:Draft<T>)=>{
   if(!url||!key||!active.current||activeScope.current!==key)return Promise.resolve();
   if(!navigator.onLine){
     pending.current=true;
     setStatus(localAvailable.current?'local':'error');
     return Promise.resolve();
   }
   setStatus('saving');
   const task=queue.current.catch(()=>undefined).then(async()=>{
     if(!active.current||activeScope.current!==key||!pending.current)return;
     if(!navigator.onLine)throw new Error('Bağlantı yok.');
     // Read the newest snapshot AFTER earlier requests, so delayed writes never send stale answers.
     const latest=last.current;
     if(!latest)return;
     const revision=changed.current;
     const response=await fetch(endpoint,{method:'PUT',headers:{'content-type':'application/json'},
       body:JSON.stringify({kind,scope,data:latest.data}),credentials:'same-origin'});
     if(!response.ok)throw new Error('Sunucu taslağı kaydetmedi.');
     if(active.current&&activeScope.current===key&&last.current===latest&&revision===changed.current){
       pending.current=false;
       setStatus('saved');
     }
   });
   queue.current=task;
   return task.catch(()=>{
     if(active.current&&activeScope.current===key){
       pending.current=true;
       setStatus(localAvailable.current?'local':'error');
     }
   });
 },[key,kind,scope,url]);

 const save=useCallback((data:T)=>{
   if(!key)return;
   changed.current++;
   const item={data,updatedAt:Date.now()};
   last.current=item;
   pending.current=true;
   try{localStorage.setItem(key,JSON.stringify(item));localAvailable.current=true}
   catch{localAvailable.current=false}
   setStatus(localAvailable.current?'local':'error');
   if(saveTimer.current)clearTimeout(saveTimer.current);
   saveTimer.current=setTimeout(()=>{void persist(item)},650);
 },[key,persist]);

 useEffect(()=>{
   if(!key||!url)return;
   let mounted=true;
   active.current=true;activeScope.current=key;
   changed.current=0;pending.current=false;localAvailable.current=true;
   last.current=null;setStatus('loading');setReady(false);
   let local:Draft<T>|null=null;
   try{
     const stored=localStorage.getItem(key);
     if(stored){
       const parsed=JSON.parse(stored) as Draft<T>;
       if(Number.isFinite(parsed.updatedAt)&&Date.now()-parsed.updatedAt<AGE_LIMIT){
         local=parsed;
         last.current=parsed;
         pending.current=true;
         restoreCallback.current(parsed.data);
         setStatus('local');
       }else localStorage.removeItem(key);
     }
   }catch{/* local storage can be disabled */}
   const loadedRevision=changed.current;
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),4500);
   (async()=>{
     try{
       const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:controller.signal});
       if(!response.ok)throw new Error('Taslak yüklenemedi.');
       const result=await response.json();
       const remote=result.draft;
       if(!mounted||changed.current!==loadedRevision)return;
       if(remote&&remote.data){
         const timestamp=new Date(remote.updatedAt).getTime();
         if(!local||timestamp>=local.updatedAt){
           const recovered={data:remote.data as T,updatedAt:timestamp};
           last.current=recovered;
           pending.current=false;
           // Keep the browser fallback aligned with the last server-confirmed answers.
           try{localStorage.setItem(key,JSON.stringify(recovered));localAvailable.current=true}
           catch{localAvailable.current=false}
           restoreCallback.current(recovered.data);
           setStatus('saved');
         }else if(local.updatedAt>timestamp){
           pending.current=true;
           void persist(local);
         }
       }else if(local){pending.current=true;void persist(local)}
       else{pending.current=false;setStatus('saved')}
     }catch{
       if(mounted)setStatus(last.current?(localAvailable.current?'local':'error'):'error');
     }finally{
       clearTimeout(timeout);
       if(mounted)setReady(true);
     }
   })();
   const retryPending=()=>{
     if(mounted&&pending.current&&last.current&&navigator.onLine)void persist(last.current);
   };
   const onVisibility=()=>{if(document.visibilityState==='visible')retryPending()};
   // navigator.onLine can stay true on captive portals. Retry while visible and when a tab is reopened.
   const interval=window.setInterval(()=>{
     if(document.visibilityState==='visible')retryPending();
   },20000);
   window.addEventListener('online',retryPending);
   window.addEventListener('focus',retryPending);
   document.addEventListener('visibilitychange',onVisibility);
   return ()=>{mounted=false;active.current=false;activeScope.current=null;
     controller.abort();clearTimeout(timeout);window.clearInterval(interval);
     if(saveTimer.current)clearTimeout(saveTimer.current);
     window.removeEventListener('online',retryPending);
     window.removeEventListener('focus',retryPending);
     document.removeEventListener('visibilitychange',onVisibility)};
 },[key,url,persist]);

 const clear=useCallback(async()=>{
   if(!key||!url)return;
   if(saveTimer.current)clearTimeout(saveTimer.current);
   try{localStorage.removeItem(key)}catch{}
   changed.current++;
   pending.current=false;
   last.current=null;
   try{
     await queue.current.catch(()=>undefined);
     const r=await fetch(url,{method:'DELETE',credentials:'same-origin'});
     if(!r.ok)throw new Error('Taslak silinemedi.');
     setStatus('saved');
   }catch{setStatus('error')}
 },[key,url]);

 return {ready,status,save,clear,retry:()=>last.current?persist(last.current):Promise.resolve()};
}

export function KeksDraftIndicator({status,retry}:{status:KeksDraftStatus;retry:()=>void}){
 const label=status==='loading'?'Kayıtlar kontrol ediliyor…'
  :status==='saved'?'✓ Sunucuya kaydedildi · Başka cihazdan devam edebilirsin'
  :status==='saving'?'Sunucuya kaydediliyor…'
  :status==='local'?'Bu cihazda korundu · Bağlantı geldiğinde eşitlenecek'
  :'Sunucuya ulaşılamadı · Yazdıkların bu cihazda korunmaya çalışılıyor';
 return createElement('div',{className:'keksResumeStatus '+(status==='error'?'keksResumeError':''),role:'status','aria-live':'polite'},
   createElement('span',{'aria-hidden':'true'},status==='saved'?'✓':status==='error'?'!':'●'),
   createElement('span',null,label),
   (status==='local'||status==='error')?createElement('button',{type:'button',className:'btn',onClick:retry},'Şimdi eşitle'):null
 );
}
