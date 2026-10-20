import type {MicroLesson} from './bankFreeMicroLessons';
/** Original 5-choice AYT-form tasks tied to the previous MEB 2018 program, not TYMM 2026. */
export const GRADE12_AYT_LEGACY_PILOTS:readonly MicroLesson[]=[
  {
    "id": "grade12-ayt-a-1-8-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "12. sınıf AYT · Şiirde edebî anlayışı metinden değerlendirme",
    "skill": "Şiirde edebî anlayışı metinden değerlendirme",
    "explanation": "Şiirsel yaklaşımı anlamak için imge, dil, tema, söyleyiş ve biçimi birlikte değerlendir; tek sözcükle kesin akım tayin etme.",
    "misconception": "Tek soyut sözcükten şairi ve akımı kesin tanımlamak.",
    "worked": {
      "prompt": "“Bir ışık, gecenin sessizliğini sözcüklerin içine taşıdı.” dizesinin öne çıkan anlatım niteliği nedir?",
      "steps": [
        "Metnin gözlemlenebilir dil ve anlatım özelliklerini ayır.",
        "Açık kanıtı tahmin ve aşırı genellemeden ayır.",
        "İlgili metin özelliğinden hareketle gerekçeli sonuca ulaş."
      ],
      "answer": "Çağrışım ve imgeselliğe dayalı söyleyiş."
    },
    "exercises": [
      {
        "prompt": "“Gölgem, suskun sözlerimi taş duvara yazdı.” dizesinde hangisi öne çıkar?",
        "options": {
          "A": "Bilimsel nesnellik",
          "B": "Tarihî belge dili",
          "C": "İmgesel çağrışım",
          "D": "Resmî talimat dili",
          "E": "İstatistik raporu"
        },
        "answer": "C",
        "explanation": "Gölgenin sözcük yazması imgesel anlatımdır."
      },
      {
        "prompt": "“İnsanın yaşadığı çevrenin sorunlarına ses vermesi gerekir.” cümlesiyle önceki imgesel dize karşılaştırılırsa hangi fark vardır?",
        "options": {
          "A": "Her ikisi kronoloji verir",
          "B": "Bu cümle iletiyi daha açık ve toplumsal yönde kurar",
          "C": "Şairlerin doğum tarihleri bellidir",
          "D": "İkisi de deney raporudur",
          "E": "Hiçbirinde ileti yoktur"
        },
        "answer": "B",
        "explanation": "Toplumsal sorumluluk iletisi burada doğrudan açıklanır."
      },
      {
        "prompt": "İki şiirin edebî yaklaşımını değerlendirirken en güçlü ölçüt hangisidir?",
        "options": {
          "A": "Şairlerin doğum ayı",
          "B": "Kitap kapağının rengi",
          "C": "Baskı sayısının tek başına artışı",
          "D": "Metindeki imge, tema, dil ve biçim özellikleri",
          "E": "Sayfanın büyüklüğü"
        },
        "answer": "D",
        "explanation": "Edebî anlayışı metne yansıyan birden çok özellik açıklar."
      },
      {
        "prompt": "Toplumsal konulu bir şiirden yalnız bu bilgiyle kesin edebî akım çıkaran okurun hatası nedir?",
        "options": {
          "A": "Metin kanıtını çoğaltmadan kesin hüküm vermek",
          "B": "Temayı belirlemek",
          "C": "Dilin özelliklerini incelemek",
          "D": "Karşılaştırma yapmak",
          "E": "İleti aramak"
        },
        "answer": "A",
        "explanation": "Tek tema, bir akımı kesin kanıtlamaz."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      12
    ],
    "topicTags": [
      "Şiirde edebî anlayışı metinden değerlendirme"
    ],
    "sourceUrl": "https://mufredat.meb.gov.tr/Dosyalar/20221229132522794-T%C3%BCrk%20Dili%20ve%20Edebiyat%C4%B1%20Dersi%20%C3%96%C4%9Fretim%20Program%C4%B1.pdf",
    "sourceThemeId": "LEGACY.12.A.1.8"
  },
  {
    "id": "grade12-ayt-a-1-9-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "12. sınıf AYT · Şiirde açık ve örtük iletiyi yorumlama",
    "skill": "Şiirde açık ve örtük iletiyi yorumlama",
    "explanation": "Örtük anlam; imge, karşıtlık, bağlam ve sözcük seçimleriyle desteklenerek yorumlanır. Tek sözcüğü bağlamdan kopararak kesin anlam yüklememek gerekir.",
    "misconception": "Mecazı literal yorumlayıp şiirin duygusal yönünü kaçırmak.",
    "worked": {
      "prompt": "“Kapalı pencereye gün ışığı değil, çocukluğumun sesi dokundu.” ifadesini yorumla.",
      "steps": [
        "Metnin gözlemlenebilir dil ve anlatım özelliklerini ayır.",
        "Açık kanıtı tahmin ve aşırı genellemeden ayır.",
        "İlgili metin özelliğinden hareketle gerekçeli sonuca ulaş."
      ],
      "answer": "Geçmişteki anıların bugün hissedilmesi."
    },
    "exercises": [
      {
        "prompt": "“Takvimden gün eksilmedi; yalnız bekleyişim uzadı.” ifadesinde hangi anlam öne çıkar?",
        "options": {
          "A": "Takvim yanlış basılmıştır",
          "B": "Günler daha uzundur",
          "C": "Beklemek zaman algısını ağırlaştırır",
          "D": "Saatler bozulmuştur",
          "E": "Takvim yaprağı yoktur"
        },
        "answer": "C",
        "explanation": "Fiziksel takvim değil öznel zaman algısı anlatılır."
      },
      {
        "prompt": "“Yağmur sokağın tozunu sildi ama içimdeki ağırlığı kaldıramadı.” karşıtlığının işlevi?",
        "options": {
          "A": "Yağmurun kimyası anlatılır",
          "B": "Dış değişim içsel sıkıntıyı giderememiştir",
          "C": "Sokak kurudur",
          "D": "Anlatıcı hava durumu uzmanıdır",
          "E": "Şiirde duygu yoktur"
        },
        "answer": "B",
        "explanation": "Dışarıdaki temizlik iç dünyadaki değişmezlik ile karşıtlaştırılır."
      },
      {
        "prompt": "“Şehir uyandı, ben kendi gecemde kaldım.” dizesi neyi düşündürür?",
        "options": {
          "A": "Şehirde kimse uyumaz",
          "B": "Herkes aynı ruh hâlindedir",
          "C": "Kentsel istatistik verilmiştir",
          "D": "Toplumsal hareketle bireysel yalnızlık karşıtlaştırılır",
          "E": "Sabahın saati hesaplanır"
        },
        "answer": "D",
        "explanation": "Kişinin içsel yalnızlığı, şehirdeki canlanmaya karşı konur."
      },
      {
        "prompt": "Şiirde örtük iletiyi savunan yorumu hangi yöntem destekler?",
        "options": {
          "A": "İmgeleri metnin bütünü ve sözcük seçimiyle ilişkilendirmek",
          "B": "Metin dışı söylentiyle karar vermek",
          "C": "Bağlamı atlamak",
          "D": "Bir kelimeyi rastgele seçmek",
          "E": "Yorumunu gerekçesiz sunmak"
        },
        "answer": "A",
        "explanation": "Örtük ileti metindeki dil ve bağlamdan kanıtla kurulur."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      12
    ],
    "topicTags": [
      "Şiirde açık ve örtük iletiyi yorumlama"
    ],
    "sourceUrl": "https://mufredat.meb.gov.tr/Dosyalar/20221229132522794-T%C3%BCrk%20Dili%20ve%20Edebiyat%C4%B1%20Dersi%20%C3%96%C4%9Fretim%20Program%C4%B1.pdf",
    "sourceThemeId": "LEGACY.12.A.1.9"
  },
  {
    "id": "grade12-ayt-a-2-9-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "12. sınıf AYT · Roman ve hikâyede anlatım teknikleri",
    "skill": "Roman ve hikâyede anlatım teknikleri",
    "explanation": "İç konuşmada karakterin kendi zihnindeki sözleri, diyalogda karşılıklı konuşma, geriye dönüşte anlatı zamanından daha önceki olay ve özetlemede uzun zamanın kısa aktarımı belirleyicidir.",
    "misconception": "Geçmiş zaman kipi bulunan her cümleyi geriye dönüş saymak.",
    "worked": {
      "prompt": "“Gelse miydim? Belki artık geç kaldım, diye içinden geçirdi.” Hangi teknik vardır?",
      "steps": [
        "Metnin gözlemlenebilir dil ve anlatım özelliklerini ayır.",
        "Açık kanıtı tahmin ve aşırı genellemeden ayır.",
        "İlgili metin özelliğinden hareketle gerekçeli sonuca ulaş."
      ],
      "answer": "İç konuşma."
    },
    "exercises": [
      {
        "prompt": "“Otobüse bindi, ardından aklı birden beş yıl önce istasyondaki vedaya döndü.” Baskın teknik nedir?",
        "options": {
          "A": "İç çözümleme",
          "B": "Diyalog",
          "C": "Geriye dönüş",
          "D": "Tasvir",
          "E": "Belge alıntısı"
        },
        "answer": "C",
        "explanation": "Anlatı eski bir olaya yönelir."
      },
      {
        "prompt": "“— Pencereyi açtın mı? — Hayır, yağmur yağıyordu.” hangi teknik?",
        "options": {
          "A": "Özetleme",
          "B": "Diyalog",
          "C": "Bilinç akışı",
          "D": "Geriye dönüş",
          "E": "İç monolog"
        },
        "answer": "B",
        "explanation": "İki kişinin söz alışverişi doğrudan gösterilir."
      },
      {
        "prompt": "“Aramalı mıyım? Neden o gün sustum?” soruları karakterin zihninden geçer. Teknik?",
        "options": {
          "A": "Tanık gösterme",
          "B": "Öyküleme",
          "C": "Gerçeküstü öğe",
          "D": "İç konuşma",
          "E": "Betimleme"
        },
        "answer": "D",
        "explanation": "Karakterin zihnindeki doğrudan sözler iç konuşmadır."
      },
      {
        "prompt": "“Anlatıcı kahramanın yıllarca süren yolculuğunu birkaç cümlede bitirir.” teknik?",
        "options": {
          "A": "Özetleme",
          "B": "Diyalog",
          "C": "İroni",
          "D": "Geriye dönüş",
          "E": "Ayrıntılı sahneleme"
        },
        "answer": "A",
        "explanation": "Uzun süre az sözle aktarılmıştır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      12
    ],
    "topicTags": [
      "Roman ve hikâyede anlatım teknikleri"
    ],
    "sourceUrl": "https://mufredat.meb.gov.tr/Dosyalar/20221229132522794-T%C3%BCrk%20Dili%20ve%20Edebiyat%C4%B1%20Dersi%20%C3%96%C4%9Fretim%20Program%C4%B1.pdf",
    "sourceThemeId": "LEGACY.12.A.2.9"
  },
  {
    "id": "grade12-ayt-a-2-12-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "12. sınıf AYT · Öyküleyici metinde edebî yaklaşım ve gözlem",
    "skill": "Öyküleyici metinde edebî yaklaşım ve gözlem",
    "explanation": "Gündelik hayatın gözleme dayalı ayrıntıları, kişilerin idealleştirilmesi veya anlatıcı tutumu bir edebî yaklaşım hakkında kanıt sağlar; ancak tek özellik kesin akım etiketi değildir.",
    "misconception": "Bir köyü konu alan her metni aynı edebî akım olarak görmek.",
    "worked": {
      "prompt": "“Anlatıcı dar sokaktaki dükkânları, çalışanların günlük kaygılarını ve konuşmalarını ayrıntılı aktarır.” Hangi yön öne çıkar?",
      "steps": [
        "Metnin gözlemlenebilir dil ve anlatım özelliklerini ayır.",
        "Açık kanıtı tahmin ve aşırı genellemeden ayır.",
        "İlgili metin özelliğinden hareketle gerekçeli sonuca ulaş."
      ],
      "answer": "Gözleme dayalı gündelik gerçekliğe yakın anlatım."
    },
    "exercises": [
      {
        "prompt": "“İşçilerin çalışma saatleri, gelirleri ve yaşam alanları gözleme dayalı ayrıntılarla anlatılır.” değerlendirme?",
        "options": {
          "A": "Fantastik evren anlatılır",
          "B": "Kişiler mitolojik varlıklardır",
          "C": "Gerçekçi gözlem eğilimi belirgindir",
          "D": "Tarihî destan olmalıdır",
          "E": "Anlatıcı yoktur"
        },
        "answer": "C",
        "explanation": "Gündelik ve toplumsal ayrıntılar gerçekçi gözlem yaklaşımını destekler."
      },
      {
        "prompt": "“Kahraman hiçbir koşulda hata yapmaz, rakipleri tümüyle kötüdür.” temel özellik?",
        "options": {
          "A": "Belgesel nesnelliği",
          "B": "Keskin karşıtlıkla idealize edilen kişiler",
          "C": "Örneklem araştırması",
          "D": "Tam tarafsız gözlem",
          "E": "Kimyasal deney"
        },
        "answer": "B",
        "explanation": "Aşırı iyi/kötü ayrımı güçlü idealleştirme içerir."
      },
      {
        "prompt": "Bir öyküde akım etkisini değerlendirmenin en sağlam yolu hangisidir?",
        "options": {
          "A": "Kapağın rengi",
          "B": "Baskı makinesinin türü",
          "C": "Yayınevinin logosu",
          "D": "Kişi çizimi, anlatıcı, olay ve dil kanıtlarını birlikte kullanmak",
          "E": "Yalnız sayfa sayısı"
        },
        "answer": "D",
        "explanation": "Edebî etki metnin birden fazla özelliğiyle değerlendirilebilir."
      },
      {
        "prompt": "“Kentte geçen her hikâye aynı akımın ürünüdür.” iddiasının sorunu nedir?",
        "options": {
          "A": "Tek konuya bakarak kanıtsız genelleme yapmak",
          "B": "Edebî akımları sorgulamak",
          "C": "Anlatıcıyı araştırmak",
          "D": "Dil özelliklerini gözlemlemek",
          "E": "Kişi çizimini incelemek"
        },
        "answer": "A",
        "explanation": "Mekânın aynı olması metinlerin sanatsal anlayışının özdeşliğini kanıtlamaz."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      12
    ],
    "topicTags": [
      "Öyküleyici metinde edebî yaklaşım ve gözlem"
    ],
    "sourceUrl": "https://mufredat.meb.gov.tr/Dosyalar/20221229132522794-T%C3%BCrk%20Dili%20ve%20Edebiyat%C4%B1%20Dersi%20%C3%96%C4%9Fretim%20Program%C4%B1.pdf",
    "sourceThemeId": "LEGACY.12.A.2.12"
  }
];
