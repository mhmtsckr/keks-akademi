import {educationLevelKey,type EducationLevelKey,resolveEducationLevelProfile} from '@/lib/educationLevelProfile';
import {EXAM_CATALOG} from '@/lib/examCatalog';
import {VERIFIED_GRADE7_TURKISH_THEMES} from '@/lib/verifiedGrade7TurkishThemes';
import {grade56ThemesFor} from '@/lib/verifiedGrade56Themes';
import {resolveLearningCurriculumContext} from '@/lib/curriculumPolicy2026';
import {VERIFIED_ADDITIONAL_TYMM_OUTCOMES} from '@/lib/verifiedAdditionalTymmOutcomes';
import {VERIFIED_GRADE10_GEOGRAPHY} from '@/lib/verifiedGrade10GeographyOutcomes';
import {VERIFIED_GRADE9_GEOGRAPHY} from '@/lib/verifiedGrade9GeographyOutcomes';
import {literatureThemesForGrade} from '@/lib/verifiedGrade911LiteratureThemes';
import {VERIFIED_TYMM_MATH_OUTCOMES} from '@/lib/verifiedTymmMathOutcomes2026';
import {VERIFIED_GRADE7_SCIENCE_OUTCOMES} from '@/lib/verifiedGrade7ScienceOutcomes';
import {VERIFIED_GRADE57_SOCIAL} from '@/lib/verifiedGrade57SocialOutcomes';
import {VERIFIED_GRADE8_12_LEGACY} from '@/lib/verifiedGrade812LegacyOutcomes';

export type CurriculumAcquisition={
  id:string;
  label:string;
  questionTypes:string[];
};

export type CurriculumSubTopic={
  name:string;
  acquisitions:CurriculumAcquisition[];
};

export type CurriculumTopic={
  name:string;
  subTopics:CurriculumSubTopic[];
};

export type CurriculumUnit={
  name:string;
  sourceUrl?:string;
  topics:CurriculumTopic[];
};

export type CurriculumSubject={
  name:string;
  units:CurriculumUnit[];
};

export type EducationCurriculum={
  educationLevelKey:EducationLevelKey;
  educationLevelLabel:string;
  examType:string;
  framework:'TYMM'|'EXAM';
  sourceLabel:string;
  subjects:CurriculumSubject[];
};

const q=(id:string,label:string,questionTypes:string[]):CurriculumAcquisition=>({id,label,questionTypes});

