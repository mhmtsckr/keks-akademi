import type { ReactNode } from 'react';

const NAV=[
  ['sistem','/sistem','Sistem'],
  ['ozellikler','/ozellikler','Özellikler'],
  ['ogrenci','/ogrenci','Öğrenci'],
  ['koc','/koc','Koç'],
  ['veli','/veli','Veli'],
  ['yonetici','/yonetici','Yönetici'],
] as const;

export function KeksBrand({compact=false}:{compact?:boolean}){
  return <a href="/" className={compact?'portalBrand portalBrandCompact':'portalBrand'} aria-label="KEKS Akademi ana sayfa">
    <span className="portalBrandMark"><span className="portalBrandOrbit"/><span className="portalBrandCore">K</span></span>
    <span className="portalBrandText"><strong>KEKS</strong><small>AKADEMİ</small></span>
  </a>;
}

export function KeksNav({active}:{active?:string}){
  return <nav className="portalNav">
    <KeksBrand/>
    <div className="portalNavLinks">
      {NAV.map(([key,href,label])=><a key={key} href={href} className={active===key?'active':''}>{label}</a>)}
    </div>
  </nav>;
}

export function PortalShell({
  active,eyebrow,title,description,children,meta,wide=false
}:{
  active?:string;eyebrow:string;title:string;description?:string;children:ReactNode;meta?:ReactNode;wide?:boolean
}){
  return <main className="portal">
    <header className="portalHeader">
      <div className={wide?'portalWrap portalWrapWide':'portalWrap'}>
        <KeksNav active={active}/>
        <div className="portalHero">
          <div className="portalHeroCopy">
            <span className="portalEyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {description&&<p>{description}</p>}
            {meta&&<div className="portalMeta">{meta}</div>}
          </div>
          <div className="portalHeroSymbol" aria-hidden="true">
            <svg viewBox="0 0 260 220">
              <defs>
                <linearGradient id="portalGold" x1="0" x2="1"><stop offset="0" stopColor="#9f6818"/><stop offset=".5" stopColor="#f4d47d"/><stop offset="1" stopColor="#c28a24"/></linearGradient>
                <linearGradient id="portalMountain" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#0a2747"/><stop offset=".7" stopColor="#35536b"/><stop offset="1" stopColor="#8d764f"/></linearGradient>
              </defs>
              <circle cx="74" cy="92" r="54" fill="none" stroke="url(#portalGold)" strokeWidth="3" opacity=".85"/>
              <ellipse cx="74" cy="92" rx="53" ry="27" fill="none" stroke="url(#portalGold)" strokeWidth="2" transform="rotate(27 74 92)" opacity=".85"/>
              <ellipse cx="74" cy="92" rx="53" ry="27" fill="none" stroke="url(#portalGold)" strokeWidth="2" transform="rotate(-27 74 92)" opacity=".85"/>
              <circle cx="74" cy="92" r="27" fill="#0d2b4e" stroke="url(#portalGold)" strokeWidth="2"/>
              <path d="M112 198 158 155l26 16 34-61 34 88Z" fill="url(#portalMountain)"/>
              <path d="M135 198c22-14 37-17 49-35 10-15-1-21 12-35 9-9 19-7 24-20" fill="none" stroke="url(#portalGold)" strokeWidth="5" strokeLinecap="round"/>
              <path d="M220 108V86" stroke="#eac365" strokeWidth="3"/><path d="M222 86h24l-10 8 10 8h-24Z" fill="#eac365"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
    <div className={wide?'portalWrap portalWrapWide portalContent':'portalWrap portalContent'}>{children}</div>
    <footer className="portalFooter"><div className={wide?'portalWrap portalWrapWide':'portalWrap'}><span>KEKS AKADEMİ</span><span>Fark Et · Öğren · Geliş · Başar</span></div></footer>
  </main>;
}

export function PortalSectionTitle({eyebrow,title,description}:{eyebrow?:string;title:string;description?:string}){
  return <div className="portalSectionTitle">{eyebrow&&<span>{eyebrow}</span>}<h2>{title}</h2>{description&&<p>{description}</p>}</div>;
}
