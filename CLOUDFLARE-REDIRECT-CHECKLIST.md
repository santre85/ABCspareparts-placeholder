# Cloudflare — checklist redirect HTTP 301

## Obiettivo

```
https://abcspareparts.eu/index.html  →  301  →  https://abcspareparts.eu/
```

GitHub Pages **non** esegue `_redirects` / `.htaccess`. Serve CDN (Cloudflare) o reverse proxy.

## Prerequisiti DNS (bloccanti se non fatti)

1. Dominio `abcspareparts.eu` con **nameserver Cloudflare** (non solo record A arancioni mentre NS restano Gandi).
2. In Cloudflare DNS: status zona **Active**.
3. Record `@` / `www` → GitHub Pages, proxy **arancione** (proxied).
4. Verifica pubblica: header `server` / `cf-ray` da Cloudflare (non solo `GitHub.com` senza CF).

Finché i NS pubblici restano Gandi, le Redirect Rules Cloudflare **non** sono live.

## Redirect Rule (dopo Active)

1. Cloudflare Dashboard → **Rules** → **Redirect Rules** → Create rule  
2. Nome: `apex-index-html-to-root`  
3. If incoming request matches:
   - Field: **URI Path**
   - Operator: **equals**
   - Value: `/index.html`
4. Then:
   - **Dynamic** o Static URL: `https://abcspareparts.eu/`
   - Status code: **301**
   - Preserve query string: **No** (non necessario)
5. Place rule **highest priority** tra i redirect SEO.
6. Deploy.

### Variante (Page Rule legacy — sconsigliata se Redirect Rules disponibili)

- URL: `abcspareparts.eu/index.html`
- Setting: Forwarding URL — **301** — `https://abcspareparts.eu/`

## Verifica

```bash
curl -sI https://abcspareparts.eu/index.html | head -20
# Expect: HTTP/2 301
# Location: https://abcspareparts.eu/
```

Poi Google Search Console → URL Inspection su entrambe le URL.

## Cosa NON fare

- Non soft-redirect JS-only come unica soluzione (già presente; insufficiente per SEO).
- Non 302.
- Non redirectare l’intera `/` altrove.
- Non aggiungere mass-redirect su `?part=` / `?lang=` (canonical HTML gestisce i duplicati).

## File di riferimento in repo

- `_redirects` (documentazione / Netlify-style; **non** applicato da GitHub Pages)
- `.htaccess.example`
- `nginx-seo-redirects.example.conf`
