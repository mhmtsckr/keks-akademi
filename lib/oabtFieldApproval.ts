import { AGS_OABT_FIELDS } from '@/lib/agsExamOptions';

export type OabtFieldApprovalStatus='NONE'|'PENDING'|'APPROVED'|'REJECTED';

export type OabtFieldApprovalState={
  status:OabtFieldApprovalStatus;
  requestedField:string|null;
  requestedAt:string|null;
  approvedField:string|null;
  approvedAt:string|null;
  approvedByUserId:string|null;
  rejectedAt:string|null;
  rejectedByUserId:string|null;
  rejectionNote:string|null;
};

function obj(v:unknown){
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
}

export function getOabtFieldApproval(profile:unknown):OabtFieldApprovalState{
  const root=obj(profile);
  const raw=obj(root.oabtFieldApproval);
  const status=['PENDING','APPROVED','REJECTED'].includes(String(raw.status))
    ? String(raw.status) as OabtFieldApprovalStatus
    : 'NONE';
  return {
    status,
    requestedField:typeof raw.requestedField==='string'?raw.requestedField:null,
    requestedAt:typeof raw.requestedAt==='string'?raw.requestedAt:null,
    approvedField:typeof raw.approvedField==='string'?raw.approvedField:null,
    approvedAt:typeof raw.approvedAt==='string'?raw.approvedAt:null,
    approvedByUserId:typeof raw.approvedByUserId==='string'?raw.approvedByUserId:null,
    rejectedAt:typeof raw.rejectedAt==='string'?raw.rejectedAt:null,
    rejectedByUserId:typeof raw.rejectedByUserId==='string'?raw.rejectedByUserId:null,
    rejectionNote:typeof raw.rejectionNote==='string'?raw.rejectionNote:null
  };
}

export function withOabtFieldApproval(profile:unknown,state:Partial<OabtFieldApprovalState>){
  const root=obj(profile);
  const current=getOabtFieldApproval(profile);
  return {
    ...root,
    oabtFieldApproval:{
      ...current,
      ...state
    }
  };
}

export function isValidOabtField(field:string){
  return AGS_OABT_FIELDS.includes(field as any);
}


export function getEffectiveOabtField(academicTrack:string|null|undefined,profile:unknown){
  const approval=getOabtFieldApproval(profile);
  const candidates=[academicTrack,approval.approvedField,approval.requestedField];
  for(const value of candidates){
    if(typeof value==='string'&&isValidOabtField(value))return value;
  }
  return null;
}

export function withAutomaticOabtField(profile:unknown,field:string,at=new Date().toISOString()){
  return withOabtFieldApproval(profile,{
    status:'APPROVED',
    requestedField:field,
    requestedAt:getOabtFieldApproval(profile).requestedAt||at,
    approvedField:field,
    approvedAt:at,
    approvedByUserId:null,
    rejectedAt:null,
    rejectedByUserId:null,
    rejectionNote:null
  });
}
