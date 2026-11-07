import {describe,it,expect} from 'vitest';
import {buildWrongRecovery,RECOVERY_LABELS,WRONG_REFLECTION_TYPE,mistakeAction} from './wrongQuestionRecovery';
import {REMEDIATION_REASONS} from './wrongQuestionRemediation';

function event(id:string,type:string,questionId:string,at:string,data:Record<string,unknown>={}){
 return {id,createdAt:new Date(at),payload:{
   type,...(type==='GUIDED_PRACTICE_RESULT'?{originQuestionId:questionId}:{questionId}),...data
 }};
}
const reflect=(qid='q-a',at='2026-10-10T12:00:00Z')=>event('reflection-1',WRONG_REFLECTION_TYPE,qid,at,{
 reason:'SORU_KOKU',
 mistakenStep:'Sorudaki olumsuz ifadeyi ilk okumada gözden kaçırdım.',
 correctedPrinciple:'Sorunun neyi istediğini son cümleden okuyup kendi cümlemle açıklamalıyım.',
 nextTimeCheck:'Olumsuz soru kökü sözcüklerini işaretleyip cevabımı kontrol edeceğim.'
});

describe('Yanlıştan Öğrenmeye soruya bağlı düşünme ve kanıt',()=>{
 it('henüz hata analizi yoksa kalıcı öğrenme veya kesin kazanım çıkarmaz',()=>{
  const r=buildWrongRecovery('q-a',[]);
  expect(r.stage).toBe('NEEDS_REFLECTION');
  expect(r.reflection).toBeNull();
  expect(r.evidence.guided).toBeNull();
  expect(r.evidence.independentReview).toBeNull();
  expect(r.masteryStatusUnchanged).toBe(true);
  expect(r.reviewScheduleUnchanged).toBe(true);
 });
 it('öğrencinin gerçek nedeni ile uygulanabilir düzeltme adımını eşler',()=>{
  for(const id of Object.keys(REMEDIATION_REASONS) as (keyof typeof REMEDIATION_REASONS)[]){
   expect(mistakeAction(id)).toBe(REMEDIATION_REASONS[id].instruction);
   expect(mistakeAction(id).length).toBeGreaterThan(30);
  }
  const r=buildWrongRecovery('q-a',[reflect()]);
  expect(r.stage).toBe('READY_TO_PRACTICE');
  expect(r.reflection?.reasonLabel).toBe('Soru kökünü yanlış okuma');
  expect(r.reflection?.correctedPrinciple).toContain('son cümleden');
  expect(r.reflection?.nextTimeCheck).toContain('Olumsuz');
 });
 it('çözümlü örnekte doğru cevap bağımsız ve kalıcı öğrenme sayılmaz',()=>{
  const r=buildWrongRecovery('q-a',[
   reflect(),
   event('guided','GUIDED_PRACTICE_RESULT','q-a','2026-10-10T13:00:00Z',{correct:true})
  ]);
  expect(r.stage).toBe('GUIDED_CORRECT');
  expect(r.evidence.guided?.correct).toBe(true);
  expect(r.evidence.independentReview).toBeNull();
  expect(r.label).toContain('bağımsız tekrar');
 });
 it('bağımsız özgün soru tekrarını ayrı gösterir, ancak kalıcılık ilan etmez',()=>{
  const r=buildWrongRecovery('q-a',[
   reflect(),
   event('guided','GUIDED_PRACTICE_RESULT','q-a','2026-10-10T13:00:00Z',{correct:true}),
   event('review','REVIEW_RESULT','q-a','2026-10-11T13:00:00Z',{correct:true})
  ]);
  expect(r.stage).toBe('REVIEW_CORRECT');
  expect(r.evidence.guided?.correct).toBe(true);
  expect(r.evidence.independentReview?.correct).toBe(true);
  expect(r.label).toContain('kalıcılık henüz');
 });
 it('en son yanlış bağımsız sonucu önceki doğru mikro örneğin önüne geçirir',()=>{
  const r=buildWrongRecovery('q-a',[
   reflect(),
   event('guided','GUIDED_PRACTICE_RESULT','q-a','2026-10-10T13:00:00Z',{correct:true}),
   event('review','REVIEW_RESULT','q-a','2026-10-11T13:00:00Z',{correct:false})
  ]);
  expect(r.stage).toBe('REVIEW_WRONG');
  expect(r.evidence.independentReview?.correct).toBe(false);
 });
 it('başka öğrencinin soru idsi ve eski önceki kayıtlar tanıya karışmaz',()=>{
  const r=buildWrongRecovery('q-a',[
   event('old','REVIEW_RESULT','q-a','2026-10-09T12:00:00Z',{correct:true}),
   reflect(),
   event('other-guided','GUIDED_PRACTICE_RESULT','q-b','2026-10-12T12:00:00Z',{correct:true}),
   event('other-reflect',WRONG_REFLECTION_TYPE,'q-b','2026-10-13T12:00:00Z',{reason:'DIKKAT'})
  ]);
  expect(r.stage).toBe('READY_TO_PRACTICE');
  expect(r.evidence.guided).toBeNull();
  expect(r.evidence.independentReview).toBeNull();
 });
 it('yeni hata analizi yapıldığında eski örnek başarısını yeni analiz kanıtı saymaz',()=>{
  const r=buildWrongRecovery('q-a',[
   reflect('q-a','2026-10-10T12:00:00Z'),
   event('guided','GUIDED_PRACTICE_RESULT','q-a','2026-10-11T12:00:00Z',{correct:true}),
   reflect('q-a','2026-10-12T12:00:00Z')
  ]);
  expect(r.stage).toBe('READY_TO_PRACTICE');
  expect(r.evidence.guided).toBeNull();
 });
 it('hata nedeni geçersizse kişilik ya da kesin tanı etiketi üretmez',()=>{
  const e=event('one',WRONG_REFLECTION_TYPE,'q-a','2026-10-12T12:00:00Z',{
   reason:'PERSONALITY_TYPE',mistakenStep:'...',correctedPrinciple:'...',nextTimeCheck:'...'
  });
  const r=buildWrongRecovery('q-a',[e]);
  expect(r.reflection).toBeNull();
  expect(RECOVERY_LABELS.GUIDED_CORRECT).not.toContain('Kalıcı');
 });
});

