# KEKS Akademi — yetkilendirilmiş Vercel CLI üretim yedeği

Bu depo iki yayın mekanizması içerir:

- Normal yol: GitHub main -> TypeScript -> birim testleri -> PostgreSQL entegrasyon testleri -> üretim derlemesi -> CI onaylı release işareti -> Vercel Git entegrasyonu.
- Yedek yol: GitHub Actions > **Manual Vercel CLI Production Fallback** > **Run workflow**. Yalnızca **main** dalında, mevcut CI onaylı commit işaretiyle ve **production** ortamı onayından sonra çalışır.

## Tek seferlik yetkilendirme

1. Vercel Dashboard > Settings > Tokens ekranında KEKS projesini yöneten ekip için erişimi asgari düzeyle sınırlandırılmış bir Vercel access token oluşturun.
2. GitHub > `mhmtsckr/keks-akademi` > Settings > Environments > **New environment** bölümünde adı tam olarak `production` olan bir environment oluşturun (varsa onu kullanın).
3. `production` environment için **Required reviewers** seçin ve **Deployment branches and tags** kuralında sadece `main` dalına izin verin. Bu kontrolleri boş bırakmayın.
4. Aynı environment > **Environment secrets** > **Add secret** altında `VERCEL_TOKEN` adında bir secret oluşturun, Vercel token değerini **doğrudan GitHub'a** girin. Token değerini kaynak koda, ekran görüntüsüne, sohbet mesajına veya GitHub Actions loglarına koymayın.
5. GitHub > Actions > **Manual Vercel CLI Production Fallback** > **Run workflow**; branch `main`, Reason örneği `Normal Vercel Git yayını gecikti, CI onaylı sürümü üretime al`.

## Güvenlik ve kapsam

- Hedef Vercel takım ID'si: `team_BK4Ds9K80dGgUs0ZrEUISgXX`.
- Hedef proje ID'si: `prj_6CPV0q5U4rcGZcqQC0bOydwerR9I`.
- CLI sürümü sabit: `vercel@65.12.1`; güncellemeden önce yeni sürüm kontrol edilmelidir.
- GitHub Actions `production` ortamı token'ı işe başlarken sağlar; token Git'te saklanmaz.
- Workflow elle çalışır; otomatik yayın veya kota aşıldığında tekrar tekrar deneme yapmaz.
- `deploy-trigger.txt` içindeki CI onaylı source SHA ile son `main` commit mesajı aynı olmak zorundadır. Rastgele commit, PR veya onaysız dal yayınlanamaz.
- CLI, normal Vercel API limitlerinden muaf değildir. `402 api-deployments-free-per-day` hatası platform limitini belirtir; bu workflow limitin **üstesinden gelmez**. Kota yenilenmeli veya Vercel hesabı üzerinden kota sorunu çözülmelidir.
- Vercel tarafında zaten aynı commit `READY` ve üretim alan adına bağlıysa yedek workflow'u gereksiz yere çalıştırmayın.

## Geliştirici bilgisayarı

Geliştiricinin kendi cihazında da isteğe bağlı olarak aynı CLI sürümü kullanılabilir:

```bash
npm install --global vercel@65.12.1
vercel login
vercel link
vercel --version
```

`vercel login` yalnızca geliştiricinin kendi etkileşimli terminalinde yapılmalıdır. Herhangi bir kimlik doğrulama anahtarı ChatGPT'ye gönderilmemelidir. Yerel CLI oturumu ChatGPT'nin çalışma ortamına aktarılmaz.

## Geri alma ve operasyon

Yeni üretim dağıtımı problem çıkarırsa Vercel Dashboard > Deployments bölümünden son çalışan üretim sürümünü seçip platformun Promote/Rollback akışıyla geri dönün. Geri alma kararı vermeden önce çalışma zamanı hatalarını ve öğrenci/koç giriş akışlarını kontrol edin.

Bu dokümanın repo ortamını oluşturması **secret'ın eklendiği veya dağıtımın çalıştığı anlamına gelmez**. GitHub environment korumaları ve Vercel token'ı hesap sahibi tarafından güvenli arayüzde tanımlanmalıdır.
