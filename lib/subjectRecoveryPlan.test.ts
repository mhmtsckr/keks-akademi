import {describe,it,expect} from 'vitest';
import {buildSubjectRecoveryPlan,classifyRecoveryFamily,PERSONAL_RECOVERY_DAYS} from './subjectRecoveryPlan';
import {buildWrongQuestionSupport} from './wrongQuestionRemediation';

describe('yanlış, boş ve işaretli çok dersli öğrenme planları',()=>{
 const subjects=[
  ['Matematik','MATHEMATICS'],['Geometri','MATHEMATICS'],['Türkçe','TURKISH'],
  ['Türk Dili ve Edebiyatı','LITERATURE'],['Tarih','HISTORY'],['Coğrafya','GEOGRAPHY'],
  ['Fen Bilimleri','SCIENCE'],['Fizik','SCIENCE'],['Kimya','SCIENCE'],['Biyoloji','SCIENCE'],
  ['İngilizce','ENGLISH'],['Felsefe','PHILOSOPHY'],['Din Kültürü','RELIGION'],
  ['Eğitim Bilimleri','EDUCATION'],['Mevzuat','LEGISLATION']
 ] as const;
 it.each(subjects)('%s dersi kendine özgü öğrenme yöntemi alır',(subject,family)=>{
  const plan=buildSubjectRecoveryPlan({subject,topic:'Genel / Karma',bankReason:'BLANK',classificationConfidence:0.25});
  expect(classifyRecoveryFamily(subject)).toBe(family);
  expect(plan.family).toBe(family);
  expect(plan.steps).toHaveLength(5);
  expect(plan.reviewDays).toEqual([0,1,3,7,14,28]);
  expect(plan.status).toBe('BLANK');
  expect(plan.steps[0]).toContain('Boş bırakma');
  expect(plan.needsTopicConfirmation).toBe(true);
  expect(plan.contentStatus).toBe('METHOD_ONLY');
  expect(plan.note).toContain('tek başına kalıcı öğrenme değildir');
 });
 it('Türkçe için cümle tamamlama, ikiye bölme ve cümle sıralama stratejileri farklıdır',()=>{
  const topics=['Cümle Tamamlama','Paragrafı İkiye Bölme','Cümle Sıralama'];
  const plans=topics.map(topic=>buildSubjectRecoveryPlan({subject:'Türkçe',topic,bankReason:'WRONG',classificationConfidence:1}));
  expect(new Set(plans.map(p=>p.method)).size).toBe(3);
  expect(plans[0].diagnosticQuestion).toContain('bağlacı');
  expect(plans[1].diagnosticQuestion).toContain('İkinci paragrafın');
  expect(plans[2].diagnosticQuestion).toContain('göndergelerini');
  expect(plans.every(p=>!p.needsTopicConfirmation)).toBe(true);
 });
 it('yanlış, boş ve işaretli birbirine karıştırılmaz; sınıflandırma uzman tanısı sayılmaz',()=>{
  const base={subject:'Biyoloji',topic:'Organel',classificationConfidence:1};
  const w=buildSubjectRecoveryPlan({...base,bankReason:'WRONG'});
  const b=buildSubjectRecoveryPlan({...base,bankReason:'BLANK'});
  const m=buildSubjectRecoveryPlan({...base,bankReason:'MARKED'});
  expect([w.statusLabel,b.statusLabel,m.statusLabel]).toEqual([
    'Yanlış yapılan soru','Boş bırakılan soru','İşaretlenen soru'
  ]);
  expect(b.steps[0]).not.toBe(w.steps[0]);
  expect(m.steps[0]).toContain('İşaretleme nedeni');
 });
 it('sadece doğrulanmış sınıf/sınavla eşleşen mikro ders için örnek önerir',()=>{
  const grade=buildWrongQuestionSupport({
   subject:'Geometri',topic:'Üçgende İç Açılar',
   gradeLevel:'7. sınıf',educationGrade:7,
   bankReason:'BLANK',classificationConfidence:1
  });
  const incompatible=buildWrongQuestionSupport({
   subject:'Geometri',topic:'Üçgende İç Açılar',
   gradeLevel:'5. sınıf',educationGrade:5,
   bankReason:'BLANK',classificationConfidence:1
  });
  expect(grade.learningPlan.status).toBe('BLANK');
  expect(grade.learningPlan.contentStatus).toBe('GUIDED_IF_AVAILABLE');
  expect(incompatible.learningPlan.contentStatus).toBe('METHOD_ONLY');
 });
 it('kişisel soru için doğrulanmamış yanıt veya resmî kazanım uydurmaz',()=>{
  const support=buildWrongQuestionSupport({subject:'Mevzuat',topic:'Genel / Karma',bankReason:'BLANK'});
  expect(support.learningPlan.needsTopicConfirmation).toBe(true);
  expect(support.acquisition).toBeNull();
  expect(support.hasVerifiedExplanation).toBe(false);
  expect(support.learningPlan.method).toContain('güncellik');
  expect(PERSONAL_RECOVERY_DAYS).toEqual([0,1,3,7,14,28]);
 });
});
