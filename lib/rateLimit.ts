const store=new Map<string,{count:number;resetAt:number}>();

const CLEANUP_INTERVAL=60_000;
let lastCleanup=Date.now();

function cleanup(){
  const now=Date.now();
  if(now-lastCleanup<CLEANUP_INTERVAL)return;
  lastCleanup=now;
  for(const [key,entry] of store){
    if(entry.resetAt<=now) store.delete(key);
  }
}

export interface RateLimitResult{
  allowed:boolean;
  retryAfterSeconds:number;
}

export function checkRateLimit(
  ip:string,
  route:string,
  maxRequests:number,
  windowSeconds:number,
):RateLimitResult{
  cleanup();
  const now=Date.now();
  const key=`${route}:${ip}`;
  const entry=store.get(key);
  if(!entry||entry.resetAt<=now){
    store.set(key,{count:1,resetAt:now+windowSeconds*1000});
    return {allowed:true,retryAfterSeconds:0};
  }
  entry.count++;
  if(entry.count>maxRequests){
    const retryAfterSeconds=Math.max(1,Math.ceil((entry.resetAt-now)/1000));
    return {allowed:false,retryAfterSeconds};
  }
  return {allowed:true,retryAfterSeconds:0};
}
