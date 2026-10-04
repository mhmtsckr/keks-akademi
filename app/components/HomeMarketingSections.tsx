import Image from 'next/image';
import {CallbackRequestForm} from '@/app/abonelik-planlari/CallbackRequestForm';
import {COACHING_COMPARISON,FIRST_30_DAYS,KEKS_GUARANTEES,MARKETING_FAQ} from '@/lib/marketingContent';
import {STUDENT_TERM_PRICING} from '@/lib/subscriptionPlans';

function minFirstMonth(){
  const values=Object.values(STUDENT_TERM_PRICING).map(x=>x.firstMonth);
  return Math.min(...values);
}

function cell(value:string,highlight=false){
  if(value==='Var')return <span className={highlight?'homeCompareCheck keks':'homeCompareCheck'}>✓</span>;
  return <span className={highlight?'homeCompareText keks':'homeCompareText'}>{value}</span>;
}

function MilestoneIcon({index}:{index:number}){
  const icons=[
    <><circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="7"/><path d="m29 18 11-8m0 0-2 8m2-8-8 2"/></>,
    <><path d="M10 32h28M13 13h22v14H13z"/><path d="M17 8v9M31 8v9M18 36h12"/></>,
    <><path d="M10 36V20M21 36V13M32 36V7"/><path d="m10 15 9-6 9 3 10-8"/></>,
    <><path d="M13 14a15 15 0 1 1-2 18"/><path d="m7 27 4 5 6-3"/><path d="M24 13v11l8 5"/></>,
    <><path d="m24 6 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z"/></>
  ];
  return <span className="homeMilestoneIcon"><svg viewBox="0 0 48 48" aria-hidden="true">{icons[index%icons.length]}</svg></span>;
}

