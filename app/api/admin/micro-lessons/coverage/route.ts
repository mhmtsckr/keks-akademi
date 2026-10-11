import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors} from '@/lib/apiGuard';
import {microLessonCoverageSnapshot} from '@/lib/microLessonCoverage2026';

async function GET__handler(){
 await requireRole(['ADMIN']);
 return NextResponse.json({ok:true,coverage:microLessonCoverageSnapshot()});
}
export const GET=withApiErrors(GET__handler);
