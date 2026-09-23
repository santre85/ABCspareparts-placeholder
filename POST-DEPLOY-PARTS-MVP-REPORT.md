# POST-DEPLOY PARTS MVP REPORT

- Timestamp: `2026-09-11T11:09:23.462Z`
- Deploy commit: `777dc73a882b0ef5773f092caccbf19f8c155618` (PR #50)
- Live sitemap-parts.xml HTTP: **200** (77 URLs)
- Pages tested: **77**
- Result: **PASS** (77/77)
- Next /parts/ batch: **not started** (await GSC/organic review)
- Cloudflare 301 `/index.html` → `/`: **still open / manual** (see `CLOUDFLARE-REDIRECT-CHECKLIST.md`)

## URL checks

| # | URL | HTTP | Canonical | In sitemap | Result | Errors |
|---|-----|------|-----------|------------|--------|--------|
| 1 | https://abcspareparts.eu/parts/atlas-copco/80701.000507.html | 200 | https://abcspareparts.eu/parts/atlas-copco/80701.000507.html | yes | PASS |  |
| 2 | https://abcspareparts.eu/parts/autronica/v-430-bh200.html | 200 | https://abcspareparts.eu/parts/autronica/v-430-bh200.html | yes | PASS |  |
| 3 | https://abcspareparts.eu/parts/autronica/v-530-bh500.html | 200 | https://abcspareparts.eu/parts/autronica/v-530-bh500.html | yes | PASS |  |
| 4 | https://abcspareparts.eu/parts/baldwin/13144.04.html | 200 | https://abcspareparts.eu/parts/baldwin/13144.04.html | yes | PASS |  |
| 5 | https://abcspareparts.eu/parts/baldwin/13144.05.html | 200 | https://abcspareparts.eu/parts/baldwin/13144.05.html | yes | PASS |  |
| 6 | https://abcspareparts.eu/parts/baldwin/45.877.05.html | 200 | https://abcspareparts.eu/parts/baldwin/45.877.05.html | yes | PASS |  |
| 7 | https://abcspareparts.eu/parts/baumer/en580c.ml-sc10.hh2c1.21160.h-11267453.html | 200 | https://abcspareparts.eu/parts/baumer/en580c.ml-sc10.hh2c1.21160.h-11267453.html | yes | PASS |  |
| 8 | https://abcspareparts.eu/parts/fagor/12023211.html | 200 | https://abcspareparts.eu/parts/fagor/12023211.html | yes | PASS |  |
| 9 | https://abcspareparts.eu/parts/fagor/12024980.html | 200 | https://abcspareparts.eu/parts/fagor/12024980.html | yes | PASS |  |
| 10 | https://abcspareparts.eu/parts/fagor/12025076.html | 200 | https://abcspareparts.eu/parts/fagor/12025076.html | yes | PASS |  |
| 11 | https://abcspareparts.eu/parts/fagor/12049230.html | 200 | https://abcspareparts.eu/parts/fagor/12049230.html | yes | PASS |  |
| 12 | https://abcspareparts.eu/parts/harmsco/guarnizione-coperchio-550-e11.html | 200 | https://abcspareparts.eu/parts/harmsco/guarnizione-coperchio-550-e11.html | yes | PASS |  |
| 13 | https://abcspareparts.eu/parts/hengstler/0634713.html | 200 | https://abcspareparts.eu/parts/hengstler/0634713.html | yes | PASS |  |
| 14 | https://abcspareparts.eu/parts/hengstler/3-520-068.html | 200 | https://abcspareparts.eu/parts/hengstler/3-520-068.html | yes | PASS |  |
| 15 | https://abcspareparts.eu/parts/hengstler/ri58-o-1000as.41tf-f0.html | 200 | https://abcspareparts.eu/parts/hengstler/ri58-o-1000as.41tf-f0.html | yes | PASS |  |
| 16 | https://abcspareparts.eu/parts/herborner/2a.0b.a2.6b.html | 200 | https://abcspareparts.eu/parts/herborner/2a.0b.a2.6b.html | yes | PASS |  |
| 17 | https://abcspareparts.eu/parts/herborner/3d.1l.30.01.html | 200 | https://abcspareparts.eu/parts/herborner/3d.1l.30.01.html | yes | PASS |  |
| 18 | https://abcspareparts.eu/parts/herborner/3e.3f.30.00.html | 200 | https://abcspareparts.eu/parts/herborner/3e.3f.30.00.html | yes | PASS |  |
| 19 | https://abcspareparts.eu/parts/herborner/97.10.08.00.html | 200 | https://abcspareparts.eu/parts/herborner/97.10.08.00.html | yes | PASS |  |
| 20 | https://abcspareparts.eu/parts/herborner/97.18.03.00.html | 200 | https://abcspareparts.eu/parts/herborner/97.18.03.00.html | yes | PASS |  |
| 21 | https://abcspareparts.eu/parts/herborner/lt.0d.11.00.html | 200 | https://abcspareparts.eu/parts/herborner/lt.0d.11.00.html | yes | PASS |  |
| 22 | https://abcspareparts.eu/parts/herborner/rm.03.2d.00.html | 200 | https://abcspareparts.eu/parts/herborner/rm.03.2d.00.html | yes | PASS |  |
| 23 | https://abcspareparts.eu/parts/hi-force-hydraulics/hpr-2h.html | 200 | https://abcspareparts.eu/parts/hi-force-hydraulics/hpr-2h.html | yes | PASS |  |
| 24 | https://abcspareparts.eu/parts/hi-force-hydraulics/pkc50.html | 200 | https://abcspareparts.eu/parts/hi-force-hydraulics/pkc50.html | yes | PASS |  |
| 25 | https://abcspareparts.eu/parts/hubner-elektromaschinen-ag/gt9.06l-420k.html | 200 | https://abcspareparts.eu/parts/hubner-elektromaschinen-ag/gt9.06l-420k.html | yes | PASS |  |
| 26 | https://abcspareparts.eu/parts/humphrey/41024vdc.html | 200 | https://abcspareparts.eu/parts/humphrey/41024vdc.html | yes | PASS |  |
| 27 | https://abcspareparts.eu/parts/konecranes/52294077.html | 200 | https://abcspareparts.eu/parts/konecranes/52294077.html | yes | PASS |  |
| 28 | https://abcspareparts.eu/parts/konecranes/52302509.html | 200 | https://abcspareparts.eu/parts/konecranes/52302509.html | yes | PASS |  |
| 29 | https://abcspareparts.eu/parts/konecranes/52302518.html | 200 | https://abcspareparts.eu/parts/konecranes/52302518.html | yes | PASS |  |
| 30 | https://abcspareparts.eu/parts/konecranes/52589491.html | 200 | https://abcspareparts.eu/parts/konecranes/52589491.html | yes | PASS |  |
| 31 | https://abcspareparts.eu/parts/konecranes/53024331.html | 200 | https://abcspareparts.eu/parts/konecranes/53024331.html | yes | PASS |  |
| 32 | https://abcspareparts.eu/parts/kubler/279383.html | 200 | https://abcspareparts.eu/parts/kubler/279383.html | yes | PASS |  |
| 33 | https://abcspareparts.eu/parts/kuhnke/76.147.92.00.html | 200 | https://abcspareparts.eu/parts/kuhnke/76.147.92.00.html | yes | PASS |  |
| 34 | https://abcspareparts.eu/parts/leuze/53800105.html | 200 | https://abcspareparts.eu/parts/leuze/53800105.html | yes | PASS |  |
| 35 | https://abcspareparts.eu/parts/leuze/53800117.html | 200 | https://abcspareparts.eu/parts/leuze/53800117.html | yes | PASS |  |
| 36 | https://abcspareparts.eu/parts/leuze/rsl410-m.html | 200 | https://abcspareparts.eu/parts/leuze/rsl410-m.html | yes | PASS |  |
| 37 | https://abcspareparts.eu/parts/m-and-s-armaturen/57600-1000300.html | 200 | https://abcspareparts.eu/parts/m-and-s-armaturen/57600-1000300.html | yes | PASS |  |
| 38 | https://abcspareparts.eu/parts/m-plus-s-hydraulic/mms50c.html | 200 | https://abcspareparts.eu/parts/m-plus-s-hydraulic/mms50c.html | yes | PASS |  |
| 39 | https://abcspareparts.eu/parts/mettler-toledo/119106.html | 200 | https://abcspareparts.eu/parts/mettler-toledo/119106.html | yes | PASS |  |
| 40 | https://abcspareparts.eu/parts/mettler-toledo/119171.html | 200 | https://abcspareparts.eu/parts/mettler-toledo/119171.html | yes | PASS |  |
| 41 | https://abcspareparts.eu/parts/mettler-toledo/51119547.html | 200 | https://abcspareparts.eu/parts/mettler-toledo/51119547.html | yes | PASS |  |
| 42 | https://abcspareparts.eu/parts/mettler-toledo/51119999.html | 200 | https://abcspareparts.eu/parts/mettler-toledo/51119999.html | yes | PASS |  |
| 43 | https://abcspareparts.eu/parts/mst/135859.html | 200 | https://abcspareparts.eu/parts/mst/135859.html | yes | PASS |  |
| 44 | https://abcspareparts.eu/parts/mst/149826.html | 200 | https://abcspareparts.eu/parts/mst/149826.html | yes | PASS |  |
| 45 | https://abcspareparts.eu/parts/mst/2485c041.html | 200 | https://abcspareparts.eu/parts/mst/2485c041.html | yes | PASS |  |
| 46 | https://abcspareparts.eu/parts/mst/3175p003.html | 200 | https://abcspareparts.eu/parts/mst/3175p003.html | yes | PASS |  |
| 47 | https://abcspareparts.eu/parts/mst/40701.html | 200 | https://abcspareparts.eu/parts/mst/40701.html | yes | PASS |  |
| 48 | https://abcspareparts.eu/parts/mst/46221.html | 200 | https://abcspareparts.eu/parts/mst/46221.html | yes | PASS |  |
| 49 | https://abcspareparts.eu/parts/mst/49944.html | 200 | https://abcspareparts.eu/parts/mst/49944.html | yes | PASS |  |
| 50 | https://abcspareparts.eu/parts/mst/54204201.html | 200 | https://abcspareparts.eu/parts/mst/54204201.html | yes | PASS |  |
| 51 | https://abcspareparts.eu/parts/mst/54204202.html | 200 | https://abcspareparts.eu/parts/mst/54204202.html | yes | PASS |  |
| 52 | https://abcspareparts.eu/parts/mst/5421114.html | 200 | https://abcspareparts.eu/parts/mst/5421114.html | yes | PASS |  |
| 53 | https://abcspareparts.eu/parts/mst/54211213.html | 200 | https://abcspareparts.eu/parts/mst/54211213.html | yes | PASS |  |
| 54 | https://abcspareparts.eu/parts/mst/54218106.html | 200 | https://abcspareparts.eu/parts/mst/54218106.html | yes | PASS |  |
| 55 | https://abcspareparts.eu/parts/mst/5421897.html | 200 | https://abcspareparts.eu/parts/mst/5421897.html | yes | PASS |  |
| 56 | https://abcspareparts.eu/parts/mst/5421899.html | 200 | https://abcspareparts.eu/parts/mst/5421899.html | yes | PASS |  |
| 57 | https://abcspareparts.eu/parts/ningbo-hongbo-weite-motor-co-ltd/hb18065ha2b.html | 200 | https://abcspareparts.eu/parts/ningbo-hongbo-weite-motor-co-ltd/hb18065ha2b.html | yes | PASS |  |
| 58 | https://abcspareparts.eu/parts/pronomic/220390.html | 200 | https://abcspareparts.eu/parts/pronomic/220390.html | yes | PASS |  |
| 59 | https://abcspareparts.eu/parts/radio-energie/ttn0507re.0.html | 200 | https://abcspareparts.eu/parts/radio-energie/ttn0507re.0.html | yes | PASS |  |
| 60 | https://abcspareparts.eu/parts/renishaw/a-5191-0049.html | 200 | https://abcspareparts.eu/parts/renishaw/a-5191-0049.html | yes | PASS |  |
| 61 | https://abcspareparts.eu/parts/rexroth/a10vso28dfr1-31l-ppa12n.html | 200 | https://abcspareparts.eu/parts/rexroth/a10vso28dfr1-31l-ppa12n.html | yes | PASS |  |
| 62 | https://abcspareparts.eu/parts/roemheld/hbz-500160-100-100.html | 200 | https://abcspareparts.eu/parts/roemheld/hbz-500160-100-100.html | yes | PASS |  |
| 63 | https://abcspareparts.eu/parts/schunk/lm-100-h125-314065.html | 200 | https://abcspareparts.eu/parts/schunk/lm-100-h125-314065.html | yes | PASS |  |
| 64 | https://abcspareparts.eu/parts/schunk/lm-100-h175-314067.html | 200 | https://abcspareparts.eu/parts/schunk/lm-100-h175-314067.html | yes | PASS |  |
| 65 | https://abcspareparts.eu/parts/schunk/lm-50-h75-314058.html | 200 | https://abcspareparts.eu/parts/schunk/lm-50-h75-314058.html | yes | PASS |  |
| 66 | https://abcspareparts.eu/parts/schunk/pgn-plus-64-2-as-371093.html | 200 | https://abcspareparts.eu/parts/schunk/pgn-plus-64-2-as-371093.html | yes | PASS |  |
| 67 | https://abcspareparts.eu/parts/schunk/rm-200-w90-1-313007.html | 200 | https://abcspareparts.eu/parts/schunk/rm-200-w90-1-313007.html | yes | PASS |  |
| 68 | https://abcspareparts.eu/parts/siemens/6av2124-0mc010-ax0.html | 200 | https://abcspareparts.eu/parts/siemens/6av2124-0mc010-ax0.html | yes | PASS |  |
| 69 | https://abcspareparts.eu/parts/spectrex-inc/uf-ir3-flame-detector-ss316-atex-3-4.html | 200 | https://abcspareparts.eu/parts/spectrex-inc/uf-ir3-flame-detector-ss316-atex-3-4.html | yes | PASS |  |
| 70 | https://abcspareparts.eu/parts/steute/1188542.html | 200 | https://abcspareparts.eu/parts/steute/1188542.html | yes | PASS |  |
| 71 | https://abcspareparts.eu/parts/sym-bang/a18065v2hbt-s.html | 200 | https://abcspareparts.eu/parts/sym-bang/a18065v2hbt-s.html | yes | PASS |  |
| 72 | https://abcspareparts.eu/parts/tamagawa/68-2048c-t-l3-12v.html | 200 | https://abcspareparts.eu/parts/tamagawa/68-2048c-t-l3-12v.html | yes | PASS |  |
| 73 | https://abcspareparts.eu/parts/tamagawa/ts5013n61.html | 200 | https://abcspareparts.eu/parts/tamagawa/ts5013n61.html | yes | PASS |  |
| 74 | https://abcspareparts.eu/parts/tokheim/941828.html | 200 | https://abcspareparts.eu/parts/tokheim/941828.html | yes | PASS |  |
| 75 | https://abcspareparts.eu/parts/tokheim/947944-004.html | 200 | https://abcspareparts.eu/parts/tokheim/947944-004.html | yes | PASS |  |
| 76 | https://abcspareparts.eu/parts/zollern/1199181.html | 200 | https://abcspareparts.eu/parts/zollern/1199181.html | yes | PASS |  |
| 77 | https://abcspareparts.eu/parts/zollern/1199182.html | 200 | https://abcspareparts.eu/parts/zollern/1199182.html | yes | PASS |  |

