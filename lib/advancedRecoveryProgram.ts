/**
 * Compact, auditable recovery protocols for secondary school, YKS graduates and
 * adult exam candidates. These are study-method suggestions, not generated
 * questions, diagnoses, official curriculum matches, or evidence of mastery.
 */
import type {RecoveryBand} from './levelAwareErrorRecovery';
import type {RemediationReason} from './wrongQuestionRemediation';
import {canonicalExamType} from './curriculumPolicy2026';

export type AdvancedRecoveryAudience='HIGH_910'|'HIGH_11'|'HIGH_12'|'GRADUATE_YKS'|'EXAM_CANDIDATE';
export type RecoveryMethod=
  'CONCEPT_REPAIR'|'PROCEDURE_CHECK'|'QUESTION_STEM'|'UNTIMED_TO_TIMED'|
  'DISTRACTOR_ANALYSIS'|'ACTIVE_RECALL'|'STRATEGY_MODEL'|'DIAGNOSTIC';
export type RecoveryStep={title:string;minutes:number;instruction:string};
export type AdvancedRecoveryProgram={
  audience:AdvancedRecoveryAudience;
  heading:string;
  examScope:string;
  method:RecoveryMethod;
  methodLabel:string;
  questionTarget:number;
  totalMinutes:number;
  steps:RecoveryStep[];
  diagnosticCheck:string;
  transferEvidenceRule:string;
  note:string;
};

const AUDIENCES=new Set<RecoveryBand>(['HIGH_910','HIGH_11','HIGH_12','GRADUATE_YKS','EXAM_CANDIDATE']);

const AUDIENCE_PROFILES:Record<AdvancedRecoveryAudience,{
  title:string;minutes:[number,number,number];questions:number;focus:string;
}>={
  HIGH_910:{title:'Lise 9–10 · Kavram temeli',minutes:[3,5,2],questions:3,
    focus:'Kavramın hangi koşullarda geçerli olduğunu örnek ve karşı-örnekle ayır.'},
  HIGH_11:{title:'Lise 11 · Alan becerisi',minutes:[3,6,3],questions:3,
    focus:'Alan alt becerisini doğrula; çözüm seçimini ve gerekçesini açıkla.'},
  HIGH_12:{title:'Lise 12 · Sınav transferi',minutes:[3,6,3],questions:4,
    focus:'TYT, AYT veya okul sınavı kapsamını karıştırmadan beceriyi yeniden uygula.'},
  GRADUATE_YKS:{title:'Mezun · YKS performans onarımı',minutes:[4,7,4],questions:4,
    focus:'Tekrar eden konu açığını kısa onar, sonra yeni soruda doğruluk ve süreyi ayrı değerlendir.'},
  EXAM_CANDIDATE:{title:'Yetişkin · Sınava özgü beceri',minutes:[4,7,4],questions:4,
    focus:'Sınav türünü ve alt alanı doğrula; ezber yerine gerekçe ve transfer becerisini ölç.'}
};

function safeSubject(subject:string){
 const s=subject.toLocaleLowerCase('tr-TR');
 if(/matematik|geometri|sayısal|fizik|kimya|problem/.test(s))return 'SAYISAL';
 if(/edebiyat|tarih|coğrafya|mevzuat|hukuk|din|eğitim|biyoloji/.test(s))return 'BILGI_YORUM';
 if(/türkçe|paragraf|dil|ingilizce|yabancı/.test(s))return 'DIL_METIN';
 return 'GENEL';
}

