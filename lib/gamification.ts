import { db } from './db';

export async function awardXp(studentId:string,source:string,sourceId:string|undefined,xp:number){
  if(xp<=0)return {xp:0,total:0,level:1};
  if(sourceId){
    const existing=await db.xpLedger.findFirst({where:{studentId,source,sourceId}});
    if(existing){
      const g=await db.studentGamification.findUnique({where:{studentId}});
      return {xp:0,total:g?.xp||0,level:g?.level||1};
    }
  }
  await db.xpLedger.create({data:{studentId,source,sourceId:sourceId||null,xp}});
  const g=await db.studentGamification.upsert({
    where:{studentId},
    create:{studentId,xp,level:Math.max(1,Math.floor(xp/500)+1),lastPlayedAt:new Date()},
    update:{xp:{increment:xp},lastPlayedAt:new Date()}
  });
  const level=Math.max(1,Math.floor(g.xp/500)+1);
  if(level!==g.level)await db.studentGamification.update({where:{studentId},data:{level}});
  if(g.xp>=500)await db.badgeAward.upsert({where:{studentId_badgeKey:{studentId,badgeKey:'XP500'}},create:{studentId,badgeKey:'XP500',title:'500 XP',description:'KEKS çalışmalarında 500 XP kazanıldı.'},update:{}});
  return {xp,total:g.xp,level};
}
