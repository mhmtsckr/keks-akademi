import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors,HttpError} from '@/lib/apiGuard';
import {loadTopicTransferEvidence} from '@/lib/topicTransferService';

async function GET__handler(){
 const user=await requireRole(['STUDENT']);
 if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
 const evidence=await loadTopicTransferEvidence(user.student.id);
 return NextResponse.json({ok:true,...evidence});
}
export const GET=withApiErrors(GET__handler);
