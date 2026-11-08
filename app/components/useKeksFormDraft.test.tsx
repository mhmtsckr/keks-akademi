// @vitest-environment jsdom
import {act,cleanup,renderHook,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {useKeksFormDraft} from './useKeksFormDraft';

const response=(body:unknown,ok=true)=>Promise.resolve({ok,json:async()=>body});
const selection={answers:{'question-4':3},page:2};

beforeEach(()=>{window.localStorage.clear()});
afterEach(()=>{cleanup();vi.unstubAllGlobals();window.localStorage.clear()});

describe('KEKS resumable form drafts',()=>{
 it('restores the same student and form locally if the server is unreachable',async()=>{
   const key='keks:form:v1:student-1:SCREENING:form-v1';
   window.localStorage.setItem(key,JSON.stringify({data:selection,updatedAt:Date.now()}));
   vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
   const restored=vi.fn();
   const {result}=renderHook(()=>useKeksFormDraft({kind:'SCREENING',scope:'form-v1',studentId:'student-1',onRestore:restored}));
   await waitFor(()=>expect(result.current.ready).toBe(true));
   expect(restored).toHaveBeenCalledWith(selection);
   expect(result.current.status).toBe('local');
 });
 it('recovers server-acknowledged answers when no device copy exists',async()=>{
   const saved={answers:{'question-9':5},page:3};
   vi.stubGlobal('fetch',vi.fn().mockImplementation(()=>response({ok:true,draft:{data:saved,updatedAt:new Date().toISOString()}})));
   const restored=vi.fn();
   const {result}=renderHook(()=>useKeksFormDraft({kind:'SCREENING',scope:'v2',studentId:'student-2',onRestore:restored}));
   await waitFor(()=>expect(result.current.ready).toBe(true));
   expect(restored).toHaveBeenCalledWith(saved);
   expect(result.current.status).toBe('saved');
 });
 it('writes the latest draft locally immediately and syncs asynchronously',async()=>{
   const fetch=vi.fn().mockImplementation((_url:string,init?:{method?:string})=>
     response(init?.method==='PUT'?{ok:true,savedAt:new Date().toISOString()}:{ok:true,draft:null}));
   vi.stubGlobal('fetch',fetch);
   const {result}=renderHook(()=>useKeksFormDraft({kind:'SCREENING',scope:'v3',studentId:'student-3',onRestore:vi.fn()}));
   await waitFor(()=>expect(result.current.ready).toBe(true));
   act(()=>result.current.save(selection));
   const stored=JSON.parse(window.localStorage.getItem('keks:form:v1:student-3:SCREENING:v3')||'{}');
   expect(stored.data).toEqual(selection);
   await waitFor(()=>expect(fetch.mock.calls.some((call:any)=>call[1]?.method==='PUT')).toBe(true),{timeout:2500});
   await waitFor(()=>expect(result.current.status).toBe('saved'));
 });

 it('caches restored server answers locally, so a later disconnection does not erase progress',async()=>{
   const key='keks:form:v1:student-4:SCREENING:form-v4';
   const remote={answers:{'question-11':4},page:1};
   vi.stubGlobal('fetch',vi.fn().mockImplementation(()=>response({
     ok:true,draft:{data:remote,updatedAt:new Date().toISOString()}
   })));
   const {result}=renderHook(()=>useKeksFormDraft({
     kind:'SCREENING',scope:'form-v4',studentId:'student-4',onRestore:vi.fn()
   }));
   await waitFor(()=>expect(result.current.ready).toBe(true));
   const local=JSON.parse(window.localStorage.getItem(key)||'{}');
   expect(local.data).toEqual(remote);
   expect(result.current.status).toBe('saved');
 });
 it('retries an unsynced device draft after connectivity returns without losing the answers',async()=>{
   const key='keks:form:v1:student-5:SCREENING:form-v5';
   const unsynced={answers:{'question-3':2,'question-7':5},page:2};
   window.localStorage.setItem(key,JSON.stringify({data:unsynced,updatedAt:Date.now()}));
   const fetch=vi.fn().mockImplementation((_url:string,init?:{method?:string})=>
     init?.method==='PUT'?response({ok:true,savedAt:new Date().toISOString()}):Promise.reject(new Error('network failed')));
   vi.stubGlobal('fetch',fetch);
   const restored=vi.fn();
   const {result}=renderHook(()=>useKeksFormDraft({
     kind:'SCREENING',scope:'form-v5',studentId:'student-5',onRestore:restored
   }));
   await waitFor(()=>expect(result.current.ready).toBe(true));
   expect(restored).toHaveBeenCalledWith(unsynced);
   await act(async()=>{window.dispatchEvent(new Event('online'));});
   await waitFor(()=>expect(result.current.status).toBe('saved'));
   const put=fetch.mock.calls.find((args:any)=>args[1]?.method==='PUT');
   expect(put).toBeDefined();
   expect(JSON.parse(put[1].body).data).toEqual(unsynced);
 });
});
