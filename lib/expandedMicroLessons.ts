import type {MicroLesson} from './bankFreeMicroLessons';

/**
 * Independently authored subject lessons.
 * PILOT is intentional: automatic checks do not constitute teacher approval.
 * A version-bound administrator review can promote a lesson to APPROVED.
 */
export const EXPANDED_MICRO_LESSONS:readonly MicroLesson[]=[
  {
    id:'tur-paragraph-main-idea-v1',version:1,subject:'Türkçe',title:'Paragrafta ana düşünce',
    skill:'Metnin bütününden desteklenen temel mesajı belirleme',
    explanation:'Ana düşünce metnin tamamının okura ilettiği temel yargıdır. Bir örnek veya ayrıntı, ana düşünceyle aynı şey değildir.',
    misconception:'Paragrafta ilk cümlede geçen konu sözcüğünü ana düşünce sanmak; destekleyen ayrıntıyla ana düşünceyi karıştırmak.',
    worked:{
      prompt:'“Her gün az da olsa kitap okuyan kişi yeni bakış açıları kazanır. Okuma alışkanlığı, düşünce dünyasını zamanla zenginleştirir.” Parçanın ana düşüncesi nedir?',
      steps:['Tekrarlanan kavramları bul: okuma ve düşünce gelişimi.','Örneklerin ortak iletisini belirle: düzenli okuma kişiye katkı sağlar.','Ana düşünce: Düzenli okuma düşünce dünyasını geliştirir.'],
      answer:'Düzenli okuma düşünce dünyasını geliştirir.'
    },
    exercises:[
      {prompt:'“Ağaçlar gölge sağlar, havayı temizler ve pek çok canlıya barınak olur.” Ana düşünce hangisidir?',options:{A:'Ağaçlar yalnız gölge oluşturur.',B:'Ağaçların doğa için çeşitli yararları vardır.',C:'Ormanda her hayvan yaşar.',D:'Bütün ağaçlar aynı yerde yetişir.'},answer:'B',explanation:'Metin ağacın tek değil, birden çok yararını vurguluyor.'},
      {prompt:'“Plan yapmadan başlanılan işler bazen yarım kalır. Küçük, gerçekçi adımlarla ilerleyenler çalışmalarını daha kolay sürdürür.” Temel ileti hangisidir?',options:{A:'Çalışmak için her gün aynı saat gerekir.',B:'Büyük hedefler gereksizdir.',C:'Gerçekçi planlama sürekliliği kolaylaştırır.',D:'İşler rastlantıya bırakılmalıdır.'},answer:'C',explanation:'İki cümlede de gerçekçi adımlarla süreklilik kurma düşüncesi öne çıkar.'},
      {prompt:'“Yağmur suyunu toplamak ve musluğu açık bırakmamak, su kaynaklarının korunmasına katkı sağlar.” Ana düşünce hangisidir?',options:{A:'Yağmur her gün yağar.',B:'Su yalnız evde kullanılır.',C:'Musluklar hep bozulur.',D:'Günlük davranışlarla su tasarrufu yapılabilir.'},answer:'D',explanation:'Örneklerin ortak mesajı günlük davranışlarla suyu korumaktır.'},
      {prompt:'“Bir konuda farklı görüşleri dinlemek, kendi düşüncemizi gözden geçirmemize yardımcı olur.” Ana düşünce hangisidir?',options:{A:'Farklı görüşleri dinlemek düşünceyi geliştirebilir.',B:'Herkes her konuda aynı düşünür.',C:'Dinlemek hiçbir şeyi değiştirmez.',D:'Sadece kendi görüşümüz önemlidir.'},answer:'A',explanation:'Parça başka düşünceleri dinlemenin zihinsel gelişim yönünü vurgular.'}
    ],
    contentStatus:'PILOT'
  },
  {
    id:'tur-cause-purpose-v1',version:1,subject:'Türkçe',title:'Neden–sonuç ve amaç–sonuç',
    skill:'Gerçekleşen neden ile hedeflenen amacı birbirinden ayırma',
    explanation:'Neden–sonuçta eylemin gerçekleşme sebebi belirtilir. Amaç–sonuçta ise eylemin ulaşmak istediği hedef açıklanır. “Niçin?” sorusunun yanıtı her iki yapıda da bulunabilir; hedef/gerçekleşmiş sebep ayrımına bak.',
    misconception:'“İçin” sözcüğü bulunan her cümleyi amaç–sonuç kabul etmek; gerçek nedeni ve hedefi ayırmamak.',
    worked:{
      prompt:'“Sınava hazırlanmak için her gün tekrar yaptı.” cümlesindeki ilişki nedir?',
      steps:['Yapılan eylem: tekrar yapmak.','Tekrar yapmanın hedefi: sınava hazırlanmak.','Hedef söylendiğinden amaç–sonuç ilişkisi vardır.'],
      answer:'Amaç–sonuç'
    },
    exercises:[
      {prompt:'“Hastalandığı için toplantıya katılamadı.” cümlesinde hangi ilişki vardır?',options:{A:'Amaç–sonuç',B:'Karşılaştırma',C:'Neden–sonuç',D:'Koşul–sonuç'},answer:'C',explanation:'Katılamamanın gerçekleşmiş nedeni hastalanmasıdır.'},
      {prompt:'“Yabancı dil öğrenmek amacıyla kursa kaydoldu.” cümlesinde hangi ilişki vardır?',options:{A:'Amaç–sonuç',B:'Neden–sonuç',C:'Koşul–sonuç',D:'Karşıtlık'},answer:'A',explanation:'Kursa kaydolmanın hedefi yabancı dil öğrenmektir.'},
      {prompt:'“Şiddetli yağış nedeniyle maç ertelendi.” cümlesinde hangi ilişki vardır?',options:{A:'Öznel yargı',B:'Amaç–sonuç',C:'Tahmin',D:'Neden–sonuç'},answer:'D',explanation:'Ertelenme, yağışın sonucu olarak ifade edilmiştir.'},
      {prompt:'“Kitabı zamanında bitirebilmek için her akşam okudu.” cümlesinde hangi ilişki vardır?',options:{A:'Neden–sonuç',B:'Amaç–sonuç',C:'Tanımlama',D:'Örnekleme'},answer:'B',explanation:'Her akşam okumanın hedefi kitabı zamanında bitirmektir.'}
    ],
    contentStatus:'PILOT'
  },
  {
    id:'lit-figures-of-speech-v1',version:1,subject:'Türk Dili ve Edebiyatı',title:'Benzetme ve kişileştirme',
    skill:'Söz sanatlarında benzetme ile insana özgü nitelik aktarmayı ayırt etme',
    explanation:'Benzetmede bir varlık, bir yönden başka varlığa benzetilir. Kişileştirmede insan dışı bir varlığa insana özgü davranış veya özellik yüklenir.',
    misconception:'İnsan dışındaki her varlığın geçtiği cümleyi kişileştirme saymak; karşılaştırmayı benzetmenin kesin kanıtı görmek.',
    worked:{
      prompt:'“Rüzgâr kapımı usulca çaldı.” cümlesindeki belirgin söz sanatı hangisidir?',
      steps:['Eyleme bak: kapıyı çalmak.','Rüzgâra insana özgü bir davranış yükleniyor.','Bu nedenle kişileştirme vardır.'],
      answer:'Kişileştirme'
    },
    exercises:[
      {prompt:'“Çocuk, aslan gibi cesurdu.” cümlesindeki belirgin söz sanatı nedir?',options:{A:'Kişileştirme',B:'Benzetme',C:'Abartma',D:'Tezat'},answer:'B',explanation:'Çocuğun cesareti aslana benzetilmiştir.'},
      {prompt:'“Yalnız ağaç, gece boyunca bizimle konuştu.” cümlesindeki belirgin söz sanatı nedir?',options:{A:'Kişileştirme',B:'Tezat',C:'Benzetme',D:'Kinaye'},answer:'A',explanation:'Ağaca konuşma davranışı aktarılmıştır.'},
      {prompt:'“Bulutlar pamuk gibi beyazdı.” cümlesindeki belirgin söz sanatı nedir?',options:{A:'Tezat',B:'Kişileştirme',C:'Benzetme',D:'İstifham'},answer:'C',explanation:'Bulutların beyazlığı pamuğun beyazlığına benzetilmiştir.'},
      {prompt:'“Saat, geç kaldığımı bana fısıldadı.” cümlesindeki belirgin söz sanatı nedir?',options:{A:'Benzetme',B:'İstiare',C:'Tezat',D:'Kişileştirme'},answer:'D',explanation:'Saatin fısıldaması insana özgü bir davranış olarak aktarılmıştır.'}
    ],
    contentStatus:'PILOT'
  },
  {
    id:'hist-national-struggle-order-v1',version:1,subject:'Tarih',title:'Millî Mücadele kronolojisi',
    skill:'Millî Mücadele döneminin temel olaylarını sıralama',
    explanation:'Bu olayların tarihlerini ayrı ayrı bilmek, kronolojik sıralamayı kolaylaştırır: Samsun’a çıkış (19 Mayıs 1919), Amasya Genelgesi (22 Haziran 1919), Erzurum Kongresi (23 Temmuz–7 Ağustos 1919), Sivas Kongresi (4–11 Eylül 1919), TBMM’nin açılışı (23 Nisan 1920).',
    misconception:'Erzurum ve Sivas kongrelerinin tarih sırasını ters çevirmek veya TBMM açılışını 1919 olaylarından önce düşünmek.',
    worked:{
      prompt:'Hangisi önce gerçekleşmiştir: Sivas Kongresi mi, Erzurum Kongresi mi?',
      steps:['Erzurum Kongresi 23 Temmuz 1919 tarihinde başladı.','Sivas Kongresi 4 Eylül 1919 tarihinde başladı.','Temmuz, eylülden önce olduğundan Erzurum Kongresi daha erkendir.'],
      answer:'Erzurum Kongresi'
    },
    exercises:[
      {prompt:'Hangisi diğerlerinden önce gerçekleşmiştir?',options:{A:'Sivas Kongresi',B:'TBMM’nin açılışı',C:'Amasya Genelgesi',D:'Erzurum Kongresi'},answer:'C',explanation:'Amasya Genelgesi 22 Haziran 1919, Erzurum Kongresi ise 23 Temmuz 1919 tarihindedir.'},
      {prompt:'Sivas Kongresi hangi olaydan sonra gerçekleşmiştir?',options:{A:'TBMM’nin açılışı',B:'Erzurum Kongresi',C:'Cumhuriyetin ilanı',D:'Büyük Taarruz'},answer:'B',explanation:'Erzurum Kongresi temmuz–ağustos 1919; Sivas Kongresi eylül 1919 tarihindedir.'},
      {prompt:'Aşağıdaki olaylardan hangisi 1920 yılında gerçekleşmiştir?',options:{A:'Mustafa Kemal’in Samsun’a çıkışı',B:'Amasya Genelgesi',C:'Sivas Kongresi',D:'TBMM’nin açılışı'},answer:'D',explanation:'TBMM 23 Nisan 1920’de açılmıştır.'},
      {prompt:'İlkten sona doğru doğru sıralama hangisidir?',options:{A:'Samsun → Amasya → Erzurum → Sivas',B:'Amasya → Samsun → Sivas → Erzurum',C:'Sivas → Erzurum → Amasya → Samsun',D:'Erzurum → Samsun → Amasya → Sivas'},answer:'A',explanation:'Samsun (mayıs), Amasya (haziran), Erzurum (temmuz), Sivas (eylül) 1919 sıralamasıdır.'}
    ],
    sourceUrl:'https://acikerisim.tbmm.gov.tr/items/af4f5817-2914-4daf-9b57-24135495d396/full',
    contentStatus:'PILOT'
  },
  {
    id:'geo-latitude-longitude-v1',version:1,subject:'Coğrafya',title:'Enlem ve boylamın yorumlanması',
    skill:'Enlem–boylam kavramlarını ve yönlerini ayırma',
    explanation:'Enlem, Ekvator’a göre kuzey veya güney yönünde açısal konumdur. Boylam, başlangıç meridyenine göre doğu veya batı yönünde açısal konumdur.',
    misconception:'Paralelleri meridyenlerle, kuzey–güney bilgisini doğu–batı bilgisiyle karıştırmak.',
    worked:{
      prompt:'40° kuzey, 30° doğu koordinatında hangi sayı enlemi gösterir?',
      steps:['Enlem Ekvator’a göre kuzey–güney konumudur.','“40° kuzey” ifadesi kuzey yönlü enlem bildirir.','Bu nedenle enlem 40° kuzeydir.'],
      answer:'40° kuzey'
    },
    exercises:[
      {prompt:'Bir noktanın 35° güney bilgisi hangi koordinat türünü gösterir?',options:{A:'Boylam',B:'Enlem',C:'Yükselti',D:'Saat dilimi'},answer:'B',explanation:'Kuzey ve güney yönlü açısal konum enlemdir.'},
      {prompt:'28° doğu bilgisi hangi koordinat türünü gösterir?',options:{A:'Boylam',B:'Enlem',C:'Rakım',D:'İklim'},answer:'A',explanation:'Doğu–batı yönündeki açısal konum boylamdır.'},
      {prompt:'Enlem için başlangıç kabul edilen çizgi hangisidir?',options:{A:'Yengeç Dönencesi',B:'Başlangıç meridyeni',C:'Ekvator',D:'Kutup Dairesi'},answer:'C',explanation:'Enlem Ekvator’a göre kuzey ve güney yönünde ölçülür.'},
      {prompt:'Boylam için başlangıç referansı hangisidir?',options:{A:'Ekvator',B:'Kuzey Kutbu',C:'Oğlak Dönencesi',D:'Başlangıç meridyeni'},answer:'D',explanation:'Boylam başlangıç meridyenine göre doğu veya batı yönünde belirtilir.'}
    ],
    contentStatus:'PILOT'
  },
  {
    id:'physics-quantities-v1',version:1,subject:'Fizik',title:'Temel ve türetilmiş büyüklükler',
    skill:'SI sisteminde temel ve türetilmiş fiziksel büyüklükleri ayırt etme',
    explanation:'Uluslararası Birim Sisteminde uzunluk, kütle, zaman, elektrik akımı, termodinamik sıcaklık, madde miktarı ve ışık şiddeti temel büyüklüklerdir. Alan, sürat ve kuvvet bunlardan türetilir.',
    misconception:'“Hız” gibi sık kullanılan büyüklüklerin de SI temel büyüklüğü olduğunu sanmak.',
    worked:{
      prompt:'Sürat neden türetilmiş büyüklüktür?',
      steps:['Sürat, alınan yolun geçen zamana bölünmesiyle bulunur.','Yol uzunluğa, geçen süre zamana dayanır.','Bu nedenle sürat uzunluk ve zamandan türetilir.'],
      answer:'Türetilmiş büyüklük'
    },
    exercises:[
      {prompt:'Hangisi SI temel büyüklüğüdür?',options:{A:'Kuvvet',B:'Alan',C:'Zaman',D:'Sürat'},answer:'C',explanation:'Zaman temel büyüklüktür; diğerleri farklı temel büyüklüklerle ifade edilir.'},
      {prompt:'Aşağıdakilerden hangisi türetilmiş büyüklüktür?',options:{A:'Kütle',B:'Sürat',C:'Uzunluk',D:'Sıcaklık'},answer:'B',explanation:'Sürat, uzunluk/zaman ile hesaplanır.'},
      {prompt:'SI sisteminde kütlenin temel birimi hangisidir?',options:{A:'Kilogram',B:'Metre',C:'Saniye',D:'Newton'},answer:'A',explanation:'Kütlenin SI temel birimi kilogramdır.'},
      {prompt:'Bir yüzeyin alanı hangi temel büyüklükten türetilir?',options:{A:'Zaman',B:'Işık şiddeti',C:'Madde miktarı',D:'Uzunluk'},answer:'D',explanation:'Alan, iki uzunluğun çarpımıdır (m²).'}
    ],
    contentStatus:'PILOT'
  },
  {
    id:'chem-element-compound-mixture-v1',version:1,subject:'Kimya',title:'Element, bileşik ve karışım',
    skill:'Saf madde türlerini ve karışımları örneklerden ayırt etme',
    explanation:'Element tek tür atomdan oluşan saf maddedir. Bileşik farklı element atomlarının kimyasal bağlarla belirli oranlarda birleştiği saf maddedir. Karışımda maddeler kimyasal bağla yeni bir saf madde oluşturmak zorunda değildir.',
    misconception:'Tuzlu suyu bileşik sanmak veya suyun (H₂O) tek tür atom içerdiğini düşünmek.',
    worked:{
      prompt:'Saf H₂O hangi sınıftadır: element, bileşik, karışım?',
      steps:['H₂O yapısında hidrojen ve oksijen atomları bulunur.','Farklı elementlerin atomları kimyasal olarak belirli oranda bir araya gelmiştir.','Bu nedenle saf H₂O bir bileşiktir.'],
      answer:'Bileşik'
    },
    exercises:[
      {prompt:'Saf demir (Fe) hangi madde sınıfına girer?',options:{A:'Element',B:'Bileşik',C:'Heterojen karışım',D:'Çözelti'},answer:'A',explanation:'Saf demir tek tür atomdan oluşur ve bir elementtir.'},
      {prompt:'Homojen tuzlu su hangi madde sınıfına girer?',options:{A:'Element',B:'Bileşik',C:'Karışım',D:'Saf madde'},answer:'C',explanation:'Tuz ve su uygun koşullarda fiziksel yollarla ayrılabilen bir karışım oluşturur.'},
      {prompt:'Saf karbondioksit (CO₂) hangi madde sınıfına girer?',options:{A:'Karışım',B:'Bileşik',C:'Element',D:'Alaşım'},answer:'B',explanation:'Karbondioksit karbon ve oksijen atomlarından oluşan belirli formüllü bileşiktir.'},
      {prompt:'Aşağıdakilerden hangisi karışıma örnektir?',options:{A:'Saf oksijen',B:'Saf bakır',C:'Saf su',D:'Hava'},answer:'D',explanation:'Hava farklı gazların karışımıdır.'}
    ],
    sourceUrl:'https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/432',
    contentStatus:'PILOT'
  },
  {
    id:'bio-organel-functions-v1',version:1,subject:'Biyoloji',title:'Hücre organellerinin görevleri',
    skill:'Ökaryot hücre organelleri ile temel işlevleri eşleştirme',
    explanation:'Ribozom protein sentezinde, mitokondri hücresel solunumun büyük bölümünde, kloroplast fotosentezde görev alır. Çekirdek ökaryot hücrenin DNA’sının büyük bölümünü bulundurur.',
    misconception:'Kloroplastın bütün hücrelerde bulunduğunu veya ribozomun yalnız hayvan hücrelerinde olduğunu düşünmek.',
    worked:{
      prompt:'Bitki hücresinde ışık enerjisinin kimyasal enerjiye dönüştürüldüğü fotosentez hangi organelde gerçekleşir?',
      steps:['Soruda belirtilen olay fotosentezdir.','Fotosentez, fotosentetik ökaryot hücrelerde kloroplastla ilişkilidir.','Doğru organel kloroplasttır.'],
      answer:'Kloroplast'
    },
    exercises:[
      {prompt:'Protein sentezinde doğrudan görev yapan yapı hangisidir?',options:{A:'Koful',B:'Ribozom',C:'Lizozom',D:'Sentrozom'},answer:'B',explanation:'Ribozomlar protein sentezinde görev alır.'},
      {prompt:'Ökaryot hücrede aerobik solunum ve ATP üretimiyle en doğrudan ilişkili organel hangisidir?',options:{A:'Kloroplast',B:'Golgi aygıtı',C:'Mitokondri',D:'Koful'},answer:'C',explanation:'Mitokondri hücresel solunumun önemli aşamalarının gerçekleştiği organeldir.'},
      {prompt:'Fotosentez yapan bitki hücresinde fotosentezin gerçekleştiği organel hangisidir?',options:{A:'Kloroplast',B:'Ribozom',C:'Çekirdek',D:'Lizozom'},answer:'A',explanation:'Kloroplast fotosentezde görev alan organeldir.'},
      {prompt:'Ökaryot hücrede kalıtsal bilgiyi taşıyan DNA’nın büyük bölümü hangi yapıda bulunur?',options:{A:'Ribozom',B:'Golgi aygıtı',C:'Koful',D:'Çekirdek'},answer:'D',explanation:'Ökaryot hücrede DNA’nın büyük bölümü çekirdektedir; mitokondri gibi organellerde de az miktarda DNA bulunabilir.'}
    ],
    contentStatus:'PILOT'
  },
  {
    id:'edu-validity-reliability-v1',version:1,subject:'Eğitim Bilimleri',title:'Ölçmede geçerlik ve güvenirlik',
    skill:'Ölçme aracının neyi ölçtüğünü ve tutarlılığını ayırt etme',
    explanation:'Geçerlik, elde edilen ölçme sonuçlarının amaçlanan kullanımını destekleme derecesiyle; güvenirlik ise ölçme sonuçlarının tutarlılığıyla ilgilidir. Güvenilir bir ölçüm yanlış özelliği ölçüyorsa amaç bakımından geçerli olmayabilir.',
    misconception:'Bir test her uygulandığında aynı sonucu verdiği için mutlaka doğru beceriyi ölçtüğünü varsaymak.',
    worked:{
      prompt:'Sadece matematik işlemleri içeren bir testle öğrencinin okuduğunu anlama becerisini ölçmek istenirse temel sorun nedir?',
      steps:['Ölçülmek istenen özellik: okuduğunu anlama.','Soruların ölçtüğü özellik: matematiksel işlem.','Bu uyuşmazlık amaçlanan yorum açısından geçerlik sorunudur.'],
      answer:'Geçerlik'
    },
    exercises:[
      {prompt:'Aynı özelliği benzer koşullarda tekrar ölçtüğünde tutarlı sonuç vermek en çok hangi kavramla ilgilidir?',options:{A:'Geçerlik',B:'Güvenirlik',C:'Kapsam',D:'Norm'},answer:'B',explanation:'Tutarlılık güvenirlik kavramıyla ilişkilidir.'},
      {prompt:'Yalnız çarpma işlemi sorularıyla yazma becerisini ölçmeye çalışmak hangi sorunu doğurur?',options:{A:'Geçerlik sorunu',B:'Ölçek türü sorunu',C:'Örneklem artışı',D:'Puanlama kolaylığı'},answer:'A',explanation:'Araç hedeflenen özelliği ölçmüyor; dolayısıyla kullanım amacı bakımından geçerlik zayıftır.'},
      {prompt:'Test iki uygulamada çok farklı sonuç veriyor; en doğrudan hangi nitelik sorgulanır?',options:{A:'Madde kapsamı',B:'Öğretim yöntemi',C:'Güvenirlik',D:'Hedef davranış'},answer:'C',explanation:'Koşullar benzerken sonuçların çok değişmesi tutarlılık sorunu işaretidir.'},
      {prompt:'Bir ölçme aracı çok tutarlı fakat hedeflenen beceriden farklı bir özelliği ölçüyor. Hangisi doğrudur?',options:{A:'Kesinlikle geçerlidir.',B:'Öğrenciler eşit puan almalıdır.',C:'Sadece soru sayısı azaltılmalıdır.',D:'Güvenirliği yüksek, amaçlanan geçerliği düşük olabilir.'},answer:'D',explanation:'Tutarlı sonuçlar hedeflenen özelliğin ölçüldüğünü tek başına kanıtlamaz.'}
    ],
    contentStatus:'PILOT'
  }
];
