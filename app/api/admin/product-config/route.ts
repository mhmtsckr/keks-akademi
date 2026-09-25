import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { getKeksMonthlyProduct } from '@/lib/monthlyProduct';
import { getProductPricing,saveProductPricing } from '@/lib/systemConfig';

const schema=z.object({
  listPriceKurus:z.number().int().min(100).max(100000000),
  priceKurus:z.number().int().min(100).max(100000000)
}).refine(v=>v.priceKurus<=v.listPriceKurus,{message:'Satış fiyatı liste fiyatından yüksek olamaz.'});

async function GET__handler(){
  await requireRole(['ADMIN']);
  const [pricing,product]=await Promise.all([getProductPricing(),getKeksMonthlyProduct()]);
  return NextResponse.json({ok:true,pricing,product});
}

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);
  const pricing=await saveProductPricing(admin.id,input);
  const product=await getKeksMonthlyProduct();
  return NextResponse.json({ok:true,pricing,product,message:'Merkezi ürün fiyatı güncellendi. Ödeme, test erişimi ve ürün vitrini artık bu fiyatı kullanır.'});
}

export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
