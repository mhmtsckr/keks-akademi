import type {MicroLesson} from './bankFreeMicroLessons';
/** Original grade-8 LGS-form 4-choice exercises; MEB 2019 curriculum codes verified separately. */
export const GRADE8_LGS_PILOTS:readonly MicroLesson[]=[
  {
    "id": "grade8-lgs-t-8-3-17-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "8. sınıf LGS · Ana düşünceyi bütün metinden belirleme",
    "skill": "Ana düşünceyi bütün metinden belirleme",
    "explanation": "Ana düşünce tüm örnekleri kapsayan temel iletidir; tek bir ayrıntı metnin tümünü temsil etmez.",
    "misconception": "Çarpıcı örneği ana fikir sanmak.",
    "worked": {
      "prompt": "“Mahalleli eski binayı birlikte onardı. Bina kadar aralarındaki güven de güçlendi.”",
      "steps": [
        "Metindeki ortak konu ve anlatım amacını belirle.",
        "Görülen açık bilgiyi yorumdan ve aşırı genellemeden ayır.",
        "Verilen yanıta metindeki en az bir ifadeyi kanıt göster."
      ],
      "answer": "Ortak emek, toplumsal dayanışmayı güçlendirir."
    },
    "exercises": [
      {
        "prompt": "“Öğrenciler kullanmadıkları kitapları paylaşınca hem yeni kitaplara ulaştı hem de kaynaklar yeniden değerlendi.” Ana düşünce?",
        "options": {
          "A": "Bütün kitaplar aynı türdedir.",
          "B": "Herkes kitap satın almalıdır.",
          "C": "Paylaşım kaynakların verimli kullanımını sağlar.",
          "D": "Okuma yalnız okulda yapılır."
        },
        "answer": "C",
        "explanation": "İki sonuç ortak paylaşım fikrinde birleşmektedir."
      },
      {
        "prompt": "“Yanlışı incelemek bir sonraki denemede nerede dikkatli olmamız gerektiğini gösterir.” Temel ileti?",
        "options": {
          "A": "Hatalar gizlenmelidir.",
          "B": "Hatalardan öğrenmek gelişmeyi destekler.",
          "C": "Herkes aynı yanlışı yapar.",
          "D": "Denemeler gereksizdir."
        },
        "answer": "B",
        "explanation": "Hata analiziyle ilerleme arasındaki ilişki öne çıkar."
      },
      {
        "prompt": "“Dijital harita yol buldurur; bir kenti tanımak onun insanlarını ve hikâyesini de anlamayı gerektirir.” Ana fikir?",
        "options": {
          "A": "Haritalar doğru değildir.",
          "B": "İnsanlar yolu ezberlemelidir.",
          "C": "Kentler birbirine benzer.",
          "D": "Bir yeri tanımak konum bilgisiyle sınırlı değildir."
        },
        "answer": "D",
        "explanation": "Yazar, yön bilgisinin ötesinde toplumsal ve tarihsel boyutu vurgular."
      },
      {
        "prompt": "“Sınıftaki farklı fikirler gerekçeleriyle tartışılınca daha güçlü bir çözüm bulundu.” Ana fikir?",
        "options": {
          "A": "Gerekçeli tartışma çözümü geliştirebilir.",
          "B": "İlk öneri hep doğrudur.",
          "C": "Farklı görüşlerden kaçınılmalıdır.",
          "D": "Karar verilmemelidir."
        },
        "answer": "A",
        "explanation": "Farklı fikirlerin gerekçeyle sınanmasının yararı savunulmuştur."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Ana düşünceyi bütün metinden belirleme"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "sourceThemeId": "LEGACY.8.T.8.3.17"
  },
  {
    "id": "grade8-lgs-t-8-3-25-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "8. sınıf LGS · Metinsel kanıttan çıkarım",
    "skill": "Metinsel kanıttan çıkarım",
    "explanation": "Çıkarım, metinde doğrudan yazılmayan fakat metnin sunduğu bilgiyle desteklenebilen sonuçtur. Kesinlik bildiren aşırı genellemelerden kaçın.",
    "misconception": "Metnin söylemediği bir neden-sonucu kesin ilan etmek.",
    "worked": {
      "prompt": "“Kütüphane cuma günleri geç kapanmaya başlayınca o gün ödünç alınan kitap sayısı arttı.”",
      "steps": [
        "Metindeki ortak konu ve anlatım amacını belirle.",
        "Görülen açık bilgiyi yorumdan ve aşırı genellemeden ayır.",
        "Verilen yanıta metindeki en az bir ifadeyi kanıt göster."
      ],
      "answer": "Uzatılan saatler erişimi kolaylaştırmış olabilir."
    },
    "exercises": [
      {
        "prompt": "“Bahçeye gölgelik kurulduktan sonra öğle arası orada oturan öğrenci sayısı arttı.” Ne çıkarılır?",
        "options": {
          "A": "Bütün öğrenciler gölgeyi sever.",
          "B": "Öğle arası uzamıştır.",
          "C": "Gölgelikler bahçeyi kullanmayı kolaylaştırmış olabilir.",
          "D": "Bahçe küçülmüştür."
        },
        "answer": "C",
        "explanation": "Gözlenen artış gölgeliğin etkisini düşündürür, tek neden kanıtlanmamıştır."
      },
      {
        "prompt": "“Toplantıda herkes sırayla konuşmaya başlayınca eskiden sessiz kalan bazı öğrenciler de katıldı.” Çıkarım?",
        "options": {
          "A": "Herkes aynı görüştedir.",
          "B": "Sırayla söz vermek katılımı teşvik etmiş olabilir.",
          "C": "Toplantılar bitmiştir.",
          "D": "Kimse dinlememiştir."
        },
        "answer": "B",
        "explanation": "Katılımdaki değişim dönüşümlü söz hakkıyla ilişkilendirilebilir."
      },
      {
        "prompt": "“Tren garı sergi salonuna dönüştürüldü; açılışta komşu şehirlerden de ziyaretçiler vardı.” Kesin bilgi?",
        "options": {
          "A": "Müze kapanmıştır.",
          "B": "Tüm ziyaretçiler sanatçıdır.",
          "C": "Tren seferi başlamıştır.",
          "D": "Sergi dışarıdan ziyaretçi çekmiştir."
        },
        "answer": "D",
        "explanation": "Komşu şehirlerden ziyaretçi geldiği açıkça belirtilir."
      },
      {
        "prompt": "“İki ekip eşit malzemeyle farklı köprü modeli kurdu; ikinci model daha çok yük taşıdı.” Çıkarım?",
        "options": {
          "A": "Tasarım, aynı malzemeyle bile sonucu etkileyebilir.",
          "B": "İlk ekip çalışmamıştır.",
          "C": "İkinci ekip hep kazanır.",
          "D": "Modeller özdeştir."
        },
        "answer": "A",
        "explanation": "Değişik tasarımla farklı taşıma sonucuna ulaşılmıştır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Metinsel kanıttan çıkarım"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "sourceThemeId": "LEGACY.8.T.8.3.25"
  },
  {
    "id": "grade8-lgs-t-8-3-29-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "8. sınıf LGS · Medya iletisinin amacı",
    "skill": "Medya iletisinin amacı",
    "explanation": "Medya metinleri bilgilendirebilir, ikna edebilir, yorumlayabilir ya da eğlendirebilir. Çağrı, haber ve görüş ifadelerini amaçları açısından çözümle.",
    "misconception": "Her dikkat çekici medya mesajını tarafsız haber sanmak.",
    "worked": {
      "prompt": "“Hemen başvur, yerini ayırt!”",
      "steps": [
        "Metindeki ortak konu ve anlatım amacını belirle.",
        "Görülen açık bilgiyi yorumdan ve aşırı genellemeden ayır.",
        "Verilen yanıta metindeki en az bir ifadeyi kanıt göster."
      ],
      "answer": "Davranışa yönlendiren ikna mesajı."
    },
    "exercises": [
      {
        "prompt": "“Kontenjan bitmeden hemen başvurun!” mesajının baskın amacı?",
        "options": {
          "A": "Hava tahmini yapmak",
          "B": "Sanat eleştirisi sunmak",
          "C": "Okuyucuyu başvurmaya yönlendirmek",
          "D": "Tarihî olayı aktarmak"
        },
        "answer": "C",
        "explanation": "Açık çağrı ifadesi ikna amaçlıdır."
      },
      {
        "prompt": "“Parkın güney girişi onarım nedeniyle çarşamba günü kapanacaktır.” Baskın amaç?",
        "options": {
          "A": "Reklam yapmak",
          "B": "Kamuyu bilgilendirmek",
          "C": "Okuyucuyu güldürmek",
          "D": "Fikir yarıştırmak"
        },
        "answer": "B",
        "explanation": "Zaman ve yer belirten duyuru bilgi vermeyi amaçlar."
      },
      {
        "prompt": "“En iyi ürün bizimkisi!” iddiasında hangi sorun vardır?",
        "options": {
          "A": "İfade yalnızca bir hava durumu bilgisidir.",
          "B": "Bir bilimsel deneydir.",
          "C": "Yalnız tarih verir.",
          "D": "Karşılaştırma ölçütü ve kanıt bulunmaz."
        },
        "answer": "D",
        "explanation": "Üstünlük iddiasının dayanağı açıklanmamıştır."
      },
      {
        "prompt": "“Video geri dönüşümü çizgi kahramanlarla esprili biçimde anlatıyor.” Yorum?",
        "options": {
          "A": "Hem eğlendirme hem bilgilendirme amacı taşıyabilir.",
          "B": "Yalnız ürün satar.",
          "C": "Bilgi veremez.",
          "D": "Bütün videoların amacı aynıdır."
        },
        "answer": "A",
        "explanation": "Bilgi ile eğlence aynı ileti içinde birlikte bulunabilir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Medya iletisinin amacı"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "sourceThemeId": "LEGACY.8.T.8.3.29"
  },
  {
    "id": "grade8-lgs-t-8-3-31-v1",
    "version": 1,
    "subject": "Türkçe",
    "title": "8. sınıf LGS · Güvenilir kaynak sorgulama",
    "skill": "Güvenilir kaynak sorgulama",
    "explanation": "Yazar, tarih, dayanak ve başka bağımsız güvenilir kaynaklarla tutarlılık araştırılır; paylaşım sayısı tek başına doğruluk kanıtı değildir.",
    "misconception": "Popüler bir mesajı sırf çok paylaşıldığı için doğru kabul etmek.",
    "worked": {
      "prompt": "“Yarın okullar tatil!” yazan tarihi belirsiz görsel yayılıyor.",
      "steps": [
        "Metindeki ortak konu ve anlatım amacını belirle.",
        "Görülen açık bilgiyi yorumdan ve aşırı genellemeden ayır.",
        "Verilen yanıta metindeki en az bir ifadeyi kanıt göster."
      ],
      "answer": "Yetkili kurumu ve güncel resmî duyuruyu kontrol etmek."
    },
    "exercises": [
      {
        "prompt": "“Bir yiyecek başarıyı kesin iki katına çıkarır!” iddiasında öncelikle ne aranır?",
        "options": {
          "A": "Görselin parlaklığı",
          "B": "Emoji sayısı",
          "C": "Yöntemi açıklanmış güvenilir veri",
          "D": "Başlık uzunluğu"
        },
        "answer": "C",
        "explanation": "Kesin etki iddiasının bilimsel kanıtı aranmalıdır."
      },
      {
        "prompt": "Eski bir olay fotoğrafı bugün çekilmiş gibi sunuluyor. İlk kontrol hangisi?",
        "options": {
          "A": "Fotoğrafın çerçevesi",
          "B": "Çekim ve yayın tarihi",
          "C": "Yorumların uzunluğu",
          "D": "Yazı tipi"
        },
        "answer": "B",
        "explanation": "Tarih kontrolü içeriğin doğru bağlamını ortaya koyabilir."
      },
      {
        "prompt": "Bir haberin doğruluğu için en güçlü yöntem hangisidir?",
        "options": {
          "A": "Yalnız manşete bakmak",
          "B": "En çok paylaşana inanmak",
          "C": "Güzel görüntüyü seçmek",
          "D": "Birincil belgeyi ve bağımsız kaynakları karşılaştırmak"
        },
        "answer": "D",
        "explanation": "Çoklu doğrulama popülerlikten daha sağlam kanıttır."
      },
      {
        "prompt": "Resmî bir kaynaktaki bilgi için hangisi doğrudur?",
        "options": {
          "A": "Kaynak güçlü bir işarettir; güncellik ve kapsam yine kontrol edilmelidir.",
          "B": "Her ekran görüntüsü gerçektir.",
          "C": "Tüm bilgiler sonsuza kadar günceldir.",
          "D": "Kaynak karşılaştırması yasaktır."
        },
        "answer": "A",
        "explanation": "Yetkili kurum, içeriğin tarih ve kapsam kontrolünün yerini almaz."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      8
    ],
    "topicTags": [
      "Güvenilir kaynak sorgulama"
    ],
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "sourceThemeId": "LEGACY.8.T.8.3.31"
  }
];
