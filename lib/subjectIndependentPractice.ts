import {canonicalExamType,type LearningCurriculumContext} from '@/lib/curriculumPolicy2026';
import {selectRemediationQuestions,type RemediationQuestion} from '@/lib/wrongQuestionRemediation';

export const SUBJECT_PRACTICE_DAILY_LIMIT=10;
export const SUBJECT_PRACTICE_HISTORY_LIMIT=1000;
export type PracticeSource=Pick<RemediationQuestion,'id'|'examType'|'subject'|'topic'>;
export type PracticeCandidate=RemediationQuestion&{
 options:unknown;correctAnswer:string;createdAt?:Date
};
const obj=(v:unknown):Record<string,unknown>=>
 v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
function normalized(v:unknown){return typeof v==='string'?v.toLocaleUpperCase('tr-TR').trim():'';}
function examToken(v:string){return canonicalExamType(v)||normalized(v);}
function includedGrades(v:unknown,g:number){
 return Array.isArray(v)&&v.some(x=>typeof x==='number'&&x===g);
}
/** An approved question must be usable for the learner's actual grade/exam.
 * No metadata? For a school curriculum that is NOT sufficient to claim an age-appropriate item.
 * For an ÖSYM exam, the exact exam code on approved question records is the verified routing key. */
export function eligibleSubjectPracticeQuestion(q:PracticeCandidate,origin:PracticeSource,
 ctx:LearningCurriculumContext):boolean{
 if(!q.active||q.reviewStatus!=='APPROVED'||q.sourceKind.startsWith('STUDENT_WRONG:'))return false;
 if(q.id===origin.id||q.examType!==origin.examType)return false;
 if(ctx.framework==='UNRESOLVED'||!q.correctAnswer.trim())return false;
 const m=obj(q.options);
 const grade=typeof m.educationGrade==='number'?m.educationGrade:
             typeof m.grade==='number'?m.grade:null;
 const declaredGrades=m.targetGrades;
 const framework=normalized(m.curriculumFramework);
 const finalYearExam=ctx.grade===12&&Boolean(canonicalExamType(origin.examType));
 if(ctx.grade!==null&&!finalYearExam){
  if(grade!==ctx.grade&&!includedGrades(declaredGrades,ctx.grade))return false;
  if(framework&&framework!==ctx.framework)return false;
 }else if(ctx.framework==='OSYM'||finalYearExam){
  // No K-12-only item can be silently substituted into a candidate exam.
  if(grade!==null&&(ctx.grade===null||grade!==ctx.grade))return false;
  if(Array.isArray(declaredGrades)&&declaredGrades.length>0&&
     (ctx.grade===null||!includedGrades(declaredGrades,ctx.grade)))return false;
  if(framework&&framework!=='OSYM'&&!(finalYearExam&&framework===ctx.framework))return false;
  if(ctx.examType&&examToken(q.examType)!==examToken(origin.examType))return false;
  if(Array.isArray(m.targetExams)&&m.targetExams.length>0&&
     !m.targetExams.some(x=>typeof x==='string'&&examToken(x)===examToken(origin.examType)))return false;
 }else return false;
 return true;
}
export function chooseFreshSubjectPractice(
 origin:PracticeSource,
 candidates:PracticeCandidate[],
 seenQuestionIds:ReadonlySet<string>,
 ctx:LearningCurriculumContext,
 limit=2
){
 const safe=candidates.filter(q=>
  !seenQuestionIds.has(q.id)&&eligibleSubjectPracticeQuestion(q,origin,ctx)
 );
 return selectRemediationQuestions(origin,safe,limit);
}
