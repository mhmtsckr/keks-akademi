import {createHmac,timingSafeEqual} from 'node:crypto';
import t01 from '@/data/paragraf-solutions/test-01.json';
import t02 from '@/data/paragraf-solutions/test-02.json';
import t03 from '@/data/paragraf-solutions/test-03.json';
import t04 from '@/data/paragraf-solutions/test-04.json';
import t05 from '@/data/paragraf-solutions/test-05.json';
import t06 from '@/data/paragraf-solutions/test-06.json';
import t07 from '@/data/paragraf-solutions/test-07.json';
import t08 from '@/data/paragraf-solutions/test-08.json';
import t09 from '@/data/paragraf-solutions/test-09.json';
import t10 from '@/data/paragraf-solutions/test-10.json';
import t11 from '@/data/paragraf-solutions/test-11.json';
import t12 from '@/data/paragraf-solutions/test-12.json';
import t13 from '@/data/paragraf-solutions/test-13.json';
import t14 from '@/data/paragraf-solutions/test-14.json';
import t15 from '@/data/paragraf-solutions/test-15.json';
import t16 from '@/data/paragraf-solutions/test-16.json';
import t17 from '@/data/paragraf-solutions/test-17.json';
import t18 from '@/data/paragraf-solutions/test-18.json';
import t19 from '@/data/paragraf-solutions/test-19.json';
import t20 from '@/data/paragraf-solutions/test-20.json';
import t21 from '@/data/paragraf-solutions/test-21.json';
import t22 from '@/data/paragraf-solutions/test-22.json';
import t23 from '@/data/paragraf-solutions/test-23.json';
import t24 from '@/data/paragraf-solutions/test-24.json';
import t25 from '@/data/paragraf-solutions/test-25.json';
import t26 from '@/data/paragraf-solutions/test-26.json';
import t27 from '@/data/paragraf-solutions/test-27.json';
import t28 from '@/data/paragraf-solutions/test-28.json';
import t29 from '@/data/paragraf-solutions/test-29.json';
import t30 from '@/data/paragraf-solutions/test-30.json';
import t31 from '@/data/paragraf-solutions/test-31.json';
import t32 from '@/data/paragraf-solutions/test-32.json';
import t33 from '@/data/paragraf-solutions/test-33.json';
import t34 from '@/data/paragraf-solutions/test-34.json';
import t35 from '@/data/paragraf-solutions/test-35.json';
import t36 from '@/data/paragraf-solutions/test-36.json';
import t37 from '@/data/paragraf-solutions/test-37.json';
import t38 from '@/data/paragraf-solutions/test-38.json';
import t39 from '@/data/paragraf-solutions/test-39.json';
import t40 from '@/data/paragraf-solutions/test-40.json';
import t41 from '@/data/paragraf-solutions/test-41.json';
import t42 from '@/data/paragraf-solutions/test-42.json';
import t43 from '@/data/paragraf-solutions/test-43.json';
import t44 from '@/data/paragraf-solutions/test-44.json';
import t45 from '@/data/paragraf-solutions/test-45.json';
import t46 from '@/data/paragraf-solutions/test-46.json';
import t47 from '@/data/paragraf-solutions/test-47.json';
import t48 from '@/data/paragraf-solutions/test-48.json';
import t49 from '@/data/paragraf-solutions/test-49.json';
import t50 from '@/data/paragraf-solutions/test-50.json';

export const PARAGRAF_DETAILED_EDITION='KEKS_TYT_PARAGRAF_A3_V1';
export const PARAGRAF_DETAILED_TOTAL=1500;
const TESTS=[t01,t02,t03,t04,t05,t06,t07,t08,t09,t10,t11,t12,t13,t14,t15,t16,t17,t18,t19,t20,t21,t22,t23,t24,t25,t26,t27,t28,t29,t30,t31,t32,t33,t34,t35,t36,t37,t38,t39,t40,t41,t42,t43,t44,t45,t46,t47,t48,t49,t50];

export type ParagrafDetailedSolution={
  id:string;testNo:number;questionNo:number;topic:string;answer:string;content:string;
};

/** Maps ONLY the 50-test print edition, never the legacy 6,000-row solution table. */
export function getParagrafDetailedSolution(id:string):ParagrafDetailedSolution|null{
  if(!/^\d{5}$/.test(id))return null;
  const serial=Number(id);
  if(serial<1||serial>PARAGRAF_DETAILED_TOTAL)return null;
  const index=serial-1;
  const testNo=Math.floor(index/30)+1;
  const questionNo=index%30+1;
  const test=TESTS[testNo-1];
  if(!test||test.edition!==PARAGRAF_DETAILED_EDITION||test.testNo!==testNo||
    test.questions.length!==30)return null;
  const q=test.questions[questionNo-1];
  if(!q||q.id!==id||q.testNo!==testNo||q.questionNo!==questionNo||
    !/^[A-E]$/.test(q.answer)||!q.content.includes('3. Çeldirici analizi:'))return null;
  return q;
}

/**
 * 128-bit HMAC token: an individual QR grants this one solution only. A URL
 * lacking a valid signature cannot enumerate neighboring question pages.
 * Source code is public, so this is link authorization, not document DRM.
 */
export function paragrafDetailedSignature(id:string,secret:string){
  if(!getParagrafDetailedSolution(id)||secret.length<32)return null;
  return createHmac('sha256',secret)
    .update(PARAGRAF_DETAILED_EDITION+':'+id).digest('hex').slice(0,32);
}
export function verifyParagrafDetailedSignature(id:string,token:unknown,secret:string){
  if(typeof token!=='string'||!/^[a-f0-9]{32}$/.test(token))return false;
  const expected=paragrafDetailedSignature(id,secret);
  if(!expected)return false;
  return timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(token,'hex'));
}
export function paragrafDetailedSolutionUrl(id:string,secret:string,baseUrl:string){
  const signature=paragrafDetailedSignature(id,secret);
  if(!signature)return null;
  return baseUrl.replace(/\/$/,'')+'/paragraf/ayrintili/'+id+'?k='+signature;
}
