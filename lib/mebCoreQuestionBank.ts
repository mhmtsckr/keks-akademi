import { db } from '@/lib/db';

type CoreItem={
  examType:string;
  subject:string;
  topic:string;
  prompt:string;
  options:Record<string,string>;
  correctAnswer:string;
  explanation:string;
  officialSourceUrl:string;
};

const Y=2026;

export const MEB_CORE_ITEMS:CoreItem[]=[
  {
    examType:'ILKOKUL_1_2',subject:'Matematik',topic:'Sayılar ve Nicelikler',
    prompt:'Sayıları yazmak için kullandığımız işaretlere ne ad verilir?',
    options:{A:'Rakam',B:'Örüntü',C:'Nicelik',D:'İşlem'},correctAnswer:'A',
    explanation:'Rakamlar sayıları yazmak için kullanılan sembollerdir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ilkokul-matematik-dersi/unite/45'
  },
  {
    examType:'ILKOKUL_1_2',subject:'Matematik',topic:'Sayılar ve Nicelikler',
    prompt:'İki nesne grubundan hangisinin daha fazla olduğunu belirlemek hangi beceriyle ilgilidir?',
    options:{A:'Karşılaştırma',B:'Boyama',C:'Ezberleme',D:'Yazma'},correctAnswer:'A',
    explanation:'Niceliklerin büyüklüklerini karşılaştırmak sayılar ve nicelikler temasının temel becerilerindendir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ilkokul-matematik-dersi/unite/45'
  },
  {
    examType:'ILKOKUL_1_2',subject:'Matematik',topic:'Sayılar ve Nicelikler',
    prompt:'Belirli bir kurala göre devam eden sayı veya şekil dizisine ne denir?',
    options:{A:'Örüntü',B:'Cümle',C:'Karışım',D:'Harita'},correctAnswer:'A',
    explanation:'Örüntü, belirli bir kurala göre devam eden sayı veya şekil düzenidir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ilkokul-matematik-dersi/unite/45'
  },
  {
    examType:'ILKOKUL_1_2',subject:'Matematik',topic:'Sayılar ve Nicelikler',
    prompt:'Bir grupta kaç nesne bulunduğunu anlatan büyüklük hangi kavramla ilişkilidir?',
    options:{A:'Nicelik',B:'Renk',C:'Ses',D:'Yön'},correctAnswer:'A',
    explanation:'Nicelik, sayılabilen ya da ölçülebilen büyüklüğü ifade eder.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ilkokul-matematik-dersi/unite/45'
  },

  {
    examType:'ILKOKUL_3_4',subject:'Fen Bilimleri',topic:'Maddeyi Tanıyalım, Karıştırıp Ayıralım',
    prompt:'Maddeler temel olarak hangi üç hâlde sınıflandırılır?',
    options:{A:'Katı-sıvı-gaz',B:'Büyük-küçük-orta',C:'Sıcak-soğuk-ılık',D:'Canlı-cansız-karışık'},correctAnswer:'A',
    explanation:'Bu ünitede maddeler katı, sıvı ve gaz hâllerine göre sınıflandırılır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/334'
  },
  {
    examType:'ILKOKUL_3_4',subject:'Fen Bilimleri',topic:'Maddeyi Tanıyalım, Karıştırıp Ayıralım',
    prompt:'Birden fazla maddenin bir araya gelmesiyle oluşan yapıya ne denir?',
    options:{A:'Karışım',B:'Fosil',C:'Kayaç',D:'Elektrik'},correctAnswer:'A',
    explanation:'Karışım, birden fazla maddenin özelliklerini tamamen kaybetmeden bir araya gelmesiyle oluşur.',
    officialSourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/334'
  },
  {
    examType:'ILKOKUL_3_4',subject:'Fen Bilimleri',topic:'Maddeyi Tanıyalım, Karıştırıp Ayıralım',
    prompt:'Karışımdaki farklı maddeleri yeniden birbirinden ayırmaya ne denir?',
    options:{A:'Karışımı ayırma',B:'Sayma',C:'Ölçme',D:'Canlandırma'},correctAnswer:'A',
    explanation:'Ünitede karışımların uygun yöntemlerle ayrılması üzerinde durulur.',
    officialSourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/334'
  },
  {
    examType:'ILKOKUL_3_4',subject:'Fen Bilimleri',topic:'Yer Bilimciler İş Başında',
    prompt:'Geçmişte yaşamış canlıların iz veya kalıntılarına ne denir?',
    options:{A:'Fosil',B:'Mineral',C:'Karışım',D:'Buhar'},correctAnswer:'A',
    explanation:'Fosiller geçmişte yaşamış canlılara ilişkin iz veya kalıntılardır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/454'
  },
  {
    examType:'ILKOKUL_3_4',subject:'Fen Bilimleri',topic:'Yer Bilimciler İş Başında',
    prompt:'Kayaçların yapısında bulunabilen doğal maddelerden biri hangisidir?',
    options:{A:'Mineral',B:'Cümle',C:'Paragraf',D:'Ritim'},correctAnswer:'A',
    explanation:'Kayaçlar ve mineraller arasında ilişki kurmak bu ünitenin temel kavramlarındandır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/454'
  },

  {
    examType:'ORTAOKUL_5_6',subject:'Türkçe',topic:'Oyun Dünyası',
    prompt:'Bir metnin konusunu ve önemli noktalarını belirlemeye yardım eden sözcüklere ne denir?',
    options:{A:'Anahtar kelime',B:'Rakam',C:'Formül',D:'Harita'},correctAnswer:'A',
    explanation:'Anahtar kelimeleri belirleme 5. sınıf Oyun Dünyası temasında vurgulanan anlama becerilerindendir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/54'
  },
  {
    examType:'ORTAOKUL_5_6',subject:'Türkçe',topic:'Oyun Dünyası',
    prompt:'Metinde doğrudan ifade edilen, çıkarım gerektirmeyen anlam hangi kavramla ilişkilidir?',
    options:{A:'Yüzey anlam',B:'Sembol',C:'İmge',D:'Ritim'},correctAnswer:'A',
    explanation:'Yüzey anlamı belirleme bu temadaki temel okuma becerilerinden biridir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/54'
  },
  {
    examType:'ORTAOKUL_5_6',subject:'Türkçe',topic:'Oyun Dünyası',
    prompt:'Bir metni okumadan veya okurken eldeki ipuçlarından hareketle sonuç öngörmeye ne denir?',
    options:{A:'Tahmin',B:'Ölçme',C:'Sınıflandırma',D:'Çarpma'},correctAnswer:'A',
    explanation:'Tahmin edebilme, Oyun Dünyası temasındaki temel anlama süreçlerindendir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/54'
  },
  {
    examType:'ORTAOKUL_5_6',subject:'Türkçe',topic:'Oyun Dünyası',
    prompt:'Bir öğrencinin bildiği ve anlamını kullanabildiği kelimelerin bütünü hangi kavramla ifade edilir?',
    options:{A:'Söz varlığı',B:'Periyodik tablo',C:'Örüntü',D:'Nicelik'},correctAnswer:'A',
    explanation:'Söz varlığını geliştirme ve kullanma temada açıkça hedeflenen dil becerilerindendir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/54'
  },
  {
    examType:'ORTAOKUL_5_6',subject:'Matematik',topic:'Sayılar ve Nicelikler',
    prompt:'Bir sayının büyüklüğünü başka bir sayıyla ilişkilendirerek incelemek hangi matematiksel süreçtir?',
    options:{A:'Karşılaştırma',B:'Betimleme',C:'Canlandırma',D:'Dinleme'},correctAnswer:'A',
    explanation:'Sayılar ve nicelikler temasında sayısal büyüklükleri anlamlandırma ve karşılaştırma önemlidir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/6'
  },
  {
    examType:'ORTAOKUL_5_6',subject:'Matematik',topic:'Sayılar ve Nicelikler',
    prompt:'Bir büyüklüğün sayı ile ifade edilen miktarı hangi kavramla ilişkilidir?',
    options:{A:'Nicelik',B:'İmge',C:'Üslup',D:'Solunum'},correctAnswer:'A',
    explanation:'Nicelik kavramı sayıların ölçülen veya sayılan büyüklüklerle ilişkisini kurar.',
    officialSourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/ortaokul-matematik-dersi/6'
  },

  {
    examType:'ORTAOKUL_7_8',subject:'Fen Bilimleri',topic:'Sürdürülebilir Yaşam ve Madde Döngüleri',
    prompt:'Bitkilerin ışık enerjisinden yararlanarak besin üretme sürecine ne denir?',
    options:{A:'Fotosentez',B:'Solunum',C:'Erozyon',D:'Buharlaşma'},correctAnswer:'A',
    explanation:'Fotosentez ve fotosentez hızına etki eden faktörler 8. sınıf ünitesinin temel kavramlarındandır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/441'
  },
  {
    examType:'ORTAOKUL_7_8',subject:'Fen Bilimleri',topic:'Sürdürülebilir Yaşam ve Madde Döngüleri',
    prompt:'Canlıların enerji elde etmesiyle ilişkili temel yaşamsal süreç hangisidir?',
    options:{A:'Solunum',B:'Yazım',C:'Örüntü',D:'Karşılaştırma'},correctAnswer:'A',
    explanation:'Canlılarda solunum bu ünitenin temel içeriklerinden biridir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/441'
  },
  {
    examType:'ORTAOKUL_7_8',subject:'Fen Bilimleri',topic:'Sürdürülebilir Yaşam ve Madde Döngüleri',
    prompt:'Karbon ve su gibi maddelerin doğadaki canlı ve cansız ortamlar arasında dolaşmasına ne denir?',
    options:{A:'Madde döngüsü',B:'Söz varlığı',C:'Rakam',D:'Sembol'},correctAnswer:'A',
    explanation:'Madde döngülerinin yaşam açısından önemi ünitenin ana konularındandır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/441'
  },
  {
    examType:'ORTAOKUL_7_8',subject:'Fen Bilimleri',topic:'Sürdürülebilir Yaşam ve Madde Döngüleri',
    prompt:'Uzun dönem sıcaklık ve yağış düzenlerinde küresel ölçekte görülen değişim hangi kavramla ilişkilidir?',
    options:{A:'İklim değişikliği',B:'Sözcük türü',C:'Ritim',D:'Nicelik'},correctAnswer:'A',
    explanation:'Küresel iklim değişikliğinin nedenleri, sonuçları ve çözüm önerileri ünitede ele alınır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/441'
  },

  {
    examType:'LISE_9_10',subject:'Türk Dili ve Edebiyatı',topic:'Sözün İnceliği',
    prompt:'Bir kavramın zihinde oluşturduğu tasarı veya görüntü edebiyatta hangi kavramla ilişkilidir?',
    options:{A:'İmge',B:'Rakam',C:'Atom',D:'Nicelik'},correctAnswer:'A',
    explanation:'İmge, 9. sınıf Sözün İnceliği temasında ele alınan temel edebiyat kavramlarındandır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/76'
  },
  {
    examType:'LISE_9_10',subject:'Türk Dili ve Edebiyatı',topic:'Sözün İnceliği',
    prompt:'Bir duygu, düşünce veya kavramı başka bir gösterge aracılığıyla temsil eden öge hangisidir?',
    options:{A:'Sembol',B:'Elektron',C:'Mineral',D:'Fosil'},correctAnswer:'A',
    explanation:'Sembol, edebî söyleyişin anlam katmanlarını oluşturan temel kavramlardan biridir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/76'
  },
  {
    examType:'LISE_9_10',subject:'Türk Dili ve Edebiyatı',topic:'Sözün İnceliği',
    prompt:'Bir sözün veya durumun zihinde başka anlam ve düşünceler uyandırmasına ne denir?',
    options:{A:'Çağrışım',B:'Solunum',C:'Periyot',D:'Nicelik'},correctAnswer:'A',
    explanation:'Çağrışım, Sözün İnceliği temasında estetik ve anlam oluşturma açısından önemlidir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/76'
  },
  {
    examType:'LISE_9_10',subject:'Türk Dili ve Edebiyatı',topic:'Sözün İnceliği',
    prompt:'Edebî metnin okuyucuda güzellik ve sanat duygusu oluşturma yönü hangi kavramla ilişkilidir?',
    options:{A:'Estetik değer',B:'Elektron dizilimi',C:'Karışım',D:'Madde döngüsü'},correctAnswer:'A',
    explanation:'Estetik değer, edebiyatın güzel sanatlar içindeki yerini anlamada kullanılan temel kavramdır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/76'
  },

  {
    examType:'LISE_9_10',subject:'Kimya',topic:'Etkileşim',
    prompt:'Bir elementin kimyasal özelliklerini taşıyan temel yapı birimi hangisidir?',
    options:{A:'Atom',B:'Paragraf',C:'Örüntü',D:'Fosil'},correctAnswer:'A',
    explanation:'Atomun yapısı 9. sınıf Etkileşim temasının temel içeriğindendir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/kimya-dersi/unite/92'
  },
  {
    examType:'LISE_9_10',subject:'Kimya',topic:'Etkileşim',
    prompt:'Elektronların atomdaki enerji düzeylerine yerleşimini gösteren düzen hangi kavramla ifade edilir?',
    options:{A:'Elektron dizilimi',B:'Ana düşünce',C:'Madde döngüsü',D:'Örüntü'},correctAnswer:'A',
    explanation:'Elektron dizilimi üzerinden tahmin yapma temanın öğrenme amaçlarındandır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/kimya-dersi/unite/92'
  },
  {
    examType:'LISE_9_10',subject:'Kimya',topic:'Etkileşim',
    prompt:'Elementlerin belirli bir düzene göre yerleştirildiği tablo hangisidir?',
    options:{A:'Periyodik tablo',B:'Karşılaştırma tablosu',C:'Zaman çizelgesi',D:'Kavram haritası'},correctAnswer:'A',
    explanation:'Periyodik tabloda yer bulma ve periyodik özellikleri yorumlama temanın temel hedeflerindendir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/kimya-dersi/unite/92'
  },
  {
    examType:'LISE_9_10',subject:'Kimya',topic:'Etkileşim',
    prompt:'Periyodik tabloda düzenli değişim gösteren atom özellikleri hangi genel adla anılır?',
    options:{A:'Periyodik özellikler',B:'Yüzey anlam',C:'Söz varlığı',D:'Fosil oluşumu'},correctAnswer:'A',
    explanation:'Elementlerin periyodik özelliklerinin tablodaki değişimini çözümleme temada yer alır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/kimya-dersi/unite/92'
  },

  {
    examType:'LISE_11_12',subject:'Türk Dili ve Edebiyatı',topic:'Bir Diyeceğim Var!',
    prompt:'Geleneksel Türk gölge oyununun başlıca kahramanlarından biri hangisidir?',
    options:{A:'Karagöz',B:'Atom',C:'Fotosentez',D:'Nicelik'},correctAnswer:'A',
    explanation:'Karagöz, 11. sınıf Bir Diyeceğim Var! temasında incelenen geleneksel Türk tiyatrosu bağlamındaki temel kavramlardan biridir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/267'
  },
  {
    examType:'LISE_11_12',subject:'Türk Dili ve Edebiyatı',topic:'Bir Diyeceğim Var!',
    prompt:'Bir kişinin başka bir kişiye duygu, düşünce veya haber iletmek amacıyla yazdığı öğretici metin türü hangisidir?',
    options:{A:'Mektup',B:'Roman',C:'Destan',D:'Masal'},correctAnswer:'A',
    explanation:'Mektup, bu temada incelenen öğretici metin türlerinden biridir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/267'
  },
  {
    examType:'LISE_11_12',subject:'Türk Dili ve Edebiyatı',topic:'Bir Diyeceğim Var!',
    prompt:'Resmî bir makama istek veya şikâyeti yazılı olarak bildiren metin türü hangisidir?',
    options:{A:'Dilekçe',B:'Şiir',C:'Hikâye',D:'Tiyatro'},correctAnswer:'A',
    explanation:'Dilekçe temanın günlük yaşamda dilin işlevsel kullanımıyla ilişkilendirilen metin türlerindendir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/267'
  },
  {
    examType:'LISE_11_12',subject:'Türk Dili ve Edebiyatı',topic:'Bir Diyeceğim Var!',
    prompt:'İnternet üzerinden gönderilen yazılı iletişim iletisine ne ad verilir?',
    options:{A:'E-posta',B:'Fosil',C:'Periyodik tablo',D:'Örüntü'},correctAnswer:'A',
    explanation:'E-posta yazma, temadaki yazma becerisi uygulamalarından biridir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/267'
  },

  {
    examType:'LISE_11_12',subject:'Tarih',topic:'Dönüşüm Sürecinde Osmanlı (1789-1908)',
    prompt:'1789 yılında başlayarak Avrupa ve Osmanlı dünyasında siyasal ve toplumsal etkiler oluşturan olay hangisidir?',
    options:{A:'Fransız İhtilali',B:'Sanayi Devrimi',C:'Coğrafi Keşifler',D:'Rönesans'},correctAnswer:'A',
    explanation:'Fransız İhtilali’nin devlet ve toplum hayatındaki etkileri 11. sınıf ünitesinde ele alınır.',
    officialSourceUrl:'https://tymm.meb.gov.tr/tarih-dersi/unite/72'
  },
  {
    examType:'LISE_11_12',subject:'Tarih',topic:'Dönüşüm Sürecinde Osmanlı (1789-1908)',
    prompt:'Bir devletin yönetim yapısı ve kurumlarıyla ilgili değişimler hangi alanla ifade edilir?',
    options:{A:'İdari',B:'Jeolojik',C:'Biyolojik',D:'Dilbilimsel'},correctAnswer:'A',
    explanation:'Ünitede 1789-1908 arasındaki siyasi, askerî ve idari gelişmeler birlikte değerlendirilir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/tarih-dersi/unite/72'
  },
  {
    examType:'LISE_11_12',subject:'Tarih',topic:'Dönüşüm Sürecinde Osmanlı (1789-1908)',
    prompt:'Üretimde makineleşme ve fabrika sisteminin yaygınlaşması hangi süreçle ilişkilidir?',
    options:{A:'Sanayileşme',B:'Fosilleşme',C:'Fotosentez',D:'Söz varlığı'},correctAnswer:'A',
    explanation:'Osmanlı Devleti’nin sanayileşme çabaları ünitenin temel içeriklerindendir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/tarih-dersi/unite/72'
  },
  {
    examType:'LISE_11_12',subject:'Tarih',topic:'Dönüşüm Sürecinde Osmanlı (1789-1908)',
    prompt:'Geçmişteki bir gelişmenin öncesi ve sonrasındaki farklılıkları incelemek hangi tarihsel düşünme yaklaşımıyla ilişkilidir?',
    options:{A:'Değişim ve süreklilik',B:'Ritim',C:'Nicelik',D:'Elektron dizilimi'},correctAnswer:'A',
    explanation:'Değişim ve sürekliliği neden-sonuçlarıyla yorumlama ünitenin öne çıkan tarihsel becerilerindendir.',
    officialSourceUrl:'https://tymm.meb.gov.tr/tarih-dersi/unite/72'
  }
];

