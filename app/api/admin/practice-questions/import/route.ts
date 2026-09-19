import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const item=z.object({
 examType:z.string().min(2),subject:z.string().min(2),topic:z.string().min(2),prompt:z.string().min(5),
 options:z.record(z.string(),z.string()),correctAnswer:z.string().min(1),explanation:z.string().optional(),
 sourceKind:z.enum(['ORIGINAL','LICENSED','OFFICIAL_LINK']).default('ORIGINAL'),sourceYear:z.number().int().optional(),officialSourceUrl:z.string().url().optional()
});
const schema=z.object({items:z.array(item).min(1).max(500)});

export async function POST(req:Request){
 await requireRole(['ADMIN']);
 const input=schema.parse(await req.json());
 const rows=[];
 for(const x of input.items) rows.push(await db.questionBankItem.create({data:x}));
 return NextResponse.json({ok:true,count:rows.length});
}
