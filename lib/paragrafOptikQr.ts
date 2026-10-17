/** Self-contained QR version 5 / ECC L generator for privacy-preserving result links.
 * No external QR service receives student responses. 37x37 modules, 108 data bytes,
 * 26 RS parity bytes, mask 0. Validated independently with a QR decoder.
 */
const SIZE=37,DATA_LEN=108,EC_LEN=26;
function mul(x:number,y:number){
 let z=0;
 for(let i=7;i>=0;i--){
  z=(z<<1)^((z>>>7)*0x11D);
  z^=((y>>>i)&1)*x;
 }
 return z;
}
export function opticalResultQrSvg(url:string){
 const bytes=[...new TextEncoder().encode(url)];
 if(bytes.length>106||!/^https:\/\/keksakademi\.vercel\.app\/paragraf\/optik\/\d{2}\/sonuc\?c=[A-EX]{30}$/.test(url))return null;
 const bits:number[]=[];
 const put=(x:number,n:number)=>{for(let i=n-1;i>=0;i--)bits.push((x>>>i)&1);};
 put(4,4);put(bytes.length,8);
 for(const b of bytes)put(b,8);
 for(let i=0;i<Math.min(4,DATA_LEN*8-bits.length);i++)bits.push(0);
 while(bits.length%8)bits.push(0);
 const data:number[]=[];
 for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(''),2));
 for(let i=data.length;i<DATA_LEN;i++)data.push(i%2===data.length%2?0xEC:0x11);
 const divisor=Array<number>(EC_LEN).fill(0);
 divisor[EC_LEN-1]=1;
 let root=1;
 for(let i=0;i<EC_LEN;i++){
  for(let j=0;j<EC_LEN;j++){
   divisor[j]=mul(divisor[j],root);
   if(j+1<EC_LEN)divisor[j]^=divisor[j+1];
  }
  root=mul(root,2);
 }
 const rem=Array<number>(EC_LEN).fill(0);
 for(const b of data){
  const factor=b^rem.shift()!;
  rem.push(0);
  for(let j=0;j<EC_LEN;j++)rem[j]^=mul(divisor[j],factor);
 }
 const code=[...data,...rem];
 const cells:(boolean|null)[][]=Array.from({length:SIZE},()=>Array<boolean|null>(SIZE).fill(null));
 const set=(x:number,y:number,v:boolean)=>{
  if(x>=0&&y>=0&&x<SIZE&&y<SIZE)cells[y][x]=v;
 };
 for(const [cx,cy] of [[3,3],[SIZE-4,3],[3,SIZE-4]]){
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
   const d=Math.max(Math.abs(dx),Math.abs(dy));
   set(cx+dx,cy+dy,d!==2&&d!==4);
  }
 }
 for(let i=8;i<SIZE-8;i++){set(6,i,i%2===0);set(i,6,i%2===0);}
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const d=Math.max(Math.abs(dx),Math.abs(dy));set(30+dx,30+dy,d!==1);
 }
 for(let i=0;i<=5;i++){set(8,i,false);set(i,8,false);}
 set(8,7,false);set(8,8,false);set(7,8,false);
 for(let i=0;i<8;i++)set(SIZE-1-i,8,false);
 for(let i=0;i<7;i++)set(8,SIZE-1-i,false);
 set(8,SIZE-8,true);
 let bit=0;
 for(let right=SIZE-1;right>=1;right-=2){
  if(right===6)right=5;
  for(let vert=0;vert<SIZE;vert++){
   const up=((right+1)&2)===0;
   const y=up?SIZE-1-vert:vert;
   for(let j=0;j<2;j++){
    const x=right-j;
    if(cells[y][x]===null){
     const val=bit<code.length*8?((code[bit>>>3]>>>(7-(bit&7)))&1):0;
     bit++;
     cells[y][x]=Boolean(val^(((x+y)&1)===0?1:0));
    }
   }
  }
 }
 // ISO/IEC 18004 format bits: Level L, mask zero.
 const dat=1<<3;
 let remainder=dat;
 for(let i=0;i<10;i++)remainder=(remainder<<1)^(((remainder>>>9)&1)*0x537);
 const format=((dat<<10)|remainder)^0x5412;
 const fbit=(i:number)=>((format>>>i)&1)!==0;
 for(let i=0;i<=5;i++)set(8,i,fbit(i));
 set(8,7,fbit(6));set(8,8,fbit(7));set(7,8,fbit(8));
 for(let i=9;i<15;i++)set(14-i,8,fbit(i));
 for(let i=0;i<8;i++)set(SIZE-1-i,8,fbit(i));
 for(let i=8;i<15;i++)set(8,SIZE-15+i,fbit(i));
 set(8,SIZE-8,true);
 let path='';
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  if(cells[y][x])path+='M'+(x+4)+','+(y+4)+'h1v1h-1z';
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" shape-rendering="crispEdges"><path fill="#fff" d="M0,0H45V45H0Z"/><path fill="#071e42" d="'+path+'"/></svg>';
}
