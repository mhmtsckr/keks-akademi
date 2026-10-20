/** Original KEKS TYMM history micro lessons, not copied from MEB/ÖSYM. Human editorial review pending. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const GRADE911_HISTORY_PILOTS:readonly MicroLesson[]=[
  {
    "id": "hist9-source-context-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "Tarihsel kaynak türü ve bağlamını inceleme",
    "skill": "Birincil ve ikincil tarihsel kaynağı bağlamıyla değerlendirme",
    "explanation": "Tarihsel kaynak değerlendirilirken belgenin kim tarafından, ne zaman ve hangi amaçla oluşturulduğu incelenir. Olay dönemine ait kayıt birincil kaynak olabilir; daha sonra kanıtları inceleyen araştırma ikincil kaynaktır. İkisi de eleştirel okunmalıdır.",
    "misconception": "Birincil kaynağın mutlaka tarafsız ve eksiksiz olduğunu sanmak.",
    "worked": {
      "prompt": "1912 yılında yazılmış bir mektupla 2020 yılında yayımlanan, o mektubu inceleyen tarih kitabı hangi bakımdan ayrılır?",
      "steps": [
        "Mektup incelenen dönemde doğrudan oluşturulmuştur.",
        "Kitap daha sonra kaynakları yorumlayarak yazılmıştır.",
        "Mektup birincil, kitap ikincil kaynak örneğidir; ikisinin de bağlamı sorgulanmalıdır."
      ],
      "answer": "Mektup birincil, araştırma kitabı ikincil kaynak örneğidir."
    },
    "exercises": [
      {
        "prompt": "Bir olaya tanıklık eden kişinin olay günü tuttuğu günlük hangi kaynak türüne örnektir?",
        "options": {
          "A": "İkincil derleme",
          "B": "Birincil kaynak",
          "C": "Yorum sözlüğü",
          "D": "Tarih romanı"
        },
        "answer": "B",
        "explanation": "Olay sırasında tutulan günlük, döneme ait birincil kanıt olabilir."
      },
      {
        "prompt": "Bir mektubun tarihsel yorumunu yaparken hangisi önemlidir?",
        "options": {
          "A": "Sadece kâğıdın rengi",
          "B": "Yalnız uzunluğu",
          "C": "Yazar, tarih ve yazılma amacı",
          "D": "Metindeki satır sayısı"
        },
        "answer": "C",
        "explanation": "Kaynağın üretim bağlamı, ifadelerin nasıl yorumlanacağını etkiler."
      },
      {
        "prompt": "Birincil kaynakla ilgili hangi ifade doğrudur?",
        "options": {
          "A": "Taraflı olabileceği için başka kanıtlarla karşılaştırılmalıdır",
          "B": "Her zaman bütünüyle nesneldir",
          "C": "Hiç sorgulanmamalıdır",
          "D": "Yalnız günümüzde yazılır"
        },
        "answer": "A",
        "explanation": "Birincil kaynaklar döneme yakın olsa da seçici veya taraflı olabilir."
      },
      {
        "prompt": "Geçmişe ilişkin farklı iki kaynağın aynı olayı değişik anlatması karşısında ne yapılmalıdır?",
        "options": {
          "A": "Birini rastgele seçmek",
          "B": "Her ikisini reddetmek",
          "C": "Sadece kısa olanı kullanmak",
          "D": "Kaynakların bağlamını ve dayanaklarını karşılaştırmak"
        },
        "answer": "D",
        "explanation": "Tarihsel yorum birden fazla kaynağı eleştirel biçimde karşılaştırmayı gerektirir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Tarihsel kaynak türü ve bağlamını inceleme"
    ],
    "sourceThemeId": "TAR.9.1.2",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/26"
  },
  {
    "id": "hist9-evidence-process-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "Tarihsel araştırmanın kanıt zinciri",
    "skill": "Araştırma sorusundan kanıta dayalı sonuca giden adımları ayırt etme",
    "explanation": "Tarihsel bilgi üretiminde araştırma sorusu belirlenir, kaynak toplanır, kaynakların kökeni ve güvenilirliği sorgulanır, veriler yorumlanır ve kanıta dayalı sonuç oluşturulur. Sonuçlar yeni kanıtlarla yeniden değerlendirilebilir.",
    "misconception": "Önce kesin hüküm verip yalnız bu hükmü destekleyen kaynakları seçmeyi araştırma sanmak.",
    "worked": {
      "prompt": "Bir araştırmacı ‘Bir mahallede ulaşım neden değişti?’ sorusunu soruyor. Harita ve gazete kayıtlarını topladıktan sonra ne yapmalıdır?",
      "steps": [
        "Önce araştırma sorusuyla kaynakların ilişkisini kontrol eder.",
        "Kayıtların tarihini, yazarı ve olası eksiklerini inceler.",
        "Kanıtları karşılaştırarak gerekçeli, sınırları açık bir sonuca ulaşır."
      ],
      "answer": "Kaynakları eleştirel sorgulayıp kanıta dayalı yorumlamak"
    },
    "exercises": [
      {
        "prompt": "Tarihsel araştırmada ilk amaç aşağıdakilerden hangisidir?",
        "options": {
          "A": "Araştırılabilir sorunu belirlemek",
          "B": "Önceden kesin hüküm yazmak",
          "C": "Tüm farklı kanıtları gizlemek",
          "D": "Kaynağı okumadan yayımlamak"
        },
        "answer": "A",
        "explanation": "Araştırma sorusu hangi kanıtların aranacağını belirler."
      },
      {
        "prompt": "Bir belgenin ait olduğu dönemle uyumlu olup olmadığını kontrol etmek hangi aşamaya örnektir?",
        "options": {
          "A": "Sonuç ezberleme",
          "B": "Reklam hazırlama",
          "C": "Kaynak sorgulama",
          "D": "Yarışma planlama"
        },
        "answer": "C",
        "explanation": "Belgenin özgünlüğü ve tarihlenmesi kaynak eleştirisinin parçasıdır."
      },
      {
        "prompt": "İki kayıt birbiriyle çelişiyorsa tarihçi ne yapmalıdır?",
        "options": {
          "A": "Birini silmek",
          "B": "Bağımsız ek kanıt aramak",
          "C": "Çelişkiyi görmezden gelmek",
          "D": "Sadece popüler olanı kullanmak"
        },
        "answer": "B",
        "explanation": "Çelişkiler yeni kanıt ve bağlam kontrolüyle araştırılır."
      },
      {
        "prompt": "Kanıta dayalı tarihsel ürünün temel özelliği hangisidir?",
        "options": {
          "A": "Kaynak göstermemesi",
          "B": "Bütün olayları kesin açıklaması",
          "C": "Yalnız kişisel kanaat içermesi",
          "D": "İddialarını ilgili kanıtlarla desteklemesi"
        },
        "answer": "D",
        "explanation": "Tarihsel iddiaların gerekçesi ve kaynakları görünür olmalıdır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Tarihsel araştırmanın kanıt zinciri"
    ],
    "sourceThemeId": "TAR.9.1.3",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/26"
  },
  {
    "id": "hist10-battles-chronology-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "1040–1299 askerî mücadeleleri tarih şeridinde",
    "skill": "Dandanakan, Malazgirt, Miryokefalon ve Kösedağ gelişmelerini kronoloji ile karşılaştırma",
    "explanation": "Dandanakan Savaşı 1040'ta, Malazgirt Savaşı 1071'de, Miryokefalon Savaşı 1176'da, Kösedağ Savaşı 1243'te gerçekleşmiştir. Tarih şeridi olayların önce–sonra ilişkisini görmeye yarar; etkileri karşılaştırmak ayrıca tarihsel kanıt gerektirir.",
    "misconception": "Olayların yalnız yıllarını bilmenin neden ve sonuçlarını açıklamak için yeterli olduğunu düşünmek.",
    "worked": {
      "prompt": "1040, 1071, 1176 ve 1243 tarihli mücadeleler için hangi sıralama doğrudur?",
      "steps": [
        "1040 Dandanakan'ı ilk konumuna yerleştir.",
        "1071 Malazgirt ve 1176 Miryokefalon'u sırala.",
        "1243 Kösedağ'ı son sıraya koy."
      ],
      "answer": "Dandanakan → Malazgirt → Miryokefalon → Kösedağ"
    },
    "exercises": [
      {
        "prompt": "Hangisi kronolojik olarak en önce gerçekleşmiştir?",
        "options": {
          "A": "Miryokefalon",
          "B": "Kösedağ",
          "C": "Dandanakan",
          "D": "Malazgirt"
        },
        "answer": "C",
        "explanation": "Dandanakan 1040'ta gerçekleşmiştir; diğerleri daha sonradır."
      },
      {
        "prompt": "1071 yılında gerçekleşen mücadele hangisidir?",
        "options": {
          "A": "Malazgirt",
          "B": "Dandanakan",
          "C": "Kösedağ",
          "D": "Miryokefalon"
        },
        "answer": "A",
        "explanation": "Malazgirt Savaşı 1071'de gerçekleşmiştir."
      },
      {
        "prompt": "Miryokefalon (1176) ile Kösedağ (1243) arasındaki kronolojik ilişki hangisidir?",
        "options": {
          "A": "Kösedağ daha öncedir",
          "B": "Aynı yıldadır",
          "C": "Aralarında yüzlerce yıl vardır",
          "D": "Miryokefalon daha öncedir"
        },
        "answer": "D",
        "explanation": "1176, 1243'ten küçüktür; Miryokefalon önce gerçekleşir."
      },
      {
        "prompt": "Aşağıdaki çiftlerden hangisi önce–sonra biçiminde doğru verilmiştir?",
        "options": {
          "A": "Kösedağ → Malazgirt",
          "B": "Dandanakan → Malazgirt",
          "C": "Miryokefalon → Dandanakan",
          "D": "Kösedağ → Miryokefalon"
        },
        "answer": "B",
        "explanation": "Dandanakan (1040), Malazgirt'ten (1071) öncedir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      10
    ],
    "topicTags": [
      "1040–1299 askerî mücadeleleri tarih şeridinde"
    ],
    "sourceThemeId": "TAR.10.1.1",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/36"
  },
  {
    "id": "hist10-institutions-continuity-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "Devlet ve ordu teşkilatında değişim ve süreklilik",
    "skill": "Kurumların işlevindeki sürekliliği ve örgütlenmedeki değişimi kanıttan ayırt etme",
    "explanation": "Tarihsel kurumları karşılaştırırken aynı kalan işlevler ile değişen kurallar, personel ve örgütlenme yöntemleri ayrılmalıdır. Farklı çağlardaki iki kurumun benzer görevi olması bunların bütünüyle aynı yapıda olduğu anlamına gelmez.",
    "misconception": "Kurum adlarının farklı olmasını bütün işlevlerin değiştiği veya görev benzerliğini tam özdeşlik saymak.",
    "worked": {
      "prompt": "A döneminde danışma kurulu kararlara yardımcı oluyor; B döneminde kurulu oluşturan kişiler değişse de danışma işlevi sürüyor. Ne söylenebilir?",
      "steps": [
        "İki dönemde sürdürülen işlevi belirle: danışma.",
        "Değişeni belirle: kurulun üyeleri ve örgütlenmesi.",
        "İşlevde süreklilik, örgütlenmede değişim vardır."
      ],
      "answer": "Danışma işlevi devam etmiş, kurulun yapısı değişmiştir."
    },
    "exercises": [
      {
        "prompt": "İki farklı dönemde orduya asker yetiştirme amacı sürüyor ama yetiştirme yöntemi değişiyorsa hangi yorum doğrudur?",
        "options": {
          "A": "Hiçbir şey değişmemiştir",
          "B": "Amaçta süreklilik, yöntemde değişim vardır",
          "C": "Kurallar her dönemde aynıdır",
          "D": "Ordu tamamen ortadan kalkmıştır"
        },
        "answer": "B",
        "explanation": "Aynı amaç devam ederken kurumsal yöntemler değişebilir."
      },
      {
        "prompt": "Tarihsel kurum karşılaştırmasında en sağlam yaklaşım hangisidir?",
        "options": {
          "A": "Yalnız kurum adlarına bakmak",
          "B": "Sadece tek dönemi okumak",
          "C": "İşlev, yapı ve bağlamı birlikte incelemek",
          "D": "Bütün değişimi kötü saymak"
        },
        "answer": "C",
        "explanation": "Değişim ve süreklilik kuruma ilişkin çok boyutlu verilerle değerlendirilir."
      },
      {
        "prompt": "Bir kurumun iki dönemde de adalet hizmeti sunması hangi kavrama örnektir?",
        "options": {
          "A": "İşlevsel süreklilik",
          "B": "Tamamen yok oluş",
          "C": "Kesin özdeş örgütlenme",
          "D": "Yalnız askerî dönüşüm"
        },
        "answer": "A",
        "explanation": "İşlevin sürmesi kurumsal devamlılığın bir yönüdür."
      },
      {
        "prompt": "Hangi bulgu kurumsal değişimi en doğrudan destekler?",
        "options": {
          "A": "İki metnin aynı kâğıda yazılması",
          "B": "İki yılda hava sıcaklığının değişmesi",
          "C": "Kurum binasının resminin bulunması",
          "D": "Karar alma yetkisinin farklı birime devredilmesi"
        },
        "answer": "D",
        "explanation": "Yetkinin başka birime geçmesi örgütlenmede somut değişimdir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      10
    ],
    "topicTags": [
      "Devlet ve ordu teşkilatında değişim ve süreklilik"
    ],
    "sourceThemeId": "TAR.10.1.2",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/36"
  },
  {
    "id": "hist11-earthquake-source-comparison-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "İki tarihsel depremin etkilerini kaynakla karşılaştırma",
    "skill": "1755 Lizbon ile 1766 İstanbul depremlerini karşılaştırırken kanıt ve yorum ayrımı yapma",
    "explanation": "1755 Lizbon ve 1766 İstanbul depremleri ayrı zaman ve toplum bağlamlarında değerlendirilmelidir. Etki karşılaştırmasında barınma, yönetim, ekonomi gibi ortak ölçütler kullanılır; belgenin söylemediği hasar veya can kaybı rakamları uydurulmaz.",
    "misconception": "Kaynakların birinde bulunmayan bilgiyi diğerinde de kesinlikle yaşanmadı diye yorumlamak.",
    "worked": {
      "prompt": "Bir çalışma tablosunda Lizbon için barınma sorunu kayıtları, İstanbul için yapı onarım kayıtları bulunuyor. Hangi sonuç çıkarılabilir?",
      "steps": [
        "Her kaynağın açıkça belirttiği etkiyi kaydet.",
        "Kaynakların kapsamlarının aynı olmadığını fark et.",
        "Her iki toplumun etkilerini kesin derecelendirmek için aynı ölçütlerde ek kaynağa ihtiyaç olduğunu belirt."
      ],
      "answer": "Karşılaştırma için eşdeğer kapsamda ek kaynak gerekir."
    },
    "exercises": [
      {
        "prompt": "1755 Lizbon ile 1766 İstanbul depremlerini adil karşılaştırmak için hangi ölçüt takımı uygundur?",
        "options": {
          "A": "Yalnız kent adlarının harf sayısı",
          "B": "Yalnız tek bir resim",
          "C": "Barınma, yönetim ve ekonomik etkiler",
          "D": "Hangi deprem daha ünlüdür sorusu"
        },
        "answer": "C",
        "explanation": "Aynı toplumsal ölçütler iki olay için kaynaklı karşılaştırma imkânı verir."
      },
      {
        "prompt": "Bir kaynak yalnızca yapı onarımını anlatıyorsa hangi yargı doğru değildir?",
        "options": {
          "A": "Toplumsal etkilerin kesinlikle bulunmadığı",
          "B": "Yapı onarımı hakkında bilgi verildiği",
          "C": "Belgenin sınırlı kapsamlı olabileceği",
          "D": "Diğer kaynaklarla karşılaştırılması gerektiği"
        },
        "answer": "A",
        "explanation": "Bir konuda suskun kalmak o etkinin bulunmadığını kanıtlamaz."
      },
      {
        "prompt": "1755 ile 1766 yılları arasındaki kronolojik ilişki nedir?",
        "options": {
          "A": "Aynı yıldır",
          "B": "1766 önce gelir",
          "C": "Aralarında yüz yıl vardır",
          "D": "1755, 1766'dan öncedir"
        },
        "answer": "D",
        "explanation": "1755, 1766'dan on bir yıl öncedir."
      },
      {
        "prompt": "Deprem sonrası idarî kararların toplum üzerindeki etkisini incelerken en uygun yöntem nedir?",
        "options": {
          "A": "Tek bir söylentiye dayanmak",
          "B": "Resmî kayıtları ve dönemin farklı tanıklıklarını karşılaştırmak",
          "C": "Tarihi kaynakları görmezden gelmek",
          "D": "Yalnız modern bir afişe bakmak"
        },
        "answer": "B",
        "explanation": "Farklı kaynaklar karşılaştırılarak daha dengeli bir tarihsel yorum yapılabilir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      11
    ],
    "topicTags": [
      "İki tarihsel depremin etkilerini kaynakla karşılaştırma"
    ],
    "sourceThemeId": "TAR.11.1.3",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/68"
  },
  {
    "id": "hist11-industrial-revolution-effects-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "Sanayi Devrimi'nin çok yönlü neden ve sonuçları",
    "skill": "Sanayileşmenin ekonomik, toplumsal ve çevresel etkilerini olumlu-olumsuz gerekçelerle değerlendirme",
    "explanation": "Makineleşme ve fabrika üretiminin yaygınlaşması üretim örgütlenmesini, kentleşmeyi ve emek ilişkilerini değiştirdi. Üretim kapasitesi artışı bir sonuçken düzensiz kentleşme veya kirlilik gibi olumsuzluklar da tarihsel bağlamda değerlendirilebilir.",
    "misconception": "Sanayi Devrimi'nin bütün toplumlar için yalnızca yararlı veya yalnızca zararlı sonuçlar doğurduğunu sanmak.",
    "worked": {
      "prompt": "Fabrika üretimi çoğaldıkça bir kentte iş imkânı ve hava kirliliği artıyor. Bu gözlem nasıl değerlendirilir?",
      "steps": [
        "Ekonomik sonucu belirle: yeni iş ve üretim olanakları.",
        "Çevresel sonucu belirle: hava kirliliği artışı.",
        "Aynı dönüşümün farklı alanlarda olumlu ve olumsuz etkileri olabileceği sonucuna ulaş."
      ],
      "answer": "Ekonomik fırsat ve çevresel maliyet birlikte görülebilir."
    },
    "exercises": [
      {
        "prompt": "Sanayi Devrimi'nin ekonomik dönüşümünde hangisi önemlidir?",
        "options": {
          "A": "El emeğinin tümüyle aynı kalması",
          "B": "Fabrika ve makine kullanımının yaygınlaşması",
          "C": "Üretim araçlarının tamamen ortadan kalkması",
          "D": "Bütün ticaretin durması"
        },
        "answer": "B",
        "explanation": "Makineleşme ve fabrika üretimi ekonomik örgütlenmeyi değiştirdi."
      },
      {
        "prompt": "Sanayileşmeyle artan kent nüfusu hangi alanı doğrudan etkileyebilir?",
        "options": {
          "A": "Geçmiş olayların tarihini",
          "B": "Güneş'in yörüngesini",
          "C": "Konut, altyapı ve çalışma koşullarını",
          "D": "Gezegenlerin yapısını"
        },
        "answer": "C",
        "explanation": "Kentleşme barınma, ulaşım ve çalışma yaşamında değişikliklere yol açabilir."
      },
      {
        "prompt": "Sanayileşmenin çevresel sonuçlarından biri hangi örnekte verilmiştir?",
        "options": {
          "A": "Fosil yakıt kullanımıyla hava kirliliğinin artması",
          "B": "Eski bir belgenin bulunması",
          "C": "Takvimde yıl değişmesi",
          "D": "Bir haritanın yeniden çizilmesi"
        },
        "answer": "A",
        "explanation": "Yakıt tüketimi ve yoğun üretim bazı yerlerde çevresel kirliliği artırdı."
      },
      {
        "prompt": "Sanayi Devrimi hakkında dengeli tarihsel yorum hangisidir?",
        "options": {
          "A": "Her sonuç bütün ülkelerde aynıdır",
          "B": "Yalnızca iş imkânı yaratmıştır",
          "C": "Yalnızca kentleri küçültmüştür",
          "D": "Üretim artışıyla birlikte yeni emek ve çevre sorunları da ortaya çıkmıştır"
        },
        "answer": "D",
        "explanation": "Olumlu ve olumsuz etkiler aynı süreçte, farklı toplumlarda farklı biçimde ortaya çıkmıştır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      11
    ],
    "topicTags": [
      "Sanayi Devrimi'nin çok yönlü neden ve sonuçları"
    ],
    "sourceThemeId": "TAR.11.1.4",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/68"
  }
];
