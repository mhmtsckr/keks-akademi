/** Original KEKS reasoning exercises from MEB TYMM history outcomes. Pilot only, NOT MEB/ÖSYM exam questions. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const GRADE911_HISTORY_PILOT_LESSONS:readonly MicroLesson[]=[
  {
    "id": "hist9-evidence-production-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "Tarihsel bilgi nasıl üretilir?",
    "skill": "Araştırma sorusu–kaynak–eleştiri–kanıt–yorum aşamalarını ayırt etme",
    "explanation": "Tarihçi bir iddiayı araştırma sorusu olarak kurar, kaynakları toplar, oluşum bağlamını ve güvenilirliğini sınar, kanıtları karşılaştırır ve sınırlılıkları açık bir yorum yazar. Her kaynak kendi bağlamında değerlendirilmelidir.",
    "misconception": "Tek bir kaynağın bulunmasını, tarihsel olayın bütün yönleriyle kanıtlandığı anlamına getirmek.",
    "worked": {
      "prompt": "Bir araştırmacı 'Bu şehirde ticaret nasıl gelişti?' diye soruyor. Sonra dönemin kayıtlarını topluyor. Sonraki kritik adım nedir?",
      "steps": [
        "Araştırma sorusu bellidir.",
        "Belgeler toplandı ama güvenilirlikleri henüz sınanmadı.",
        "Belgenin tarihi, yazarı, amacı ve diğer kaynaklarla tutarlılığı sorgulanmalıdır."
      ],
      "answer": "Kaynakları eleştirel değerlendirmek"
    },
    "exercises": [
      {
        "prompt": "Eski bir mektubun tarihini, yazarını ve yazılma amacını araştırmak hangi basamaktır?",
        "options": {
          "A": "Kaynağı sorgulama",
          "B": "Sonuçları yayımlama",
          "C": "Soruyu unutma",
          "D": "Kanıtı ezberleme"
        },
        "answer": "A",
        "explanation": "Belgenin bağlamı ve güvenilirliğini irdelemek kaynak eleştirisidir."
      },
      {
        "prompt": "Bir tarihçi aynı olay hakkında farklı belgeler bulunca ne yapmalıdır?",
        "options": {
          "A": "İlk belgeyi tek doğru saymalıdır",
          "B": "Belgeleri kaynağı ve bağlamıyla karşılaştırmalıdır",
          "C": "Çelişenleri incelemeden atmalıdır",
          "D": "Yazar adlarını gizlemelidir"
        },
        "answer": "B",
        "explanation": "Kaynaklar arası tutarlılık ve sınırlılıklar değerlendirilir."
      },
      {
        "prompt": "Araştırmaya 'Eski bir liman kentinde pazarlar nasıl değişti?' sorusuyla başlamak hangi adımdır?",
        "options": {
          "A": "Arşivi kapatma",
          "B": "Kanıtı görmezden gelme",
          "C": "Araştırma sorusunu belirleme",
          "D": "Önceden karar verme"
        },
        "answer": "C",
        "explanation": "Bu ifade çözümlenecek tarihsel araştırma sorusudur."
      },
      {
        "prompt": "Tek bir günlüğe dayanarak bir toplumun tamamı hakkında kesin hüküm veren araştırmacının eksikliği nedir?",
        "options": {
          "A": "Soru sorması",
          "B": "Kaynak tarihini yazması",
          "C": "Belgeyi koruması",
          "D": "Kanıtın temsil gücünü sorgulamaması"
        },
        "answer": "D",
        "explanation": "Tek tanıklığın temsil ve yanlılık sınırlılıkları ele alınmalıdır."
      }
    ],
    "contentStatus": "PILOT",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/26",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Tarihsel bilgi nasıl üretilir?"
    ],
    "sourceThemeId": "TAR.9.1.3"
  },
  {
    "id": "hist9-ancient-law-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "Eski Çağ hukukunu kanıtla sorgulamak",
    "skill": "Yazılı ve yazısız kuralları, toplumsal düzen işlevini kaynaklara göre inceleme",
    "explanation": "Yazılı kanun metinleri ve toplumsal gelenekler, belirli tarihsel bağlamlarda düzen oluşturabilir. Bir kuralın varlığı ile uygulamanın toplumun bütün üyeleri için eşit gerçekleştiği iddiası farklıdır. Kanıtın kimi kapsadığını sorgulamak gerekir.",
    "misconception": "Yazılı hukuk metnindeki her kuralın her insan için aynı biçimde uygulandığını kanıtsız varsaymak.",
    "worked": {
      "prompt": "Bir kent yasası ticaret anlaşmazlıklarında kayıt tutulmasını istiyor. Bu örnekten kesin olarak hangi dar çıkarım yapılabilir?",
      "steps": [
        "Belgenin söylediği kuralı ayır: kayıt tutulması.",
        "Uygulamanın bütün kentlerde aynı olduğunu söyleyen kanıt bulunmuyor.",
        "Kuralın anlaşmazlıkları belgelemeyi hedeflediği çıkarımı yapılabilir."
      ],
      "answer": "Kayıt tutma uyuşmazlıkların çözümünü desteklemeyi amaçlar"
    },
    "exercises": [
      {
        "prompt": "Bir kanun metninde cezaların yazılı olması tek başına hangisini kanıtlamaz?",
        "options": {
          "A": "Yazılı kural bulunduğunu",
          "B": "Hukuki düzenleme yapıldığını",
          "C": "Kuralların herkese eşit uygulandığını",
          "D": "Cezanın tanımlandığını"
        },
        "answer": "C",
        "explanation": "Metnin varlığı ile pratikte eşit uygulama farklı araştırma sorularıdır."
      },
      {
        "prompt": "Yazılı yasa ve sözlü gelenek karşılaştırılırken en uygun ölçüt hangisidir?",
        "options": {
          "A": "Kuralların aktarılma ve uygulanma biçimi",
          "B": "Metnin kâğıt rengi",
          "C": "Kentin nüfusu hakkında tahmin",
          "D": "Araştırmacının kişisel beğenisi"
        },
        "answer": "A",
        "explanation": "Yazılı metin ve gelenek, aktarım ve uygulama yönünden karşılaştırılabilir."
      },
      {
        "prompt": "Bir hukuk kuralının toplumdaki etkisini araştırırken hangi kaynak birleşimi daha yararlıdır?",
        "options": {
          "A": "Yalnız güncel sosyal medya yorumu",
          "B": "Yalnız bina fotoğrafı",
          "C": "Yalnız bir şiirin ölçüsü",
          "D": "Kanun metniyle uygulamayı gösteren tarihsel kayıtlar"
        },
        "answer": "D",
        "explanation": "Normu ve uygulamayı birlikte incelemek çıkarımı güçlendirir."
      },
      {
        "prompt": "Bir kurala ilişkin iki dönem kaydı farklılık gösteriyorsa hangi yaklaşım doğrudur?",
        "options": {
          "A": "İlk kaydı kesin kabul etmek",
          "B": "Dönem ve bağlam farkını incelemek",
          "C": "Yeni kaydı gizlemek",
          "D": "Her iki metni yanlış saymak"
        },
        "answer": "B",
        "explanation": "Farklı dönemlerde hukuk ve uygulama değişmiş olabilir."
      }
    ],
    "contentStatus": "PILOT",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/27",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Eski Çağ hukukunu kanıtla sorgulamak"
    ],
    "sourceThemeId": "TAR.9.2.3"
  },
  {
    "id": "hist10-battles-timeline-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "1040–1299 tarih şeridinde askerî mücadeleler",
    "skill": "Dandanakan, Malazgirt, Miryokefalon ve Kösedağ savaşlarını kronolojik sıralama ve bağlamla karşılaştırma",
    "explanation": "1040 Dandanakan, 1071 Malazgirt, 1176 Miryokefalon ve 1243 Kösedağ farklı yüzyıl bağlamlarında farklı siyasi sonuçlar doğurmuştur. Salt sıralama değil, olayın aktörleri ve etkileri de ayrı kanıtlara dayanılarak değerlendirilmelidir.",
    "misconception": "Kronolojik olarak önce gerçekleşen savaşın sonraki bütün sonuçları tek başına belirlediğini sanmak.",
    "worked": {
      "prompt": "1040, 1071, 1176, 1243 yıllarına ait olayları en eskiden yeniye nasıl dizersin?",
      "steps": [
        "Yılları küçükten büyüğe sırala.",
        "Her yıla olayını bağla: Dandanakan, Malazgirt, Miryokefalon, Kösedağ.",
        "Sonucu bu sırada yaz; her olayın etkisini ayrı değerlendir."
      ],
      "answer": "Dandanakan → Malazgirt → Miryokefalon → Kösedağ"
    },
    "exercises": [
      {
        "prompt": "Hangisi diğer üç mücadeleden önce meydana gelmiştir?",
        "options": {
          "A": "Kösedağ",
          "B": "Miryokefalon",
          "C": "Malazgirt",
          "D": "Dandanakan"
        },
        "answer": "D",
        "explanation": "Dandanakan Savaşı 1040 yılındadır."
      },
      {
        "prompt": "Aşağıdaki olaylardan hangisi 1071 yılıyla ilişkilidir?",
        "options": {
          "A": "Malazgirt",
          "B": "Kösedağ",
          "C": "Miryokefalon",
          "D": "Dandanakan"
        },
        "answer": "A",
        "explanation": "Malazgirt Meydan Muharebesi 1071'de yapılmıştır."
      },
      {
        "prompt": "1176 yılında gerçekleşen mücadele hangisidir?",
        "options": {
          "A": "Dandanakan",
          "B": "Miryokefalon",
          "C": "Kösedağ",
          "D": "Malazgirt"
        },
        "answer": "B",
        "explanation": "Miryokefalon Savaşı 1176 tarihindedir."
      },
      {
        "prompt": "Tarih şeridinde 1243 yılına hangisi yazılır?",
        "options": {
          "A": "Malazgirt",
          "B": "Dandanakan",
          "C": "Kösedağ",
          "D": "Miryokefalon"
        },
        "answer": "C",
        "explanation": "Kösedağ Savaşı 1243 yılında gerçekleşmiştir."
      }
    ],
    "contentStatus": "PILOT",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/36",
    "targetGrades": [
      10
    ],
    "topicTags": [
      "1040–1299 tarih şeridinde askerî mücadeleler"
    ],
    "sourceThemeId": "TAR.10.1.1"
  },
  {
    "id": "hist10-settlement-economy-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "Ekonomik faaliyetler ve Türk-İslam şehirleşmesi",
    "skill": "Ticaret yolları, kervansaraylar ve yerleşim arasındaki bağı kaynaklara dayanarak sorgulama",
    "explanation": "Bir ticaret güzergâhındaki güvenli konaklama, pazar ve zanaat üretimi kentlerin ekonomik ilişkilerini etkileyebilir. Tek neden iddiasından kaçınarak coğrafya, ulaşım, güvenlik ve üretim değişkenlerini birlikte değerlendirmek gerekir.",
    "misconception": "Bir kervansarayın varlığının tek başına bir şehrin bütün büyümesini açıkladığını varsaymak.",
    "worked": {
      "prompt": "Bir güzergâhta kervansaray, pazar ve atölyelerin bulunduğu biliniyor. Hangi tarihsel ilişki araştırılabilir?",
      "steps": [
        "Ulaşım ve konaklama imkânlarını belirle.",
        "Tüccarların ve üreticilerin etkileşimini sorgula.",
        "Ticaret altyapısıyla kentteki ekonomik canlılık ilişkisini araştırma sorusu hâline getir."
      ],
      "answer": "Ticaret altyapısı ile şehir ekonomisi ilişkisi"
    },
    "exercises": [
      {
        "prompt": "Ticaret yolları üzerinde kervansarayların işlevini araştıran öğrenci öncelikle neyi incelemelidir?",
        "options": {
          "A": "Yalnız yapıların renklerini",
          "B": "Tüccarların konaklama ve güvenlik ihtiyacını",
          "C": "Güncel reklam sloganlarını",
          "D": "Kervansarayların bugünkü bilet ücretlerini"
        },
        "answer": "B",
        "explanation": "Kervansaraylar ticaretin lojistik gereksinimleriyle ilişkilidir."
      },
      {
        "prompt": "Bir şehirde pazar faaliyetlerinin artmasıyla zanaat atölyelerinin çoğalması hangi ilişkiyi düşündürür?",
        "options": {
          "A": "Savaşın bitmediğini",
          "B": "Şehirde hiç tarım yapılmadığını",
          "C": "Ticaret ve üretimin karşılıklı etkileşimini",
          "D": "Kent nüfusunun sabit kaldığını"
        },
        "answer": "C",
        "explanation": "Pazarla üretim arasındaki etkileşim ekonomik faaliyetleri açıklamaya yardımcı olur."
      },
      {
        "prompt": "Bir tarihçi 'Bu kent yalnız ticaret sayesinde büyüdü' iddiasını sınamak için ne yapmalıdır?",
        "options": {
          "A": "Coğrafya, güvenlik ve diğer etkenleri de kaynaklarla incelemelidir",
          "B": "Tek belgeyi yeterli görmelidir",
          "C": "Bütün alternatif nedenleri reddetmelidir",
          "D": "Kent haritasını kullanmamalıdır"
        },
        "answer": "A",
        "explanation": "Tek neden açıklaması diğer olası etkenlerle sınanmalıdır."
      },
      {
        "prompt": "Kervansaray, yol ve pazar kayıtları birlikte hangi konuyu araştırmaya en uygundur?",
        "options": {
          "A": "Şairlerin uyak türlerini",
          "B": "Müzik notalarının sesini",
          "C": "Bitki hücresini",
          "D": "Ulaşım ağının yerleşim ve ticarete etkisini"
        },
        "answer": "D",
        "explanation": "Belgeler yol, konaklama ve pazar ilişkisini göstermeye yöneliktir."
      }
    ],
    "contentStatus": "PILOT",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/36",
    "targetGrades": [
      10
    ],
    "topicTags": [
      "Ekonomik faaliyetler ve Türk-İslam şehirleşmesi"
    ],
    "sourceThemeId": "TAR.10.1.3"
  },
  {
    "id": "hist11-earthquakes-comparison-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "1755 Lizbon ile 1766 İstanbul depremlerini karşılaştırma",
    "skill": "Farklı dönem kaynaklarında afete ilişkin idari, sosyal ve ekonomik etkileri karşılaştırma",
    "explanation": "İki farklı şehirde yaşanan depremlerin etkilerini karşılaştırırken yalnız tarih veya can kaybı iddialarına değil, kaynak türüne, kent yapısına, yönetim tepkisine ve ekonomik yaşam üzerindeki sonuçlara bakılır. Sorgulanmayan sayıları kesin kabul etme.",
    "misconception": "Farklı şehirlerdeki afetlerin etkilerinin yalnız büyüklükle ve tek sayıyla açıklanabileceğini düşünmek.",
    "worked": {
      "prompt": "1755 Lizbon'a ilişkin bir onarım kaydıyla 1766 İstanbul'a ilişkin pazar kaydını inceliyorsun. Doğrudan hangi farklı boyutları temsil ederler?",
      "steps": [
        "İlk kaydın idari/yeniden inşa boyutuna işaret ettiğini belirle.",
        "İkinci kaydın ekonomik faaliyetlerle ilgili olduğunu ayır.",
        "Depremleri farklı etkiler bakımından karşılaştırma tablosu oluştur."
      ],
      "answer": "Yeniden inşa ve ekonomik yaşam üzerindeki etkiler"
    },
    "exercises": [
      {
        "prompt": "İki şehrin deprem sonrası etkilerini karşılaştıran bir çalışmada hangi başlıklar uygundur?",
        "options": {
          "A": "Yalnız şehir adlarının uzunluğu",
          "B": "Yalnız bugünkü hava durumu",
          "C": "Yalnız sanatçıların doğum günleri",
          "D": "Yeniden inşa, ticaret ve toplumsal yaşam"
        },
        "answer": "D",
        "explanation": "İdari, ekonomik ve sosyal sonuçları karşılaştırmak temel beceridir."
      },
      {
        "prompt": "1755 Lizbon ve 1766 İstanbul depremleri için tarihsel kaynakları değerlendirirken neye dikkat edilir?",
        "options": {
          "A": "Belgenin dönemi, yazarı ve amacı",
          "B": "Sadece kapağın rengi",
          "C": "Kaynağın dijital dosya boyutu",
          "D": "Tek tanıklığın bütün toplumu temsil ettiğine"
        },
        "answer": "A",
        "explanation": "Kaynak bağlamı tarihsel kıyaslamanın temelidir."
      },
      {
        "prompt": "Bir kayıt yalnız bir mahallenin zararını anlatıyorsa hangi çıkarım sınırlıdır?",
        "options": {
          "A": "O mahallede etki kaydı bulunması",
          "B": "Bütün şehir için aynı düzeyde hasar olduğunu söylemek",
          "C": "Kaydın belirli bir yerle ilgili olması",
          "D": "Dönemin kaydının incelenebilmesi"
        },
        "answer": "B",
        "explanation": "Yerel kayıt bütün şehir için doğrudan genellenemez."
      },
      {
        "prompt": "Afet sonrası onarım ve ticaret belgelerinin birlikte incelenmesi neyi sağlayabilir?",
        "options": {
          "A": "Görseldeki yazı tipini belirler",
          "B": "Depremin ne zaman keşfedildiğini bulur",
          "C": "Toplumsal ve ekonomik etkileri birlikte değerlendirmeyi sağlar",
          "D": "Her kaydın eksiksiz olduğunu ispatlar"
        },
        "answer": "C",
        "explanation": "Farklı belgeler afetin çeşitli yönlerine dair sınırlı kanıtlar sunar."
      }
    ],
    "contentStatus": "PILOT",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/68",
    "targetGrades": [
      11
    ],
    "topicTags": [
      "1755 Lizbon ile 1766 İstanbul depremlerini karşılaştırma"
    ],
    "sourceThemeId": "TAR.11.1.3"
  },
  {
    "id": "hist11-industrialization-alternatives-v1",
    "version": 1,
    "subject": "Tarih",
    "title": "Osmanlı'da sanayileşme için tarihsel çözüm önerileri",
    "skill": "1789–1908 sanayileşme sorununda kanıta dayalı alternatif öneri ve olası sonuç değerlendirmesi",
    "explanation": "Tarihsel sorun analizi önce dönemin koşullarını ve taraflarını anlamayı, ardından kaynaklı nedenleri belirlemeyi gerektirir. Bir çözüm önerisi hazırlanırken uygulanabilirlik, dönemin kaynakları ve olası yararlar ile maliyetler değerlendirilmelidir.",
    "misconception": "Bugünkü teknoloji ve kaynakları 19. yüzyılda aynen varmış gibi düşünerek çözüm önermek (anakronizm).",
    "worked": {
      "prompt": "19. yüzyılda bir bölgede sanayi atölyelerine nitelikli iş gücü yetmiyor. Nasıl tarihsel bağlama uygun öneri geliştirirsin?",
      "steps": [
        "Sorunun kanıtını bul: iş gücü yetersizliği.",
        "Dönemin eğitim ve üretim koşullarını incele.",
        "Mesleki öğretim gibi döneme uygun bir önerinin olası etkilerini ve sınırlarını değerlendir."
      ],
      "answer": "Dönemin koşullarına uygun mesleki eğitim seçeneğini kanıtla tartışmak"
    },
    "exercises": [
      {
        "prompt": "1789–1908 dönemiyle ilgili bir sanayileşme önerisinin tarihsel geçerliliğini artıran yaklaşım hangisidir?",
        "options": {
          "A": "Günümüz teknolojisini aynen varsaymak",
          "B": "Dönemin kaynaklarını ve koşullarını incelemek",
          "C": "Yalnız kişisel beğeniye göre karar vermek",
          "D": "Karşıt görüşleri saklamak"
        },
        "answer": "B",
        "explanation": "Öneriler dönemin olanakları ve kanıtları ışığında değerlendirilmelidir."
      },
      {
        "prompt": "Bir tarihsel çözüm önerisini değerlendirirken hangisi önemlidir?",
        "options": {
          "A": "Yalnız sloganın kısalığı",
          "B": "Yalnız afişin rengi",
          "C": "Olası yararlar, maliyetler ve uygulanabilirlik",
          "D": "Kişinin adı"
        },
        "answer": "C",
        "explanation": "Çözüm alternatifleri çok yönlü sonuçlarıyla incelenmelidir."
      },
      {
        "prompt": "Bir sanayileşme sorununu yalnız bir nedene bağlayan öğrenci hangi eksikliği taşır?",
        "options": {
          "A": "Ekonomik, idari ve teknolojik başka nedenleri sorgulamamayı",
          "B": "Tarihsel sınırı belirtmeyi",
          "C": "Kaynak kullanmayı",
          "D": "Alternatif üretmeyi"
        },
        "answer": "A",
        "explanation": "Tarihsel sorunlar çok nedenli olabilir; alternatif etkenler incelenmelidir."
      },
      {
        "prompt": "Dönemin mesleki eğitim yatırımlarını bir çözüm olarak öneren öğrenci neyi ayrıca yapmalıdır?",
        "options": {
          "A": "Kesin başarıyı varsaymalıdır",
          "B": "Diğer seçenekleri yok saymalıdır",
          "C": "Güncel fabrikaları aynı döneme yerleştirmelidir",
          "D": "Uygulamanın olası etkilerini ve sınırlılıklarını gerekçelendirmelidir"
        },
        "answer": "D",
        "explanation": "Tarihsel kararların olası sonuçlarını gerekçeli değerlendirmek gerekir."
      }
    ],
    "contentStatus": "PILOT",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/72",
    "targetGrades": [
      11
    ],
    "topicTags": [
      "Osmanlı'da sanayileşme için tarihsel çözüm önerileri"
    ],
    "sourceThemeId": "TAR.11.2.4"
  }
];
