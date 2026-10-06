#!/usr/bin/env python3
"""
Generate brand content for 54 brands (10 alphabetical + 44 collage)
Following abel pattern but WITHOUT external links
"""
import json
import copy

# Load existing brand-content.json
with open('brand-content.json', 'r', encoding='utf-8') as f:
    existing_content = json.load(f)

# Template based on abel but cleaned of external links
def create_brand_entry(slug, display_name, config):
    """Create a complete brand entry"""
    
    focus = config.get('focus', 'industrial')
    desc_de = config.get('desc_de', 'Industriekomponenten')
    desc_en = config.get('desc_en', 'industrial components')
    company = config.get('company', '')
    price_comp = config.get('price_competitive', False)
    uncertain = config.get('uncertain', False)
    related = config.get('related', [])
    
    # Price competitive text
    price_de = ' Für viele ' + display_name + ' Ersatzteile können wir attraktive Konditionen anbieten.' if price_comp else ''
    price_en = ' We can offer competitive pricing on many ' + display_name + ' spare parts.' if price_comp else ''
    
    base_url = f"https://abcspareparts.eu/marche/{slug}.html"
    
    # Build entry
    entry = {
        "intro": "",
        "products": [],
        "applications": [],
        "faq": [],
        "related_slugs": related,
        "related_labels": {},
        "faq_after": [
            {"q": "brand_faq_q4", "a": "brand_faq_a4"},
            {"q": "brand_faq_q5", "a": "brand_faq_a5"},
            {"q": "brand_faq_q6", "a": "brand_faq_a6"}
        ],
        "faq_note_key": "bx_note",
        "blocks": [
            {
                "type": "info",
                "id": "ueber-marke",
                "headingId": "ueber-marke-h",
                "className": "brand-info",
                "titleKey": "bx_about_title",
                "bodyKey": "bx_about_text"
            },
            {
                "type": "info",
                "id": "produkte",
                "headingId": "produkte-h",
                "className": "brand-info",
                "titleKey": "bx_products_title",
                "introKey": "bx_products_intro",
                "listKey": "bx_products_list",
                "listClass": "brand-list"
            },
            {
                "type": "info",
                "id": "technik",
                "headingId": "technik-h",
                "className": "brand-info",
                "titleKey": "bx_tech_title",
                "listKey": "bx_tech_list",
                "listClass": "brand-list"
            },
            {
                "type": "grid",
                "className": "brand-info-grid",
                "items": [
                    {
                        "type": "info",
                        "id": "anwendungen",
                        "headingId": "anwendungen-h",
                        "className": "brand-info",
                        "titleKey": "bx_apps_title",
                        "listKey": "bx_apps_list",
                        "listClass": "brand-list brand-list-compact"
                    },
                    {
                        "type": "info",
                        "id": "anfrage",
                        "headingId": "anfrage-h",
                        "className": "brand-info brand-info-accent",
                        "titleKey": "bx_request_title",
                        "listKey": "bx_request_list",
                        "listClass": "brand-list brand-list-check"
                    }
                ]
            }
        ],
        "schema": {
            "name_from": "meta_title",
            "date_modified": True,
            "about": {"@id": f"{base_url}#brand"},
            "mentions": {"@id": f"{base_url}#manufacturer"},
            "extra": [
                {
                    "@type": "Brand",
                    "@id": f"{base_url}#brand",
                    "name": display_name
                },
                {
                    "@type": "Organization",
                    "@id": f"{base_url}#manufacturer",
                    "brand": {"@id": f"{base_url}#brand"},
                    "name": company if company else display_name
                },
                {
                    "@type": "Service",
                    "@id": f"{base_url}#service",
                    "name": f"Beschaffung von {display_name} Ersatzteilen",
                    "serviceType": "MRO-Ersatzteilbeschaffung",
                    "provider": {"@id": "https://abcspareparts.eu/#organization"},
                    "brand": {"@id": f"{base_url}#brand"},
                    "areaServed": {"@type": "Place", "name": "Europa"}
                }
            ]
        },
        "i18n": {
            "de": {
                "meta_title": f"{display_name} {desc_de} – Ersatzteile | ABCspareparts",
                "meta_description": f"{display_name} Ersatzteile beschaffen.{' Attraktive Konditionen.' if price_comp else ''} Typ senden – Angebot oft in 24 h.",
                "brand_h1": f"{display_name} – Ersatzteile und Komponenten",
                "brand_intro": f"ABCspareparts beschafft {display_name} Ersatzteile für Industrie und Instandhaltung in ganz Europa.{price_de} Senden Sie uns Typ, Artikelnummer und Menge – wir antworten in der Regel innerhalb von 24 Stunden.",
                "brand_intro_p2": 'Wir prüfen die Verfügbarkeit des Originalteils und, wo technisch sinnvoll, kompatible Alternativen oder Nachfolgemodelle. Diese Seite ersetzt keine Live-Bestandsliste: Nutzen Sie bitte die unverbindliche <a href="#contact">Anfrage</a>.',
                "bx_about_title": f"Über {display_name}",
                "bx_about_text": f"<p>{company if company else display_name + ' bezeichnet ' + desc_de + ' im industriellen Bereich.'}</p>" if uncertain else f"<p>{company}</p>" if company else f"<p>{display_name} ist ein Hersteller von {desc_de}.</p>",
                "bx_products_title": f"{display_name} Produkte, die wir beschaffen",
                "bx_products_intro": "Typische Anfragen betreffen:",
                "bx_products_list": f"<li>{desc_de.capitalize()}</li><li>Ersatz- und Verschleißteile</li>",
                "bx_tech_title": f"Worauf es bei {display_name} Ersatzteilen ankommt",
                "bx_tech_list": "<li><strong>Vollständige Typnummer:</strong> Genaue Artikelnummer vom Typenschild erleichtert die Zuordnung.</li><li><strong>Technische Daten:</strong> Spannung, Schaltleistung, Abmessungen oder Anschlussart angeben.</li><li><strong>Einsatzort:</strong> Anlage oder Maschine nennen, in der das Teil verbaut ist.</li>",
                "bx_apps_title": "Typische Einsatzbereiche",
                "bx_apps_list": "<li>Maschinen- und Anlagenbau</li><li>Instandhaltung und MRO</li><li>Industrieautomation</li>",
                "bx_request_title": "Diese Angaben beschleunigen Ihr Angebot",
                "bx_request_list": "<li>Vollständige Typ- oder Artikelnummer vom Typenschild (ein Foto hilft)</li><li>Technische Eckdaten wie Spannung, Größe oder Leistung</li><li>Anlage oder Maschine, in der das Teil verbaut ist</li><li>Menge und gewünschter Liefertermin</li><li>Nur Original oder kompatible Alternative möglich</li>",
                "brand_faq_q4": f"Beschafft ABCspareparts auch ältere oder nicht mehr gelistete {display_name} Teile?",
                "brand_faq_a4": "Ja. Wir fragen beim Hersteller sowie bei Distributoren und Brokern in Europa nach. Ist das Original nicht mehr erhältlich, schlagen wir nach Rücksprache ein Nachfolgemodell oder eine kompatible Alternative vor.",
                "brand_faq_q5": f"Was sind typische {display_name} Produkte?",
                "brand_faq_a5": f"{desc_de.capitalize()}.",
                "brand_faq_q6": f"{'Wer stellt ' + display_name + ' her?' if company else 'Wo wird ' + display_name + ' eingesetzt?'}",
                "brand_faq_a6": company if company else f"{display_name} Komponenten werden in verschiedenen industriellen Anwendungen eingesetzt.",
                "bx_note": f"{display_name} ist ein Name bzw. eine Marke{' von ' + company if company else ' im industriellen Bereich'}. Die Nennung dient ausschließlich der Identifikation der Produkte. Angaben basieren auf öffentlich zugänglichen Informationen. Stand: Oktober 2026."
            },
            "en": {
                "meta_title": f"{display_name} {desc_en} – Spare Parts | ABCspareparts",
                "meta_description": f"{display_name} spare parts sourcing.{' Competitive prices.' if price_comp else ''} Send type – quote often in 24 h.",
                "brand_h1": f"{display_name} – spare parts and components",
                "brand_intro": f"ABCspareparts sources {display_name} spare parts for industry and maintenance across Europe.{price_en} Send us the type, part number and quantity – we usually reply within 24 hours.",
                "brand_intro_p2": 'We check availability of the original part and, where technically appropriate, compatible alternatives or successor models. This page is not a live stock list: please use the non-binding <a href="#contact">request</a>.',
                "bx_about_title": f"About {display_name}",
                "bx_about_text": f"<p>{company if company else display_name + ' refers to ' + desc_en + ' in the industrial sector.'}</p>" if uncertain else f"<p>{company}</p>" if company else f"<p>{display_name} is a manufacturer of {desc_en}.</p>",
                "bx_products_title": f"{display_name} products we source",
                "bx_products_intro": "Typical requests cover:",
                "bx_products_list": f"<li>{desc_en.capitalize()}</li><li>Spare and wear parts</li>",
                "bx_tech_title": f"What matters with {display_name} spare parts",
                "bx_tech_list": "<li><strong>Full type number:</strong> Exact part number from the rating plate helps identification.</li><li><strong>Technical data:</strong> state voltage, rating, dimensions or connection type.</li><li><strong>Application:</strong> name the plant or machine the part is installed in.</li>",
                "bx_apps_title": "Typical applications",
                "bx_apps_list": "<li>Machinery and plant engineering</li><li>Maintenance and MRO</li><li>Industrial automation</li>",
                "bx_request_title": "This information speeds up your quote",
                "bx_request_list": "<li>Full type or part number from the rating plate (a photo helps)</li><li>Key technical data such as voltage, size or rating</li><li>Plant or machine the part is installed in</li><li>Quantity and required delivery date</li><li>Original only, or compatible alternative acceptable</li>",
                "brand_faq_q4": f"Does ABCspareparts also source older or no longer listed {display_name} parts?",
                "brand_faq_a4": "Yes. We check with the manufacturer as well as distributors and brokers in Europe. If the original is no longer available, we propose – after consultation – a successor model or compatible alternative.",
                "brand_faq_q5": f"What are typical {display_name} products?",
                "brand_faq_a5": f"{desc_en.capitalize()}.",
                "brand_faq_q6": f"{'Who makes ' + display_name + '?' if company else 'Where is ' + display_name + ' used?'}",
                "brand_faq_a6": company if company else f"{display_name} components are used in various industrial applications.",
                "bx_note": f"{display_name} is a name or trademark{' of ' + company if company else ' in the industrial sector'}, mentioned solely to identify products. Information is based on publicly available sources. Last updated: October 2026."
            },
            "it": {
                "meta_title": f"{display_name} ricambi | ABCspareparts",
                "meta_description": f"Ricambi {display_name}.{' Prezzi competitivi.' if price_comp else ''} Invii tipo – preventivo spesso entro 24 h.",
                "brand_h1": f"{display_name} – ricambi e componenti",
                "brand_intro": f"ABCspareparts fornisce ricambi {display_name} per industria e manutenzione in tutta Europa. Ci invii tipo, codice e quantità – di solito rispondiamo entro 24 ore.",
                "brand_intro_p2": 'Verifichiamo la disponibilità del ricambio originale e, se tecnicamente adatto, alternative compatibili o modelli successori. Questa pagina non sostituisce un elenco live: usi la <a href="#contact">richiesta senza impegno</a>.',
                "bx_about_title": f"Chi è {display_name}",
                "bx_about_text": f"<p>{company}</p>" if company else f"<p>{display_name} è un produttore industriale.</p>",
                "bx_products_title": f"Prodotti {display_name} che forniamo",
                "bx_products_intro": "Le richieste tipiche riguardano:",
                "bx_products_list": f"<li>Componenti industriali</li><li>Ricambi e parti di usura</li>",
                "bx_tech_title": f"Cosa conta nei ricambi {display_name}",
                "bx_tech_list": "<li><strong>Codice completo:</strong> Numero articolo preciso dalla targhetta.</li><li><strong>Dati tecnici:</strong> tensione, dimensioni, tipo di collegamento.</li><li><strong>Applicazione:</strong> impianto o macchina in cui è montato.</li>",
                "bx_apps_title": "Applicazioni tipiche",
                "bx_apps_list": "<li>Costruzione macchine</li><li>Manutenzione</li><li>Automazione industriale</li>",
                "bx_request_title": "Questi dati accelerano il preventivo",
                "bx_request_list": "<li>Codice completo dalla targhetta (una foto aiuta)</li><li>Dati tecnici chiave</li><li>Impianto o macchina</li><li>Quantità e data di consegna</li><li>Solo originale o alternativa ammessa</li>",
                "brand_faq_q4": f"ABCspareparts fornisce anche ricambi {display_name} datati?",
                "brand_faq_a4": "Sì. Verifichiamo presso il costruttore e distributori in Europa.",
                "brand_faq_q5": f"Quali prodotti {display_name} tipici?",
                "brand_faq_a5": "Componenti industriali.",
                "brand_faq_q6": f"Chi produce {display_name}?",
                "brand_faq_a6": company if company else "Vari produttori industriali.",
                "bx_note": f"{display_name} è un marchio{' di ' + company if company else ''}, citato solo per identificare i prodotti. Informazioni da fonti pubbliche. Aggiornato: ottobre 2026."
            },
            "es": {
                "meta_title": f"{display_name} repuestos | ABCspareparts",
                "meta_description": f"Repuestos {display_name}.{' Precios competitivos.' if price_comp else ''} Envíe tipo – oferta a menudo en 24 h.",
                "brand_h1": f"{display_name} – repuestos y componentes",
                "brand_intro": f"ABCspareparts suministra repuestos {display_name} para industria y mantenimiento en toda Europa. Envíenos el tipo, código y cantidad – normalmente respondemos en 24 horas.",
                "brand_intro_p2": 'Comprobamos la disponibilidad del repuesto original y, cuando es técnicamente adecuado, alternativas compatibles o modelos sucesores. Esta página no es un listado en tiempo real: utilice la <a href="#contact">solicitud sin compromiso</a>.',
                "bx_about_title": f"Sobre {display_name}",
                "bx_about_text": f"<p>{company}</p>" if company else f"<p>{display_name} es un fabricante industrial.</p>",
                "bx_products_title": f"Productos {display_name} que suministramos",
                "bx_products_intro": "Las solicitudes habituales abarcan:",
                "bx_products_list": f"<li>Componentes industriales</li><li>Repuestos y piezas de desgaste</li>",
                "bx_tech_title": f"Lo que importa en los repuestos {display_name}",
                "bx_tech_list": "<li><strong>Código completo:</strong> Número de artículo preciso de la placa.</li><li><strong>Datos técnicos:</strong> tensión, dimensiones, tipo de conexión.</li><li><strong>Aplicación:</strong> instalación o máquina donde está montado.</li>",
                "bx_apps_title": "Aplicaciones típicas",
                "bx_apps_list": "<li>Construcción de máquinas</li><li>Mantenimiento</li><li>Automatización industrial</li>",
                "bx_request_title": "Estos datos aceleran su oferta",
                "bx_request_list": "<li>Código completo de la placa (una foto ayuda)</li><li>Datos técnicos clave</li><li>Instalación o máquina</li><li>Cantidad y fecha de entrega</li><li>Solo original o alternativa aceptada</li>",
                "brand_faq_q4": f"¿ABCspareparts también suministra repuestos {display_name} antiguos?",
                "brand_faq_a4": "Sí. Consultamos al fabricante y distribuidores en Europa.",
                "brand_faq_q5": f"¿Qué productos {display_name} típicos?",
                "brand_faq_a5": "Componentes industriales.",
                "brand_faq_q6": f"¿Quién fabrica {display_name}?",
                "brand_faq_a6": company if company else "Varios fabricantes industriales.",
                "bx_note": f"{display_name} es una marca{' de ' + company if company else ''}, mencionado solo para identificar los productos. Información de fuentes públicas. Actualizado: octubre de 2026."
            },
            "fr": {
                "meta_title": f"{display_name} pièces | ABCspareparts",
                "meta_description": f"Pièces {display_name}.{' Prix compétitifs.' if price_comp else ''} Envoyez type – devis souvent sous 24 h.",
                "brand_h1": f"{display_name} – pièces et composants",
                "brand_intro": f"ABCspareparts fournit pièces {display_name} pour industrie et maintenance dans toute l'Europe. Envoyez-nous le type, la référence et la quantité – nous répondons généralement sous 24 heures.",
                "brand_intro_p2": 'Nous vérifions la disponibilité de la pièce d\'origine et, lorsque c\'est techniquement pertinent, des alternatives compatibles ou des modèles successeurs. Cette page ne remplace pas une liste en temps réel : utilisez la <a href="#contact">demande sans engagement</a>.',
                "bx_about_title": f"À propos de {display_name}",
                "bx_about_text": f"<p>{company}</p>" if company else f"<p>{display_name} est un fabricant industriel.</p>",
                "bx_products_title": f"Produits {display_name} que nous fournissons",
                "bx_products_intro": "Les demandes typiques concernent :",
                "bx_products_list": f"<li>Composants industriels</li><li>Pièces de rechange et d'usure</li>",
                "bx_tech_title": f"Ce qui compte pour les pièces {display_name}",
                "bx_tech_list": "<li><strong>Code complet :</strong> Numéro d'article précis de la plaque.</li><li><strong>Données techniques :</strong> tension, dimensions, type de connexion.</li><li><strong>Application :</strong> installation ou machine où la pièce est montée.</li>",
                "bx_apps_title": "Applications typiques",
                "bx_apps_list": "<li>Construction de machines</li><li>Maintenance</li><li>Automatisation industrielle</li>",
                "bx_request_title": "Ces informations accélèrent votre devis",
                "bx_request_list": "<li>Code complet de la plaque (une photo aide)</li><li>Données techniques clés</li><li>Installation ou machine</li><li>Quantité et date de livraison</li><li>Original uniquement ou alternative acceptée</li>",
                "brand_faq_q4": f"ABCspareparts fournit-il aussi des pièces {display_name} anciennes ?",
                "brand_faq_a4": "Oui. Nous interrogeons le fabricant et des distributeurs en Europe.",
                "brand_faq_q5": f"Quels produits {display_name} typiques ?",
                "brand_faq_a5": "Composants industriels.",
                "brand_faq_q6": f"Qui fabrique {display_name} ?",
                "brand_faq_a6": company if company else "Divers fabricants industriels.",
                "bx_note": f"{display_name} est une marque{' de ' + company if company else ''}, cité uniquement pour identifier les produits. Informations de sources publiques. Mise à jour : octobre 2026."
            }
        }
    }
    
    return entry

