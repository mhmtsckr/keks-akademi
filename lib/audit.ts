import { db } from './db';

export async function writeAudit(input:{
  actorUserId?:string|null;
  action:string;
  entityType:string;
  entityId?:string|null;
  summary:string;
  metadata?:unknown;
}){
  try{
    await db.auditLog.create({data:{
      actorUserId:input.actorUserId||null,
      action:input.action,
      entityType:input.entityType,
      entityId:input.entityId||null,
      summary:input.summary,
      metadata:input.metadata as any
    }});
  }catch(e){
    console.error('AUDIT_LOG_FAILED',e);
  }
}