function key(x:Pick<CoreItem,'examType'|'subject'|'topic'|'prompt'>){
  return [x.examType,x.subject,x.topic,x.prompt].join('|');
}

export async function ensureMebCoreQuestionBank(){
  const urls=[...new Set(MEB_CORE_ITEMS.map(x=>x.officialSourceUrl))];
  const existing=await db.questionBankItem.findMany({
    where:{sourceKind:'MEB_TYMM',officialSourceUrl:{in:urls}},
    select:{examType:true,subject:true,topic:true,prompt:true}
  });
  const have=new Set(existing.map(key));
  const missing=MEB_CORE_ITEMS.filter(x=>!have.has(key(x)));
  if(missing.length){
    await db.questionBankItem.createMany({
      data:missing.map(x=>({
        examType:x.examType,
        subject:x.subject,
        topic:x.topic,
        prompt:x.prompt,
        options:x.options,
        correctAnswer:x.correctAnswer,
        explanation:x.explanation,
        sourceKind:'MEB_TYMM',
        sourceYear:Y,
        officialSourceUrl:x.officialSourceUrl,
        active:true,
        reviewStatus:'APPROVED',
        reviewedAt:new Date()
      }))
    });
  }
  return {seeded:missing.length,total:MEB_CORE_ITEMS.length,sourceUrls:urls};
}

