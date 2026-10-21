import type {MicroLesson} from './bankFreeMicroLessons';

/** Newly authored KEKS pilot examples. No official outcome code or teacher approval is claimed. */
export const MISSING_SUBJECT_PILOT_LESSONS:readonly MicroLesson[]=[
 {
  id:'geometry-triangle-interior-2026-v1',version:1,subject:'Geometri',title:'Üçgende iç ve dış açılar',
  skill:'Üçgenin iç açı toplamından yararlanarak bilinmeyen açıyı gerekçelendirme',
  targetGrades:[7,8,9,10,11,12],targetExams:['TYT','AYT','DGS','KPSS','AGS'],
  topicTags:['Üçgende İç Açılar','Üçgende iç ve dış açılar'],
  explanation:'Üçgenin üç iç açısının toplamı 180 derecedir. Komşu iç ve dış açı ise bütünlerdir: toplamları 180 derecedir. Bir dış açı, kendisine komşu olmayan iki iç açının toplamına eşittir.',
  misconception:'Dış açıyı üçgenin dördüncü iç açısı saymak ya da 180 dereceyi birden çok kez çıkarıp karıştırmak.',
  worked:{prompt:'Bir üçgenin iki iç açısı 45° ve 65° ise üçüncü açı kaç derecedir?',
   steps:['Üçgenin iç açı toplamı 180° olarak yazılır.','45° + 65° = 110° bulunur.','180° − 110° = 70°.'],answer:'70 derece'},
  exercises:[
   {prompt:'Bir üçgende açılar 50°, 60° ve x°. x kaç derecedir?',options:{A:'70',B:'60',C:'80',D:'90'},answer:'A',explanation:'50 + 60 = 110; 180 − 110 = 70.'},
   {prompt:'Bir üçgende iki açı 30° ve 80° ise üçüncü açı kaç derecedir?',options:{A:'80',B:'70',C:'60',D:'50'},answer:'B',explanation:'30 + 80 = 110; üçüncü iç açı 70° olur.'},
   {prompt:'Bir üçgenin bir dış açısı 120° ise ona komşu iç açı kaç derecedir?',options:{A:'120',B:'30',C:'60',D:'90'},answer:'C',explanation:'Komşu iç ve dış açıların toplamı 180°: 180 − 120 = 60.'},
   {prompt:'Tepe açısı 40° olan ikizkenar üçgenin taban açılarından biri kaç derecedir?',options:{A:'40',B:'60',C:'80',D:'70'},answer:'D',explanation:'Kalan toplam 140° ve taban açıları eşittir: 140/2=70.'}
  ],contentStatus:'PILOT'
 },
 {
  id:'english-present-simple-continuous-2026-v1',version:1,subject:'İngilizce',title:'Simple Present ve Present Continuous ayrımı',
  skill:'Zaman zarfını ve özneyi kontrol ederek doğru fiil biçimini seçme',
  targetGrades:[5,6,7,8,9,10,11,12],targetExams:['YDS','YÖKDİL','AGS'],
  topicTags:['Simple Present vs Present Continuous','İngilizce zamanlar'],
  explanation:'Every day, usually ve often gibi sıklık ifadeleri genel alışkanlığa işaret eder; now, at the moment ve look gibi ipuçları şu an süren eylemi gösterebilir. Üçüncü tekil özne ile Simple Present olumlu yüklem genellikle -s alır; does not sonrasında fiil yalın kullanılır.',
  misconception:'He/She öznesinden sonra her durumda -ing kullanmak veya does not ile -s ekini birlikte yazmak.',
  worked:{prompt:'She ___ to school every day. (go)',steps:['Every day bir alışkanlığa işaret eder.','She üçüncü tekil öznedir.','Simple Present olumlu biçim goes olur.'],answer:'goes (Simple Present)'},
  exercises:[
   {prompt:'He ___ football every weekend.',options:{A:'plays',B:'playing',C:'play',D:'is play'},answer:'A',explanation:'Every weekend alışkanlık; he ile plays.'},
   {prompt:'Look! They ___ in the garden now.',options:{A:'play',B:'are playing',C:'plays',D:'played'},answer:'B',explanation:'Look ve now şu an devam eden eylem: are playing.'},
   {prompt:'She does not ___ coffee.',options:{A:'drinks',B:'drinking',C:'drink',D:'is drinking'},answer:'C',explanation:'Does not ardından fiil yalın biçimdedir: drink.'},
   {prompt:'We ___ studying at the moment.',options:{A:'am',B:'is',C:'be',D:'are'},answer:'D',explanation:'We çoğul özne; Present Continuous yardımcı fiili are.'}
  ],contentStatus:'PILOT'
 },
 {
  id:'philosophy-premise-conclusion-2026-v1',version:1,subject:'Felsefe',title:'Öncül, sonuç ve çıkarım',
  skill:'Bir argümanda öncülleri, sonucu ve geçersiz ters çevirmeyi ayırt etme',
  targetGrades:[10,11,12],targetExams:['TYT','AYT','KPSS','AGS'],
  topicTags:['Öncül ve Sonuç','Akıl Yürütme'],
  explanation:'Öncül, sonucu desteklemek için sunulan gerekçedir. “P ise Q” ve P birlikte verilirse Q çıkar. Ancak yalnız Q doğru olduğundan P doğru sonucu zorunlu değildir; bu, sonucu onaylama yanılgısıdır.',
  misconception:'Bir koşul önermesinin sonucundan hareketle öncülün mutlaka gerçekleştiğini varsaymak.',
  worked:{prompt:'“Bütün serçeler kuştur. Bu canlı bir serçedir. Öyleyse bu canlı kuştur.” Argümanın sonucu hangisidir?',
   steps:['İlk iki cümle öncüllerdir.','Öyleyse sözcüğü sonuç yargısını başlatır.','Sonuç: Bu canlı kuştur.'],answer:'Bu canlı kuştur.'},
  exercises:[
   {prompt:'“Bütün metaller iletkendir. Bakır bir metaldir. O hâlde bakır iletkendir.” Sonuç hangisidir?',
    options:{A:'Bakır iletkendir.',B:'Bakır bir metaldir.',C:'Bütün metaller iletkendir.',D:'Her iletken bakırdır.'},answer:'A',explanation:'“O hâlde” ile başlayan yargı sonuçtur; diğer ilk iki yargı öncüldür.'},
   {prompt:'“Yağmur yağarsa yer ıslanır. Yer ıslandı. Demek ki yağmur yağdı.” Çıkarımın temel sorunu nedir?',
    options:{A:'Öncül yoktur.',B:'Sonuçtan nedeni zorunlu sanmaktadır.',C:'Kavram tanımı vardır.',D:'Geçerli bir çıkarımdır.'},answer:'B',explanation:'Yerin ıslanmasına başka nedenler de yol açabilir; Q’dan P çıkarımı geçersizdir.'},
   {prompt:'“Eğer P ise Q. P gerçekleşti.” Hangi sonuç geçerlidir?',options:{A:'P yanlış',B:'Q yanlış',C:'Q gerçekleşti',D:'P ile Q ilgisiz'},answer:'C',explanation:'Modus ponens: P→Q, P; dolayısıyla Q.'},
   {prompt:'Bir argümanda sonucu destekleyen ifadeler ne ad alır?',options:{A:'İstisna',B:'İtiraz',C:'Sonuç',D:'Öncül'},answer:'D',explanation:'Sonucu gerekçelendirmek için sunulan ifadeler öncüldür.'}
  ],contentStatus:'PILOT'
 },
 {
  id:'religion-ethical-reasoning-2026-v1',version:1,subject:'Din Kültürü',title:'Ahlaki sorumluluk ve gerekçelendirme',
  skill:'Bir davranışın niyet, sonuç ve başkalarının hakları bakımından değerlendirilmesi',
  targetGrades:[7,8,9,10,11,12],targetExams:['TYT','AYT','KPSS','AGS'],
  topicTags:['Ahlaki Sorumluluk','Din ve Ahlak'],
  explanation:'Bir davranışı değerlendirirken amaç, sonuç ve etkilenen kişilerin hakları birlikte incelenir. Başkasına yardım etmek, adaletli davranmak ve kişinin yaptığının sorumluluğunu üstlenmesi ahlaki düşünmede örneklerdir. Bu örnekler belirli bir resmî din dersi kazanımının tamamlandığı iddiası değildir.',
  misconception:'Yalnız söylenen niyeti görüp davranışın başkaları üzerindeki etkisini tamamen görmezden gelmek.',
  worked:{prompt:'Bir öğrenci arkadaşının eşyasını izinsiz alıyor, sonra “iyi amaçla kullandım” diyor. Hangi ilke önemlidir?',
   steps:['Önce davranışın başkasının hakkına etkisine bakılır.','İyi amaç, izinsiz almayı kendiliğinden doğru yapmaz.','Haklara saygı ve sorumluluk birlikte değerlendirilir.'],answer:'Başkalarının haklarına saygı.'},
  exercises:[
   {prompt:'Bir arkadaşının ödevini kendi çalışmasıymış gibi sunan kişi en çok hangi ilkeyi ihlal eder?',
    options:{A:'Dürüstlük',B:'Yardımlaşma',C:'Sabır',D:'Hoşgörü'},answer:'A',explanation:'Başkasının emeğini kendi emeği gibi göstermek dürüstlükle bağdaşmaz.'},
   {prompt:'İki kişiyi dinlemeden karar veren biri hangi ilkeyi yeterince gözetmemiştir?',
    options:{A:'Tasarruf',B:'Adalet',C:'Cesaret',D:'Sabır'},answer:'B',explanation:'Tarafların görüşünü dinlemek adil değerlendirmeye yardımcı olur.'},
   {prompt:'Yaptığı hatayı kabul edip telafi etmeye çalışan kişi hangi tutumu gösterir?',
    options:{A:'Kıskançlık',B:'İlgisizlik',C:'Sorumluluk',D:'Önyargı'},answer:'C',explanation:'Hatanın sonucunu üstlenmek ve telafi etmek sorumluluk davranışıdır.'},
   {prompt:'Bir yardımı değerlendirirken hangisi daha kapsamlı yaklaşımı gösterir?',
    options:{A:'Yalnız görünüşüne bakmak',B:'Sadece övgüyü ölçmek',C:'Diğerlerini yok saymak',D:'Niyet, sonuç ve hakları birlikte incelemek'},answer:'D',explanation:'Niyet, gerçekleşen etki ve diğer kişilerin hakları birlikte değerlendirilmelidir.'}
  ],contentStatus:'PILOT'
 },
 {
  id:'legislation-source-scope-2026-v1',version:1,subject:'Mevzuat',title:'Hüküm, koşul ve istisna okuma',
  skill:'Mevzuat benzeri metinlerde kapsam ve istisnayı dikkatle ayırt etme',
  targetExams:['AGS','KPSS'],
  topicTags:['Hükmün Kapsamı ve İstisnalar','Mevzuat Okuryazarlığı'],
  explanation:'Mevzuat sorularında “yalnız”, “ancak”, “en az”, “hariç” gibi sınırlayıcı ifadeler belirleyicidir. Aşağıdaki kurallar tamamen kurgusal alıştırma metinleridir, geçerli mevzuat hükmü değildir. Gerçek hukuki sorular her zaman güncel resmî kaynaktan doğrulanmalıdır.',
  misconception:'Metindeki istisnayı yok saymak veya kurgusal örnek kuralı güncel kanun maddesi sanmak.',
  worked:{prompt:'Kurgusal kural: “A sınıfı üyeler başvurabilir; ancak süresi dolmuş üyelikler hariçtir.” Süresi dolmuş A üyesi başvurabilir mi?',
   steps:['Genel kural: A üyeleri başvurabilir.','Ancak sözcüğü istisnayı başlatır.','Süresi dolmuş üyelik başvuru kapsamı dışındadır.'],answer:'Hayır.'},
  exercises:[
   {prompt:'Kurgusal kural: “En az 3 belge sunanlar başvurabilir.” 2 belge sunan ne yapabilir?',
    options:{A:'Başvuramaz',B:'Kesin kabul edilir',C:'Başvurur',D:'İstisna sayılır'},answer:'A',explanation:'En az 3 koşulu, 2 belgeyle sağlanmaz. Bu örnek gerçek mevzuat değildir.'},
   {prompt:'Kurgusal kural: “Herkes katılabilir; ancak kayıt yaptırmayanlar hariç.” Kayıtsız kişi için hangisi doğrudur?',
    options:{A:'Daima katılabilir',B:'Kural gereği katılamaz',C:'Özel ayrıcalıklıdır',D:'Kayıt önemsizdir'},answer:'B',explanation:'Ancak ve hariç sözcükleri istisnayı belirler.'},
   {prompt:'Bir mevzuat sınavı sorusunda hükmün hâlen geçerli olduğu nasıl güvenilir biçimde denetlenir?',
    options:{A:'Ezbere dayanarak',B:'Eski forum mesajıyla',C:'Güncel resmî metinle',D:'Tahmin yürüterek'},answer:'C',explanation:'Mevzuat değişebilir; yürürlükteki resmî metin kontrol edilir.'},
   {prompt:'Kurgusal kural: “X ve Y koşullarının ikisi de aranır.” Yalnız X sağlanmışsa hangisi doğrudur?',
    options:{A:'Tüm koşullar sağlandı',B:'Y koşulu gereksiz',C:'Otomatik kabul',D:'Koşullar tamamlanmadı'},answer:'D',explanation:'“Ve” iki koşulun birlikte aranmasını anlatır.'}
  ],contentStatus:'PILOT'
 }
];
