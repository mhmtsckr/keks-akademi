type StrategyItem={
  order:string;
  subject:string;
  title:string;
  targetDays:number;
  summary:string;
  actions:string[];
  coachNote:string;
};

const STRATEGIES:StrategyItem[]=[
  {
    order:'01',
    subject:'Matematik',
    title:'Temel + uygulama + deneme döngüsü',
    targetDays:45,
    summary:'Konu öğrenimini soru çözümüyle aynı gün eşleştir; ilerlemeyi net ve doğruluk üzerinden takip et.',
    actions:[
      'Tek bir video/kamp serisi seç ve kaynak değiştirmeden ilerle.',
      'Konu anlatımıyla paralel soru bankası kullan.',
      'Her konu bittiğinde ilgili testleri ve yanlış analizini tamamla.',
      'Konu havuzu tamamlandığında haftalık mini deneme rutinine geç.'
    ],
    coachNote:'Özellikle sözel ağırlıklı öğrencilerde küçük ama düzenli matematik kazanımı hedefle; hacmi öğrencinin gerçek odak süresine göre artır.'
  },
  {
    order:'02',
    subject:'Tarih',
    title:'Not çıkarma + çapraz kaynak + günlük soru',
    targetDays:25,
    summary:'Bilgiyi yalnız okumak yerine kısa not, aktif hatırlama ve düzenli soru çözümüyle kalıcılaştır.',
    actions:[
      'İki kaynağı çapraz okuyarak ana konu iskeletini oluştur.',
      'Konu ilerledikçe kısa, tekrar edilebilir notlar çıkar.',
      'Çalışma döneminde yüksek soru hacmi; sonrasında günlük koruma rutini uygula.',
      'Yanlışları nedenleriyle yanlış defterine kaydet.'
    ],
    coachNote:'Ezber yükünü azaltmak için kronoloji, neden-sonuç ve anahtar kavram kartları kullan; haftalık aktif hatırlama kontrolü yap.'
  },
  {
    order:'03',
    subject:'Coğrafya',
    title:'Harita + görsel kodlama + soru kampı',
    targetDays:20,
    summary:'Yazılı bilgiyi harita, şema ve görsel çağrışımla eşleştir; görsel hafızayı soru çözümüyle pekiştir.',
    actions:[
      'Haritasız konularda kısa konu notu çıkar.',
      'Haritalı konular için ayrı harita kartları oluştur.',
      'Her çalışma bloğunu soru bankası ve yanlış analiziyle kapat.',
      'Karma soru kamplarıyla haftalık görsel tekrar yap.'
    ],
    coachNote:'Öğrencinin karıştırdığı bölge, kavram ve dağılışları kişisel görsel kodlarla eşleştir; yalnızca metin tekrarına bırakma.'
  },
  {
    order:'04',
    subject:'Eğitim Bilimleri',
    title:'Alt alan bazlı yoğun soru pratiği',
    targetDays:50,
    summary:'Geniş kapsamı tek parça çalışmak yerine alt başlıklara böl; her alt alanı konu + soru + deneme şeklinde kapat.',
    actions:[
      'Alt konuları zorluk ve eksik düzeyine göre sırala.',
      'Ayrıntılı defter yerine kritik kavram ve ayırt edici noktaları not al.',
      'Her alt alan için düzenli ve yüksek kaliteli soru pratiği uygula.',
      'Konu havuzu tamamlandığında deneme + yanlış defteri rutinini sürdür.'
    ],
    coachNote:'Soru sayısını sabit bir rakama bağlama; doğruluk, süre ve yanlış türlerine göre günlük hacmi kademeli artır.'
  },
  {
    order:'05',
    subject:'Mevzuat',
    title:'Madde temelli not + çıkmış soru tekrarı',
    targetDays:20,
    summary:'Sınırlı konu havuzunu maddeler ve anahtar hükümler üzerinden çalış; çıkmış sorularla tekrar sıklığını artır.',
    actions:[
      'Temel mevzuat başlıklarını maddeler hâlinde kısa notlara dönüştür.',
      'Konu ilerledikçe bir test kaynağını paralel çöz.',
      'Konu bittikten sonra çıkmış soruları birden fazla tur çöz.',
      'Yanlış defterinde yalnız kısa hüküm, istisna ve karıştırılan maddeyi tut.'
    ],
    coachNote:'Mevzuatı düz ezber yerine soru bağlamında tekrar ettir; sık karıştırılan maddeler için 0–1–3–7–14–28 tekrar döngüsü kullan.'
  }
];

export function AgsStudyArithmetic({studentName}:{studentName:string}){
  return <div className="agsArithmeticShell">
    <div className="agsArithmeticHero">
      <div>
        <div className="moduleEyebrow">YÖNETİCİ ONAYLI · KOÇA ÖZEL</div>
        <div className="agsArithmeticTitleRow">
          <div>
            <h2>AGS Çalışma Aritmetiği</h2>
            <p>{studentName} için AGS/ÖABT çalışma sürecini ders sırası, uygulama yöntemi, tekrar ve hata analizi ekseninde yönetin.</p>
          </div>
          <span className="agsArithmeticBadge">AGS / ÖABT</span>
        </div>
      </div>
      <div className="agsArithmeticPrinciple">
        <span>KEKS ÇALIŞMA İLKESİ</span>
        <strong>Plan yapılmak için değil, uygulanmak için vardır.</strong>
        <p>Süreler örnek plan hedefidir; öğrencinin hız, doğruluk, net gelişimi ve sürdürülebilir çalışma kapasitesine göre koç tarafından yeniden kalibre edilir.</p>
      </div>
    </div>

    <div className="agsArithmeticGrid">
      {STRATEGIES.map(item=><article className="agsArithmeticCard" key={item.subject}>
        <div className="agsArithmeticCardTop">
          <span className="agsArithmeticOrder">{item.order}</span>
          <div>
            <small>{item.subject.toLocaleUpperCase('tr-TR')}</small>
            <h3>{item.title}</h3>
          </div>
          <div className="agsArithmeticDuration"><b>~{item.targetDays}</b><span>gün plan hedefi</span></div>
        </div>
        <p className="agsArithmeticSummary">{item.summary}</p>
        <div className="agsArithmeticActions">
          {item.actions.map((action,i)=><div key={action}><span>{i+1}</span><p>{action}</p></div>)}
        </div>
        <div className="agsArithmeticCoachNote"><strong>Koç uygulaması</strong><p>{item.coachNote}</p></div>
      </article>)}
    </div>

    <div className="agsArithmeticFlow">
      <div className="moduleEyebrow">UYGULAMA DÖNGÜSÜ</div>
      <div className="agsArithmeticFlowSteps">
        {['Araştırma','Planlama','Başlama','Uygulama','Analiz','Düzeltme','Sürdürme','Final'].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,'0')}</span><strong>{x}</strong></div>)}
      </div>
      <div className="agsArithmeticRetention"><span>MUHAFAZA SÜRECİ</span><strong>0 → 1 → 3 → 7 → 14 → 28 gün tekrar döngüsü</strong></div>
    </div>
  </div>;
}