describe('Yanlış ve boş soru için kanıta dayalı sonraki görev önerisi',()=>{
 it('boş tekrarı yanlış saymadan ayrı izler ve neden odaklı çalışma önerir',()=>{
  const r=buildWrongRecovery('q-a',[
   reflect(),
   event('blank-review','REVIEW_RESULT','q-a','2026-10-11T12:00:00Z',{correct:false,blank:true,outcome:'BLANK'})
  ],{bankReason:'BLANK',gradeLevel:'4. sınıf',examType:'GENEL',topic:'Kesirler',classificationConfidence:1});
  expect(r.stage).toBe('REVIEW_BLANK');
  expect(r.evidence.independentReview?.blank).toBe(true);
  expect(r.evidence.blankReviews).toBe(1);
  expect(r.evidence.wrongReviews).toBe(0);
  expect(r.nextTask.code).toBe('RELEARN');
  expect(r.nextTask.freshQuestionTarget).toBe(2);
  expect(r.nextTask.maxSessionMinutes).toBe(7);
  expect(r.nextTask.coachSupportSuggested).toBe(false);
 });
 it('aynı soruda iki ardışık başarısız bağımsız denemede koç kontrolüne yöneltir',()=>{
  const r=buildWrongRecovery('q-a',[
   reflect(),
   event('wrong','REVIEW_RESULT','q-a','2026-10-11T12:00:00Z',{correct:false,outcome:'WRONG'}),
   event('blank','REVIEW_RESULT','q-a','2026-10-12T12:00:00Z',{correct:false,blank:true,outcome:'BLANK'}),
   event('guided','GUIDED_PRACTICE_RESULT','q-a','2026-10-13T12:00:00Z',{correct:true})
  ],{bankReason:'WRONG',gradeLevel:'12. sınıf',examType:'TYT',topic:'Paragraf',classificationConfidence:1});
  expect(r.evidence.consecutiveUnsuccessfulReviews).toBe(2);
  expect(r.evidence.blankReviews).toBe(1);
  expect(r.evidence.wrongReviews).toBe(1);
  expect(r.nextTask.code).toBe('COACH_REVIEW');
  expect(r.nextTask.coachSupportSuggested).toBe(true);
  expect(r.reviewScheduleUnchanged).toBe(true);
 });
 it('yeni doğru bağımsız yanıt başarısızlık serisini sıfırlar; kalıcılık ilan etmez',()=>{
  const r=buildWrongRecovery('q-a',[
   reflect(),
   event('wrong','REVIEW_RESULT','q-a','2026-10-11T12:00:00Z',{correct:false}),
   event('blank','REVIEW_RESULT','q-a','2026-10-12T12:00:00Z',{correct:false,blank:true}),
   event('correct','REVIEW_RESULT','q-a','2026-10-13T12:00:00Z',{correct:true})
  ],{gradeLevel:'12. sınıf',examType:'AYT',topic:'Köklü Sayılar',classificationConfidence:0.9});
  expect(r.evidence.consecutiveUnsuccessfulReviews).toBe(0);
  expect(r.nextTask.code).toBe('TRANSFER_CHECK');
  expect(r.nextTask.freshQuestionTarget).toBe(4);
  expect(r.masteryStatusUnchanged).toBe(true);
 });
 it('belirsiz alt konuyu veya düzeyi doğrulamadan özgün soru yükü önermiyor',()=>{
  const rows=[reflect()];
  const unknown=buildWrongRecovery('q-a',rows,{gradeLevel:null,examType:'GENEL',topic:'Genel / Karma'});
  expect(unknown.nextTask.code).toBe('VERIFY_LEVEL');
  expect(unknown.nextTask.freshQuestionTarget).toBe(0);
  const lowConfidence=buildWrongRecovery('q-a',rows,{gradeLevel:'8. sınıf',examType:'LGS',topic:'Paragraf',classificationConfidence:0.25});
  expect(lowConfidence.nextTask.code).toBe('CONFIRM_TOPIC');
  expect(lowConfidence.nextTask.coachSupportSuggested).toBe(true);
 });
 it('boş soruda öz bildirim öncesi kararsızlığı yanlış tanısı olarak dayatmaz',()=>{
  const r=buildWrongRecovery('q-a',[],{bankReason:'BLANK',gradeLevel:'8. sınıf',examType:'LGS',topic:'Paragraf',classificationConfidence:1});
  expect(r.nextTask.code).toBe('REFLECT');
  expect(r.nextTask.title).toContain('Boş bırakma');
  expect(r.evidence.reviewAttempts).toBe(0);
  expect(r.reflection).toBeNull();
 });
 it('yeni analiz eski tekrar sonuçlarını ve başka soruyu dikkate almaz',()=>{
  const r=buildWrongRecovery('q-a',[
   reflect('q-a','2026-10-12T12:00:00Z'),
   event('old','REVIEW_RESULT','q-a','2026-10-11T12:00:00Z',{correct:false}),
   event('other','REVIEW_RESULT','q-b','2026-10-14T12:00:00Z',{correct:false})
  ],{gradeLevel:'8. sınıf',examType:'LGS',topic:'Paragraf',classificationConfidence:1});
  expect(r.evidence.reviewAttempts).toBe(0);
  expect(r.nextTask.code).toBe('GUIDED_PRACTICE');
 });
});
