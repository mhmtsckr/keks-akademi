import {describe,expect,it} from 'vitest';
import {evaluateEditorialGate} from './editorialGate';
const draft={revision:2,contentHash:'hash-v2',status:'PENDING',sourceRefs:[{doi:'10.1000/test'}]};
const signatures=[
 {reviewerUserId:'person-1',stage:'SUBJECT',decision:'APPROVE',revision:2,contentHash:'hash-v2',rightsVerified:false,createdAt:'2026-10-01T10:00:00Z'},
 {reviewerUserId:'person-2',stage:'ASSESSMENT',decision:'APPROVE',revision:2,contentHash:'hash-v2',rightsVerified:false,createdAt:'2026-10-01T10:01:00Z'},
 {reviewerUserId:'person-3',stage:'SOURCE_RIGHTS',decision:'APPROVE',revision:2,contentHash:'hash-v2',rightsVerified:true,createdAt:'2026-10-01T10:02:00Z'},
];
describe('KEKS bağımsız yayın kapısı',()=>{
 it('üç ayrı imzalı ve lisans doğrulanmış sürüme izin verir',()=>expect(evaluateEditorialGate(draft,signatures).ready).toBe(true));
 it('otomatik insan onayı üretmez',()=>expect(evaluateEditorialGate(draft,[]).ready).toBe(false));
 it('önceki sürümün onayını kabul etmez',()=>expect(evaluateEditorialGate({...draft,revision:3},signatures).ready).toBe(false));
 it('farklı içerik hash onayını kabul etmez',()=>expect(evaluateEditorialGate({...draft,contentHash:'changed'},signatures).ready).toBe(false));
 it('aynı kişinin iki rolü imzalamasını reddeder',()=>{
  const d=signatures.map(x=>({...x}));
  d[1].reviewerUserId=d[0].reviewerUserId;
  expect(evaluateEditorialGate(draft,d).ready).toBe(false);
 });
 it('telif kanıtı olmadan onaylamaz',()=>{
  const d=signatures.map(x=>({...x}));
  d[2].rightsVerified=false;
  expect(evaluateEditorialGate(draft,d).ready).toBe(false);
 });
 it('sonradan ret gelirse önceki onayı geçersiz sayar',()=>{
  const d=[...signatures,{...signatures[0],decision:'REJECT',createdAt:'2026-10-01T10:04:00Z'}];
  expect(evaluateEditorialGate(draft,d).ready).toBe(false);
 });
 it('yayınlanan sorunun yeniden yayımlanmasına izin vermez',()=>expect(evaluateEditorialGate({...draft,status:'PUBLISHED'},signatures).ready).toBe(false));
});
