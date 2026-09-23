import type { ReactNode } from 'react';
import { LogoutButton } from './LogoutButton';

const NAV=[
  ['sistem','/sistem','Sistem'],
  ['ozellikler','/ozellikler','Özellikler'],
  ['ogrenci','/ogrenci','Öğrenci'],
  ['koc','/koc','Koç'],
  ['veli','/veli','Veli'],
  ['yonetici','/yonetici','Yönetici'],
] as const;

const ROLE_COPY:Record<string,{left:string[];right:string[]}> = {
  sistem:{left:['FARK ET','ÖĞREN','GELİŞ','BAŞAR'],right:['TEK SİSTEM','ORTAK VERİ','AKILLI YÖN']},
  ozellikler:{left:['KEŞFET','UYGULA','ÖLÇ','GELİŞ'],right:['DAHA AKILLI','DAHA HIZLI','DAHA ETKİLİ']},
  ogrenci:{left:['ODAKLAN','ÇALIŞ','TEKRARLA','İLERLE'],right:['DAHA BİLİNÇLİ','DAHA GÜÇLÜ','DAHA SEN']},
  koc:{left:['GÖZLEMLE','ANALİZ ET','YÖNLENDİR','GELİŞTİR'],right:['DOĞRU VERİ','DOĞRU PLAN','DOĞRU ADIM']},
  veli:{left:['TAKİP ET','ANLA','DESTEKLE','GÜVEN'],right:['SADE ÖZET','NET GELİŞİM','GÜVENLİ TAKİP']},
  yonetici:{left:['YÖNET','KONTROL ET','ONAYLA','GÜVENLİ TUT'],right:['TEK MERKEZ','TAM KONTROL','GÜVENLİ SİSTEM']},
};

export function KeksBrand({compact=false}:{compact?:boolean}){
  return <a href="/" className={compact?'portalBrand portalBrandCompact':'portalBrand'} aria-label="KEKS Akademi ana sayfa">
    <span className="portalBrandMark"><span className="portalBrandOrbit"/><span className="portalBrandCore">K</span></span>
    <span className="portalBrandText"><strong>KEKS</strong><small>AKADEMİ</small></span>
  </a>;
}

export function KeksNav({active,signedIn=false}:{active?:string;signedIn?:boolean}){
  return <nav className="portalNav">
    <KeksBrand/>
    <div className="portalNavLinks">
      {NAV.map(([key,href,label])=><a key={key} href={href} className={active===key?'active':''}>{label}</a>)}
      {signedIn&&<LogoutButton/>}
    </div>
  </nav>;
}

function RobotMark(){
  return <svg viewBox="0 0 300 300" role="img" aria-label="KEKS teknoloji maskotu">
    <defs>
      <linearGradient id="robotGold" x1="0" x2="1"><stop offset="0" stopColor="#9e6616"/><stop offset=".45" stopColor="#f4d57c"/><stop offset="1" stopColor="#b97719"/></linearGradient>
      <radialGradient id="robotFace" cx=".4" cy=".3" r=".85"><stop offset="0" stopColor="#fff"/><stop offset=".58" stopColor="#dbe5ee"/><stop offset="1" stopColor="#8291a2"/></radialGradient>
    </defs>
    <circle cx="150" cy="150" r="124" fill="none" stroke="url(#robotGold)" strokeWidth="5"/>
    <ellipse cx="150" cy="150" rx="124" ry="69" fill="none" stroke="url(#robotGold)" strokeWidth="3" transform="rotate(28 150 150)"/>
    <ellipse cx="150" cy="150" rx="124" ry="69" fill="none" stroke="url(#robotGold)" strokeWidth="3" transform="rotate(-28 150 150)"/>
    <circle cx="150" cy="150" r="72" fill="#071d36" stroke="url(#robotGold)" strokeWidth="4"/>
    <path d="M102 143c7-42 29-65 63-65 44 0 69 31 66 77-3 43-35 69-77 69-39 0-60-27-52-81Z" fill="url(#robotFace)"/>
    <path d="M108 140c13-32 33-48 60-48 32 0 52 18 59 48-13-10-30-16-51-16-29 0-51 6-68 16Z" fill="#0a2342"/>
    <circle cx="139" cy="148" r="8" fill="#08213d"/><circle cx="197" cy="148" r="8" fill="#08213d"/>
    <path d="M139 174c13 10 25 14 38 14 16 0 29-6 40-18" fill="none" stroke="#08213d" strokeWidth="7" strokeLinecap="round"/>
    <circle cx="79" cy="66" r="9" fill="#efc767"/><circle cx="233" cy="60" r="9" fill="#efc767"/><circle cx="276" cy="148" r="8" fill="#efc767"/><circle cx="70" cy="218" r="8" fill="#efc767"/><circle cx="226" cy="258" r="8" fill="#efc767"/>
    <path d="M92 250c41 30 99 36 153 3" fill="none" stroke="url(#robotGold)" strokeWidth="12" strokeLinecap="round"/>
  </svg>;
}

