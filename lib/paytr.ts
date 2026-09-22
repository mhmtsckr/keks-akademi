import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { decryptPrivateCode } from '@/lib/security';

export type PaytrCredentials={
  merchantId:string;
  merchantKey:string;
  merchantSalt:string;
  testMode:string;
  source:'ENV'|'ADMIN_CONFIG';
};

export async function resolvePaytrCredentials():Promise<PaytrCredentials|null>{
  const merchantId=process.env.PAYTR_MERCHANT_ID?.trim();
  const merchantKey=process.env.PAYTR_MERCHANT_KEY?.trim();
  const merchantSalt=process.env.PAYTR_MERCHANT_SALT?.trim();
  if(merchantId&&merchantKey&&merchantSalt){
    return {
      merchantId,
      merchantKey,
      merchantSalt,
      testMode:process.env.PAYTR_TEST_MODE||'1',
      source:'ENV'
    };
  }

  const config=await db.paytrConfig.findUnique({where:{id:'paytr'}});
  if(!config?.enabled)return null;
  try{
    return {
      merchantId:config.merchantId,
      merchantKey:decryptPrivateCode(config.merchantKeyCiphertext),
      merchantSalt:decryptPrivateCode(config.merchantSaltCiphertext),
      testMode:config.testMode?'1':'0',
      source:'ADMIN_CONFIG'
    };
  }catch{
    return null;
  }
}

export function verifyPaytrCallback(body:Record<string,string>,credentials?:Pick<PaytrCredentials,'merchantKey'|'merchantSalt'>){
  const key=credentials?.merchantKey||process.env.PAYTR_MERCHANT_KEY||'';
  const salt=credentials?.merchantSalt||process.env.PAYTR_MERCHANT_SALT||'';
  if(!key||!salt)return false;
  const base=`${body.merchant_oid}${salt}${body.status}${body.total_amount}`;
  const expected=Buffer.from(crypto.createHmac('sha256',key).update(base).digest('base64'));
  const received=Buffer.from(body.hash||'');
  return expected.length===received.length&&crypto.timingSafeEqual(expected,received);
}

export function createPaytrToken(
  params:{merchantOid:string;email:string;amountKurus:number;userIp:string;basketJson:string;noInstallment:string;maxInstallment:string;currency:string;testMode:string;},
  credentials?:Pick<PaytrCredentials,'merchantId'|'merchantKey'|'merchantSalt'>
){
  const merchantId=credentials?.merchantId||process.env.PAYTR_MERCHANT_ID||'';
  const key=credentials?.merchantKey||process.env.PAYTR_MERCHANT_KEY||'';
  const salt=credentials?.merchantSalt||process.env.PAYTR_MERCHANT_SALT||'';
  const base=`${merchantId}${params.userIp}${params.merchantOid}${params.email}${params.amountKurus}${params.basketJson}${params.noInstallment}${params.maxInstallment}${params.currency}${params.testMode}`;
  return crypto.createHmac('sha256',key).update(base+salt).digest('base64');
}
