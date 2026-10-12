export const EDITORIAL_STAGES=['SUBJECT','ASSESSMENT','SOURCE_RIGHTS'] as const;
export type EditorialStage=typeof EDITORIAL_STAGES[number];
export type EditorialReviewRecord={
  reviewerUserId:string;
  stage:string;
  decision:string;
  revision:number;
  contentHash:string;
  rightsVerified:boolean;
  createdAt:Date|string;
};
export type EditorialDraftForGate={
  revision:number;
  contentHash:string;
  status:string;
  sourceRefs:unknown;
};
export type EditorialGate={
  ready:boolean;
  missing:string[];
  approvals:Record<string,{reviewerUserId:string;createdAt:string}>;
};
/**
 * Only recorded approvals for THIS content revision are admissible.
 * Three DIFFERENT authenticated people must have signed the
 * curriculum/language, assessment and scientific source/rights stages.
 */
export function evaluateEditorialGate(
  draft:EditorialDraftForGate,
  decisions:EditorialReviewRecord[]
):EditorialGate{
  const latest=new Map<string,EditorialReviewRecord>();
  const current=decisions
    .filter(x=>x.revision===draft.revision&&x.contentHash===draft.contentHash)
    .sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
  for(const d of current)if(EDITORIAL_STAGES.some(stage=>stage===d.stage))latest.set(d.stage,d);
  const approvals:EditorialGate['approvals']={};
  const missing:string[]=[];
  for(const stage of EDITORIAL_STAGES){
    const d=latest.get(stage);
    if(!d||d.decision!=='APPROVE'){
      missing.push(stage+' onayı eksik');
    }else{
      approvals[stage]={reviewerUserId:d.reviewerUserId,createdAt:new Date(d.createdAt).toISOString()};
    }
  }
  const refs=Array.isArray(draft.sourceRefs)?draft.sourceRefs:[];
  if(refs.length===0)missing.push('Bilimsel kaynak ilişkisi eksik');
  if(latest.get('SOURCE_RIGHTS')?.rightsVerified!==true)missing.push('Telif/lisans kanıtı doğrulanmadı');
  const ids=Object.values(approvals).map(v=>v.reviewerUserId);
  if(ids.length===EDITORIAL_STAGES.length&&new Set(ids).size!==EDITORIAL_STAGES.length)
    missing.push('Üç bağımsız editör gerekli');
  if(draft.status==='PUBLISHED')missing.push('Soru daha önce yayımlandı');
  return {ready:missing.length===0,missing,approvals};
}
