/** Original KEKS texts; official link validates theme and listed capability, not question approval. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const GRADE7_TURKISH_THEME_LESSONS:readonly MicroLesson[]=
[
  {
    "id": "grade7-tr-surface-meaning-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Metinde açıkça verilen bilgi",
    "skill": "Metinden doğrudan çıkarılabilen bilgiyi bulma",
    "explanation": "Yüzey anlamı, metinde doğrudan belirtilen kişi, zaman, yer, olay veya gerekçeleri bulmayı gerektirir. Metnin söylemediği bir bilgiyi doğru cevap gibi ekleme.",
    "misconception": "Metinde yazmayan tahmini metinde verilmiş bilgi sanmak.",
    "worked": {
      "prompt": "“Deniz, çarşamba günü kütüphaneden aldığı kitabı cuma günü bitirdi.” Kitap hangi gün bitirildi?",
      "steps": [
        "Metindeki zaman sözcüklerini belirle: çarşamba ve cuma.",
        "Çarşamba alma, cuma bitirme eylemiyle ilişkilidir.",
        "Doğru yanıt cumadır."
      ],
      "answer": "Cuma"
    },
    "exercises": [
      {
        "prompt": "“Yağmur başladığı için sınıf pikniği salı yerine perşembe gününe alındı.” Piknik hangi güne ertelenmiştir?",
        "options": {
          "A": "Salı",
          "B": "Perşembe",
          "C": "Pazartesi",
          "D": "Cumartesi"
        },
        "answer": "B",
        "explanation": "Metinde ertelenen gün açıkça perşembe olarak belirtilmiştir."
      },
      {
        "prompt": "“Mert, eski fotoğrafları okul sergisi için anneannesinden aldı.” Fotoğraflar ne için alınmıştır?",
        "options": {
          "A": "Satılmak için",
          "B": "Çerçevelemek için",
          "C": "Okul sergisi için",
          "D": "Yarışma ödülü için"
        },
        "answer": "C",
        "explanation": "Metin fotoğrafların okul sergisi için alındığını söylüyor."
      },
      {
        "prompt": "“Mahalle korosu, cumartesi kültür merkezinde ilk konserini verdi.” Konser nerede verilmiştir?",
        "options": {
          "A": "Kültür merkezinde",
          "B": "Okul bahçesinde",
          "C": "Parkta",
          "D": "Spor salonunda"
        },
        "answer": "A",
        "explanation": "Konserin verildiği yer kültür merkezi olarak açıklanmıştır."
      },
      {
        "prompt": "“Öğrenciler deney öncesinde gözlem notlarını defterlerine yazdı.” Öğrenciler önce ne yapmıştır?",
        "options": {
          "A": "Deneyi bitirmiştir",
          "B": "Sınıftan çıkmıştır",
          "C": "Defterleri toplamıştır",
          "D": "Gözlem notlarını yazmıştır"
        },
        "answer": "D",
        "explanation": "‘Deney öncesinde’ ifadesi notların önce yazıldığını gösterir."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Hayat Boyu Gelişim",
      "Metinde açıkça verilen bilgi"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/287",
    "sourceThemeId": "TYMM.TR.7.T1",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-tr-persuasion-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "İkna mesajında kanıtı sorgulama",
    "skill": "Medya iletisinin ikna amacı ve sunulan kanıtı ayırt etme",
    "explanation": "Reklam veya kampanya mesajları bir davranışı teşvik edebilir. İddianın dayandığı kanıt, kanıtın kaynağı ve genellemenin sınırları incelenmelidir.",
    "misconception": "‘Herkes böyle yapıyor’ cümlesini tek başına bilimsel kanıt sanmak.",
    "worked": {
      "prompt": "“En çok tercih edilen yöntem budur, sen de hemen katıl!” ifadesi niçin kanıt sayılamaz?",
      "steps": [
        "Mesajın hedefini bul: okuyucunun katılmasını sağlamak.",
        "‘En çok tercih edilen’ sözünün kaynağı veya verisi belirtilmiyor.",
        "Bu bir ikna çağrısıdır; iddiayı doğrulayacak güvenilir kanıt sunulmamıştır."
      ],
      "answer": "Kanıtın kaynağı ve verisi verilmemiştir."
    },
    "exercises": [
      {
        "prompt": "“Bu ürünü bütün başarılı öğrenciler kullanır.” ifadesini değerlendirmek için en önemli eksik hangisidir?",
        "options": {
          "A": "Yazı puntosu",
          "B": "Ürünün rengi",
          "C": "İddiayı destekleyen güvenilir veri",
          "D": "Cümlede ünlem olması"
        },
        "answer": "C",
        "explanation": "‘Bütün başarılı öğrenciler’ iddiasını doğrulamak için veriye ihtiyaç vardır."
      },
      {
        "prompt": "Bir afişte “Bugün başla, hedefe ulaş!” deniyor. Mesajın temel amacı nedir?",
        "options": {
          "A": "Bir davranışa yönlendirmek",
          "B": "Bir tarihi bildirmek",
          "C": "Hava durumunu açıklamak",
          "D": "Deney raporu sunmak"
        },
        "answer": "A",
        "explanation": "Emir kipleri okuyucuyu harekete geçirmeye yöneliktir."
      },
      {
        "prompt": "“10 kişiden 8'i memnun” iddiasında hangi ayrıntı güvenilirliği değerlendirmeye en çok yardım eder?",
        "options": {
          "A": "Afişin rengi",
          "B": "Sloganın uzunluğu",
          "C": "Resmin büyüklüğü",
          "D": "Araştırmanın kimlerle ve nasıl yapıldığı"
        },
        "answer": "D",
        "explanation": "Örneklem ve yöntem bilinmeden oranı genellemek güvenli değildir."
      },
      {
        "prompt": "Reklam mesajında çok güçlü duygu ifadeleri kullanılması neyi gerektirir?",
        "options": {
          "A": "Bütün bilgileri doğru kabul etmeyi",
          "B": "Duygu etkisinden bağımsız kanıtı incelemeyi",
          "C": "Mesajı hemen paylaşmayı",
          "D": "Kaynağı hiç aramamayı"
        },
        "answer": "B",
        "explanation": "Duygusal etki ile doğrulanabilir kanıt birbirinden ayrılmalıdır."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Bir Hilal Uğruna",
      "İkna mesajında kanıtı sorgulama"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/290",
    "sourceThemeId": "TYMM.TR.7.T2",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-tr-examples-comparison-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Düşünceyi geliştirme yolları",
    "skill": "Örneklendirme ile karşılaştırmanın metindeki işlevini ayırt etme",
    "explanation": "Örneklendirme düşünceyi somut olaylarla açıklar. Karşılaştırma iki varlık veya durumu ortak ya da farklı yönleriyle ele alır. Metinde hangi amaçla kullanıldığını tespit et.",
    "misconception": "Bir metindeki bütün sayı ve isimleri otomatik olarak örnek saymak.",
    "worked": {
      "prompt": "“Kütüphaneler farklı amaçlarla kullanılır; örneğin bazı öğrenciler araştırma yapar, bazıları sessizce kitap okur.” Hangi yol kullanılmıştır?",
      "steps": [
        "İlk cümlede genel bir düşünce kurulmuştur.",
        "‘Örneğin’ sözcüğünden sonra düşünce somut durumlarla gösterilir.",
        "Düşünceyi geliştirme yolu örneklendirmedir."
      ],
      "answer": "Örneklendirme"
    },
    "exercises": [
      {
        "prompt": "“Şehirde ulaşım hızlı olabilirken köyde günlük yaşam daha sakindir.” Hangi yol baskındır?",
        "options": {
          "A": "Tanımlama",
          "B": "Benzetme",
          "C": "Karşılaştırma",
          "D": "Tanık gösterme"
        },
        "answer": "C",
        "explanation": "Şehir ile köy iki yönüyle karşılaştırılmıştır."
      },
      {
        "prompt": "“Sanatın birçok dalı vardır: resim, müzik ve heykel bunlardan bazılarıdır.” Hangi yol kullanılmıştır?",
        "options": {
          "A": "Örneklendirme",
          "B": "Karşılaştırma",
          "C": "Neden–sonuç",
          "D": "Tanık gösterme"
        },
        "answer": "A",
        "explanation": "Genel kavramın çeşitli örnekleri sıralanmıştır."
      },
      {
        "prompt": "“Geçen yıl yüz öğrenci katıldı, bu yıl yüz yirmi öğrenci katıldı.” Cümlenin öne çıkan özelliği nedir?",
        "options": {
          "A": "Kişileştirme",
          "B": "Yalnız tanımlama",
          "C": "Benzetme",
          "D": "Sayısal bilgilerle yılları karşılaştırma"
        },
        "answer": "D",
        "explanation": "İki yılın katılımı sayısal verilerle karşılaştırılmıştır."
      },
      {
        "prompt": "“Bisiklet kısa mesafede kullanışlıdır; tren ise uzun mesafede daha fazla yolcu taşıyabilir.” Hangi yol kullanılmıştır?",
        "options": {
          "A": "Abartma",
          "B": "Karşılaştırma",
          "C": "Örneklendirme",
          "D": "Tanık gösterme"
        },
        "answer": "B",
        "explanation": "İki ulaşım aracı farklı yönleriyle ele alınmıştır."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "İletişim ve Sosyal İlişkiler",
      "Düşünceyi geliştirme yolları"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/291",
    "sourceThemeId": "TYMM.TR.7.T3",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-tr-text-comparison-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Metnin içindeki unsurları karşılaştırma",
    "skill": "Aynı metinde verilen iki sanat uygulamasının ortak ve farklı yanlarını belirleme",
    "explanation": "Metin içi karşılaştırmada aynı metindeki iki bilgi kümesi karşılaştırılır. Ortak nokta ve ayrışan özellikler metnin sunduğu kanıta göre seçilmelidir.",
    "misconception": "Karşılaştırılan öğeler hakkında metinde geçmeyen genel bilgileri yanıt saymak.",
    "worked": {
      "prompt": "“Ebru su yüzeyine damlatılan boyalarla desen oluşturur; çini ise seramik yüzeyleri desenlerle süsler.” Ortak yön nedir?",
      "steps": [
        "İki sanatta da bir yüzeye desen uygulandığını belirle.",
        "Uygulama yüzeyleri farklıdır: su ve seramik.",
        "Ortak yön, desenle görsel süsleme yapılmasıdır."
      ],
      "answer": "Desenle süsleme yapılması"
    },
    "exercises": [
      {
        "prompt": "“Karagöz gölge oyunu, meddahlık ise tek anlatıcının hikâye sunduğu gösteridir.” Fark hangisidir?",
        "options": {
          "A": "İkisi de yalnız sinemada oynanır",
          "B": "Biri gölge figürleriyle, diğeri anlatıcıyla sunulur",
          "C": "İkisinin de tekniği aynıdır",
          "D": "İkisi de şarkı yarışmasıdır"
        },
        "answer": "B",
        "explanation": "Metinde sunum araçlarının farklılığı açıkça belirtilmiştir."
      },
      {
        "prompt": "“Minyatür kitap sayfalarında, duvar resmi ise büyük mimari yüzeylerde görülebilir.” Metne göre ayırt edici özellik nedir?",
        "options": {
          "A": "Kullanıldıkları yüzeyin farklılığı",
          "B": "Birinin her zaman daha güzel olması",
          "C": "İkisinin aynı malzemeyle yapılması",
          "D": "Birinin daha eski olması"
        },
        "answer": "A",
        "explanation": "Metin yalnız uygulama yüzeylerini karşılaştırıyor."
      },
      {
        "prompt": "“İki sergide de geleneksel desenler kullanıldı; ilk sergide kumaş, ikincisinde seramik eserler vardı.” Ortak özellik nedir?",
        "options": {
          "A": "Sergilerin aynı şehirde olması",
          "B": "Bütün eserlerin aynı boyutta olması",
          "C": "Eserlerin tek sanatçıya ait olması",
          "D": "Geleneksel desenlerin bulunması"
        },
        "answer": "D",
        "explanation": "Ortaklık metinde desenlerde kurulmuştur."
      },
      {
        "prompt": "“Bir sanatçı çalışmalarını kâğıtta, diğeri ahşap üzerinde hazırladı.” Hangisi kesin söylenir?",
        "options": {
          "A": "İkincinin daha iyi olduğu",
          "B": "İkisinin de yağlı boya yaptığı",
          "C": "Çalışma yüzeylerinin farklı olduğu",
          "D": "Serginin yurt dışında açıldığı"
        },
        "answer": "C",
        "explanation": "Yalnızca kullanılan yüzeylerin farklılığı verilmiştir."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Türk Sanatı",
      "Metnin içindeki unsurları karşılaştırma"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/293",
    "sourceThemeId": "TYMM.TR.7.T4",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-tr-keywords-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Anahtar kelimelerle konuyu belirleme",
    "skill": "Bilgilendirici metnin kapsamını taşıyan anahtar sözcükleri seçme",
    "explanation": "Anahtar kelimeler metnin ele aldığı temel konuyu ve tekrar eden önemli kavramları temsil eder. Rastlantısal bir sıfat veya ayrıntı çoğu zaman anahtar kelime değildir.",
    "misconception": "Metindeki her sözcüğün anahtar kelime olarak aynı önem taşıdığını düşünmek.",
    "worked": {
      "prompt": "“Geri dönüşüm sayesinde kâğıt yeniden kullanılabilir, atık miktarı azalabilir.” Hangi iki ifade anahtar olur?",
      "steps": [
        "Temel kavramı belirle: geri dönüşüm.",
        "Metnin ilişkili sonucunu bul: atık miktarının azalması.",
        "Anahtar ifadeler: geri dönüşüm ve atık azaltma."
      ],
      "answer": "Geri dönüşüm ve atık azaltma"
    },
    "exercises": [
      {
        "prompt": "“Toprak, bitkilere su ve mineral sağlar; kökler bu kaynakları alır.” Anahtar kelimeler hangisidir?",
        "options": {
          "A": "Kitap ve kalem",
          "B": "Rüzgâr ve bulut",
          "C": "Toprak ve bitki kökü",
          "D": "Okul ve spor"
        },
        "answer": "C",
        "explanation": "Parça toprak ile kökün kaynak kullanımı ilişkisini anlatır."
      },
      {
        "prompt": "“Düzenli uyku, dikkat ve öğrenme süreçlerini destekler.” En uygun anahtar kelime hangisidir?",
        "options": {
          "A": "Düzenli uyku",
          "B": "Ulaşım",
          "C": "Spor salonu",
          "D": "Alışveriş"
        },
        "answer": "A",
        "explanation": "Cümlenin öznesi ve temel düşünce ilişkisi düzenli uykudur."
      },
      {
        "prompt": "“İklim koşulları tarım ürünlerinin yetiştiği bölgeleri etkileyebilir.” Hangi ikili anahtar kavramdır?",
        "options": {
          "A": "Boya ve heykel",
          "B": "Oyun ve müzik",
          "C": "Sokak ve trafik",
          "D": "İklim ve tarım"
        },
        "answer": "D",
        "explanation": "Metin iklim ile tarım arasındaki etkileşimi açıklar."
      },
      {
        "prompt": "“Kütüphanelerde kaynak seçimi, araştırmanın niteliğini artırabilir.” Hangi ifade anahtar konudur?",
        "options": {
          "A": "Bisiklet kullanımı",
          "B": "Kaynak seçimi",
          "C": "Ayakkabı üretimi",
          "D": "Yemek tarifi"
        },
        "answer": "B",
        "explanation": "Konu araştırma için uygun kaynak seçilmesidir."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Okuma Kültürü",
      "Anahtar kelimelerle konuyu belirleme"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/309",
    "sourceThemeId": "TYMM.TR.7.T5",
    "contentStatus": "PILOT"
  },
  {
    "id": "grade7-tr-media-evaluation-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Dijital haberde kaynağı değerlendirme",
    "skill": "Bir dijital medya içeriğinde kanıt, tarih ve kaynağı sorgulama",
    "explanation": "Dijital metni değerlendirirken yayın tarihi, içerik üreticisi ve iddiaların dayandığı veriler incelenir. Paylaşım sayısı tek başına bilginin doğruluğunu kanıtlamaz.",
    "misconception": "Çok paylaşılan her iletinin doğrulanmış haber olduğunu varsaymak.",
    "worked": {
      "prompt": "“Bu okulda yarından itibaren bütün dersler çevrim içi!” diyen, kaynağı bulunmayan paylaşım karşısında ne yapılır?",
      "steps": [
        "İddianın resmî karar içerdiğini fark et.",
        "Kaynak ve tarih belirtilmediğini kontrol et.",
        "Okulun veya yetkili kurumun resmî açıklamasını doğrulamadan paylaşma."
      ],
      "answer": "Resmî açıklamayı kontrol etmek"
    },
    "exercises": [
      {
        "prompt": "Kaynağı belirsiz bir haberi paylaşmadan önce en doğru işlem nedir?",
        "options": {
          "A": "Hemen herkese göndermek",
          "B": "Başlığını büyütmek",
          "C": "Yorum sayısını artırmak",
          "D": "Güvenilir kaynakla doğrulamak"
        },
        "answer": "D",
        "explanation": "Bilgi, özellikle yetkili veya bağımsız güvenilir kaynaklarla karşılaştırılmalıdır."
      },
      {
        "prompt": "Bir haberin geçmiş yıllara ait olup bugünmüş gibi dolaşması hangi bilgiyle anlaşılabilir?",
        "options": {
          "A": "Yayımlanma tarihi",
          "B": "Görseldeki renkler",
          "C": "Başlığın harf sayısı",
          "D": "Yorumların uzunluğu"
        },
        "answer": "A",
        "explanation": "Yayın tarihini kontrol etmek eski haberlerin bağlamını belirler."
      },
      {
        "prompt": "“Binlerce kişi paylaştı, öyleyse kesin doğru.” düşüncesi niçin hatalıdır?",
        "options": {
          "A": "Paylaşım yapan herkes gazetecidir",
          "B": "Paylaşım sayısı tek başına doğruluk kanıtı değildir",
          "C": "Bütün haberler gizlidir",
          "D": "Başlıklar kısadır"
        },
        "answer": "B",
        "explanation": "Popülerlik ve doğruluk farklı şeylerdir."
      },
      {
        "prompt": "Bir dijital metinde alıntılanan istatistiği değerlendirirken hangisi önemlidir?",
        "options": {
          "A": "Arka plan müziği",
          "B": "Emoji sayısı",
          "C": "Verinin kaynağı ve tarihi",
          "D": "Yorumların sırası"
        },
        "answer": "C",
        "explanation": "İstatistiğin kaynağı ve güncelliği yorumun güvenilirliğini etkiler."
      }
    ],
    "targetGrades": [
      7
    ],
    "topicTags": [
      "Hak ve Sorumluluklar",
      "Dijital haberde kaynağı değerlendirme"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/312",
    "sourceThemeId": "TYMM.TR.7.T6",
    "contentStatus": "PILOT"
  }
];
