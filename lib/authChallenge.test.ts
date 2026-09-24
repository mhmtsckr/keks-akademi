import { describe,expect,it } from 'vitest';
import { createAuthChallenge,readAuthChallenge,verifyAuthChallengeCode } from './authChallenge';

const user={id:'user-1',updatedAt:new Date('2026-09-24T12:00:00.000Z')};

describe('authChallenge',()=>{
  it('challenge üretir, okur ve doğru kodu doğrular',async()=>{
    const created=await createAuthChallenge({user,purpose:'PASSWORD_RESET',expiresIn:'10m'});
    expect(created.code).toMatch(/^\d{6}$/);
    expect(created.jti.length).toBeGreaterThan(10);

    const read=await readAuthChallenge(created.token,'PASSWORD_RESET');
    expect(read.userId).toBe(user.id);
    expect(read.jti).toBe(created.jti);
    expect(read.nonce).toBe(user.updatedAt.toISOString());
    expect(read.remember).toBe(false);
    expect(read.data).toEqual({});
    expect(verifyAuthChallengeCode(read,created.code)).toBe(true);
    expect(verifyAuthChallengeCode(read,'000000')).toBe(false);
  });

  it('remember ve imzalı veri alanını taşır',async()=>{
    const created=await createAuthChallenge({
      user,
      purpose:'EMAIL_CHANGE',
      remember:true,
      data:{newEmail:'yeni@example.com'}
    });
    const read=await readAuthChallenge(created.token,'EMAIL_CHANGE');
    expect(read.remember).toBe(true);
    expect(read.data).toEqual({newEmail:'yeni@example.com'});
  });

  it('yanlış amaçla okunamaz',async()=>{
    const created=await createAuthChallenge({user,purpose:'ADMIN_2FA'});
    await expect(readAuthChallenge(created.token,'PASSWORD_RESET')).rejects.toThrow('INVALID_AUTH_CHALLENGE');
  });

  it('bozuk tokeni reddeder',async()=>{
    await expect(readAuthChallenge('bozuk-token','EMAIL_VERIFY')).rejects.toBeTruthy();
  });
});
