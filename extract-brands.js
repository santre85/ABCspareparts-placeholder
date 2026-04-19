const fs = require('fs');
const { assignUniqueSlugs } = require('./brand-slug.js');
const s = fs.readFileSync('index.html', 'utf8');
// Match the brands array: from "const brands = [" until "];" followed by newline (so we don't stop at "[0];" elsewhere)
const match = s.match(/const brands = (\[[\s\S]*?\];\s*\n)/);
if (!match) throw new Error('brands not found');
const b = eval(match[1].replace(/\];\s*\n?$/, ']'));
const slugByBrand = new Map(assignUniqueSlugs(b).map((r) => [r.brand, r.slug]));
const lis = b.map((x) => {
  const name = String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const slug = slugByBrand.get(x);
  return '<li><a href="marche/' + slug + '.html">' + name + '</a></li>';
}).join('\n');
const base = 'https://www.abcspareparts.eu';
const marcheHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marche e produttori | ABCspareparts – Oltre ${b.length} marchi per ricambi industriali</title>
  <meta name="description" content="Elenco completo dei marchi e produttori per cui ABCspareparts distribuisce ricambi industriali MRO: Siemens, Festo, Bosch, ABB, Schneider, Omron e oltre ${b.length} altri.">
  <meta name="keywords" content="marchi ricambi industriali, produttori MRO, ABCspareparts marche, Siemens Festo Bosch ABB ricambi">
  <link rel="canonical" href="${base}/marche.html">
  <link rel="alternate" hreflang="x-default" href="${base}/marche.html">
  <link rel="alternate" hreflang="de" href="${base}/marche.html?lang=de">
  <link rel="alternate" hreflang="en" href="${base}/marche.html?lang=en">
  <link rel="alternate" hreflang="it" href="${base}/marche.html?lang=it">
  <link rel="alternate" hreflang="es" href="${base}/marche.html?lang=es">
  <link rel="alternate" hreflang="fr" href="${base}/marche.html?lang=fr">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${base}/marche.html">
  <meta property="og:title" content="Brands and manufacturers | ABCspareparts – ${b.length}+ industrial spare parts brands">
  <meta property="og:description" content="Full list of brands distributed by ABCspareparts: Siemens, Festo, Bosch, ABB, Schneider, Omron and ${b.length}+ more. MRO industrial spare parts.">
  <meta property="og:image" content="${base}/logo.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Brands and manufacturers | ABCspareparts – ${b.length}+ brands">
  <meta name="twitter:description" content="Full list of brands distributed by ABCspareparts. MRO industrial spare parts.">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"ItemList","name":"Industrial spare parts brands distributed by ABCspareparts","description":"List of ${b.length}+ manufacturers and brands for MRO industrial spare parts","numberOfItems":${b.length},"url":"${base}/marche.html"}
  </script>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${base}/"},{"@type":"ListItem","position":2,"name":"Marche","item":"${base}/marche.html"}]}
  </script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;color:#333;background:#fff}
    .container{max-width:900px;margin:0 auto;padding:0 1.5rem}
    .page-header{background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;padding:2.5rem 1.5rem;text-align:center}
    .page-header h1{font-size:1.75rem;margin-bottom:0.5rem}
    .page-header p{opacity:0.95;font-size:1rem}
    .page-header a{color:#e67e22;text-decoration:none;font-weight:600}
    .page-header a:hover{text-decoration:underline}
    .brands-section{padding:2rem 1.5rem}
    .brands-section h2{font-size:1.35rem;color:#1e3a5f;margin-bottom:1.25rem}
    .brands-list{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:0.35rem 1.5rem;column-fill:auto}
    .brands-list li{padding:0.2rem 0;font-size:0.9rem;color:#444;border-bottom:1px solid #eee}
    .brands-list a{color:#1e3a5f;text-decoration:none;font-weight:600;border-bottom:1px solid #c5d4e3}
    .brands-list a:hover{color:#e67e22;border-bottom-color:#e67e22}
    .footer{background:#1e3a5f;color:#fff;padding:1.5rem;text-align:center;margin-top:2rem}
    .footer a{color:#fff;text-decoration:none}
    .footer a:hover{text-decoration:underline}
    .language-selector{position:fixed;top:1rem;right:1rem;z-index:1000}
    .language-selector select{padding:0.5rem 2rem 0.5rem 0.75rem;font-size:0.9rem;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer}
  </style>
</head>
<body>
  <div class="language-selector">
    <select id="languageSelect">
      <option value="de">🇩🇪 Deutsch</option>
      <option value="en">🇬🇧 English</option>
      <option value="it">🇮🇹 Italiano</option>
      <option value="es">🇪🇸 Español</option>
      <option value="fr">🇫🇷 Français</option>
    </select>
  </div>
  <header class="page-header">
    <div class="container">
      <h1 data-i18n="marche_h1">Marche e produttori</h1>
      <p data-i18n="marche_subtitle">Oltre ${b.length} marchi per ricambi industriali. <a href="index.html">Torna alla home</a></p>
    </div>
  </header>
  <main class="brands-section">
    <div class="container">
      <h2 data-i18n="marche_list_title">Elenco marchi distribuiti da ABCspareparts</h2>
      <ul class="brands-list">
${lis}
      </ul>
    </div>
  </main>
  <footer class="footer">
    <div class="container">
      <a href="index.html" data-i18n="marche_footer_home">ABCspareparts</a> &middot; <a href="impressum.html" data-i18n="marche_footer_imprint">Impressum</a> &middot; <a href="datenschutz.html" data-i18n="marche_footer_privacy">Datenschutz</a>
    </div>
  </footer>
  <script>
  (function(){
    var translations = {
      de: { marche_h1: 'Marken und Hersteller', marche_subtitle: 'Über ${b.length} Marken für Industrieersatzteile. <a href="index.html">Zur Startseite</a>', marche_list_title: 'Liste der von ABCspareparts vertriebenen Marken', marche_footer_home: 'ABCspareparts', marche_footer_imprint: 'Impressum', marche_footer_privacy: 'Datenschutz' },
      en: { marche_h1: 'Brands and manufacturers', marche_subtitle: 'Over ${b.length} brands for industrial spare parts. <a href="index.html">Back to home</a>', marche_list_title: 'List of brands distributed by ABCspareparts', marche_footer_home: 'ABCspareparts', marche_footer_imprint: 'Imprint', marche_footer_privacy: 'Privacy' },
      it: { marche_h1: 'Marche e produttori', marche_subtitle: 'Oltre ${b.length} marchi per ricambi industriali. <a href="index.html">Torna alla home</a>', marche_list_title: 'Elenco marchi distribuiti da ABCspareparts', marche_footer_home: 'ABCspareparts', marche_footer_imprint: 'Impressum', marche_footer_privacy: 'Privacy' },
      es: { marche_h1: 'Marcas y fabricantes', marche_subtitle: 'Más de ${b.length} marcas de recambios industriales. <a href="index.html">Volver al inicio</a>', marche_list_title: 'Listado de marcas distribuidas por ABCspareparts', marche_footer_home: 'ABCspareparts', marche_footer_imprint: 'Aviso legal', marche_footer_privacy: 'Privacidad' },
      fr: { marche_h1: 'Marques et fabricants', marche_subtitle: 'Plus de ${b.length} marques de pièces industrielles. <a href="index.html">Retour à l\\'accueil</a>', marche_list_title: 'Liste des marques distribuées par ABCspareparts', marche_footer_home: 'ABCspareparts', marche_footer_imprint: 'Mentions légales', marche_footer_privacy: 'Confidentialité' }
    };
    function getLangFromUrl(){ var p = new URLSearchParams(window.location.search); var l = p.get('lang'); return l && ['de','en','it','es','fr'].indexOf(l)!==-1 ? l : null; }
    function getCurrentLang(){ return getLangFromUrl() || (typeof localStorage!=='undefined' && localStorage.getItem('lang')) || (navigator.language && navigator.language.split('-')[0]) || 'de'; }
    function updateLinksWithLang(lang){ var pages = ['index.html','marche.html','impressum.html','datenschutz.html','agb.html','versand.html','cookies.html']; function internalPage(base){ if(pages.indexOf(base)!==-1) return true; return /^marche\\/[^/]+\\.html$/i.test(base);} document.querySelectorAll('a[href]').forEach(function(a){ var h = a.getAttribute('href')||''; if(h.indexOf('#')===0||h.indexOf('mailto:')===0||h.indexOf('tel:')===0||h.indexOf('https://wa.me')===0) return; var parts = h.split('#'); var base = parts[0].split('?')[0]; if(internalPage(base)) a.href = base + '?lang=' + lang + (parts[1] ? '#'+parts[1] : ''); }); }
    function changeLanguage(lang){ var t = translations[lang] || translations.de; document.querySelectorAll('[data-i18n]').forEach(function(el){ var k = el.getAttribute('data-i18n'); if(t[k]) el.innerHTML = t[k]; }); document.documentElement.lang = lang; try{ localStorage.setItem('lang', lang); }catch(e){} updateLinksWithLang(lang); }
    document.addEventListener('DOMContentLoaded', function(){ var raw = getCurrentLang(); var lang = ['de','en','it','es','fr'].indexOf(raw)!==-1 ? raw : 'de'; var sel = document.getElementById('languageSelect'); if(sel) sel.value = lang; changeLanguage(lang); if(sel) sel.addEventListener('change', function(){ changeLanguage(this.value); }); });
  })();
  </script>
</body>
</html>`;
fs.writeFileSync('marche.html', marcheHtml);
console.log('Count:', b.length, '- marche.html written');