const MIDDLE_7_MATH:CurriculumSubject={
  name:'Matematik',
  units:[
    {
      name:'1. Tema: Sayılar ve Nicelikler (1)',
      sourceUrl:'https://tymm.meb.gov.tr/ortaokul-matematik-dersi/unite/463',
      topics:[{
        name:'Rasyonel Sayılar ve Rasyonel Sayılarla İşlemler',
        subTopics:[
          {
            name:'Rasyonel Sayıları Tanıma ve Temsil',
            acquisitions:[
              q('MAT.7.1.1','Rasyonel sayıları, farklı temsillerini, karşılaştırma ve sıralama ilişkilerini gerçek yaşam bağlamlarında yorumlar.',['Temsil dönüştürme','Karşılaştırma-sıralama','Sayı doğrusu','Açık uçlu yorum'])
            ]
          },
          {
            name:'Rasyonel Sayılarla İşlemler',
            acquisitions:[
              q('KEKS.MAT.7.1.1.ISLEM','Rasyonel sayılarla işlemleri problem durumlarında kullanır ve sonucu yorumlar.',['İşlem','Çok adımlı işlem','Gerçek yaşam problemi','Hata analizi'])
            ]
          }
        ]
      }]
    },
    {
      name:'1. Tema: Sayılar ve Nicelikler (2)',
      sourceUrl:'https://tymm.meb.gov.tr/ortaokul-matematik-dersi/unite/464',
      topics:[{
        name:'Oran ve Orantı',
        subTopics:[
          {
            name:'Oran',
            acquisitions:[
              q('MAT.7.1.5','Gerçek yaşam durumları üzerinden oran ilişkileri hakkında muhakeme yapar.',['Birim oran','Denk oran','Birimi olan oran','Birimsiz oran','Temsil yorumlama'])
            ]
          },
          {
            name:'Orantılı Durumlar',
            acquisitions:[
              q('MAT.7.1.6','Gerçek yaşam durumları üzerinden orantılı olan ve olmayan durumları yorumlar.',['Orantılı mı?','Tablo yorumlama','Grafik yorumlama','Orantı kurma'])
            ]
          },
          {
            name:'Doğru Orantılı Problem Çözme',
            acquisitions:[
              q('MAT.7.1.7','Gerçek yaşam durumları üzerinden doğru orantılı durumlara ilişkin problemleri çözer, farklı stratejiler geliştirir ve geneller.',['Problem çözme','Problem kurma','Yüzde problemi','Tablo-modelleme','Çift sayı doğrusu','Strateji karşılaştırma'])
            ]
          }
        ]
      }]
    },
    {
      name:'2. Tema: İşlemlerle Cebirsel Düşünme ve Değişimler',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/8',
      topics:[{
        name:'Cebirsel Düşünme',
        subTopics:[{
          name:'Cebirsel İfadeler ve Değişim',
          acquisitions:[
            q('KEKS.MAT.7.T2','Cebirsel ilişkileri farklı temsillerle açıklar ve problem durumlarında kullanır.',['Cebirsel ifade','Örüntü-genelleme','Denklem modelleme','Problem çözme'])
          ]
        }]
      }]
    },
    {
      name:'3. Tema: Dönüşüm',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/8',
      topics:[{
        name:'Geometrik Dönüşümler',
        subTopics:[{
          name:'Dönüşüm ve Temsil',
          acquisitions:[q('KEKS.MAT.7.T3','Geometrik dönüşümleri tanır, temsil eder ve ilişkilerini yorumlar.',['Dönüşüm tanıma','Şekil üzerinde uygulama','Koordinat/temsil','Muhakeme'])]
        }]
      }]
    },
    {
      name:'4. Tema: Geometrik Nicelikler',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/8',
      topics:[{
        name:'Geometrik Ölçme',
        subTopics:[{
          name:'Uzunluk, Alan ve Hacim İlişkileri',
          acquisitions:[q('KEKS.MAT.7.T4','Geometrik nicelikler arasındaki ilişkileri problem durumlarında kullanır.',['Alan problemi','Çevre problemi','Hacim problemi','Birim dönüşümü'])]
        }]
      }]
    },
    {
      name:'5. Tema: Geometrik Şekiller',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/8',
      topics:[{
        name:'Geometrik Şekiller ve Özellikleri',
        subTopics:[{
          name:'Şekil Özellikleri',
          acquisitions:[q('KEKS.MAT.7.T5','Geometrik şekillerin özelliklerini analiz eder ve ilişkileri gerekçelendirir.',['Özellik belirleme','Açı ilişkisi','Çizim-inşa','Gerekçelendirme'])]
        }]
      }]
    },
    {
      name:'6. Tema: İstatistiksel Araştırma Süreci',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/8',
      topics:[{
        name:'İstatistiksel Araştırma',
        subTopics:[{
          name:'Veri Toplama, Temsil ve Yorum',
          acquisitions:[q('KEKS.MAT.7.T6','İstatistiksel araştırma sürecini yürütür, verileri temsil eder ve sonuçları yorumlar.',['Veri toplama','Tablo-grafik','Merkezî eğilim','Yorumlama'])]
        }]
      }]
    },
    {
      name:'7. Tema: Veriden Olasılığa',
      sourceUrl:'https://tymm.meb.gov.tr/ortaokul-matematik-dersi/unite/471',
      topics:[{
        name:'Teorik Olasılık',
        subTopics:[{
          name:'Olay ve Olasılık',
          acquisitions:[q('KEKS.MAT.7.T7','Olayların teorik olasılıklarını örnek uzay üzerinden yorumlar.',['Örnek uzay','Olay olasılığı','Tümleyen olay','Ayrık olay','Açık uçlu olasılık'])]
        }]
      }]
    }
  ]
};

