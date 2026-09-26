import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();

function read(file:string){
  return fs.readFileSync(path.join(ROOT,file),'utf8');
}

function walk(dir:string):string[]{
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){
      if(['node_modules','.next','.git','coverage'].includes(entry.name))return [];
      return walk(full);
    }
    return /\.(ts|tsx)$/.test(entry.name)?[full]:[];
  });
}

function rel(file:string){
  return path.relative(ROOT,file).replace(/\\/g,'/');
}

describe('KEKS non-negotiable production safety rules',()=>{
  it('never writes secret-bearing expressions to console logs',()=>{
    const sensitive=/(password|passphrase|verification.?code|otp|challenge\.code|token|secret|merchant.?key|merchant.?salt|api.?key)/i;
    const violations:string[]=[];

    for(const file of [...walk(path.join(ROOT,'app')),...walk(path.join(ROOT,'lib'))].filter(x=>!x.endsWith('.test.ts')&&!x.endsWith('.test.tsx'))){
      const source=fs.readFileSync(file,'utf8');
      const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
      const visit=(node:ts.Node)=>{
        if(ts.isCallExpression(node)&&/^console\.(?:log|info|warn|error|debug)$/.test(node.expression.getText(sf))){
          for(const arg of node.arguments){
            if(ts.isStringLiteral(arg)||ts.isNoSubstitutionTemplateLiteral(arg))continue;
            const text=arg.getText(sf);
            if(sensitive.test(text))violations.push(rel(file)+': '+node.expression.getText(sf)+'('+text+')');
          }
        }
        ts.forEachChild(node,visit);
      };
      visit(sf);
    }

    expect(violations,'Passwords, reset/verification codes, tokens and secrets must never be logged.').toEqual([]);
  });

  it('requires bounded login and password reset attempts',()=>{
    const login=read('app/api/auth/login/route.ts');
    const resetRequest=read('app/api/auth/password-reset/request/route.ts');
    const resetConfirm=read('app/api/auth/password-reset/confirm/route.ts');
    const abuse=read('lib/authAbuse.ts');

    expect(login).toContain('checkLoginLimit');
    expect(login).toContain('recordLoginFailure');
    expect(abuse).toContain('accountFailures>=5');
    expect(abuse).toContain('ipFailures>=20');

    expect(resetRequest).toContain("checkCodeSendLimit('PASSWORD_RESET'");
    expect(resetRequest).toContain("createAuthChallenge({user,purpose:'PASSWORD_RESET'");
    expect(resetRequest).toContain('sendPasswordResetCode');
    expect(resetConfirm).toContain("readAuthChallenge(input.challenge,'PASSWORD_RESET')");
    expect(resetConfirm).toContain("checkChallengeLimit(req,'PASSWORD_RESET',challenge.jti,5)");
    expect(resetConfirm).toContain('verifyAuthChallengeCode');
  });

  it('never changes a password from easy-known identity fields alone',()=>{
    const request=read('app/api/auth/password-reset/request/route.ts');
    const confirm=read('app/api/auth/password-reset/confirm/route.ts');

    expect(request).not.toMatch(/db\.user\.update\s*\(/);
    expect(confirm).toContain("challenge:z.string().min(20)");
    expect(confirm).toContain("code:z.string().regex(/\^\\d\{6\}\$/)");
    expect(confirm).toContain('password:z.string().min(12).max(128)');
    expect(confirm).toContain('markChallengeUsed');
  });

  it('suspension preserves data and deletion remains retention-gated',()=>{
    const users=read('app/api/admin/users/route.ts');
    const cleanup=read('lib/suspendedUserCleanup.ts');
    const start=users.indexOf("if(input.status==='SUSPENDED'){");
    const end=users.indexOf('  const updated=await db.user.update',start);
    const suspensionBlock=users.slice(start,end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(suspensionBlock).not.toMatch(/\.(?:delete|deleteMany)\s*\(/);
    expect(suspensionBlock).toContain("data:{status:'SUSPENDED'");
    expect(cleanup).toContain('if(!retention.canPermanentlyDelete)');
    expect(cleanup).toContain("reason:'RETENTION_ACTIVE'");
  });

  it('requires explainable AI and adaptive recommendations',()=>{
    const smartCoach=read('lib/smartCoach.ts');
    const adaptive=read('app/api/student/adaptive/route.ts');
    const coachbot=read('app/api/student/coachbot/route.ts');

    expect(smartCoach).toContain("explanation:'Bu plan;");
    expect(smartCoach).toContain("reason:'Bu soruların tekrar tarihi bugün olduğu için plana alındı.'");
    expect(adaptive).toContain('reason:insights.suggestion');
    expect(coachbot).toContain("const basis='Dayanak:");
    expect(coachbot).toContain('açıklamasız karar verme');
    expect(coachbot).toContain('return NextResponse.json({ok:true,reply,basis})');
  });

  it('keeps psychometric outputs explicitly non-diagnostic and non-definitive',()=>{
    const screening=read('lib/screeningForms.ts');
    const scoring=read('lib/scoring.ts');
    const nativeSubmit=read('app/api/student/test/submit/route.ts');
    const externalSubmit=read('app/api/external/keks-assessment/submit/route.ts');

    expect(screening).toContain("Psikolojik tanı koymaz ve kesin kişilik tipi belirlemez");
    expect(scoring).toContain('disclaimer: SCREENING_DISCLAIMER');
    expect(scoring).toContain("validationStatus:'EDUCATIONAL_SCREENING'");
    expect(scoring).toContain('başarı/başarısızlık veya yüksek risk etiketi üretmez');
    expect(nativeSubmit).toContain("validationStatus:'EDUCATIONAL_SCREENING'");
    expect(nativeSubmit).toContain('disclaimer:SCREENING_DISCLAIMER');
    expect(externalSubmit).toContain("validationStatus:'UNVERIFIED_EXTERNAL'");
    expect(externalSubmit).toContain('psikometrik olarak doğrulanmamıştır');
  });

  it('avoids stigmatizing student/personality labels in UI copy',()=>{
    const forbidden=/(başarısız\s+öğrenci|yüksek\s+riskli\s+kişilik|riskli\s+kişilik|gelişim\s+riski)/i;
    const violations=walk(path.join(ROOT,'app'))
      .filter(file=>!file.endsWith('.test.ts')&&!file.endsWith('.test.tsx')&&forbidden.test(fs.readFileSync(file,'utf8')))
      .map(rel);

    expect(violations,'Use observable behavior and development language instead of stigmatizing labels.').toEqual([]);
  });

  it('keeps production deploy chained behind every CI quality gate',()=>{
    const workflow=read('.github/workflows/build.yml');
    expect(workflow).toContain('unit:\n    name: Unit & Coverage\n    needs: typecheck');
    expect(workflow).toContain('integration:\n    name: Integration / PostgreSQL\n    needs: unit');
    expect(workflow).toContain('build:\n    name: Production Build\n    needs: integration');
    expect(workflow).toContain('approve-production:\n    name: Approve Production Deploy\n    needs: build');
  });
});
