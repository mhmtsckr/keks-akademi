import {educationLevelKey,type EducationLevelKey,resolveEducationLevelProfile} from '@/lib/educationLevelProfile';

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

const DETAILED:Partial<Record<EducationLevelKey,CurriculumSubject[]>>={
  MIDDLE_7:[MIDDLE_7_MATH],
  MIDDLE_8:[MIDDLE_8_MATH]
};

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
  const detailed=DETAILED[key]||[];
  const byName=new Map(detailed.map(x=>[x.name,x]));
  const subjects=profile.subjects.map(subject=>byName.get(subject)||{name:subject,units:[fallbackUnit(subject,key)]});
  return {
    educationLevelKey:key,
    educationLevelLabel:profile.label,
    examType:curriculumExamTypeForLevel(key)||profile.examMode,
    framework:key==='MIDDLE_7'||key==='MIDDLE_8'?'TYMM':'EXAM',
    sourceLabel:key==='MIDDLE_7'||key==='MIDDLE_8'?'Türkiye Yüzyılı Maarif Modeli':'KEKS eğitim düzeyi / sınav haritası',
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
