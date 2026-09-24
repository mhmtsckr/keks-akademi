import { beforeEach,describe,expect,it,vi } from 'vitest';

vi.mock('@/lib/db',()=>import('@/test/helpers/db'));

import { db,resetMocks } from '@/test/helpers';
import {
  authHash,
  checkChallengeLimit,
  checkCodeSendLimit,
  checkLoginLimit,
  clientIp,
  markChallengeUsed,
  recordChallengeFailure,
  recordLoginFailure,
  recordLoginSuccess,
  reserveCodeSend
} from './authAbuse';

function req(headers:Record<string,string>={}){
  return new Request('http://localhost/test',{headers});
}

beforeEach(()=>{
  resetMocks();
  db.auditLog.findFirst.mockResolvedValue(null);
  db.auditLog.count.mockResolvedValue(0);
  db.auditLog.create.mockResolvedValue({id:'audit-1'});
});

describe('authAbuse helpers',()=>{
  it('istemci IP adresini güvenilir proxy başlıklarından çözer',()=>{
    expect(clientIp(req({'x-forwarded-for':'1.2.3.4, 5.6.7.8'}))).toBe('1.2.3.4');
    expect(clientIp(req({'x-real-ip':'2.3.4.5'}))).toBe('2.3.4.5');
    expect(clientIp(req({'cf-connecting-ip':'3.4.5.6'}))).toBe('3.4.5.6');
    expect(clientIp(req())).toBe('unknown');
  });

  it('kimlikleri düz metin yerine kararlı HMAC özetiyle temsil eder',()=>{
    const a=authHash('ornek@example.com');
    const b=authHash('ornek@example.com');
    expect(a).toBe(b);
    expect(a).not.toContain('ornek');
    expect(a).toHaveLength(40);
  });
});

describe('login rate limit',()=>{
  it('kilit yokken girişe izin verir',async()=>{
    const result=await checkLoginLimit(req({'x-forwarded-for':'1.1.1.1'}),'USER@EXAMPLE.COM');
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it('yakın tarihli hesap kilidinde retry-after üretir',async()=>{
    db.auditLog.findFirst
      .mockResolvedValueOnce({createdAt:new Date()})
      .mockResolvedValueOnce(null);
    const result=await checkLoginLimit(req(),'user@example.com');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('5 hesap ve 20 IP hatasında iki kilit kaydı oluşturur',async()=>{
    db.auditLog.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(20);
    await recordLoginFailure(req({'x-real-ip':'7.7.7.7'}),'user@example.com');
    const actions=db.auditLog.create.mock.calls.map(c=>c[0].data.action);
    expect(actions).toContain('LOGIN_FAILURE_ACCOUNT');
    expect(actions).toContain('LOGIN_FAILURE_IP');
    expect(actions).toContain('LOGIN_LOCK_ACCOUNT');
    expect(actions).toContain('LOGIN_LOCK_IP');
  });

  it('başarılı girişi anonim IP özetiyle kaydeder',async()=>{
    await recordLoginSuccess(req({'x-real-ip':'8.8.8.8'}),'user@example.com','u1');
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data:expect.objectContaining({
        actorUserId:'u1',
        action:'LOGIN_SUCCESS_ACCOUNT',
        entityType:'AuthSecurity'
      })
    });
    const metadata=db.auditLog.create.mock.calls[0][0].data.metadata;
    expect(metadata.ipHash).toHaveLength(40);
  });
});

describe('kod gönderim limitleri',()=>{
  it('sınırlar boşken gönderime izin verir',async()=>{
    db.auditLog.count.mockResolvedValue(0);
    const result=await checkCodeSendLimit('PASSWORD_RESET',req(),'u1',{accountDaily:5,ipDaily:20,cooldownSeconds:60});
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('60 saniyelik cooldownı uygular',async()=>{
    db.auditLog.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    const result=await checkCodeSendLimit('PASSWORD_RESET',req(),'u1',{accountDaily:5,ipDaily:20,cooldownSeconds:60});
    expect(result).toMatchObject({allowed:false,reason:'COOLDOWN',retryAfterSeconds:60});
  });

  it('hesap günlük sınırını uygular',async()=>{
    db.auditLog.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);
    const result=await checkCodeSendLimit('PASSWORD_RESET',req(),'u1',{accountDaily:5,ipDaily:20});
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ACCOUNT_DAILY');
  });

  it('IP günlük sınırını uygular',async()=>{
    db.auditLog.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(20);
    const result=await checkCodeSendLimit('PASSWORD_RESET',req(),'u1',{accountDaily:5,ipDaily:20});
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('IP_DAILY');
  });

  it('kod gönderimini hesap, IP ve kombinasyon bazında kaydeder',async()=>{
    await reserveCodeSend('EMAIL_VERIFY',req({'x-real-ip':'4.4.4.4'}),'u1');
    const actions=db.auditLog.create.mock.calls.map(c=>c[0].data.action);
    expect(actions).toEqual(expect.arrayContaining([
      'CODE_SEND_EMAIL_VERIFY_COMBO',
      'CODE_SEND_EMAIL_VERIFY_ACCOUNT',
      'CODE_SEND_EMAIL_VERIFY_IP'
    ]));
  });
});

describe('challenge deneme limiti',()=>{
  it('kullanılmış challengeı reddeder',async()=>{
    db.auditLog.findFirst.mockResolvedValueOnce({createdAt:new Date()});
    const result=await checkChallengeLimit(req(),'PASSWORD_RESET','jti-1',5);
    expect(result).toEqual({allowed:false,reason:'USED',remainingAttempts:0});
  });

  it('geçersiz kılınmış challengeı reddeder',async()=>{
    db.auditLog.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({createdAt:new Date()});
    const result=await checkChallengeLimit(req(),'PASSWORD_RESET','jti-1',5);
    expect(result).toEqual({allowed:false,reason:'INVALIDATED',remainingAttempts:0});
  });

  it('maksimum challenge denemesini uygular',async()=>{
    db.auditLog.count.mockResolvedValueOnce(5);
    const result=await checkChallengeLimit(req(),'PASSWORD_RESET','jti-1',5);
    expect(result).toEqual({allowed:false,reason:'ATTEMPTS',remainingAttempts:0});
  });

  it('IP seviyesindeki yoğun hataları sınırlar',async()=>{
    db.auditLog.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(20);
    const result=await checkChallengeLimit(req(),'PASSWORD_RESET','jti-1',5);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('IP_LIMIT');
    expect(result.remainingAttempts).toBe(3);
  });

  it('normal challenge için kalan deneme sayısını döndürür',async()=>{
    db.auditLog.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3);
    const result=await checkChallengeLimit(req(),'PASSWORD_RESET','jti-1',5);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(3);
  });

  it('beşinci hatada challengeı iptal eder',async()=>{
    db.auditLog.count.mockResolvedValueOnce(5);
    const result=await recordChallengeFailure(req(),'PASSWORD_RESET','jti-1','u1',5);
    expect(result).toEqual({failures:5,remainingAttempts:0,invalidated:true});
    const actions=db.auditLog.create.mock.calls.map(c=>c[0].data.action);
    expect(actions).toContain('AUTH_CHALLENGE_INVALIDATED');
  });

  it('kullanılmış challenge kaydını yazar',async()=>{
    await markChallengeUsed('EMAIL_VERIFY','jti-1','u1');
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data:expect.objectContaining({action:'AUTH_CHALLENGE_USED',entityId:'jti-1',actorUserId:'u1'})
    });
  });
});
