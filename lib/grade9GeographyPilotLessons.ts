/** Five KEKS-original age-appropriate 9th grade geography pilots; not MEB authored/approved. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const GRADE9_GEOGRAPHY_PILOTS:readonly MicroLesson[]=[
  {
    "id": "geo9-map-elements-scale-v1",
    "version": 1,
    "subject": "Coğrafya",
    "title": "Harita ölçeği ve lejantla veri yorumlama",
    "skill": "Harita öğelerini kullanarak mekânsal bilgiyi çözümleme",
    "explanation": "Haritada başlık konuyu, lejant işaretlerin anlamını, ölçek ise harita mesafesiyle gerçek uzaklığın ilişkisini gösterir. Çizgi ölçeğin verilen orantısı başka uzaklıklara da uygulanabilir. Ölçeği okumak, harita verisini yorumlamanın yalnız ilk adımıdır.",
    "misconception": "Haritada ölçülen santimetreyi doğrudan gerçekteki kilometre sanmak veya lejanttaki sembollerin anlamını tahmin etmek.",
    "worked": {
      "prompt": "Bir haritanın çizgi ölçeğinde 2 cm, 10 km'ye karşılık geliyor. Aynı haritada iki köy arası 6 cm ölçülüyor. Gerçek uzaklık kaç kilometredir?",
      "steps": [
        "Lejandın değil, uzaklık için çizgi ölçeğin kullanılacağını belirle.",
        "6 cm, 2 cm'nin 3 katıdır: 6 ÷ 2 = 3.",
        "Gerçek uzaklık 3 × 10 = 30 km'dir."
      ],
      "answer": "30 km"
    },
    "exercises": [
      {
        "prompt": "Bir haritada 1 cm gerçekte 5 km'yi gösteriyor. 4 cm'lik yol kaç kilometredir?",
        "options": {
          "A": "9 km",
          "B": "20 km",
          "C": "4 km",
          "D": "25 km"
        },
        "answer": "B",
        "explanation": "Gerçek uzaklık 4 × 5 = 20 kilometredir."
      },
      {
        "prompt": "Haritadaki mavi kesikli çizginin 'mevsimlik akarsu' anlamına geldiği bilgisi en çok nerede yer alır?",
        "options": {
          "A": "Ölçek",
          "B": "Başlık",
          "C": "Lejant",
          "D": "Kuzey oku"
        },
        "answer": "C",
        "explanation": "Lejant, haritadaki sembol ve renklerin neyi temsil ettiğini açıklar."
      },
      {
        "prompt": "Bir haritada kuzey oku eksikse hangi bilgi doğrudan zorlaşır?",
        "options": {
          "A": "Yönlerin belirlenmesi",
          "B": "Haritanın başlığının okunması",
          "C": "Görselin renkli basılması",
          "D": "Lejantın alfabetik dizilmesi"
        },
        "answer": "A",
        "explanation": "Kuzey oku temel yönelim referansı sağlar."
      },
      {
        "prompt": "Aynı çizgi ölçekte 3 cm 12 km ise haritadaki 7,5 cm kaç kilometredir?",
        "options": {
          "A": "15 km",
          "B": "22 km",
          "C": "24 km",
          "D": "30 km"
        },
        "answer": "D",
        "explanation": "Bir santimetre 4 km'dir; 7,5 × 4 = 30 km."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Harita ölçeği ve lejantla veri yorumlama"
    ],
    "sourceThemeId": "COĞ.9.2.1",
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/31"
  },
  {
    "id": "geo9-location-turkiye-v1",
    "version": 1,
    "subject": "Coğrafya",
    "title": "Türkiye'nin mutlak ve göreceli konumu",
    "skill": "Koordinatla tanımlanan konum ile çevresel konumu karşılaştırma",
    "explanation": "Mutlak konum enlem ve boylam gibi koordinatlarla belirtilir. Göreceli konum ise bir yerin başka yerlere, ulaşım hatlarına, denizlere ve boğazlara göre durumunu ifade eder. Bir ülkenin coğrafi özelliklerini anlamak için iki yaklaşım birlikte kullanılır.",
    "misconception": "Bir ülkenin denizlere ve ulaşım yollarına yakınlığını enlem–boylam koordinatı sanmak.",
    "worked": {
      "prompt": "'Türkiye kuzey yarım kürededir ve Avrupa ile Asya arasında bağlantı kurar.' ifadelerindeki konum türleri nelerdir?",
      "steps": [
        "'Kuzey yarım küre' bilgisi enlemle ilgili mutlak konuma dayanır.",
        "'Avrupa ile Asya arasında' ifadesi diğer kıtalara göre konum belirtir.",
        "İlk ifade mutlak, ikinci ifade göreceli konumdur."
      ],
      "answer": "Mutlak konum; göreceli konum"
    },
    "exercises": [
      {
        "prompt": "'Türkiye yaklaşık 36°–42° kuzey enlemleri arasındadır.' bilgisi hangi konuma örnektir?",
        "options": {
          "A": "Göreceli",
          "B": "Mutlak",
          "C": "Ekonomik",
          "D": "Kültürel"
        },
        "answer": "B",
        "explanation": "Koordinat aralığı enleme dayalı mutlak konum bilgisidir."
      },
      {
        "prompt": "Aşağıdakilerden hangisi Türkiye'nin göreceli konumuna örnektir?",
        "options": {
          "A": "Kuzey yarım kürede olması",
          "B": "Doğu boylamlarında olması",
          "C": "Üç tarafının denizlerle çevrili olması",
          "D": "36°–42° kuzey paralelleri arasında olması"
        },
        "answer": "C",
        "explanation": "Denizlere göre konum, başka coğrafi unsurlarla ilişkiyi anlatır."
      },
      {
        "prompt": "'Bir yerin Greenwich'e göre doğu veya batı yönündeki açısal konumu' hangi koordinatla verilir?",
        "options": {
          "A": "Boylam",
          "B": "Yükselti",
          "C": "Eğim",
          "D": "Alan"
        },
        "answer": "A",
        "explanation": "Boylam, başlangıç meridyenine göre açısal doğu–batı konumunu ifade eder."
      },
      {
        "prompt": "Hangisi Türkiye'nin göreceli konumunun ulaşım üzerindeki etkisine örnektir?",
        "options": {
          "A": "Günlük dönüş hızının azalması",
          "B": "Enleminin aniden değişmesi",
          "C": "Bütün şehirlerde aynı iklimin görülmesi",
          "D": "Kıtalar arası ulaşım bağlantılarında köprü görevi görmesi"
        },
        "answer": "D",
        "explanation": "Kıtalar arasındaki bağlantı, göreceli konumla ilgili işlevsel bir özelliktir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Türkiye'nin mutlak ve göreceli konumu"
    ],
    "sourceThemeId": "COĞ.9.2.2",
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/31"
  },
  {
    "id": "geo9-climate-components-v1",
    "version": 1,
    "subject": "Coğrafya",
    "title": "İklim sisteminin bileşenleri ve etkileşimleri",
    "skill": "Atmosfer, hidrosfer, litosfer, biyosfer ve kriyosfer arasındaki ilişkiyi açıklama",
    "explanation": "İklim sistemi birbirini etkileyen atmosfer, hidrosfer, litosfer, biyosfer ve kriyosferden oluşur. Sıcaklık, basınç, rüzgâr, nem ve yağış değişkenleri bu sistemde birlikte etkileşir. Bir bileşendeki değişimi yorumlarken diğerlerine etkisini de araştırmak gerekir.",
    "misconception": "İklimi yalnız hava sıcaklığına indirgemek veya buzulların iklim sisteminin bir bileşeni olmadığını düşünmek.",
    "worked": {
      "prompt": "Bir bölgede büyük buz yüzeyleri azaldığında iklim sistemi bileşenlerinden hangisi doğrudan değişir ve bu neden önemlidir?",
      "steps": [
        "Buz ve kar örtüsünün ait olduğu bileşeni belirle: kriyosfer.",
        "Buz yüzeylerinin azalması yüzeyin ışığı yansıtma özelliklerini etkileyebilir.",
        "Kriyosferdeki değişim atmosfer ve enerji dengesiyle etkileşir."
      ],
      "answer": "Kriyosfer; yüzeyin enerji dengesini etkileyebilir."
    },
    "exercises": [
      {
        "prompt": "Okyanuslar ve göller iklim sisteminin hangi bileşenine girer?",
        "options": {
          "A": "Kriyosfer",
          "B": "Litosfer",
          "C": "Hidrosfer",
          "D": "Biyosfer"
        },
        "answer": "C",
        "explanation": "Sıvı hâlde bulunan yüzey ve yer altı suları hidrosfer kapsamındadır."
      },
      {
        "prompt": "Kar ve buz örtüsünün bulunduğu sistem bileşeni hangisidir?",
        "options": {
          "A": "Kriyosfer",
          "B": "Atmosfer",
          "C": "Biyosfer",
          "D": "Litosfer"
        },
        "answer": "A",
        "explanation": "Kriyosfer, donmuş su kütleleri ile kar ve buz örtüsünü kapsar."
      },
      {
        "prompt": "Havadaki nem artışının yağış oluşumuyla ilişkisi hangi yaklaşımın örneğidir?",
        "options": {
          "A": "İklim bileşenlerinin bütünüyle ilgisiz olması",
          "B": "Sıcaklığın tek belirleyici olması",
          "C": "İnsanların mevsimleri değiştirmesi",
          "D": "İklim değişkenlerinin birbirleriyle etkileşmesi"
        },
        "answer": "D",
        "explanation": "Nem, yoğunlaşma ve yağış süreçleri arasında ilişki kurulabilir."
      },
      {
        "prompt": "Toprak ve kayaçların iklim sistemi açısından bulunduğu bileşen hangisidir?",
        "options": {
          "A": "Hidrosfer",
          "B": "Litosfer",
          "C": "Atmosfer",
          "D": "Kriyosfer"
        },
        "answer": "B",
        "explanation": "Toprak ve kayaçlar litosferin parçalarıdır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "İklim sisteminin bileşenleri ve etkileşimleri"
    ],
    "sourceThemeId": "COĞ.9.3.2",
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/34"
  },
  {
    "id": "geo9-population-graphs-v1",
    "version": 1,
    "subject": "Coğrafya",
    "title": "Nüfus tablosunu ve değişim oranlarını yorumlama",
    "skill": "Verilen nüfus zaman serilerinden değişimi hesaplayıp veri temelli çıkarım yapma",
    "explanation": "Nüfus grafiğini yorumlarken başlangıç ve bitiş değerleri, zaman aralığı, artış miktarı ve gerekiyorsa yüzdelik artış ayrılır. Yüzdelik değişim, artışın başlangıç değerine bölünmesiyle hesaplanır. Örnek sayılar gerçek TÜİK verisi değil eğitim amaçlı kurgusal verilerdir.",
    "misconception": "Nüfus artış miktarını yüzdelik artışla karıştırmak veya tabloda olmayan göç nedenlerini kesin kabul etmek.",
    "worked": {
      "prompt": "Kurgusal bir kentte nüfus 2010'da 200 bin, 2020'de 250 bin. Artış miktarı ve oranı kaçtır?",
      "steps": [
        "Artış miktarı: 250 − 200 = 50 bin kişidir.",
        "Başlangıç nüfusuna oranla hesapla: 50 ÷ 200 = 0,25.",
        "On yılda nüfus 50 bin kişi, yani %25 artmıştır."
      ],
      "answer": "50 bin; %25"
    },
    "exercises": [
      {
        "prompt": "Kurgusal bir ilçede nüfus 80 binden 100 bine çıkmıştır. Artış miktarı kaç bindir?",
        "options": {
          "A": "20",
          "B": "25",
          "C": "80",
          "D": "180"
        },
        "answer": "A",
        "explanation": "100 − 80 = 20 bin kişilik artış vardır."
      },
      {
        "prompt": "Nüfusun 150 binden 180 bine yükseldiği bir kurgusal yerde artış oranı kaçtır?",
        "options": {
          "A": "%10",
          "B": "%15",
          "C": "%20",
          "D": "%30"
        },
        "answer": "C",
        "explanation": "(180 − 150) ÷ 150 = 0,20; artış %20'dir."
      },
      {
        "prompt": "Bir nüfus tablosu yalnız 2015 ve 2025 nüfuslarını veriyorsa hangisi kesin çıkarılamaz?",
        "options": {
          "A": "Başlangıç nüfusu",
          "B": "Toplam değişim miktarı",
          "C": "İki tarih arasındaki net değişim",
          "D": "Artışın her yıl aynı hızda gerçekleştiği"
        },
        "answer": "D",
        "explanation": "Ara yılların verileri verilmediğinden yıllık değişim hızları çıkarılamaz."
      },
      {
        "prompt": "Bir kentin kurgusal nüfusu 400 binden 380 bine düşmüşse değişim miktarı nedir?",
        "options": {
          "A": "40 bin artış",
          "B": "20 bin azalış",
          "C": "20 bin artış",
          "D": "5 bin artış"
        },
        "answer": "B",
        "explanation": "380 − 400 = −20 bin; nüfus 20 bin azalmıştır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Nüfus tablosunu ve değişim oranlarını yorumlama"
    ],
    "sourceThemeId": "COĞ.9.4.1",
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/37"
  },
  {
    "id": "geo9-regional-criteria-v1",
    "version": 1,
    "subject": "Coğrafya",
    "title": "Bölge sınırlarını belirleyen ölçütler",
    "skill": "Şekilsel ve işlevsel bölgeleri ölçüte göre ayırıp sınırları yorumlama",
    "explanation": "Şekilsel bölgeler ortak bir doğal veya beşerî özelliğe göre, işlevsel bölgeler ise bir merkez çevresindeki etkileşim ve hizmet ilişkilerine göre tanımlanabilir. Bölge çizilirken seçilen ölçütün belirtilmesi önemlidir; kriter değiştiğinde sınır da değişebilir.",
    "misconception": "Bir bölgenin sınırlarının her amaçta değişmeden aynı kalacağını veya tüm bölgelerin idari sınır olduğunu sanmak.",
    "worked": {
      "prompt": "'Benzer yıllık yağış alanları' ve 'aynı hastaneden hizmet alan yerleşimler' haritaları niçin farklı bölge sınırları çizer?",
      "steps": [
        "İlk haritada yağış gibi ortak özellik esas alınır; bu şekilsel ölçüttür.",
        "İkinci haritada hizmet merkezine bağlılık esas alınır; bu işlevsel ölçüttür.",
        "Ölçüt farklı olduğu için oluşan bölge sınırları da farklı olabilir."
      ],
      "answer": "Ölçütler farklıdır: şekilsel yağış ve işlevsel hizmet ilişkisi."
    },
    "exercises": [
      {
        "prompt": "'Yıllık yağışı benzer alanlar' bir arada gösteriliyorsa hangi bölge yaklaşımı kullanılır?",
        "options": {
          "A": "İşlevsel hizmet bölgesi",
          "B": "Şekilsel bölge",
          "C": "Rastgele alan",
          "D": "Yalnız siyasi sınır"
        },
        "answer": "B",
        "explanation": "Ortak iklim niteliği esas alındığından şekilsel bölgedir."
      },
      {
        "prompt": "Bir kargo dağıtım merkezinin hizmet verdiği ilçe ve mahalleler hangi bölgeye örnektir?",
        "options": {
          "A": "İklim bölgesi",
          "B": "Jeolojik bölge",
          "C": "Şekilsel sıcaklık bölgesi",
          "D": "İşlevsel bölge"
        },
        "answer": "D",
        "explanation": "Merkezin çevreye sunduğu hizmet ve ilişki ölçüt alınmaktadır."
      },
      {
        "prompt": "Aynı yere ait iki haritada bölge sınırları farklıysa ilk sorgulanması gereken nedir?",
        "options": {
          "A": "Kullanılan bölge belirleme ölçütleri",
          "B": "Haritaların mutlaka yanlış olduğu",
          "C": "Yer şekillerinin kaybolduğu",
          "D": "Dünyanın dönmediği"
        },
        "answer": "A",
        "explanation": "Kriter değişikliği sınırları değiştirebilir."
      },
      {
        "prompt": "Bir alanın hem tarım hem ulaşım ölçütleriyle farklı bölgeler içinde yer alması neyi gösterir?",
        "options": {
          "A": "Bölgelerin zorunlu olarak çakışmadığını",
          "B": "Bütün bölgelerin tek ölçütlü olduğunu",
          "C": "Bölge sınırlarının ölçüte bağlı olduğunu",
          "D": "Bölgelerin yalnız idari olduğunu"
        },
        "answer": "C",
        "explanation": "Aynı mekân farklı amaç ve ölçütlerle birden çok bölge kapsamında ele alınabilir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Bölge sınırlarını belirleyen ölçütler"
    ],
    "sourceThemeId": "COĞ.9.7.1",
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/47"
  }
];
