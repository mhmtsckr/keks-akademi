import {db} from '@/lib/db';

function deferredCount(rebalance:any){
  return Array.isArray(rebalance?.deferred)?rebalance.deferred.length:0;
}

function deferredUnits(rebalance:any){
  return (Array.isArray(rebalance?.deferred)?rebalance.deferred:[])
    .reduce((n:number,x:any)=>n+Math.max(0,Number(x?.unallocated||0)),0);
}

export async function ensureMizaCapacityCoachAlert(studentId:string,rebalance:any){
  const count=deferredCount(rebalance);
  if(!count)return null;
  const units=deferredUnits(rebalance);
  const severity=count>=2?'HIGH':'MEDIUM';
  const title='MİZA · kapasite dışı görev yükü';
  const message='Kaçırılan '+count+' görev öğrencinin güvenli kapasitesi içine otomatik sığdırılamadı'
    +(units?' ('+units+' hedef birimi ertelendi)':'')
    +'. MİZA görevi zorla plana eklemedi. Koçun yeniden planlama kararı gerekli.';

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

export async function ensureMizaPlanChangeCoachAlert(studentId:string,message:string){
  const title='MİZA · öğrenci plan değişikliği talebi';
  const summary='Öğrenci MİZA üzerinden koç planında değişiklik istedi. MİZA planı değiştirmedi; koç değerlendirmesi bekleniyor.';
  const existing=await db.coachAlert.findFirst({
    where:{studentId,kind:'MIZA_PLAN_CHANGE_REQUEST',resolved:false},
    orderBy:{createdAt:'desc'}
  });
  const detail=summary+' Öğrenci mesajı: '+message.slice(0,300);
  if(existing){
    return db.coachAlert.update({
      where:{id:existing.id},
      data:{severity:'MEDIUM',title,message:detail}
    });
  }
  return db.coachAlert.create({
    data:{
      studentId,
      kind:'MIZA_PLAN_CHANGE_REQUEST',
      severity:'MEDIUM',
      title,
      message:detail
    }
  });
}
