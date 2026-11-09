'use strict';

/**
 * Copy for /so-funktioniert-es.html and language equivalents.
 * Facts only: home pages, llms.txt, legal pages, FAQ, JSON already on the site.
 * Do not use original / Originalteile / authorized dealer (or translations).
 */

const PAGE_FILE = 'so-funktioniert-es.html';

const HOW_IT_WORKS_I18N = {
  de: {
    meta_title: 'So funktioniert ABCspareparts – Anfrage und Angebot in 24h',
    meta_description:
      'Industrie- und MRO-Ersatzteile: Teilenummer und Hersteller senden. Angebot oft in 24 Stunden, Lieferung in Europa. 11975+ Marken.',
    h1: 'So funktioniert ABCspareparts',
    breadcrumb: '<a href="/">Home</a> · So funktioniert es',
    direct_answer:
      'ABCspareparts ist ein unabhängiger Händler für industrielle und MRO-Ersatzteile in Europa (Sitz in Augsburg). Sie senden Teilenummer, Hersteller und Menge über das Anfrageformular auf der Startseite; ein Angebot folgt oft innerhalb von 24 Stunden. Nach der Bestellung erfolgt die Lieferung in europäische Länder — Lieferzeit und Versandkosten stehen im Angebot.',
    steps_title: 'Ablauf: Anfrage, Angebot, Bestellung, Lieferung',
    step1_name: 'Anfrage senden',
    step1_text:
      'Senden Sie die Teilenummer und den Hersteller — plus die Menge — über das Anfrageformular auf der Startseite oder per E-Mail an info@abcspareparts.eu. Die Anfrage ist unverbindlich. Preise stehen nicht auf der Website.',
    step2_name: 'Angebot erhalten',
    step2_text:
      'ABCspareparts prüft Verfügbarkeit und Konditionen und bemüht sich, innerhalb von 24 Stunden ein Angebot zu unterbreiten. Standardlieferzeiten werden bei der Angebotserstellung mitgeteilt.',
    step3_name: 'Bestellen',
    step3_text:
      'Nach Annahme des Angebots kommt der Vertrag zustande. Bei Vorkasse beginnt die Lieferzeit nach Zahlungseingang; bei anderen Zahlungsarten nach Vertragsschluss.',
    step4_name: 'Lieferung',
    step4_text:
      'Die Lieferung erfolgt in Deutschland, Italien, Frankreich, Spanien und weitere europäische Länder. Versandkosten werden individuell berechnet und im Angebot bzw. der Auftragsbestätigung ausgewiesen. Express-Versand ist auf Anfrage verfügbar.',
    need_title: 'Was Sie senden sollten',
    need_intro: 'Für eine klare, schnelle Prüfung genügen in der Regel diese Angaben:',
    need_li1: 'Hersteller bzw. Marke',
    need_li2: 'Teilenummer (vollständig, wie auf dem Typenschild oder in der Dokumentation)',
    need_li3: 'Menge',
    need_li4: 'Optional: Maschine, Anwendung oder weiterer technischer Kontext',
    need_note:
      'Sie können auch über die Markenliste oder eine Markenseite anfragen. Für Verfügbarkeit und Preise nutzen Sie das Formular auf der Startseite — nicht die Markenliste allein.',
    brands_title: 'Welche Marken und Teile',
    brands_p1:
      'ABCspareparts führt 11975+ Hersteller für Industrieersatzteile und MRO. Das Netzwerk umfasst Komponenten für industrielle Automation, Sensoren, Aktoren und Steuergeräte — sowie Mechanik, Elektrotechnik/Elektronik, Pneumatik und Hydraulik. Wo sinnvoll, sind geprüfte Alternativen möglich, auch für obsolete Teile.',
    brands_p2:
      'Die durchsuchbare A–Z-Liste steht unter Marken. Beispiele aus dem Sortiment sind unter anderem Siemens, Festo, ABB und Schneider. ABCspareparts ist ein unabhängiger Händler; die genannten Marken dienen der Produktidentifikation.',
    brands_link: 'Zur Markenliste A–Z',
    time_title: 'Antwortzeiten',
    time_p1:
      'Ein Angebot folgt oft innerhalb von 24 Stunden. Erreichbarkeit: Montag–Freitag 09:00–18:00, Samstag 10:00–14:00, Sonntag geschlossen (Augsburg, Deutschland).',
    time_p2:
      'Die Lieferzeit richtet sich nach der Verfügbarkeit der Ware und der gewählten Versandart. Sie wird vor Vertragsschluss mitgeteilt. Diese Seite nennt keine pauschalen Liefertage und keine Lagerbestände.',
    faq_title: 'Häufige Fragen',
    faq_q1: 'Wie frage ich Ersatzteile bei ABCspareparts an?',
    faq_a1:
      'Senden Sie Teilenummer, Hersteller und Menge über das Anfrageformular auf der Startseite oder an info@abcspareparts.eu. Die Anfrage ist unverbindlich.',
    faq_q2: 'Wie schnell kommt ein Angebot?',
    faq_a2:
      'ABCspareparts bemüht sich, innerhalb von 24 Stunden ein Angebot zu unterbreiten. Die Rückmeldung erfolgt in der Regel in diesem Zeitraum; genaue Lieferzeiten stehen im Angebot.',
    faq_q3: 'Welche Angaben braucht ABCspareparts?',
    faq_a3:
      'Mindestens Hersteller, Teilenummer und Menge. Optional helfen Maschine oder Anwendung. Vollständige Teilenummern vom Typenschild beschleunigen die Prüfung.',
    faq_q4: 'Welche Marken und Teile werden abgedeckt?',
    faq_a4:
      '11975+ Hersteller für Industrie- und MRO-Ersatzteile, darunter Automation, Sensoren, Aktoren, Steuergeräte sowie Mechanik, Elektrotechnik/Elektronik, Pneumatik und Hydraulik. Die A–Z-Liste finden Sie unter Marken.',
    faq_q5: 'Liefert ABCspareparts in ganz Europa?',
    faq_a5:
      'Ja. Geliefert wird nach Deutschland, Italien, Frankreich, Spanien und in weitere europäische Länder. Lieferweg, Frist und Versandkosten hängen vom Artikel, der Verfügbarkeit und dem Zielort ab und stehen im Angebot.',
    faq_q6: 'Gibt es Preise auf der Website?',
    faq_a6:
      'Nein. Es werden keine Listenpreise veröffentlicht. Verfügbarkeit und Konditionen folgen nach Prüfung der Anfrage — unverbindlich.',
    faq_q7: 'Was passiert nach dem Angebot?',
    faq_a7:
      'Nach Annahme des Angebots kommt der Vertrag zustande. Bei Vorkasse beginnt die Lieferzeit nach Zahlungseingang; bei anderen Zahlungsarten nach Vertragsschluss. Express-Versand ist auf Anfrage verfügbar.',
    faq_q8: 'Wo sitzt ABCspareparts und wie erreiche ich Sie?',
    faq_a8:
      'ABCspareparts hat seinen Sitz in Augsburg, Deutschland. Kontakt über das Anfrageformular auf der Startseite oder per E-Mail an info@abcspareparts.eu. Vollständige Angaben zum Unternehmen stehen im Impressum.',
    faq_a8_html:
      'ABCspareparts hat seinen Sitz in Augsburg, Deutschland. Kontakt über das Anfrageformular auf der Startseite oder per E-Mail an info@abcspareparts.eu. Vollständige Angaben zum Unternehmen stehen im <a href="/impressum.html">Impressum</a>.',
    cta_title: 'Unverbindlich anfragen',
    cta_text:
      'Nutzen Sie das Anfrageformular auf der Startseite — ohne Preise auf der Website, Rückmeldung oft innerhalb von 24 Stunden.',
    cta_button: 'Zum Anfrageformular',
    nav_home: 'Home',
    nav_how: 'So funktioniert es',
    howto_name: 'Ersatzteile bei ABCspareparts anfragen',
    howto_description:
      'Teilenummer und Hersteller senden, Angebot oft innerhalb von 24 Stunden erhalten, bestellen und Lieferung in Europa.'
  },
  en: {
    meta_title: 'How ABCspareparts works – quote usually within 24h',
    meta_description:
      'Industrial and MRO spare parts: send part number and manufacturer. Quote often within 24 hours, delivery in Europe. 11975+ brands.',
    h1: 'How ABCspareparts works',
    breadcrumb: '<a href="/en/">Home</a> · How it works',
    direct_answer:
      'ABCspareparts is an independent reseller of industrial and MRO spare parts in Europe (based in Augsburg). Send the part number, manufacturer and quantity via the enquiry form on the home page; a quote often follows within 24 hours. After you order, delivery is to European countries — lead time and shipping costs are stated in the quote.',
    steps_title: 'Steps: enquiry, quote, order, delivery',
    step1_name: 'Send an enquiry',
    step1_text:
      'Send the part number and manufacturer — plus the quantity — via the enquiry form on the home page or by email to info@abcspareparts.eu. Enquiries are non-binding. Prices are not published on the website.',
    step2_name: 'Receive a quote',
    step2_text:
      'ABCspareparts checks availability and terms and aims to send a quote within 24 hours. Standard lead times are given when the quote is prepared.',
    step3_name: 'Order',
    step3_text:
      'The contract is formed when you accept the quote. For prepayment, the lead time starts after payment is received; for other payment methods, after the contract is concluded.',
    step4_name: 'Delivery',
    step4_text:
      'Delivery is to Germany, Italy, France, Spain and other European countries. Shipping costs are calculated individually and shown in the quote or order confirmation. Express shipping is available on request.',
    need_title: 'What you should send',
    need_intro: 'A clear, fast review usually needs:',
    need_li1: 'Manufacturer or brand',
    need_li2: 'Part number (complete, as on the nameplate or documentation)',
    need_li3: 'Quantity',
    need_li4: 'Optional: machine, application or other technical context',
    need_note:
      'You can also enquire from the brand directory or a brand page. For availability and prices, use the home-page form — not the brand index alone.',
    brands_title: 'Which brands and parts',
    brands_p1:
      'ABCspareparts covers 11975+ manufacturers for industrial spare parts and MRO. The network includes components for industrial automation, sensors, actuators and control devices — as well as mechanical, electrical/electronic, pneumatic and hydraulic parts. Where useful, verified alternatives are possible, including for obsolete parts.',
    brands_p2:
      'The searchable A–Z list is on Brands. Examples in the range include Siemens, Festo, ABB and Schneider. ABCspareparts is an independent reseller; brand names identify products only.',
    brands_link: 'Open the A–Z brand list',
    time_title: 'Response times',
    time_p1:
      'A quote often follows within 24 hours. Availability: Monday–Friday 09:00–18:00, Saturday 10:00–14:00, Sunday closed (Augsburg, Germany).',
    time_p2:
      'Lead time depends on stock at suppliers and the shipping method. It is stated before the contract is concluded. This page does not promise fixed delivery days or publish stock levels.',
    faq_title: 'Frequently asked questions',
    faq_q1: 'How do I request spare parts from ABCspareparts?',
    faq_a1:
      'Send the part number, manufacturer and quantity via the enquiry form on the home page or to info@abcspareparts.eu. Enquiries are non-binding.',
    faq_q2: 'How quickly do you send a quote?',
    faq_a2:
      'ABCspareparts aims to send a quote within 24 hours. A reply usually follows in that window; exact lead times are given in the quote.',
    faq_q3: 'What information do you need?',
    faq_a3:
      'At least manufacturer, part number and quantity. Machine or application details help. Complete part numbers from the nameplate speed up the review.',
    faq_q4: 'Which brands and parts do you cover?',
    faq_a4:
      '11975+ manufacturers for industrial and MRO spare parts, including automation, sensors, actuators, control devices, and mechanical, electrical/electronic, pneumatic and hydraulic components. See the A–Z list under Brands.',
    faq_q5: 'Do you deliver across Europe?',
    faq_a5:
      'Yes. Delivery is to Germany, Italy, France, Spain and other European countries. Route, timing and shipping costs depend on the item, availability and destination, and are stated in the quote.',
    faq_q6: 'Are prices shown on the website?',
    faq_a6:
      'No. List prices are not published. Availability and terms follow after the enquiry is reviewed — with no obligation.',
    faq_q7: 'What happens after the quote?',
    faq_a7:
      'The contract is formed when you accept the quote. For prepayment, the lead time starts after payment is received; for other payment methods, after the contract is concluded. Express shipping is available on request.',
    faq_q8: 'Where is ABCspareparts based and how can I get in touch?',
    faq_a8:
      'ABCspareparts is based in Augsburg, Germany. Contact us via the enquiry form on the home page or by email at info@abcspareparts.eu. Full company details are in the imprint.',
    faq_a8_html:
      'ABCspareparts is based in Augsburg, Germany. Contact us via the enquiry form on the home page or by email at info@abcspareparts.eu. Full company details are in the <a href="/en/impressum.html">imprint</a>.',
    cta_title: 'Send a non-binding enquiry',
    cta_text:
      'Use the enquiry form on the home page — no prices on the website, a reply often within 24 hours.',
    cta_button: 'Go to the enquiry form',
    nav_home: 'Home',
    nav_how: 'How it works',
    howto_name: 'Request spare parts from ABCspareparts',
    howto_description:
      'Send part number and manufacturer, receive a quote often within 24 hours, order, and take delivery in Europe.'
  },
  it: {
    meta_title: 'Come funziona ABCspareparts – preventivo spesso in 24h',
    meta_description:
      'Ricambi industriali e MRO: invia codice e produttore. Preventivo spesso entro 24 ore, consegna in Europa. Oltre 11975 marche.',
    h1: 'Come funziona ABCspareparts',
    breadcrumb: '<a href="/it/">Home</a> · Come funziona',
    direct_answer:
      'ABCspareparts è un rivenditore indipendente di ricambi industriali e MRO in Europa (sede a Augsburg). Inviate codice articolo, produttore e quantità con il modulo di richiesta in home page; il preventivo arriva spesso entro 24 ore. Dopo l’ordine la consegna è nei Paesi europei — tempi e costi di spedizione sono indicati nel preventivo.',
    steps_title: 'Passi: richiesta, preventivo, ordine, consegna',
    step1_name: 'Inviare la richiesta',
    step1_text:
      'Inviate il codice articolo e il produttore — più la quantità — con il modulo in home page o via e-mail a info@abcspareparts.eu. La richiesta è senza impegno. I prezzi non sono pubblicati sul sito.',
    step2_name: 'Ricevere il preventivo',
    step2_text:
      'ABCspareparts verifica disponibilità e condizioni e si impegna a inviare un preventivo entro 24 ore. I tempi di consegna standard sono comunicati in fase di offerta.',
    step3_name: 'Ordinare',
    step3_text:
      'Il contratto si perfeziona con l’accettazione del preventivo. In caso di pagamento anticipato i tempi di consegna partono dal ricevimento del pagamento; per altre modalità, dalla conclusione del contratto.',
    step4_name: 'Consegna',
    step4_text:
      'La consegna è in Germania, Italia, Francia, Spagna e altri Paesi europei. Le spese di spedizione sono calcolate caso per caso e indicate nel preventivo o nella conferma d’ordine. La spedizione express è disponibile su richiesta.',
    need_title: 'Cosa inviare',
    need_intro: 'Per una verifica chiara e rapida servono di solito:',
    need_li1: 'Produttore o marca',
    need_li2: 'Codice articolo (completo, come sulla targa o in documentazione)',
    need_li3: 'Quantità',
    need_li4: 'Facoltativo: macchina, applicazione o altro contesto tecnico',
    need_note:
      'Potete richiedere anche dall’elenco marche o da una pagina marca. Per disponibilità e prezzi usate il modulo in home page — non solo l’indice marche.',
    brands_title: 'Quali marche e parti',
    brands_p1:
      'ABCspareparts copre 11975+ produttori di ricambi industriali e MRO. La rete comprende componenti per automazione industriale, sensori, attuatori e dispositivi di controllo — oltre a meccanica, elettrotecnica/elettronica, pneumatica e idraulica. Dove utile, sono possibili alternative verificate, anche per parti obsolete.',
    brands_p2:
      'L’elenco A–Z ricercabile è in Marche. Esempi nell’assortimento: Siemens, Festo, ABB e Schneider. ABCspareparts è un rivenditore indipendente; i marchi servono solo a identificare i prodotti.',
    brands_link: 'Apri l’elenco marche A–Z',
    time_title: 'Tempi di risposta',
    time_p1:
      'Il preventivo arriva spesso entro 24 ore. Disponibilità: lunedì–venerdì 09:00–18:00, sabato 10:00–14:00, domenica chiuso (Augsburg, Germania).',
    time_p2:
      'I tempi di consegna dipendono dalla disponibilità e dal tipo di spedizione. Vengono comunicati prima della conclusione del contratto. Questa pagina non promette giorni di consegna fissi né pubblica giacenze.',
    faq_title: 'Domande frequenti',
    faq_q1: 'Come richiedo ricambi ad ABCspareparts?',
    faq_a1:
      'Inviate codice articolo, produttore e quantità con il modulo in home page o a info@abcspareparts.eu. La richiesta è senza impegno.',
    faq_q2: 'Quanto tempo serve per un preventivo?',
    faq_a2:
      'ABCspareparts si impegna a inviare un preventivo entro 24 ore. Di solito la risposta arriva in questo lasso; i tempi di consegna precisi sono nel preventivo.',
    faq_q3: 'Quali dati servono?',
    faq_a3:
      'Almeno produttore, codice articolo e quantità. Macchina o applicazione aiutano. Codici completi dalla targa accelerano la verifica.',
    faq_q4: 'Quali marche e parti coprite?',
    faq_a4:
      '11975+ produttori di ricambi industriali e MRO, tra cui automazione, sensori, attuatori, dispositivi di controllo e componenti meccanici, elettrici/elettronici, pneumatici e idraulici. Elenco A–Z sotto Marche.',
    faq_q5: 'Consegnate in tutta Europa?',
    faq_a5:
      'Sì. La consegna è in Germania, Italia, Francia, Spagna e altri Paesi europei. Percorso, tempi e costi dipendono dall’articolo, dalla disponibilità e dalla destinazione e sono indicati nel preventivo.',
    faq_q6: 'Ci sono prezzi sul sito?',
    faq_a6:
      'No. Non pubblichiamo listini. Disponibilità e condizioni arrivano dopo la verifica della richiesta — senza impegno.',
    faq_q7: 'Cosa succede dopo il preventivo?',
    faq_a7:
      'Il contratto si perfeziona con l’accettazione del preventivo. In caso di pagamento anticipato i tempi partono dal ricevimento del pagamento; per altre modalità, dalla conclusione del contratto. La spedizione express è disponibile su richiesta.',
    faq_q8: 'Dove ha sede ABCspareparts e come vi contatto?',
    faq_a8:
      'ABCspareparts ha sede a Augsburg, Germania. Contatto tramite il modulo in home page o e-mail a info@abcspareparts.eu. Dati completi sull’azienda nell’Impressum.',
    faq_a8_html:
      'ABCspareparts ha sede a Augsburg, Germania. Contatto tramite il modulo in home page o e-mail a info@abcspareparts.eu. Dati completi sull’azienda nell’<a href="/it/impressum.html">Impressum</a>.',
    cta_title: 'Richiesta senza impegno',
    cta_text:
      'Usate il modulo in home page — nessun prezzo sul sito, risposta spesso entro 24 ore.',
    cta_button: 'Vai al modulo di richiesta',
    nav_home: 'Home',
    nav_how: 'Come funziona',
    howto_name: 'Richiedere ricambi ad ABCspareparts',
    howto_description:
      'Inviare codice e produttore, ricevere un preventivo spesso entro 24 ore, ordinare e ricevere la consegna in Europa.'
  },
  es: {
    meta_title: 'Cómo funciona ABCspareparts – presupuesto a menudo en 24h',
    meta_description:
      'Repuestos industriales y MRO: envíe referencia y fabricante. Presupuesto a menudo en 24 horas, entrega en Europa. Más de 11975 marcas.',
    h1: 'Cómo funciona ABCspareparts',
    breadcrumb: '<a href="/es/">Home</a> · Cómo funciona',
    direct_answer:
      'ABCspareparts es un distribuidor independiente de repuestos industriales y MRO en Europa (sede en Augsburg). Envíe número de pieza, fabricante y cantidad con el formulario de la página de inicio; el presupuesto suele llegar en 24 horas. Tras el pedido, la entrega es a países europeos — plazo y gastos de envío figuran en el presupuesto.',
    steps_title: 'Pasos: consulta, presupuesto, pedido, entrega',
    step1_name: 'Enviar la consulta',
    step1_text:
      'Envíe el número de pieza y el fabricante — más la cantidad — con el formulario de inicio o por correo a info@abcspareparts.eu. La consulta no es vinculante. No hay precios en el sitio.',
    step2_name: 'Recibir el presupuesto',
    step2_text:
      'ABCspareparts comprueba disponibilidad y condiciones y procura enviar un presupuesto en 24 horas. Los plazos estándar se comunican al elaborar la oferta.',
    step3_name: 'Pedir',
    step3_text:
      'El contrato se formaliza al aceptar el presupuesto. Con prepago, el plazo de entrega empieza al recibir el pago; con otros métodos, al concluirse el contrato.',
    step4_name: 'Entrega',
    step4_text:
      'La entrega es a Alemania, Italia, Francia, España y otros países europeos. Los gastos de envío se calculan de forma individual y figuran en el presupuesto o la confirmación de pedido. El envío urgente está disponible bajo petición.',
    need_title: 'Qué debe enviar',
    need_intro: 'Para una revisión clara y rápida suelen bastar:',
    need_li1: 'Fabricante o marca',
    need_li2: 'Número de pieza (completo, como en la placa o la documentación)',
    need_li3: 'Cantidad',
    need_li4: 'Opcional: máquina, aplicación u otro contexto técnico',
    need_note:
      'También puede consultar desde el directorio de marcas o una ficha de marca. Para disponibilidad y precios use el formulario de inicio — no solo el índice de marcas.',
    brands_title: 'Qué marcas y piezas',
    brands_p1:
      'ABCspareparts cubre 11975+ fabricantes de repuestos industriales y MRO. La red incluye componentes de automatización industrial, sensores, actuadores y dispositivos de control — además de mecánica, electricidad/electrónica, neumática e hidráulica. Cuando resulta útil, hay alternativas verificadas, también para piezas obsoletas.',
    brands_p2:
      'La lista A–Z con búsqueda está en Marcas. Ejemplos del surtido: Siemens, Festo, ABB y Schneider. ABCspareparts es un distribuidor independiente; las marcas sirven solo para identificar productos.',
    brands_link: 'Abrir la lista A–Z de marcas',
    time_title: 'Tiempos de respuesta',
    time_p1:
      'El presupuesto suele llegar en 24 horas. Horario: lunes–viernes 09:00–18:00, sábado 10:00–14:00, domingo cerrado (Augsburg, Alemania).',
    time_p2:
      'El plazo de entrega depende de la disponibilidad y del tipo de envío. Se comunica antes de concluir el contrato. Esta página no promete días fijos de entrega ni publica existencias.',
    faq_title: 'Preguntas frecuentes',
    faq_q1: '¿Cómo solicito repuestos a ABCspareparts?',
    faq_a1:
      'Envíe número de pieza, fabricante y cantidad con el formulario de inicio o a info@abcspareparts.eu. La consulta no es vinculante.',
    faq_q2: '¿En cuánto tiempo llega el presupuesto?',
    faq_a2:
      'ABCspareparts procura enviar un presupuesto en 24 horas. La respuesta suele llegar en ese plazo; los tiempos de entrega exactos figuran en la oferta.',
    faq_q3: '¿Qué datos necesita?',
    faq_a3:
      'Como mínimo fabricante, número de pieza y cantidad. Máquina o aplicación ayudan. Los códigos completos de la placa aceleran la revisión.',
    faq_q4: '¿Qué marcas y piezas cubren?',
    faq_a4:
      '11975+ fabricantes de repuestos industriales y MRO, incluidos automatización, sensores, actuadores, dispositivos de control y componentes mecánicos, eléctricos/electrónicos, neumáticos e hidráulicos. Lista A–Z en Marcas.',
    faq_q5: '¿Entregan en toda Europa?',
    faq_a5:
      'Sí. La entrega es a Alemania, Italia, Francia, España y otros países europeos. Ruta, plazo y gastos dependen del artículo, la disponibilidad y el destino, y figuran en el presupuesto.',
    faq_q6: '¿Hay precios en el sitio?',
    faq_a6:
      'No. No se publican listas de precios. Disponibilidad y condiciones llegan tras revisar la consulta — sin compromiso.',
    faq_q7: '¿Qué ocurre después del presupuesto?',
    faq_a7:
      'El contrato se formaliza al aceptar el presupuesto. Con prepago, el plazo empieza al recibir el pago; con otros métodos, al concluirse el contrato. El envío urgente está disponible bajo petición.',
    faq_q8: '¿Dónde está ABCspareparts y cómo contacto?',
    faq_a8:
      'ABCspareparts tiene su sede en Augsburg, Alemania. Contacto a través del formulario de inicio o por correo a info@abcspareparts.eu. Datos completos de la empresa en el aviso legal.',
    faq_a8_html:
      'ABCspareparts tiene su sede en Augsburg, Alemania. Contacto a través del formulario de inicio o por correo a info@abcspareparts.eu. Datos completos de la empresa en el <a href="/es/impressum.html">aviso legal</a>.',
    cta_title: 'Consulta sin compromiso',
    cta_text:
      'Use el formulario de la página de inicio — sin precios en el sitio, respuesta a menudo en 24 horas.',
    cta_button: 'Ir al formulario de consulta',
    nav_home: 'Home',
    nav_how: 'Cómo funciona',
    howto_name: 'Solicitar repuestos a ABCspareparts',
    howto_description:
      'Enviar referencia y fabricante, recibir un presupuesto a menudo en 24 horas, pedir y recibir la entrega en Europa.'
  },
  fr: {
    meta_title: 'Comment fonctionne ABCspareparts – devis souvent en 24h',
    meta_description:
      'Pièces industrielles et MRO : envoyez référence et fabricant. Devis souvent sous 24 heures, livraison en Europe. Plus de 11975 marques.',
    h1: 'Comment fonctionne ABCspareparts',
    breadcrumb: '<a href="/fr/">Accueil</a> · Comment ça marche',
    direct_answer:
      'ABCspareparts est un revendeur indépendant de pièces industrielles et MRO en Europe (siège à Augsburg). Envoyez la référence, le fabricant et la quantité via le formulaire de la page d’accueil ; un devis suit souvent sous 24 heures. Après commande, la livraison se fait vers des pays européens — délai et frais de port figurent sur le devis.',
    steps_title: 'Étapes : demande, devis, commande, livraison',
    step1_name: 'Envoyer la demande',
    step1_text:
      'Envoyez la référence et le fabricant — plus la quantité — via le formulaire d’accueil ou par e-mail à info@abcspareparts.eu. La demande est sans engagement. Aucun prix n’est publié sur le site.',
    step2_name: 'Recevoir le devis',
    step2_text:
      'ABCspareparts vérifie disponibilité et conditions et s’efforce d’envoyer un devis sous 24 heures. Les délais standard sont communiqués lors de l’établissement de l’offre.',
    step3_name: 'Commander',
    step3_text:
      'Le contrat est formé à l’acceptation du devis. En cas de paiement d’avance, le délai de livraison commence à réception du paiement ; pour les autres modes, à la conclusion du contrat.',
    step4_name: 'Livraison',
    step4_text:
      'La livraison se fait en Allemagne, Italie, France, Espagne et d’autres pays européens. Les frais de port sont calculés au cas par cas et indiqués sur le devis ou la confirmation de commande. L’expédition express est disponible sur demande.',
    need_title: 'Ce qu’il faut envoyer',
    need_intro: 'Pour un examen clair et rapide, il faut en général :',
    need_li1: 'Fabricant ou marque',
    need_li2: 'Référence (complète, comme sur la plaque ou la documentation)',
    need_li3: 'Quantité',
    need_li4: 'Facultatif : machine, application ou autre contexte technique',
    need_note:
      'Vous pouvez aussi demander depuis l’annuaire des marques ou une fiche marque. Pour disponibilité et prix, utilisez le formulaire d’accueil — pas l’index des marques seul.',
    brands_title: 'Quelles marques et pièces',
    brands_p1:
      'ABCspareparts couvre 11975+ fabricants de pièces industrielles et MRO. Le réseau comprend des composants d’automatisation industrielle, capteurs, actionneurs et dispositifs de commande — ainsi que mécanique, électricité/électronique, pneumatique et hydraulique. Lorsque c’est utile, des alternatives vérifiées sont possibles, y compris pour des pièces obsolètes.',
    brands_p2:
      'La liste A–Z avec recherche est sous Marques. Exemples dans l’assortiment : Siemens, Festo, ABB et Schneider. ABCspareparts est un revendeur indépendant ; les marques servent uniquement à identifier les produits.',
    brands_link: 'Ouvrir la liste A–Z des marques',
    time_title: 'Délais de réponse',
    time_p1:
      'Un devis suit souvent sous 24 heures. Disponibilité : lundi–vendredi 09:00–18:00, samedi 10:00–14:00, dimanche fermé (Augsburg, Allemagne).',
    time_p2:
      'Le délai de livraison dépend de la disponibilité et du mode d’expédition. Il est communiqué avant la conclusion du contrat. Cette page ne promet pas de jours de livraison fixes et ne publie pas de stocks.',
    faq_title: 'Questions fréquentes',
    faq_q1: 'Comment demander des pièces à ABCspareparts ?',
    faq_a1:
      'Envoyez référence, fabricant et quantité via le formulaire d’accueil ou à info@abcspareparts.eu. La demande est sans engagement.',
    faq_q2: 'En combien de temps arrive le devis ?',
    faq_a2:
      'ABCspareparts s’efforce d’envoyer un devis sous 24 heures. La réponse arrive en général dans ce délai ; les délais de livraison exacts figurent sur le devis.',
    faq_q3: 'Quelles informations faut-il ?',
    faq_a3:
      'Au minimum fabricant, référence et quantité. Machine ou application aident. Les références complètes de la plaque accélèrent l’examen.',
    faq_q4: 'Quelles marques et pièces couvrez-vous ?',
    faq_a4:
      '11975+ fabricants de pièces industrielles et MRO, dont automatisation, capteurs, actionneurs, dispositifs de commande et composants mécaniques, électriques/électroniques, pneumatiques et hydrauliques. Liste A–Z sous Marques.',
    faq_q5: 'Livrez-vous dans toute l’Europe ?',
    faq_a5:
      'Oui. Livraison en Allemagne, Italie, France, Espagne et d’autres pays européens. Itinéraire, délai et frais dépendent de l’article, de la disponibilité et de la destination, et figurent sur le devis.',
    faq_q6: 'Y a-t-il des prix sur le site ?',
    faq_a6:
      'Non. Aucun tarif n’est publié. Disponibilité et conditions suivent après examen de la demande — sans engagement.',
    faq_q7: 'Que se passe-t-il après le devis ?',
    faq_a7:
      'Le contrat est formé à l’acceptation du devis. En cas de paiement d’avance, le délai commence à réception du paiement ; pour les autres modes, à la conclusion du contrat. L’expédition express est disponible sur demande.',
    faq_q8: 'Où est basé ABCspareparts et comment vous joindre ?',
    faq_a8:
      'ABCspareparts est basé à Augsburg, Allemagne. Contact via le formulaire d’accueil ou par e-mail à info@abcspareparts.eu. Mentions complètes sur l’entreprise dans les mentions légales.',
    faq_a8_html:
      'ABCspareparts est basé à Augsburg, Allemagne. Contact via le formulaire d’accueil ou par e-mail à info@abcspareparts.eu. Mentions complètes sur l’entreprise dans les <a href="/fr/impressum.html">mentions légales</a>.',
    cta_title: 'Demande sans engagement',
    cta_text:
      'Utilisez le formulaire de la page d’accueil — aucun prix sur le site, réponse souvent sous 24 heures.',
    cta_button: 'Aller au formulaire de demande',
    nav_home: 'Accueil',
    nav_how: 'Comment ça marche',
    howto_name: 'Demander des pièces à ABCspareparts',
    howto_description:
      'Envoyer référence et fabricant, recevoir un devis souvent sous 24 heures, commander et être livré en Europe.'
  }
};

function pagePath(lang) {
  return lang === 'de' ? `/${PAGE_FILE}` : `/${lang}/${PAGE_FILE}`;
}

function homePath(lang) {
  return lang === 'de' ? '/' : `/${lang}/`;
}

function contactPath(lang) {
  return `${homePath(lang)}#contact`;
}

function marchePath(lang) {
  if (lang === 'de') return '/marche.html';
  if (lang === 'en' || lang === 'it') return `/${lang}/marche.html`;
  return '/marche.html';
}

module.exports = {
  PAGE_FILE,
  HOW_IT_WORKS_I18N,
  pagePath,
  homePath,
  contactPath,
  marchePath
};