const MIDDLE_8_MATH:CurriculumSubject={
  name:'Matematik',
  units:[
    {
      name:'1. Tema: Sayılar ve Nicelikler',
      sourceUrl:'https://tymm.meb.gov.tr/ortaokul-matematik-dersi/unite/472',
      topics:[{
        name:'Gerçek Sayılar',
        subTopics:[
          {
            name:'Üslü İfadeler',
            acquisitions:[
              q('MAT.8.1.1','Farklı bağlamlardaki üslü ifadelere, özelliklerine ve işlemlerine ilişkin çıkarım yapar.',['Üslü ifade işlemi','Özellik çıkarımı','Gerçek yaşam problemi','Bilimsel bağlam'])
            ]
          },
          {
            name:'Kareköklü İfadeler',
            acquisitions:[
              q('MAT.8.1.2','Problem durumlarında kareköklü ifadeler ile ilgili muhakeme yapar.',['Tam kare-karekök','Yaklaşık değer','Sayı doğrusu','Alan-kök ilişkisi'])
            ]
          },
          {
            name:'İrrasyonel Sayılar',
            acquisitions:[
              q('MAT.8.1.3','Sayıların rasyonel ya da irrasyonel olduğunu ölçütlere göre değerlendirir.',['Rasyonel-irrasyonel ayırma','Ondalık gösterim','Gerekçelendirme'])
            ]
          },
          {
            name:'Gerçek Sayılar ve Sayı Aralıkları',
            acquisitions:[
              q('MAT.8.1.4','Gerçek sayıları ve aralıklarını sayı doğrusunda yorumlar.',['Sayı doğrusu','Aralık gösterimi','Sayı kümeleri ilişkisi'])
            ]
          }
        ]
      }]
    },
    {
      name:'2. Tema: Cebirsel Düşünme ve Değişimler',
      sourceUrl:'https://tymm.meb.gov.tr/ortaokul-matematik-dersi/unite/473',
      topics:[{
        name:'Doğrusal Fonksiyonlar',
        subTopics:[
          {
            name:'Dik Koordinat Sistemi',
            acquisitions:[q('MAT.8.2.1','Gerçek yaşam durumları üzerinden dik koordinat sistemini çözümler.',['Koordinat belirleme','Sıralı ikili','Bölge-ekseni yorumlama'])]
          },
          {
            name:'Doğrusal İlişkiden Doğrusal Fonksiyonlara',
            acquisitions:[q('MAT.8.2.2','Gerçek yaşam durumlarındaki doğrusal ilişkileri doğrusal fonksiyonlarla temsil eder.',['Tablo temsili','Grafik temsili','Cebirsel temsil','Temsiller arası geçiş','Modelleme'])]
          },
          {
            name:'Doğrusal Fonksiyonların Grafikleri',
            acquisitions:[q('MAT.8.2.3','İki doğrusal fonksiyonun birbirine göre durumuna ilişkin çıkarım yapar.',['Eğim','Paralellik','Kesişim','Dik doğrular','Grafik karşılaştırma'])]
          },
          {
            name:'Doğrusal Fonksiyonlar ve Algoritma',
            acquisitions:[q('MAT.8.2.4','Doğrusal fonksiyon problemlerinin çözümünü algoritma ifade yöntemleriyle yapılandırır.',['Problem çözme','Algoritma kurma','Adım sıralama','Model doğrulama'])]
          }
        ]
      }]
    },
    {
      name:'3. Tema: Geometrik Şekiller',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/9',
      topics:[{name:'Geometrik Şekiller',subTopics:[{name:'Şekil İlişkileri',acquisitions:[q('KEKS.MAT.8.T3','Geometrik şekillerin özelliklerini analiz eder ve ilişkileri gerekçelendirir.',['Şekil analizi','Açı-kenar ilişkisi','İnşa','Gerekçelendirme'])]}]}]
    },
    {
      name:'4. Tema: Geometrik Nicelikler',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/9',
      topics:[{name:'Geometrik Nicelikler',subTopics:[{name:'Ölçme ve Problem Çözme',acquisitions:[q('KEKS.MAT.8.T4','Geometrik nicelikleri ölçme ve problem çözme bağlamında kullanır.',['Alan-hacim','Birim ilişkisi','Problem çözme','Modelleme'])]}]}]
    },
    {
      name:'5. Tema: Dönüşüm',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/9',
      topics:[{name:'Geometrik Dönüşümler',subTopics:[{name:'Dönüşüm ve Koordinat',acquisitions:[q('KEKS.MAT.8.T5','Geometrik dönüşümleri temsil eder ve dönüşüm altındaki değişmezlikleri yorumlar.',['Dönüşüm','Koordinat','Şekil karşılaştırma','Muhakeme'])]}]}]
    },
    {
      name:'6. Tema: İstatistiksel Araştırma Süreci',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/9',
      topics:[{name:'İstatistiksel Araştırma',subTopics:[{name:'Veri ve Çıkarım',acquisitions:[q('KEKS.MAT.8.T6','İstatistiksel araştırma sürecini yürütür, verileri analiz eder ve çıkarım yapar.',['Veri toplama','Grafik-tablosu','Dağılım yorumlama','Çıkarım'])]}]}]
    },
    {
      name:'7. Tema: Veriden Olasılığa',
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/9',
      topics:[{name:'Olasılık',subTopics:[{name:'Olasılıksal Muhakeme',acquisitions:[q('KEKS.MAT.8.T7','Olasılık durumlarını örnek uzay ve veri üzerinden analiz eder.',['Örnek uzay','Olasılık hesabı','Karşılaştırma','Yorumlama'])]}]}]
    }
  ]
};

