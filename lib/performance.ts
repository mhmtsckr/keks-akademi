export function calcNet(correct:number, wrong:number){ return Number((correct - wrong/4).toFixed(2)); }

export function summarizeGap(input:{
  examType:string;
  targetScore?:number|null;
  targetRanking?:number|null;
  targetPercentile?:number|null;
  targetNets?:Record<string,number>|null;
  examScore?:number|null;
  examRanking?:number|null;
  examPercentile?:number|null;
  subjectNets?:Record<string,number>|null;
}) {
  const lines:string[]=[];
  let status='Hedef verisi eksik';
  if(input.examType==='LGS'){
    if(input.targetScore!=null && input.examScore!=null){
      const d=Number((input.targetScore-input.examScore).toFixed(2));
      lines.push(d>0 ? `Puan hedefinin ${d} puan gerisinde.` : `Puan hedefinin ${Math.abs(d)} puan üzerinde.`);
      status=d>0?'Hedefin gerisinde':'Hedefe ulaştı / üzerinde';
    }
    if(input.targetPercentile!=null && input.examPercentile!=null){
      const d=Number((input.examPercentile-input.targetPercentile).toFixed(2));
      lines.push(d>0 ? `Yüzdelik dilimde hedefe göre ${d} puan daha yüksek (iyileşme gerekli).` : `Yüzdelik dilim hedef seviyesinde veya daha iyi.`);
    }
  } else {
    if(input.targetScore!=null && input.examScore!=null){
      const d=Number((input.targetScore-input.examScore).toFixed(2));
      lines.push(d>0 ? `Puan hedefinin ${d} puan gerisinde.` : `Puan hedefinin ${Math.abs(d)} puan üzerinde.`);
      status=d>0?'Hedefin gerisinde':'Hedefe ulaştı / üzerinde';
    }
    if(input.targetRanking!=null && input.examRanking!=null){
      const d=input.examRanking-input.targetRanking;
      lines.push(d>0 ? `Başarı sırası hedefinden yaklaşık ${d.toLocaleString('tr-TR')} kişi geride.` : `Başarı sırası hedef seviyesinde veya daha iyi.`);
    }
    if(input.targetNets && input.subjectNets){
      for(const [subject,target] of Object.entries(input.targetNets)){
        const current=Number(input.subjectNets[subject]??0);
        const diff=Number((target-current).toFixed(2));
        if(diff>0) lines.push(`${subject}: hedef nete ${diff} net kaldı.`);
      }
    }
  }
  return {status, text:lines.join(' ') || 'Karşılaştırma için yeterli veri yok.'};
}
