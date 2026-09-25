import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';
import { describe,expect,it } from 'vitest';

const ROOT=process.cwd();

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

function source(file:string){
  return fs.readFileSync(file,'utf8');
}

function exportedGetHandlers(sf:ts.SourceFile):ts.Node[]{
  const named=new Map<string,ts.Node>();
  const handlers:ts.Node[]=[];

  sf.forEachChild(node=>{
    if(ts.isFunctionDeclaration(node)&&node.name)named.set(node.name.text,node);
    if(ts.isVariableStatement(node)){
      for(const decl of node.declarationList.declarations){
        if(ts.isIdentifier(decl.name)&&decl.initializer&&(ts.isArrowFunction(decl.initializer)||ts.isFunctionExpression(decl.initializer))){
          named.set(decl.name.text,decl.initializer);
        }
      }
    }
  });

  sf.forEachChild(node=>{
    const exported=Boolean(ts.canHaveModifiers(node)&&ts.getModifiers(node)?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword));
    if(ts.isFunctionDeclaration(node)&&exported&&node.name?.text==='GET'){
      handlers.push(node);
      return;
    }
    if(!ts.isVariableStatement(node)||!exported)return;
    for(const decl of node.declarationList.declarations){
      if(!ts.isIdentifier(decl.name)||decl.name.text!=='GET'||!decl.initializer)continue;
      const init=decl.initializer;
      if(ts.isArrowFunction(init)||ts.isFunctionExpression(init)){
        handlers.push(init);
      }else if(ts.isIdentifier(init)){
        const target=named.get(init.text);if(target)handlers.push(target);
      }else if(ts.isCallExpression(init)){
        const arg=init.arguments[0];
        if(arg&&ts.isIdentifier(arg)){
          const target=named.get(arg.text);if(target)handlers.push(target);
        }else if(arg&&(ts.isArrowFunction(arg)||ts.isFunctionExpression(arg))){
          handlers.push(arg);
        }
      }
    }
  });
  return handlers;
}

function prismaWrites(node:ts.Node,sf:ts.SourceFile){
  const hits:string[]=[];
  const visit=(n:ts.Node)=>{
    if(ts.isCallExpression(n)){
      const expr=n.expression.getText(sf);
      if(/\b(?:db|tx)\.[A-Za-z0-9_]+\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\b/.test(expr)
        ||/\b(?:db|tx)\.\$(?:executeRaw|executeRawUnsafe)\b/.test(expr)){
        hits.push(expr);
      }
    }
    ts.forEachChild(n,visit);
  };
  visit(node);
  return hits;
}

describe('KEKS production safety policies',()=>{
  it('GET API handlers do not mutate PostgreSQL state',()=>{
    const violations:string[]=[];
    for(const file of walk(path.join(ROOT,'app','api')).filter(x=>x.endsWith('route.ts'))){
      const sf=ts.createSourceFile(file,source(file),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
      for(const handler of exportedGetHandlers(sf)){
        for(const call of prismaWrites(handler,sf))violations.push(rel(file)+': '+call);
      }
    }
    expect(violations,'GET must be read-only; move state changes to POST/PATCH/PUT/DELETE.').toEqual([]);
  });

  it('browser storage never stores authentication secret material',()=>{
    const sensitive=/(password|passphrase|token|secret|session|challenge|otp|verification.?code|app.?password|merchant.?key|merchant.?salt)/i;
    const violations:string[]=[];
    for(const file of walk(path.join(ROOT,'app'))){
      const sf=ts.createSourceFile(file,source(file),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
      const visit=(n:ts.Node)=>{
        if(ts.isCallExpression(n)){
          const expr=n.expression.getText(sf);
          if(/^(?:window\.)?(?:localStorage|sessionStorage)\.setItem$/.test(expr)){
            const serialized=n.arguments.map(x=>x.getText(sf)).join(' ');
            if(sensitive.test(serialized))violations.push(rel(file)+': '+expr+'('+serialized+')');
          }
        }
        ts.forEachChild(n,visit);
      };
      visit(sf);
    }
    expect(violations,'Passwords/tokens/codes must stay out of browser storage.').toEqual([]);
  });

  it('admin APIs never expose password hashes',()=>{
    const violations=walk(path.join(ROOT,'app','api','admin'))
      .filter(file=>/\bpasswordHash\b/.test(source(file)))
      .map(rel);
    expect(violations,'Admin endpoints must never select or return passwordHash.').toEqual([]);
  });

  it('student-facing code avoids stigmatizing personality labels',()=>{
    const forbidden=/(yüksek\s+riskli\s+(?:kişilik|öğrenci)|riskli\s+kişilik|başarısız\s+öğrenci)/i;
    const violations=walk(path.join(ROOT,'app'))
      .filter(file=>forbidden.test(source(file)))
      .map(rel);
    expect(violations,'Use observable behavior and explainable signals instead of stigmatizing labels.').toEqual([]);
  });

  it('list and sale prices have one literal source of truth',()=>{
    const allowed='lib/systemConfig.ts';
    const kuruşPattern=/(?:\b40000\b|\b80000\b)/i;
    const tlLiteralPattern=/\b\d{2,6}(?:[.,]\d{1,2})?\s*TL\b/i;
    const runtimeFiles=[...walk(path.join(ROOT,'app')),...walk(path.join(ROOT,'lib'))];
    const runtimeViolations=runtimeFiles
      .filter(file=>rel(file)!==allowed&&!rel(file).endsWith('.test.ts')&&(kuruşPattern.test(source(file))||tlLiteralPattern.test(source(file))))
      .map(rel);

    const documentationFiles=[path.join(ROOT,'README.md')];
    const docsDir=path.join(ROOT,'docs');
    if(fs.existsSync(docsDir)){
      const collectMarkdown=(dir:string):string[]=>
        fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
          const full=path.join(dir,entry.name);
          if(entry.isDirectory())return collectMarkdown(full);
          return entry.name.endsWith('.md')?[full]:[];
        });
      documentationFiles.push(...collectMarkdown(docsDir));
    }
    const documentationViolations=documentationFiles
      .filter(file=>fs.existsSync(file)&&tlLiteralPattern.test(fs.readFileSync(file,'utf8')))
      .map(rel);

    expect(
      [...runtimeViolations,...documentationViolations],
      'Product prices must come from lib/systemConfig.ts; runtime copy and documentation must not hard-code TL amounts.'
    ).toEqual([]);
  });

  it('AI/adaptive endpoints enforce server-side feature flags',()=>{
    const gated=[
      'app/api/student/coachbot/route.ts',
      'app/api/student/adaptive/route.ts',
      'app/api/student/smart-plan/route.ts',
      'app/api/coach/students/[id]/smart-plan/route.ts'
    ];
    const missing=gated.filter(file=>!source(path.join(ROOT,file)).includes('isFeatureEnabled'));
    expect(missing,'Feature flags must be enforced by APIs, not only hidden in the UI.').toEqual([]);
  });

  it('Vercel production builds require the CI-approved marker',()=>{
    const vercel=JSON.parse(fs.readFileSync(path.join(ROOT,'vercel.json'),'utf8')) as {ignoreCommand?:string};
    const workflow=fs.readFileSync(path.join(ROOT,'.github','workflows','build.yml'),'utf8');
    expect(vercel.ignoreCommand||'').toContain('ci: deploy approved ');
    expect(workflow).toContain('approve-production:');
    expect(workflow).toContain('ci: deploy approved $SOURCE_SHA [skip ci]');
    expect(workflow).toContain('needs: build');
  });
});
