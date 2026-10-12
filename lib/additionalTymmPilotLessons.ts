/** Eight independent original question sets, NOT copied from MEB/ÖSYM; expert review pending. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const ADDITIONAL_TYMM_PILOT_LESSONS:readonly MicroLesson[]=[
  {
    "id": "grade5-cell-comparison-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "targetGrades": [
      5
    ],
    "title": "Bitki ve hayvan hücresi karşılaştırması",
    "skill": "Bitki ve hayvan hücresi karşılaştırması",
    "explanation": "Bitki ve hayvan hücresinde hücre zarı, sitoplazma ve çekirdek bulunur. Bitki hücresi hücre duvarı ve genellikle kloroplast taşırken hayvan hücresi bunları taşımaz.",
    "misconception": "Hayvan hücresinde kloroplast veya hücre duvarı bulunduğunu sanmak.",
    "worked": {
      "prompt": "Çekirdek, hücre zarı ve hücre duvarı verilen bir hücrede hangi özellik bitkiye işaret eder?",
      "steps": [
        "Ortak yapılara bak: çekirdek ve hücre zarı her ikisinde de bulunur.",
        "Ayırt edici yapı hücre duvarıdır.",
        "Bu özellik bir bitki hücresine işaret eder."
      ],
      "answer": "Hücre duvarı"
    },
    "exercises": [
      {
        "prompt": "Hangisi bitki ve hayvan hücrelerinde ortaktır?",
        "options": {
          "A": "Hücre duvarı",
          "B": "Kloroplast",
          "C": "Hücre zarı",
          "D": "Bütün hücrelerde büyük koful"
        },
        "answer": "C",
        "explanation": "Her iki hücre tipinin plazma zarı vardır."
      },
      {
        "prompt": "Kloroplastın ayırt edici görevi nedir?",
        "options": {
          "A": "Fotosentez yapmak",
          "B": "Sinir impulsu taşımak",
          "C": "Kemik oluşturmak",
          "D": "Kan pompalamak"
        },
        "answer": "A",
        "explanation": "Kloroplast, fotosentez için gerekli pigment ve yapıları içerir."
      },
      {
        "prompt": "Aşağıdakilerden hangisi tipik hayvan hücresinde bulunmaz?",
        "options": {
          "A": "Sitoplazma",
          "B": "Çekirdek",
          "C": "Hücre zarı",
          "D": "Selüloz hücre duvarı"
        },
        "answer": "D",
        "explanation": "Hayvan hücrelerinde selüloz hücre duvarı yoktur."
      },
      {
        "prompt": "Hangi yapı hem bitki hem hayvan hücresinde kalıtsal bilgiyi taşır?",
        "options": {
          "A": "Kloroplast",
          "B": "Çekirdek",
          "C": "Hücre duvarı",
          "D": "Yalnız merkezi koful"
        },
        "answer": "B",
        "explanation": "Ökaryot hücrelerin çekirdeği DNA'yı barındırır."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Bitki ve hayvan hücresi karşılaştırması"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/388",
    "sourceThemeId": "FB.5.3.1"
  },
  {
    "id": "grade5-cell-hierarchy-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "targetGrades": [
      5
    ],
    "title": "Hücreden organizmaya yapı basamakları",
    "skill": "Hücreden organizmaya yapı basamakları",
    "explanation": "Hücreler benzer görevle doku, farklı dokular organ, ilişkili organlar sistem oluşturur. Sistemler birlikte organizmanın yaşamasını sağlar.",
    "misconception": "Bir organın tek bir hücreden oluştuğunu veya sistemlerin dokulardan daha küçük olduğunu düşünmek.",
    "worked": {
      "prompt": "Kalp bir organ olduğuna göre kalp kasındaki kas hücreleri ile kalp arasında hangi basamak vardır?",
      "steps": [
        "Kas hücreleri bir araya gelerek kas dokusunu oluşturur.",
        "Farklı dokular kalp organını meydana getirir.",
        "Aradaki basamak dokudur."
      ],
      "answer": "Doku"
    },
    "exercises": [
      {
        "prompt": "Küçükten büyüğe doğru doğru sıralama hangisidir?",
        "options": {
          "A": "Hücre–doku–organ–sistem–organizma",
          "B": "Organ–hücre–sistem–doku–organizma",
          "C": "Doku–hücre–organ–organizma–sistem",
          "D": "Sistem–organ–doku–hücre–organizma"
        },
        "answer": "A",
        "explanation": "Organizasyon hücre, doku, organ, sistem ve organizma sırasını izler."
      },
      {
        "prompt": "Benzer görevi yapan hücrelerin oluşturduğu yapı hangisidir?",
        "options": {
          "A": "Organizma",
          "B": "Sistem",
          "C": "Doku",
          "D": "Organ"
        },
        "answer": "C",
        "explanation": "Benzer yapılı ve görevli hücreler bir dokuyu oluşturabilir."
      },
      {
        "prompt": "Mide aşağıdaki düzeylerden hangisine örnektir?",
        "options": {
          "A": "Hücre",
          "B": "Doku",
          "C": "Sistem",
          "D": "Organ"
        },
        "answer": "D",
        "explanation": "Mide çeşitli dokulardan oluşan bir organdır."
      },
      {
        "prompt": "Dolaşım sistemi hangi yapılardan oluşur?",
        "options": {
          "A": "Tek bir hücreden",
          "B": "İş birliği yapan organlardan",
          "C": "Yalnız bir dokudan",
          "D": "Tek bir organelden"
        },
        "answer": "B",
        "explanation": "Sistemler birlikte çalışan çeşitli organları içerir."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Hücreden organizmaya yapı basamakları"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/388",
    "sourceThemeId": "FB.5.3.2"
  },
  {
    "id": "grade6-reflection-surfaces-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "targetGrades": [
      6
    ],
    "title": "Düzgün ve dağınık yansıma",
    "skill": "Düzgün ve dağınık yansıma",
    "explanation": "Pürüzsüz yüzeyde paralel gelen ışınlar düzenli yönde yansıyabilir. Pürüzlü yüzeyde ışınlar farklı yönlere dağılır; bu dağınık yansımada da ışık yansır.",
    "misconception": "Dağınık yansımada ışığın hiç yansımadığını düşünmek.",
    "worked": {
      "prompt": "Aynı ışık kaynağı düz folyo ve buruşturulmuş folyoya tutuluyor. Hangisinde yansıma daha düzenlidir?",
      "steps": [
        "Yüzeyleri karşılaştır: biri düz, biri girintili çıkıntılı.",
        "Düz yüzey yansıyan ışığın yönünü daha düzenli tutar.",
        "Düz folyo düzgün yansımaya daha elverişlidir."
      ],
      "answer": "Düz folyo"
    },
    "exercises": [
      {
        "prompt": "Pürüzlü bir yüzeyde ışığın farklı yönlere dağılması hangisidir?",
        "options": {
          "A": "Kırılma",
          "B": "Dağınık yansıma",
          "C": "Saydamlaşma",
          "D": "Işığın yok olması"
        },
        "answer": "B",
        "explanation": "Pürüzlü yüzeyde yansıma çok sayıda farklı yöne gerçekleşebilir."
      },
      {
        "prompt": "Düzgün yansıma gözlemek için hangisi daha uygundur?",
        "options": {
          "A": "Düz ayna",
          "B": "Buruşuk kâğıt",
          "C": "Dokulu kumaş",
          "D": "Pürüzlü taş"
        },
        "answer": "A",
        "explanation": "Düz aynanın pürüzsüz yüzeyi düzenli yansımayı sağlar."
      },
      {
        "prompt": "Dağınık yansımayla ilgili hangi ifade doğrudur?",
        "options": {
          "A": "Hiç ışık yansımaz",
          "B": "Yalnız siyah ışık yansır",
          "C": "Işık farklı yönlerde yansıyabilir",
          "D": "Işık her zaman geçip gider"
        },
        "answer": "C",
        "explanation": "Dağınık yansımada ışığın yönü yüzeyin yerel doğrultusuna göre değişebilir."
      },
      {
        "prompt": "İki farklı yüzeyin yansıtma biçimini karşılaştırırken ne sabit tutulmalıdır?",
        "options": {
          "A": "Yüzeyin rengi kesin farklı olmalı",
          "B": "Işık kaynağı rastgele değişmeli",
          "C": "Gözlem yeri sürekli değişmeli",
          "D": "Kaynağın ve geliş açısının koşulları"
        },
        "answer": "D",
        "explanation": "Adil karşılaştırmada koşullar kontrollü tutulur."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Düzgün ve dağınık yansıma"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/412",
    "sourceThemeId": "FB.6.4.1"
  },
  {
    "id": "grade6-mirror-types-v1",
    "version": 1,
    "subject": "Fen Bilimleri",
    "targetGrades": [
      6
    ],
    "title": "Düz, çukur ve tümsek aynalar",
    "skill": "Düz, çukur ve tümsek aynalar",
    "explanation": "Düz ayna günlük koşullarda görüntüyü aynı boyda gösterir. Tümsek ayna daha geniş görüş alanı sağlayan küçük düz görüntü oluşturur. Çukur ayna ise cismin uzaklığına göre farklı boy ve yönlerde görüntü oluşturabilir.",
    "misconception": "Tümsek aynanın görüntüyü her durumda büyüttüğünü düşünmek.",
    "worked": {
      "prompt": "Yol kavşağında geniş bir görüş alanı için hangi ayna tercih edilir?",
      "steps": [
        "Amaç geniş bir alanı tek bakışta görmek.",
        "Tümsek aynalar geniş görüş alanı ve küçük görüntü sağlar.",
        "Kavşakta uygun ayna tümsektir."
      ],
      "answer": "Tümsek ayna"
    },
    "exercises": [
      {
        "prompt": "Mağaza güvenlik aynası geniş alan göstermesi için genellikle hangi tiptir?",
        "options": {
          "A": "Düz",
          "B": "Çukur",
          "C": "Tümsek",
          "D": "Opak"
        },
        "answer": "C",
        "explanation": "Tümsek ayna daha geniş görüş alanı sağlayabilir."
      },
      {
        "prompt": "Düz aynada kişinin görüntüsü boyca nasıl görünür?",
        "options": {
          "A": "Aynı boyda",
          "B": "Her zaman iki kat",
          "C": "Her zaman ters",
          "D": "Her zaman sıfır boyda"
        },
        "answer": "A",
        "explanation": "Düz aynadaki görüntü cismin boyuyla aynıdır."
      },
      {
        "prompt": "Cisim uzaklığına bağlı olarak büyük veya ters görüntü oluşturabilen ayna hangisidir?",
        "options": {
          "A": "Yalnız düz",
          "B": "Yalnız tümsek",
          "C": "Yalnız saydam cam",
          "D": "Çukur"
        },
        "answer": "D",
        "explanation": "Çukur aynada görüntünün özellikleri konuma bağlıdır."
      },
      {
        "prompt": "Tümsek aynanın temel özelliği hangisidir?",
        "options": {
          "A": "Her zaman gerçek ters görüntü",
          "B": "Geniş görüş alanı",
          "C": "Işık geçirmesi",
          "D": "Işığı tamamen soğurması"
        },
        "answer": "B",
        "explanation": "Tümsek aynalar görüş alanını genişletir."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Düz, çukur ve tümsek aynalar"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/412",
    "sourceThemeId": "FB.6.4.3"
  },
  {
    "id": "grade9-scalar-vector-v1",
    "version": 1,
    "subject": "Fizik",
    "targetGrades": [
      9
    ],
    "title": "Skaler ve vektörel nicelikler",
    "skill": "Skaler ve vektörel nicelikler",
    "explanation": "Skaler niceliğin büyüklüğü yeterlidir; kütle, sıcaklık ve sürat örnektir. Vektörel nicelik büyüklüğe ek olarak yön gerektirir; yer değiştirme, kuvvet ve hız buna örnektir.",
    "misconception": "Yönü belirtilmeyen büyüklükleri otomatik vektörel sanmak; sürat ile hızı karıştırmak.",
    "worked": {
      "prompt": "‘20 metre doğuya yer değiştirme’ neden vektöreldir?",
      "steps": [
        "Bir büyüklük verilmiş: 20 metre.",
        "Bir yön de verilmiş: doğu.",
        "Bu nedenle yer değiştirme vektörel niceliktir."
      ],
      "answer": "Büyüklük ve yön içerdiği için"
    },
    "exercises": [
      {
        "prompt": "Hangisi skaler niceliktir?",
        "options": {
          "A": "Kuvvet",
          "B": "Yer değiştirme",
          "C": "Sürat",
          "D": "İvme"
        },
        "answer": "C",
        "explanation": "Sürat yalnız büyüklükle tanımlanır."
      },
      {
        "prompt": "Hangisi vektörel niceliktir?",
        "options": {
          "A": "Kuvvet",
          "B": "Kütle",
          "C": "Sıcaklık",
          "D": "Zaman"
        },
        "answer": "A",
        "explanation": "Kuvvetin büyüklüğünün yanında yönü vardır."
      },
      {
        "prompt": "Bir aracın ‘50 km/sa kuzeye’ ifadesi aşağıdakilerden hangisini belirtir?",
        "options": {
          "A": "Yalnız sıcaklık",
          "B": "Yalnız kütle",
          "C": "Alınan toplam yol",
          "D": "Yönlü hız"
        },
        "answer": "D",
        "explanation": "Yön verildiği için hız vektörel olarak belirtilmiştir."
      },
      {
        "prompt": "Bir fiziksel niceliğin vektörel sayılması için ne gereklidir?",
        "options": {
          "A": "Yalnız sayı",
          "B": "Büyüklük ve yön",
          "C": "Yalnız birim",
          "D": "Yalnız ölçme aracı"
        },
        "answer": "B",
        "explanation": "Vektörün yön ve büyüklük özellikleri birlikte önemlidir."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Skaler ve vektörel nicelikler"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/fizik-dersi/unite/57",
    "sourceThemeId": "FİZ.9.2.2"
  },
  {
    "id": "grade10-chemical-change-evidence-v1",
    "version": 1,
    "subject": "Kimya",
    "targetGrades": [
      10
    ],
    "title": "Kimyasal değişim kanıtlarını yorumlama",
    "skill": "Kimyasal değişim kanıtlarını yorumlama",
    "explanation": "Kimyasal değişim yeni tür maddelerin oluşmasıdır. Gaz çıkışı, çökelek, renk veya sıcaklık değişimi olası göstergelerdir; tek belirti bağlam olmadan kesin kanıt değildir. Fiziksel değişimlerden ayırmak için başka gözlemlerle destekle.",
    "misconception": "Her renk değişimini kesin kimyasal tepkime; her gaz çıkışını yeni madde oluşumu sanmak.",
    "worked": {
      "prompt": "Berrak iki çözeltinin karıştırılmasından sonra çözünmeyen yeni bir katı oluştu. Bu hangi gözlem olabilir?",
      "steps": [
        "Başlangıç çözeltilerinde görünür katı yok.",
        "Karıştırma sonrasında katı ortaya çıktı.",
        "Bu gözlem yeni bir çökelek oluşumunu ve olası kimyasal değişimi düşündürür."
      ],
      "answer": "Çökelek oluşumu"
    },
    "exercises": [
      {
        "prompt": "İki berrak çözelti karıştırılınca yeni katı oluşması hangi göstergedir?",
        "options": {
          "A": "Buharlaşma",
          "B": "Donma",
          "C": "Çökelek oluşumu",
          "D": "Yalnız erime"
        },
        "answer": "C",
        "explanation": "Yeni katının oluşması kimyasal değişimi düşündürebilir."
      },
      {
        "prompt": "Kaynayan saf suda kabarcık oluşması için hangisi doğrudur?",
        "options": {
          "A": "Tek başına kimyasal değişimin kesin kanıtı değildir",
          "B": "Her zaman yeni element oluşur",
          "C": "Maddenin atomları yok olur",
          "D": "Daima yanma gerçekleşir"
        },
        "answer": "A",
        "explanation": "Kaynama fiziksel değişimdir; su buharı kabarcıkları oluşabilir."
      },
      {
        "prompt": "Kimyasal değişimi değerlendirirken en doğru yöntem nedir?",
        "options": {
          "A": "Sadece karışımın rengine bakmak",
          "B": "Yalnız kap şekline bakmak",
          "C": "Gözlemi kaydetmeden tahmin yapmak",
          "D": "Birden çok gözlem ve bağlamı değerlendirmek"
        },
        "answer": "D",
        "explanation": "Olası göstergeler bağlama göre bir arada yorumlanmalıdır."
      },
      {
        "prompt": "Yeni bir maddenin oluşması hangi değişimin ayırt edici özelliğidir?",
        "options": {
          "A": "Yalnız biçim değişimi",
          "B": "Kimyasal değişim",
          "C": "Yalnız hâl değişimi",
          "D": "Mekanik kırılma"
        },
        "answer": "B",
        "explanation": "Kimyasal değişimde maddelerin kimliği değişir."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Kimyasal değişim kanıtlarını yorumlama"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/kimya-dersi/unite/138",
    "sourceThemeId": "KİM.10.1.1"
  },
  {
    "id": "grade10-equation-balancing-v1",
    "version": 1,
    "subject": "Kimya",
    "targetGrades": [
      10
    ],
    "title": "Tepkime denklemlerinde atom korunumu",
    "skill": "Tepkime denklemlerinde atom korunumu",
    "explanation": "Kimyasal denklemi denkleştirirken bileşik formüllerinin alt indisleri değiştirilmez. Maddelerin önüne yazılan katsayılar ayarlanarak her elementin atom sayısı iki tarafta eşitlenir.",
    "misconception": "Alt indisleri değiştirerek denkleştirme yapmak veya iki taraftaki atom sayısını kontrol etmemek.",
    "worked": {
      "prompt": "H₂ + O₂ → H₂O denklemine uygun en küçük katsayılar nelerdir?",
      "steps": [
        "Sağdaki O sayısını eşitlemek için ürünün önüne 2 yaz: 2H₂O.",
        "Sağ tarafta artık 4 H var; sol tarafta 2H₂ gerekir.",
        "Sonuç: 2H₂ + O₂ → 2H₂O."
      ],
      "answer": "2, 1, 2"
    },
    "exercises": [
      {
        "prompt": "N₂ + H₂ → NH₃ tepkimesi en küçük tam sayılarla nasıl denkleştirilir?",
        "options": {
          "A": "1, 1, 1",
          "B": "1, 2, 2",
          "C": "1, 3, 2",
          "D": "2, 3, 2"
        },
        "answer": "C",
        "explanation": "N₂ + 3H₂ → 2NH₃; iki tarafta N=2, H=6."
      },
      {
        "prompt": "Mg + O₂ → MgO için katsayılar sırasıyla nedir?",
        "options": {
          "A": "2, 1, 2",
          "B": "1, 1, 1",
          "C": "1, 2, 1",
          "D": "2, 2, 1"
        },
        "answer": "A",
        "explanation": "2Mg + O₂ → 2MgO denkleştirilmiştir."
      },
      {
        "prompt": "Fe + S → FeS için en küçük katsayılar hangisidir?",
        "options": {
          "A": "2, 1, 1",
          "B": "1, 2, 1",
          "C": "2, 2, 1",
          "D": "1, 1, 1"
        },
        "answer": "D",
        "explanation": "Her iki tarafta Fe ve S atomları birer tanedir."
      },
      {
        "prompt": "Al + Cl₂ → AlCl₃ için en küçük tam sayı katsayıları hangisidir?",
        "options": {
          "A": "1, 1, 1",
          "B": "2, 3, 2",
          "C": "2, 2, 3",
          "D": "3, 2, 2"
        },
        "answer": "B",
        "explanation": "2Al + 3Cl₂ → 2AlCl₃, her iki tarafta Al=2, Cl=6."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Tepkime denklemlerinde atom korunumu"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/kimya-dersi/unite/138",
    "sourceThemeId": "KİM.10.1.6"
  },
  {
    "id": "grade11-tropism-nasty-v1",
    "version": 1,
    "subject": "Biyoloji",
    "targetGrades": [
      11
    ],
    "title": "Bitkilerde tropizma ve nasti hareketleri",
    "skill": "Bitkilerde tropizma ve nasti hareketleri",
    "explanation": "Tropizmalar büyüme yönünün uyaranın geliş yönüyle ilişkili olduğu tepkilerdir (ışığa yönelme gibi). Nasti hareketleri, uyaranın geliş yönüne bağlı olmayan tepkilerdir (küstüm otu yapraklarının dokunmayla kapanması gibi).",
    "misconception": "Uyaranın yönüne bağlı yönelme hareketini uyarandan bağımsız açılıp kapanmayla aynı kabul etmek.",
    "worked": {
      "prompt": "Bir bitkinin gövdesi pencerenin ışık alan yönüne doğru büyüyor. Bu nasıl sınıflanır?",
      "steps": [
        "Uyaranı belirle: ışık.",
        "Gövdenin büyüme yönü ışığın geldiği yöne bağlı.",
        "Bu, pozitif fototropizmadır."
      ],
      "answer": "Pozitif fototropizma"
    },
    "exercises": [
      {
        "prompt": "Gövdenin ışığın geldiği yöne doğru büyümesi hangisidir?",
        "options": {
          "A": "Nasti",
          "B": "Tropizma",
          "C": "Refleks",
          "D": "Hidroliz"
        },
        "answer": "B",
        "explanation": "Yönelme ışığın geliş yönüne bağlı olduğundan tropizmadır."
      },
      {
        "prompt": "Küstüm otu yapraklarının dokunmayla kapanması neden nasti örneğidir?",
        "options": {
          "A": "Tepki yönü uyaranın geliş yönüne bağlı değildir",
          "B": "Fotosentez kesin durur",
          "C": "Bitki kökleri hiç büyümez",
          "D": "Hücre duvarı kaybolur"
        },
        "answer": "A",
        "explanation": "Nasti hareketleri uyaranın geliş yönüne göre belirlenmez."
      },
      {
        "prompt": "Köklerin yerçekimi yönünde büyümesi hangisine örnektir?",
        "options": {
          "A": "Termonasti",
          "B": "Kemotaksi",
          "C": "Tigmonasti",
          "D": "Pozitif gravitropizma"
        },
        "answer": "D",
        "explanation": "Büyümenin yönü yerçekimi uyaranına bağlıdır."
      },
      {
        "prompt": "Tropizma ile nastiyi ayıran en temel ölçüt hangisidir?",
        "options": {
          "A": "Bitkinin yaşı",
          "B": "Günün saati",
          "C": "Tepkinin uyaran yönüne bağlılığı",
          "D": "Bitkinin toprak rengi"
        },
        "answer": "C",
        "explanation": "Tropizma uyaran yönüne bağımlı yönelmedir; nasti değildir."
      }
    ],
    "contentStatus": "PILOT",
    "topicTags": [
      "Bitkilerde tropizma ve nasti hareketleri"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/biyoloji-dersi/unite/13",
    "sourceThemeId": "BİY.11.1.3"
  }
];