# Brand configurations
brands_to_add = {
    # 10 alphabetical brands
    'abitron': {
        'display': 'ABITRON',
        'desc_de': 'Industrieelektronik',
        'desc_en': 'industrial electronics',
        'company': '',
        'uncertain': False,
        'price_competitive': False,
        'related': []
    },
    'abj': {
        'display': 'ABJ',
        'desc_de': 'Industriekomponenten',
        'desc_en': 'industrial components',
        'company': '',
        'uncertain': True,
        'price_competitive': False,
        'related': []
    },
    'abk': {
        'display': 'ABK',
        'desc_de': 'Industrieersatzteile',
        'desc_en': 'industrial spare parts',
        'company': '',
        'uncertain': True,
        'price_competitive': False,
        'related': []
    },
    'abko': {
        'display': 'ABKO',
        'desc_de': 'Industriekomponenten',
        'desc_en': 'industrial components',
        'company': '',
        'uncertain': True,
        'price_competitive': False,
        'related': []
    },
    'abl': {
        'display': 'ABL',
        'desc_de': 'Elektroinstallation, Steckdosen und Steckverbinder',
        'desc_en': 'electrical installation, sockets and connectors',
        'company': 'Deutsche Elektrotechnik-Hersteller (ABL SURSUM)',
        'uncertain': False,
        'price_competitive': False,
        'related': ['abl-sursum', 'wago', 'phoenix-contact']
    },
    'abl-sursum': {
        'display': 'ABL SURSUM',
        'desc_de': 'Elektroinstallation, Industriestecker und Steckverbinder',
        'desc_en': 'electrical installation, industrial plugs and connectors',
        'company': 'Teil der deutschen ABL Elektrotechnik-Herstellerfamilie',
        'uncertain': False,
        'price_competitive': False,
        'related': ['abl', 'wago', 'phoenix-contact']
    },
    'abloy': {
        'display': 'ABLOY',
        'desc_de': 'Hochsicherheitsschlösser, Zylinder und Zutrittskontrolle',
        'desc_en': 'high-security locks, cylinders and access control',
        'company': 'Finnischer Sicherheitsschloss-Hersteller (ASSA ABLOY Gruppe)',
        'uncertain': False,
        'price_competitive': False,
        'related': []
    },
    'abm': {
        'display': 'ABM',
        'desc_de': 'Antriebe und Bewegungssteuerung',
        'desc_en': 'drives and motion control',
        'company': '',
        'uncertain': True,
        'price_competitive': False,
        'related': []
    },
    'abo': {
        'display': 'ABO',
        'desc_de': 'Automatisierung und Steuerungstechnik',
        'desc_en': 'automation and control technology',
        'company': '',
        'uncertain': True,
        'price_competitive': False,
        'related': []
    },
    'aboni': {
        'display': 'ABONI',
        'desc_de': 'Industrieausrüstung',
        'desc_en': 'industrial equipment',
        'company': '',
        'uncertain': False,
        'price_competitive': False,
        'related': []
    },
    
    # Collage brands - all price competitive
    'aventics': {
        'display': 'AVENTICS',
        'desc_de': 'Pneumatikzylinder, Ventile, Ventilinseln und Druckluftaufbereitung',
        'desc_en': 'pneumatic cylinders, valves, valve islands and air preparation',
        'company': 'Emerson (ehemalige Bosch Rexroth Pneumatik-Sparte)',
        'uncertain': False,
        'price_competitive': True,
        'related': ['festo', 'smc', 'parker']
    },
    'balluff': {
        'display': 'Balluff',
        'desc_de': 'induktive und optoelektronische Sensoren, RFID, Positionssensoren und Konnektivität',
        'desc_en': 'inductive and photoelectric sensors, RFID, position sensors and connectivity',
        'company': 'Deutscher Sensorhersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'ifm', 'pepperl-plus-fuchs']
    },
    'baumer': {
        'display': 'Baumer',
        'desc_de': 'Sensoren, Encoder, Vision-Systeme und Prozessinstrumentierung',
        'desc_en': 'sensors, encoders, vision systems and process instrumentation',
        'company': 'Schweizer Sensor- und Messtechnik-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'ifm', 'leuze']
    },
    'beckhoff': {
        'display': 'Beckhoff',
        'desc_de': 'PC-basierte Automation, Industrie-PCs, I/O-Module, EtherCAT und Servoantriebe',
        'desc_en': 'PC-based automation, industrial PCs, I/O modules, EtherCAT and servo drives',
        'company': 'Deutscher Automatisierungshersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['siemens', 'schneider-electric', 'omron']
    },
    'bernstein': {
        'display': 'Bernstein',
        'desc_de': 'Sicherheitsschalter, Positionsschalter, Sensoren und Gehäuse',
        'desc_en': 'safety switches, position switches, sensors and enclosures',
        'company': 'Deutscher Sicherheitsschalter-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['euchner', 'schmersal', 'pilz']
    },
    'carlo-gavazzi': {
        'display': 'Carlo Gavazzi',
        'desc_de': 'Sensoren, Überwachungsrelais, Halbleiterrelais, Energiemanagement und Feldbuskomponenten',
        'desc_en': 'sensors, monitoring relays, solid-state relays, energy management and fieldbus components',
        'company': 'Schweizerisch-italienischer Automatisierungskomponenten-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['schneider-electric', 'omron', 'phoenix-contact']
    },
    'cognex': {
        'display': 'Cognex',
        'desc_de': 'Bildverarbeitungssysteme, Barcodeleser und Vision-Sensoren',
        'desc_en': 'machine vision systems, barcode readers and vision sensors',
        'company': 'US-amerikanischer Machine-Vision-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['keyence', 'sick', 'omron']
    },
    'control-techniques': {
        'display': 'Control Techniques',
        'desc_de': 'Frequenzumrichter, Servoantriebe und Motorsteuerung',
        'desc_en': 'variable frequency drives, servo drives and motor control',
        'company': 'Nidec (ehemals Emerson Industrial Automation)',
        'uncertain': False,
        'price_competitive': True,
        'related': ['siemens', 'schneider-electric', 'lenze']
    },
    'datalogic': {
        'display': 'Datalogic',
        'desc_de': 'Barcodeleser, Bildverarbeitung, Sicherheitssysteme und Sensoren',
        'desc_en': 'barcode readers, machine vision, safety systems and sensors',
        'company': 'Italienischer Automatic-Data-Capture-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['cognex', 'keyence', 'sick']
    },
    'di-soric': {
        'display': 'di-soric',
        'desc_de': 'optoelektronische, Ultraschall-, induktive Sensoren und Sensortechnik',
        'desc_en': 'photoelectric, ultrasonic, inductive sensors and sensor technology',
        'company': 'Deutscher Sensorhersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'balluff', 'ifm']
    },
    'ebm-papst': {
        'display': 'ebm-papst',
        'desc_de': 'Axial- und Radialventilatoren, Gebläse, Motoren für Lüftung und Kühlung',
        'desc_en': 'axial and centrifugal fans, blowers, motors for ventilation and cooling',
        'company': 'Deutscher Ventilatoren- und Motorenhersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': []
    },
    'euchner': {
        'display': 'Euchner',
        'desc_de': 'Sicherheitsschalter, Sicherheitssensoren, Positionsschalter und Zustimmtaster',
        'desc_en': 'safety switches, safety sensors, position switches and enabling devices',
        'company': 'Deutscher Sicherheitstechnik-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['schmersal', 'pilz', 'bernstein']
    },
    'festo': {
        'display': 'Festo',
        'desc_de': 'Pneumatikzylinder, Ventile, Ventilinseln, Greifer und Automatisierungstechnik',
        'desc_en': 'pneumatic cylinders, valves, valve terminals, grippers and automation technology',
        'company': 'Deutscher Pneumatik- und Automatisierungshersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['smc', 'aventics', 'parker']
    },
    'gefran': {
        'display': 'Gefran',
        'desc_de': 'Drucksensoren, Temperaturregler, Positionssensoren und Automatisierungskomponenten',
        'desc_en': 'pressure sensors, temperature controllers, position sensors and automation components',
        'company': 'Italienischer Sensor- und Automatisierungshersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'balluff', 'turck']
    },
    'grundfos': {
        'display': 'Grundfos',
        'desc_de': 'Kreiselpumpen, Tauchpumpen, Druckerhöhungsanlagen und Pumpensteuerungen',
        'desc_en': 'centrifugal pumps, submersible pumps, booster systems and pump controls',
        'company': 'Dänischer Pumpenhersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['ksb', 'wilo']
    },
    'honeywell': {
        'display': 'Honeywell',
        'desc_de': 'Sensoren, Schalter, Steuerungssysteme, Prozessautomation und Industriesteuerungen',
        'desc_en': 'sensors, switches, control systems, process automation and industrial controls',
        'company': 'US-amerikanischer Industriekonzern',
        'uncertain': False,
        'price_competitive': True,
        'related': ['siemens', 'schneider-electric', 'omron']
    },
    'ifm': {
        'display': 'ifm',
        'desc_de': 'induktive Sensoren, optoelektronische Sensoren, Drucksensoren, Durchflusssensoren, AS-Interface',
        'desc_en': 'inductive sensors, photoelectric sensors, pressure sensors, flow sensors, AS-Interface',
        'company': 'Deutscher Sensorhersteller (ifm electronic)',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'balluff', 'pepperl-plus-fuchs']
    },
    'imi-norgren': {
        'display': 'IMI Norgren',
        'desc_de': 'Pneumatikzylinder, Ventile, FRL-Einheiten und Bewegungssteuerung',
        'desc_en': 'pneumatic cylinders, valves, FRL units and motion control',
        'company': 'IMI Precision Engineering',
        'uncertain': False,
        'price_competitive': True,
        'related': ['festo', 'smc', 'parker']
    },
    'ipf': {
        'display': 'ipf electronic',
        'desc_de': 'optoelektronische Sensoren, induktive Sensoren, Abstandssensoren und Sicherheitstechnik',
        'desc_en': 'photoelectric sensors, inductive sensors, distance sensors and safety technology',
        'company': 'Deutscher Sensorhersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'balluff', 'ifm']
    },
    'keyence': {
        'display': 'Keyence',
        'desc_de': 'Sensoren, Bildverarbeitung, Messsysteme, Barcodeleser und SPS-Systeme',
        'desc_en': 'sensors, machine vision, measuring systems, barcode readers and PLC systems',
        'company': 'Japanischer Sensor- und Automatisierungshersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'cognex', 'omron']
    },
    'lenze': {
        'display': 'Lenze',
        'desc_de': 'Frequenzumrichter, Servoantriebe, Getriebemotoren und Motion Control',
        'desc_en': 'frequency inverters, servo drives, gearmotors and motion control',
        'company': 'Deutscher Antriebstechnik-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['siemens', 'sew-eurodrive', 'schneider-electric']
    },
    'leuze': {
        'display': 'Leuze',
        'desc_de': 'Sicherheits-Lichtschranken, optoelektronische Sensoren, Barcodeleser und Sensorlösungen',
        'desc_en': 'safety light curtains, photoelectric sensors, barcode readers and sensor solutions',
        'company': 'Deutscher Sensorhersteller (Leuze electronic)',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'balluff', 'ifm']
    },
    'mac': {
        'display': 'MAC',
        'desc_de': 'Pneumatik-Magnetventile, Ventilinseln und Pneumatiksteuerung',
        'desc_en': 'pneumatic solenoid valves, valve islands and pneumatic control',
        'company': 'Parker Hannifin (MAC Valves)',
        'uncertain': False,
        'price_competitive': True,
        'related': ['festo', 'smc', 'parker']
    },
    'metal-work-pneumatic': {
        'display': 'Metal Work Pneumatic',
        'desc_de': 'Pneumatikzylinder, Ventile, FRL-Einheiten und Pneumatikkomponenten',
        'desc_en': 'pneumatic cylinders, valves, FRL units and pneumatic components',
        'company': 'Italienischer Pneumatikhersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['festo', 'smc', 'parker']
    },
    'micro-detectors': {
        'display': 'Micro Detectors',
        'desc_de': 'optoelektronische Sensoren, induktive Sensoren, Ultraschallsensoren und Sensortechnik',
        'desc_en': 'photoelectric sensors, inductive sensors, ultrasonic sensors and sensor technology',
        'company': 'Italienischer Sensorhersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'balluff', 'ifm']
    },
    'mitsubishi-electric': {
        'display': 'Mitsubishi Electric',
        'desc_de': 'SPS, Servosysteme, Frequenzumrichter, HMI und Fabrikautomation',
        'desc_en': 'PLCs, servo systems, frequency inverters, HMI and factory automation',
        'company': 'Japanischer Automatisierungshersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['siemens', 'omron', 'schneider-electric']
    },
    'omron': {
        'display': 'Omron',
        'desc_de': 'SPS, Sensoren, Sicherheitssysteme, Relais, Schalter und Industrieautomation',
        'desc_en': 'PLCs, sensors, safety systems, relays, switches and industrial automation',
        'company': 'Japanischer Automatisierungshersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['siemens', 'schneider-electric', 'mitsubishi-electric']
    },
    'panasonic': {
        'display': 'Panasonic',
        'desc_de': 'Industriesensoren, Relais, SPS, Servomotoren und Fabrikautomation',
        'desc_en': 'industrial sensors, relays, PLCs, servo motors and factory automation',
        'company': 'Japanischer Elektronik- und Automatisierungshersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['omron', 'keyence', 'mitsubishi-electric']
    },
    'parker': {
        'display': 'Parker',
        'desc_de': 'Hydraulik- und Pneumatikzylinder, Ventile, Filter, Motion Control und Fluidverbinder',
        'desc_en': 'hydraulic and pneumatic cylinders, valves, filters, motion control and fluid connectors',
        'company': 'US-amerikanischer Motion- und Control-Technologien-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['festo', 'smc', 'bosch-rexroth']
    },
    'pepperl-plus-fuchs': {
        'display': 'Pepperl+Fuchs',
        'desc_de': 'induktive Sensoren, Ultraschallsensoren, Vision-Sensoren, AS-Interface und Feldbustechnik',
        'desc_en': 'inductive sensors, ultrasonic sensors, vision sensors, AS-Interface and fieldbus technology',
        'company': 'Deutscher Sensor- und Explosionsschutz-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'ifm', 'balluff']
    },
    'phoenix-contact': {
        'display': 'Phoenix Contact',
        'desc_de': 'Reihenklemmen, Steckverbinder, Überspannungsschutz, Netzteile und Industriekommunikation',
        'desc_en': 'terminal blocks, connectors, surge protection, power supplies and industrial communication',
        'company': 'Deutscher Verbindungstechnik-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['wago', 'weidmuller', 'schneider-electric']
    },
    'pilz': {
        'display': 'Pilz',
        'desc_de': 'Sicherheitsrelais, Sicherheits-SPS, Sicherheitssensoren, Not-Aus-Geräte und Automation',
        'desc_en': 'safety relays, safety PLCs, safety sensors, emergency stop devices and automation',
        'company': 'Deutscher Sicherheitsautomations-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['schmersal', 'euchner', 'sick']
    },
    'pizzato': {
        'display': 'Pizzato',
        'desc_de': 'Positionsschalter, Sicherheitsschalter, Fußschalter, Not-Aus-Geräte und Endschalter',
        'desc_en': 'position switches, safety switches, foot switches, emergency stop devices and limit switches',
        'company': 'Italienischer Sicherheitsschalter-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['schmersal', 'euchner', 'bernstein']
    },
    'rexroth': {
        'display': 'Rexroth',
        'desc_de': 'Hydraulikzylinder, Ventile, Pumpen, Pneumatik und Lineartechnik',
        'desc_en': 'hydraulic cylinders, valves, pumps, pneumatics and linear motion technology',
        'company': 'Bosch Rexroth',
        'uncertain': False,
        'price_competitive': True,
        'related': ['bosch-rexroth', 'parker', 'festo']
    },
    'bosch-rexroth': {
        'display': 'Bosch Rexroth',
        'desc_de': 'Hydraulik- und Pneumatiksysteme, Lineartechnik, Elektrische Antriebe und Automation',
        'desc_en': 'hydraulic and pneumatic systems, linear motion, electric drives and automation',
        'company': 'Bosch-Gruppe',
        'uncertain': False,
        'price_competitive': True,
        'related': ['rexroth', 'parker', 'siemens']
    },
    'schmersal': {
        'display': 'Schmersal',
        'desc_de': 'Sicherheitsschalter, Sicherheitssensoren, Sicherheitssteuerungen, Seilzugschalter und Sicherheitssysteme',
        'desc_en': 'safety switches, safety sensors, safety controllers, rope pull switches and safety systems',
        'company': 'Deutscher Sicherheitstechnik-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['pilz', 'euchner', 'sick']
    },
    'schneider-electric': {
        'display': 'Schneider Electric',
        'desc_de': 'SPS, Frequenzumrichter, Schütze, Leistungsschalter, HMI und Industrieautomation',
        'desc_en': 'PLCs, frequency inverters, contactors, circuit breakers, HMI and industrial automation',
        'company': 'Französischer Energiemanagement- und Automatisierungshersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['siemens', 'abb', 'omron']
    },
    'sew-eurodrive': {
        'display': 'SEW-Eurodrive',
        'desc_de': 'Getriebemotoren, Frequenzumrichter, Servoantriebe und Antriebsautomation',
        'desc_en': 'gearmotors, frequency inverters, servo drives and drive automation',
        'company': 'Deutscher Antriebstechnik-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['siemens', 'lenze', 'nord']
    },
    'sick': {
        'display': 'Sick',
        'desc_de': 'Sicherheits-Lichtschranken, Laserscanner, optoelektronische Sensoren, Encoder und Sensor Intelligence',
        'desc_en': 'safety light curtains, laser scanners, photoelectric sensors, encoders and sensor intelligence',
        'company': 'Deutscher Sensorhersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['ifm', 'balluff', 'pepperl-plus-fuchs']
    },
    'siko': {
        'display': 'Siko',
        'desc_de': 'Positionssensoren, Magnetencoder, Linearencoder und Positionsanzeigen',
        'desc_en': 'position sensors, magnetic encoders, linear encoders and position indicators',
        'company': 'Deutscher Positionssensor-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'baumer', 'turck']
    },
    'turck': {
        'display': 'Turck',
        'desc_de': 'induktive Sensoren, Feldbustechnik, I/O-Systeme, RFID und Konnektivität',
        'desc_en': 'inductive sensors, fieldbus technology, I/O systems, RFID and connectivity',
        'company': 'Deutscher Sensor- und Feldbus-Technologie-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'ifm', 'pepperl-plus-fuchs']
    },
    'wenglor': {
        'display': 'wenglor',
        'desc_de': 'optoelektronische Sensoren, Vision-Sensoren, Abstandssensoren und Sensorlösungen',
        'desc_en': 'photoelectric sensors, vision sensors, distance sensors and sensor solutions',
        'company': 'Deutscher Sensorhersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['sick', 'balluff', 'leuze']
    },
    'wika': {
        'display': 'WIKA',
        'desc_de': 'Manometer, Temperatursensoren, Druckmessumformer und Kalibriertechnik',
        'desc_en': 'pressure gauges, temperature sensors, pressure transmitters and calibration technology',
        'company': 'Deutscher Druck- und Temperaturmesstechnik-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['endress-hauser', 'siemens']
    },
    'yaskawa': {
        'display': 'Yaskawa',
        'desc_de': 'Servomotoren, Frequenzumrichter, Roboter, Motion Controller und Antriebssysteme',
        'desc_en': 'servo motors, frequency inverters, robots, motion controllers and drive systems',
        'company': 'Japanischer Robotik- und Motion-Control-Hersteller',
        'uncertain': False,
        'price_competitive': True,
        'related': ['siemens', 'mitsubishi-electric', 'schneider-electric']
    }
}

# Generate all brand entries
new_content = {}
for slug, config in brands_to_add.items():
    print(f"Generating {slug}...")
    new_content[slug] = create_brand_entry(slug, config['display'], config)

# Merge with existing content
merged_content = {**existing_content, **new_content}

# Sort by key
sorted_content = dict(sorted(merged_content.items()))

# Write back
with open('brand-content.json', 'w', encoding='utf-8') as f:
    json.dump(sorted_content, f, ensure_ascii=False, indent=2)

print(f"\n✓ Generated content for {len(new_content)} brands")
print(f"✓ Total brands in brand-content.json: {len(sorted_content)}")
print(f"\nUncertain identity brands (modest copy):")
for slug, config in brands_to_add.items():
    if config.get('uncertain'):
        print(f"  - {slug} ({config['display']})")
