'use client';

import {useCallback,useEffect,useRef,useState} from 'react';

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
 const active=useRef(true);
 const restoreCallback=useRef(onRestore);
 restoreCallback.current=onRestore;
 const key=scope&&studentId?'keks:form:v1:'+studentId+':'+kind+':'+scope:null;
 const url=scope?endpoint+'?kind='+encodeURIComponent(kind)+'&scope='+encodeURIComponent(scope):null;

 const persist=useCallback((item:Draft<T>)=>{
   if(!url||!active.current)return Promise.resolve();
   const revision=changed.current;
   setStatus(typeof navigator!=='undefined'&&!navigator.onLine?'local':'saving');
   const task=queue.current.catch(()=>undefined).then(async()=>{
     if(!active.current||!navigator.onLine)return;
     const response=await fetch(endpoint,{method:'PUT',headers:{'content-type':'application/json'},
       body:JSON.stringify({kind,scope,data:item.data}),credentials:'same-origin'});
     if(!response.ok)throw new Error('Sunucu taslağı kaydetmedi.');
     if(active.current&&revision===changed.current)setStatus('saved');
   });
   queue.current=task;
   return task.catch(()=>{if(active.current&&revision===changed.current)setStatus('local')});
 },[kind,scope,url]);

 const save=useCallback((data:T)=>{
   if(!key)return;
   changed.current++;
   const item={data,updatedAt:Date.now()};
   last.current=item;
   try{localStorage.setItem(key,JSON.stringify(item))}catch{/* server sync remains available */}
   setStatus('local');
   if(saveTimer.current)clearTimeout(saveTimer.current);
   saveTimer.current=setTimeout(()=>{void persist(item)},650);
 },[key,persist]);

 useEffect(()=>{
   if(!key||!url)return;
   let mounted=true;
   active.current=true;
   changed.current=0;last.current=null;setStatus('loading');setReady(false);
   let local:Draft<T>|null=null;
   try{
     const stored=localStorage.getItem(key);
     if(stored){
       const parsed=JSON.parse(stored) as Draft<T>;
       if(Number.isFinite(parsed.updatedAt)&&Date.now()-parsed.updatedAt<AGE_LIMIT){
         local=parsed;
         last.current=parsed;
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
         if(!local||timestamp>local.updatedAt){
           last.current={data:remote.data as T,updatedAt:timestamp};
           restoreCallback.current(remote.data as T);
           setStatus('saved');
         }else if(local.updatedAt>timestamp){
           void persist(local);
         }else setStatus('saved');
       }else if(local){void persist(local)}
       else setStatus('saved');
     }catch{
       if(mounted)setStatus(last.current?'local':'error');
     }finally{
       clearTimeout(timeout);
       if(mounted)setReady(true);
     }
   })();
   const onOnline=()=>{if(last.current)void persist(last.current)};
   window.addEventListener('online',onOnline);
   return ()=>{mounted=false;active.current=false;controller.abort();clearTimeout(timeout);
     if(saveTimer.current)clearTimeout(saveTimer.current);window.removeEventListener('online',onOnline)};
 },[key,url,persist]);

 const clear=useCallback(async()=>{
   if(!key||!url)return;
   if(saveTimer.current)clearTimeout(saveTimer.current);
   try{localStorage.removeItem(key)}catch{}
   changed.current++;
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
 return <div className={'keksResumeStatus '+(status==='error'?'keksResumeError':'')} role="status" aria-live="polite">
   <span aria-hidden="true">{status==='saved'?'✓':status==='error'?'!':'●'}</span>
   <span>{label}</span>
   {(status==='local'||status==='error')&&<button type="button" className="btn" onClick={retry}>Şimdi eşitle</button>}
 </div>;
}
