/** KEKS-original 7th grade science examples. One pilot skill per MEB unit; review pending. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const GRADE7_SCIENCE_PILOTS:readonly MicroLesson[]=[
  {
    "id": "grade7-science-space-technology-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Uzay araştırması araçlarını karşılaştırma",
    "skill": "Teleskop, uydu, sonda ve uzay istasyonunun kullanım amacını ayırt etme",
    "explanation": "Teleskop uzaktaki gök cisimlerinden gelen ışığı toplayarak gözleme yardım eder. Yapay uydu Dünya veya başka gök cisimleri çevresinde belirli görevlerle dolanabilir. Uzay sondası insan taşımadan uzayı ve gök cisimlerini araştırır; uzay istasyonu ise astronotlara uzun süreli çalışma ortamı sağlar.",
    "misconception": "Teleskopların uzaya gitmek zorunda olduğunu veya her uzay aracının insan taşıdığını düşünmek.",
    "worked": {
      "prompt": "Astronotları aylarca barındırarak bilimsel deney yapılabilen araç hangisidir?",
      "steps": [
        "Görevin niteliğini belirle: uzun süreli insanlı araştırma.",
        "Sonda ve teleskop bu yaşama ortamını sağlamaz.",
        "Uzay istasyonu uzun süreli insanlı çalışma ortamı sunar."
      ],
      "answer": "Uzay istasyonu"
    },
    "exercises": [
      {
        "prompt": "Bir uzay aracı insanların binmesine gerek kalmadan Mars yakınından veri gönderecek. Hangisi buna uygundur?",
        "options": {
          "A": "Yer teleskobu",
          "B": "Uzay sondası",
          "C": "Fırlatma rampası",
          "D": "Gözlemevi binası"
        },
        "answer": "B",
        "explanation": "Uzay sondaları insan taşımadan gök cisimlerini araştırabilir."
      },
      {
        "prompt": "Bir gözlemevindeki teleskobun temel görevi nedir?",
        "options": {
          "A": "Astronotları taşımak",
          "B": "Gezegenlerin yörüngesini değiştirmek",
          "C": "Yıldızlardan gelen ışığı toplayarak gözlem sağlamak",
          "D": "Uyduya yakıt üretmek"
        },
        "answer": "C",
        "explanation": "Teleskoplar uzaktan gelen ışığı toplar."
      },
      {
        "prompt": "Dünya'nın çevresinde dolanarak hava gözlem verisi sağlayan teknoloji hangisidir?",
        "options": {
          "A": "Meteoroloji uydusu",
          "B": "Ay aracı",
          "C": "Denizaltı",
          "D": "Roket fırlatma masası"
        },
        "answer": "A",
        "explanation": "Meteoroloji uyduları atmosfer ve hava olaylarını gözlemlemek için kullanılabilir."
      },
      {
        "prompt": "Hangi araç uzun süre insanlı bilimsel çalışma ortamı sağlamasıyla diğerlerinden ayrılır?",
        "options": {
          "A": "Yer teleskobu",
          "B": "Meteoroloji uydusu",
          "C": "İnsansız uzay sondası",
          "D": "Uzay istasyonu"
        },
        "answer": "D",
        "explanation": "Uzay istasyonunda astronotlar uzun süre yaşayıp deney yapabilir."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Uzay araştırması araçlarını karşılaştırma"
    ],
    "sourceThemeId": "FB.7.1.1.1",
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/416",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-science-energy-types-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Kinetik ve potansiyel enerjiyi karşılaştırma",
    "skill": "Günlük durumlarda hareket ve konuma bağlı enerji türlerini ayırt etme",
    "explanation": "Kinetik enerji, cismin hareketiyle ilişkilidir; sürati arttıkça artabilir. Çekim potansiyel enerjisi ise cismin yüksekliği ve kütlesiyle ilişkilidir. Aynı cisim farklı durumlarda iki enerji türüne de sahip olabilir.",
    "misconception": "Hareket etmeyen her cismin hiç enerjisi olmadığını sanmak.",
    "worked": {
      "prompt": "Masada duran kitabın ve masadan aşağı düşen aynı kitabın enerji türlerini karşılaştır.",
      "steps": [
        "Kitap masada dururken yerden yüksektedir; çekim potansiyel enerjisi vardır.",
        "Kitap düşerken hareket eder; kinetik enerji de kazanır.",
        "Konuma bağlı ve harekete bağlı enerji türlerini ayrı değerlendir."
      ],
      "answer": "Yüksekte potansiyel; düşerken kinetik enerji de vardır."
    },
    "exercises": [
      {
        "prompt": "Düz yolda hızla ilerleyen bisikletin hareketine bağlı enerji hangisidir?",
        "options": {
          "A": "Çekim potansiyel",
          "B": "Esneklik potansiyel",
          "C": "Kinetik",
          "D": "Kimyasal"
        },
        "answer": "C",
        "explanation": "Hareket eden bisiklet kinetik enerjiye sahiptir."
      },
      {
        "prompt": "Rafın üstünde hareketsiz duran kitabın yüksekliğine bağlı enerjisi nedir?",
        "options": {
          "A": "Çekim potansiyel enerjisi",
          "B": "Hareket enerjisi",
          "C": "Ses enerjisi",
          "D": "Işık enerjisi"
        },
        "answer": "A",
        "explanation": "Yerden yüksek konum, çekim potansiyel enerjisiyle ilişkilidir."
      },
      {
        "prompt": "Aynı kütlede iki bilyeden biri daha hızlı gidiyorsa hangisinin kinetik enerjisi daha fazladır?",
        "options": {
          "A": "Duranın",
          "B": "Yavaş olanın",
          "C": "İkisi her zaman eşittir",
          "D": "Daha hızlı olanın"
        },
        "answer": "D",
        "explanation": "Kütleleri aynıyken sürati fazla olan bilyenin kinetik enerjisi daha büyüktür."
      },
      {
        "prompt": "Bir yay sıkıştırılıp sabit tutulduğunda hangi enerji türüyle ilişkilidir?",
        "options": {
          "A": "Yalnız kinetik",
          "B": "Esneklik potansiyel enerjisi",
          "C": "Yalnız ışık",
          "D": "Yalnız ses"
        },
        "answer": "B",
        "explanation": "Sıkıştırılmış yayda enerji esneklik potansiyeli olarak depolanabilir."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Kinetik ve potansiyel enerjiyi karşılaştırma"
    ],
    "sourceThemeId": "FB.7.2.1.2",
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/429",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-science-digestion-organs-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Sindirim sistemi organlarını modele yerleştirme",
    "skill": "Ağız, yemek borusu, mide ve ince bağırsağın görevlerini ayırt etme",
    "explanation": "Sindirim sisteminde besinler ağızdan alınır ve çiğneme ile parçalanır; yemek borusu besini mideye taşır. Midede sindirim sürer. Besinlerin kimyasal sindiriminin önemli bölümü ve emilimin büyük kısmı ince bağırsakta gerçekleşir.",
    "misconception": "Yemek borusunun başlıca sindirim veya emilim organı olduğunu düşünmek.",
    "worked": {
      "prompt": "Bir öğrenci modeli ağız → mide → yemek borusu → ince bağırsak şeklinde çizdi. Sıra nasıl düzeltilir?",
      "steps": [
        "Besin önce ağızda alınır ve çiğnenir.",
        "Ağızdan mideye geçişte yemek borusu yer alır.",
        "Doğru sıralama ağız → yemek borusu → mide → ince bağırsaktır."
      ],
      "answer": "Ağız → yemek borusu → mide → ince bağırsak"
    },
    "exercises": [
      {
        "prompt": "Ağızdan mideye besinlerin taşınmasında hangi organ görev yapar?",
        "options": {
          "A": "Böbrek",
          "B": "Yemek borusu",
          "C": "Soluk borusu",
          "D": "Kalın bağırsak"
        },
        "answer": "B",
        "explanation": "Yemek borusu peristaltik hareketlerle besini mideye iletir."
      },
      {
        "prompt": "Sindirilmiş besinlerin kana veya lenfe geçişinin büyük bölümü nerede gerçekleşir?",
        "options": {
          "A": "Ağız",
          "B": "Yemek borusu",
          "C": "İnce bağırsak",
          "D": "Soluk borusu"
        },
        "answer": "C",
        "explanation": "İnce bağırsak yüzeyi emilimin gerçekleşmesi için özelleşmiştir."
      },
      {
        "prompt": "Çiğneme ile besinin mekanik olarak parçalanması ilk olarak nerede başlar?",
        "options": {
          "A": "Ağız",
          "B": "Karaciğer",
          "C": "Kalın bağırsak",
          "D": "Yemek borusu"
        },
        "answer": "A",
        "explanation": "Çiğneme ağızda gerçekleşir."
      },
      {
        "prompt": "Aşağıdaki sıralamalardan hangisi besinin izlediği doğru yolun parçasıdır?",
        "options": {
          "A": "Ağız → akciğer → mide",
          "B": "Mide → yemek borusu → ağız",
          "C": "Yemek borusu → kalp → mide",
          "D": "Ağız → yemek borusu → mide"
        },
        "answer": "D",
        "explanation": "Besin ağızdan yemek borusuna, oradan mideye ulaşır."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Sindirim sistemi organlarını modele yerleştirme"
    ],
    "sourceThemeId": "FB.7.3.1.1",
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/430",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-science-lenses-uses-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Merceklerin kullanım alanlarını sınıflandırma",
    "skill": "İnce ve kalın kenarlı mercekleri günlük kullanım örnekleriyle ilişkilendirme",
    "explanation": "İnce kenarlı (yakınsak) mercek, uygun koşullarda ışınları bir noktaya yakınlaştırır; büyüteçlerde kullanılabilir. Kalın kenarlı (ıraksak) mercek, ışınları dağıtır; miyop gözlük camlarında kullanılır. Mercek seçimi yapılırken ışığın davranışı ve kullanım amacı birlikte değerlendirilir.",
    "misconception": "Her merceğin ışığı topladığını veya bütün gözlüklerin aynı mercek türünü kullandığını sanmak.",
    "worked": {
      "prompt": "Miyop bir kişinin uzak görmesini düzeltmek için genellikle hangi mercek kullanılır?",
      "steps": [
        "Uzağı görememe durumunu belirle: miyopluk.",
        "Işınları dağıtan ıraksak mercek uygun düzeltmeyi yapar.",
        "Bu nedenle kalın kenarlı mercek kullanılır."
      ],
      "answer": "Kalın kenarlı (ıraksak) mercek"
    },
    "exercises": [
      {
        "prompt": "Yakındaki küçük yazıyı büyüteçle incelemede hangi mercek türü bulunabilir?",
        "options": {
          "A": "Kalın kenarlı ıraksak",
          "B": "Yalnız düz ayna",
          "C": "İnce kenarlı yakınsak",
          "D": "Boyalı cam"
        },
        "answer": "C",
        "explanation": "Büyüteçte ince kenarlı yakınsak mercek kullanılır."
      },
      {
        "prompt": "Miyopluğun düzeltilmesinde genel olarak hangi mercek kullanılır?",
        "options": {
          "A": "Kalın kenarlı (ıraksak)",
          "B": "İnce kenarlı (yakınsak)",
          "C": "Düz ayna",
          "D": "Prizma kullanılması zorunludur"
        },
        "answer": "A",
        "explanation": "Miyopluk genellikle ıraksak mercekle düzeltilir."
      },
      {
        "prompt": "Işığı dağıtma özelliği baskın olan mercek hangisidir?",
        "options": {
          "A": "Her zaman büyüteç",
          "B": "İnce kenarlı mercek",
          "C": "Yalnız dışbükey ayna",
          "D": "Kalın kenarlı mercek"
        },
        "answer": "D",
        "explanation": "Iraksak (kalın kenarlı) mercek, paralel ışınları dağıtır."
      },
      {
        "prompt": "Mercek kullanımını bilimsel biçimde sınıflandırırken neye bakılmalıdır?",
        "options": {
          "A": "Yalnız çerçevenin rengine",
          "B": "Işığa etkisi ve kullanım amacına",
          "C": "Ürün adının uzunluğuna",
          "D": "Camın markasına"
        },
        "answer": "B",
        "explanation": "Merceğin ışınları toplama/dağıtma özelliği ve kullanım amacı önemlidir."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Merceklerin kullanım alanlarını sınıflandırma"
    ],
    "sourceThemeId": "FB.7.4.2.2",
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/431",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-science-elements-compounds-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Saf maddeleri element ve bileşik olarak ayırma",
    "skill": "Element ve bileşik örneklerini madde türüne göre sınıflandırma",
    "explanation": "Saf madde tek tür taneciklerden oluşur. Element aynı cins atomlardan oluşur; oksijen gazı (O₂) bir elementtir. Bileşik farklı tür atomların belirli oranlarda kimyasal bağlarla birleşmesinden oluşur; su (H₂O) bir bileşiktir. Karışımda ise birden fazla madde kimyasal bağ zorunluluğu olmadan bulunur.",
    "misconception": "O₂ iki atomlu olduğu için mutlaka bileşik sanmak.",
    "worked": {
      "prompt": "O₂, H₂O ve hava örneklerini sınıflandır.",
      "steps": [
        "O₂ yalnız oksijen atomları içerir: element.",
        "H₂O hidrojen ve oksijen atomları içerir: bileşik.",
        "Hava çeşitli gazların karışımıdır: karışım."
      ],
      "answer": "O₂ element, H₂O bileşik, hava karışım"
    },
    "exercises": [
      {
        "prompt": "Aşağıdakilerden hangisi bileşiktir?",
        "options": {
          "A": "Saf altın (Au)",
          "B": "Oksijen gazı (O₂)",
          "C": "Damıtılmış su (H₂O)",
          "D": "Helyum gazı (He)"
        },
        "answer": "C",
        "explanation": "Su, hidrojen ve oksijenin belirli oranda birleştiği bir bileşiktir."
      },
      {
        "prompt": "Hangi madde aynı tür atomlardan oluşan bir elementtir?",
        "options": {
          "A": "Demir (Fe)",
          "B": "Tuzlu su",
          "C": "Hava",
          "D": "Şekerli su"
        },
        "answer": "A",
        "explanation": "Demir yalnız demir atomlarından oluşan elementtir."
      },
      {
        "prompt": "O₂ neden bileşik değil element olarak sınıflandırılır?",
        "options": {
          "A": "Suda çözünebildiği için",
          "B": "Her zaman katı olduğu için",
          "C": "Havada bulunduğu için",
          "D": "Yalnız aynı cins oksijen atomları içerdiği için"
        },
        "answer": "D",
        "explanation": "Element molekülleri iki veya daha fazla aynı cins atom içerebilir."
      },
      {
        "prompt": "Karışımla bileşik arasındaki temel ayrım hangisidir?",
        "options": {
          "A": "İkisi de mutlaka aynı atomları içerir",
          "B": "Bileşikte atomlar belirli oranda kimyasal olarak bağlıdır; karışımda bileşenler fiziksel olarak bir aradadır",
          "C": "Karışım daima saf maddedir",
          "D": "Bileşikler her zaman tek atomdan oluşur"
        },
        "answer": "B",
        "explanation": "Bileşik ve karışım ayrımı kimyasal bağ ve sabit bileşimle ilgilidir."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Saf maddeleri element ve bileşik olarak ayırma"
    ],
    "sourceThemeId": "FB.7.5.2.1",
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/432",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-science-electrostatic-charge-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Cisimlerin elektrik yükünü sınıflandırma",
    "skill": "Pozitif, negatif ve nötr yük durumlarını proton-elektron dengesiyle açıklama",
    "explanation": "Proton sayısı elektron sayısından fazlaysa cisim net pozitif; elektron sayısı fazlaysa net negatif yüklüdür. Sayılar eşitse toplam yük nötrdür. Basit elektriklenmede elektron alışverişi rol oynar; protonlar katı maddeler arasında serbestçe aktarılmaz.",
    "misconception": "Nötr bir cisimde hiç elektrik yükü bulunmadığını sanmak.",
    "worked": {
      "prompt": "12 proton, 10 elektronu bulunan modelin net yükü nedir?",
      "steps": [
        "12 pozitif yük, 10 negatif yük say.",
        "Pozitif yük sayısı iki fazladır.",
        "Model iki birim net pozitif yüklüdür."
      ],
      "answer": "Pozitif"
    },
    "exercises": [
      {
        "prompt": "9 proton ve 11 elektronu bulunan taneciğin net yükü nasıldır?",
        "options": {
          "A": "Nötr",
          "B": "Negatif",
          "C": "Pozitif",
          "D": "Yüksüz parçacıkları yoktur"
        },
        "answer": "B",
        "explanation": "Elektron sayısı proton sayısından iki fazladır."
      },
      {
        "prompt": "10 proton ve 10 elektronu bulunan model hangi yük durumundadır?",
        "options": {
          "A": "Pozitif",
          "B": "Negatif",
          "C": "Nötr",
          "D": "Her zaman artı yüklü"
        },
        "answer": "C",
        "explanation": "Eşit sayıda pozitif ve negatif yük net olarak birbirini dengeler."
      },
      {
        "prompt": "Bir cismin net pozitif olması hangi duruma karşılık gelir?",
        "options": {
          "A": "Proton sayısının elektron sayısından fazla olmasına",
          "B": "Elektron sayısının proton sayısından fazla olmasına",
          "C": "İçinde hiç atom bulunmamasına",
          "D": "Her zaman aynı sayıda proton ve elektron bulunmasına"
        },
        "answer": "A",
        "explanation": "Net pozitiflik, pozitif yük toplamının negatiften büyük olmasıdır."
      },
      {
        "prompt": "Nötr bir cisim için hangi ifade doğrudur?",
        "options": {
          "A": "Hiç proton içermez",
          "B": "Hiç elektron içermez",
          "C": "Yalnız negatif yük içerir",
          "D": "Toplam pozitif ve negatif yük dengededir"
        },
        "answer": "D",
        "explanation": "Nötr cisim içinde yüklü parçacıklar bulunabilir, net yük sıfırdır."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Cisimlerin elektrik yükünü sınıflandırma"
    ],
    "sourceThemeId": "FB.7.6.1.3",
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/433",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-science-food-chain-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Besin zinciri ve enerji aktarımı",
    "skill": "Üretici, tüketici ve besin zinciri oklarının anlamını açıklama",
    "explanation": "Üreticiler fotosentezle organik madde üretebilir. Tüketiciler besinlerini diğer canlılardan sağlar. Besin zinciri okları, besin olan canlıdan onu tüketen canlıya doğru madde ve enerjinin aktarım yönünü gösterir; enerji her basamakta aynı miktarda aktarılmaz.",
    "misconception": "Besin zinciri okunun avcıdan ava doğru çizildiğini sanmak.",
    "worked": {
      "prompt": "Çimen → çekirge → kurbağa zincirinde okların yönü neyi gösterir?",
      "steps": [
        "Çimen üreticidir, çekirge çimeni yer.",
        "Kurbağa çekirgeyle beslenir.",
        "Oklar enerjinin besinden tüketiciye geçişini gösterir."
      ],
      "answer": "Çimenden çekirgeye, çekirgeden kurbağaya enerji aktarımı"
    },
    "exercises": [
      {
        "prompt": "Çimen → tavşan → tilki zincirinde üretici hangisidir?",
        "options": {
          "A": "Tilki",
          "B": "Tavşan",
          "C": "Çimen",
          "D": "Üçü de üretici"
        },
        "answer": "C",
        "explanation": "Çimen fotosentez yapan üreticidir."
      },
      {
        "prompt": "Besin zincirindeki okun yönü neyi gösterir?",
        "options": {
          "A": "Besin yoluyla enerji aktarımının yönünü",
          "B": "Canlının göç ettiği yönü",
          "C": "Sadece avcının ağırlığını",
          "D": "Havanın yönünü"
        },
        "answer": "A",
        "explanation": "Ok, yenilen canlıdan tüketen canlıya enerji transferini gösterir."
      },
      {
        "prompt": "Ot → çekirge → kuş zincirinde çekirge hangisidir?",
        "options": {
          "A": "Üretici",
          "B": "Ayrıştırıcı",
          "C": "Üçüncül tüketici",
          "D": "Birincil tüketici"
        },
        "answer": "D",
        "explanation": "Çekirge otla beslendiğinden birincil tüketicidir."
      },
      {
        "prompt": "Besin zincirinde yukarı basamaklara aktarılan enerjiyle ilgili doğru ifade hangisidir?",
        "options": {
          "A": "Her basamakta enerji miktarı kesinlikle artar",
          "B": "Her basamakta enerjinin bir kısmı çevreye aktarılır, üst basamağa geçen kullanılabilir enerji azalır",
          "C": "Enerji yoktan üretilir",
          "D": "Yalnız üreticide enerji yoktur"
        },
        "answer": "B",
        "explanation": "Enerjinin tamamı üst basamağa geçmez; metabolik süreçlerde çevreye ısı aktarılır."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Besin zinciri ve enerji aktarımı"
    ],
    "sourceThemeId": "FB.7.7.1.1",
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/434",
    "contentStatus": "PILOT"
  }
];