// MIDDLE_8_MATH is retained as a historical/provisional model draft, NOT the
// current 2026-27 8th grade official curriculum. Do not surface it as TYMM.
void MIDDLE_8_MATH;
const VERIFIED_GRADE7_TURKISH_SUBJECT:CurriculumSubject={
  name:'Türkçe',
  units:VERIFIED_GRADE7_TURKISH_THEMES.map(theme=>({
    name:theme.theme,
    sourceUrl:theme.sourceUrl,
    topics:[{
      name:theme.themeName,
      subTopics:[{
        name:theme.skill,
        acquisitions:[q(
          theme.outcomeCode||theme.id,
          theme.outcomeCode
            ?theme.skill+' (MEB kodu resmî kaynakta doğrulandı; KEKS soru uyumu onay bekliyor)'
            :theme.skill+' (tema düzeyinde doğrulandı; kesin resmî kazanım kodu belirlenmedi)',
          ['Çoktan seçmeli','Açık uçlu','Metin çözümleme','Gerekçelendirme']
        )]
      }]
    }]
  }))
};
const DETAILED:Partial<Record<EducationLevelKey,CurriculumSubject[]>>={
  MIDDLE_7:[MIDDLE_7_MATH,VERIFIED_GRADE7_TURKISH_SUBJECT]
};

function legacySourceCheckedSubject(grade:8|12,subject:string):CurriculumSubject|null{
 const verified=VERIFIED_GRADE8_12_LEGACY.filter(x=>x.grade===grade&&x.subject===subject);
 if(!verified.length)return null;
 const known:CurriculumUnit={
  name:grade===8
   ?'8. sınıf · 2019 Türkçe programından doğrulanmış seçili kazanımlar (LGS)'
   :'12. sınıf · 2018 TDE programından doğrulanmış seçili kazanımlar (AYT)',
  sourceUrl:verified[0].sourceUrl,
  topics:verified.map(outcome=>({
   name:outcome.title,
   subTopics:[{
    name:outcome.scope,
    acquisitions:[q(outcome.code,
      outcome.scope+' (resmî önceki MEB programı kodu; KEKS pilot soruları uzman incelemesi bekliyor)',
      grade===8?['LGS dört seçenekli beceri sorusu','Gerekçeli açık uçlu cevap']:
      ['AYT beş seçenekli soru','Edebî metin analizi','Gerekçeli açık uçlu yorum'])]
   }]
  }))
 };
 const existing=grade===8?lgsLegacySubject(subject):null;
 return {name:subject,units:[known,...(existing?.units||[])]};
}

function grade7ScienceOfficialIndex():CurriculumSubject{
 return {
  name:'Fen Bilimleri',
  units:VERIFIED_GRADE7_SCIENCE_OUTCOMES.map(outcome=>({
   name:outcome.unit+'. Ünite: '+outcome.title+' (seçilmiş bir resmî çıktı; tam kapsam değil)',
   sourceUrl:outcome.url,
   topics:[{name:outcome.title,subTopics:[{
    name:outcome.skill,
    acquisitions:[q(outcome.code,outcome.skill+
      ' (MEB TYMM kodu doğrulandı; pilot KEKS soruları yalnız bir beceriyi örnekler, öğretmen incelemesi bekliyor)',
      ['Çoktan seçmeli','Gerekçelendirme','Model/performans görevi'])]
   }]}]
  }))
 };
}

