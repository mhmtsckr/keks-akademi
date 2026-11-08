import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const LOGO='/keks-brand-navy-header.webp';
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('KEKS Akademi official uploaded emblem',()=>{
 it('uses the uploaded emblem at the very top of every main navigation',()=>{
  expect(read('app/components/PortalShell.tsx')).toContain('src="'+LOGO+'"');
  expect(read('app/page.tsx')).toContain('src="'+LOGO+'"');
 });
 it('retains the original artwork in a real, locally hosted image asset',()=>{
  const bytes=fs.readFileSync(path.join(ROOT,'public/keks-brand-navy-header.webp'));
  expect(bytes.length).toBeGreaterThan(4000);
  expect(bytes.toString('ascii',0,4)).toBe('RIFF');
  expect(bytes.toString('ascii',8,12)).toBe('WEBP');
 });
 it('shows the logo in the navigation, not as a full hero photo',()=>{
  expect(read('app/page.tsx')).not.toContain('homeHeroOfficialLogo');
  expect(read('app/components/PortalShell.tsx')).not.toContain('portalHeroOfficialLogo');
 });
 it('points browser favicon and PWA identity at the same uploaded emblem',()=>{
  expect(read('app/layout.tsx')).toContain("url:'/keks-brand-navy-icon.webp'");
  expect(read('app/manifest.ts')).toContain("src:'/keks-brand-navy-icon.webp'");
  expect(read('app/favicon.ico/route.ts')).toContain("'/keks-brand-navy-icon.webp'");
  expect(fs.existsSync(path.join(ROOT,'app/icon.svg'))).toBe(false);
 });
});
