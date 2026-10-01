import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('KEKS compact logo usage',()=>{
  it('uses the stable vector logo mark in navigation',()=>{
    expect(read('app/components/PortalShell.tsx')).toContain('src="/icon.svg"');
    expect(read('app/page.tsx')).toContain('src="/icon.svg"');
  });
  it('does not render the logo as a large hero photo',()=>{
    expect(read('app/page.tsx')).not.toContain('homeHeroOfficialLogo');
    expect(read('app/components/PortalShell.tsx')).not.toContain('portalHeroOfficialLogo');
  });
  it('PWA and metadata use the stable logo icon',()=>{
    expect(read('app/layout.tsx')).toContain("icon: '/icon.svg'");
    expect(read('app/manifest.ts')).toContain("src:'/icon.svg'");
  });
});
