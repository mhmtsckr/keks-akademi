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
  it('creates the Subscription table expected by the coach subscription gate',()=>{
    const model=schema.match(/model Subscription \\{([\\s\\S]*?)\\n\\}/)?.[1]||'';
    for(const field of ['userId','planId','status','startsAt','endsAt','createdAt','updatedAt']){
      expect(model).toContain(field);
      expect(additive).toContain('"'+field+'"');
    }
    expect(additive).toMatch(/CREATE TABLE IF NOT EXISTS "Subscription"/);
    expect(additive).toMatch(/"Subscription_pkey" PRIMARY KEY/);
    expect(additive).toMatch(/CREATE INDEX IF NOT EXISTS "Subscription_userId_status_endsAt_idx"/);
    expect(additive).toMatch(/CREATE INDEX IF NOT EXISTS "Subscription_provider_providerReference_idx"/);
    expect(additive).toMatch(/'Subscription_userId_fkey'/);
    expect(additive).toMatch(/REFERENCES "User"\\("id"\\)\\s+ON DELETE CASCADE ON UPDATE CASCADE/);
  });
  it('is additive and does not reset existing subscriptions or grant access',()=>{
    expect(additive).not.toMatch(/(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM|UPDATE) "Subscription"/i);
    expect(additive).not.toMatch(/INSERT INTO "Subscription"/i);
    expect(additive).not.toMatch(/CREATE TABLE "Subscription"/);
  });

});