function methodFor(reason:RemediationReason|null,blank:boolean):RecoveryMethod{
 switch(reason){
  case 'BILGI_EKSIKLIGI':return 'CONCEPT_REPAIR';
  case 'ISLEM_HATASI':case 'DIKKAT':return 'PROCEDURE_CHECK';
  case 'SORU_KOKU':return 'QUESTION_STEM';
  case 'SURE':return 'UNTIMED_TO_TIMED';
  case 'KARARSIZLIK':return 'DISTRACTOR_ANALYSIS';
  case 'UNUTMA':return 'ACTIVE_RECALL';
  case 'YONTEM_BILMEME':return 'STRATEGY_MODEL';
  default:return blank?'DIAGNOSTIC':'DIAGNOSTIC';
 }
}
const METHOD_LABELS:Record<RecoveryMethod,string>={
 CONCEPT_REPAIR:'Kavram eksikliğini onar',
 PROCEDURE_CHECK:'Çözüm adımlarını denetle',
 QUESTION_STEM:'Soru kökünü ayrıştır',
 UNTIMED_TO_TIMED:'Süresiz çözümden süreli çözüme geç',
 DISTRACTOR_ANALYSIS:'Çeldirici ve gerekçeyi karşılaştır',
 ACTIVE_RECALL:'Notsuz hatırlama ve aralıklı sınama',
 STRATEGY_MODEL:'Çözüm stratejisini modelle',
 DIAGNOSTIC:'Zorlanmanın nedenini belirle'
};
const METHOD_STEPS:Record<RecoveryMethod,[string,string,string]>={
 CONCEPT_REPAIR:[
  'İlgili kavramı ve hangi koşulda kullanıldığını notlara bakmadan ifade et; boşluğu kaynakla kontrol et.',
  'Doğrulanmış farklı bir örneğin çözüm mantığını incele; benzer ve karşı-örneği ayır.',
  'Aynı alt beceride farklı, onaylı sorularda kurala bakmadan çöz; bilinmeyen noktayı not et.'
 ],
 PROCEDURE_CHECK:[
  'Yanlışın çıktığı çözüm adımını işaretle; işlem, birim, işaret ve soru kökü denetimini yap.',
  'Aynı işlemi farklı verilerle adım adım uygula; hız değil doğruluk ölç.',
  'Yeni bağımsız soruda yalnız sonuca değil çözüm adımlarına da bak; hata sürerse koça bildir.'
 ],
 QUESTION_STEM:[
  'Soru kökündeki olumsuzluğu, istisnayı ve istenen çıktıyı kendi cümlenle yaz.',
  'Metin/grafik/tablodaki kanıtla seçenekleri eşleştir; metinde olmayan yorumu çıkar.',
  'Yeni soruda önce kökü çözümle, sonra yanıtla; kök okuma hatasını ayrıca işaretle.'
 ],
 UNTIMED_TO_TIMED:[
  'Aynı alt beceride bir örneği süre tutmadan doğru çöz; yanlışsa süre baskısını neden sayma.',
  'Yeni ve onaylı soruları önce doğru çöz, sonra farklı soruda gerçek süreyi ölç.',
  'Doğruluk düşerse hız hedefini artırma; hata ve boş oranını süreyle birlikte kaydet.'
 ],
 DISTRACTOR_ANALYSIS:[
  'Kararsız kaldığın seçeneklerin her biri için kanıt veya kural belirt.',
  'Çeldiriciyi bozan tek ayırt edici bilgiyi bul; sezgiyle eleme yapma.',
  'Yeni soruda seçeneği gerekçelendir; emin değilsen bunu yanlış değil belirsizlik olarak kaydet.'
 ],
 ACTIVE_RECALL:[
  'Kavram, tarih, formül, yazar-eser veya kuralı notlara bakmadan hatırla.',
  'Unuttuğun kısmı güvenilir kaynakla düzelt; kendi kendine hatırlama kartı oluştur.',
  'Başka ve gecikmeli bir soruda hatırlamayı yeniden kontrol et; tek doğruya güvenme.'
 ],
 STRATEGY_MODEL:[
  'Verilen–istenen ayrımını yap ve hangi stratejinin uygun olduğunu açıkla.',
  'Uzman/koç örneğiyle yöntemi karşılaştır, uygulama sırasını kendi cümlenle yaz.',
  'Yöntemi yeni soruda desteksiz uygula; gerektiğinde farklı stratejiyle karşılaştır.'
 ],
 DIAGNOSTIC:[
  'Boş ya da yanlışın bilgi, süre, soru kökü, yöntem veya kararsızlık kaynaklı olup olmadığını ayırt et.',
  'Soru kökünü ve zorlanılan ilk adımı kontrol et; belirsizse koç veya öğretmenle netleştir.',
  'Neden belirlenmeden konu hâkimiyeti, puan artışı veya soru çözümü başarısı çıkarma.'
 ]
};

