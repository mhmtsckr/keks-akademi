import { recordServerError } from '@/lib/errorMonitoring';

type InstrumentationRequest={
  path:string;
  method:string;
  headers:Record<string,string>;
};

type InstrumentationContext={routeType:string};

export async function onRequestError(
  error:unknown,
  request:InstrumentationRequest,
  context:InstrumentationContext
){
  if(context.routeType!=='route'&&!request.path.startsWith('/api/'))return;
  if(!request.path.startsWith('/api/'))return;
  const incoming=request.headers?.['x-request-id'];
  const requestId=incoming&&/^[A-Za-z0-9._:-]{8,100}$/.test(incoming)?incoming:crypto.randomUUID();
  await recordServerError({
    endpoint:request.path,
    method:request.method||'UNKNOWN',
    requestId,
    error
  });
}
