'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useMemo,useState} from 'react';

type Item={href:string;label:string;icon:string};

const roleItems:Record<string,Item[]>={
  ogrenci:[
    {href:'/ogrenci/bugun',label:'Bugün',icon:'✓'},
    {href:'/ogrenci',label:'Panel',icon:'⌂'},
    {href:'/rapor',label:'Rapor',icon:'▥'},
  ],
  koc:[
    {href:'/koc',label:'Koç',icon:'⌂'},
    {href:'/coach',label:'Takip',icon:'◎'},
    {href:'/rapor',label:'Rapor',icon:'▥'},
  ],
  coach:[
    {href:'/coach',label:'Takip',icon:'◎'},
    {href:'/koc',label:'Koç',icon:'⌂'},
    {href:'/rapor',label:'Rapor',icon:'▥'},
  ],
  veli:[
    {href:'/veli',label:'Veli',icon:'⌂'},
    {href:'/rapor',label:'Rapor',icon:'▥'},
  ],
  yonetici:[
    {href:'/yonetici',label:'Yönetim',icon:'⌂'},
    {href:'/rapor',label:'Rapor',icon:'▥'},
    {href:'/sistem',label:'Sistem',icon:'⚙'},
  ],
};

export function MobileAppShell(){
  const pathname=usePathname();
  const [mobile,setMobile]=useState(false);
  useEffect(()=>{
    const mq=window.matchMedia('(max-width: 820px)');
    const sync=()=>setMobile(mq.matches);
    sync(); mq.addEventListener?.('change',sync);
    return ()=>mq.removeEventListener?.('change',sync);
  },[]);
  const role=useMemo(()=>pathname.split('/').filter(Boolean)[0]||'',[pathname]);
  const items=roleItems[role];
  if(!mobile||!items)return null;
  return <nav aria-label="KEKS mobil uygulama menüsü" style={{
    position:'fixed',left:'max(10px, env(safe-area-inset-left))',right:'max(10px, env(safe-area-inset-right))',
    bottom:'max(10px, env(safe-area-inset-bottom))',zIndex:950,display:'grid',
    gridTemplateColumns:`repeat(${items.length},minmax(0,1fr))`,gap:6,padding:7,
    border:'1px solid rgba(232,187,76,.25)',borderRadius:18,
    background:'rgba(7,26,48,.96)',boxShadow:'0 14px 40px rgba(0,0,0,.34)',backdropFilter:'blur(16px)'
  }}>
    {items.map(item=>{
      const active=pathname===item.href||(item.href!=='/rapor'&&pathname.startsWith(item.href+'/'));
      return <Link key={item.href} href={item.href} aria-current={active?'page':undefined} style={{
        minHeight:50,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
        borderRadius:12,textDecoration:'none',fontSize:11,fontWeight:800,
        color:active?'#071a30':'#d7e0e9',background:active?'linear-gradient(135deg,#d59b30,#f1cf77)':'transparent'
      }}><span aria-hidden="true" style={{fontSize:18,lineHeight:1}}>{item.icon}</span><span>{item.label}</span></Link>
    })}
  </nav>;
}