export function HomeMarketingSections(){
  const startingPrice=minFirstMonth().toLocaleString('tr-TR')+' TL’den';
  return <>
    <section className="homeConversionSection homeCompareSection" id="karsilastirma">
      <div className="homeConversionHead">
        <span>KARŞILAŞTIRMA</span>
        <h2>Standart online koçluk mu, KEKS Akademi mi?</h2>
        <p>KEKS yalnız görüşme ve program vermekle kalmaz; öğrencinin uygulamasını, tekrarını, yanlışlarını, deneme performansını ve koç aksiyonlarını aynı veri akışında birleştirir.</p>
      </div>
      <div className="homeCompareScroll">
        <div className="homeCompareTable" role="table" aria-label="Standart online koçluk ve KEKS Akademi karşılaştırması">
          <div className="homeCompareHeader feature">ÖZELLİKLER</div>
          <div className="homeCompareHeader standard">Standart<br/>online koçluk</div>
          <div className="homeCompareHeader keks">KEKS Akademi</div>

          <div className="homeCompareFeature">Erişilebilir başlangıç fiyatı</div>
          <div className="homeCompareCell">{cell('Hizmet sağlayıcıya göre değişir')}</div>
          <div className="homeCompareCell keks">{cell(startingPrice,true)}</div>

          {COACHING_COMPARISON.slice(1).map(row=><div className="homeCompareRow" key={row.feature}>
            <div className="homeCompareFeature">{row.feature}</div>
            <div className="homeCompareCell">{cell(row.standard)}</div>
            <div className="homeCompareCell keks">{cell(row.keks,true)}</div>
          </div>)}
        </div>
      </div>
      <div className="homeCompareFootnote">“Standart online koçluk” sütunu tek bir kurumun ürünü değildir; piyasadaki hizmetlerin kapsamı koça ve sağlayıcıya göre değişebilir. KEKS sütunu platformun mevcut sistem özelliklerini gösterir.</div>
      <div className="homeConversionActions">
        <a className="homeBtn homeBtnGold" href="/abonelik-planlari">Paketleri İncele</a>
        <a className="homeBtn homeBtnGhost" href="#sizi-arayalim">Sizi Arayalım</a>
      </div>
    </section>

    <section className="homeConversionSection" id="ilk-30-gun">
      <div className="homeConversionHead">
        <span>İLK 30 GÜN</span>
        <h2>KEKS ile ilk 30 günde neler başarabilirsin?</h2>
        <p>Hedef mucize sonuç vaat etmek değil; çalışma sürecini ölçülebilir, takip edilebilir ve geliştirilebilir bir sisteme dönüştürmektir.</p>
      </div>
      <div className="homeFirst30Rail">
        {FIRST_30_DAYS.map((item,index)=><article className={"homeFirst30Card homeFirst30Card"+(index+1)} key={item.range}>
          <div className="homeFirst30Top"><MilestoneIcon index={index}/><b>{String(index+1).padStart(2,'0')}</b></div>
          <small>{item.range}</small>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
          <span className="homeFirst30Progress" aria-hidden="true"><i style={{width:((index+1)/FIRST_30_DAYS.length*100)+'%'}}/></span>
        </article>)}
      </div>
    </section>

    <section className="homeConversionSection homeGuaranteeSection" id="keks-garantisi">
      <div className="homeGuaranteeLead">
        <div className="homeConversionHead">
          <span>KEKS GARANTİSİ</span>
          <h2>Sonuç sözü değil, süreç standardı.</h2>
          <p>KEKS Garantisi belirli bir net, puan veya sıralamayı değil; aktif kullanım boyunca ölçüm, planlama, takip, tekrar ve raporlama standardını ifade eder.</p>
        </div>
        <div className="homeGuaranteeVisual">
          <Image src="/home-guarantee-shield.svg" alt="KEKS Garantisi süreç standardı rozeti" width={420} height={340} sizes="(max-width: 760px) 70vw, 300px"/>
        </div>
      </div>
      <div className="homeGuaranteeGrid">
        {KEKS_GUARANTEES.map((item,index)=><article className="homeGuaranteeCard" key={item.title}>
          <div className="homeGuaranteeIcon">✓</div>
          <div><small>GARANTİ {index+1}</small><h3>{item.title}</h3><p>{item.text}</p></div>
        </article>)}
      </div>
      <p className="homeGuaranteeNote">Akademik sonuç; çalışma süresi, uygulama düzeyi, sınav koşulları ve bireysel farklılıklardan etkilenir. Bu nedenle KEKS net, puan veya sıralama garantisi vermez.</p>
    </section>

    <section className="homeConversionSection homeReviewSection" id="kullanici-yorumlari">
      <div className="homeReviewLayout">
        <div>
          <div className="homeConversionHead">
            <span>KULLANICI YORUMLARI</span>
            <h2>Gerçek deneyimler, doğrulanmış kullanıcılar.</h2>
            <p>KEKS yalnızca izin alınmış gerçek kullanıcı yorumlarını yayınlar. Yapay veya doğrulanmamış bir yorumu gerçek deneyim gibi göstermiyoruz.</p>
          </div>
          <div className="homeReviewPlaceholder">
            <div aria-hidden="true">★★★★★</div>
            <h3>Doğrulanmış kullanıcı yorumları burada yayınlanacak.</h3>
            <p>İlk onaylı öğrenci, veli ve KEKS Partner Koç yorumları geldikçe bu alan otomatik olarak büyütülebilecek şekilde hazırlandı.</p>
          </div>
        </div>
        <div className="homeReviewVisual">
          <Image src="/home-reviews-verified.svg" alt="Doğrulanmış kullanıcı yorumlarını temsil eden konuşma kartları ve onay rozeti" width={520} height={320} sizes="(max-width: 900px) 80vw, 34vw"/>
        </div>
      </div>
    </section>

    <section className="homeConversionSection" id="sizi-arayalim">
      <div className="homeConversionHead">
        <span>SİZİ ARAYALIM</span>
        <h2>Doğru KEKS planını birlikte netleştirelim.</h2>
        <p>Öğrenci, veli veya Partner Koç olarak bilgilerinizi bırakın; seçtiğiniz zaman aralığında KEKS Akademi ekibi sizinle iletişime geçsin.</p>
      </div>
      <div className="homeCallbackShell">
        <div className="homeCallbackPitch">
          <small>ÜCRETSİZ ÖN BİLGİLENDİRME</small>
          <h3>Kısa bir görüşmede ihtiyacınızı netleştirin.</h3>
          <p>Eğitim düzeyi, sınav hedefi, çalışma düzeni veya Partner Koç kapasitesi üzerinden en uygun seçenek birlikte değerlendirilir.</p>
          <div><span>✓ Paket ve süre karşılaştırması</span><span>✓ Öğrenci / veli ihtiyaç değerlendirmesi</span><span>✓ KEKS Partner Koç lisans bilgisi</span></div>
          <div className="homeCallbackVisual">
            <Image src="/home-callback-support.svg" alt="KEKS Akademi bilgi görüşmesini temsil eden destek illüstrasyonu" width={520} height={390} sizes="(max-width: 900px) 82vw, 34vw"/>
          </div>
        </div>
        <CallbackRequestForm/>
      </div>
    </section>

    <section className="homeConversionSection homeFaqSection" id="sss">
      <div className="homeFaqLayout">
        <div className="homeFaqVisual">
          <Image src="/home-faq-help.svg" alt="KEKS Akademi sıkça sorulan sorular yardım illüstrasyonu" width={480} height={330} sizes="(max-width: 900px) 72vw, 31vw"/>
          <span>Tüm soruların için buradayız.</span>
        </div>
        <div>
          <div className="homeConversionHead">
            <span>SIKÇA SORULAN SORULAR</span>
            <h2>Karar vermeden önce bilmek isteyebileceğiniz her şey.</h2>
            <p>Paketler, ilk 30 gün, MİZA, iptal ve KEKS Partner Koç modeliyle ilgili temel sorular.</p>
          </div>
          <div className="homeFaqList">
            {MARKETING_FAQ.map(([question,answer])=><details className="homeFaqItem" key={question}>
              <summary>{question}<span>+</span></summary>
              <p>{answer}</p>
            </details>)}
          </div>
        </div>
      </div>
    </section>

    <section className="homeFinalCta">
      <span>KEKS AKADEMİ</span>
      <h2>Ders çalışmayı tesadüften çıkar, sisteme dönüştür.</h2>
      <p>Ölç → Planla → Uygulat → Kaydet → Tekrar Ettir → Yeniden Ölç → Koça Aksiyon Öner.</p>
      <div>
        <a className="homeBtn homeBtnGold" href="/abonelik-planlari">Paketleri İncele</a>
        <a className="homeBtn homeBtnGhost" href="#sizi-arayalim">Beni Arayın</a>
      </div>
    </section>
  </>;
}
