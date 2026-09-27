export function numericRecord(value:unknown){
  if(!value||typeof value!=='object'||Array.isArray(value))return {} as Record<string,number>;
  const out:Record<string,number>={};
  for(const [key,raw] of Object.entries(value as Record<string,unknown>)){
    const n=Number(raw);
    if(Number.isFinite(n))out[key]=n;
  }
  return out;
}

export function targetNetFromBenchmarks(benchmarkNets:unknown,officialNets:unknown){
  const preferred=numericRecord(benchmarkNets);
  const fallback=numericRecord(officialNets);
  const source=Object.keys(preferred).length?preferred:fallback;
  const explicitKeys=['TOPLAM','TOTAL','GENEL','NET','HEDEF_NET'];
  for(const key of explicitKeys){
    const match=Object.entries(source).find(([k])=>k.toLocaleUpperCase('tr-TR')===key);
    if(match)return {total:Number(match[1].toFixed(2)),bySubject:source};
  }
  const values=Object.values(source).filter(x=>x>=0&&x<=200);
  if(!values.length)return {total:null,bySubject:source};
  return {total:Number(values.reduce((a,b)=>a+b,0).toFixed(2)),bySubject:source};
}

export function rankGoalContributionAreas(rows:{
  subject:string;status:string;score:number;accuracy:number|null;
}[]){
  const map=new Map<string,{subject:string;openTopics:number;riskyTopics:number;sumScore:number;accuracy:number[];weight:number}>();
  for(const row of rows){
    if(row.status==='DURABLE')continue;
    const x=map.get(row.subject)||{subject:row.subject,openTopics:0,riskyTopics:0,sumScore:0,accuracy:[],weight:0};
    x.openTopics++;
    if(row.status==='RISKY')x.riskyTopics++;
    x.sumScore+=row.score;
    if(row.accuracy!=null)x.accuracy.push(row.accuracy);
    x.weight+=row.status==='RISKY'?4:row.status==='LEARNING'?3:row.status==='REINFORCING'?2:1;
    map.set(row.subject,x);
  }
  return [...map.values()].map(x=>{
    const avgMastery=x.openTopics?Math.round(x.sumScore/x.openTopics):0;
    const avgAccuracy=x.accuracy.length?Math.round(x.accuracy.reduce((a,b)=>a+b,0)/x.accuracy.length):null;
    const accuracyNeed=avgAccuracy==null?0:Math.max(0,100-avgAccuracy)/10;
    return {
      subject:x.subject,
      openTopics:x.openTopics,
      riskyTopics:x.riskyTopics,
      avgMastery,
      avgAccuracy,
      priorityScore:Number((x.weight+accuracyNeed).toFixed(1)),
      reason:x.riskyTopics
        ?x.riskyTopics+' riskli konu · '+x.openTopics+' açık konu'
        :x.openTopics+' açık konu'+(avgAccuracy!=null?' · doğruluk %'+avgAccuracy:'')
    };
  }).sort((a,b)=>b.priorityScore-a.priorityScore||b.openTopics-a.openTopics).slice(0,3);
}
