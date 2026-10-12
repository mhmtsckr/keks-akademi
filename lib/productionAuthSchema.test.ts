import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

describe('Production login schema compatibility',()=>{
  const schema=readFileSync(resolve('prisma/schema.prisma'),'utf8');
  const additive=readFileSync(resolve('prisma/production/additive_schema.sql'),'utf8');
  it('keeps the ParentProfile consent fields required by currentUser()',()=>{
    const parent=schema.match(/model ParentProfile \{([\s\S]*?)\n\}/)?.[1]||'';
    expect(parent).toContain('consentRecordedAt DateTime?');
    expect(parent).toContain('consentRecordedByUserId String?');
    expect(parent).toContain('allowReports Boolean @default(false)');
    for(const field of ['consentRecordedAt','consentRecordedByUserId','allowReports']){
      expect(additive).toContain('ADD COLUMN IF NOT EXISTS "'+field+'"');
    }
  });
  it('adds permission-related columns without losing existing family records',()=>{
    expect(additive).toMatch(/ALTER TABLE "ParentProfile"\s+ADD COLUMN IF NOT EXISTS/);
    expect(additive).toMatch(/"allowReports" BOOLEAN NOT NULL DEFAULT false/);
    expect(additive).not.toMatch(/(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM) "ParentProfile"/i);
  });
});