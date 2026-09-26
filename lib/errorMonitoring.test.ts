import {describe,expect,it} from 'vitest';
import {withApiErrors} from '@/lib/apiGuard';
import {recordServerError} from '@/lib/errorMonitoring';

describe('production API error monitoring',()=>{
  it('stores only allow-listed metadata and redacts secrets from endpoints',async()=>{
    const secret='super-secret-token-value-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    const error=new Error('password=hunter2 token='+secret);
    error.name='DatabaseError';
    (error as Error & {code?:string}).code='P2002';

    const metadata=await recordServerError({
      endpoint:'/api/auth/token/'+secret+'?password=hunter2&token='+secret,
      method:'POST',
      requestId:'request-12345678',
      error
    });

    expect(metadata.endpoint).toBe('/api/auth/token/[redacted]');
    expect(metadata.method).toBe('POST');
    expect(metadata.requestId).toBe('request-12345678');
    expect(metadata.errorClass).toBe('DatabaseError');
    expect(metadata.errorCode).toBe('P2002');

    const serialized=JSON.stringify(metadata);
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain('hunter2');
    expect(serialized).not.toContain('password=');
    expect(serialized).not.toContain(error.message);
    expect(serialized).not.toContain(error.stack||'__no_stack__');
  });

  it('returns a correlation request ID on unexpected API 500 responses without exposing the exception',async()=>{
    const handler=withApiErrors(async(_req:Request):Promise<Response>=>{
      throw new Error('token=never-return-this-secret');
    });

    const response=await handler(new Request('https://keks.example/api/student/plan?token=secret',{method:'POST'}));
    const body=await response.json() as {error:string;requestId:string};

    expect(response.status).toBe(500);
    expect(body.error).toBe('Beklenmeyen bir sunucu hatası oluştu.');
    expect(body.requestId).toMatch(/^[A-Za-z0-9._:-]{8,100}$/);
    expect(response.headers.get('x-request-id')).toBe(body.requestId);
    expect(JSON.stringify(body)).not.toContain('never-return-this-secret');
  });

  it('rejects an unsafe caller-supplied request ID',async()=>{
    const metadata=await recordServerError({
      endpoint:'/api/example',
      method:'POST',
      requestId:'token=secret',
      error:new Error('boom')
    });

    expect(metadata.requestId).not.toBe('token=secret');
    expect(metadata.requestId).toMatch(/^[A-Za-z0-9._:-]{8,100}$/);
  });
});