function lgsLegacySubject(subject:string):CurriculumSubject|null{
  const key=subject==='T.C. İnkılap Tarihi ve Atatürkçülük'
    ?'T.C. İnkılap Tarihi'
    :subject==='Din Kültürü ve Ahlak Bilgisi'?'Din Kültürü':subject;
  const topics=(EXAM_CATALOG.LGS as unknown as Record<string,readonly string[]>)[key];
  if(!topics)return null;
  return {
    name:subject,
    units:[{
      name:'8. Sınıf · LGS hazırlık konu dizini (KEKS, resmî kazanım doğrulaması bekliyor)',
      topics:topics.map((topic,index)=>({
        name:topic,
        subTopics:[{
          name:'Konu genel becerileri',
          acquisitions:[q('KEKS.LGS8.'+key+'.'+(index+1),
            topic+' için beceri ve kazanım doğrulaması bekliyor.',
            ['Beceri temelli soru','Yorumlama','Muhakeme'])]
        }]
      }))
    }]
  };
}

function grade56OfficialIndex(grade:number,subject:string):CurriculumSubject|null{
  if(![5,6].includes(grade)||!['Türkçe','Fen Bilimleri'].includes(subject))return null;
  return {
    name:subject,
    units:grade56ThemesFor(grade,subject).map(theme=>{
      const additional=VERIFIED_ADDITIONAL_TYMM_OUTCOMES.filter(x=>
        x.grade===grade&&x.subject===subject&&x.url.endsWith('/unite/'+(
          grade===5&&theme.ordinal===3?'388':grade===6&&theme.ordinal===4?'412':'NO_MATCH'
        )));
      const outcomes=additional.map(x=>
        q(x.code,x.skill+' (MEB kodu doğrulandı, KEKS pilot soruları uzman incelemesi bekliyor)',
          ['Çoktan seçmeli','Gerekçelendirme','Model/deney görevi']));
      const provisional=theme.skill
        ?[q(theme.outcomeCode||theme.id,
            theme.skill+(theme.outcomeCode?' (resmî çıktı kodu doğrulandı)':' (tema kapsamı doğrulandı, çıktı kodu bekliyor)'),
            ['Çoktan seçmeli','Gerekçelendirme','Süreç değerlendirme'])]
        :[];
      const hasKnown=outcomes.length>0||provisional.length>0;
      return {
        name:theme.ordinal+'. '+(theme.type==='TEMA'?'Tema: ':'Ünite: ')+theme.title,
        sourceUrl:additional[0]?.url||theme.sourceUrl,
        topics:[{
          name:theme.title,
          subTopics:[{
            name:theme.skill||additional[0]?.skill||'Beceri/çıktı eşleştirmesi henüz doğrulanmadı',
            acquisitions:hasKnown?[...provisional,...outcomes]:
              [q(theme.id,'Bu program başlığının resmî öğrenme çıktıları ayrıca eşleştirilmelidir.',['Onaylı soru türü henüz girilmedi'])]
          }]
        }]
      };
    })
  };
}

function grade911TdeOfficialIndex(grade:number,subject:string):CurriculumSubject|null{
 if(subject!=='Türk Dili ve Edebiyatı'||![9,10,11].includes(grade))return null;
 const entries=literatureThemesForGrade(grade);
 if(entries.length!==4)return null;
 return {
  name:subject,
  units:entries.map((theme,i)=>({
    name:(i+1)+'. Tema: '+theme.theme,
    sourceUrl:theme.sourceUrl,
    topics:[{
      name:theme.theme,
      subTopics:[{
        name:theme.skill||'Bire bir öğrenme çıktısı eşleştirmesi henüz yapılmadı',
        acquisitions:[q(
          theme.outcomeCode?theme.id:theme.id+'.INDEX_ONLY',
          theme.outcomeCode
            ?theme.skill+' (resmî MEB '+theme.outcomeCode+' kodu, tema bağlamına bağlı; içerik onayı bekliyor)'
            :'Resmî tema başlığı doğrulandı. Bu kayıtta öğrenme çıktısı kodu ve soru kanıtı henüz bulunmuyor.',
          theme.outcomeCode
            ?['Özgün kısa alıştırma','Metin tahlili','Açık uçlu açıklama','Yazma/konuşma performansı']
            :['Doğrulanmış soru türü henüz yok']
        )]
      }]
    }]
  }))
 };
}

