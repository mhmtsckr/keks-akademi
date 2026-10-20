/** Six KEKS-original question sets linked to MEB codes. These are pilot educational supports, not official exams. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const GRADE57_SOCIAL_PILOTS:readonly MicroLesson[]=[
  {
    "id": "socialSB-5-1-1-v1",
    "version": 1,
    "subject": "Sosyal Bilgiler",
    "title": "Gruplar, roller ve sorumluluklar",
    "skill": "Farklı gruplarda aynı kişinin değişen sorumluluklarını karşılaştırma",
    "explanation": "Bir kişi ailesinde kardeş, okulunda sınıf temsilcisi, spor takımında oyuncu olabilir. Rol bulunduğu gruptaki görev ve beklentilerle ilişkilidir; bütün gruplarda aynı sorumluluğun bulunması gerekmez.",
    "misconception": "Tek bir kişinin yalnızca bir gruba veya tek bir role sahip olabileceğini düşünmek.",
    "worked": {
      "prompt": "Ela, evde abla, okulda sınıf başkanıdır. Hangi sorumlulukları rolüne göre değişir?",
      "steps": [
        "İki grubunu belirle: aile ve sınıf.",
        "Her gruptaki rolünü ayır: abla ve sınıf başkanı.",
        "Küçük kardeşine destek olmak aile rolüyle, sınıf toplantısındaki görüşleri aktarmak sınıf başkanlığıyla ilgilidir."
      ],
      "answer": "Farklı gruplarda farklı roller ve sorumluluklar"
    },
    "exercises": [
      {
        "prompt": "Aynı öğrenci okul korosunda üye, sınıfta temsilcidir. Buna göre kesin olarak hangisi söylenebilir?",
        "options": {
          "A": "Her grupta aynı sorumlulukları vardır",
          "B": "Farklı gruplarda farklı roller üstlenebilir",
          "C": "Yalnız okul korosuna aittir",
          "D": "Gruplarda hakları bulunmaz"
        },
        "answer": "B",
        "explanation": "Koro üyeliği ile sınıf temsilciliği iki ayrı rol ve sorumluluk alanıdır."
      },
      {
        "prompt": "Okul kitap kulübünün toplantısını zamanında duyurmakla görevli öğrenci hangi sorumluluğunu yerine getirir?",
        "options": {
          "A": "Kulüpteki organizasyon rolünü",
          "B": "Ailesindeki kardeş rolünü",
          "C": "Bütün mahalle sakinlerinin görevini",
          "D": "Okul müdürünün görevini"
        },
        "answer": "A",
        "explanation": "Toplantıyı duyurma, kulüpte üstlenilen rolün gereğidir."
      },
      {
        "prompt": "Bir öğrenci hem mahalle spor takımında kaptan hem okulda kulüp üyesiyse hangi çıkarım doğrudur?",
        "options": {
          "A": "İki grup da aynı amaçla kurulur",
          "B": "Her grupta yöneticidir",
          "C": "Bir gruba girince diğerinden çıkmalıdır",
          "D": "Rollerinin gerektirdiği davranışlar grup amacına göre değişebilir"
        },
        "answer": "D",
        "explanation": "Takım kaptanlığı ve kulüp üyeliği farklı görevler içerir."
      },
      {
        "prompt": "Aşağıdakilerden hangisi rol ile sorumluluk ilişkisinin en iyi örneğidir?",
        "options": {
          "A": "Birinin aynı sokakta yaşaması",
          "B": "Bir çocuğun uzun boylu olması",
          "C": "Sınıf nöbetçisinin sınıf düzenine katkıda bulunması",
          "D": "Birinin en sevdiği rengi seçmesi"
        },
        "answer": "C",
        "explanation": "Nöbetçilik bir rol, sınıf düzenine katkıda bulunmak o role ait sorumluluktur."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      5
    ],
    "sourceThemeId": "SB.5.1.1",
    "sourceUrl": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/379",
    "topicTags": [
      "Gruplar, roller ve sorumluluklar"
    ]
  },
  {
    "id": "socialSB-5-6-1-v1",
    "version": 1,
    "subject": "Sosyal Bilgiler",
    "title": "Teknolojik gelişmelerin topluma etkileri",
    "skill": "Teknolojiyle ilgili iddianın yarar, risk ve kanıtlarını tartışma",
    "explanation": "Bir teknolojinin toplum üzerindeki etkisini değerlendirirken yalnız yararlarını veya yalnız risklerini saymak yeterli değildir. Örnekler, kullanılma koşulları ve iddiayı destekleyen kanıtlar birlikte değerlendirilir.",
    "misconception": "Bir teknolojinin her durumda tüm insanlar için aynı sonucu doğuracağını varsaymak.",
    "worked": {
      "prompt": "'Dijital ders kitabı her öğrenci için daha iyidir.' iddiasını nasıl değerlendiririz?",
      "steps": [
        "Yarar olabilecek durumu bul: içerik hızlı güncellenebilir.",
        "Sınırlılığı belirle: cihaz ve internete erişim herkeste eşit olmayabilir.",
        "İddia ancak koşullar ve erişim verileri incelendikten sonra değerlendirilebilir."
      ],
      "answer": "Yararlar, erişim koşulları ve kanıtlar birlikte incelenir"
    },
    "exercises": [
      {
        "prompt": "'Çevrim içi eğitim her zaman yüz yüze eğitimden üstündür.' yargısını incelemek için hangisi en uygundur?",
        "options": {
          "A": "Yalnız reklam görseline bakmak",
          "B": "Bir kişinin yorumunu tüm öğrencilere genellemek",
          "C": "Farklı öğrencilerin erişim ve öğrenme verilerini karşılaştırmak",
          "D": "Konuyu tartışmadan kapatmak"
        },
        "answer": "C",
        "explanation": "Bir genellemeyi desteklemek için farklı koşulları ve güvenilir verileri incelemek gerekir."
      },
      {
        "prompt": "Akıllı ulaşım uygulamalarının olası yararı ve riski hangi seçenekte birlikte verilmiştir?",
        "options": {
          "A": "Yol süresini öngörme; kişisel konum verilerinin korunması ihtiyacı",
          "B": "Yalnız renk değiştirmesi; hiçbir veri işlememesi",
          "C": "Bütün yolları kapatması; her yerde aynı etki",
          "D": "Her zaman ücretsiz olması; asla hata yapmaması"
        },
        "answer": "A",
        "explanation": "Teknoloji kolaylık sağlayabilir, ancak konum mahremiyeti de ele alınmalıdır."
      },
      {
        "prompt": "Bir teknoloji haberinde 'kesin herkes faydalanacak' deniyorsa ilk sorgulanması gereken nedir?",
        "options": {
          "A": "Başlığın kaç kelime olduğu",
          "B": "Hangi cihazın rengi kullanıldığı",
          "C": "Yorum sayısının tek başına yüksek olması",
          "D": "Farklı kullanıcı koşullarının ve kanıtların dikkate alınıp alınmadığı"
        },
        "answer": "D",
        "explanation": "Herkes ifadesi geniş bir iddiadır ve farklı koşullara dair kanıt gerektirir."
      },
      {
        "prompt": "Bir buluşun toplumsal etkisini tartışırken aşağıdakilerden hangisi daha dengeli bir yaklaşımdır?",
        "options": {
          "A": "Sadece olumlu örnek toplamak",
          "B": "Olumlu ve olumsuz etkileri kanıtlarla değerlendirmek",
          "C": "Olumsuz etkileri konuşmayı yasaklamak",
          "D": "Yalnız çok paylaşılan görüşü seçmek"
        },
        "answer": "B",
        "explanation": "Dengeli tartışma birden çok etkileri kanıt temelinde sorgular."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      5
    ],
    "sourceThemeId": "SB.5.6.1",
    "sourceUrl": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/405",
    "topicTags": [
      "Teknolojik gelişmelerin topluma etkileri"
    ]
  },
  {
    "id": "socialSB-6-2-1-v1",
    "version": 1,
    "subject": "Sosyal Bilgiler",
    "title": "Mutlak ve göreceli konum",
    "skill": "Türkiye'nin koordinat ve çevre ilişkilerine dayalı konum özelliklerini ayırma",
    "explanation": "Mutlak konum enlem ve boylamla ifade edilir. Göreceli konum ise bir yerin çevresindeki deniz, ülke, geçit ve ulaşım bağlantıları gibi ilişkilerine dayanır. Türkiye yaklaşık 36°–42° kuzey paralelleri ile 26°–45° doğu meridyenleri arasındadır.",
    "misconception": "Türkiye'nin denizlere komşuluğunu enlem-boylam bilgisi sanmak.",
    "worked": {
      "prompt": "'39°K 32°D koordinatında' ve 'Karadeniz'in güneyinde' ifadelerini karşılaştır.",
      "steps": [
        "Koordinatlardaki enlem ve boylamı fark et.",
        "Karadeniz'e göre verilen yer tarifinin çevresel ilişkiyi anlattığını belirle.",
        "İlki mutlak, ikincisi göreceli konuma örnektir."
      ],
      "answer": "İlki mutlak, ikincisi göreceli konum"
    },
    "exercises": [
      {
        "prompt": "Hangisi bir yerin mutlak konumunu ifade eder?",
        "options": {
          "A": "Akdeniz'in kuzeyinde olması",
          "B": "Başkentten iki saat uzaklıkta bulunması",
          "C": "Yakınında bir liman olması",
          "D": "38° kuzey, 30° doğu koordinatlarında olması"
        },
        "answer": "D",
        "explanation": "Enlem ve boylam birlikte mutlak konum bilgisini verir."
      },
      {
        "prompt": "Türkiye'nin üç tarafının denizlerle çevrili olması hangi konum türüyle açıklanır?",
        "options": {
          "A": "Mutlak konum",
          "B": "Göreceli konum",
          "C": "Yalnız boylam",
          "D": "Yalnız enlem"
        },
        "answer": "B",
        "explanation": "Denizlere göre bulunma çevresel ilişkidir; göreceli konumdur."
      },
      {
        "prompt": "Türkiye'nin bulunduğu enlem aralığına en uygun seçenek hangisidir?",
        "options": {
          "A": "36°–42° Kuzey",
          "B": "20°–25° Güney",
          "C": "0°–5° Güney",
          "D": "70°–80° Kuzey"
        },
        "answer": "A",
        "explanation": "Türkiye yaklaşık 36° ile 42° kuzey enlemleri arasında bulunur."
      },
      {
        "prompt": "'Avrupa ile Asya arasında ulaşım bağlantıları bulunması' hangi özelliğe örnektir?",
        "options": {
          "A": "Enlem ölçümünün değişmesi",
          "B": "Dünya'nın dönme yönü",
          "C": "Göreceli konumun ulaşım üzerindeki etkisi",
          "D": "Meridyenin paralel olması"
        },
        "answer": "C",
        "explanation": "Kıtalara ve ulaşım hatlarına göre konum ilişkisi göreceli konumdur."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      6
    ],
    "sourceThemeId": "SB.6.2.1",
    "sourceUrl": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/418",
    "topicTags": [
      "Mutlak ve göreceli konum"
    ]
  },
  {
    "id": "socialSB-6-2-2-v1",
    "version": 1,
    "subject": "Sosyal Bilgiler",
    "title": "Doğal ve beşerî çevre ilişkisi",
    "skill": "İklim ve yer şekillerinin yerleşme ile ilişkisini örnekle çözümleme",
    "explanation": "İklim, yükselti, su kaynakları ve yer şekilleri doğal çevre unsurlarıdır. Yerleşmeler, yollar ve ekonomik etkinlikler beşerî çevre unsurlarıdır. Aralarındaki ilişki tek nedenli değildir; verilen koşullara göre yorum yapılır.",
    "misconception": "Bir bölgede nüfusun yalnızca sıcaklıkla belirlendiğini düşünmek.",
    "worked": {
      "prompt": "Dağlık ve ulaşımın zor olduğu bir yörede yerleşimlerin az olması hangi ilişkiye işaret eder?",
      "steps": [
        "Dağlık alanın bir doğal çevre özelliği olduğunu belirle.",
        "Ulaşım ve yerleşmenin beşerî faaliyetler olduğunu ayır.",
        "Dağlık yapının ulaşım ve yerleşim kararlarını etkileyebileceğini gerekçelendir."
      ],
      "answer": "Doğal yer şekilleri beşerî yerleşme koşullarını etkileyebilir"
    },
    "exercises": [
      {
        "prompt": "Aşağıdakilerden hangisi doğal çevre unsurudur?",
        "options": {
          "A": "Karayolu köprüsü",
          "B": "Baraj yönetim binası",
          "C": "Dağ sırası",
          "D": "Sanayi sitesi"
        },
        "answer": "C",
        "explanation": "Dağ sırası doğal yer şeklidir."
      },
      {
        "prompt": "Bir ova çevresinde tarım ve yerleşimin gelişmesi hangi ilişkiye örnektir?",
        "options": {
          "A": "Doğal çevre koşullarının beşerî etkinlikleri etkilemesi",
          "B": "Tarımın iklimden bağımsız olması",
          "C": "Bütün ovaların aynı nüfusta olması",
          "D": "Beşerî çevrenin yokluğu"
        },
        "answer": "A",
        "explanation": "Düz arazi ve tarım elverişliliği beşerî kullanım üzerinde etkili olabilir."
      },
      {
        "prompt": "Aşağıdakilerden hangisi insanın doğal çevreyi değiştirmesine örnektir?",
        "options": {
          "A": "Kar yağışının artması",
          "B": "Güneşin doğması",
          "C": "Doğal bir dağın oluşması",
          "D": "Orman alanının yol yapımı nedeniyle azalması"
        },
        "answer": "D",
        "explanation": "Yol yapımı insan etkinliğidir ve çevreyi değiştirebilir."
      },
      {
        "prompt": "İki bölgede nüfus yoğunluğu farklıysa en bilimsel ilk yaklaşım hangisidir?",
        "options": {
          "A": "Yalnız yükseltiye bakıp kesin sonuç vermek",
          "B": "İklim, ulaşım, iş olanakları gibi farklı etkenleri birlikte incelemek",
          "C": "Yalnız haritanın rengini karşılaştırmak",
          "D": "Nüfus verisini hiç kullanmamak"
        },
        "answer": "B",
        "explanation": "Yerleşmenin dağılışında doğal ve beşerî çok sayıda etken birlikte rol oynar."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      6
    ],
    "sourceThemeId": "SB.6.2.2",
    "sourceUrl": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/418",
    "topicTags": [
      "Doğal ve beşerî çevre ilişkisi"
    ]
  },
  {
    "id": "socialSB-7-5-2-v1",
    "version": 1,
    "subject": "Sosyal Bilgiler",
    "title": "Üretim–dağıtım–tüketim döngüsü",
    "skill": "Bir ürünün üretim, dağıtım ve tüketim sürecini ekonomik koşullarla ilişkilendirme",
    "explanation": "Üretim mal veya hizmet oluşturmadır; dağıtım ürünün tüketiciye ulaştırılmasıdır; tüketim ihtiyaçları karşılamak amacıyla kullanımdır. Bu aşamalar birbirine bağlıdır. Altyapı ve ulaşım maliyeti döngünün işleyişini etkileyebilir.",
    "misconception": "Bir ürünün mağazaya taşınmasını üretim ya da tüketim olarak adlandırmak.",
    "worked": {
      "prompt": "Bir kooperatif elma yetiştiriyor, kamyonla şehre götürüyor, insanlar satın alıp yiyor. Aşamaları sınıflandır.",
      "steps": [
        "Elmayı yetiştirmek üretimdir.",
        "Kamyonla sevk etmek dağıtımdır.",
        "Satın alınıp yenmesi tüketimdir."
      ],
      "answer": "Üretim → dağıtım → tüketim"
    },
    "exercises": [
      {
        "prompt": "Bir süt işletmesinde peynir üretilmesi hangi aşamadır?",
        "options": {
          "A": "Tüketim",
          "B": "Üretim",
          "C": "Dağıtım",
          "D": "Reklam izleme"
        },
        "answer": "B",
        "explanation": "Sütten yeni bir ürün ortaya çıkarılması üretimdir."
      },
      {
        "prompt": "Peynirin soğutmalı araçla markete ulaştırılması hangi aşamadır?",
        "options": {
          "A": "Üretim",
          "B": "Tüketim",
          "C": "Dağıtım",
          "D": "Tasarruf"
        },
        "answer": "C",
        "explanation": "Ürünün pazara taşınması dağıtım sürecidir."
      },
      {
        "prompt": "Bir bölgede yolların kapanması, diğer koşullar sabitken hangi sorunu doğrudan artırabilir?",
        "options": {
          "A": "Ürünü pazara ulaştırma güçlüğünü",
          "B": "Tarım ürünlerinin fotosentez hızını",
          "C": "Güneş ışığının süresini",
          "D": "Tüketicilerin boyunu"
        },
        "answer": "A",
        "explanation": "Ulaşım kesintileri dağıtım maliyetini ve süresini artırabilir."
      },
      {
        "prompt": "Ekonomik döngünün aşamaları için doğru sıralama hangisidir?",
        "options": {
          "A": "Tüketim–üretim–dağıtım",
          "B": "Dağıtım–tüketim–üretim",
          "C": "Tüketim–dağıtım–üretim",
          "D": "Üretim–dağıtım–tüketim"
        },
        "answer": "D",
        "explanation": "Mal önce üretilir, dağıtılır, sonra tüketici tarafından kullanılır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      7
    ],
    "sourceThemeId": "SB.7.5.2",
    "sourceUrl": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/427",
    "topicTags": [
      "Üretim–dağıtım–tüketim döngüsü"
    ]
  },
  {
    "id": "socialSB-7-6-1-v1",
    "version": 1,
    "subject": "Sosyal Bilgiler",
    "title": "Teknolojinin geleceğe etkisine ilişkin öngörü",
    "skill": "Gözlem ve kanıttan hareketle koşullu teknolojik gelecek senaryosu kurma",
    "explanation": "Öngörü, geleceği kesin bilmek değildir. Bugünkü veri, değişim eğilimi, varsayım ve belirsizlikleri birlikte kullanarak gerekçeli bir olasılık ifade etmektir. Farklı toplumsal gruplar üzerindeki etkiler ayrı incelenmelidir.",
    "misconception": "Bir teknolojinin yaygınlaşmasının kesinlikle bütün meslekleri ortadan kaldıracağını düşünmek.",
    "worked": {
      "prompt": "Bir kentte uzaktan sağlık danışma hizmeti artıyor. Gelecekte nasıl bir öngörü kurulabilir?",
      "steps": [
        "Verilen eğilimi belirle: uzaktan görüşme artıyor.",
        "Olası katkıyı seç: kimi hastaların erişimi kolaylaşabilir.",
        "Belirsizliği ekle: internet ve dijital beceri farklılıkları sonucu değiştirebilir."
      ],
      "answer": "Erişim artabilir; dijital eşitsizlikler etkileyebilir"
    },
    "exercises": [
      {
        "prompt": "Gelecekte teknolojinin toplumsal etkisini öngörürken hangisi bilimsel yaklaşıma uygundur?",
        "options": {
          "A": "Her şeyin kesin gerçekleşeceğini söylemek",
          "B": "Tek bir reklamı veri saymak",
          "C": "Veri, varsayım ve belirsizlikleri birlikte açıklamak",
          "D": "Kanıta bakmadan korkutucu senaryo seçmek"
        },
        "answer": "C",
        "explanation": "Öngörü kanıtlara ve koşullara dayalı olmalı; belirsizlikler belirtilmelidir."
      },
      {
        "prompt": "Akıllı ulaşım sistemleri yaygınlaşırsa hangisi koşullu ve gerekçeli öngörüdür?",
        "options": {
          "A": "Doğru planlanırsa bazı yollarda trafik süresi azalabilir",
          "B": "Trafik tüm dünyada kesin sona erer",
          "C": "Hiçbir altyapıya ihtiyaç kalmaz",
          "D": "Her ulaşım aracı aynı olur"
        },
        "answer": "A",
        "explanation": "Altyapı ve uygulama koşullarını belirtmek öngörüyü makul kılar."
      },
      {
        "prompt": "Bir teknolojinin etkisini değerlendirirken farklı yaş gruplarının ele alınması neden önemlidir?",
        "options": {
          "A": "Bütün gruplar aynı cihazı kullanır",
          "B": "Her grubun aynı geliri vardır",
          "C": "Teknolojiler yaşla ilgisizdir",
          "D": "Erişim, ihtiyaç ve kullanım biçimleri değişebilir"
        },
        "answer": "D",
        "explanation": "Toplumsal etkiler farklı kullanıcı koşullarına göre değişebilir."
      },
      {
        "prompt": "'Yapay zekâ kullanımı artarsa bazı işler dönüşebilir; eğitim olanakları sonucu etkiler.' cümlesinin gücü nedir?",
        "options": {
          "A": "Kesin ve kanıtsız evrensel sonuç vermesi",
          "B": "Koşulları ve olası sonuçları ayrıştırması",
          "C": "Teknolojinin bütün etkilerini yok sayması",
          "D": "Değişimin imkânsız olduğunu söylemesi"
        },
        "answer": "B",
        "explanation": "Koşullu öngörü, değişimi ve etkileyen faktörleri birlikte ele alır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      7
    ],
    "sourceThemeId": "SB.7.6.1",
    "sourceUrl": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/428",
    "topicTags": [
      "Teknolojinin geleceğe etkisine ilişkin öngörü"
    ]
  }
];
