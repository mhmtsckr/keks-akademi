import {LogoutButton} from './LogoutButton';

export function SiteMenu({signedIn=false}:{signedIn?:boolean}){
  return <details className="siteMenu">
    <summary className="siteMenuTrigger" aria-label="Menüyü aç">
      <span/><span/><span/>
    </summary>

    <div className="siteMenuPanel">
      <div className="siteMenuHead">
        <div>
          <span>KEKS AKADEMİ</span>
          <strong>Menü</strong>
        </div>
      </div>

      <nav className="siteMenuNav" aria-label="Ana menü">
        <a href="/abonelik-planlari">Paketler <span>→</span></a>
        <a href="/sistem">Sistem <span>→</span></a>

        <details className="siteMenuGroup">
          <summary>Kaydol <span>+</span></summary>
          <div className="siteMenuSub">
            <a href="/kayit#ogrenci"><b>Öğrenci</b><small>Öğrenci hesabı oluştur</small></a>
            <a href="/kayit#koc"><b>KEKS Partner Koç</b><small>Partner Koç hesabı oluştur</small></a>
            <a href="/kayit#veli"><b>Veli</b><small>Veli erişimini nasıl oluşturacağını gör</small></a>
          </div>
        </details>

        <details className="siteMenuGroup">
          <summary>Giriş Yap <span>+</span></summary>
          <div className="siteMenuSub">
            <a href="/giris#ogrenci"><b>Öğrenci</b><small>Öğrenci paneline giriş</small></a>
            <a href="/giris#koc"><b>KEKS Partner Koç</b><small>Partner Koç paneline giriş</small></a>
            <a href="/giris#veli"><b>Veli</b><small>Veli paneline giriş</small></a>
          </div>
        </details>

        <a href="/hakkimizda">Hakkımızda <span>→</span></a>
      </nav>

      {signedIn&&<div className="siteMenuSession"><LogoutButton/></div>}
    </div>
  </details>;
}
