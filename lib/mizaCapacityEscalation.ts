import {db} from '@/lib/db';

function deferredRows(rebalance:any){
  return Array.isArray(rebalance?.deferred)?rebalance.deferred:[];
}

export async function ensureMizaCapacityCoachAlert(studentId:string,rebalance:any){
  const rows=deferredRows(rebalance);
  if(!rows.length)return null;

  const deferredUnits=rows.reduce((sum:number,row:any)=>sum+Math.max(0,Number(row?.unallocated||0)),0);
  const severity=rows.length>=2?'HIGH':'MEDIUM';
  const title='MİZA · kapasite dışı görev yükü';
  const message='Kaçırılan '+rows.length+' görev öğrencinin güvenli kapasitesi içine otomatik sığdırılamadı'
    +(deferredUnits?' ('+deferredUnits+' hedef birimi ertelendi)':'')
    +'. MİZA bu yükü günlük plana zorla eklemedi. Koçun yeniden planlama kararı gerekli.';

  const existing=await db.coachAlert.findFirst({
    where:{studentId,kind:'MIZA_CAPACITY_ESCALATION',resolved:false},
    orderBy:{createdAt:'desc'}
  });

  if(existing){
    return db.coachAlert.update({
      where:{id:existing.id},
      data:{severity,title,message}
    });
  }

  return db.coachAlert.create({
    data:{
      studentId,
      kind:'MIZA_CAPACITY_ESCALATION',
      severity,
      title,
      message
    }
  });
}
