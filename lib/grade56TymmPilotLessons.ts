/** Original KEKS 5th/6th-grade pilots. Source themes are MEB, prompts are newly authored. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const GRADE56_TYMM_PILOT_LESSONS:readonly MicroLesson[]=[
  {
    "id": "grade5-tr-game-keyword-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Oyun metninde anahtar ifadeler",
    "skill": "Oyunun kurallarını anlatan metinde açık bilgi ve anahtar ifadeleri belirleme",
    "explanation": "Kısa bir oyun metninde kimin, ne zaman ve hangi kurala göre oynadığını doğrudan bul. Anahtar sözler metnin konusu ve kurallarını anlamayı kolaylaştırır.",
    "misconception": "Metinde hiç geçmeyen oyunun kurallarını kendiliğinden eklemek.",
    "worked": {
      "prompt": "“Misket oyununda her oyuncu sırayla kendi misketini hedefe doğru atar.” Oyuncular ne yapar?",
      "steps": [
        "Oyunun adını belirle: misket.",
        "Yapılan eylem: sırayla hedefe atmak.",
        "Açık yanıt: misketlerini hedefe sırayla atarlar."
      ],
      "answer": "Misketlerini sırayla hedefe atarlar."
    },
    "exercises": [
      {
        "prompt": "“Takım, ip atlama etkinliğinde sırayla beşer kez zıplar.” Her kişi kaç kez zıplar?",
        "options": {
          "A": "Üç",
          "B": "Dört",
          "C": "Beş",
          "D": "Altı"
        },
        "answer": "C",
        "explanation": "‘Beşer kez’ ifadesi zıplama sayısını açıkça verir."
      },
      {
        "prompt": "“Oyun bitince herkes kullanılan malzemeleri yerine koydu.” Etkinlik sonunda ne yapıldı?",
        "options": {
          "A": "Yeni oyun başlatıldı",
          "B": "Malzemeler yerine kondu",
          "C": "Takımlar değişti",
          "D": "Kurallar yazıldı"
        },
        "answer": "B",
        "explanation": "Yapılan son iş malzemeleri yerine koymaktır."
      },
      {
        "prompt": "“Oyunun amacı bayrağı yere düşürmeden takım arkadaşına ulaştırmaktır.” Hangi iki sözcük temel konuyu taşır?",
        "options": {
          "A": "Bayrak ve takım",
          "B": "Saat ve yemek",
          "C": "Deniz ve yol",
          "D": "Kitap ve kalem"
        },
        "answer": "A",
        "explanation": "Bayrak ile takım, etkinliğin temel unsurlarıdır."
      },
      {
        "prompt": "“Çocuklar, oyun başlamadan önce kuralları birlikte okudu.” Kurallar ne zaman okundu?",
        "options": {
          "A": "Oyun bittiğinde",
          "B": "Ertesi gün",
          "C": "Ara verildiğinde",
          "D": "Oyun başlamadan önce"
        },
        "answer": "D",
        "explanation": "Zaman bilgisi cümlede doğrudan vardır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      5
    ],
    "topicTags": [
      "Oyun metninde anahtar ifadeler"
    ],
    "sourceThemeId": "TYMM.TR.5.T1"
  },
  {
    "id": "grade5-tr-traditions-classify-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Geleneklerle ilgili metinde sınıflandırma",
    "skill": "Verilen geleneksel etkinlik örneklerini metin içi ölçüte göre gruplama",
    "explanation": "Sınıflandırırken önce gruplama ölçütünü belirle: örneğin ‘toplu oynanan oyun’ veya ‘özel gün kutlaması’. Aynı ölçüte göre örnekleri ayır.",
    "misconception": "Sınıflandırma ölçütünü değiştirdiği için aynı örnekleri tutarsız gruplandırmak.",
    "worked": {
      "prompt": "“Mendil kapmaca ve körebe birer oyun; bayramlaşma ise özel gün geleneğidir.” Hangileri oyun grubundadır?",
      "steps": [
        "Ölçüt: oyun veya kutlama.",
        "Mendil kapmaca ve körebe oyun olarak açıklanmış.",
        "Oyun grubunda ikisi bulunur."
      ],
      "answer": "Mendil kapmaca ve körebe"
    },
    "exercises": [
      {
        "prompt": "“Halk oyunları: halay, horon. El sanatları: çinicilik, ebru.” Hangisi el sanatıdır?",
        "options": {
          "A": "Horon",
          "B": "Halay",
          "C": "Çinicilik",
          "D": "Körebe"
        },
        "answer": "C",
        "explanation": "Metin çiniciliği el sanatları içinde sınıflandırıyor."
      },
      {
        "prompt": "“Bayramlaşma ve misafir ağırlama, insanları bir araya getirir.” Ortak özellik nedir?",
        "options": {
          "A": "Yalnız yarışma olması",
          "B": "Sosyal ilişkileri güçlendirmesi",
          "C": "Yalnız açık havada yapılması",
          "D": "Her gün aynı saatte olması"
        },
        "answer": "B",
        "explanation": "İki etkinlik de insanları bir araya getirme yönünden benzer."
      },
      {
        "prompt": "“Mendil kapmaca bir grup oyunudur; tek başına resim yapmak bireysel etkinliktir.” Farklılık nedir?",
        "options": {
          "A": "Katılımcı sayısı bakımından farklılık",
          "B": "İkisinin aynı yerde yapılması",
          "C": "İkisinin aynı kurala dayanması",
          "D": "İkisinin de kutlama olması"
        },
        "answer": "A",
        "explanation": "Grup ve bireysel katılım yönünden ayrılırlar."
      },
      {
        "prompt": "“Kültür şenliğinde müzik gösterisi ve el işi sergisi düzenlendi.” Hangi ikisi iki farklı etkinlik türüdür?",
        "options": {
          "A": "İki farklı spor dalı",
          "B": "İki yemek türü",
          "C": "İki yazılı sınav",
          "D": "Müzik gösterisi ve el işi sergisi"
        },
        "answer": "D",
        "explanation": "Verilen iki etkinliğin türü farklıdır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      5
    ],
    "topicTags": [
      "Geleneklerle ilgili metinde sınıflandırma"
    ],
    "sourceThemeId": "TYMM.TR.5.T4"
  },
  {
    "id": "grade6-tr-keywords-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Metinde anahtar kelimeler",
    "skill": "Bilgilendirici metinde en belirleyici anahtar sözcükleri seçme",
    "explanation": "Anahtar kelimeler metnin temel konusunu taşıyan kavramlardır. Ayrıntılar arasından metnin anlamını özetleyen sözleri seç.",
    "misconception": "Metindeki her sözcüğün aynı derecede anahtar olduğuna inanmak.",
    "worked": {
      "prompt": "“Arılar çiçeklerden polen taşır, bu süreç bitkilerin üremesine katkı sağlar.” İki anahtar kavram nedir?",
      "steps": [
        "Önce metnin konusunu bul: arılar ve bitkiler.",
        "Temel süreç: polen taşıma.",
        "Anahtar kavramlar: arılar ve tozlaşmadır."
      ],
      "answer": "Arılar ve tozlaşma"
    },
    "exercises": [
      {
        "prompt": "“Ağaçlandırma erozyonu azaltabilir ve toprağın korunmasına yardım eder.” Anahtar kavramlar hangisidir?",
        "options": {
          "A": "Sınav ve okul",
          "B": "Ağaçlandırma ve erozyon",
          "C": "Araba ve trafik",
          "D": "Müzik ve oyun"
        },
        "answer": "B",
        "explanation": "Cümlenin temel konusu ağaçlandırma-erozyon ilişkisidir."
      },
      {
        "prompt": "“Yeniden kullanılabilir şişeler plastik atık miktarını azaltabilir.” Temel kavramlar nedir?",
        "options": {
          "A": "Sıcaklık ve ışık",
          "B": "Hız ve mesafe",
          "C": "Plastik atık ve yeniden kullanım",
          "D": "Kitap ve defter"
        },
        "answer": "C",
        "explanation": "Ana fikir yeniden kullanımın plastik atıkları azaltmasına ilişkindir."
      },
      {
        "prompt": "“Düzenli uyku bellek ve dikkati destekler.” En uygun anahtar kelime hangisidir?",
        "options": {
          "A": "Düzenli uyku",
          "B": "Şehir trafiği",
          "C": "Kış tatili",
          "D": "İnternet hızı"
        },
        "answer": "A",
        "explanation": "Temel konu düzenli uykunun etkisidir."
      },
      {
        "prompt": "“Toprak, bitki köklerine su ve mineral sağlar.” Anahtar ikili hangisidir?",
        "options": {
          "A": "Film ve kitap",
          "B": "Balık ve deniz",
          "C": "Renk ve ışık",
          "D": "Toprak ve bitki kökü"
        },
        "answer": "D",
        "explanation": "İfade toprak-kök ilişkisini ele alır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      6
    ],
    "topicTags": [
      "Metinde anahtar kelimeler"
    ],
    "sourceThemeId": "TYMM.TR.6.T1"
  },
  {
    "id": "grade6-tr-exemplification-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Metinde örneklendirme ve karşılaştırma",
    "skill": "Düşünceyi geliştirmede örneklendirme ile karşılaştırmayı ayırt etme",
    "explanation": "Örneklendirme bir düşünceyi somut örneklerle açar. Karşılaştırma iki varlığın ortak ya da farklı özelliklerini gösterir.",
    "misconception": "İki örneği sıralamayı her zaman karşılaştırma sanmak.",
    "worked": {
      "prompt": "“Kimi şehirlerde bisiklet yolları yaygın; örneğin bazı yerlerde okullara ayrı bisiklet yolu yapılmıştır.” Hangi yol kullanılır?",
      "steps": [
        "Genel düşünce: bisiklet yollarının yaygınlığı.",
        "‘Örneğin’ sözcüğü belirli durumu anlatır.",
        "Burada örneklendirme vardır."
      ],
      "answer": "Örneklendirme"
    },
    "exercises": [
      {
        "prompt": "“Bu kütüphane eski binaya göre daha geniştir.” Hangi yol kullanılmıştır?",
        "options": {
          "A": "Tanımlama",
          "B": "Örneklendirme",
          "C": "Karşılaştırma",
          "D": "Benzetme"
        },
        "answer": "C",
        "explanation": "İki bina büyüklük yönünden karşılaştırılmıştır."
      },
      {
        "prompt": "“Meyvelerden elma, armut ve ayva kış aylarında da bulunabilir.” Hangisi kullanılmıştır?",
        "options": {
          "A": "Örneklendirme",
          "B": "Tanık gösterme",
          "C": "Abartma",
          "D": "Karşılaştırma"
        },
        "answer": "A",
        "explanation": "Meyve türleri, genel düşüncenin örnekleri olarak verilmiştir."
      },
      {
        "prompt": "“Birinci çanta 3 kg, ikinci çanta 5 kg.” Cümle ne yapmaktadır?",
        "options": {
          "A": "Bir masal anlatmaktadır",
          "B": "Bir karakter tanımlamaktadır",
          "C": "Bir amaç göstermektedir",
          "D": "Ağırlıkları karşılaştırmaktadır"
        },
        "answer": "D",
        "explanation": "İki çantanın ağırlıkları verilerek karşılaştırma yapılır."
      },
      {
        "prompt": "“Bazı sporlar takım hâlinde yapılır; örneğin voleybol ve basketbol.” Kullanılan yol hangisidir?",
        "options": {
          "A": "Koşul-sonuç",
          "B": "Örneklendirme",
          "C": "Tezat",
          "D": "Tanımlama"
        },
        "answer": "B",
        "explanation": "Takım sporlarına somut örnekler sunulmuştur."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      6
    ],
    "topicTags": [
      "Metinde örneklendirme ve karşılaştırma"
    ],
    "sourceThemeId": "TYMM.TR.6.T3"
  },
  {
    "id": "grade5-science-moon-model-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Ay evrelerini modelle açıklama",
    "skill": "Güneş-Dünya-Ay ilişkisini kullanarak Ay'ın evrelerini modelde gösterme",
    "explanation": "Ay'ın evreleri, Güneş ışığıyla aydınlanan Ay yüzeyinin Dünya'dan görülen bölümünün değişmesiyle oluşur. Ay kendi ışığını üretmez. Evreleri göstermek için bir ışık kaynağı ve kürelerle model kurulabilir.",
    "misconception": "Ay'ın evrelerini Dünya'nın gölgesinin Ay'a düşmesiyle açıklamak; bu durum tutulmayla karıştırılır.",
    "worked": {
      "prompt": "El feneri Güneş'i, top Ay'ı temsil ediyor. Evre modeli için topun konumu niçin değiştirilir?",
      "steps": [
        "Fenerin aydınlattığı top yüzeyini gözlemle.",
        "Topun gözlemciye göre konumu değişince aydınlık kısmın görünen oranı değişir.",
        "Bu değişim Ay'ın farklı evrelerini temsil eder."
      ],
      "answer": "Görünen aydınlık kısmın değişimini göstermek için"
    },
    "exercises": [
      {
        "prompt": "Ay'ın Dünya'dan farklı evrelerde görünmesinin temel nedeni nedir?",
        "options": {
          "A": "Ay'ın her gece büyümesi",
          "B": "Güneş ışığıyla aydınlanan kısmının görünen oranının değişmesi",
          "C": "Ay'ın ışığının kapanması",
          "D": "Dünya'nın her gece Ay'a gölge düşürmesi"
        },
        "answer": "B",
        "explanation": "Evreler aydınlık yarım kürenin gözlemciye göre görünen kısmıyla ilgilidir."
      },
      {
        "prompt": "Ay evrelerini canlandırmak için aşağıdakilerden hangisi uygun bir araç setidir?",
        "options": {
          "A": "İki mıknatıs ve ip",
          "B": "Terazi ve termometre",
          "C": "Işık kaynağı, top ve gözlemci",
          "D": "Cetvel ve saat"
        },
        "answer": "C",
        "explanation": "Işık kaynağı Güneş'i, top Ay'ı, gözlemci Dünya'daki bakışı temsil eder."
      },
      {
        "prompt": "Ay'ın kendi ışığı için doğru ifade hangisidir?",
        "options": {
          "A": "Güneş'ten aldığı ışığı yansıtır",
          "B": "Kendi ışığını üretir",
          "C": "Her gece ışık rengi değişir",
          "D": "Dünya'nın ışığını üretir"
        },
        "answer": "A",
        "explanation": "Ay'ın görünürlüğü yansıttığı Güneş ışığından kaynaklanır."
      },
      {
        "prompt": "Ay'ın evreleri ile Ay tutulması neden aynı olay değildir?",
        "options": {
          "A": "İkisinde de Ay ışık saçar",
          "B": "İkisinde de hava değişir",
          "C": "İkisinde de Ay büyür",
          "D": "Tutulmada Dünya'nın gölgesi rol oynar, normal evrelerde oynamaz"
        },
        "answer": "D",
        "explanation": "Normal evreler görülen aydınlık yüzeyle; tutulma Dünya'nın gölgesiyle ilgilidir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      5
    ],
    "topicTags": [
      "Ay evrelerini modelle açıklama"
    ],
    "sourceThemeId": "TYMM.FB.5.U1"
  },
  {
    "id": "grade5-science-force-dynamometer-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Kuvveti dinamometreyle ölçme",
    "skill": "Dinamometreyle kuvvet ölçümünü Newton cinsinden yorumlama",
    "explanation": "Kuvvetin büyüklüğü dinamometre ile ölçülür. SI birimi Newton (N) olarak gösterilir. Yaylı araçlarda uzama, uygun ölçüm aralığında uygulanan kuvvetle ilişkilidir.",
    "misconception": "Kuvvetin kilogram (kg) cinsinden ölçüldüğünü sanmak.",
    "worked": {
      "prompt": "Bir dinamometrenin göstergesi 4 N işaretini gösteriyor. Kuvvetin büyüklüğü nedir?",
      "steps": [
        "Ölçme aracını belirle: dinamometre.",
        "Ölçek üzerindeki göstergeyi oku: 4.",
        "Birimiyle ifade et: 4 N."
      ],
      "answer": "4 N"
    },
    "exercises": [
      {
        "prompt": "Kuvvetin büyüklüğünü ölçen araç hangisidir?",
        "options": {
          "A": "Termometre",
          "B": "Dinamometre",
          "C": "Barometre",
          "D": "Kronometre"
        },
        "answer": "B",
        "explanation": "Dinamometre kuvveti ölçer."
      },
      {
        "prompt": "Kuvvetin birimi hangisidir?",
        "options": {
          "A": "Kelvin",
          "B": "Kilogram",
          "C": "Newton",
          "D": "Litre"
        },
        "answer": "C",
        "explanation": "Kuvvet Newton (N) ile ifade edilir."
      },
      {
        "prompt": "Dinamometre 6 N gösteriyorsa kuvvetin büyüklüğü hangisidir?",
        "options": {
          "A": "6 N",
          "B": "6 kg",
          "C": "6 m",
          "D": "6 L"
        },
        "answer": "A",
        "explanation": "Ölçüm kuvvet birimiyle 6 N'dir."
      },
      {
        "prompt": "Aynı uygun ölçüm aralığındaki yaylı dinamometreye daha büyük kuvvet uygulanırsa ne gözlenir?",
        "options": {
          "A": "Yay her zaman kısalır",
          "B": "Kuvvet birimi değişir",
          "C": "Sıcaklık sıfır olur",
          "D": "Yayın uzaması genellikle artar"
        },
        "answer": "D",
        "explanation": "Yay uzaması kuvvetle ilişkili olarak artabilir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      5
    ],
    "topicTags": [
      "Kuvveti dinamometreyle ölçme"
    ],
    "sourceThemeId": "TYMM.FB.5.U2"
  },
  {
    "id": "grade6-science-planets-classify-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Gezegenleri sınıflandırma",
    "skill": "Güneş Sistemi gezegenlerini iç/dış ve kayasal/gaz-dev sınıflarına ayırma",
    "explanation": "Merkür, Venüs, Dünya ve Mars iç ve kayasal gezegenlerdir. Jüpiter, Satürn, Uranüs ve Neptün dış gezegenlerdir; Jüpiter ve Satürn gaz devi, Uranüs ve Neptün buz devi olarak sınıflanır.",
    "misconception": "Bütün dış gezegenleri kayasal veya bütün gezegenleri aynı boyutta sanmak.",
    "worked": {
      "prompt": "Merkür, Venüs, Dünya ve Mars neden bir gruptur?",
      "steps": [
        "Güneş'e görece yakın dört gezegeni belirle.",
        "Temel yapılarının kayasal olduğunu göz önünde bulundur.",
        "Bu grup iç/kayasal gezegenleri oluşturur."
      ],
      "answer": "İç ve kayasal gezegenler olmaları"
    },
    "exercises": [
      {
        "prompt": "Hangisi iç ve kayasal bir gezegendir?",
        "options": {
          "A": "Jüpiter",
          "B": "Satürn",
          "C": "Mars",
          "D": "Neptün"
        },
        "answer": "C",
        "explanation": "Mars dört iç kayasal gezegenden biridir."
      },
      {
        "prompt": "Hangi gezegen gaz devi olarak sınıflandırılır?",
        "options": {
          "A": "Jüpiter",
          "B": "Merkür",
          "C": "Venüs",
          "D": "Dünya"
        },
        "answer": "A",
        "explanation": "Jüpiter bir gaz devidir."
      },
      {
        "prompt": "Hangisi dış gezegenlerden biridir?",
        "options": {
          "A": "Merkür",
          "B": "Venüs",
          "C": "Mars",
          "D": "Uranüs"
        },
        "answer": "D",
        "explanation": "Uranüs dış gezegen ve buz devidir."
      },
      {
        "prompt": "Gezegenleri sınıflandırırken hangi özellik kullanılabilir?",
        "options": {
          "A": "Öğrencilerin sevdiği renk",
          "B": "Güneş'e uzaklık ve yapısal özellikler",
          "C": "Gezegen adının harf sayısı",
          "D": "Gezegenin keşif filmlerindeki rolü"
        },
        "answer": "B",
        "explanation": "Bilimsel sınıflamada gözlenebilir/ölçülebilir nitelikler kullanılır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      6
    ],
    "topicTags": [
      "Gezegenleri sınıflandırma"
    ],
    "sourceThemeId": "TYMM.FB.6.U1"
  },
  {
    "id": "grade6-science-conductivity-test-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "İletken ve yalıtkan maddeleri deneyle karşılaştırma",
    "skill": "Basit devrede güvenli deneyle iletkenlik durumlarını ayırt etme",
    "explanation": "İletkenler elektrik akımının geçmesine elverişlidir; metaller genellikle iyi iletkendir. Plastik ve kuru ahşap gibi maddeler çoğunlukla yalıtkandır. Güvenli sınıf deneylerinde yalnız düşük gerilimli pil düzenekleri kullanılmalıdır; priz şebekesine müdahale edilmez.",
    "misconception": "Islak malzemenin özelliklerini göz ardı ederek bütün ahşabı veya tüm suları tam yalıtkan kabul etmek.",
    "worked": {
      "prompt": "Pil ve küçük ampulle kurulan güvenli devrede metal ataş bağlandığında ampul yanıyor. Bu durum neyi gösterir?",
      "steps": [
        "Pil devresinin tamamlandığını kontrol et.",
        "Metal ataş bağlantısında ampulün yandığını gözle.",
        "Ataşın bu düzenekte elektrik akımını ilettiği sonucuna ulaş."
      ],
      "answer": "Metal ataş bu devrede iletkendir."
    },
    "exercises": [
      {
        "prompt": "Düşük gerilimli sınıf devresinde hangi parça genellikle iletken olarak kullanılır?",
        "options": {
          "A": "Plastik tarak",
          "B": "Lastik silgi",
          "C": "Metal ataş",
          "D": "Kuru tahta cetvel"
        },
        "answer": "C",
        "explanation": "Metallerin çoğu elektrik akımını iyi iletir."
      },
      {
        "prompt": "Hangi malzeme genellikle elektrik yalıtkanıdır?",
        "options": {
          "A": "Plastik kaplama",
          "B": "Bakır tel",
          "C": "Alüminyum şerit",
          "D": "Demir çivi"
        },
        "answer": "A",
        "explanation": "Plastik uygun koşullarda yalıtkan olarak kullanılır."
      },
      {
        "prompt": "Bir devrede malzemenin iletkenliği nasıl sınanır?",
        "options": {
          "A": "Prizle doğrudan temas ettirilerek",
          "B": "Çıplak kablo elle tutularak",
          "C": "Rastgele yüksek gerilim denenerek",
          "D": "Güvenli pilli devrede ampulün tepkisi gözlenerek"
        },
        "answer": "D",
        "explanation": "Pil ve küçük ampul kullanımı uygun gözetim ve güvenlik koşullarında bir deneme yolu olabilir."
      },
      {
        "prompt": "İki maddenin iletkenliğini karşılaştırırken hangi yaklaşım uygundur?",
        "options": {
          "A": "Her seferinde farklı pil kullanmak",
          "B": "Diğer devre koşullarını aynı tutmak",
          "C": "Aynı anda birçok kabloyu değiştirmek",
          "D": "Yalnız tahmin yapmak"
        },
        "answer": "B",
        "explanation": "Adil karşılaştırma için diğer değişkenler kontrol edilmelidir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      6
    ],
    "topicTags": [
      "İletken ve yalıtkan maddeleri deneyle karşılaştırma"
    ],
    "sourceThemeId": "TYMM.FB.6.U6"
  }
];