export function gameAudiencesForGradeLevel(gradeLevel?:string|null){
  const g=(gradeLevel||'').toLocaleLowerCase('tr-TR');
  if(/(^|\D)(1|2)(\D|$)/.test(g)||g.includes('ilkokul 1')||g.includes('ilkokul 2'))return ['ILKOKUL_1_2'];
  if(/(^|\D)(3|4)(\D|$)/.test(g)||g.includes('ilkokul 3')||g.includes('ilkokul 4'))return ['ILKOKUL_3_4'];
  if(/(^|\D)(5|6)(\D|$)/.test(g)||g.includes('ortaokul 5')||g.includes('ortaokul 6'))return ['ORTAOKUL_5_6'];
  if(/(^|\D)(7|8)(\D|$)/.test(g)||g.includes('ortaokul 7')||g.includes('ortaokul 8')||g.includes('lgs'))return ['ORTAOKUL_7_8','LGS'];
  if(/(^|\D)(9|10)(\D|$)/.test(g)||g.includes('lise 9')||g.includes('lise 10'))return ['LISE_9_10','TYT'];
  if(/(^|\D)(11|12)(\D|$)/.test(g)||g.includes('lise 11')||g.includes('lise 12')||g.includes('yks')||g.includes('mezun'))return ['LISE_11_12','TYT','AYT'];
  return ['GENEL'];
}
