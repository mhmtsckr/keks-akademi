import { db } from '@/lib/db';

export const KEKS_CODE_GENERATION='R2';
const HINT_PREFIX=KEKS_CODE_GENERATION+'-';

export function keksCodeHashInput(raw:string){
  return KEKS_CODE_GENERATION+':'+raw.trim();
}

export function keksCodeHint(raw:string){
  return HINT_PREFIX+raw.trim().slice(-4);
}

export function isCurrentKeksCodeHint(hint?:string|null){
  return Boolean(hint&&hint.startsWith(HINT_PREFIX));
}

export async function findUsableReadyTestAccess(studentId:string){
  const accesses=await db.testAccess.findMany({
    where:{studentId,status:'READY'},
    orderBy:{createdAt:'asc'}
  });
  if(!accesses.length)return null;

  const codeIds=accesses
    .filter(a=>a.source==='ACADEMY_CODE'&&a.academyCodeId)
    .map(a=>a.academyCodeId!) as string[];

  const currentCodes=codeIds.length
    ? await db.academyCode.findMany({
        where:{id:{in:codeIds},codeHint:{startsWith:HINT_PREFIX}},
        select:{id:true}
      })
    : [];
  const currentCodeIds=new Set(currentCodes.map(c=>c.id));

  return accesses.find(a=>
    a.source!=='ACADEMY_CODE'||
    Boolean(a.academyCodeId&&currentCodeIds.has(a.academyCodeId))
  )||null;
}

export async function hasBlockingNonPaidTestAccess(
  studentId:string,
  start:Date,
  end:Date
){
  const accesses=await db.testAccess.findMany({
    where:{
      studentId,
      source:{not:'PAID'},
      createdAt:{gte:start,lt:end},
      status:{in:['READY','USED']}
    },
    orderBy:{createdAt:'desc'}
  });
  if(!accesses.length)return false;

  if(accesses.some(a=>a.source==='ADMIN_GRANT'||a.status==='USED'))return true;

  const readyCodeIds=accesses
    .filter(a=>a.source==='ACADEMY_CODE'&&a.status==='READY'&&a.academyCodeId)
    .map(a=>a.academyCodeId!) as string[];
  if(!readyCodeIds.length)return false;

  const currentCode=await db.academyCode.findFirst({
    where:{id:{in:readyCodeIds},codeHint:{startsWith:HINT_PREFIX}},
    select:{id:true}
  });
  return Boolean(currentCode);
}

export function currentKeksCodeHintPrefix(){
  return HINT_PREFIX;
}
