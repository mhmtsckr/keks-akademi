import type {StudentIndicator,StudentIndicatorKey} from '@/lib/studentIndicators';

export type ParentWeeklyBriefItem={
  title:string;
  detail:string;
  evidence?:string;
};

export type ParentWeeklyBrief={
  reassurance:{
    tone:'CALM'|'SUPPORT'|'ATTENTION'|'NO_DATA';
    headline:string;
    detail:string;
  };
  good:ParentWeeklyBriefItem[];
  attention:ParentWeeklyBriefItem[];
  support:ParentWeeklyBriefItem[];
  change:{status:'UP'|'DOWN'|'MIXED'|'STABLE'|'NO_DATA';text:string};
  keksRecommendation:string;
  privacyNote:string;
};

function byKey(indicators:StudentIndicator[],key:StudentIndicatorKey){
  return indicators.find(x=>x.key===key)||null;
}
function fmtDelta(delta:number|null){
  if(delta==null)return 'karşılaştırma verisi yok';
  if(delta===0)return 'geçen haftayla aynı';
  return 'geçen haftaya göre '+(delta>0?'+':'')+delta+' puan';
}
function evidenceOf(x:StudentIndicator|null){
  if(!x)return undefined;
  return x.evidence+(x.delta!=null?' · '+fmtDelta(x.delta):'');
}
function unique(items:ParentWeeklyBriefItem[]){
  const seen=new Set<string>();
  return items.filter(item=>{
    if(seen.has(item.title))return false;
    seen.add(item.title);return true;
  });
}

function summarizeWeeklyChange(indicators:StudentIndicator[]):ParentWeeklyBrief['change']{
  // Compare matching days across weeks; never infer a change from missing or unreliable measurements.
  const comparable=indicators.filter(x=>x.value!=null&&x.previous!=null&&x.delta!=null&&x.confidence!=='YETERSİZ');
  if(comparable.length===0)return {
    status:'NO_DATA',
    text:'Önceki haftayla güvenilir karşılaştırma için henüz yeterli veri yok.'
  };
  const byMagnitude=[...comparable].sort((a,b)=>Math.abs(b.delta||0)-Math.abs(a.delta||0));
  const improved=byMagnitude.find(x=>(x.delta||0)>=5);
  const declined=byMagnitude.find(x=>(x.delta||0)<=-5);
  if(improved&&declined)return {
    status:'MIXED',
    text:'Geçen haftaya göre '+improved.label.toLocaleLowerCase('tr-TR')+' gelişirken '+declined.label.toLocaleLowerCase('tr-TR')+' geriledi.'
  };
  if(improved)return {
    status:'UP',
    text:'Geçen haftaya göre en belirgin gelişme '+improved.label.toLocaleLowerCase('tr-TR')+' alanında.'
  };
  if(declined)return {
    status:'DOWN',
    text:'Geçen haftaya göre en çok dikkat isteyen değişim '+declined.label.toLocaleLowerCase('tr-TR')+' alanında.'
  };
  return {status:'STABLE',text:'Ölçülebilen alanlarda geçen haftaya göre belirgin bir değişiklik yok.'};
}

