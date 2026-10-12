/** Hand-authored geography practice: MEB-verified outcomes, KEKS-original questions, expert review pending. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const GRADE10_GEOGRAPHY_PILOTS:readonly MicroLesson[]=[
  {
    "id": "geo10-co--10-1-1-v1",
    "version": 1,
    "subject": "Coğrafya",
    "targetGrades": [
      10
    ],
    "title": "Coğrafi olayın mekânsal ilişkileri",
    "skill": "Bir mekândaki olayın konumunu ve yakın çevresiyle ilişkisini açıklama",
    "explanation": "Coğrafi bakış bir olayın nerede meydana geldiğini, hangi doğal ve beşerî koşullarla ilişkili olduğunu ve yakın çevreye etkilerini sorgular. Mekânı yalnız yer adı olarak düşünmek yeterli değildir.",
    "misconception": "Olayın gerçekleştiği şehrin adını söylemeyi coğrafi ilişki analizi sanmak.",
    "worked": {
      "prompt": "Bir liman çevresinde depoların artması coğrafi olarak nasıl açıklanır?",
      "steps": [
        "Limanın kıyıdaki konumunu belirle.",
        "Ulaşım, ticaret ve depolama ilişkisini kur.",
        "Kıyı ulaşımı ticari işlevleri ve depo konumunu etkiler."
      ],
      "answer": "Ulaşım ve ticaretle mekânsal ilişki"
    },
    "exercises": [
      {
        "prompt": "Bir havaalanı yakınında otellerin kümelenmesini açıklayan en uygun coğrafi ilişki nedir?",
        "options": {
          "A": "Ulaşım erişilebilirliği ve konaklama ihtiyacı",
          "B": "Yalnız taşın rengi",
          "C": "Sadece gün uzunluğu",
          "D": "Yalnız deniz tuzluluğu"
        },
        "answer": "A",
        "explanation": "Ulaşım merkezi, konaklama talebi ve işletme konumuyla ilişkilidir."
      },
      {
        "prompt": "Bir köyde tarımsal sulamanın yaygınlaşmasının çevre üzerindeki etkisini araştırırken hangi veri önceliklidir?",
        "options": {
          "A": "Spor müsabakası sonuçları",
          "B": "Şarkı listesi",
          "C": "Su kullanımı ve yer altı su seviyesi",
          "D": "Sinema gösterim saati"
        },
        "answer": "C",
        "explanation": "Sulanmanın etkisi su kullanım miktarı ve kaynak durumuyla sorgulanır."
      },
      {
        "prompt": "Bir fırtına haberinde olayın etkilediği mahallelerin haritada gösterilmesi hangi coğrafi soruya yanıt verir?",
        "options": {
          "A": "Kim yazdı?",
          "B": "Nerede gerçekleşti?",
          "C": "Hangi dilde söylendi?",
          "D": "Kaç harften oluştu?"
        },
        "answer": "B",
        "explanation": "Harita olayın mekânsal dağılışını ve konumunu gösterir."
      },
      {
        "prompt": "Kente yeni bir köprü yapılmasının mahalle ulaşımına etkisini incelemek için hangi yaklaşım uygundur?",
        "options": {
          "A": "Yalnız köprünün rengini belirlemek",
          "B": "Yalnız adını öğrenmek",
          "C": "Hiç veri kullanmamak",
          "D": "Önce ve sonra erişim güzergâhlarını haritalamak"
        },
        "answer": "D",
        "explanation": "Köprü bağlantısı güzergâhların mekânsal erişilebilirliğini etkileyebilir."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Coğrafi olayın mekânsal ilişkileri"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/56",
    "sourceThemeId": "COĞ.10.1.1"
  },
  {
    "id": "geo10-co--10-2-1-v1",
    "version": 1,
    "subject": "Coğrafya",
    "targetGrades": [
      10
    ],
    "title": "CBS ve uzaktan algılamanın kullanım alanları",
    "skill": "Mekânsal verinin farklı uygulamalarda hangi amaçla kullanıldığını çözümleme",
    "explanation": "Uzaktan algılama, uydu ve hava görüntüleri gibi sensörlerle uzaktan bilgi toplar. Coğrafi Bilgi Sistemleri (CBS) ise konuma bağlı veriyi depolar, işler, ilişkilendirir ve haritalar. İkisi birlikte kullanılabilir ama aynı işlem değildir.",
    "misconception": "Bir uydu görüntüsünün tek başına bütün CBS analizlerini yaptığını varsaymak.",
    "worked": {
      "prompt": "Orman alanındaki yıllık değişimi incelemek isteyen uzman nasıl veri kullanır?",
      "steps": [
        "Aynı alanın farklı tarihli uydu görüntülerini toplar.",
        "Orman örtüsünü sınıflandırıp konuma bağlar.",
        "CBS ile değişimin alanını ve dağılışını haritada gösterir."
      ],
      "answer": "Uzaktan algılama verisini CBS'de çözümlemek"
    },
    "exercises": [
      {
        "prompt": "Uydu görüntüsüyle geniş bir bölgedeki kar örtüsünün izlenmesi hangi yönteme örnektir?",
        "options": {
          "A": "Kimyasal titrasyon",
          "B": "Uzaktan algılama",
          "C": "Müzik notasyonu",
          "D": "Laboratuvar tartımı"
        },
        "answer": "B",
        "explanation": "Uydu algılayıcıları yüzey verisini uzaktan toplar."
      },
      {
        "prompt": "CBS'nin temel kullanım amaçlarından biri hangisidir?",
        "options": {
          "A": "Yalnız metin düzeltmek",
          "B": "Fiziksel kayaç üretmek",
          "C": "Konuma bağlı verileri analiz edip haritalamak",
          "D": "Yalnız takvim oluşturmak"
        },
        "answer": "C",
        "explanation": "CBS konumsal katmanların yönetimi ve analizinde kullanılır."
      },
      {
        "prompt": "Bir belediyenin yol ağı ve nüfus verisini birlikte kullanarak otobüs güzergâhı seçmesi hangi uygulamadır?",
        "options": {
          "A": "CBS tabanlı mekânsal planlama",
          "B": "Yalnız dil çevirisi",
          "C": "Sadece teleskop gözlemi",
          "D": "Moleküler analiz"
        },
        "answer": "A",
        "explanation": "Yol ve nüfus katmanlarını birleştirmek CBS analizidir."
      },
      {
        "prompt": "Uydu görüntüsünü kullanarak yangından etkilenen alanın sınırlarını belirlemek için hangisi önemlidir?",
        "options": {
          "A": "Şarkı türünü seçmek",
          "B": "Oyuncu sayısını hesaplamak",
          "C": "Görselin çerçevesini renklendirmek",
          "D": "Görüntüyü coğrafi konumla ilişkilendirmek"
        },
        "answer": "D",
        "explanation": "Konumsal referans alan sınırlarının haritada gösterilmesini sağlar."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "CBS ve uzaktan algılamanın kullanım alanları"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/58",
    "sourceThemeId": "COĞ.10.2.1"
  },
  {
    "id": "geo10-co--10-2-2-v1",
    "version": 1,
    "subject": "Coğrafya",
    "targetGrades": [
      10
    ],
    "title": "Haritada nokta, çizgi ve alan verisi",
    "skill": "Harita amacına uygun nokta-çizgi-alan temsili seçme",
    "explanation": "CBS'de bir otobüs durağı nokta, yürüyüş rotası çizgi, park sınırı alan geometrisiyle temsil edilebilir. Seçilen geometri ölçek ve haritanın amacına göre belirlenir. Konumsal veri kullanılmadan harita tamamlanmış sayılmaz.",
    "misconception": "Yol güzergâhını tek noktayla göstermek veya bir parkın kapladığı alanı yalnız ismiyle tanımlamak.",
    "worked": {
      "prompt": "Mahallede okul, okul yolu ve park sınırını haritada nasıl gösterirsin?",
      "steps": [
        "Okulu bir noktayla işaretle.",
        "Okul yolunu çizgi geometrisiyle çiz.",
        "Parkın kapladığı sınırı alan çokgeniyle göster."
      ],
      "answer": "Nokta, çizgi ve alan verileri"
    },
    "exercises": [
      {
        "prompt": "Bir sağlık merkezinin konumu, mahalle ölçeğinde genellikle hangi geometriyle gösterilir?",
        "options": {
          "A": "Alan",
          "B": "Hacim",
          "C": "Nokta",
          "D": "Zaman"
        },
        "answer": "C",
        "explanation": "Sağlık merkezi gibi konumlar nokta verisiyle gösterilebilir."
      },
      {
        "prompt": "Bir bisiklet güzergâhının izlediği rota hangi geometriye uygundur?",
        "options": {
          "A": "Çizgi",
          "B": "Nokta",
          "C": "Alan",
          "D": "Tablo sütunu"
        },
        "answer": "A",
        "explanation": "Güzergâh uzunlamasına çizgi verisidir."
      },
      {
        "prompt": "Bir gölün yüzey alanını gösteren sınır hangi veriyle çizilir?",
        "options": {
          "A": "Yalnız metin",
          "B": "Çizgi üzerinde tek nokta",
          "C": "Saat dilimi",
          "D": "Alan çokgeni"
        },
        "answer": "D",
        "explanation": "Gölün kapladığı yüzeyi çokgen geometri temsil eder."
      },
      {
        "prompt": "Bir haritanın amacına uygun üretilmesi için hangi işlem gereklidir?",
        "options": {
          "A": "Rastgele sembol ekleme",
          "B": "Ölçek, açıklama ve veri türlerini kontrol etme",
          "C": "Konum bilgisini silme",
          "D": "Farklı katmanları hiç eşleştirmeme"
        },
        "answer": "B",
        "explanation": "Ölçek ve gösterim anahtarı verinin okunmasını sağlar."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Haritada nokta, çizgi ve alan verisi"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/58",
    "sourceThemeId": "COĞ.10.2.2"
  },
  {
    "id": "geo10-co--10-3-1-v1",
    "version": 1,
    "subject": "Coğrafya",
    "targetGrades": [
      10
    ],
    "title": "Levha tektoniğinin yeryüzü şekillerine etkisi",
    "skill": "Levha sınırındaki süreçleri uygun jeolojik oluşumla ilişkilendirme",
    "explanation": "Levha hareketleri deprem, volkanizma ve dağ oluşumu gibi süreçleri etkiler. Yakınsayan sınırlarda bazı durumlarda dalma-batma veya kıta çarpışması, uzaklaşan sınırlarda açılma ve yeni kabuk oluşumu görülebilir.",
    "misconception": "Bütün depremlerin aynı tektonik süreçten kaynaklandığını veya her dağın yanardağ olduğunu düşünmek.",
    "worked": {
      "prompt": "İki kıta levhasının uzun süre yakınlaşması hangi oluşumu destekler?",
      "steps": [
        "Levhaların birbirine doğru hareketini tanımla.",
        "Sıkışma ve kabuğun kalınlaşmasını düşün.",
        "Kıvrım ve yükselmeyle dağ kuşakları gelişebilir."
      ],
      "answer": "Kıtasal çarpışmayla dağ oluşumu"
    },
    "exercises": [
      {
        "prompt": "İki kıta levhasının çarpışması sonucunda hangi jeolojik oluşum beklenir?",
        "options": {
          "A": "Okyanus suyunun yok olması",
          "B": "Dağ oluşumu",
          "C": "Günün uzaması",
          "D": "Toprak renginin aynı olması"
        },
        "answer": "B",
        "explanation": "Kıtasal çarpışma kabuğu sıkıştırıp yükseltebilir."
      },
      {
        "prompt": "Okyanus ortası sırtlarında levhaların birbirinden ayrılması neyle ilişkilidir?",
        "options": {
          "A": "Bütün kayaların erimesi",
          "B": "Yalnız rüzgâr aşındırması",
          "C": "Yeni okyanusal kabuk oluşumu",
          "D": "Buzulların çoğalması"
        },
        "answer": "C",
        "explanation": "Ayrılma sınırında yükselen magma yeni kabuk oluşturabilir."
      },
      {
        "prompt": "Bir fay boyunca enerjinin aniden açığa çıkması hangi olayı meydana getirir?",
        "options": {
          "A": "Deprem",
          "B": "Gelgit",
          "C": "Gün dönümü",
          "D": "Çiy oluşumu"
        },
        "answer": "A",
        "explanation": "Kaya bloklarının kırılıp yer değiştirmesi deprem dalgaları üretir."
      },
      {
        "prompt": "Levha sınırlarındaki hareketlerin anlaşılmasına hangi gözlem yardım eder?",
        "options": {
          "A": "Sadece müzik tercihleri",
          "B": "Yalnız bitki adları",
          "C": "Yalnız spor takımları",
          "D": "Deprem dağılışı ve GPS yer değiştirmeleri"
        },
        "answer": "D",
        "explanation": "Deprem haritası ve GPS ölçümü levha hareketleri için kanıttır."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Levha tektoniğinin yeryüzü şekillerine etkisi"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/63",
    "sourceThemeId": "COĞ.10.3.1"
  },
  {
    "id": "geo10-co--10-4-2-v1",
    "version": 1,
    "subject": "Coğrafya",
    "targetGrades": [
      10
    ],
    "title": "Yerleşmelerin baskın işlevleri",
    "skill": "Bir yerleşmenin hizmet, sanayi, turizm veya idari işlevini kanıtla sınıflandırma",
    "explanation": "Bir yerleşme birden fazla işlev taşıyabilir. Sınıflandırmada baskın ekonomik, idari veya kültürel faaliyetler ve istihdam verisi birlikte incelenir. Bir binanın bulunması tek başına tüm kentin işlevini kanıtlamaz.",
    "misconception": "Bir kentte tek otel bulunmasını o kentin kesin turizm kenti olduğunun yeterli kanıtı sanmak.",
    "worked": {
      "prompt": "Çalışanların çoğunun liman taşımacılığı ve depolama hizmetinde olduğu bir kentte hangi işlev öne çıkar?",
      "steps": [
        "İstihdamın toplandığı sektörü belirle.",
        "Liman ve depolama ulaştırma/ticaret ağına aittir.",
        "Baskın işlev ulaştırma-ticaret olabilir; ek veriyle doğrulanır."
      ],
      "answer": "Ulaştırma ve ticaret"
    },
    "exercises": [
      {
        "prompt": "Çok sayıda üniversite ve araştırma kurumu etrafında gelişen yerleşmede hangi işlev öne çıkabilir?",
        "options": {
          "A": "Madencilik",
          "B": "Balıkçılık",
          "C": "Eğitim ve araştırma",
          "D": "Yalnız çiftçilik"
        },
        "answer": "C",
        "explanation": "Üniversite ve araştırma kurumları eğitim/araştırma işlevini güçlendirir."
      },
      {
        "prompt": "İstihdamın büyük bölümü otomotiv üretiminde toplanıyorsa baskın işlev hangisidir?",
        "options": {
          "A": "Sanayi",
          "B": "Turizm",
          "C": "Dinlenme",
          "D": "Yalnız ulaşım"
        },
        "answer": "A",
        "explanation": "Üretim tesisleri ve imalat istihdamı sanayi işlevine işaret eder."
      },
      {
        "prompt": "Bir yerleşmenin turizm işlevini kanıtlamak için en ilgili veri hangisidir?",
        "options": {
          "A": "Sokak tabelalarının yazı tipi",
          "B": "Bulutların şekli",
          "C": "Sadece bina sayısı",
          "D": "Ziyaretçi sayısı ve konaklama istihdamı"
        },
        "answer": "D",
        "explanation": "Ziyaretçi ve konaklama faaliyetleri turizm işlevini değerlendirmeye yardım eder."
      },
      {
        "prompt": "Bir başkentin idari işlevini hangi özellik destekler?",
        "options": {
          "A": "Sadece park bulunması",
          "B": "Ulusal yönetim kurumlarının yoğunluğu",
          "C": "Yalnız nehir geçmesi",
          "D": "Hava sıcaklığının yüksekliği"
        },
        "answer": "B",
        "explanation": "Merkezi yönetim kurumlarının varlığı idari işlevi gösterir."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Yerleşmelerin baskın işlevleri"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/81",
    "sourceThemeId": "COĞ.10.4.2"
  },
  {
    "id": "geo10-co--10-5-1-v1",
    "version": 1,
    "subject": "Coğrafya",
    "targetGrades": [
      10
    ],
    "title": "Ekonomik faaliyetleri sektörlere ayırma",
    "skill": "Ekonomik faaliyetin üretim sürecindeki rolüne göre sektör sınıflandırması",
    "explanation": "Birincil sektör doğal kaynakların elde edilmesi (tarım, balıkçılık), ikincil sektör bunların işlenmesi (fabrika üretimi), üçüncül sektör hizmet sunulması (ulaşım, sağlık), dördüncül sektör bilgi ve araştırma ağırlıklı hizmetler olarak ele alınabilir.",
    "misconception": "Ürün satışı veya hammaddenin işlenmesini doğrudan birincil üretimle karıştırmak.",
    "worked": {
      "prompt": "Buğdayın un fabrikasında öğütülmesi hangi sektördür?",
      "steps": [
        "Buğday yetiştirme tarımsal hammaddedir.",
        "Fabrikada işlenerek yeni ürün elde edilir.",
        "Bu işlem ikincil sektördedir."
      ],
      "answer": "İkincil sektör"
    },
    "exercises": [
      {
        "prompt": "Tarlada buğday yetiştirmek hangi sektöre örnektir?",
        "options": {
          "A": "Dördüncül",
          "B": "Üçüncül",
          "C": "Birincil",
          "D": "İkincil"
        },
        "answer": "C",
        "explanation": "Tarım doğal kaynaklardan doğrudan üretim yapar."
      },
      {
        "prompt": "Çelik fabrikasında hammadde işlemek hangi sektörün örneğidir?",
        "options": {
          "A": "İkincil",
          "B": "Birincil",
          "C": "Üçüncül",
          "D": "Dördüncül"
        },
        "answer": "A",
        "explanation": "İmalat sanayisi ikincil ekonomik faaliyettir."
      },
      {
        "prompt": "Hastanede hasta muayenesi yapmak hangi sektöre örnektir?",
        "options": {
          "A": "Birincil",
          "B": "İkincil",
          "C": "Dördüncül",
          "D": "Üçüncül"
        },
        "answer": "D",
        "explanation": "Sağlık hizmetleri hizmet sektöründedir."
      },
      {
        "prompt": "Bir araştırma laboratuvarında yeni algoritma geliştirmek hangi gruba daha uygundur?",
        "options": {
          "A": "Birincil",
          "B": "Dördüncül",
          "C": "İkincil",
          "D": "Yalnız tarım"
        },
        "answer": "B",
        "explanation": "Bilgi üretimine yönelik Ar-Ge dördüncül sektöre örnektir."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Ekonomik faaliyetleri sektörlere ayırma"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/89",
    "sourceThemeId": "COĞ.10.5.1"
  },
  {
    "id": "geo10-co--10-6-1-v1",
    "version": 1,
    "subject": "Coğrafya",
    "targetGrades": [
      10
    ],
    "title": "Afet riskini azaltan uygulamaları değerlendirme",
    "skill": "Bir afet risk azaltma önerisinin kanıtını ve yerel koşullara uygunluğunu sorgulama",
    "explanation": "Afet yönetiminde tehlike, maruziyet ve kırılganlık birlikte değerlendirilir. Erken uyarı, güvenli yapılaşma, tahliye planı ve toplum eğitimi farklı riskleri azaltabilir. Uygulamanın işe yarayıp yaramadığı veriyle izlenmelidir.",
    "misconception": "Bir afişin bulunmasını tek başına mahallede afet riskinin ortadan kalktığı kanıtı sanmak.",
    "worked": {
      "prompt": "Sel riski olan mahallede taşkın uyarısı kuruluyor. Başarıyı nasıl değerlendirirsin?",
      "steps": [
        "Amacı tanımla: zamanında uyarıyla zararı azaltmak.",
        "Uyarı süresi ve tahliye hazırlığı verisini izle.",
        "Sistemin çalışmasını gerçek ölçümlere göre değerlendir."
      ],
      "answer": "Uyarı süresi ve hazırlık kanıtlarını incelemek"
    },
    "exercises": [
      {
        "prompt": "Sel riski bulunan bölgede hangi önlem risk azaltmaya hizmet edebilir?",
        "options": {
          "A": "Dere yatağındaki tüm uyarıları kaldırmak",
          "B": "Taşkın uyarısı ve güvenli tahliye planı",
          "C": "Tahliye yolunu kapatmak",
          "D": "Risk haritasını saklamak"
        },
        "answer": "B",
        "explanation": "Erken uyarı ve hazırlanmış tahliye yolu maruziyeti azaltabilir."
      },
      {
        "prompt": "Bir okulun deprem hazırlık çalışmasının etkililiğini incelemek için hangi veri uygundur?",
        "options": {
          "A": "Duyuru afişinin rengi",
          "B": "Sınıf kapısının boyası",
          "C": "Güvenli tatbikat ve toplanma süresi ölçümleri",
          "D": "Sadece slogan sayısı"
        },
        "answer": "C",
        "explanation": "Tatbikat ve süre ölçümleri hazırlık düzeyine ilişkin kanıt sağlayabilir."
      },
      {
        "prompt": "Afet risk haritasında hangi bilgi en çok yarar sağlar?",
        "options": {
          "A": "Tehlikenin türü ve etkilenebilecek alanlar",
          "B": "Yalnız bina isimlerinin alfabetik sırası",
          "C": "Günün şarkısı",
          "D": "Sınıf defteri numarası"
        },
        "answer": "A",
        "explanation": "Riskli alanların haritada gösterilmesi mekânsal önlem seçimini destekler."
      },
      {
        "prompt": "Bir afet önleminin başka bölgeye de uygulanmasını önermeden önce ne yapılmalıdır?",
        "options": {
          "A": "Hiçbir veri toplamamak",
          "B": "Aynı maliyeti varsaymak",
          "C": "Yalnız afişi kopyalamak",
          "D": "Yerel tehlike, nüfus ve altyapı koşullarını incelemek"
        },
        "answer": "D",
        "explanation": "Afet önlemleri yerel risk ve kaynaklara göre uyarlanmalıdır."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Afet riskini azaltan uygulamaları değerlendirme"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/94",
    "sourceThemeId": "COĞ.10.6.1"
  },
  {
    "id": "geo10-co--10-7-1-v1",
    "version": 1,
    "subject": "Coğrafya",
    "targetGrades": [
      10
    ],
    "title": "Türk dünyasının kültürel izleri",
    "skill": "Ortak kültür ögelerinden analoji üretirken yerel farklılıkları gözetme",
    "explanation": "Türk dünyasında dil, sözlü kültür, müzik, kutlama ve maddi kültür alanlarında ortak izler bulunabilir. Benzer bir öğe ortak kültürel ilişkiyi düşündürebilir; aynı adın veya geleneğin bütün topluluklarda bütünüyle aynı olduğunu kanıtlamaz.",
    "misconception": "Bir ortak kültür öğesinin bütün toplumlarda hiç değişmeden uygulandığını genellemek.",
    "worked": {
      "prompt": "İki bölgede bahar kutlamalarında ateş etrafında buluşma anlatılıyor. Ne söylenebilir?",
      "steps": [
        "Anlatımdaki ortak unsuru belirle: bahar kutlaması.",
        "Benzerliğin ortak gelenek izi olabileceğini öne sür.",
        "Anlam ve uygulama çeşitliliğini ek kaynakla araştır."
      ],
      "answer": "Ortak kültürel iz ve yerel çeşitlilik"
    },
    "exercises": [
      {
        "prompt": "Birden fazla Türk topluluğunda kopuz benzeri çalgıların görülmesi hangi çıkarımı destekler?",
        "options": {
          "A": "Müzik kültüründe ortak izler bulunabileceğini",
          "B": "Her eserin aynı notalardan oluştuğunu",
          "C": "Bütün dillerin aynı olduğunu",
          "D": "Her bölgenin ikliminin eşit olduğunu"
        },
        "answer": "A",
        "explanation": "Benzer çalgı geleneği kültürel ilişkiye işaret edebilir; tam özdeşlik göstermez."
      },
      {
        "prompt": "Bir gelenek hakkında sağlıklı analojik çıkarım için hangi yaklaşım uygundur?",
        "options": {
          "A": "Yalnız adı esas almak",
          "B": "Yerel anlatıları görmezden gelmek",
          "C": "Ortaklık ve farklılıkları kaynaklarla değerlendirmek",
          "D": "Her geleneği tek biçimli saymak"
        },
        "answer": "C",
        "explanation": "Kaynak çeşitliliği genellemeyi denetlemeye yardım eder."
      },
      {
        "prompt": "Bahar kutlamalarının çeşitli toplumlarda farklı adlarla görülmesi neyi gösterebilir?",
        "options": {
          "A": "Kutlama yapılmadığını",
          "B": "Bütün uygulamaların aynı olduğunu",
          "C": "Tüm halkların aynı yerde yaşadığını",
          "D": "Ortak temalar yanında yerel çeşitlilik bulunduğunu"
        },
        "answer": "D",
        "explanation": "Benzer mevsimsel kutlamalar yerel ad ve uygulama farklılığı taşıyabilir."
      },
      {
        "prompt": "Bir destan motifinin birden çok sözlü anlatıda görülmesi için en güvenli sonuç hangisidir?",
        "options": {
          "A": "Metinlerin birebir aynı olduğu",
          "B": "Ortak anlatı unsurları olabileceği",
          "C": "Her anlatıcının aynı kişi olduğu",
          "D": "Tarihlerin kesin eşit olduğu"
        },
        "answer": "B",
        "explanation": "Motif benzerliği ortak anlatı unsurunu düşündürür ama tam özdeşliği kanıtlamaz."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Türk dünyasının kültürel izleri"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/cografya-dersi/unite/98",
    "sourceThemeId": "COĞ.10.7.1"
  }
];