function grade911OfficialIndex(grade:number,subject:string):CurriculumSubject|null{
  if(![9,10,11].includes(grade))return null;
  const known=[...VERIFIED_ADDITIONAL_TYMM_OUTCOMES,...VERIFIED_GRADE10_GEOGRAPHY,...VERIFIED_GRADE9_GEOGRAPHY,...VERIFIED_TYMM_MATH_OUTCOMES].filter(x=>x.grade===grade&&x.subject===subject);
  if(!known.length)return null;
  const grouped=new Map<string,typeof known>();
  for(const x of known){
    const prev=grouped.get(x.theme)||[];
    grouped.set(x.theme,[...prev,x]);
  }
  return {
    name:subject,
    units:[...grouped.entries()].map(([name,outcomes])=>({
      name:name+' (doğrulanan öğrenme çıktısı örnekleri — ünite tam indeks değildir)',
      sourceUrl:outcomes[0].url,
      topics:[{
        name:name,
        subTopics:[{
          name:'Kaynakla doğrulanmış dar beceriler',
          acquisitions:outcomes.map(x=>q(x.code,x.skill+' (resmî MEB çıktı kodu; içerik onayı bekliyor)',
            ['Çoktan seçmeli','Açık uçlu','Model/deney görevi']))
        }]
      }]
    }))
  };
}

function grade57SocialIndex(grade:number,subject:string):CurriculumSubject|null{
 if(![5,6,7].includes(grade)||subject!=='Sosyal Bilgiler')return null;
 const known=VERIFIED_GRADE57_SOCIAL.filter(x=>x.grade===grade);
 const themes=[...new Set(known.map(x=>x.theme))];
 return {name:subject,units:themes.map(theme=>{
  const outcomes=known.filter(x=>x.theme===theme);
  return {name:'Kaynaklı öğrenme alanı: '+theme+' (tam çıktı listesi değildir)',
   sourceUrl:outcomes[0].url,
   topics:[{name:theme,subTopics:[{name:'MEB tarafından doğrulanmış dar öğrenme çıktıları',
    acquisitions:outcomes.map(x=>q(x.code,x.skill+' (resmî kaynak doğrulandı; KEKS pilot soru kalite onayı bekliyor)',
       ['Çoktan seçmeli','Metne dayalı yorum','Gerekçelendirme','Performans görevi']))}]}]};
 })};
}

function fallbackUnit(subject:string,level:EducationLevelKey):CurriculumUnit{
  return {
    name:'Düzey Müfredat Haritası',
    topics:[{
      name:subject+' · Düzey Geneli',
      subTopics:[{
        name:'Genel Kazanım Alanı',
        acquisitions:[q(level+'|'+subject,'Bu dersin seçilen eğitim düzeyindeki kazanım alanlarını uygular.',['Kazanım temelli','Beceri temelli','Açık uçlu','Yorumlama'])]
      }]
    }]
  };
}

export function curriculumExamTypeForLevel(level:EducationLevelKey|null){
  if(level==='PRIMARY_123')return 'ILKOKUL_1_2_3';
  if(level==='PRIMARY_4')return 'ILKOKUL_4';
  if(level==='MIDDLE_56')return 'ORTAOKUL_5_6';
  if(level==='MIDDLE_7')return 'ORTAOKUL_7';
  if(level==='MIDDLE_8')return 'ORTAOKUL_8';
  if(level==='HIGH_910')return 'LISE_9_10';
  if(level==='HIGH_11')return 'LISE_11';
  if(level==='HIGH_12')return 'LISE_12';
  if(level==='GRADUATE_YKS')return 'YKS_MEZUN';
  return null;
}

