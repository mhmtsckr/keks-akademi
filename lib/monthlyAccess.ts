export function turkeyMonthWindow(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const year=Number(parts.find(x=>x.type==='year')?.value);
  const month=Number(parts.find(x=>x.type==='month')?.value);
  const startUtc=new Date(Date.UTC(year,month-1,1,-3,0,0));
  const nextYear=month===12?year+1:year;
  const nextMonth=month===12?1:month+1;
  const endUtc=new Date(Date.UTC(nextYear,nextMonth-1,1,-3,0,0));
  return {start:startUtc,end:endUtc,year,month,key:`${year}-${String(month).padStart(2,'0')}`};
}