export function buildParentWeeklyBrief(input:{
  indicators:StudentIndicator[];
  todayPlan:{total:number;completed:number};
  coachNote?:string|null;
}):ParentWeeklyBrief{
  const continuity=byKey(input.indicators,'CONTINUITY');
  const review=byKey(input.indicators,'REVIEW_DISCIPLINE');
  const mastery=byKey(input.indicators,'KNOWLEDGE_MASTERY');
  const accuracy=byKey(input.indicators,'QUESTION_ACCURACY');
  const plan=byKey(input.indicators,'PLAN_ALIGNMENT');

  const todayPct=input.todayPlan.total>0
    ?Math.round(input.todayPlan.completed/input.todayPlan.total*100)
    :null;

  let reassurance:ParentWeeklyBrief['reassurance'];
  if(todayPct!=null&&todayPct>=85){
    reassurance={
      tone:'CALM',
      headline:'Bugün çalışma hatırlatması yapmanız gerekmiyor.',
      detail:'Bugünkü planına %'+todayPct+' uydu. Ek kontrol yerine emeğini fark etmeniz ve çalışma sorumluluğunu onda bırakmanız daha değerli.'
    };
  }else if(todayPct!=null&&todayPct>=60){
    reassurance={
      tone:'SUPPORT',
      headline:'Bugün tek bir sakin hatırlatma yeterli.',
      detail:'Bugünkü plan uyumu %'+todayPct+'. Sık kontrol etmek yerine çalışma saatini hatırlatıp sorumluluğu tekrar öğrencide bırakın.'
    };
  }else if(todayPct!=null){
    reassurance={
      tone:'ATTENTION',
      headline:'Bugün baskı değil, başlangıcı kolaylaştıran destek gerekli.',
      detail:'Bugünkü plan uyumu %'+todayPct+'. Baskı kurmak veya eksik görevleri tek tek sorgulamak yerine sakin bir çalışma ortamı ve net bir başlangıç zamanı sağlayın.'
    };
  }else if(plan?.value!=null&&plan.value>=85){
    reassurance={
      tone:'CALM',
      headline:'Bugün ekstra çalışma hatırlatması yapmanız gerekmiyor.',
      detail:'Bu haftaki plan uyumu %'+plan.value+'. Mevcut ritmi bozacak ek görev veya sık kontrol yerine çabayı fark etmeniz yeterli.'
    };
  }else if(plan?.value!=null){
    reassurance={
      tone:'SUPPORT',
      headline:'Bugün kontrol etmek yerine kısa bir destek cümlesi yeterli.',
      detail:'Bu haftaki plan uyumu %'+plan.value+'. Programın ayrıntısını sorgulamak yerine “Planındaki ilk adıma ne zaman başlayacaksın?” gibi tek bir soru kullanın.'
    };
  }else{
    reassurance={
      tone:'NO_DATA',
      headline:'Bugün için müdahale düzeyini söylemek adına yeterli plan verisi yok.',
      detail:'Veri oluşana kadar ek çalışma yükü vermeyin; öğrencinin ve koçun mevcut planını sürdürmesine alan açın.'
    };
  }

  const good:ParentWeeklyBriefItem[]=[];
  if(plan?.value!=null&&plan.value>=75)good.push({
    title:'Planını büyük ölçüde uyguladı',
    detail:'Çalışma programını dışarıdan sürekli hatırlatma olmadan sürdürebildi.',
    evidence:evidenceOf(plan)
  });
  if(continuity?.value!=null&&continuity.value>=70)good.push({
    title:'Çalışma ritmi düzenli',
    detail:'Çalışmayı tek güne yığmak yerine haftaya yayma davranışı güçlü görünüyor.',
    evidence:evidenceOf(continuity)
  });
  if(review?.value!=null&&review.value>=75)good.push({
    title:'Tekrarlarını aksatmadı',
    detail:'Vadesi gelen tekrarların önemli bölümünü zamanında tamamladı.',
    evidence:evidenceOf(review)
  });
  if(mastery?.value!=null&&mastery.value>=65)good.push({
    title:'Öğrenilen konuların önemli bölümü korunuyor',
    detail:'Ölçülen konularda bilgi hâkimiyeti yeterli düzeyde.',
    evidence:evidenceOf(mastery)
  });
  if(accuracy?.delta!=null&&accuracy.delta>=5)good.push({
    title:'Soru doğruluğu yükseldi',
    detail:'Doğru cevap oranında geçen haftaya göre anlamlı bir artış var.',
    evidence:evidenceOf(accuracy)
  });
  if(good.length===0)good.push({
    title:'Bu hafta için güçlü bir davranış sinyali henüz oluşmadı',
    detail:'Bu bir başarısızlık göstergesi değildir; karşılaştırılabilir veri birikmeye devam ediyor.'
  });

  const attention:ParentWeeklyBriefItem[]=[];
  if(plan?.value!=null&&plan.value<60)attention.push({
    title:'Plan uygulaması destek gerektiriyor',
    detail:'Programı büyütmek yerine mevcut görevlerin uygulanabilirliğini koçun değerlendirmesi daha doğru olur.',
    evidence:evidenceOf(plan)
  });
  if(plan?.delta!=null&&plan.delta<=-10)attention.push({
    title:'Plan uyumu belirgin biçimde geriledi',
    detail:'Düşüşün nedeni motivasyon, kapasite veya program yoğunluğu olabilir; doğrudan “neden çalışmadın?” sorgusu yerine koçun değerlendirmesi beklenmeli.',
    evidence:evidenceOf(plan)
  });
  if(continuity?.value!=null&&continuity.value<60)attention.push({
    title:'Çalışma günlere yeterince yayılmadı',
    detail:'Sorun toplam çalışma miktarından çok düzenli başlama ritmi olabilir.',
    evidence:evidenceOf(continuity)
  });
  if(review?.value!=null&&review.value<60)attention.push({
    title:'Tekrar ritmi aksadı',
    detail:'Yeni görev eklemek yerine geciken tekrarların koç planında yeniden dengelenmesi daha değerlidir.',
    evidence:evidenceOf(review)
  });
  if(mastery?.value!=null&&mastery.value<50)attention.push({
    title:'Bazı öğrenmeler henüz kalıcılaşmamış olabilir',
    detail:'Bu durum daha fazla baskı değil, doğru zamanda tekrar ve yeniden ölçüm gerektirir.',
    evidence:evidenceOf(mastery)
  });
  if(accuracy?.delta!=null&&accuracy.delta<=-10)attention.push({
    title:'Soru doğruluğunda düşüş var',
    detail:'Tek başına sonuç üzerinden yorum yapmak yerine yanlış nedeni ve konu haritasını koçun incelemesi gerekir.',
    evidence:evidenceOf(accuracy)
  });
  if(attention.length===0)attention.push({
    title:'Belirgin bir müdahale sinyali yok',
    detail:'Mevcut veriler veli tarafından ekstra çalışma baskısı gerektiren güçlü bir düşüş göstermiyor.'
  });

  const support:ParentWeeklyBriefItem[]=[];
  if(plan?.value!=null&&plan.value>=85){
    support.push({
      title:'Hatırlatmayı azaltın',
      detail:'Plan uyumu yüksek. “Dersini yaptın mı?” kontrolü yerine “Bugünkü planın nasıl gitti?” gibi nötr bir soru yeterli.'
    });
  }else if(plan?.value!=null&&plan.value<65){
    support.push({
      title:'Başlamayı kolaylaştırın',
      detail:'Ek görev vermeyin. Telefon, ortam ve başlangıç saatini düzenleyerek ilk çalışma adımını kolaylaştırın.'
    });
  }else{
    support.push({
      title:'Sorumluluğu öğrencide bırakın',
      detail:'Programın ayrıntısını yönetmek yerine çalışma saatini hatırlatıp uygulama sorumluluğunu öğrencide tutun.'
    });
  }
  if(continuity?.value!=null&&continuity.value<60)support.push({
    title:'Sabit bir başlangıç rutini destekleyin',
    detail:'Her gün farklı baskılar kurmak yerine mümkün olduğunca benzer çalışma başlangıç saatleri oluşturun.'
  });
  if(review?.value!=null&&review.value<60)support.push({
    title:'Tekrarları sorgulamayın',
    detail:'“Kaç tekrar yaptın?” yerine öğrencinin tekrar için ayrılmış zaman bloğunu korumasına yardımcı olun.'
  });
  if(input.coachNote)support.push({
    title:'Koçun veli yönlendirmesini esas alın',
    detail:input.coachNote.length>240?input.coachNote.slice(0,237)+'…':input.coachNote
  });
  support.push({
    title:'Kıyaslama ve ceza/ödül baskısından kaçının',
    detail:'Başka öğrencilerle karşılaştırmayın; deneme veya görev sonucunu ceza ya da ödül aracına çevirmeyin.'
  });

  const keksRecommendation=
    plan?.value!=null&&plan.value<65
      ?'Bu hafta ek görev vermek yerine öğrencinin ilk çalışma adımını kolaylaştırın ve programı koçla birlikte gözden geçirin.'
    :review?.value!=null&&review.value<60
      ?'Bu hafta yeni hedef eklemek yerine öğrencinin tekrar için ayırdığı zamanı korumasına yardımcı olun.'
    :continuity?.value!=null&&continuity.value<60
      ?'Bu hafta öğrencinin her gün benzer bir saatte çalışmaya başlaması için sakin ve uygun bir ortam sağlayın.'
    :plan?.value!=null&&plan.value>=85
      ?'Bu hafta çalışma sorumluluğunu öğrencide bırakın ve sık hatırlatma yerine gösterdiği çabayı fark edin.'
    :'Bu hafta öğrencinin mevcut çalışma planını destekleyin ve koçun önerisi olmadan ek yük oluşturmayın.';

  return {
    reassurance,
    change:summarizeWeeklyChange(input.indicators),
    keksRecommendation,
    good:unique(good).slice(0,3),
    attention:unique(attention).slice(0,3),
    support:unique(support).slice(0,3),
    privacyNote:'Veli özeti ham soru cevaplarını, tek tek yanlışları, özel koç görüşmelerini veya öğrencinin kişisel notlarını paylaşmaz; yalnız destek kararına yetecek davranışsal ve akademik sinyalleri özetler.'
  };
}
