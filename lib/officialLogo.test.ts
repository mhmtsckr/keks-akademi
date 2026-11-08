import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const LOGO='/keks-official-2026.webp';
const MASK='/keks-logo-mask.svg';
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('KEKS Akademi seamless official logo',()=>{
 it('shows the original user-approved artwork in the homepage and all portal headers',()=>{
  expect(read('app/page.tsx')).toContain('src="'+LOGO+'"');
  expect(read('app/components/PortalShell.tsx')).toContain('src="'+LOGO+'"');
 });
 it('isolates the logo silhouette and exposes the header gradient through its background',()=>{
  const svg=read('public'+MASK);
  expect(svg).toContain('<svg');
  expect(svg).toContain('fill-rule="evenodd"');
  const css=read('app/globals.css');
  expect(css).toContain('-webkit-mask-image:url(\'/keks-logo-mask.svg\')');
  expect(css).toContain('mask-image:url(\'/keks-logo-mask.svg\')');
  expect(css).toContain('background:transparent!important');
  expect(css).toContain('flex-direction:row');
 });
 it('renders the same real image in the app-install banner instead of the broken SVG',()=>{
  const banner=read('app/components/MobileInstallBanner.tsx');
  expect(banner).toContain('className="installBrandLogo"');
  expect(banner).toContain('src="'+LOGO+'"');
  expect(banner).not.toContain('/keks-logo.svg');
 });
 it('preserves browser/PWA identity and generated installable icons',()=>{
  expect(read('app/layout.tsx')).toContain("url:'/keks-brand-navy-icon.webp'");
  expect(read('app/manifest.ts')).toContain("src:'/api/public/brand-icon?size=192'");
  expect(read('app/manifest.ts')).toContain("src:'/api/public/brand-icon?size=512'");
  expect(fs.existsSync(path.join(ROOT,'app/icon.svg'))).toBe(false);
 });
 it('builds Android launcher icons using the same cutout mask and original emblem',()=>{
  const android=read('scripts/generate_android_icons.py');
  expect(android).toContain('keks-official-2026.webp');
  expect(android).toContain('keks-logo-mask.svg');
  expect(android).toContain('cairosvg.svg2png');
  expect(read('.github/workflows/mobile-android.yml')).toContain('python scripts/generate_android_icons.py');
  expect(read('.github/workflows/mobile-android.yml')).toContain('assembleDebug');
 });
});
