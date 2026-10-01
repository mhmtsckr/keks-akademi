import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('KEKS official logo usage',()=>{
  it('logo asset exists and is referenced by portal shell',()=>{
    expect(read('public/keks-logo.svg')).toContain('KEKS Akademi logosu');
    expect(read('app/components/PortalShell.tsx')).toContain('src="/keks-logo.svg"');
  });
  it('homepage uses the official logo',()=>{
    const page=read('app/page.tsx');
    expect(page).toContain('homeBrandLogo');
    expect(page).toContain('homeHeroOfficialLogo');
  });
  it('PWA and metadata use the official logo',()=>{
    expect(read('app/layout.tsx')).toContain("icon: '/keks-logo.svg'");
    expect(read('app/manifest.ts')).toContain("src:'/keks-logo.svg'");
  });
});
