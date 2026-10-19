/** MEB-linked grade 9-11 mathematics *pilot* remedial examples; original KEKS questions, not MEB/ÖSYM questions. */
import type {MicroLesson} from './bankFreeMicroLessons';
export const TYMM_MATH_PILOT_LESSONS:readonly MicroLesson[]=[
  {
    "id": "math-g9-empirical-probability-v1",
    "version": 1,
    "subject": "Matematik",
    "title": "Deneysel olasılık ve göreli sıklık",
    "skill": "Deneydeki gözlem sayılarından göreli sıklık hesaplayıp teorik olasılıkla farkını yorumlama",
    "explanation": "Deneysel olasılık, olayın gerçekleşme sayısının toplam deneme sayısına oranıdır. Az denemede teorik olasılıkla eşit olmak zorunda değildir; tekrar sayısı artınca göreli sıklığın nasıl değiştiğini gözlemleyebiliriz.",
    "misconception": "Bir deneyin göreli sıklığını tek başına kesin teorik olasılık saymak.",
    "worked": {
      "prompt": "Bir çark 80 kez döndürüldü; 18 kez kırmızı geldi. Kırmızının deneysel olasılığı kaçtır?",
      "steps": [
        "Gerçekleşme sayısı 18, toplam deneme sayısı 80.",
        "Göreli sıklık 18/80 = 9/40 = 0,225.",
        "Deneysel oran %22,5'tir; çarkın teorik oranını tek başına kesin olarak göstermez."
      ],
      "answer": "18/80 = %22,5"
    },
    "exercises": [
      {
        "prompt": "40 para atışında 23 kez yazı gelmiştir. Yazının deneysel göreli sıklığı kaçtır?",
        "options": {
          "A": "17/40",
          "B": "23/40",
          "C": "23/17",
          "D": "1/2"
        },
        "answer": "B",
        "explanation": "Deneysel göreli sıklık = yazı sayısı / atış sayısı = 23/40."
      },
      {
        "prompt": "Bir çark 60 kez dönmüş, 15 kez yeşil gelmiştir. Gözlenen yeşil oranı kaçtır?",
        "options": {
          "A": "%15",
          "B": "%20",
          "C": "%25",
          "D": "%40"
        },
        "answer": "C",
        "explanation": "15/60 = 1/4 olduğundan gözlenen oran %25'tir."
      },
      {
        "prompt": "50 denemede 12 kez sarı görülmüştür. Deneysel sarı olasılığı yüzde kaçtır?",
        "options": {
          "A": "%24",
          "B": "%12",
          "C": "%38",
          "D": "%50"
        },
        "answer": "A",
        "explanation": "12/50 = 0,24 = %24."
      },
      {
        "prompt": "100 çekilişin 47'sinde mavi top gözlenmiştir. Hangisi kesin olarak söylenebilir?",
        "options": {
          "A": "Teorik mavi olasılığı kesin %47'dir",
          "B": "Bir sonraki çekiliş kesin mavidir",
          "C": "Çekiliş hilesizdir",
          "D": "Bu örneklemde mavinin göreli sıklığı %47'dir"
        },
        "answer": "D",
        "explanation": "Deneme sonuçları örneklem göreli sıklığını verir; teorik oranı kesinleştirmez."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Deneysel olasılık ve göreli sıklık"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/matematik-dersi/unite/97",
    "sourceThemeId": "MAT.9.7.1"
  },
  {
    "id": "math-g9-theoretical-probability-v1",
    "version": 1,
    "subject": "Matematik",
    "title": "Eş olasılıklı durumları sistematik sayma",
    "skill": "Eş olasılıklı örnek uzayı listeleyerek istenen olayın teorik olasılığını bulma",
    "explanation": "Eş olasılıklı sonuçlarda P(A) = istenen sonuç sayısı / tüm sonuç sayısı. Sonuçları tablo, ağaç veya sistematik listeyle eksiksiz göster; eş olasılıklı değilse yalnız sayıları bölmek yeterli olmaz.",
    "misconception": "Örnek uzayın sonuçlarını eksik saymak veya farklı olasılıklı sonuçları eşit varsaymak.",
    "worked": {
      "prompt": "Adil bir zar atıldığında 3'ün katı gelme olasılığı kaçtır?",
      "steps": [
        "Örnek uzay {1,2,3,4,5,6} ve 6 eş olasılıklı sonuç içerir.",
        "İstenen durumlar {3,6}; toplam 2 sonuç.",
        "P = 2/6 = 1/3."
      ],
      "answer": "1/3"
    },
    "exercises": [
      {
        "prompt": "Adil bir zar atılıyor. 4'ten büyük gelme olasılığı kaçtır?",
        "options": {
          "A": "1/2",
          "B": "1/6",
          "C": "1/3",
          "D": "2/3"
        },
        "answer": "C",
        "explanation": "4'ten büyük sonuçlar 5 ve 6'dır; 2/6 = 1/3."
      },
      {
        "prompt": "Adil iki madeni para atıldığında ikisinin de tura gelme olasılığı kaçtır?",
        "options": {
          "A": "1/4",
          "B": "1/2",
          "C": "3/4",
          "D": "1/8"
        },
        "answer": "A",
        "explanation": "Eş olasılıklı dört sonuç TT, TY, YT, YY; yalnız TT uygundur."
      },
      {
        "prompt": "İçinde 3 kırmızı, 2 mavi eş özellikli top bulunan torbadan bir top çekiliyor. Kırmızı olasılığı kaçtır?",
        "options": {
          "A": "2/5",
          "B": "1/3",
          "C": "1/2",
          "D": "3/5"
        },
        "answer": "D",
        "explanation": "Toplam 5 eş olasılıklı topun 3'ü kırmızıdır: 3/5."
      },
      {
        "prompt": "Adil üç madeni para aynı anda atılıyor. Tam bir yazı gelme olasılığı kaçtır?",
        "options": {
          "A": "1/8",
          "B": "3/8",
          "C": "1/2",
          "D": "5/8"
        },
        "answer": "B",
        "explanation": "8 eş olasılıklı dizilişten YTT, TYT ve TTY olmak üzere 3'ü uygundur."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      9
    ],
    "topicTags": [
      "Eş olasılıklı durumları sistematik sayma"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/matematik-dersi/unite/97",
    "sourceThemeId": "MAT.9.7.2"
  },
  {
    "id": "math-g10-prime-divisors-v1",
    "version": 1,
    "subject": "Matematik",
    "title": "Asal çarpanlardan pozitif bölen sayısı",
    "skill": "Asal üslerin örüntüsünü kullanarak pozitif tam bölen sayısını akıl yürütmeyle hesaplama",
    "explanation": "n = p₁ᵃ × p₂ᵇ biçiminde asal çarpanlarına ayrıldığında pozitif bölen sayısı (a+1)(b+1) olur. Çünkü her asalın üssü sıfırdan kendi üssüne kadar seçilebilir.",
    "misconception": "Asal sayıların üslerini toplamak veya bölen sayısı için tabanları çarpmak.",
    "worked": {
      "prompt": "72'nin pozitif bölen sayısı kaçtır?",
      "steps": [
        "72 = 2³ × 3² şeklinde asal çarpanlarına ayrılır.",
        "Bir bölen için 2'nin üssü 0,1,2,3; 3'ün üssü 0,1,2 olabilir.",
        "4 × 3 = 12 farklı pozitif bölen vardır."
      ],
      "answer": "12"
    },
    "exercises": [
      {
        "prompt": "36 = 2² × 3² sayısının pozitif bölen sayısı kaçtır?",
        "options": {
          "A": "6",
          "B": "9",
          "C": "12",
          "D": "18"
        },
        "answer": "B",
        "explanation": "Her asalın üssü 0,1,2 olabilir; (2+1)(2+1)=9."
      },
      {
        "prompt": "80 = 2⁴ × 5 sayısının pozitif bölen sayısı kaçtır?",
        "options": {
          "A": "5",
          "B": "8",
          "C": "12",
          "D": "10"
        },
        "answer": "D",
        "explanation": "(4+1)(1+1)=5×2=10."
      },
      {
        "prompt": "45 = 3² × 5 sayısının pozitif bölen sayısı kaçtır?",
        "options": {
          "A": "6",
          "B": "8",
          "C": "9",
          "D": "12"
        },
        "answer": "A",
        "explanation": "(2+1)(1+1)=6 farklı pozitif bölen vardır."
      },
      {
        "prompt": "48 = 2⁴ × 3 sayısının pozitif bölen sayısı kaçtır?",
        "options": {
          "A": "8",
          "B": "12",
          "C": "10",
          "D": "15"
        },
        "answer": "C",
        "explanation": "(4+1)(1+1)=10. Asalların tabanları bölen sayısına doğrudan girmez."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      10
    ],
    "topicTags": [
      "Asal çarpanlardan pozitif bölen sayısı"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/matematik-dersi/unite/244",
    "sourceThemeId": "MAT.10.3.1"
  },
  {
    "id": "math-g10-coordinate-distance-v1",
    "version": 1,
    "subject": "Matematik",
    "title": "Koordinat düzleminde uzaklık ve orta nokta",
    "skill": "İki noktanın uzaklığını ve doğru parçasının orta noktasını farklı temsillerle bulma",
    "explanation": "A(x₁,y₁) ve B(x₂,y₂) için uzaklık √[(x₂−x₁)²+(y₂−y₁)²], orta nokta ((x₁+x₂)/2,(y₁+y₂)/2) olur. Geometrik düşüncede yatay/düşey farkları ayrı takip et.",
    "misconception": "Uzaklık hesaplamasında koordinat farklarını kare almadan doğrudan toplamak.",
    "worked": {
      "prompt": "A(1,2) ve B(4,6) noktalarının uzaklığı kaç birimdir?",
      "steps": [
        "Yatay değişim 4−1=3, düşey değişim 6−2=4.",
        "Pisagor bağıntısıyla uzaklığın karesi 3²+4²=25.",
        "Uzaklık √25=5 birimdir."
      ],
      "answer": "5"
    },
    "exercises": [
      {
        "prompt": "A(−1,4) ve B(2,8) arasındaki uzaklık kaç birimdir?",
        "options": {
          "A": "4",
          "B": "6",
          "C": "5",
          "D": "7"
        },
        "answer": "C",
        "explanation": "Yatay fark 3, düşey fark 4; uzaklık √(9+16)=5."
      },
      {
        "prompt": "A(2,4) ve B(6,8) noktalarının orta noktası hangisidir?",
        "options": {
          "A": "(4,6)",
          "B": "(8,12)",
          "C": "(2,2)",
          "D": "(6,4)"
        },
        "answer": "A",
        "explanation": "Koordinat ortalamaları ((2+6)/2,(4+8)/2)=(4,6)."
      },
      {
        "prompt": "A(−2,2) ve B(4,6) noktalarının orta noktası hangisidir?",
        "options": {
          "A": "(2,4)",
          "B": "(−1,2)",
          "C": "(3,5)",
          "D": "(1,4)"
        },
        "answer": "D",
        "explanation": "Orta nokta ((−2+4)/2,(2+6)/2)=(1,4)."
      },
      {
        "prompt": "A(3,−1) ve B(3,5) arasındaki uzaklık kaç birimdir?",
        "options": {
          "A": "4",
          "B": "6",
          "C": "8",
          "D": "9"
        },
        "answer": "B",
        "explanation": "x değerleri eşit; yalnız düşey fark 5−(−1)=6'dır."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      10
    ],
    "topicTags": [
      "Koordinat düzleminde uzaklık ve orta nokta"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/matematik-dersi/unite/263",
    "sourceThemeId": "MAT.10.6.1"
  },
  {
    "id": "math-g11-trig-transformations-v1",
    "version": 1,
    "subject": "Matematik",
    "title": "Trigonometrik fonksiyonların periyot ve aralığı",
    "skill": "Sinüs/kosinüs fonksiyonlarında katsayı ve ötelemelerin periyot ile görüntü kümesine etkisini yorumlama",
    "explanation": "f(x)=k·sin(mx)+s için görüntü aralığı [s−|k|,s+|k|], temel periyot 2π/|m|'dir (m≠0, k≠0). Düşey öteleme periyodu değiştirmez.",
    "misconception": "Düşey ötelemenin periyodu değiştirdiğini veya sinüsün değer aralığını tüm gerçek sayılar sanmak.",
    "worked": {
      "prompt": "f(x)=2sin(x)+1 fonksiyonunun görüntü aralığı ve temel periyodu nedir?",
      "steps": [
        "sin(x) değerleri [−1,1] aralığındadır.",
        "2 ile çarpıp 1 ekleyince [−1,3] elde edilir.",
        "İçeride x'in katsayısı 1 olduğundan temel periyot 2π'dir."
      ],
      "answer": "[−1,3] ve 2π"
    },
    "exercises": [
      {
        "prompt": "f(x)=sin(3x) fonksiyonunun temel periyodu kaçtır?",
        "options": {
          "A": "2π",
          "B": "3π",
          "C": "π/3",
          "D": "2π/3"
        },
        "answer": "D",
        "explanation": "sin(mx) için T=2π/|m|; burada 2π/3."
      },
      {
        "prompt": "f(x)=3cos(x) fonksiyonunun görüntü kümesi hangisidir?",
        "options": {
          "A": "[0,3]",
          "B": "[−3,3]",
          "C": "[−1,1]",
          "D": "[3,∞)"
        },
        "answer": "B",
        "explanation": "cos(x) ∈ [−1,1] olduğundan üçle çarpılınca [−3,3]."
      },
      {
        "prompt": "f(x)=sin(x)+3 fonksiyonunun en küçük değeri kaçtır?",
        "options": {
          "A": "2",
          "B": "−3",
          "C": "3",
          "D": "4"
        },
        "answer": "A",
        "explanation": "sin(x) en az −1 olabilir, −1+3=2."
      },
      {
        "prompt": "f(x)=−2sin(2x) fonksiyonunun temel periyodu nedir?",
        "options": {
          "A": "2π",
          "B": "π/2",
          "C": "π",
          "D": "4π"
        },
        "answer": "C",
        "explanation": "Dışarıdaki −2 katsayısı periyodu değiştirmez; 2π/2=π."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      11
    ],
    "topicTags": [
      "Trigonometrik fonksiyonların periyot ve aralığı"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/matematik-dersi/unite/281",
    "sourceThemeId": "MAT.11.3.1"
  },
  {
    "id": "math-g11-exponential-functions-v1",
    "version": 1,
    "subject": "Matematik",
    "title": "Üstel fonksiyon ve grafik dönüşümü",
    "skill": "Üstel referans fonksiyonların yönünü, tanım/görüntü aralığını ve düşey/yatay ötelemeyi yorumlama",
    "explanation": "f(x)=aˣ (a>0, a≠1) her gerçek x'te tanımlıdır, görüntü kümesi (0,∞)'dir. a>1 ise artan; 0<a<1 ise azalandır. f(x)+s grafiği s birim yukarı taşır.",
    "misconception": "Tabanı 0 ile 1 arasında olan üstel fonksiyonu artan sanmak veya 2ˣ'in sıfır olabileceğini düşünmek.",
    "worked": {
      "prompt": "g(x)=2ˣ+3 fonksiyonunun görüntü kümesi ve g(0) değeri nedir?",
      "steps": [
        "2ˣ her zaman pozitiftir; görüntü aralığı (0,∞).",
        "3 yukarı öteleme sonucunda görüntü aralığı (3,∞) olur.",
        "g(0)=2⁰+3=1+3=4."
      ],
      "answer": "(3,∞) ve 4"
    },
    "exercises": [
      {
        "prompt": "f(x)=(1/2)ˣ fonksiyonunun tekdüzelik özelliği hangisidir?",
        "options": {
          "A": "Artandır",
          "B": "Sabit kalır",
          "C": "Azalandır",
          "D": "Yalnız x>0 için tanımlıdır"
        },
        "answer": "C",
        "explanation": "0<a<1 tabanlı üstel fonksiyonlar tüm gerçek sayılarda azalandır."
      },
      {
        "prompt": "f(x)=3ˣ fonksiyonunun tanım kümesi hangisidir?",
        "options": {
          "A": "Tüm gerçek sayılar",
          "B": "Yalnız pozitif tam sayılar",
          "C": "Yalnız negatif tam sayılar",
          "D": "[0,1]"
        },
        "answer": "A",
        "explanation": "Üstel fonksiyon 3ˣ her gerçek x için tanımlıdır."
      },
      {
        "prompt": "g(x)=2⁽ˣ⁻¹⁾ fonksiyonu 2ˣ grafiğinden nasıl elde edilir?",
        "options": {
          "A": "Bir birim sola kaydırma",
          "B": "Bir birim yukarı kaydırma",
          "C": "İki birim sağa kaydırma",
          "D": "Bir birim sağa kaydırma"
        },
        "answer": "D",
        "explanation": "x yerine x−1 yazılması grafiği bir birim sağa kaydırır."
      },
      {
        "prompt": "g(x)=3·2ˣ fonksiyonunun görüntü kümesi hangisidir?",
        "options": {
          "A": "[0,∞)",
          "B": "(0,∞)",
          "C": "(−∞,0)",
          "D": "Tüm gerçek sayılar"
        },
        "answer": "B",
        "explanation": "2ˣ>0 ve 3>0 olduğundan g(x)>0, sıfır değerine ulaşmaz."
      }
    ],
    "contentStatus": "PILOT",
    "targetGrades": [
      11
    ],
    "topicTags": [
      "Üstel fonksiyon ve grafik dönüşümü"
    ],
    "sourceUrl": "https://tymm.meb.gov.tr/matematik-dersi/unite/295",
    "sourceThemeId": "MAT.11.3.3"
  }
];
