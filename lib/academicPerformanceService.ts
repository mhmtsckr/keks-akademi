import {db} from '@/lib/db';
import {buildAcademicPerformanceCenter} from '@/lib/academicPerformanceCenter';

export async function readAcademicPerformance(studentId:string,now=new Date()){
  const cutoff=new Date(now.getTime()-36*86400000);
  const [practice,examRecords]=await Promise.all([
    db.practiceLog.findMany({
      where:{studentId,date:{gte:cutoff,lte:now}},
      orderBy:[{date:'desc'},{id:'desc'}],take:800,
      select:{examType:true,subject:true,topic:true,date:true,
        total:true,correct:true,wrong:true,blank:true,net:true,
        errorReason:true,taskSubmissionId:true}
    }),
    db.examAnalyticsRecord.findMany({
      where:{studentId,examDate:{gte:cutoff,lte:now}},
      orderBy:[{examDate:'desc'},{id:'desc'}],take:500,
      select:{examType:true,subject:true,topic:true,questionType:true,examDate:true,
        correct:true,wrong:true,blank:true,avgSeconds:true}
    })
  ]);
  return {
    ...buildAcademicPerformanceCenter(practice,examRecords,now),
    limited:practice.length===800||examRecords.length===500,
    limitationNote:practice.length===800||examRecords.length===500
      ?'Son 35 güne ait kayıt üst sınırına ulaşıldı. Bazı veriler bu rapora girmemiş olabilir; ders önceliklerini koçla doğrulayın.'
      :null
  };
}
