/** Six original TYMM-linked 9–11 literature pilot topics. Teacher review is still required. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const TDE_REMAINING_THEME_PILOTS:readonly MicroLesson[]=[
  {
    "id": "tde9-story-structure-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "Hikâye haritasında olay, zaman ve mekân",
    "skill": "Kısa anlatıda olay örgüsüyle zaman ve mekânın anlama etkisini açıklama",
    "explanation": "Bir hikâyenin olay örgüsü, kişileri, zamanı ve mekânı birlikte anlam kurar. Mekânın değiştirilmesi olayın koşullarını etkileyebilir; zamanın belirsizliği bir anlatım tercihi olabilir. Yanıtı yalnız metinden desteklenen kanıta dayandır.",
    "misconception": "Olayın geçtiği her yeri olayın nedeni saymak veya metinde olmayan bir tarihi uydurmak.",
    "worked": {
      "prompt": "'Tren gecikince Ece, yağmur altındaki peronda annesinin mektubunu yeniden okudu.' Bu kesitte olay, mekân ve koşul nedir?",
      "steps": [
        "Olayı belirle: Ece mektubu yeniden okumaktadır.",
        "Mekân ipucunu bul: peron; koşullar tren gecikmesi ve yağmurdur.",
        "Bu koşullar, Ece'nin bekleyişini ve okuma eylemini bağlamlandırır."
      ],
      "answer": "Olay mektubu yeniden okuma, mekân peron, koşul geciken tren ve yağmurdur."
    },
    "exercises": [
      {
        "prompt": "'Kapanış saatine yetişemeyen Can, müzenin kapısında bekledi.' Olayı doğrudan başlatan durum nedir?",
        "options": {
          "A": "Müzenin konumu",
          "B": "Can'ın kıyafeti",
          "C": "Kapanış saatine yetişememesi",
          "D": "Eserlerin türü"
        },
        "answer": "C",
        "explanation": "Metinde bekleyişin nedeni kapanışa yetişememektir; başka neden belirtilmemiştir."
      },
      {
        "prompt": "'Gün ağarırken fırının önünde buluştular.' Bu cümlede belirginleşen yapı unsurları hangileridir?",
        "options": {
          "A": "Anlatıcı ve tema",
          "B": "Zaman ve mekân",
          "C": "Çatışma ve çözüm",
          "D": "Düşünce ve kanıt"
        },
        "answer": "B",
        "explanation": "Gün ağarırken zamanı, fırının önü mekânı belirtir."
      },
      {
        "prompt": "'Koridorda ışıklar söndüğünde herkes sessizleşti.' Kesitten kesin çıkarılabilecek bilgi nedir?",
        "options": {
          "A": "Işıkların sönmesiyle sessizlik arasında zaman ilişkisi vardır",
          "B": "Elektrik arızasının nedeni bilinmektedir",
          "C": "Kişiler binadan ayrılmıştır",
          "D": "Olay öğleden sonra geçmiştir"
        },
        "answer": "A",
        "explanation": "Yalnız olayların zaman ilişkisi açıklanmıştır; neden ve tarih çıkarılamaz."
      },
      {
        "prompt": "Bir hikâyede kapalı mekânın bunaltıcılığı sürekli vurgulanıyorsa mekânın temel işlevi ne olabilir?",
        "options": {
          "A": "Bütün olayların geçmişte kaldığını kanıtlamak",
          "B": "Kişi sayısını artırmak",
          "C": "Anlatıcıyı değiştirmek",
          "D": "Kişinin ruh hâlini güçlendirmek"
        },
        "answer": "D",
        "explanation": "Mekân betimlemesi kişinin duygu durumunu ve anlatının atmosferini destekleyebilir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Hikâye haritasında olay, zaman ve mekân"
    ],
    "sourceThemeId": "TYMM.TDE.9.T3",
    "sourceUrl": "https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/106"
  },
  {
    "id": "tde9-genre-voice-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "Roman, eleştiri ve otobiyografide anlatım amacı",
    "skill": "Metin türünü söyleyici, amaç ve kanıt biçimine göre çözümleme",
    "explanation": "Roman kurmaca kişi ve olaylar üzerinden anlam kurabilir; eleştiri bir eseri gerekçeli ölçütlerle değerlendirir; otobiyografi yazarın kendi yaşamını anlatmasıdır. Birinci kişi anlatımı her zaman otobiyografi değildir.",
    "misconception": "Birinci kişi anlatılan her metni otobiyografi saymak veya gerekçesiz beğeniyi eleştiriyle eş tutmak.",
    "worked": {
      "prompt": "'Bu romanın uzun tasvirleri ilerleyişi yavaşlatsa da karakterlerin iç çatışmasını görünür kılıyor.' Metnin amacı nedir?",
      "steps": [
        "Metinde bir eser hakkında yargı vardır.",
        "Yargının gerekçesi uzun tasvirlerin kurgu üzerindeki etkisiyle açıklanır.",
        "Bu, eleştirel değerlendirme amacını gösterir."
      ],
      "answer": "Romanı gerekçeli olarak değerlendirmek."
    },
    "exercises": [
      {
        "prompt": "'Romanın ikinci bölümünde bakış açısının değişmesi okurun karaktere uzaklığını artırıyor.' Bu cümle en çok hangi yazı amacına uygundur?",
        "options": {
          "A": "Günlük tutma",
          "B": "Olayı yaşama",
          "C": "Eleştirel değerlendirme",
          "D": "Resmî duyuru"
        },
        "answer": "C",
        "explanation": "Anlatım tekniğine ilişkin ölçüt ve gerekçeli yargı içerir."
      },
      {
        "prompt": "'Çocukluğumun geçtiği evden ayrıldığım yıl ilk şiirimi yazdım.' cümlesinin anlatı türüne dair en temkinli çıkarım hangisidir?",
        "options": {
          "A": "Kesinlikle kurmacadır",
          "B": "Otobiyografik anlatıma elverişlidir, tek başına türü kanıtlamaz",
          "C": "Mutlaka eleştiridir",
          "D": "Bilimsel rapordur"
        },
        "answer": "B",
        "explanation": "Birinci kişi yaşam anlatımı otobiyografik olabilir fakat bağlam olmadan tür kesinleşmez."
      },
      {
        "prompt": "Bir eleştiri yazısında 'Çok güzel bir kitap' sözünü güçlendiren hangisidir?",
        "options": {
          "A": "Eserde karakter gelişiminin iki sahne üzerinden örneklenmesi",
          "B": "Yazarın soyadının kısaltılması",
          "C": "Kitabın kapağının renginin söylenmesi",
          "D": "Satış fiyatının tahmin edilmesi"
        },
        "answer": "A",
        "explanation": "Yargıyı metinden somut kanıtla desteklemek eleştiri kalitesini yükseltir."
      },
      {
        "prompt": "Aşağıdakilerden hangisi romanın kurmaca dünyasıyla yazarın gerçek yaşamını doğru ilişkilendirir?",
        "options": {
          "A": "Roman kişisi daima yazardır",
          "B": "Her olay tarihî belgedir",
          "C": "Birinci kişi metin bütünüyle gerçektir",
          "D": "Kurgu yaşamdan esinlenebilir ancak birebir öz yaşam kaydı değildir"
        },
        "answer": "D",
        "explanation": "Romanın kurmaca özellikleri yazarı ve anlatıcıyı özdeş saymayı gerektirmez."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Roman, eleştiri ve otobiyografide anlatım amacı"
    ],
    "sourceThemeId": "TYMM.TDE.9.T4",
    "sourceUrl": "https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/112"
  },
  {
    "id": "tde10-oral-to-written-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "Destan, mesnevi ve fablde türün işlevi",
    "skill": "Anlatı türlerini yapı, aktarım geleneği ve amaç bakımından karşılaştırma",
    "explanation": "Destanlar topluluk hafızası ve kahramanlık anlatılarını taşıyabilir; mesnevi beyitlerle yazılan uzun manzum anlatılara elverişlidir; fabl ise insan dışı kahramanlar üzerinden öğüt veya eleştiri kurabilir. Türü tek bir sözden değil yapı ve amaçtan çıkar.",
    "misconception": "Hayvanın geçtiği her hikâyeyi fabl, uzun şiirin tamamını mesnevi saymak.",
    "worked": {
      "prompt": "Bir anlatıda tilki ve turna konuşur; olay sonunda paylaşma üzerine genel bir ders çıkarılır. Fabl için hangi iki ipucu belirleyicidir?",
      "steps": [
        "Konuşan hayvanların insan özellikleri taşıdığını belirle.",
        "Sonuçta çıkarılan ahlaki dersin öğretici işlevini bul.",
        "Bu ipuçları, fabl türünü destekler."
      ],
      "answer": "Kişileştirilmiş hayvanlar ve öğretici sonuç."
    },
    "exercises": [
      {
        "prompt": "Bir toplumun kuruluşunu olağanüstü kahramanlarla anlatan geleneksel metin hangi türe daha yakındır?",
        "options": {
          "A": "Deney raporu",
          "B": "Gezi yazısı",
          "C": "Destan",
          "D": "Eleştiri"
        },
        "answer": "C",
        "explanation": "Toplumsal hafıza, kahramanlık ve olağanüstülük destanın yaygın özellikleridir."
      },
      {
        "prompt": "Mesneviyi uzun bir olay anlatısına elverişli kılan biçimsel özellik hangisidir?",
        "options": {
          "A": "Her beyitte kendi içinde uyak düzeniyle ilerlemesi",
          "B": "Mutlaka sahnede oynanması",
          "C": "Yalnız hayvanları konu alması",
          "D": "Bütün dizelerin tek uyakta bitmesi"
        },
        "answer": "A",
        "explanation": "Mesnevide beyitlerin kendi aralarında uyaklanması uzun manzum anlatı kurmayı kolaylaştırır."
      },
      {
        "prompt": "Bir fablda kaplumbağa ile tavşanın konuşması hangi anlatım özelliğini gösterir?",
        "options": {
          "A": "Belgesel kayıt",
          "B": "Kişileştirme",
          "C": "Tarihî belge",
          "D": "Doğrudan röportaj"
        },
        "answer": "B",
        "explanation": "İnsan dışı canlılara konuşma gibi insan niteliği verilmiştir."
      },
      {
        "prompt": "Destan ve mesneviyi karşılaştırırken hangisi geçerli bir yaklaşım olur?",
        "options": {
          "A": "İkisini yalnız sayfa sayısıyla ayırmak",
          "B": "Her ikisini kesinlikle düzyazı kabul etmek",
          "C": "İkisinin de tek bir anlatıcıya ait olduğunu varsaymak",
          "D": "Sözlü/yazılı aktarım ile nazım yapısını birlikte incelemek"
        },
        "answer": "D",
        "explanation": "Türler biçim, aktarım ve anlatı işlevi bakımından karşılaştırılmalıdır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      10
    ],
    "topicTags": [
      "Destan, mesnevi ve fablde türün işlevi"
    ],
    "sourceThemeId": "TYMM.TDE.10.T3",
    "sourceUrl": "https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/256"
  },
  {
    "id": "tde10-cultural-transition-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "Edebî metinde kültürel süreklilik ve değişim",
    "skill": "Dönemler arası metinlerde dil, tema ve toplumsal koşulların değişimini kanıta dayandırma",
    "explanation": "Metinler tarihsel ve toplumsal bağlamla etkileşir. Kültürel süreklilik ile değişim aynı anda görülebilir. Dönemlere ilişkin genelleme ancak karşılaştırılan metin özellikleri ve bağlamla temellendirilmelidir.",
    "misconception": "Bir dönemdeki bütün yazarların aynı dil ve üslubu kullandığını iddia etmek.",
    "worked": {
      "prompt": "İki döneme ait şiirin birinde ağır tamlamalar, diğerinde daha yalın günlük konuşma dili var. Hangi karşılaştırma doğrudan yapılabilir?",
      "steps": [
        "Metinlerin ortak türünü belirle: şiir.",
        "Gözlenebilir farkı saptar: sözcük ve tamlama seçimi.",
        "Bu farkı dil/üslup değişimi olarak yorumlar; bütün döneme genellemez."
      ],
      "answer": "Metin örnekleri arasında dil ve üslup farklılığı."
    },
    "exercises": [
      {
        "prompt": "İki dönem şiirini karşılaştırmada aşağıdakilerden hangisi metin kanıtıdır?",
        "options": {
          "A": "Şairin sevilen kişi olması",
          "B": "Metinlerde kullanılan söz varlığı ve imgeler",
          "C": "Okurların yaşlarının bilinmemesi",
          "D": "Kitap fiyatlarının farklılığı"
        },
        "answer": "B",
        "explanation": "Söz varlığı ve imgeler doğrudan metinden karşılaştırılabilir."
      },
      {
        "prompt": "'Bu şiirlerde kahramanlık teması sürerken anlatım dili yalınlaşmıştır.' yargısı hangi ikiliye örnektir?",
        "options": {
          "A": "Temanın sürekliliği ve dilin değişimi",
          "B": "Yalnız biçimin sabitliği",
          "C": "Bütün değerlerin kaybolması",
          "D": "Kesin yazar kimliği"
        },
        "answer": "A",
        "explanation": "Tema korunabilirken dilin özellikleri değişebilir."
      },
      {
        "prompt": "Edebî bir metni tarihsel bağlamıyla incelemek için hangisi en uygundur?",
        "options": {
          "A": "Metni yalnız bugünkü beğeniyle yargılamak",
          "B": "Yalnız yayınevinin adını incelemek",
          "C": "Yazarın dönemindeki toplumsal ve dilsel koşulları değerlendirmek",
          "D": "Yazarın bütün metinlerini aynı kabul etmek"
        },
        "answer": "C",
        "explanation": "Eserin dönem koşulları yorumun bağlamını zenginleştirir."
      },
      {
        "prompt": "Bir metnin dilinden hareketle 'o çağdaki herkes böyle konuşuyordu' demek neden sorunludur?",
        "options": {
          "A": "Çünkü metinde hiç dil yoktur",
          "B": "Çünkü şiirlerde kelime bulunmaz",
          "C": "Çünkü dönem bilgisi gereksizdir",
          "D": "Çünkü tek metin tüm konuşur topluluğunu temsil etmez"
        },
        "answer": "D",
        "explanation": "Tek örnekten nüfusun tümüne kesin genelleme yapılamaz."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      10
    ],
    "topicTags": [
      "Edebî metinde kültürel süreklilik ve değişim"
    ],
    "sourceThemeId": "TYMM.TDE.10.T4",
    "sourceUrl": "https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/261"
  },
  {
    "id": "tde11-biography-fiction-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "Biyografi ile roman kişisini ayırt etme",
    "skill": "Biyografik bilgi, kurmaca anlatıcı ve kanıt temelli çıkarımı karşılaştırma",
    "explanation": "Biyografi doğrulanabilir bir kişinin yaşamını bilgi ve belgelerle anlatır. Roman kişilerinin dünyası kurmaca olabilir. Bir röportaj veya radyo tiyatrosu biçimi ise anlatımı başka bir yolla kurar. Türden kesinlik düzeyine geçerken kaynak ve anlatıcıyı sorgula.",
    "misconception": "Roman kahramanının yaşamını tarihsel biyografi gibi kabul etmek.",
    "worked": {
      "prompt": "'Sanatçı 1985'te ilk sergisini açtı (sergi kataloğu, s. 8).' cümlesi hangi tür kanıt taşır?",
      "steps": [
        "Somut yaşam olayı belirtilmiş: ilk sergi.",
        "Yıl ve kaynak kaydı yer alıyor.",
        "Bu veriler biyografik anlatının doğrulanabilirliğini destekler."
      ],
      "answer": "Tarihlenmiş ve kaynağa bağlanmış biyografik bilgi."
    },
    "exercises": [
      {
        "prompt": "Bir biyografide 'öğrenim gördüğü kurum' bilgisi için hangi kaynak daha uygundur?",
        "options": {
          "A": "Söylenti",
          "B": "Okur yorumu",
          "C": "Doğrulanmış eğitim kaydı",
          "D": "Kurmaca roman diyaloğu"
        },
        "answer": "C",
        "explanation": "Kurum kaydı tarih ve olayı doğrulamak için daha güçlü birincil veridir."
      },
      {
        "prompt": "'Bu karakter çocukluk yıllarında sürekli denize kaçıyordu.' ifadesi roman içindeyse en güvenli yorum nedir?",
        "options": {
          "A": "Kurmacanın kişi özelliklerini açıklar",
          "B": "Yazarın yaşamını kesin kanıtlar",
          "C": "Toplumun tümünü temsil eder",
          "D": "Biyografi belgesidir"
        },
        "answer": "A",
        "explanation": "Roman kişisinin yaşantısı doğrudan yazarın hayatı sayılamaz."
      },
      {
        "prompt": "Radyo tiyatrosunda mekân duygusu en çok hangi araçlarla kurulabilir?",
        "options": {
          "A": "Harita koordinatlarıyla zorunlu olarak",
          "B": "Sadece yazı puntosuyla",
          "C": "Yalnız kapak tasarımıyla",
          "D": "Ses efektleri ve konuşmalarla"
        },
        "answer": "D",
        "explanation": "Ses ve diyaloglar dinleyicide ortam tasavvuru oluşturur."
      },
      {
        "prompt": "Biyografi ile kurmaca romanı karşılaştırırken temel ayırıcı ölçüt hangisi olabilir?",
        "options": {
          "A": "Metindeki paragraf sayısı",
          "B": "Gerçek yaşam iddialarının doğrulanabilir kaynaklarla ilişkilendirilmesi",
          "C": "Kitabın boyutu",
          "D": "Cümlelerin tümünün kısa olması"
        },
        "answer": "B",
        "explanation": "Biyografik iddiaların kaynakla doğrulanması önemli bir ölçüttür."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      11
    ],
    "topicTags": [
      "Biyografi ile roman kişisini ayırt etme"
    ],
    "sourceThemeId": "TYMM.TDE.11.T3",
    "sourceUrl": "https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/322"
  },
  {
    "id": "tde11-drama-dialogue-v1",
    "version": 1,
    "subject": "Türk Dili ve Edebiyatı",
    "title": "Tiyatroda çatışma ve kısa anlatıda yoğunluk",
    "skill": "Diyalog ve sahne yönergelerinden çatışma çıkarma; küçürek hikâyedeki örtük anlamı yorumlama",
    "explanation": "Tiyatroda eylem, diyalog ve sahne yönergeleriyle gösterilir; kişiler arası çatışma söz ve davranışlardan anlaşılabilir. Küçürek hikâye ise sınırlı sözle yoğun çağrışım ve boşluklar yaratabilir. Kesin çıkarım için metin kanıtı aranır.",
    "misconception": "Yazar açıklaması bulunmayan bütün örtük anlamları tek kesin yanıt saymak.",
    "worked": {
      "prompt": "A: 'Kapıyı açmalıyız.' B: 'İçeridekiler hazır değil.' (İkisi kapının önünde durur.) Sahnenin temel çatışması nedir?",
      "steps": [
        "A kişisi içeri girmek ister.",
        "B kişisi hazır olunmadığı için beklemek ister.",
        "Eylem isteği ile erteleme arasında karar çatışması vardır."
      ],
      "answer": "Şimdi açma isteği ile bekleme gereği arasındaki çatışma."
    },
    "exercises": [
      {
        "prompt": "'— Söz vermiştin! — Verdiysem de koşullar değişti.' repliklerinde hangi gerilim vardır?",
        "options": {
          "A": "Anımsanan bir sözle değişen koşullar arasında anlaşmazlık",
          "B": "Metinde yer verilmiş hava olayı",
          "C": "Oyun sonunda kesin barışma",
          "D": "Tüm kişilerin aynı görüşte olması"
        },
        "answer": "A",
        "explanation": "Bir taraf sözün tutulmasını, diğeri değişen koşulları öne çıkarır."
      },
      {
        "prompt": "'(Pencereye yaklaşır, uzun süre dışarı bakar.)' ifadesinin tiyatrodaki görevi nedir?",
        "options": {
          "A": "Çözülmüş çatışmanın sonucu olmak",
          "B": "Yazarın doğum tarihini bildirmek",
          "C": "Sahne davranışını yönlendirmek",
          "D": "Seyircinin tüm yorumlarını açıklamak"
        },
        "answer": "C",
        "explanation": "Parantezli ifade sahne yönergesidir."
      },
      {
        "prompt": "'Masada iki fincan vardı. Biri yıllardır kullanılmıyordu.' gibi küçürek anlatı neyle etki yaratabilir?",
        "options": {
          "A": "Bütün ayrıntıları uzun uzun açıklayarak",
          "B": "Sınırlı ipucuyla okura anlam tamamlama alanı bırakarak",
          "C": "Yalnız bilgi tablosu sunarak",
          "D": "Tarihsel kanıtları listeleyerek"
        },
        "answer": "B",
        "explanation": "Az söz, kullanılmayan fincanın öyküsünü okurun yorumuna açabilir."
      },
      {
        "prompt": "Bir tiyatro metninde kişiler arası çatışmayı bulmak için en uygun kanıt hangisidir?",
        "options": {
          "A": "Sahne perdesinin rengi",
          "B": "Yazarın doğum yeri",
          "C": "Kitabın basım adedi",
          "D": "Karşıt amaç taşıyan sözler ve eylemler"
        },
        "answer": "D",
        "explanation": "Çatışma kişiler arasındaki karşıt istek ve davranışlarda belirir."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      11
    ],
    "topicTags": [
      "Tiyatroda çatışma ve kısa anlatıda yoğunluk"
    ],
    "sourceThemeId": "TYMM.TDE.11.T4",
    "sourceUrl": "https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/332"
  }
];
