import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('KEKS compact logo usage',()=>{
  it('uses the uploaded KEKS logo in navigation',()=>{
    expect(read('app/components/PortalShell.tsx')).toContain('src="/keks-logo.webp"');
    expect(read('app/page.tsx')).toContain('src="/keks-logo.webp"');
  });
  it('does not render the logo as a large hero photo',()=>{
    expect(read('app/page.tsx')).not.toContain('homeHeroOfficialLogo');
    expect(read('app/components/PortalShell.tsx')).not.toContain('portalHeroOfficialLogo');
  });
  it('PWA and metadata use the uploaded KEKS logo',()=>{
    expect(read('app/layout.tsx')).toContain("icon: '/keks-logo.webp'");
    expect(read('app/manifest.ts')).toContain("src:'/keks-logo.webp'");
  });
});
