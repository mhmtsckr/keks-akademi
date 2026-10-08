import {describe,expect,it} from 'vitest';
import {calculateCrmLifecycle,summarizeCrmLifecycle} from './crmLifecycle';

const D=86400000;
const now=new Date('2026-10-09T12:00:00.000Z');
const age=(days:number)=>new Date(now.getTime()-days*D);
const purchase=(daysAgo:number,lengthDays:number,status='ACTIVE',oid='order-1')=>({
  merchantOid:oid,startedAt:age(daysAgo),endsAt:age(daysAgo-lengthDays),status
});

describe('CRM lifecycle',()=>{
  it('manuel kazanıldı kaydını doğrulanmış satın alma diye saymaz',()=>{
    const snapshot=calculateCrmLifecycle({leadStatus:'WON',linked:true,purchases:[],now});
    expect(snapshot.stage).toBe('UNVERIFIED_SALE');
    expect(snapshot.firstPurchaseAt).toBeNull();
  });
  it('kaybedilen satış ile abonelik ayrılmasını ayırır',()=>{
    const snapshot=calculateCrmLifecycle({leadStatus:'LOST',linked:false,purchases:[],now});
    expect(snapshot.stage).toBe('LOST_SALE');
    expect(snapshot.stage).not.toBe('CHURNED');
  });
  it('30 gün dolmamış müşteri oranların paydasına girmez',()=>{
    const snapshot=calculateCrmLifecycle({leadStatus:'WON',linked:true,purchases:[purchase(10,60)],now});
    expect(snapshot.stage).toBe('FIRST_30_DAYS');
    expect(snapshot.retainedAtDay30).toBeNull();
    expect(summarizeCrmLifecycle([snapshot]).retainedDay30Pct).toBeNull();
  });
  it('30. gün gözlenen aktiviteyi, plan uygulamasını ve tamamlanmış görüşmeyi ölçer',()=>{
    const p=purchase(40,90);
    const taskDays=[age(15),age(14),age(13)];
    const snapshot=calculateCrmLifecycle({
      leadStatus:'WON',linked:true,purchases:[p],now,
      tasks:taskDays.map((t,i)=>({
        taskDate:t,status:i===0?'COMPLETED':'ACTIVE',
        updatedAt:t,submittedAt:i===0?t:null
      })),
      practices:[{date:age(12)}],
      sessions:[{
        startsAt:age(25),endsAt:age(24),
        status:'COMPLETED',completedAt:age(24),updatedAt:age(24)
      }]
    });
    expect(snapshot.day30Matured).toBe(true);
    expect(snapshot.subscriptionAtDay30).toBe(true);
    expect(snapshot.activityAtDay30).toBe(true);
    expect(snapshot.retainedAtDay30).toBe(true);
    expect(snapshot.programCompletionPct).toBe(33);
    expect(snapshot.sessionAttendancePct).toBe(100);
    expect(summarizeCrmLifecycle([snapshot]).retainedDay30Pct).toBe(100);
  });
  it('hiç görev veya görüşme atanmadıysa başarı yüzdesi uydurmaz',()=>{
    const snapshot=calculateCrmLifecycle({
      leadStatus:'WON',linked:true,purchases:[purchase(40,90)],now
    });
    expect(snapshot.programCompletionPct).toBeNull();
    expect(snapshot.sessionAttendancePct).toBeNull();
    expect(summarizeCrmLifecycle([snapshot]).programAppliedPct).toBeNull();
  });
  it('yenileme için birden fazla doğrulanmış abonelik alışını gerekli kılar',()=>{
    const snapshot=calculateCrmLifecycle({
      leadStatus:'WON',linked:true,purchases:[
        purchase(75,30,'EXPIRED','oid1'),
        purchase(45,90,'ACTIVE','oid2')
      ],now
    });
    expect(snapshot.stage).toBe('RENEWED');
    expect(snapshot.renewed).toBe(true);
  });
  it('bitişten 7 gün geçmiş ve aktif olmayan müşteriyi ayrılmış sayar',()=>{
    const snapshot=calculateCrmLifecycle({
      leadStatus:'WON',linked:true,purchases:[purchase(65,30,'EXPIRED')],now
    });
    expect(snapshot.stage).toBe('CHURNED');
  });
  it('bitişi yaklaşan, henüz yenilemeyen müşteriyi takip için işaretler',()=>{
    const snapshot=calculateCrmLifecycle({
      leadStatus:'WON',linked:true,purchases:[purchase(40,50)],now
    });
    expect(snapshot.stage).toBe('RENEWAL_DUE');
    expect(snapshot.renewed).toBe(false);
  });
});
