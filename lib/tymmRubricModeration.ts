/**
 * Secondary, independent calibration of TYMM rubrics. This is an internal
 * quality signal, NOT a substitute for subject-teacher review or MEB approval.
 */
import {type RubricSnapshot} from './tymmDelayedTransfer';

export type ModerationDecision='AGREEMENT'|'MINOR_DIFFERENCE'|'ESCALATE';
export function compareIndependentRubrics(primary:RubricSnapshot,secondary:RubricSnapshot){
 const valid=(x:RubricSnapshot)=>{
  if(x.max!==8||!Number.isInteger(x.total)||x.total<0||x.total>8)return false;
  if(x.criterionScores.length!==4||new Set(x.criterionScores.map(c=>c.id)).size!==4)return false;
  return x.criterionScores.every(c=>typeof c.id==='string'&&Number.isInteger(c.score)&&c.score>=0&&c.score<=2)
   &&x.criterionScores.reduce((n,c)=>n+c.score,0)===x.total;
 };
 if(!valid(primary)||!valid(secondary))throw new Error('Dört ölçütlü puanlama geçersiz.');
 const original=new Map(primary.criterionScores.map(c=>[c.id,c.score]));
 if(secondary.criterionScores.some(c=>!original.has(c.id)))throw new Error('Ölçütler farklı olduğundan karşılaştırma yapılamaz.');
 const differences=secondary.criterionScores.map(c=>({
  id:c.id,first:original.get(c.id)!,second:c.score,delta:c.score-original.get(c.id)!
 }));
 const absoluteTotalGap=Math.abs(primary.total-secondary.total);
 const criterionExactMatches=differences.filter(c=>c.delta===0).length;
 const highestCriterionGap=Math.max(...differences.map(c=>Math.abs(c.delta)));
 const decision:ModerationDecision=
  absoluteTotalGap>=2||highestCriterionGap>=2?'ESCALATE':
  criterionExactMatches===4?'AGREEMENT':'MINOR_DIFFERENCE';
 return {
  firstTotal:primary.total,secondTotal:secondary.total,max:8,
  absoluteTotalGap,criterionExactMatches,highestCriterionGap,
  differences,decision,
  needsAcademicFollowUp:decision==='ESCALATE',
  policy:'İki insanın dört ölçütlü puan karşılaştırması. İstatistiksel değerlendirici güvenirliği veya bağımsız branş onayı kanıtı değildir.',
  studentMasteryUnchanged:true,reviewScheduleUnchanged:true
 };
}
export function validateModeratorEvidence(
 ids:readonly string[],notes:Readonly<Record<string,string>>
):Record<string,string>{
 if(ids.length!==4||new Set(ids).size!==4||Object.keys(notes).length!==4||
    Object.keys(notes).some(k=>!ids.includes(k)))throw new Error('Dört ölçüt için ayrı kanıt gerekli.');
 const result:Record<string,string>={};
 for(const id of ids){
  const n=notes[id];
  if(typeof n!=='string'||n.trim().length<20||n.trim().length>500)
   throw new Error('Her ölçüt için 20–500 karakter somut gerekçe yazılmalı.');
  result[id]=n.trim();
 }
 return result;
}
