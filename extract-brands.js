const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
// Match the brands array: from "const brands = [" until "];" followed by newline (so we don't stop at "[0];" elsewhere)
const match = s.match(/const brands = (\[[\s\S]*?\];\s*\n)/);
if (!match) throw new Error('brands not found');
const b = eval(match[1].replace(/\];\s*\n?$/, ']'));
const lis = b.map(x => '<li>' + String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</li>').join('\n');
const base = 'https://www.abcspareparts.eu';
const marcheHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marche e produttori | ABCspareparts – Oltre 900 marchi per ricambi industriali</title>
  <meta name="description" content="Elenco completo dei marchi e produttori per cui ABCspareparts distribuisce ricambi industriali MRO: Siemens, Festo, Bosch, ABB, Schneider, Omron e oltre 900 altri.">
  <meta name="keywords" content="marchi ricambi industriali, produttori MRO, ABCspareparts marche, Siemens Festo Bosch ABB ricambi">
  <link rel="canonical" href="${base}/marche.html">
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
    .footer{background:#1e3a5f;color:#fff;padding:1.5rem;text-align:center;margin-top:2rem}
    .footer a{color:#fff;text-decoration:none}
    .footer a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <header class="page-header">
    <div class="container">
      <h1>Marche e produttori</h1>
      <p>Oltre ${b.length} marchi per ricambi industriali. <a href="index.html">Torna alla home</a></p>
    </div>
  </header>
  <main class="brands-section">
    <div class="container">
      <h2>Elenco marchi distribuiti da ABCspareparts</h2>
      <ul class="brands-list">
${lis}
      </ul>
    </div>
  </main>
  <footer class="footer">
    <div class="container">
      <a href="index.html">ABCspareparts</a> &middot; <a href="impressum.html">Impressum</a> &middot; <a href="datenschutz.html">Datenschutz</a>
    </div>
  </footer>
</body>
</html>`;
fs.writeFileSync('marche.html', marcheHtml);
console.log('Count:', b.length, '- marche.html written');
