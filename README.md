# Kağıt

Cloudflare Workers üzerinde çalışan bir pastebin. Canlısı: [kagit.org](https://kagit.org).

Bu proje [SharzyL/pastebin-worker](https://github.com/SharzyL/pastebin-worker)'ın bir fork'u — özgün mimari ve
özelliklerin çoğu oradan geliyor, teşekkürler. Bu fork'a eklenenler:

- **Çok dilli arayüz**: Türkçe, Almanca, Azerbaycanca, İngilizce. Dil, tarayıcı diline göre otomatik seçiliyor
  (sunucu tarafında `Accept-Language`, istemci tarafında `navigator.language`), sağ üstteki dil düğmesinden elle de
  değiştirilebiliyor.
- **Okunduktan sonra sil (burn after read)**: bir yapıştırma, ilk gerçek okumadan hemen sonra kalıcı olarak
  siliniyor — link yalnızca bir kez işe yarıyor.
- **Kağıt/mürekkep temalı görsel kimlik**: aydınlık/karanlık mod için ayrı renk paleti, yeni favicon.

**Felsefe** (orijinalden): zahmetsiz deploy, dostane CLI kullanımı, zengin özellik seti.

**Özellikler**:

1. Yapıştırmanızı 4 karakterlik kısa bir URL ile, ya da kendi seçtiğiniz bir isimle paylaşın.
1. highlight.js ile **sözdizimi vurgulama**.
1. İstemci taraflı şifreleme.
1. **Markdown** dosyalarını render edilmiş HTML olarak paylaşın.
1. URL kısaltıcı.
1. `Content-Type` ve `Content-Disposition` için akıllı ve ayarlanabilir davranış.
1. Okunduktan sonra otomatik silinen (burn after read) yapıştırmalar.

## Kullanım

1. Yapıştırmanızı doğrudan site üzerinden ([kagit.org](https://kagit.org)) oluşturabilir, güncelleyebilir,
   silebilirsiniz.

2. Kullanışlı bir HTTP API'si de var. Detaylar için [API referansı](doc/api.md)'na bakın; `curl` gibi araçlarla
   komut satırından kolayca çağırabilirsiniz. Tek bir istek gövdesi Cloudflare tarafından 100 MB ile
   sınırlandırılmış (bundan büyük gövdeler worker hiç çalışmadan `413` ile reddedilir) — daha büyük dosyalar için
   siteyi ya da otomatik olarak parçalı yükleme yapan `pb` CLI'ını kullanın.

3. [pb](/scripts) — komut satırından kullanımı kolaylaştıran bir Python betiği (Python 3.9+ ve `requests` paketi
   gerekir); 5 MiB üzerinde otomatik olarak parçalı yüklemeye geçer ve ilerleme çubuğu gösterir.

4. [doc/skill.md](doc/skill.md) — API'nin AI ajanlarına yönelik, özet bir paketlemesi. Kodlama ajanınıza verin,
   yapıştırma yükleyip indirebilsin ve yönetebilsin.

## Deploy

Alan adınız Cloudflare üzerinde barınıyorsa kendi deploy'unuzu da yapabilirsiniz.

1. `node` ve `pnpm` kurun.

2. Depoyu klonlayıp içine girin.

3. Bir KV namespace ve R2 bucket oluşturun, ID/isimlerini `wrangler.toml`'a yazın.

```console
$ pnpm wrangler kv namespace create PB
$ pnpm wrangler r2 bucket create <isim>
```

4. `wrangler.toml`'daki diğer alanları düzenleyin — yorum satırları ne yapmanız gerektiğini anlatıyor.

5. Cloudflare'e giriş yapıp deploy edin:

```console
$ pnpm install
$ pnpm wrangler login
$ pnpm build:frontend
$ pnpm deploy
```

6. Keyfini çıkarın!

## Maliyet

Servis Cloudflare Workers, Workers KV ve R2 üzerinde çalışıyor. Her birinin ücretsiz bir katmanı var; üzerine
çıkınca yalnızca kullandığınız kadar ödersiniz. Aşağıdaki rakamlar yazıldığı tarih itibarıyla doğru —
**fiyatlar değişebilir, güvenmeden önce resmi fiyatlandırma sayfalarından teyit edin**:

- **[Workers](https://developers.cloudflare.com/workers/platform/pricing/)** — istek yönlendirme ve çalıştırma.
  Egress ücretsiz.
  - Ücretsiz: günde 100 bin istek, çağrı başına 10 ms CPU.
  - Ücretli (aylık $5 taban): ayda dahil 10M istek + 30M ms CPU, sonrası ek her milyon istek için $0.30 ve ek her
    milyon CPU-ms için $0.02. Aşağıdaki daha yüksek KV limitlerini de açar (KV'nin ayrı bir ücretli planı yok).
- **[Workers KV](https://developers.cloudflare.com/kv/platform/pricing/)** — küçük yapıştırmalar ve
  yapıştırma-başı metadata.
  - Ücretsiz (günlük, 00:00 UTC'de sıfırlanır): 100 bin okuma, 1 bin yazma, 1 bin silme, 1 bin liste işlemi, 1 GB
    depolama.
  - Ücretli (aylık + aşım): 10M okuma (ek her milyon $0.50), 1M yazma ($5/M), 1M silme ($5/M), 1M liste işlemi
    ($5/M), 1 GB depolama (ek her GB-ay $0.50).
- **[R2](https://developers.cloudflare.com/r2/pricing/)** — `R2_THRESHOLD` üzerindeki yapıştırma içeriği. Egress
  ücretsiz. Class A işlem = yükleme (`PutObject`); Class B işlem = indirme (`GetObject`). Cloudflare depolamayı bir
  sonraki GB-aya yuvarlar.
  - Ücretsiz: 10 GB-ay depolama, ayda 1M Class A işlem, ayda 10M Class B işlem.
  - Standart ücretli: GB-ay başına $0.015 depolama, milyon Class A işlem başına $4.50, milyon Class B işlem başına
    $0.36.
- **[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)** — opsiyonel,
  `wrangler.toml`'da açılmadıkça kapalı.
  - Ücretsiz: günde 200 bin olay, 3 gün saklama.
  - Ücretli: ayda dahil 20M olay + ek her milyon için $0.60, 7 gün saklama.

Maliyet esas olarak şunlarla ölçekleniyor: büyük dosya trafiği (R2 işlemleri + depolama), yüksek hacimli okumalar
(Workers istekleri + KV okumaları), ve ayrıntılı loglama (Workers Logs olayları).

**Özetle — her katman rahatça neyi kaldırır**:

- **Ücretsiz katman — kişisel bir pastebin.** Sınırlayıcı olan KV yazmaları (**günde 1 bin yükleme**) ve
  KV/Workers okumaları (**günde ~100 bin erişim**); R2'de küçük yapıştırmalar için **1 GB**, büyük dosyalar için
  **10 GB** depolama. Bireysel ya da küçük ekip kullanımı için fazlasıyla yeterli.
- **Aylık $5 ücretli plan — küçük bir genel/topluluk servisi.** Aylık dahil KV kotası içinde kalarak günde
  yaklaşık **~33 bin yükleme** ve **~333 bin erişim**; Workers istekleri ayda ~10M'a (günde ~333 bin) kadar dahil.
  R2 depolama ve işlemleri önce kendi ücretsiz katmanından karşılanır, sonrasında orta düzey trafikte bile sadece
  birkaç dolar ekler.

> [!NOTE]
> Küçük yapıştırmalar (R2 değil) KV'ye gider, böylece çöp toplama ucuz kalır. KV anahtar bazlı son kullanma
> tarihini destekliyor, süresi dolan yapıştırmalar kendiliğinden kayboluyor. R2'nin yerleşik bir son kullanma
> mekanizması yok, bu yüzden süresi dolan nesneleri temizlemek bucket büyüdükçe pahalılaşan periyodik
> listeleme/tarama gerektirir.

## Kimlik doğrulama

Özel bir deploy istiyorsanız (yalnızca siz yükleyebilesiniz, ama herkes okuyabilsin), `wrangler.toml`'a şunu ekleyin:

```toml
[vars.BASIC_AUTH]
user1 = "$2b$08$i/yH1TSIGWUNQVsxPrcVUeR0hsGioFNf3.OeHdYzxwjzLH/hzoY.i"
user2 = "$2b$08$KeVnmXoMuRjNHKQjDHppEeXAf5lTLv9HMJCTlKW5uvRcEG5LOdBpO"
```

Parolalar bcrypt2 ile hashlenmiş olmalı. `./scripts/bcrypt.js`'i çalıştırarak hashli parola üretebilirsiniz.

Bundan sonra her POST isteği ve her statik sayfa erişimi, yukarıdaki kullanıcı-parola çiftlerinden biriyle HTTP
basic auth ister. Örnek:

```console
$ curl example-pb.com
HTTP basic auth is required

$ curl -Fc=@/path/to/file example-pb.com
HTTP basic auth is required

$ curl -u admin1:wrong-passwd -Fc=@/path/to/file example-pb.com
Error 401: incorrect passwd for basic auth

$ curl -u admin1:this-is-passwd-1 -Fc=@/path/to/file example-pb.com
{
  "url": "https://example-pb.com/YCDX",
  "admin": "https://example-pb.com/YCDX:Sij23HwbMjeZwKznY3K5trG8",
  "isPrivate": false
}
```

## Yönetim

Bir yapıştırmayı sil:

```console
$ pnpm delete-paste <yapıştırma-adı>
```

Yapıştırmaları listele:

```console
$ pnpm -s wrangler kv key list --binding PB > kv_list.json
```

## Geliştirme

Frontend ve worker kodu ayrı build edilir. Frontend için bir Vite dev sunucusu başlatmak için:

```console
$ pnpm dev:frontend
```

Backend worker'ı geliştirmek için önce frontend'in dev sürümünü build edin:

```console
$ pnpm build:frontend:dev
```

Sonra yerel worker'ı başlatın:

```console
$ pnpm dev
```

`build:frontend:dev` ile `build:frontend` arasındaki fark: ilki API uç noktasını deploy URL'inize, ikincisi yerel
worker adresi olan `http://localhost:8787`'ye yönlendirir.

Testleri çalıştır:

```console
$ pnpm test
```

Kapsam raporuyla testleri çalıştır:

```console
$ pnpm coverage
```

Kod göndermeden önce eslint ve prettier kontrolünü unutmayın:

```console
$ pnpm fmt
$ pnpm lint
$ pnpm typecheck
```
