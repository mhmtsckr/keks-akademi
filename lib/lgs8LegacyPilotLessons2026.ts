/** KEKS-authored, legacy-program LGS grade 8 examples. No past exam questions reused; expert review pending. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const LGS8_LEGACY_PILOT_LESSONS:readonly MicroLesson[]=[
  {
    "id": "lgs8-tr-main-idea-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Ana düşünceyi ayrıntıdan ayırma",
    "skill": "Paragrafın bütününden çıkarılan ana düşünceyi seçme",
    "explanation": "Ana düşünce, metnin yalnız tek cümlesi veya bir örneği değil, yazarın tüm cümleleriyle vurguladığı temel yargıdır. Ayrıntıyı genelleştiren ama metnin kapsamını aşmayan seçeneği ara.",
    "misconception": "Bir örneği metnin bütününün savı sanmak veya metinde söylenmeyen aşırı genellemeyi seçmek.",
    "worked": {
      "prompt": "'Mahallede terk edilmiş alan önce küçük bir bahçeye dönüştürüldü. Komşular birlikte çalıştıkça birbirlerini daha yakından tanıdı; bahçe artık sohbet edilen bir yer oldu.' Parçanın ana düşüncesi nedir?",
      "steps": [
        "Somut olayları belirle: ortak bahçe ve birlikte çalışma.",
        "Bahçe yalnız bir örnek; yazarın vurgusu birlikte üretmenin sosyal etkisi.",
        "Ana düşünce ortak emeğin komşuluk ilişkilerini güçlendirebilmesidir."
      ],
      "answer": "Ortak çalışma toplumsal ilişkileri güçlendirebilir."
    },
    "exercises": [
      {
        "prompt": "'Gün boyunca ekran başında olan öğrenciler, kısa yürüyüşlerden sonra dikkatlerini daha kolay topladıklarını söylüyor. Uzmanlar hareket aralarının öğrenme düzenine destek olabileceğini belirtiyor.' Ana düşünce hangisidir?",
        "options": {
          "A": "Bütün dersler açık havada yapılmalıdır.",
          "B": "Her öğrenci aynı kadar yürümelidir.",
          "C": "Ekranlar eğitimde hiçbir işe yaramaz.",
          "D": "Hareket molaları öğrenme sürecini destekleyebilir."
        },
        "answer": "D",
        "explanation": "Örnekler, hareket aralarının öğrenmeye olası katkısını vurgular; mutlak hükümler içermez."
      },
      {
        "prompt": "'Bir şehrin geçmişini yalnız büyük binalar değil; sokak adları, dükkân tabelaları ve anlatılan anılar da taşır. Bu küçük izler korunmadığında şehrin belleğinin bir bölümü silinir.' Ana fikir hangisi?",
        "options": {
          "A": "Kent belleği gündelik kültürel izlerin korunmasıyla da yaşar.",
          "B": "Eski tabelalar her zaman yenilerinden güzeldir.",
          "C": "Tarih sadece anıt binalarda bulunur.",
          "D": "Sokak adları rastgele seçilmelidir."
        },
        "answer": "A",
        "explanation": "Metnin odağı kent belleğini taşıyan farklı kültürel izlerin değeridir."
      },
      {
        "prompt": "'Bilim insanları aynı soruya farklı yöntemlerle yaklaşabilir. Bir araştırmada işe yarayan yöntem, başka bir konuda yetersiz kalabilir; bu yüzden sonuçların dayandığı yöntem de incelenmelidir.' Ana düşünce hangisi?",
        "options": {
          "A": "Bilimsel araştırmalarda tek yöntem vardır.",
          "B": "Sonuçlar yöntemin uygunluğu değerlendirilerek yorumlanmalıdır.",
          "C": "Farklı yöntemler daima aynı sonuçları verir.",
          "D": "Araştırmalarda sorular önemsizdir."
        },
        "answer": "B",
        "explanation": "Yazar yöntem seçimi ve değerlendirilmesinin bilimsel yorum için gerekli olduğunu savunur."
      },
      {
        "prompt": "'Kütüphaneye bağışlanan kitaplar, yalnız raflarda beklemek için değil, yeni okurların dünyasını genişletmek için oradadır. Bu yüzden bağış kadar kitaplara ulaşmayı kolaylaştırmak da önemlidir.' Ana düşünce hangisi?",
        "options": {
          "A": "Her kitap yalnız bir kişi tarafından okunmalıdır.",
          "B": "Bağışlanan kitaplar saklanmalıdır.",
          "C": "Kitap bağışının değeri erişilebilirlikle artar.",
          "D": "Kütüphaneler sadece ders kitabı bulundurmalıdır."
        },
        "answer": "C",
        "explanation": "Metin kitap bağışını okurla buluşma olanağı üzerinden değerlendirir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Ana düşünceyi ayrıntıdan ayırma"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "sourceThemeId": "T.8.3.17"
  },
  {
    "id": "lgs8-tr-inference-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Metinden destekli çıkarım",
    "skill": "Verilen kanıttan hareketle kesin ve olası yargıları ayırma",
    "explanation": "Çıkarım, metinde doğrudan yazmasa da bilgilerle temellendirilebilen sonuçtur. 'Kesinlikle', 'her zaman' gibi güçlü ifadelerin metin desteğini kontrol et.",
    "misconception": "Tek bir örnekten tüm kişiler veya her zaman için kesin yargı üretmek.",
    "worked": {
      "prompt": "'Otobüs, yoğun kar nedeniyle yola planlanandan yarım saat geç çıktı; sürücü güzergâhı değiştirmedi.' Bu verilerden ne çıkar?",
      "steps": [
        "Otobüsün geciktiği açıkça söylenmiştir.",
        "Gecikmenin nedenini kar yoğunluğuyla ilişkilendir.",
        "Güzergâh değişikliği veya kaza olduğuna dair kanıt yoktur."
      ],
      "answer": "Kar yoğunluğu hareket saatini etkilemiştir."
    },
    "exercises": [
      {
        "prompt": "'Okul bahçesine yerleştirilen yağmur suyu deposu, bahar aylarında çiçekleri sulamak için kullanıldı.' Hangisine ulaşılabilir?",
        "options": {
          "A": "Okulun hiç su tüketmediğine",
          "B": "Yağmur suyunun sulamada değerlendirilebildiğine",
          "C": "Depoda her mevsim aynı miktar su olduğuna",
          "D": "Tüm okullarda benzer depoların bulunduğuna"
        },
        "answer": "B",
        "explanation": "Veri yağmur suyunun en azından belirli bir dönemde sulamada kullanıldığını gösterir."
      },
      {
        "prompt": "'Müzenin kapısında salı günleri giriş ücretsiz, diğer günler yetişkinler için ücretli yazıyor. Gezi grubu salı yerine perşembe gitti.' Hangisi kesin çıkarımdır?",
        "options": {
          "A": "Yetişkin üyeler için perşembe girişinin ücretli olduğu",
          "B": "Müzede hiç çocuk bulunmadığı",
          "C": "Salı günleri kimsenin gelmediği",
          "D": "Herkesin rehber tuttuğu"
        },
        "answer": "A",
        "explanation": "Ücret kuralı yetişkinler için diğer günlerde geçerlidir; perşembe bu günlerden biridir."
      },
      {
        "prompt": "'Kentte geçen yıl 12, bu yıl 17 bisiklet yolu açıldı. Yeni yolların hangisinin daha yoğun kullanıldığına dair kayıt tutulmadı.' Hangisi söylenebilir?",
        "options": {
          "A": "Bu yıl bisiklet kullanan sayısı tam iki katına çıktı.",
          "B": "Geçen yıl açılan yolların hepsi kapatıldı.",
          "C": "En yoğun yol şehir merkezindedir.",
          "D": "Bu yıl açılan yeni yol sayısı geçen yıldan fazladır."
        },
        "answer": "D",
        "explanation": "17 sayısı 12'den büyüktür; kullanım yoğunluğu bilgisi mevcut değildir."
      },
      {
        "prompt": "'Öğrenciler iki farklı çalışma yöntemini bir hafta denedi; ancak uygulama süresi ve önceki bilgileri eşit değildi.' Hangi sonuca varmak daha uygundur?",
        "options": {
          "A": "Bir yöntem mutlaka daha etkilidir.",
          "B": "İki yöntem herkeste aynı etkiyi yapar.",
          "C": "Yöntemlerin etkisini yalnız bu denemeyle kesin karşılaştırmak zordur.",
          "D": "Öğrencilerin tamamı başarısızdır."
        },
        "answer": "C",
        "explanation": "Başlangıç koşullarındaki fark karşılaştırmanın güvenilirliğini sınırlar."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Metinden destekli çıkarım"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "sourceThemeId": "T.8.3.25"
  },
  {
    "id": "lgs8-tr-table-interpretation-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "Tablo ve grafiklerde tutarlı yorum",
    "skill": "Tablodan toplam, karşılaştırma ve oran çıkarımı yapma",
    "explanation": "Grafik ve tabloda önce başlık, birim, grup ve zamanı bul. Sütunları karşılaştırırken mutlak sayı ile yüzdelik oranı birbirine karıştırma; veri olmayan nedensel sonuca gitme.",
    "misconception": "Tabloda yalnız katılımcı sayısı varken başarı nedenini veya kişi başına verimi kesin olarak bildiğini sanmak.",
    "worked": {
      "prompt": "Bir atölye katılım tablosunda pazartesi 20, salı 25 ve çarşamba 15 kişi yazıyor. İlk iki günün toplamı kaçtır?",
      "steps": [
        "Verilerin birimi kişi sayısıdır.",
        "Pazartesi 20, salı 25 kişiyi topla.",
        "İlk iki gün toplamı 45 kişidir."
      ],
      "answer": "45 kişi"
    },
    "exercises": [
      {
        "prompt": "Kütüphane ziyaretleri: pazartesi 36, salı 48, çarşamba 42. En fazla ziyaret olan gün hangisidir?",
        "options": {
          "A": "Pazartesi",
          "B": "Çarşamba",
          "C": "Salı",
          "D": "Her gün eşit"
        },
        "answer": "C",
        "explanation": "48, verilen ziyaret sayıları içinde en yüksek değerdir."
      },
      {
        "prompt": "Bir kitap kulübünün aylık üye sayısı ocakta 80, şubatta 100. Artış yüzdesi kaçtır?",
        "options": {
          "A": "%25",
          "B": "%20",
          "C": "%80",
          "D": "%125"
        },
        "answer": "A",
        "explanation": "Artış 20, başlangıç 80; 20/80 = %25."
      },
      {
        "prompt": "Bir öğrenci kulübünde kız üye 18, erkek üye 12. Tablodaki verilere göre hangisi kesindir?",
        "options": {
          "A": "Her kız üye her toplantıya katılır.",
          "B": "Kulüp her hafta toplanır.",
          "C": "Erkekler daha çok kitap okur.",
          "D": "Toplam üye sayısı 30'dur."
        },
        "answer": "D",
        "explanation": "18 + 12 = 30; diğer seçenekler tabloda verilmemiştir."
      },
      {
        "prompt": "Aynı sürede tamamlanan okuma sayıları A sınıfı: 24 (12 öğrenci), B sınıfı: 30 (20 öğrenci). Öğrenci başına ortalama hangisinde daha yüksektir?",
        "options": {
          "A": "B, çünkü toplamı 30",
          "B": "A, çünkü 24/12 > 30/20",
          "C": "İkisinde eşit",
          "D": "Veriler ortalama hesaplamaya yetmez"
        },
        "answer": "B",
        "explanation": "A'da kişi başı 2, B'de 1,5 okuma vardır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Tablo ve grafiklerde tutarlı yorum"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "sourceThemeId": "T.8.3.32"
  },
  {
    "id": "lgs8-science-seasons-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Eksen eğikliği ve mevsimlerin oluşumu",
    "skill": "Mevsimi Dünya'nın eksen eğikliği, dolanma ve Güneş ışını açısıyla açıklama",
    "explanation": "Mevsimler Dünya'nın Güneş'e uzaklığından değil, ekseninin eğik oluşu ve Güneş çevresinde dolanması sonucunda iki yarım kürenin Güneş ışığını farklı açılarda ve sürelerde almasından kaynaklanır.",
    "misconception": "Kuzey ve güney yarım kürede yazın aynı anda yaşandığını veya yazın Dünya'nın mutlaka Güneş'e daha yakın olduğunu düşünmek.",
    "worked": {
      "prompt": "Kuzey Yarım Küre Güneş'e eğikken neden burada yaz yaşanır?",
      "steps": [
        "Eksen eğikliği nedeniyle Güneş ışınları daha dik gelebilir.",
        "Gündüz süreleri uzar; birim alana düşen enerji artar.",
        "Bunun sonucu Kuzey Yarım Küre daha sıcak mevsim koşulları yaşar."
      ],
      "answer": "Işın açısı ve gün uzunluğunun artması"
    },
    "exercises": [
      {
        "prompt": "21 Haziran civarında Kuzey Yarım Küre'de gündüzlerin uzun olmasının temel sebebi hangisidir?",
        "options": {
          "A": "Dünya'nın Güneş'e her yerde daha yakın olması",
          "B": "Ay'ın ışığı arttırması",
          "C": "Dünya'nın dönüşünün durması",
          "D": "Eksen eğikliğiyle Güneş'e dönük olma"
        },
        "answer": "D",
        "explanation": "Kuzey Yarım Küre bu dönemde Güneş'e dönüktür ve gündüz süresi uzar."
      },
      {
        "prompt": "Türkiye'de yaz yaşanırken Avustralya'da genellikle hangi mevsim yaşanır?",
        "options": {
          "A": "Aynı anda yaz",
          "B": "Kış",
          "C": "İlkbahar daima",
          "D": "Mevsim yoktur"
        },
        "answer": "B",
        "explanation": "İki ülke zıt yarım kürelerde olduğundan mevsimleri genel olarak ters zamanlıdır."
      },
      {
        "prompt": "Mevsimlerin oluşması için aşağıdaki ikili hangisidir?",
        "options": {
          "A": "Eksen eğikliği ve Güneş çevresinde dolanma",
          "B": "Dünya'nın yalnız kendi ekseni etrafında dönmesi",
          "C": "Ay'ın Dünya etrafında dolanması ve gelgit",
          "D": "Rüzgâr ve okyanus akıntıları"
        },
        "answer": "A",
        "explanation": "Mevsimsel ışın açısı ve gün uzunluğu değişimi eksen eğikliği/dolanmayla ilişkilidir."
      },
      {
        "prompt": "Güneş ışınlarının yere daha dik ulaşmasının genel etkisi nedir?",
        "options": {
          "A": "Birime düşen enerjiyi sıfırlamak",
          "B": "Her yerde gece oluşturmak",
          "C": "Aynı enerji daha dar alana dağıldığı için ısınmayı artırmak",
          "D": "Dünya'nın eksenini düzleştirmek"
        },
        "answer": "C",
        "explanation": "Daha dik açıda aynı ışık enerjisi daha küçük alana yayılabilir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Eksen eğikliği ve mevsimlerin oluşumu"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_04/69d3bc9ea1198779272764_Ders_Kitaplar%C4%B1_Elektronik_E%C4%9Fitim_%C4%B0%C3%A7erikleri_Tablosu.pdf",
    "sourceThemeId": "F.8.1.1.1"
  },
  {
    "id": "lgs8-science-weather-climate-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "Hava olayı ile iklimi ayırt etme",
    "skill": "Günlük hava gözlemini uzun yıllar iklim verisinden ayırma",
    "explanation": "Hava durumu kısa süreli atmosfer koşullarını anlatır. İklim ise uzun yıllar boyunca gözlenen sıcaklık, yağış ve diğer hava değişkenlerinin dağılımına ve örüntüsüne dayanır.",
    "misconception": "Bir gün yağmur yağmasını bir bölgenin ikliminin kesin değiştiğinin kanıtı saymak.",
    "worked": {
      "prompt": "'Yarın Trabzon'da yağmur bekleniyor' ile 'Trabzon'da uzun yıllar yağış yüksektir' cümlelerinden hangisi iklimi anlatır?",
      "steps": [
        "'Yarın' kısa zamanlı hava tahminidir.",
        "'Uzun yıllar' iklim verisine işaret eder.",
        "İkinci cümle iklim özelliğini anlatır."
      ],
      "answer": "Uzun yıllara dayanan ikinci cümle"
    },
    "exercises": [
      {
        "prompt": "Hangisi hava durumu tahminidir?",
        "options": {
          "A": "Kentte son otuz yılın ortalama sıcaklığı 15 °C'dir.",
          "B": "Bölgede yazlar çoğunlukla kuraktır.",
          "C": "Yarın öğleden sonra sağanak bekleniyor.",
          "D": "Bu ilde kışlar genellikle ılımandır."
        },
        "answer": "C",
        "explanation": "Yarınki sağanak öngörüsü kısa süreli hava durumunu belirtir."
      },
      {
        "prompt": "Bir bölgede iklim hakkında daha güvenilir yargı için hangi veri gereklidir?",
        "options": {
          "A": "Bir sabah ölçülen sıcaklık",
          "B": "Uzun yılların ölçüm dizisi",
          "C": "Tek bir dolu olayı",
          "D": "Bir kişinin hava tahmini"
        },
        "answer": "B",
        "explanation": "İklim uzun dönem atmosfer gözlemlerinin istatistiksel örüntüsüdür."
      },
      {
        "prompt": "Bir gün kar yağması, bölgenin iklimi için kesin hangi sonucu verir?",
        "options": {
          "A": "Artık her yıl sürekli kar yağacak",
          "B": "Yazlar sonsuza kadar yok olacak",
          "C": "Bölge mutlaka kutup iklimine geçti",
          "D": "Tek başına kesin iklim değişimi kanıtı değildir"
        },
        "answer": "D",
        "explanation": "Tek olay uzun dönem iklim örüntüsünü tek başına belirleyemez."
      },
      {
        "prompt": "'Bu bölgede yaz ayları genellikle sıcak ve kurak geçer' ifadesi niçin iklim bilgisidir?",
        "options": {
          "A": "Uzun döneme ilişkin genel örüntüyü anlatır",
          "B": "Yalnız yarını tahmin eder",
          "C": "Bir saatlik ölçümü bildirir",
          "D": "Anlık rüzgâr hızını gösterir"
        },
        "answer": "A",
        "explanation": "Yaz ayları için yinelenen, uzun dönem tipik koşullar vurgulanıyor."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Hava olayı ile iklimi ayırt etme"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_04/69d3bc9ea1198779272764_Ders_Kitaplar%C4%B1_Elektronik_E%C4%9Fitim_%C4%B0%C3%A7erikleri_Tablosu.pdf",
    "sourceThemeId": "F.8.1.2.1"
  },
  {
    "id": "lgs8-science-dna-copy-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "title": "DNA eşlenmesinde tamamlayıcı bazlar",
    "skill": "DNA zincirlerinin tamamlayıcı baz eşleşmesiyle kopyalanmasını yorumlama",
    "explanation": "DNA eşlenmesinde iki zincir ayrılır. Her zincir kalıp olarak kullanılır; A karşısına T, G karşısına C gelecek şekilde yeni tamamlayıcı zincirler oluşturulur. Başlangıçtaki her zincir yeni DNA moleküllerinden birinde bulunur.",
    "misconception": "A'nın G ile veya C'nin T ile eşleştiğini düşünmek; yeni iki DNA'nın ikisinin de tamamen eski zincirlerden oluştuğunu sanmak.",
    "worked": {
      "prompt": "Bir DNA kalıp zinciri A–G–T–C ise yeni tamamlayıcı zincir nasıl olur?",
      "steps": [
        "A'nın karşısına T gelir.",
        "G'nin karşısına C, T'nin karşısına A gelir.",
        "C'nin karşısına G gelerek T–C–A–G tamamlanır."
      ],
      "answer": "T–C–A–G"
    },
    "exercises": [
      {
        "prompt": "Bir DNA zincirindeki A–T–G dizisinin tamamlayıcısı hangisidir?",
        "options": {
          "A": "T–A–C",
          "B": "A–T–G",
          "C": "C–G–A",
          "D": "T–G–C"
        },
        "answer": "A",
        "explanation": "A–T, T–A ve G–C eşleşmesiyle T–A–C oluşur."
      },
      {
        "prompt": "DNA eşlenmesinde eski zincirlerden her biri nasıl görev yapar?",
        "options": {
          "A": "Yok edilerek enerji verir",
          "B": "Yeni bazlar için kalıp olur",
          "C": "RNA'ya dönüşür",
          "D": "Tamamen proteine dönüşür"
        },
        "answer": "B",
        "explanation": "Eski zincirler yeni tamamlayıcı zincirlerin oluşumunda kalıp görevi görür."
      },
      {
        "prompt": "DNA'da G bazının karşısına hangisi gelir?",
        "options": {
          "A": "A",
          "B": "T",
          "C": "C",
          "D": "G"
        },
        "answer": "C",
        "explanation": "Guanin sitozin ile tamamlayıcı eşleşir."
      },
      {
        "prompt": "Yarı korunumlu DNA eşlenmesi için hangisi doğrudur?",
        "options": {
          "A": "Yeni DNA'ların ikisi de yalnız eski zincirlerden oluşur",
          "B": "Yeni DNA tamamen proteinlerden oluşur",
          "C": "DNA eşlenince baz eşleşmesi değişir",
          "D": "Her yeni DNA'da bir eski ve bir yeni zincir bulunur"
        },
        "answer": "D",
        "explanation": "Yarı korunumlu eşlenmede her kopyada eski zincirlerden biri korunur."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "DNA eşlenmesinde tamamlayıcı bazlar"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_04/69d3bc9ea1198779272764_Ders_Kitaplar%C4%B1_Elektronik_E%C4%9Fitim_%C4%B0%C3%A7erikleri_Tablosu.pdf",
    "sourceThemeId": "F.8.2.1.3"
  }
];
