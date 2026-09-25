import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=path.resolve(__dirname,'..');

describe('Vercel deployment policy',()=>{
  it('pins Vercel to a supported Node runtime',()=>{
    const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
    expect(pkg.engines?.node).toBe('22.x');
  });

  it('builds previews but requires the GitHub CI approval marker for production',()=>{
    const config=JSON.parse(fs.readFileSync(path.join(ROOT,'vercel.json'),'utf8'));
    const script=fs.readFileSync(path.join(ROOT,'scripts/vercel-ignore-build.sh'),'utf8');
    expect(config.git?.deploymentEnabled).toEqual({'*':false,main:true});
    expect(config.ignoreCommand).toBe('bash scripts/vercel-ignore-build.sh');
    expect(script).toContain('VERCEL_ENV');
    expect(script).toContain('!= "production"');
    expect(script).toContain('CI-approved source:');
    expect(script).toContain('^ci: deploy approved ');
    expect(script).toContain('[ "$PARENT" = "$APPROVED" ]');
  });
});
