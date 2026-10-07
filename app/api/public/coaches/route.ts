import {NextRequest,NextResponse} from 'next/server';
import {buildPartnerCoachDirectory} from '@/lib/partnerCoachNetwork';

export async function GET(req:NextRequest){
  const gradeLevel=req.nextUrl.searchParams.get('gradeLevel');
  const academicTrack=req.nextUrl.searchParams.get('academicTrack');
  const coaches=await buildPartnerCoachDirectory({gradeLevel,academicTrack});
  return NextResponse.json({
    ok:true,
    coaches:coaches.map(coach=>({
      id:coach.id,
      name:coach.name,
      displayTitle:coach.displayTitle,
      bio:coach.bio,
      specialties:coach.specialties,
      supportedEducationLevels:coach.supportedEducationLevels,
      studentCount:coach.studentCount,
      maxActiveStudents:coach.maxActiveStudents,
      availableSlots:coach.availableSlots,
      responseHours:coach.responseHours,
      responseTargetHours:coach.responseTargetHours,
      sessionCompletionRate:coach.sessionCompletionRate,
      profileCompleteness:coach.profileCompleteness,
      fitReasons:coach.fitReasons
    }))
  });
}
