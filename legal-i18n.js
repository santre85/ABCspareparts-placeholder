/* Legal pages i18n - shared across impressum, datenschutz, agb, versand, cookies */

const LEGAL_COMMON = {
  de: { nav_home: "Home", nav_impressum: "Impressum", nav_datenschutz: "Datenschutz", nav_agb: "AGB", nav_versand: "Versand", nav_cookies: "Cookies", footer_rights: "Alle Rechte vorbehalten." },
  en: { nav_home: "Home", nav_impressum: "Imprint", nav_datenschutz: "Privacy", nav_agb: "Terms", nav_versand: "Shipping", nav_cookies: "Cookies", footer_rights: "All rights reserved." },
  it: { nav_home: "Home", nav_impressum: "Impressum", nav_datenschutz: "Privacy", nav_agb: "Condizioni", nav_versand: "Spedizione", nav_cookies: "Cookie", footer_rights: "Tutti i diritti riservati." },
  es: { nav_home: "Home", nav_impressum: "Aviso legal", nav_datenschutz: "Privacidad", nav_agb: "Términos", nav_versand: "Envío", nav_cookies: "Cookies", footer_rights: "Todos los derechos reservados." },
  fr: { nav_home: "Accueil", nav_impressum: "Mentions légales", nav_datenschutz: "Confidentialité", nav_agb: "CGV", nav_versand: "Livraison", nav_cookies: "Cookies", footer_rights: "Tous droits réservés." }
};

