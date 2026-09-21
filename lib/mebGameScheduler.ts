import { db } from '@/lib/db';
import { generateMicroGame } from '@/lib/microGameGenerator';

const DEFAULT_KINDS=['MEB_TEXTBOOK','MEB_TYMM','MEB_OFFICIAL'];

function sourceKinds(){
  return (process.env.AUTO_GAME_SOURCE_KINDS||DEFAULT_KINDS.join(','))
    .split(',').map(x=>x.trim()).filter(Boolean);
}

function dailyLimit(){
  const n=Number(process.env.AUTO_GAME_DAILY_LIMIT||8);
  return Number.isFinite(n)?Math.min(30,Math.max(1,Math.floor(n))):8;
}

export async function publishMebMicroGames(input?:{limit?:number;createdByUserId?:string|null}){
  const kinds=sourceKinds();
  const limit=Math.min(30,Math.max(1,input?.limit||dailyLimit()));

  const groups=await db.questionBankItem.groupBy({
    by:['examType','subject','topic'],
    where:{
      active:true,
      reviewStatus:'APPROVED',
      sourceKind:{in:kinds},
      officialSourceUrl:{not:null}
    },
    _count:{_all:true}
  });

  const ready=groups
    .filter(x=>x._count._all>=2)
    .sort((a,b)=>b._count._all-a._count._all||a.subject.localeCompare(b.subject,'tr'));

  if(!ready.length)return {ok:true,published:[],skipped:0,message:'Yayınlanabilir MEB kaynaklı onaylı konu bulunamadı.'};

  const dayIndex=Math.floor(Date.now()/(24*60*60*1000));
  const start=dayIndex%ready.length;
  const rotated=[...ready.slice(start),...ready.slice(0,start)];

  const published:any[]=[];
  let skipped=0;
  for(const group of rotated){
    if(published.length>=limit)break;
    try{
      const game=await generateMicroGame({
        createdByUserId:input?.createdByUserId||null,
        examType:group.examType,
        subject:group.subject,
        topic:group.topic,
        sourcePolicy:'MEB_ONLY'
      });
      published.push({id:game.id,examType:game.examType,subject:game.subject,topic:game.topic,gameType:game.gameType,title:game.title});
    }catch{
      skipped++;
    }
  }

  const retentionDays=Number(process.env.AUTO_GAME_RETENTION_DAYS||45);
  if(Number.isFinite(retentionDays)&&retentionDays>0){
    const before=new Date(Date.now()-retentionDays*24*60*60*1000);
    await db.gameContent.updateMany({
      where:{
        active:true,
        studentId:null,
        createdAt:{lt:before},
        generationSource:{in:['AUTO_AI_MEB','AUTO_MEB_QBANK']}
      },
      data:{active:false}
    });
  }

  return {ok:true,published,skipped,availableTopics:ready.length};
}
