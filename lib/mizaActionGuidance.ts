export type GuidanceConfidence='LIMITED'|'SUPPORTED'|'MULTIPLE_SIGNALS';
export type MizaLearningGuidance={
  confidence:GuidanceConfidence;
  nextStep:string;
  evidence:string[];
  rationale:string;
};

export type MizaGuidanceTask={
  source:string;
  metricType:string;
  targetValue:number;
  masteryStatus:string|null;
  masteryRiskReasons:string[];
  forgettingRiskScore:number|null;
  primaryErrorReasonLabel:string|null;
  avgSecondsPerQuestion:number|null;
  targetSecondsPerQuestion:number|null;
};

/** Recommendations never change a coach task or claim that self-report proves mastery. */
export function mizaLearningGuidance(task:MizaGuidanceTask):MizaLearningGuidance{
  const evidence:string[]=[];
  if(task.masteryStatus==='RISKY'){
    evidence.push('Konu hâkimiyeti riskli olarak işaretlendi'+(task.masteryRiskReasons[0]?': '+task.masteryRiskReasons[0]:'.'));
  }
  if(task.forgettingRiskScore!=null&&Number.isFinite(task.forgettingRiskScore)&&task.forgettingRiskScore>=40){
    evidence.push('Tekrar verilerinden hesaplanan unutma riski '+task.forgettingRiskScore+'/100.');
  }
  if(task.primaryErrorReasonLabel){
    evidence.push('Son hata kaydında öne çıkan neden: '+task.primaryErrorReasonLabel+'.');
  }
  const slow=task.avgSecondsPerQuestion!=null&&task.targetSecondsPerQuestion!=null
    &&task.targetSecondsPerQuestion>0
    &&task.avgSecondsPerQuestion>task.targetSecondsPerQuestion*1.25;
  if(slow){
    evidence.push('Kaydedilen ortalama soru süresi '+Math.round(task.avgSecondsPerQuestion!)+
      ' sn; hedef referansı '+Math.round(task.targetSecondsPerQuestion!)+' sn.');
  }

  const confidence:GuidanceConfidence=evidence.length>=2?'MULTIPLE_SIGNALS'
    :evidence.length===1?'SUPPORTED':'LIMITED';

  let nextStep:string;
  if(task.source==='REVIEW_BATCH'){
    nextStep='Cevaba bakmadan hatırla, soruyu çöz, sonra geri bildirimle yanlış nedenini kontrol et.';
  }else if(task.source==='ACTION'&&task.metricType!=='QUESTIONS'){
    nextStep='Koçun tanımladığı çalışmayı uygula; gerçekleşen miktarı kaydet ve öğrenci onayını ver.';
  }else if(task.masteryStatus==='RISKY'||task.forgettingRiskScore!=null&&task.forgettingRiskScore>=40){
    nextStep='Önce 3 dakika kaynaksız aktif hatırlama yap; ardından 5 yeni soruyla kavramı kontrol et.';
  }else if(slow){
    nextStep='İlk 5 soruda süreyi ve soru kökünü ayrı izle; sonraki sette hız ve doğruluğu birlikte karşılaştır.';
  }else if(task.primaryErrorReasonLabel){
    nextStep='Yanlış nedenini bir cümleyle yaz; aynı kazanımdan 5 farklı soru çözerek yeniden kontrol et.';
  }else if(task.source==='ACTION'){
    nextStep='Koç görevini sırayla uygula; toplam, yanlış ve boş sayısını girip sonucu onayla.';
  }else if(task.source==='PRACTICE'){
    nextStep='Kısa bir yeni soru seti çöz; doğru, yanlış ve boş sayılarını kaydederek ölçüm kanıtı oluştur.';
  }else if(task.source==='TOPIC'){
    nextStep='Konuyu kendi cümlelerinle açıklamayı dene; ardından 3 kaynaksız kontrol sorusuyla doğrula.';
  }else{
    nextStep='Önerilen çalışmayı uygula ve gerçek sonucunla geri bildirim ver.';
  }

  const rationale=evidence.length
    ?'Bu mikro adım, aşağıdaki mevcut öğrenme sinyallerine göre önerildi. Tek başına kesin öğrenme tanısı değildir.'
    :task.source==='ACTION'
      ?'Öncelik koçun atadığı görevden geliyor. Konuya özgü güvenilir performans kanıtı henüz sınırlı.'
      :'Konuya özgü yeterli ölçüm henüz yok. Önce küçük ve doğrulanabilir bir çalışma kanıtı toplanıyor.';
  return {confidence,nextStep,evidence:evidence.slice(0,4),rationale};
}
