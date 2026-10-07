import {spawnSync} from 'node:child_process';

if(process.env.VERCEL_ENV!=='production'){
  console.log('Production schema step skipped outside Vercel production.');
  process.exit(0);
}

if(!process.env.DATABASE_URL){
  console.error('DATABASE_URL is required for the production schema step.');
  process.exit(1);
}

console.log('Applying additive KEKS production schema before build...');
const result=spawnSync(
  'npx',
  ['prisma','db','execute','--file','prisma/production/additive_schema.sql','--schema','prisma/schema.prisma'],
  {stdio:'inherit',shell:process.platform==='win32'}
);

if(result.error){
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status??1);
