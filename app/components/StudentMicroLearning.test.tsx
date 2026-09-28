// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {StudentMicroLearning} from './StudentMicroLearning';
const data={tasks:[{kind:'WORDS_5',title:'5 kelime',minutes:3,subject:'İngilizce',topic:'Kelime',reason:'Sana uygun'},{kind:'PROBLEM_3',title:'3 problem',minutes:5,subject:'Matematik',topic:'Problem',reason:'Sana uygun'}],summary:{today:0,sessions:0,minutes:0,correct:0,wrong:0,blank:0}};
const response=(body:unknown,ok=true)=>Promise.resolve({ok,json:async()=>body});
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
describe('student micro learning flow',()=>{
  it('filters by available time and preserves answers if saving fails',async()=>{
    const fetch=vi.fn().mockImplementationOnce(()=>response(data)).mockImplementationOnce(()=>response({sessionId:'s',startedAt:new Date().toISOString(),reviewId:null,imageUrl:null,pack:{kind:'WORDS_5',title:'5 kelime',minutes:3,items:[{id:'0',prompt:'book',options:['kitap','su']}]}})).mockImplementationOnce(()=>response({error:'Geçici bağlantı hatası'},false)).mockImplementationOnce(()=>response({result:{correct:1,wrong:0,blank:0,total:1,items:[{id:'0',prompt:'book',answer:'kitap',correctAnswer:'kitap',explanation:'book → kitap',correct:true,blank:false}]}})).mockImplementationOnce(()=>response({...data,summary:{...data.summary,today:1,sessions:1,correct:1}}));
    vi.stubGlobal('fetch',fetch);render(<StudentMicroLearning/>);
    await screen.findByText('3 problem');fireEvent.click(screen.getByRole('button',{name:'3 dakikam var'}));expect(screen.queryByText('3 problem')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Başla'}));const answer=await screen.findByRole('combobox',{name:'book'});fireEvent.change(answer,{target:{value:'kitap'}});
    fireEvent.click(screen.getByRole('button',{name:'Kontrol et ve kaydet'}));await screen.findByRole('alert');expect((answer as HTMLSelectElement).value).toBe('kitap');
    fireEvent.click(screen.getByRole('button',{name:'Kontrol et ve kaydet'}));await screen.findByText('book → kitap');await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(5));expect(screen.getByText('1 mini görev')).toBeTruthy();
  });
  it('shows a retry control when loading fails',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('Bağlantı kurulamadı')));render(<StudentMicroLearning/>);expect(await screen.findByRole('button',{name:'Yeniden dene'})).toBeTruthy()});
});