export function getEducationCurriculum(gradeLevel?:string|null,academicTrack?:string|null):EducationCurriculum|null{
  const key=educationLevelKey(gradeLevel);
  const profile=resolveEducationLevelProfile(gradeLevel,academicTrack);
  if(!key||!profile)return null;
  const exactGrade=resolveLearningCurriculumContext({gradeLevel}).grade;
  const detailed=DETAILED[key]||[];
  const byName=new Map(detailed.map(x=>[x.name,x]));
  const subjects=profile.subjects.map(subject=>(exactGrade===8||exactGrade===12?legacySourceCheckedSubject(exactGrade,subject):null)||(exactGrade&&[5,6,7].includes(exactGrade)?grade57SocialIndex(exactGrade,subject):null)||(key==='MIDDLE_7'&&subject==='Fen Bilimleri'&&exactGrade===7?grade7ScienceOfficialIndex():null)||(key==='MIDDLE_56'&&exactGrade?grade56OfficialIndex(exactGrade,subject):null)||(exactGrade&&[9,10,11].includes(exactGrade)?grade911TdeOfficialIndex(exactGrade,subject):null)||(exactGrade&&[9,10,11].includes(exactGrade)?grade911OfficialIndex(exactGrade,subject):null)||byName.get(subject)||(key==='MIDDLE_8'?lgsLegacySubject(subject):null)||{name:subject,units:[fallbackUnit(subject,key)]});
  return {
    educationLevelKey:key,
    educationLevelLabel:profile.label,
    examType:curriculumExamTypeForLevel(key)||profile.examMode,
    framework:['PRIMARY_123','MIDDLE_56','MIDDLE_7','HIGH_910','HIGH_11'].includes(key)?'TYMM':'EXAM',
    sourceLabel:key==='MIDDLE_8'
      ?'2026–2027: Önceki MEB Türkçe programından 8. sınıf seçili kazanımlar doğrulandı; diğer LGS konuları henüz resmî kodla eşleşmedi'
      :['PRIMARY_123','MIDDLE_56','MIDDLE_7','HIGH_910','HIGH_11'].includes(key)
        ?'2026–2027 Türkiye Yüzyılı Maarif Modeli (mevcut KEKS kazanım kapsaması sınırlıdır)'
        :'KEKS önceki MEB / sınav konu haritası (resmî kazanım eşleştirmesi doğrulanmalıdır)',
    subjects
  };
}

export function curriculumSubject(curriculum:EducationCurriculum|null,subject:string){
  return curriculum?.subjects.find(x=>x.name===subject)||null;
}

export function curriculumTopicOptions(curriculum:EducationCurriculum|null,subject:string){
  const found=curriculumSubject(curriculum,subject);
  if(!found)return [];
  return found.units.flatMap(unit=>unit.topics.map(topic=>({unit:unit.name,topic:topic.name,sourceUrl:unit.sourceUrl||null})));
}

export function findCurriculumPath(input:{
  curriculum:EducationCurriculum|null;
  subject:string;
  unit?:string|null;
  topic?:string|null;
  subTopic?:string|null;
  acquisition?:string|null;
  questionType?:string|null;
}){
  const subject=curriculumSubject(input.curriculum,input.subject);
  if(!subject)return null;
  const unit=subject.units.find(x=>x.name===input.unit)
    ||subject.units.find(x=>x.topics.some(t=>t.name===input.topic))
    ||subject.units[0];
  const topic=unit?.topics.find(x=>x.name===input.topic)||unit?.topics[0];
  const subTopic=topic?.subTopics.find(x=>x.name===input.subTopic)||topic?.subTopics[0];
  const acquisition=subTopic?.acquisitions.find(x=>x.id===input.acquisition||x.label===input.acquisition)||subTopic?.acquisitions[0];
  const questionType=acquisition?.questionTypes.find(x=>x===input.questionType)||input.questionType||acquisition?.questionTypes[0];
  if(!unit||!topic||!subTopic||!acquisition||!questionType)return null;
  return {
    unit:unit.name,
    topic:topic.name,
    subTopic:subTopic.name,
    acquisition:acquisition.label,
    acquisitionId:acquisition.id,
    questionType,
    sourceUrl:unit.sourceUrl||null
  };
}

export function publicEducationCurriculum(gradeLevel?:string|null,academicTrack?:string|null){
  return getEducationCurriculum(gradeLevel,academicTrack);
}
