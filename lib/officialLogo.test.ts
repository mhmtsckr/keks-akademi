import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const LOGO='/keks-brand-navy-header.webp';
const ICON='/keks-brand-navy-icon.webp';
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('Approved navy KEKS Akademi branding',()=>{
  it('uses the approved logo in both the homepage and all portal headers',()=>{
    expect(read('app/components/PortalShell.tsx')).toContain('src="'+LOGO+'"');
    expect(read('app/page.tsx')).toContain('src="'+LOGO+'"');
    expect(read('app/globals.css')).toContain('border-radius:0;background:transparent;box-shadow:none');
  });
  it('serves actual optimized logo and square icon images from the repository',()=>{
    for(const file of ['public'+LOGO,'public'+ICON]){
      const bytes=fs.readFileSync(path.join(ROOT,file));
      expect(bytes.length).toBeGreaterThan(3500);
      expect(bytes.toString('ascii',0,4)).toBe('RIFF');
      expect(bytes.toString('ascii',8,12)).toBe('WEBP');
    }
  });
  it('does not render the logo as an oversized hero photograph',()=>{
    expect(read('app/page.tsx')).not.toContain('homeHeroOfficialLogo');
    expect(read('app/components/PortalShell.tsx')).not.toContain('portalHeroOfficialLogo');
  });
  it('points favicon and Apple identity at the navy icon; PWA provides installable 192/512 dimensions',()=>{
    expect(read('app/layout.tsx')).toContain("url:'/keks-brand-navy-icon.webp'");
    expect(read('app/layout.tsx')).toContain("apple: '/api/public/brand-icon?size=192'");
    expect(read('app/manifest.ts')).toContain("src:'/api/public/brand-icon?size=192'");
    expect(read('app/manifest.ts')).toContain("src:'/api/public/brand-icon?size=512'");
    expect(read('app/favicon.ico/route.ts')).toContain("'/keks-brand-navy-icon.webp'");
    expect(read('app/api/public/brand-icon/route.tsx')).toContain('keks-brand-navy-icon.webp');
    expect(fs.existsSync(path.join(ROOT,'app/icon.svg'))).toBe(false);
  });
  it('ships a native Android launcher icon generator from the exact same approved square source',()=>{
    expect(read('scripts/generate_android_icons.py')).toContain('keks-brand-navy-icon.webp');
    expect(read('.github/workflows/mobile-android.yml')).toContain('python scripts/generate_android_icons.py');
    expect(read('.github/workflows/mobile-android.yml')).toContain('assembleDebug');
  });
});