const LEGAL_PAGES = {
  impressum: {
    de: {
      h1: "Impressum",
      subtitle: "Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)",
      s1_title: "Titel und Kontakt",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Deutschland",
      s2_title: "Kontakt",
      s2_list: "<li>Telefon: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li><li>WhatsApp: +49 152 22466077</li>",
      s3_title: "Öffnungszeiten",
      s3_list: "<li>Montag - Freitag: 09:00 - 18:00</li><li>Samstag: 10:00 - 14:00</li><li>Sonntag: Geschlossen</li>",
      s4_title: "Umsatzsteuer-ID",
      s4_content: "Umsatzsteuer-ID gemäß §27a UStG: DE457964828",
      s4_note: "<strong>Hinweis für Kleinunternehmer:</strong> Als Kleinunternehmer im Sinne des § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.",
      s5_title: "Handelsregister",
      s5_content: "Nicht im Handelsregister eingetragen (Einzelunternehmen/Kleinunternehmen).",
      s6_title: "Verantwortlich für den Inhalt",
      s6_intro: "Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV:",
      s6_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Deutschland",
      s7_title: "Haftungsausschluss",
      s7a_title: "Haftung für Inhalte",
      s7a_content: "Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen gemäß § 7 Abs.1 DDG verantwortlich.",
      s7b_title: "Haftung für Links",
      s7b_content: "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.",
      s7c_title: "Urheberrecht",
      s7c_content: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.",
      s7d_title: "Streitschlichtung",
      s7d_content: "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      s8_title: "Produktsicherheit und Rückverfolgbarkeit",
      s8_intro: "Gemäß der EU-Verordnung 2023/988 (General Product Safety Regulation - GPSR):",
      s8_label: "Produktverantwortlicher in der EU:",
      s8_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Deutschland<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>"
    },
    en: {
      h1: "Legal Information / Imprint",
      subtitle: "Information pursuant to § 5 DDG (Digital Services Act)",
      s1_title: "Owner and Contact",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Germany",
      s2_title: "Contact",
      s2_list: "<li>Phone: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li><li>WhatsApp: +49 152 22466077</li>",
      s3_title: "Opening Hours",
      s3_list: "<li>Monday - Friday: 09:00 - 18:00</li><li>Saturday: 10:00 - 14:00</li><li>Sunday: Closed</li>",
      s4_title: "VAT ID",
      s4_content: "VAT ID according to §27a UStG: DE457964828",
      s4_note: "<strong>Note for small businesses:</strong> As a small business under § 19 Abs. 1 UStG, no VAT is charged.",
      s5_title: "Commercial Register",
      s5_content: "Not registered in the commercial register (sole proprietorship/small business).",
      s6_title: "Responsible for Content",
      s6_intro: "Responsible for content pursuant to § 55 Abs. 2 RStV:",
      s6_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Germany",
      s7_title: "Disclaimer",
      s7a_title: "Liability for Content",
      s7a_content: "The contents of our pages were created with the greatest care. However, we cannot guarantee the accuracy, completeness and timeliness of the content. As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7 Abs.1 DDG.",
      s7b_title: "Liability for Links",
      s7b_content: "Our offer contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for this external content.",
      s7c_title: "Copyright",
      s7c_content: "The content and works created by the site operators on these pages are subject to German copyright law.",
      s7d_title: "Dispute Resolution",
      s7d_content: "We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.",
      s8_title: "Product Safety and Traceability",
      s8_intro: "According to EU Regulation 2023/988 (General Product Safety Regulation - GPSR):",
      s8_label: "Product Responsible in the EU:",
      s8_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Germany<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>"
    },
    it: {
      h1: "Informazioni Legali / Impressum",
      subtitle: "Informazioni ai sensi del § 5 DDG (Legge sui Servizi Digitali)",
      s1_title: "Titolare e Contatti",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Germania",
      s2_title: "Contatti",
      s2_list: "<li>Telefono: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li><li>WhatsApp: +49 152 22466077</li>",
      s3_title: "Orari di Apertura",
      s3_list: "<li>Lunedì - Venerdì: 09:00 - 18:00</li><li>Sabato: 10:00 - 14:00</li><li>Domenica: Chiuso</li>",
      s4_title: "Partita IVA",
      s4_content: "Partita IVA secondo §27a UStG: DE457964828",
      s4_note: "<strong>Nota per piccole imprese:</strong> In qualità di piccola impresa ai sensi del § 19 Abs. 1 UStG (Legge tedesca sull'IVA), non viene addebitata l'IVA.",
      s5_title: "Registro delle Imprese",
      s5_content: "Non iscritto al registro delle imprese (ditta individuale/piccola impresa).",
      s6_title: "Responsabile dei Contenuti",
      s6_intro: "Responsabile dei contenuti secondo § 55 Abs. 2 RStV:",
      s6_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Germania",
      s7_title: "Esclusione di Responsabilità",
      s7a_title: "Responsabilità per i Contenuti",
      s7a_content: "I contenuti delle nostre pagine sono stati creati con la massima cura. Tuttavia, non possiamo garantire l'accuratezza, completezza e attualità dei contenuti. Come fornitore di servizi, siamo responsabili dei nostri contenuti su queste pagine secondo le leggi generali ai sensi del § 7 Abs.1 DDG.",
      s7b_title: "Responsabilità per i Link",
      s7b_content: "La nostra offerta contiene link a siti web esterni di terze parti sui cui contenuti non abbiamo alcun controllo. Pertanto, non possiamo assumere alcuna responsabilità per questi contenuti esterni.",
      s7c_title: "Copyright",
      s7c_content: "I contenuti e le opere creati dagli operatori del sito su queste pagine sono soggetti alla legge tedesca sul copyright.",
      s7d_title: "Risoluzione delle Controversie",
      s7d_content: "Non siamo disposti né obbligati a partecipare a procedure di risoluzione delle controversie davanti a un organismo di conciliazione dei consumatori.",
      s8_title: "Sicurezza dei Prodotti e Tracciabilità",
      s8_intro: "Secondo il Regolamento UE 2023/988 (General Product Safety Regulation - GPSR):",
      s8_label: "Responsabile del Prodotto nell'UE:",
      s8_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Germania<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>"
    },
    es: {
      h1: "Información Legal / Aviso legal",
      subtitle: "Información según § 5 DDG (Ley de Servicios Digitales)",
      s1_title: "Titular y Contacto",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Alemania",
      s2_title: "Contacto",
      s2_list: "<li>Teléfono: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li><li>WhatsApp: +49 152 22466077</li>",
      s3_title: "Horario de apertura",
      s3_list: "<li>Lunes - Viernes: 09:00 - 18:00</li><li>Sábado: 10:00 - 14:00</li><li>Domingo: Cerrado</li>",
      s4_title: "Número de IVA",
      s4_content: "Número de IVA según §27a UStG: DE457964828",
      s4_note: "<strong>Nota para pequeñas empresas:</strong> Como pequeña empresa según § 19 Abs. 1 UStG, no se cobra IVA.",
      s5_title: "Registro Mercantil",
      s5_content: "No inscrito en el registro mercantil (empresa individual/pequeña empresa).",
      s6_title: "Responsable del contenido",
      s6_intro: "Responsable del contenido según § 55 Abs. 2 RStV:",
      s6_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Alemania",
      s7_title: "Exclusión de responsabilidad",
      s7a_title: "Responsabilidad por el contenido",
      s7a_content: "Los contenidos de nuestras páginas se crearon con el mayor cuidado. Sin embargo, no podemos garantizar la exactitud, integridad y actualidad del contenido. Como proveedor de servicios, somos responsables de nuestro propio contenido en estas páginas según las leyes generales del § 7 Abs.1 DDG.",
      s7b_title: "Responsabilidad por enlaces",
      s7b_content: "Nuestra oferta contiene enlaces a sitios web externos de terceros sobre cuyo contenido no tenemos ninguna influencia. Por lo tanto, no podemos asumir ninguna responsabilidad por este contenido externo.",
      s7c_title: "Derechos de autor",
      s7c_content: "El contenido y las obras creadas por los operadores del sitio en estas páginas están sujetos a la ley alemana de derechos de autor.",
      s7d_title: "Resolución de disputas",
      s7d_content: "No estamos dispuestos ni obligados a participar en procedimientos de resolución de disputas ante un organismo de conciliación de consumidores.",
      s8_title: "Seguridad del producto y trazabilidad",
      s8_intro: "Según el Reglamento UE 2023/988 (General Product Safety Regulation - GPSR):",
      s8_label: "Responsable del producto en la UE:",
      s8_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Alemania<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>"
    },
    fr: {
      h1: "Informations légales / Mentions légales",
      subtitle: "Informations conformément au § 5 DDG (Loi sur les services numériques)",
      s1_title: "Titulaire et contact",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Allemagne",
      s2_title: "Contact",
      s2_list: "<li>Téléphone: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li><li>WhatsApp: +49 152 22466077</li>",
      s3_title: "Horaires d'ouverture",
      s3_list: "<li>Lundi - Vendredi: 09:00 - 18:00</li><li>Samedi: 10:00 - 14:00</li><li>Dimanche: Fermé</li>",
      s4_title: "Numéro de TVA",
      s4_content: "Numéro de TVA selon §27a UStG: DE457964828",
      s4_note: "<strong>Note pour les petites entreprises:</strong> En tant que petite entreprise au sens du § 19 Abs. 1 UStG, aucune TVA n'est facturée.",
      s5_title: "Registre du commerce",
      s5_content: "Non inscrit au registre du commerce (entreprise individuelle/petite entreprise).",
      s6_title: "Responsable du contenu",
      s6_intro: "Responsable du contenu conformément au § 55 Abs. 2 RStV:",
      s6_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Allemagne",
      s7_title: "Avertissement",
      s7a_title: "Responsabilité pour le contenu",
      s7a_content: "Les contenus de nos pages ont été créés avec le plus grand soin. Toutefois, nous ne pouvons pas garantir l'exactitude, l'exhaustivité et l'actualité du contenu. En tant que fournisseur de services, nous sommes responsables de notre propre contenu sur ces pages conformément aux lois générales du § 7 Abs.1 DDG.",
      s7b_title: "Responsabilité pour les liens",
      s7b_content: "Notre offre contient des liens vers des sites web externes de tiers sur le contenu desquels nous n'avons aucune influence. Nous ne pouvons donc pas assumer de responsabilité pour ce contenu externe.",
      s7c_title: "Droits d'auteur",
      s7c_content: "Le contenu et les œuvres créés par les opérateurs du site sur ces pages sont soumis au droit d'auteur allemand.",
      s7d_title: "Résolution des litiges",
      s7d_content: "Nous ne sommes pas disposés ni obligés à participer à des procédures de résolution des litiges devant un organisme de médiation des consommateurs.",
      s8_title: "Sécurité des produits et traçabilité",
      s8_intro: "Selon le Règlement UE 2023/988 (General Product Safety Regulation - GPSR):",
      s8_label: "Responsable du produit dans l'UE:",
      s8_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Allemagne<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>"
    }
  },
  datenschutz: {
    de: {
      h1: "Datenschutzerklärung",
      s1_title: "1. Verantwortlicher",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg, Deutschland",
      s1_contact: "Kontakt:",
      s1_list: "<li>Telefon: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li>",
      s2_title: "2. Datenerfassung auf dieser Website",
      s2a_title: "Server-Log-Dateien",
      s2a_intro: "Der Provider erhebt automatisch folgende Informationen in Server-Log-Dateien:",
      s2a_list: "<li>Browsertyp und Browserversion</li><li>Verwendetes Betriebssystem</li><li>Referrer URL</li><li>Hostname des zugreifenden Rechners</li><li>Uhrzeit der Serveranfrage</li><li>IP-Adresse</li>",
      s2a_basis: "Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO",
      s2b_title: "Kontaktformular & E-Mail",
      s2b_content: "Bei Kontaktaufnahme werden Ihre Daten zur Bearbeitung der Anfrage gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.",
      s3_title: "3. Cookies",
      s3a_title: "Nur technisch notwendige Cookies",
      s3a_content: "Wir verwenden ausschließlich Cookies, die für den Betrieb der Website erforderlich sind. Es werden keine Tracking-Cookies eingesetzt.",
      s4_title: "4. Ihre Rechte",
      s4_list: "<li>Recht auf Auskunft</li><li>Recht auf Berichtigung</li><li>Recht auf Löschung</li><li>Recht auf Einschränkung der Verarbeitung</li><li>Recht auf Datenübertragbarkeit</li><li>Recht auf Widerspruch</li>",
      s4a_title: "Aufsichtsbehörde",
      s4a_content: "Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br>Promenade 18, 91522 Ansbach, Deutschland<br>Tel: +49 981 180093-0<br>E-Mail: <a href=\"mailto:poststelle@lda.bayern.de\">poststelle@lda.bayern.de</a>"
    },
    en: {
      h1: "Privacy Policy",
      s1_title: "1. Data Controller",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg, Germany",
      s1_contact: "Contact:",
      s1_list: "<li>Phone: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li>",
      s2_title: "2. Data Collection on this Website",
      s2a_title: "Server Log Files",
      s2a_intro: "The provider automatically collects the following information in server log files:",
      s2a_list: "<li>Browser type and version</li><li>Operating system used</li><li>Referrer URL</li><li>Hostname of the accessing computer</li><li>Time of server request</li><li>IP address</li>",
      s2a_basis: "Legal basis: Art. 6(1)(f) GDPR",
      s2b_title: "Contact Form & E-Mail",
      s2b_content: "When you contact us, your data is stored for processing your request. Legal basis: Art. 6(1)(b) GDPR.",
      s3_title: "3. Cookies",
      s3a_title: "Technically necessary cookies only",
      s3a_content: "We only use cookies that are necessary for the operation of the website. No tracking cookies are used.",
      s4_title: "4. Your Rights",
      s4_list: "<li>Right of access</li><li>Right to rectification</li><li>Right to erasure</li><li>Right to restriction of processing</li><li>Right to data portability</li><li>Right to object</li>",
      s4a_title: "Supervisory Authority",
      s4a_content: "Bavarian Data Protection Authority (BayLDA)<br>Promenade 18, 91522 Ansbach, Germany<br>Tel: +49 981 180093-0<br>E-Mail: <a href=\"mailto:poststelle@lda.bayern.de\">poststelle@lda.bayern.de</a>"
    },
    it: {
      h1: "Informativa sulla privacy",
      s1_title: "1. Responsabile",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg, Germania",
      s1_contact: "Contatto:",
      s1_list: "<li>Telefono: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li>",
      s2_title: "2. Raccolta dati su questo sito",
      s2a_title: "File di log del server",
      s2a_intro: "Il provider raccoglie automaticamente le seguenti informazioni nei file di log:",
      s2a_list: "<li>Tipo e versione del browser</li><li>Sistema operativo utilizzato</li><li>URL referrer</li><li>Hostname del computer</li><li>Ora della richiesta</li><li>Indirizzo IP</li>",
      s2a_basis: "Base giuridica: Art. 6 comma 1 lett. f GDPR",
      s2b_title: "Modulo di contatto e e-mail",
      s2b_content: "In caso di contatto, i suoi dati vengono memorizzati per gestire la richiesta. Base giuridica: Art. 6 comma 1 lett. b GDPR.",
      s3_title: "3. Cookie",
      s3a_title: "Solo cookie tecnici",
      s3a_content: "Utilizziamo esclusivamente cookie necessari per il funzionamento del sito. Non utilizziamo cookie di tracciamento.",
      s4_title: "4. I suoi diritti",
      s4_list: "<li>Diritto di accesso</li><li>Diritto di rettifica</li><li>Diritto alla cancellazione</li><li>Diritto di limitazione</li><li>Diritto alla portabilità</li><li>Diritto di opposizione</li>",
      s4a_title: "Autorità di vigilanza",
      s4a_content: "Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br>Promenade 18, 91522 Ansbach, Germania<br>Tel: +49 981 180093-0<br>E-Mail: <a href=\"mailto:poststelle@lda.bayern.de\">poststelle@lda.bayern.de</a>"
    },
    es: {
      h1: "Política de privacidad",
      s1_title: "1. Responsable",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg, Alemania",
      s1_contact: "Contacto:",
      s1_list: "<li>Teléfono: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li>",
      s2_title: "2. Recopilación de datos en este sitio",
      s2a_title: "Archivos de registro del servidor",
      s2a_intro: "El proveedor recopila automáticamente la siguiente información en los archivos de registro:",
      s2a_list: "<li>Tipo y versión del navegador</li><li>Sistema operativo utilizado</li><li>URL de referencia</li><li>Nombre del host</li><li>Hora de la solicitud</li><li>Dirección IP</li>",
      s2a_basis: "Base legal: Art. 6.1.f RGPD",
      s2b_title: "Formulario de contacto y correo electrónico",
      s2b_content: "Al contactarnos, sus datos se almacenan para procesar su solicitud. Base legal: Art. 6.1.b RGPD.",
      s3_title: "3. Cookies",
      s3a_title: "Solo cookies técnicamente necesarias",
      s3a_content: "Utilizamos exclusivamente cookies necesarias para el funcionamiento del sitio. No se utilizan cookies de seguimiento.",
      s4_title: "4. Sus derechos",
      s4_list: "<li>Derecho de acceso</li><li>Derecho de rectificación</li><li>Derecho de supresión</li><li>Derecho a la limitación</li><li>Derecho a la portabilidad</li><li>Derecho de oposición</li>",
      s4a_title: "Autoridad supervisora",
      s4a_content: "Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br>Promenade 18, 91522 Ansbach, Alemania<br>Tel: +49 981 180093-0<br>E-Mail: <a href=\"mailto:poststelle@lda.bayern.de\">poststelle@lda.bayern.de</a>"
    },
    fr: {
      h1: "Politique de confidentialité",
      s1_title: "1. Responsable",
      s1_content: "Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg, Allemagne",
      s1_contact: "Contact:",
      s1_list: "<li>Téléphone: +49 152 22466077</li><li>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a></li>",
      s2_title: "2. Collecte de données sur ce site",
      s2a_title: "Fichiers journaux du serveur",
      s2a_intro: "Le fournisseur collecte automatiquement les informations suivantes dans les fichiers journaux:",
      s2a_list: "<li>Type et version du navigateur</li><li>Système d'exploitation utilisé</li><li>URL du référent</li><li>Nom d'hôte</li><li>Heure de la requête</li><li>Adresse IP</li>",
      s2a_basis: "Base légale: Art. 6.1.f RGPD",
      s2b_title: "Formulaire de contact et e-mail",
      s2b_content: "Lorsque vous nous contactez, vos données sont stockées pour traiter votre demande. Base légale: Art. 6.1.b RGPD.",
      s3_title: "3. Cookies",
      s3a_title: "Cookies strictement nécessaires uniquement",
      s3a_content: "Nous n'utilisons que des cookies nécessaires au fonctionnement du site. Aucun cookie de suivi n'est utilisé.",
      s4_title: "4. Vos droits",
      s4_list: "<li>Droit d'accès</li><li>Droit de rectification</li><li>Droit à l'effacement</li><li>Droit à la limitation</li><li>Droit à la portabilité</li><li>Droit d'opposition</li>",
      s4a_title: "Autorité de contrôle",
      s4a_content: "Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br>Promenade 18, 91522 Ansbach, Allemagne<br>Tel: +49 981 180093-0<br>E-Mail: <a href=\"mailto:poststelle@lda.bayern.de\">poststelle@lda.bayern.de</a>"
    }
  },
  agb: {
    de: {
      h1: "Allgemeine Geschäftsbedingungen (AGB)",
      subtitle: "ABC Spare Parts – Serena Sarlo | Stand: 02.11.2025",
      s1_title: "1. Geltungsbereich",
      s1_content: "Diese Allgemeinen Geschäftsbedingungen gelten für alle Lieferungen zwischen ABC Spare Parts - Serena Sarlo und dem Kunden.",
      s1_seller: "Verkäufer: Serena Sarlo, Äussere Uferstrasse 16, 86154 Augsburg, Deutschland<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s2_title: "2. Preise",
      s2_content: "Alle Preise in Euro (€) sind Endpreise. Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.",
      s3_title: "3. Lieferung",
      s3_content: "Lieferzeit: Die Lieferzeit wird für jede Bestellung individuell angegeben und hängt von der Verfügbarkeit bei unseren Lieferanten ab. Die voraussichtliche Lieferzeit teilen wir vor Vertragsschluss mit.",
      s3_content2: "Bei Vorkasse beginnt die Lieferzeit nach Zahlungseingang; bei anderen Zahlungsarten nach Vertragsschluss.",
      s4_title: "4. Widerrufsrecht (Verbraucher)",
      s4_content: "Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen zu widerrufen.",
      s4_contact: "Kontakt: ABC Spare Parts, Äussere Uferstrasse 16, 86154 Augsburg, Deutschland<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s4_form_title: "Widerrufsformular",
      s4_form1: "An: ABC Spare Parts - Serena Sarlo<br>Äussere Uferstrasse 16, 86154 Augsburg, Deutschland",
      s4_form2: "Hiermit widerrufe ich (*) den Vertrag über den Kauf der folgenden Waren (*):",
      s4_form3: "Bestellt am (*) / erhalten am (*).",
      s4_form4: "Name, Anschrift, Unterschrift (*), Datum",
      s4_form5: "(*) Nichtzutreffendes streichen.",
      s5_title: "5. Gewährleistung",
      s5_content: "Gesetzliche Gewährleistung: 2 Jahre für Verbraucher, 1 Jahr für Unternehmer.",
      s6_title: "6. Anwendbares Recht",
      s6_content: "Es gilt das Recht der Bundesrepublik Deutschland.",
      updated: "Letzte Aktualisierung: 02.11.2025"
    },
    en: {
      h1: "General Terms and Conditions",
      subtitle: "ABC Spare Parts – Serena Sarlo | As of: 02.11.2025",
      s1_title: "1. Scope",
      s1_content: "These General Terms and Conditions apply to all deliveries between ABC Spare Parts - Serena Sarlo and the customer.",
      s1_seller: "Seller: Serena Sarlo, Äussere Uferstrasse 16, 86154 Augsburg, Germany<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s2_title: "2. Prices",
      s2_content: "All prices in Euro (€) are final prices. As a small business under § 19 Abs. 1 UStG, no VAT is charged.",
      s3_title: "3. Delivery",
      s3_content: "Delivery time: The delivery time is stated individually for each order and depends on availability from our suppliers. We will inform you of the expected delivery time before concluding the contract.",
      s3_content2: "For advance payment, the delivery time begins after receipt of payment; for other payment methods after conclusion of the contract.",
      s4_title: "4. Right of Withdrawal (Consumers)",
      s4_content: "You have the right to withdraw within 14 days without giving reasons.",
      s4_contact: "Contact: ABC Spare Parts, Äussere Uferstrasse 16, 86154 Augsburg, Germany<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s4_form_title: "Withdrawal Form",
      s4_form1: "To: ABC Spare Parts - Serena Sarlo<br>Äussere Uferstrasse 16, 86154 Augsburg, Germany",
      s4_form2: "I hereby withdraw (*) the contract for the purchase of the following goods (*):",
      s4_form3: "Ordered on (*) / received on (*).",
      s4_form4: "Name, address, signature (*), date",
      s4_form5: "(*) Delete as appropriate.",
      s5_title: "5. Warranty",
      s5_content: "Statutory warranty: 2 years for consumers, 1 year for businesses.",
      s6_title: "6. Applicable Law",
      s6_content: "The law of the Federal Republic of Germany applies.",
      updated: "Last updated: 02.11.2025"
    },
    it: {
      h1: "Condizioni generali di vendita",
      subtitle: "ABC Spare Parts – Serena Sarlo | Aggiornato: 02.11.2025",
      s1_title: "1. Ambito di applicazione",
      s1_content: "Queste condizioni generali si applicano a tutte le consegne tra ABC Spare Parts - Serena Sarlo e il cliente.",
      s1_seller: "Venditore: Serena Sarlo, Äussere Uferstrasse 16, 86154 Augsburg, Germania<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s2_title: "2. Prezzi",
      s2_content: "Tutti i prezzi in Euro (€) sono prezzi finali. Come piccola impresa ai sensi del § 19 Abs. 1 UStG non viene addebitata l'IVA.",
      s3_title: "3. Consegna",
      s3_content: "Tempi di consegna: Il tempo di consegna viene indicato individualmente per ogni ordine e dipende dalla disponibilità presso i nostri fornitori. La data di consegna prevista viene comunicata prima della conclusione del contratto.",
      s3_content2: "Per pagamento anticipato, il termine di consegna decorre dal ricevimento del pagamento; per altri metodi di pagamento dalla conclusione del contratto.",
      s4_title: "4. Diritto di recesso (Consumatori)",
      s4_content: "Hai diritto di recedere entro 14 giorni senza fornire motivazioni.",
      s4_contact: "Contatto: ABC Spare Parts, Äussere Uferstrasse 16, 86154 Augsburg, Germania<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s4_form_title: "Modulo di recesso",
      s4_form1: "A: ABC Spare Parts - Serena Sarlo<br>Äussere Uferstrasse 16, 86154 Augsburg, Germania",
      s4_form2: "Con la presente recedo (*) dal contratto per l'acquisto dei seguenti beni (*):",
      s4_form3: "Ordinato il (*) / ricevuto il (*).",
      s4_form4: "Nome, indirizzo, firma (*), data",
      s4_form5: "(*) Cancellare se non applicabile.",
      s5_title: "5. Garanzia",
      s5_content: "Garanzia legale: 2 anni per consumatori, 1 anno per imprese.",
      s6_title: "6. Legge applicabile",
      s6_content: "Si applica la legge della Repubblica federale di Germania.",
      updated: "Ultimo aggiornamento: 02.11.2025"
    },
    es: {
      h1: "Condiciones generales",
      subtitle: "ABC Spare Parts – Serena Sarlo | Actualizado: 02.11.2025",
      s1_title: "1. Ámbito de aplicación",
      s1_content: "Estas condiciones generales se aplican a todos los envíos entre ABC Spare Parts - Serena Sarlo y el cliente.",
      s1_seller: "Vendedor: Serena Sarlo, Äussere Uferstrasse 16, 86154 Augsburg, Alemania<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s2_title: "2. Precios",
      s2_content: "Todos los precios en euros (€) son precios finales. Como pequeña empresa según § 19 Abs. 1 UStG no se cobra IVA.",
      s3_title: "3. Entrega",
      s3_content: "Plazo de entrega: El plazo de entrega se indica individualmente para cada pedido y depende de la disponibilidad de nuestros proveedores. Le informaremos del plazo de entrega previsto antes de concluir el contrato.",
      s3_content2: "Para pago anticipado, el plazo de entrega comienza tras la recepción del pago; para otros métodos de pago tras la conclusión del contrato.",
      s4_title: "4. Derecho de desistimiento (Consumidores)",
      s4_content: "Tiene derecho a desistir en un plazo de 14 días sin indicar motivos.",
      s4_contact: "Contacto: ABC Spare Parts, Äussere Uferstrasse 16, 86154 Augsburg, Alemania<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s4_form_title: "Formulario de desistimiento",
      s4_form1: "A: ABC Spare Parts - Serena Sarlo<br>Äussere Uferstrasse 16, 86154 Augsburg, Alemania",
      s4_form2: "Por la presente desisto (*) del contrato de compra de los siguientes productos (*):",
      s4_form3: "Pedido el (*) / recibido el (*).",
      s4_form4: "Nombre, dirección, firma (*), fecha",
      s4_form5: "(*) Tachar lo que no corresponda.",
      s5_title: "5. Garantía",
      s5_content: "Garantía legal: 2 años para consumidores, 1 año para empresas.",
      s6_title: "6. Ley aplicable",
      s6_content: "Se aplica la ley de la República Federal de Alemania.",
      updated: "Última actualización: 02.11.2025"
    },
    fr: {
      h1: "Conditions générales de vente",
      subtitle: "ABC Spare Parts – Serena Sarlo | Mise à jour: 02.11.2025",
      s1_title: "1. Champ d'application",
      s1_content: "Ces conditions générales s'appliquent à toutes les livraisons entre ABC Spare Parts - Serena Sarlo et le client.",
      s1_seller: "Vendeur: Serena Sarlo, Äussere Uferstrasse 16, 86154 Augsburg, Allemagne<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s2_title: "2. Prix",
      s2_content: "Tous les prix en euros (€) sont des prix finaux. En tant que petite entreprise au sens du § 19 Abs. 1 UStG, aucune TVA n'est facturée.",
      s3_title: "3. Livraison",
      s3_content: "Délai de livraison: Le délai de livraison est indiqué individuellement pour chaque commande et dépend de la disponibilité auprès de nos fournisseurs. Nous vous informerons du délai de livraison prévu avant la conclusion du contrat.",
      s3_content2: "Pour le paiement anticipé, le délai de livraison commence après réception du paiement; pour les autres modes de paiement après la conclusion du contrat.",
      s4_title: "4. Droit de rétractation (Consommateurs)",
      s4_content: "Vous avez le droit de vous rétracter dans un délai de 14 jours sans indication de motifs.",
      s4_contact: "Contact: ABC Spare Parts, Äussere Uferstrasse 16, 86154 Augsburg, Allemagne<br>E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>",
      s4_form_title: "Formulaire de rétractation",
      s4_form1: "À: ABC Spare Parts - Serena Sarlo<br>Äussere Uferstrasse 16, 86154 Augsburg, Allemagne",
      s4_form2: "Par la présente, je me rétracte (*) du contrat d'achat des biens suivants (*):",
      s4_form3: "Commandé le (*) / reçu le (*).",
      s4_form4: "Nom, adresse, signature (*), date",
      s4_form5: "(*) Biffer la mention inutile.",
      s5_title: "5. Garantie",
      s5_content: "Garantie légale: 2 ans pour les consommateurs, 1 an pour les entreprises.",
      s6_title: "6. Droit applicable",
      s6_content: "Le droit de la République fédérale d'Allemagne s'applique.",
      updated: "Dernière mise à jour: 02.11.2025"
    }
  },
  versand: {
    de: { h1: "Versandinformationen", s1_title: "Lieferländer", s1_content: "Wir liefern in folgende Länder: Deutschland (DE), Italien (IT), Frankreich (FR), Spanien (ES) und weitere europäische Länder.", s2_title: "Lieferzeiten", s2_content: "Die Lieferzeit richtet sich nach der Verfügbarkeit der Ware und der gewählten Versandart. Standardlieferzeiten werden bei der Angebotserstellung mitgeteilt. Express-Versand ist auf Anfrage verfügbar.", s3_title: "Versandkosten", s3_content: "Die Versandkosten werden individuell berechnet und im Angebot bzw. der Auftragsbestätigung ausgewiesen.", s4_title: "24h-Angebote", s4_content: "Wir bemühen uns, Ihnen innerhalb von 24 Stunden ein Angebot für Ihre Anfrage zu unterbreiten." },
    en: { h1: "Shipping Information", s1_title: "Delivery Countries", s1_content: "We deliver to the following countries: Germany (DE), Italy (IT), France (FR), Spain (ES) and other European countries.", s2_title: "Delivery Times", s2_content: "Delivery time depends on product availability and the chosen shipping method. Standard delivery times are communicated when the quote is prepared. Express shipping is available on request.", s3_title: "Shipping Costs", s3_content: "Shipping costs are calculated individually and shown in the quote or order confirmation.", s4_title: "24h Quotes", s4_content: "We strive to provide you with a quote for your enquiry within 24 hours." },
    it: { h1: "Informazioni spedizione", s1_title: "Paesi di consegna", s1_content: "Consegniamo nei seguenti paesi: Germania (DE), Italia (IT), Francia (FR), Spagna (ES) e altri paesi europei.", s2_title: "Tempi di consegna", s2_content: "Il tempo di consegna dipende dalla disponibilità del prodotto e dal metodo di spedizione scelto. I tempi standard sono comunicati al momento della preparazione dell'offerta. La spedizione express è disponibile su richiesta.", s3_title: "Costi di spedizione", s3_content: "I costi di spedizione sono calcolati individualmente e indicati nell'offerta o nella conferma d'ordine.", s4_title: "Offerte in 24h", s4_content: "Ci impegniamo a fornirle un preventivo per la sua richiesta entro 24 ore." },
    es: { h1: "Información de envío", s1_title: "Países de entrega", s1_content: "Entregamos en los siguientes países: Alemania (DE), Italia (IT), Francia (FR), España (ES) y otros países europeos.", s2_title: "Plazos de entrega", s2_content: "El plazo de entrega depende de la disponibilidad del producto y del método de envío elegido. Los plazos estándar se comunican al preparar el presupuesto. El envío express está disponible bajo petición.", s3_title: "Gastos de envío", s3_content: "Los gastos de envío se calculan individualmente y se indican en el presupuesto o confirmación de pedido.", s4_title: "Presupuestos en 24h", s4_content: "Nos esforzamos por proporcionarle un presupuesto para su consulta en un plazo de 24 horas." },
    fr: { h1: "Informations de livraison", s1_title: "Pays de livraison", s1_content: "Nous livrons dans les pays suivants: Allemagne (DE), Italie (IT), France (FR), Espagne (ES) et d'autres pays européens.", s2_title: "Délais de livraison", s2_content: "Le délai de livraison dépend de la disponibilité du produit et du mode d'expédition choisi. Les délais standards sont communiqués lors de l'établissement du devis. L'expédition express est disponible sur demande.", s3_title: "Frais de livraison", s3_content: "Les frais de livraison sont calculés individuellement et indiqués dans le devis ou la confirmation de commande.", s4_title: "Devis sous 24h", s4_content: "Nous nous efforçons de vous fournir un devis pour votre demande sous 24 heures." }
  },
  cookies: {
    de: { h1: "Cookie-Hinweis", s1_title: "Verwendung von Cookies", s1_content: "Wir verwenden ausschließlich technisch notwendige Cookies für den Betrieb dieser Website. Es werden keine Tracking- oder Analyse-Cookies eingesetzt.", s2_title: "Technisch notwendige Cookies", s2_intro: "Technisch notwendige Cookies sind für die Funktion der Website erforderlich und umfassen insbesondere:", s2_li1: "Sitzungs-Cookies: zur Aufrechterhaltung Ihrer Sitzung während der Nutzung der Website.", s2_li2: "Präferenz-Cookies: z. B. zur Speicherung der gewählten Sprache.", s3_title: "Keine Tracking-Cookies", s3_content: "Wir verwenden keine Marketing-Cookies, keine Analyse-Cookies, keine Cookies von Drittanbietern und keine Tracking-Pixel.", s4_title: "Verwaltung von Cookies", s4_content: "Sie können Cookies über die Einstellungen Ihres Browsers verwalten oder löschen (z. B. Cookies blockieren, bestehende Cookies löschen oder sich vor dem Setzen eines Cookies informieren lassen).", s5_title: "Kontakt", s5_content: "E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>" },
    en: { h1: "Cookie Notice", s1_title: "Use of Cookies", s1_content: "We use only technically necessary cookies for the operation of this website. No tracking or analytics cookies are used.", s2_title: "Technically necessary cookies", s2_intro: "Technically necessary cookies are required for the website to function and include in particular:", s2_li1: "Session cookies: to maintain your session while using the website.", s2_li2: "Preference cookies: e.g. to store the selected language.", s3_title: "No tracking cookies", s3_content: "We do not use marketing cookies, analytics cookies, third-party cookies or tracking pixels.", s4_title: "Managing cookies", s4_content: "You can manage or delete cookies through your browser settings (e.g. block cookies, delete existing cookies or be informed before a cookie is set).", s5_title: "Contact", s5_content: "E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>" },
    it: { h1: "Informativa sui cookie", s1_title: "Utilizzo dei cookie", s1_content: "Utilizziamo esclusivamente cookie tecnici necessari per il funzionamento di questo sito. Non utilizziamo cookie di tracciamento o analytics.", s2_title: "Cookie tecnici necessari", s2_intro: "I cookie tecnici necessari sono richiesti per il funzionamento del sito e comprendono in particolare:", s2_li1: "Cookie di sessione: per mantenere la sessione durante l'utilizzo del sito.", s2_li2: "Cookie di preferenze: ad es. per memorizzare la lingua selezionata.", s3_title: "Nessun cookie di tracciamento", s3_content: "Non utilizziamo cookie marketing, cookie analytics, cookie di terze parti né pixel di tracciamento.", s4_title: "Gestione dei cookie", s4_content: "Può gestire o eliminare i cookie tramite le impostazioni del browser (es. bloccare cookie, eliminare cookie esistenti o essere informato prima che venga impostato un cookie).", s5_title: "Contatto", s5_content: "E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>" },
    es: { h1: "Aviso de cookies", s1_title: "Uso de cookies", s1_content: "Utilizamos únicamente cookies técnicamente necesarias para el funcionamiento de este sitio web. No se utilizan cookies de seguimiento o análisis.", s2_title: "Cookies técnicamente necesarias", s2_intro: "Las cookies técnicamente necesarias son necesarias para el funcionamiento del sitio web e incluyen en particular:", s2_li1: "Cookies de sesión: para mantener su sesión durante el uso del sitio web.", s2_li2: "Cookies de preferencias: p. ej. para almacenar el idioma seleccionado.", s3_title: "Sin cookies de seguimiento", s3_content: "No utilizamos cookies de marketing, cookies de análisis, cookies de terceros ni píxeles de seguimiento.", s4_title: "Gestión de cookies", s4_content: "Puede gestionar o eliminar cookies a través de la configuración de su navegador (p. ej. bloquear cookies, eliminar cookies existentes o ser informado antes de que se establezca una cookie).", s5_title: "Contacto", s5_content: "E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>" },
    fr: { h1: "Avis sur les cookies", s1_title: "Utilisation des cookies", s1_content: "Nous n'utilisons que des cookies techniquement nécessaires au fonctionnement de ce site. Aucun cookie de suivi ou d'analyse n'est utilisé.", s2_title: "Cookies strictement nécessaires", s2_intro: "Les cookies strictement nécessaires sont requis pour le fonctionnement du site et comprennent en particulier:", s2_li1: "Cookies de session: pour maintenir votre session lors de l'utilisation du site.", s2_li2: "Cookies de préférence: p. ex. pour stocker la langue sélectionnée.", s3_title: "Aucun cookie de suivi", s3_content: "Nous n'utilisons pas de cookies marketing, de cookies d'analyse, de cookies tiers ni de pixels de suivi.", s4_title: "Gestion des cookies", s4_content: "Vous pouvez gérer ou supprimer les cookies via les paramètres de votre navigateur (p. ex. bloquer les cookies, supprimer les cookies existants ou être informé avant la pose d'un cookie).", s5_title: "Contact", s5_content: "E-Mail: <a href=\"mailto:info@abcspareparts.eu\">info@abcspareparts.eu</a>" }
  }
};

