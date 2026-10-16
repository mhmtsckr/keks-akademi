import {describe,expect,it} from 'vitest';
import {gradeParagrafPage,parseParagrafPageNo} from './paragrafPage';
describe('Paragraf A3 QR dijital cevap formu',()=>{
  it('test sınırlarında 4 soruyu doğru sayfaya eşler',()=>{
    expect(parseParagrafPageNo('001')).toMatchObject({testNo:1,pageInTest:1,questionNos:[1,2,3,4]});
    expect(parseParagrafPageNo('008')).toMatchObject({testNo:1,pageInTest:8,questionNos:[29,30]});
    expect(parseParagrafPageNo('009')).toMatchObject({testNo:2,pageInTest:1,questionNos:[1,2,3,4]});
    expect(parseParagrafPageNo('400')).toMatchObject({testNo:50,pageInTest:8,questionNos:[29,30]});
  });
  it('geçersiz basılı sayfa idlerini reddeder',()=>{
    for(const id of ['1','000','401','../1','abc','999','001;'])expect(parseParagrafPageNo(id)).toBeNull();
  });
  const questions=[
    {id:'00001',testNo:1,questionNo:1,topic:'Ana düşünce',correctAnswer:'A'},
    {id:'00002',testNo:1,questionNo:2,topic:'Çıkarım',correctAnswer:'B'},
    {id:'00003',testNo:1,questionNo:3,topic:'Ana düşünce',correctAnswer:'C'},
    {id:'00004',testNo:1,questionNo:4,topic:'Örtük anlam',correctAnswer:'D'}
  ];
  it('puanı, yanlış becerisini ve boşu doğru hesaplar',()=>{
    const g=gradeParagrafPage([1,2,3,4],questions,{'1':'A','2':'C','3':null,'4':'D'});
    expect(g).toMatchObject({correct:2,wrong:1,blank:1,net:1.75,wrongTopics:['Çıkarım']});
  });
  it('başka sayfanın cevaplarının sızmasını önler',()=>{
    expect(()=>gradeParagrafPage([1,2,3,4],questions,{'1':'A','2':'B','3':'C','5':'A'})).toThrow();
    expect(()=>gradeParagrafPage([1,2,3,4],questions.slice(0,3),{'1':'A','2':'B','3':'C','4':null})).toThrow();
  });
});