function MountainMark(){
  return <svg viewBox="0 0 360 300" role="img" aria-label="Hedefe giden yol">
    <defs>
      <linearGradient id="portalMountain2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#0a2747"/><stop offset=".55" stopColor="#28445f"/><stop offset="1" stopColor="#91754c"/></linearGradient>
      <linearGradient id="portalRoad2" x1="0" x2="1"><stop offset="0" stopColor="#9b651b"/><stop offset=".48" stopColor="#f0ca69"/><stop offset="1" stopColor="#fff1b2"/></linearGradient>
    </defs>
    <path d="M9 281 97 222l45 16 64-92 36 31 53-97 57 201Z" fill="url(#portalMountain2)"/>
    <path d="M95 277c34-17 65-24 88-52 24-31 0-45 24-70 20-21 42-8 55-30 9-16 9-33 13-49" fill="none" stroke="url(#portalRoad2)" strokeWidth="7" strokeLinecap="round"/>
    <path d="M276 70V42" stroke="#f1cb6e" strokeWidth="4"/><path d="M278 42h31l-13 10 13 10h-31Z" fill="#f1cb6e"/>
    <circle cx="276" cy="69" r="8" fill="#fff2b5"/>
  </svg>;
}

export function PortalShell({
  active,eyebrow,title,description,children,meta,wide=false,signedIn=false
}:{
  active?:string;eyebrow:string;title:string;description?:string;children:ReactNode;meta?:ReactNode;wide?:boolean;signedIn?:boolean
}){
  const copy=ROLE_COPY[active||'sistem']||ROLE_COPY.sistem;
  return <main className={'portal portal-'+(active||'default')}>
    <header className="portalHeader portalHeaderBanner">
      <div className={wide?'portalWrap portalWrapWide':'portalWrap'}>
        <KeksNav active={active} signedIn={signedIn}/>

        <div className="portalBanner">
          <aside className="portalSideWords portalSideWordsLeft">
            {copy.left.map(x=><span key={x}>{x}</span>)}
            <i/>
          </aside>

          <div className="portalRobot"><RobotMark/></div>

          <div className="portalBannerCenter">
            <span className="portalEyebrow">{eyebrow}</span>
            <div className="portalWordmark">
              <span>KE</span><span className="portalGoldLetter">K</span><span>S</span>
              <svg className="portalWordmarkArrow" viewBox="0 0 160 90" aria-hidden="true">
                <defs><linearGradient id="portalArrowGold" x1="0" x2="1"><stop offset="0" stopColor="#a76d17"/><stop offset=".48" stopColor="#ffe293"/><stop offset="1" stopColor="#ce9226"/></linearGradient></defs>
                <path d="M5 76C55 70 90 49 126 17" fill="none" stroke="url(#portalArrowGold)" strokeWidth="10" strokeLinecap="round"/>
                <path d="M112 17l37-10-15 34Z" fill="url(#portalArrowGold)"/>
              </svg>
            </div>
            <div className="portalAcademy">AKADEMİ</div>
            <div className="portalPageTitle">
              <h1>{title}</h1>
              {description&&<p>{description}</p>}
            </div>
            {meta&&<div className="portalMeta">{meta}</div>}
          </div>

          <div className="portalMountain">
            <MountainMark/>
            <div className="portalSideWords portalSideWordsRight">
              {copy.right.map(x=><span key={x}>{x}</span>)}
              <i/>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div className={wide?'portalWrap portalWrapWide portalContent':'portalWrap portalContent'}>{children}</div>

    <footer className="portalFooter">
      <div className={wide?'portalWrap portalWrapWide':'portalWrap'}>
        <div className="portalFooterBrand"><strong>KEKS AKADEMİ</strong><span>Enneagram Yöntemiyle Kazandıran Eğitim ve Koçluk Sistemi</span></div>
        <div className="legalFooterLinks" aria-label="Yasal sayfalar">
          <a href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</a>
          <a href="/gizlilik-guvenlik">Gizlilik &amp; Güvenlik</a>
          <a href="/iptal-iade">İptal &amp; İade</a>
          <a href="/iletisim">İletişim</a>
        </div>
      </div>
    </footer>
  </main>;
}

export function PortalSectionTitle({eyebrow,title,description}:{eyebrow?:string;title:string;description?:string}){
  return <div className="portalSectionTitle">{eyebrow&&<span>{eyebrow}</span>}<h2>{title}</h2>{description&&<p>{description}</p>}</div>;
}
