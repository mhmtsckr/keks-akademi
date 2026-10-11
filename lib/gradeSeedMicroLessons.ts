/**
 * Original grade-specific *pilot* teaching materials for 2026–27.
 * All topic tags are KEKS descriptors; no official MEB acquisition ID is asserted.
 * A learner's exact grade is required before a lesson can be assigned.
 */
import type {MicroLesson} from './bankFreeMicroLessons';

export const GRADE_SEED_LESSONS:readonly MicroLesson[]=[
  {
    "id": "grade1-vowels-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Sesli harfleri tanıma",
    "skill": "Kelime içindeki ünlü harfleri ayırt etme",
    "targetGrades": [
      1
    ],
    "topicTags": [
      "Harf ve Ses Bilgisi"
    ],
    "contentStatus": "PILOT",
    "explanation": "Ünlü (sesli) harfler a, e, ı, i, o, ö, u, ü'dür. Bir kelimede ünlü harfleri tek tek sayabilirsin.",
    "misconception": "Kelimenin bütün harflerini ünlü sanmak.",
    "worked": {
      "prompt": "“masa” kelimesinde kaç ünlü harf vardır?",
      "steps": [
        "m-a-s-a şeklinde harfleri ayır.",
        "a ve a sesli harflerdir.",
        "İki ünlü harf bulunur."
      ],
      "answer": "2"
    },
    "exercises": [
      {
        "prompt": "“kedi” kelimesinde kaç ünlü harf vardır?",
        "options": {
          "A": "1",
          "B": "2",
          "C": "3",
          "D": "4"
        },
        "answer": "B",
        "explanation": "e ve i ünlü harflerdir."
      },
      {
        "prompt": "“okul” kelimesinde kaç ünlü harf vardır?",
        "options": {
          "A": "1",
          "B": "2",
          "C": "4",
          "D": "3"
        },
        "answer": "B",
        "explanation": "o ve u olmak üzere iki ünlü vardır."
      },
      {
        "prompt": "“arı” kelimesinde kaç ünlü harf vardır?",
        "options": {
          "A": "2",
          "B": "1",
          "C": "3",
          "D": "4"
        },
        "answer": "A",
        "explanation": "a ve ı ünlü harflerdir."
      },
      {
        "prompt": "“elma” kelimesinde kaç ünlü harf vardır?",
        "options": {
          "A": "4",
          "B": "3",
          "C": "1",
          "D": "2"
        },
        "answer": "D",
        "explanation": "e ve a iki ünlü harftir."
      }
    ]
  },
  {
    "id": "grade2-two-digit-addition-v1",
    "version": 1,
    "subject": "Matematik",
    "title": "Onluk ve birliklerle toplama",
    "skill": "İki basamaklı doğal sayılarla toplama yapma",
    "targetGrades": [
      2
    ],
    "topicTags": [
      "Doğal Sayılarla Toplama"
    ],
    "contentStatus": "PILOT",
    "explanation": "Önce birlikleri sonra onlukları toplayabilirsin. Birlik toplamı 10'u geçerse onluğa aktarılır.",
    "misconception": "Birlikler toplanınca oluşan yeni onluğu atlamak.",
    "worked": {
      "prompt": "27 + 15 işlemi kaç eder?",
      "steps": [
        "7 + 5 = 12 birlik, yani 1 onluk 2 birlik.",
        "2 onluk + 1 onluk + eldeki 1 onluk = 4 onluk.",
        "Sonuç 42'dir."
      ],
      "answer": "42"
    },
    "exercises": [
      {
        "prompt": "24 + 13 = ?",
        "options": {
          "A": "36",
          "B": "37",
          "C": "38",
          "D": "39"
        },
        "answer": "B",
        "explanation": "4 + 3 = 7; 20 + 10 = 30; toplam 37."
      },
      {
        "prompt": "36 + 25 = ?",
        "options": {
          "A": "51",
          "B": "71",
          "C": "61",
          "D": "60"
        },
        "answer": "C",
        "explanation": "6 + 5 = 11; 3 + 2 + 1 = 6 onluk; sonuç 61."
      },
      {
        "prompt": "42 + 16 = ?",
        "options": {
          "A": "56",
          "B": "57",
          "C": "59",
          "D": "58"
        },
        "answer": "D",
        "explanation": "2 + 6 = 8; 4 + 1 = 5 onluk; 58."
      },
      {
        "prompt": "18 + 12 = ?",
        "options": {
          "A": "30",
          "B": "29",
          "C": "31",
          "D": "32"
        },
        "answer": "A",
        "explanation": "8 + 2 = 10 birlik; 1 + 1 + 1 = 3 onluk; 30."
      }
    ]
  },
  {
    "id": "grade3-safe-crossing-v1",
    "version": 1,
    "subject": "Hayat Bilgisi",
    "title": "Yaya olarak güvenli hareket",
    "skill": "Yaya geçişinde temel güvenlik davranışlarını seçme",
    "targetGrades": [
      3
    ],
    "topicTags": [
      "Güvenli Hayat"
    ],
    "contentStatus": "PILOT",
    "explanation": "Karşıya geçmeden önce uygun yaya geçidi veya işaretli geçiş yeri seçilir; trafik ışıklarına uyulur ve araçların durduğundan emin olunur.",
    "misconception": "Yaya geçidinde olmanın araçların kesinlikle duracağı anlamına geldiğini düşünmek.",
    "worked": {
      "prompt": "Yaya ışığı yeşilken karşıya geçmeden önce ne yapılır?",
      "steps": [
        "Önce güvenli ve işaretli geçiş alanını seç.",
        "Çevreyi kontrol ederek araçların durduğundan emin ol.",
        "Sonra dikkatle yürüyerek karşıya geç."
      ],
      "answer": "Çevreyi kontrol edip araçların durduğundan emin olmak"
    },
    "exercises": [
      {
        "prompt": "Karşıya geçmek için en uygun yer hangisidir?",
        "options": {
          "A": "Yaya geçidi",
          "B": "Viraj içi",
          "C": "Park etmiş araçların arası",
          "D": "Yolun görünmeyen bölümü"
        },
        "answer": "A",
        "explanation": "Yaya geçidi uygun işaretli geçiş alanıdır."
      },
      {
        "prompt": "Yaya ışığı kırmızıysa ne yapılmalıdır?",
        "options": {
          "A": "Koşarak geçilir",
          "B": "Yola adım atılır",
          "C": "Güvenli yerde beklenir",
          "D": "Telefonla yürünür"
        },
        "answer": "C",
        "explanation": "Kırmızı yaya ışığı geçiş yapılmaması gerektiğini bildirir."
      },
      {
        "prompt": "Yaya geçidinde araç durmuyorsa ne yapılır?",
        "options": {
          "A": "Hızla önüne çıkılır",
          "B": "Araç duruncaya kadar beklenir",
          "C": "Arkasından koşulur",
          "D": "Gözler kapatılır"
        },
        "answer": "B",
        "explanation": "Geçişe başlamadan araçların durduğundan emin olunmalıdır."
      },
      {
        "prompt": "Yolu geçerken dikkat dağıtan hangisinden kaçınılmalıdır?",
        "options": {
          "A": "Etrafa bakmak",
          "B": "Araçları kontrol etmek",
          "C": "İşaretlere uymak",
          "D": "Telefona bakarak yürümek"
        },
        "answer": "D",
        "explanation": "Telefona bakmak çevre farkındalığını azaltır."
      }
    ]
  },
  {
    "id": "grade4-state-of-matter-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Katı, sıvı ve gaz",
    "skill": "Maddenin hâllerini temel özellikleriyle ayırma",
    "targetGrades": [
      4
    ],
    "topicTags": [
      "Maddenin Halleri"
    ],
    "contentStatus": "PILOT",
    "explanation": "Katıların belirli şekli vardır. Sıvılar içinde bulundukları kabın şeklini alır; gazlar kapladıkları alanı dolduracak şekilde yayılır.",
    "misconception": "Sıvıların her zaman belirli bir şekli olduğunu sanmak.",
    "worked": {
      "prompt": "Su bir bardaktan kâseye dökülürse şekli nasıl değişir?",
      "steps": [
        "Su sıvı hâldedir.",
        "Sıvı, konulduğu kabın şeklini alır.",
        "Kâseye dökülen su kâsenin şeklini alır."
      ],
      "answer": "Kabın şeklini alır"
    },
    "exercises": [
      {
        "prompt": "Hangisi oda koşullarında gazdır?",
        "options": {
          "A": "Taş",
          "B": "Tahta",
          "C": "Hava",
          "D": "Demir"
        },
        "answer": "C",
        "explanation": "Hava farklı gazlardan oluşan bir karışımdır."
      },
      {
        "prompt": "Hangisi katının özelliğidir?",
        "options": {
          "A": "Belirli şekli vardır",
          "B": "Her kabın şeklini alır",
          "C": "Her yana yayılır",
          "D": "Yalnız görünmez olur"
        },
        "answer": "A",
        "explanation": "Katıların belirli bir şekli vardır."
      },
      {
        "prompt": "Su başka kaba dökülürse genellikle ne değişir?",
        "options": {
          "A": "Maddesi",
          "B": "Şekli",
          "C": "Atom türü",
          "D": "Kaynama noktası kesin değişir"
        },
        "answer": "B",
        "explanation": "Sıvı, yeni kabın şeklini alır."
      },
      {
        "prompt": "Aşağıdakilerden hangisi oda koşullarında sıvıdır?",
        "options": {
          "A": "Taş",
          "B": "Buz",
          "C": "Hava",
          "D": "Zeytinyağı"
        },
        "answer": "D",
        "explanation": "Zeytinyağı oda koşullarında sıvıdır."
      }
    ]
  },
  {
    "id": "grade5-friction-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Sürtünme kuvvetinin etkileri",
    "skill": "Sürtünmenin hareket ve yüzeyle ilişkisini yorumlama",
    "targetGrades": [
      5
    ],
    "topicTags": [
      "Kuvvet ve Sürtünme"
    ],
    "contentStatus": "PILOT",
    "explanation": "Sürtünme, temas eden yüzeyler arasındaki göreli harekete karşı koyabilir. Kaymaz ayakkabı tabanı tutunmayı kolaylaştırabilir.",
    "misconception": "Sürtünmenin her zaman yararsız olduğunu düşünmek.",
    "worked": {
      "prompt": "Neden buzda yürümek kuru zeminde yürümekten zor olabilir?",
      "steps": [
        "İki yüzey arasında tutunmayı incele.",
        "Buzda uygun koşullarda tutunma azalır.",
        "Bu yüzden kayma tehlikesi artabilir."
      ],
      "answer": "Tutunmanın azalması"
    },
    "exercises": [
      {
        "prompt": "Yüzeylerden hangisi aynı koşullarda daha fazla tutunma sağlayabilir?",
        "options": {
          "A": "Buz",
          "B": "Çok kaygan plastik",
          "C": "Pürüzlü kauçuk",
          "D": "Yağlı metal"
        },
        "answer": "C",
        "explanation": "Pürüzlü kauçuk uygun koşullarda tutunmayı artırabilir."
      },
      {
        "prompt": "Bisiklet freninin yavaşlatma etkisinde hangi kuvvet önemlidir?",
        "options": {
          "A": "Sürtünme",
          "B": "Kaldırma",
          "C": "Elektrik",
          "D": "Manyetizma"
        },
        "answer": "A",
        "explanation": "Fren temasında sürtünme hareketi yavaşlatmaya yardım eder."
      },
      {
        "prompt": "Islak zeminde neden dikkatli yürünür?",
        "options": {
          "A": "Yerçekimi yok olur",
          "B": "Tutunma azalabilir",
          "C": "Ayak daha ağırlaşır",
          "D": "Hava kaybolur"
        },
        "answer": "B",
        "explanation": "Bazı ıslak yüzeylerde tutunma azalır."
      },
      {
        "prompt": "Hangi eşya kaymayı azaltmak için tasarlanır?",
        "options": {
          "A": "Yağlanmış kızak",
          "B": "Kaygan taban",
          "C": "Buz pateni bıçağı",
          "D": "Kaymaz tabanlı ayakkabı"
        },
        "answer": "D",
        "explanation": "Kaymaz taban yürürken tutunmayı artırmaya yardımcı olur."
      }
    ]
  },
  {
    "id": "grade6-scale-map-v1",
    "version": 1,
    "subject": "Sosyal Bilgiler",
    "title": "Harita işaretlerini yorumlama",
    "skill": "Harita anahtarındaki sembollerle yerleri eşleştirme",
    "targetGrades": [
      6
    ],
    "topicTags": [
      "Harita ve Ölçek"
    ],
    "contentStatus": "PILOT",
    "explanation": "Haritanın lejantı (işaret anahtarı), sembollerin neyi temsil ettiğini açıklar. Bir haritadaki sembolü yorumlarken önce lejantına bakılır.",
    "misconception": "Bütün haritalarda aynı simgenin aynı şeyi gösterdiğini düşünmek.",
    "worked": {
      "prompt": "Bir haritanın lejantında yıldız ‘hastane’ olarak verilmişse haritadaki yıldız neyi gösterir?",
      "steps": [
        "Önce haritanın işaret anahtarını bul.",
        "Yıldız sembolünün karşısında hastane yazdığını oku.",
        "Haritadaki yıldızlar hastane konumlarını gösterir."
      ],
      "answer": "Hastane"
    },
    "exercises": [
      {
        "prompt": "Haritadaki işaretlerin anlamı nerede açıklanır?",
        "options": {
          "A": "Lejant",
          "B": "Başlık rengi",
          "C": "Sayfa numarası",
          "D": "Yazar adı"
        },
        "answer": "A",
        "explanation": "Lejant, simge ve işaretlerin açıklamalarını içerir."
      },
      {
        "prompt": "Lejantta mavi kare ‘okul’ ise haritadaki mavi kare neyi gösterir?",
        "options": {
          "A": "Hastane",
          "B": "Orman",
          "C": "Okul",
          "D": "Göl"
        },
        "answer": "C",
        "explanation": "Anlam haritanın kendi lejantından alınır."
      },
      {
        "prompt": "Aynı işaret farklı iki haritada farklı anlama gelebilir mi?",
        "options": {
          "A": "Asla",
          "B": "Evet, lejanta göre değişebilir",
          "C": "Her zaman aynı ilçe demektir",
          "D": "Yalnız dağ anlamına gelir"
        },
        "answer": "B",
        "explanation": "Haritanın sembolleri o haritanın anahtarına göre yorumlanır."
      },
      {
        "prompt": "Harita okunurken ilk kontrol edilecek bilgilerden biri hangisidir?",
        "options": {
          "A": "Kitabın fiyatı",
          "B": "Resim boyutu",
          "C": "Defter rengi",
          "D": "Lejant"
        },
        "answer": "D",
        "explanation": "Sembollerin anlamını öğrenmek için lejant önemlidir."
      }
    ]
  },
  {
    "id": "grade7-evidence-claim-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "İddia ve kanıtı ayırt etme",
    "skill": "Bir metindeki savı destekleyen veriyi bulma",
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Metinde Görüş ve Kanıt"
    ],
    "contentStatus": "PILOT",
    "explanation": "İddia, savunulan düşüncedir. Kanıt ise düşüncenin gerekçelendirilmesine yardımcı olan gözlem, veri veya doğrulanabilir bilgidir.",
    "misconception": "Bir iddianın tekrarlanmasını o iddia için kanıt sanmak.",
    "worked": {
      "prompt": "“Okul bahçesindeki ağaçlar yazın serinlik sağlar; gölgeli alanlarda sıcaklık ölçümü daha düşüktür.” Hangi bölüm destekleyici kanıttır?",
      "steps": [
        "Savı bul: ağaçlar yazın serinlik sağlar.",
        "Metindeki ölçülebilir bilgiyi bul: gölgeli alanda sıcaklık daha düşük.",
        "Ölçüm bilgisi savı destekleyebilen kanıttır."
      ],
      "answer": "Gölgeli alanlarda daha düşük sıcaklık ölçülmesi"
    },
    "exercises": [
      {
        "prompt": "“Düzenli uyku ders başarısını destekler. Araştırmadaki öğrencilerin dikkat puanları ölçüldü.” Hangi ifade bir kanıttır?",
        "options": {
          "A": "Uyku iyidir",
          "B": "Dikkat puanlarının ölçülmesi",
          "C": "Her gün uyumalıyız",
          "D": "Bütün çocuklar aynı uyur"
        },
        "answer": "B",
        "explanation": "Ölçülen dikkat puanları iddiayı sınamaya yarayan veridir; sonuç ayrıca değerlendirilmelidir."
      },
      {
        "prompt": "Bir iddiayı güçlendiren en uygun bilgi hangisidir?",
        "options": {
          "A": "Aynı iddiayı büyük harfle yazmak",
          "B": "İddiayı tekrarlamak",
          "C": "Alakasız örnek vermek",
          "D": "İlgili ölçümleri karşılaştırmak"
        },
        "answer": "D",
        "explanation": "İlgili verileri karşılaştırmak iddiayı gerekçelendirebilir."
      },
      {
        "prompt": "“Kütüphaneye daha çok öğrenci geliyor.” savını hangisi destekler?",
        "options": {
          "A": "Giriş sayılarının önceki aylarla karşılaştırılması",
          "B": "Rafların rengi",
          "C": "Binanın dış görüntüsü",
          "D": "Pencere sayısı"
        },
        "answer": "A",
        "explanation": "Zaman içindeki giriş sayıları ziyaretçi değişimini gösterebilir."
      },
      {
        "prompt": "Sav nedir?",
        "options": {
          "A": "Metnin sayfa sayısı",
          "B": "Kullanılan yazı tipi",
          "C": "Savunulan düşünce",
          "D": "Yazıcının modeli"
        },
        "answer": "C",
        "explanation": "Sav, metnin ileri sürdüğü iddia veya düşüncedir."
      }
    ]
  },
  {
    "id": "grade8-invitation-replies-v1",
    "version": 1,
    "subject": "İngilizce",
    "title": "Invitations: accepting and refusing",
    "skill": "İngilizce davetlere uygun kabul ve ret yanıtlarını seçme",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Friendship"
    ],
    "contentStatus": "PILOT",
    "explanation": "‘Would you like to ...?’ bir davet kalıbıdır. Kabul için ‘I'd love to.’, nazik ret için ‘I'm sorry, I can't.’ kullanılabilir.",
    "misconception": "‘I'd love to’ ifadesini ret, ‘I can't’ ifadesini kabul sanmak.",
    "worked": {
      "prompt": "‘Would you like to join us?’ sorusuna kabul yanıtı hangisidir?",
      "steps": [
        "Soru bir katılım davetidir.",
        "Olumlu yanıt için ‘I'd love to.’ kullanılır.",
        "Bu yanıt daveti kabul eder."
      ],
      "answer": "I'd love to."
    },
    "exercises": [
      {
        "prompt": "A friend says: ‘Would you like to play chess?’ Which reply accepts?",
        "options": {
          "A": "I'm afraid I can't.",
          "B": "No, thanks.",
          "C": "I'd love to.",
          "D": "I have another plan."
        },
        "answer": "C",
        "explanation": "‘I'd love to’ accepts the invitation."
      },
      {
        "prompt": "Which sentence is a polite refusal?",
        "options": {
          "A": "Sure!",
          "B": "I'm sorry, I can't.",
          "C": "Great idea!",
          "D": "Why not?"
        },
        "answer": "B",
        "explanation": "‘I'm sorry, I can't’ politely refuses."
      },
      {
        "prompt": "‘Do you want to come to my birthday party?’ Which answer accepts?",
        "options": {
          "A": "I'd be happy to.",
          "B": "I can't attend.",
          "C": "Maybe next month.",
          "D": "I'm busy."
        },
        "answer": "A",
        "explanation": "‘I'd be happy to’ is an acceptance."
      },
      {
        "prompt": "Which expression asks someone to join an event?",
        "options": {
          "A": "It is raining.",
          "B": "I did my homework.",
          "C": "The book is blue.",
          "D": "Would you like to come with us?"
        },
        "answer": "D",
        "explanation": "‘Would you like to ...?’ is an invitation."
      }
    ]
  },
  {
    "id": "grade9-scientific-hypotheses-v1",
    "version": 1,
    "subject": "Biyoloji",
    "title": "Hipotez ve değişkenler",
    "skill": "Bir deneyde değiştirilen ve ölçülen değişkeni ayırma",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Bilimsel Yöntem"
    ],
    "contentStatus": "PILOT",
    "explanation": "Bağımsız değişken araştırmacının değiştirdiği etkendir; bağımlı değişken ise ölçülen sonuçtur. Diğer koşullar olabildiğince sabit tutulmalıdır.",
    "misconception": "Bağımlı değişkenin araştırmacının özellikle değiştirdiği etken olduğunu düşünmek.",
    "worked": {
      "prompt": "Bitkinin aldığı ışık süresi değiştirilip boyu ölçülürse bağımsız değişken nedir?",
      "steps": [
        "Değiştirilen etkeni bul: ışık süresi.",
        "Ölçülen sonuç: bitkinin boyu.",
        "Bağımsız değişken ışık süresidir."
      ],
      "answer": "Işık süresi"
    },
    "exercises": [
      {
        "prompt": "Işık miktarı değiştirilen deneyde bitki boyu ölçülüyor. Bağımlı değişken hangisidir?",
        "options": {
          "A": "Saksı rengi",
          "B": "Işık miktarı",
          "C": "Bitki boyu",
          "D": "Toprak türü"
        },
        "answer": "C",
        "explanation": "Ölçülen sonuç bitki boyudur."
      },
      {
        "prompt": "Çimlenmede su miktarı değiştiriliyorsa bağımsız değişken nedir?",
        "options": {
          "A": "Su miktarı",
          "B": "Çimlenen tohum sayısı",
          "C": "Gözlem sonucu",
          "D": "Tohumun adı"
        },
        "answer": "A",
        "explanation": "Deneyde özellikle değiştirilen etken su miktarıdır."
      },
      {
        "prompt": "Bir deneyde diğer koşulları sabit tutmak neye yardım eder?",
        "options": {
          "A": "Soruyu uzatmaya",
          "B": "Deneyin rengini değiştirmeye",
          "C": "Örnekleri saklamaya",
          "D": "Değişkenin etkisini daha net görmeye"
        },
        "answer": "D",
        "explanation": "Kontrol edilen koşullar karşılaştırmayı güçlendirir."
      },
      {
        "prompt": "Bir hipotez için hangi nitelik önemlidir?",
        "options": {
          "A": "Hiç sınanmaması",
          "B": "Sınanabilir olması",
          "C": "Her zaman doğru sayılması",
          "D": "Yalnızca uzun olması"
        },
        "answer": "B",
        "explanation": "Bilimsel hipotez kanıtlarla sınanabilir olmalıdır."
      }
    ]
  },
  {
    "id": "grade10-population-density-v1",
    "version": 1,
    "subject": "Coğrafya",
    "title": "Aritmetik nüfus yoğunluğu",
    "skill": "Nüfusun yüz ölçümüne bölünmesiyle yoğunluğu hesaplama",
    "targetGrades": [
      10
    ],
    "topicTags": [
      "Nüfus Yoğunluğu"
    ],
    "contentStatus": "PILOT",
    "explanation": "Aritmetik nüfus yoğunluğu = nüfus ÷ yüz ölçümü. Sonuç kişi/km² gibi birimle gösterilir; nüfusun il içinde eşit dağıldığını söylemez.",
    "misconception": "Yoğunluğu hesaplarken yüz ölçümünü nüfusa bölmek veya her yerde aynı dağılım var sanmak.",
    "worked": {
      "prompt": "Nüfusu 60.000, alanı 300 km² olan yerde aritmetik nüfus yoğunluğu kaç kişi/km²?",
      "steps": [
        "Formülü yaz: nüfus ÷ yüz ölçümü.",
        "60.000 ÷ 300 = 200.",
        "Aritmetik yoğunluk 200 kişi/km² olur."
      ],
      "answer": "200"
    },
    "exercises": [
      {
        "prompt": "Nüfus 24.000, alan 120 km²: yoğunluk kaç kişi/km²?",
        "options": {
          "A": "100",
          "B": "120",
          "C": "200",
          "D": "240"
        },
        "answer": "C",
        "explanation": "24.000 ÷ 120 = 200."
      },
      {
        "prompt": "Nüfus 15.000, alan 150 km²: yoğunluk kaç kişi/km²?",
        "options": {
          "A": "100",
          "B": "10",
          "C": "150",
          "D": "300"
        },
        "answer": "A",
        "explanation": "15.000 ÷ 150 = 100."
      },
      {
        "prompt": "Nüfus 36.000, alan 180 km²: yoğunluk kaç kişi/km²?",
        "options": {
          "A": "180",
          "B": "360",
          "C": "20",
          "D": "200"
        },
        "answer": "D",
        "explanation": "36.000 ÷ 180 = 200."
      },
      {
        "prompt": "Nüfus 9.000, alan 90 km²: yoğunluk kaç kişi/km²?",
        "options": {
          "A": "90",
          "B": "100",
          "C": "10",
          "D": "900"
        },
        "answer": "B",
        "explanation": "9.000 ÷ 90 = 100."
      }
    ]
  },
  {
    "id": "grade11-newton-second-v1",
    "version": 1,
    "subject": "Fizik",
    "title": "Newton'un ikinci hareket yasası",
    "skill": "Net kuvvet, kütle ve ivme arasındaki ilişkiyi kullanma",
    "targetGrades": [
      11
    ],
    "topicTags": [
      "Kuvvet ve Hareket"
    ],
    "contentStatus": "PILOT",
    "explanation": "Sabit kütleli bir cismin ivmesi net kuvvetle doğru, kütleyle ters orantılıdır: Fnet = m × a. Kuvvetin birimi newtondur.",
    "misconception": "Net kuvveti kütleye bölmek yerine çarpmak gerektiğini karıştırmak veya süratle ivmeyi aynı sanmak.",
    "worked": {
      "prompt": "Kütlesi 4 kg olan cisme yatay doğrultuda net 12 N etki ediyorsa ivme kaç m/s²?",
      "steps": [
        "Fnet = m × a yaz.",
        "a = Fnet/m = 12/4.",
        "İvme 3 m/s² olur."
      ],
      "answer": "3"
    },
    "exercises": [
      {
        "prompt": "m = 2 kg, Fnet = 10 N: ivme kaç m/s²?",
        "options": {
          "A": "2",
          "B": "5",
          "C": "10",
          "D": "20"
        },
        "answer": "B",
        "explanation": "a = 10/2 = 5."
      },
      {
        "prompt": "m = 5 kg, a = 2 m/s²: net kuvvet kaç N?",
        "options": {
          "A": "2",
          "B": "5",
          "C": "10",
          "D": "20"
        },
        "answer": "C",
        "explanation": "Fnet = 5 × 2 = 10."
      },
      {
        "prompt": "m = 3 kg, Fnet = 18 N: ivme kaç m/s²?",
        "options": {
          "A": "6",
          "B": "3",
          "C": "9",
          "D": "54"
        },
        "answer": "A",
        "explanation": "a = 18/3 = 6."
      },
      {
        "prompt": "Aynı net kuvvette kütle artarsa ivme nasıl değişir?",
        "options": {
          "A": "Artar",
          "B": "Kesin değişmez",
          "C": "Sıfırlanır",
          "D": "Azalır"
        },
        "answer": "D",
        "explanation": "a=F/m olduğundan aynı net kuvvette daha büyük kütlede ivme azalır."
      }
    ]
  },
  {
    "id": "grade12-tyt-inference-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Paragrafta çıkarım ve kapsam",
    "skill": "Paragrafta desteklenmeyen genellemeleri dışlayarak çıkarım yapma",
    "targetGrades": [
      12
    ],
    "topicTags": [
      "Paragraf"
    ],
    "contentStatus": "PILOT",
    "explanation": "Çıkarım, metinde açıkça yazılmasa da verilen bilgilerden gerekçeli olarak ulaşılabilen yargıdır. 'Bütün', 'kesinlikle', 'yalnızca' gibi ifadeler metni aşabilir.",
    "misconception": "Tek örnekten bütün durumlar için kesin sonuç çıkarmak.",
    "worked": {
      "prompt": "“Mahalle kütüphanesi hafta sonu da açılınca ziyaret sayısı arttı; ancak artışın nedenleri ayrıca araştırılmadı.” Hangisi söylenebilir?",
      "steps": [
        "Gözlemi belirle: ziyaret sayısı arttı.",
        "Nedenin kanıtlanmadığını dikkate al.",
        "Kütüphane kullanımında artış vardır, fakat nedeni kesin değildir."
      ],
      "answer": "Ziyaret sayısı artmıştır; artışın nedeni kesin değildir."
    },
    "exercises": [
      {
        "prompt": "“Okul bahçesine yeni banklar yerleştirildi. Öğrencilerin dinlenme alanlarını daha sık kullanmaya başladığı gözlendi.” Hangisine ulaşılır?",
        "options": {
          "A": "Banklar bütün öğrencileri mutlu etti.",
          "B": "Dinlenme alanlarının kullanımında artış gözlendi.",
          "C": "Başka değişiklik yapılmadı.",
          "D": "Artışın tek nedeni banklardır."
        },
        "answer": "B",
        "explanation": "Yalnız kullanım artışı belirtiliyor; kesin neden söylenmiyor."
      },
      {
        "prompt": "“Deneyde iki farklı toprak türü karşılaştırıldı ve yalnız seçilen bitkinin büyümesi izlendi.” Hangisi kesin çıkarılamaz?",
        "options": {
          "A": "İki toprak türü incelendi.",
          "B": "Büyüme ölçüldü.",
          "C": "Sonuç bütün bitki türleri için geçerlidir.",
          "D": "Bir bitki seçildi."
        },
        "answer": "C",
        "explanation": "Tek bitki türüyle tüm türlere genelleme yapılamaz."
      },
      {
        "prompt": "“Belediye, yeni bisiklet yollarının etkisini değerlendirmek için ilk altı ayın kullanım verilerini topladı.” Hangisi söylenebilir?",
        "options": {
          "A": "Veri toplanarak kullanım değerlendirilmeye çalışılmıştır.",
          "B": "Bütün sürücüler bisiklete geçti.",
          "C": "Trafik tamamen bitti.",
          "D": "Bütün yollar aynı ölçüde kullanıldı."
        },
        "answer": "A",
        "explanation": "Veri toplama amacı belirtilir; sonuçlar henüz verilmez."
      },
      {
        "prompt": "“Bir okulda gönüllü okuma kulübüne katılım geçen aya göre yükseldi.” Hangisine ulaşılamaz?",
        "options": {
          "A": "Kulüp gönüllüdür.",
          "B": "Katılım artmıştır.",
          "C": "Karşılaştırma geçen ayla yapılmıştır.",
          "D": "Okuldaki bütün öğrenciler kulübe katılmıştır."
        },
        "answer": "D",
        "explanation": "Artış, bütün öğrencilerin katıldığı anlamına gelmez."
      }
    ]
  }
];
