import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { syncOfficialTarget } from '@/lib/officialTargetSync';

function firstNumber(html:string, patterns:RegExp[]){
  for(const re of patterns){const m=html.match(re);if(m){const n=Number(m[1].replace(/\./g,'').replace(',','.'));if(Number.isFinite(n))return n}}
  return null;
}

export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile) return NextResponse.json({error:'Koç profili yok.'},{status:400});
 const {id}=await params;
 const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id}});
 if(!student) return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
 const target=await db.studentTarget.findFirst({where:{studentId:id,active:true},orderBy:{createdAt:'desc'}});
 if(!target) return NextResponse.json({error:'Aktif hedef yok.'},{status:400});

 if(target.examLevel==='KPSS'||target.examLevel==='AGS_OBAT'){
   try{
     const updated=await syncOfficialTarget(target.id);
     const message=updated.syncStatus==='SYNCED'
       ? 'Resmî ÖSYM/MEB hedef verileri güncellendi.'
       : 'Resmî kaynak kontrol edildi; hedef için kesin eşleşme doğrulama bekliyor.';
     return NextResponse.json({ok:true,target:updated,message});
   }catch{
     const updated=await db.studentTarget.update({where:{id:target.id},data:{syncStatus:'SYNC_ERROR',syncedAt:new Date()}});
     return NextResponse.json({ok:true,target:updated,message:'Resmî kaynak şu anda otomatik okunamadı. Kayıt korundu; yeniden senkronlanabilir.'});
   }
 }

 let url=target.sourceUrl||'';
 if(!url && target.source==='YOKATLAS' && target.programCode) url='https://yokatlas.yok.gov.tr/lisans.php?y='+encodeURIComponent(target.programCode);
 if(!url && target.source==='MEB') url='https://rotamaarif.meb.gov.tr/Home/DetayliArama?kademe=2';
 if(!url) return NextResponse.json({error:'Resmî kaynak bağlantısı veya program kodu gerekli.'},{status:400});

 try{
   const res=await fetch(url,{headers:{'user-agent':'KEKS-Akademi/1.0'},cache:'no-store'});
   if(!res.ok) throw new Error('HTTP '+res.status);
   const html=await res.text();
   const score=firstNumber(html,[/Taban\s*Puan[^0-9]{0,120}([0-9]{2,3}[\.,][0-9]+)/i,/taban\s*puanı[^0-9]{0,120}([0-9]{2,3}[\.,][0-9]+)/i]);
   const ranking=firstNumber(html,[/Başarı\s*Sırası[^0-9]{0,120}([0-9\.]{2,})/i]);
   const percentile=firstNumber(html,[/Yüzdelik[^0-9]{0,120}([0-9]{1,2}[\.,][0-9]+)/i]);
   const found=score!=null||ranking!=null||percentile!=null;
   const updated=await db.studentTarget.update({where:{id:target.id},data:{
     sourceUrl:url,
     score:score??target.score,
     ranking:ranking!=null?Math.trunc(ranking):target.ranking,
     percentile:percentile??target.percentile,
     syncedAt:new Date(),
     syncStatus:found?'SYNCED':'NEEDS_VERIFICATION',
     sourceSnapshot:{url,fetchedAt:new Date().toISOString(),found:{score,ranking,percentile}}
   }});
   return NextResponse.json({ok:true,target:updated,message:found?'Resmî kaynaktan bulunan değerler güncellendi.':'Kaynak sayfa dinamik veri kullanıyor; bağlantı doğrulandı ancak sayısal değerler otomatik okunamadı. Mevcut değerler korundu ve doğrulama işareti kondu.'});
 }catch(e:any){
   const updated=await db.studentTarget.update({where:{id:target.id},data:{syncStatus:'SYNC_ERROR',syncedAt:new Date()}});
   return NextResponse.json({ok:true,target:updated,message:'Resmî kaynak şu anda otomatik okunamadı. Kayıt korundu; daha sonra yeniden senkronlanabilir.'});
 }
}