function getLegalPageName() {
  const path = window.location.pathname || window.location.href;
  if (path.includes('impressum')) return 'impressum';
  if (path.includes('datenschutz')) return 'datenschutz';
  if (path.includes('agb')) return 'agb';
  if (path.includes('versand')) return 'versand';
  if (path.includes('cookies')) return 'cookies';
  return null;
}

function getLangFromUrl() {
  try {
    const p = new URLSearchParams(window.location.search);
    const l = p.get('lang');
    return l && ['de','en','it','es','fr'].includes(l) ? l : null;
  } catch (e) { return null; }
}
function getCurrentLang() {
  return getLangFromUrl() || (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || navigator.language.split('-')[0];
}
function updateLegalLinksWithLang(lang) {
  const pages = ['index.html','impressum.html','datenschutz.html','agb.html','versand.html','cookies.html'];
  document.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href') || '';
    if (h.startsWith('#') || h.startsWith('mailto:')) return;
    const [path, hash] = h.split('#');
    const base = path.split('?')[0];
    if (pages.includes(base) || pages.some(p => base.endsWith('/' + p))) {
      a.href = base + '?lang=' + lang + (hash ? '#' + hash : '');
    }
  });
}

function changeLegalLanguage(lang) {
  const page = getLegalPageName();
  const common = LEGAL_COMMON[lang] || LEGAL_COMMON.de;
  const pageT = page && LEGAL_PAGES[page] ? (LEGAL_PAGES[page][lang] || LEGAL_PAGES[page].de) : {};

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    let text = common[key] || pageT[key];
    if (text) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = text;
      else el.innerHTML = text;
    }
  });
  document.documentElement.lang = lang;
  try { localStorage.setItem('lang', lang); } catch (e) {}
  updateLegalLinksWithLang(lang);
}

document.addEventListener('DOMContentLoaded', function() {
  const sel = document.getElementById('legalLangSelect');
  if (!sel) return;
  const raw = getCurrentLang();
  const lang = ['de','en','it','es','fr'].includes(raw) ? raw : 'de';
  sel.value = lang;
  changeLegalLanguage(lang);
  sel.addEventListener('change', function() { changeLegalLanguage(this.value); });
});