function scopeFor(audience:AdvancedRecoveryAudience,examType?:string|null,academicTrack?:string|null){
 const exam=canonicalExamType(examType);
 const track=(academicTrack||'').trim();
 if(audience==='HIGH_910')return 'Okul kazanımı / TYT temeli (sınıf doğrulaması gerekir)';
 if(audience==='HIGH_11')return track?('11. sınıf · '+track+' alanı'):'11. sınıf · okul/alan becerisi';
 if(audience==='HIGH_12')return exam&&['TYT','AYT','YDT','YKS'].includes(exam)
   ?exam+' odaklı hazırlık':'12. sınıf · TYT/AYT veya okul kapsamı doğrulanmalı';
 if(audience==='GRADUATE_YKS')return exam&&['TYT','AYT','YDT','YKS'].includes(exam)
   ?'Mezun · '+exam:'Mezun · YKS (TYT/AYT/YDT ayrımı doğrulanmalı)';
 return exam?'Yetişkin · '+exam+' kapsamı':'Yetişkin · sınav türü doğrulanmalı';
}

export function buildAdvancedRecoveryProgram(input:{
  band:RecoveryBand;reason?:RemediationReason|null;bankReason?:'WRONG'|'BLANK'|'MARKED';
  examType?:string|null;academicTrack?:string|null;subject?:string|null;topic?:string|null;
  consecutiveUnsuccessfulReviews?:number;
}):AdvancedRecoveryProgram|null{
 if(!AUDIENCES.has(input.band))return null;
 const audience=input.band as AdvancedRecoveryAudience;
 const profile=AUDIENCE_PROFILES[audience];
 const blank=input.bankReason==='BLANK';
 const method=methodFor(input.reason||null,blank);
 const skills=safeSubject(input.subject||'');
 const steps=METHOD_STEPS[method];
 const [diagnosisMinutes,practiceMinutes,checkMinutes]=profile.minutes;
 const topic=input.topic?.trim()||'Henüz doğrulanmamış alt konu';
 const recurrent=(input.consecutiveUnsuccessfulReviews||0)>=2;
 const diagnosticCheck=method==='UNTIMED_TO_TIMED'
  ?'Süresiz doğru çözüme ulaşabildim mi? Süreli yeni soruda doğruluk düştü mü?'
  :method==='DISTRACTOR_ANALYSIS'
  ?'İki olası cevabı ayıran somut kural veya metinsel kanıtı gösterebildim mi?'
  :method==='ACTIVE_RECALL'
  ?'Cevabı ipucu ve not olmadan hatırlayıp farklı bağlamda uygulayabildim mi?'
  :skills==='SAYISAL'
  ?'İşlem modelini, işaret/birim kontrolünü ve sonucun anlamını açıklayabildim mi?'
  :skills==='DIL_METIN'
  ?'Soru köküyle metin kanıtını eşleştirip çeldiriciyi gerekçeyle eleyebildim mi?'
  :'Kuralı hangi kanıtla uyguladığımı ve neden diğer seçenekleri elediğimi açıklayabildim mi?';
 return {
  audience,heading:profile.title,examScope:scopeFor(audience,input.examType,input.academicTrack),
  method,methodLabel:METHOD_LABELS[method],
  questionTarget:profile.questions,
  totalMinutes:profile.minutes.reduce((a,b)=>a+b,0),
  steps:[
   {title:'1 · Tanı ve hatayı düzelt',minutes:diagnosisMinutes,
    instruction:profile.focus+' '+steps[0]},
   {title:'2 · Farklı örnekle uygula',minutes:practiceMinutes,
    instruction:steps[1]},
   {title:'3 · Bağımsız kontrol',minutes:checkMinutes,
    instruction:steps[2]}
  ],
  diagnosticCheck,
  transferEvidenceRule:'Onaylı, daha önce görülmemiş farklı sorularda bağımsız çözüm ve daha sonraki günlerde ayrı ölçüm gerekir; aynı soru veya çözümlü örnek kalıcılık kanıtı değildir.',
  note:recurrent
   ?'Ardışık başarısızlık nedeniyle yeni soru yükünü artırmak yerine önce koçla çözüm stratejisini incele.'
   :'Bu kısa çalışma protokolüdür; hazır soru bulunduğunu, resmî kazanımı veya doğru yanıtı doğrulamaz.'
 };
}
