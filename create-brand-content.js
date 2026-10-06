#!/usr/bin/env node
'use strict';

// Script to generate brand content for abitron-aboni + collage brands
const fs = require('fs');

const brands = {
  // 10 alphabetical brands after abicor-binzel
  'abitron': {
    display: 'ABITRON',
    focus: 'electronics',
    desc: 'industrial electronics and control components',
    uncertain: false
  },
  'abj': {
    display: 'ABJ',
    focus: 'industrial',
    desc: 'industrial MRO components',
    uncertain: true  // Ambiguous short name
  },
  'abk': {
    display: 'ABK',
    focus: 'industrial',
    desc: 'industrial spare parts',
    uncertain: true  // Ambiguous short name
  },
  'abko': {
    display: 'ABKO',
    focus: 'industrial',
    desc: 'industrial components',
    uncertain: true  // Ambiguous short name
  },
  'abl': {
    display: 'ABL',
    focus: 'electrical',
    desc: 'electrical installation components, sockets, connectors, and cable systems',
    related: ['abl-sursum', 'wago', 'phoenix-contact'],
    company: 'German electrical manufacturer (ABL SURSUM)',
    uncertain: false
  },
  'abl-sursum': {
    display: 'ABL SURSUM',
    focus: 'electrical',
    desc: 'electrical installation equipment, industrial plugs, and connectors',
    related: ['abl', 'wago', 'phoenix-contact'],
    company: 'Part of German ABL electrical manufacturer family',
    uncertain: false
  },
  'abloy': {
    display: 'ABLOY',
    focus: 'locks',
    desc: 'high-security locks, cylinders, and access control systems',
    company: 'Finnish security locks manufacturer (ASSA ABLOY Group)',
    uncertain: false
  },
  'abm': {
    display: 'ABM',
    focus: 'industrial',
    desc: 'industrial drive and motion control components',
    uncertain: true  // Multiple companies share this name
  },
  'abo': {
    display: 'ABO',
    focus: 'industrial',
    desc: 'industrial automation and control parts',
    uncertain: true  // Ambiguous short name
  },
  'aboni': {
    display: 'ABONI',
    focus: 'industrial',
    desc: 'industrial equipment components',
    uncertain: false
  },
  
  // Collage brands - price focus
  'aventics': {
    display: 'AVENTICS',
    focus: 'pneumatics',
    desc: 'pneumatic cylinders, valves, valve islands, air preparation units',
    company: 'Emerson (former Bosch Rexroth pneumatics division)',
    priceCompetitive: true,
    related: ['festo', 'smc', 'parker'],
    uncertain: false
  },
  'balluff': {
    display: 'Balluff',
    focus: 'sensors',
    desc: 'inductive and photoelectric sensors, RFID systems, position sensors, and connectivity',
    company: 'German sensor manufacturer',
    priceCompetitive: true,
    related: ['sick', 'ifm', 'pepperl-plus-fuchs'],
    uncertain: false
  },
  'baumer': {
    display: 'Baumer',
    focus: 'sensors',
    desc: 'sensors, encoders, vision systems, and process instrumentation',
    company: 'Swiss sensor and measurement technology manufacturer',
    priceCompetitive: true,
    related: ['sick', 'ifm', 'leuze'],
    uncertain: false
  },
  'beckhoff': {
    display: 'Beckhoff',
    focus: 'automation',
    desc: 'PC-based automation, industrial PCs, I/O modules, EtherCAT components, and servo drives',
    company: 'German automation manufacturer',
    priceCompetitive: true,
    related: ['siemens', 'schneider-electric', 'omron'],
    uncertain: false
  },
  'bernstein': {
    display: 'Bernstein',
    focus: 'switches',
    desc: 'safety switches, limit switches, sensors, and enclosures',
    company: 'German safety switch manufacturer',
    priceCompetitive: true,
    related: ['euchner', 'schmersal', 'pilz'],
    uncertain: false
  },
  'carlo-gavazzi': {
    display: 'Carlo Gavazzi',
    focus: 'automation',
    desc: 'sensors, monitoring relays, solid-state relays, energy management systems, and fieldbus components',
    company: 'Swiss-Italian automation components manufacturer',
    priceCompetitive: true,
    related: ['schneider-electric', 'omron', 'phoenix-contact'],
    uncertain: false
  },
  'cognex': {
    display: 'Cognex',
    focus: 'vision',
    desc: 'machine vision systems, barcode readers, and vision sensors',
    company: 'US machine vision manufacturer',
    priceCompetitive: true,
    related: ['keyence', 'sick', 'omron'],
    uncertain: false
  },
  'control-techniques': {
    display: 'Control Techniques',
    focus: 'drives',
    desc: 'variable frequency drives, servo drives, and motor control',
    company: 'Nidec (formerly Emerson Industrial Automation)',
    priceCompetitive: true,
    related: ['siemens', 'schneider-electric', 'lenze'],
    uncertain: false
  },
  'datalogic': {
    display: 'Datalogic',
    focus: 'vision',
    desc: 'barcode readers, machine vision, safety systems, and sensors',
    company: 'Italian automatic data capture manufacturer',
    priceCompetitive: true,
    related: ['cognex', 'keyence', 'sick'],
    uncertain: false
  },
  'di-soric': {
    display: 'di-soric',
    focus: 'sensors',
    desc: 'photoelectric sensors, ultrasonic sensors, inductive sensors, and sensor technology',
    company: 'German sensor manufacturer',
    priceCompetitive: true,
    related: ['sick', 'balluff', 'ifm'],
    uncertain: false
  },
  'ebm-papst': {
    display: 'ebm-papst',
    focus: 'fans',
    desc: 'axial and centrifugal fans, blowers, motors for ventilation and cooling',
    company: 'German fan and motor manufacturer',
    priceCompetitive: true,
    related: [],
    uncertain: false
  },
  'euchner': {
    display: 'Euchner',
    focus: 'safety',
    desc: 'safety switches, safety sensors, position switches, and enabling devices',
    company: 'German safety technology manufacturer',
    priceCompetitive: true,
    related: ['schmersal', 'pilz', 'bernstein'],
    uncertain: false
  },
  'festo': {
    display: 'Festo',
    focus: 'pneumatics',
    desc: 'pneumatic cylinders, valves, valve terminals, grippers, and automation technology',
    company: 'German pneumatics and automation manufacturer',
    priceCompetitive: true,
    related: ['smc', 'aventics', 'parker'],
    uncertain: false
  },
  'gefran': {
    display: 'Gefran',
    focus: 'sensors',
    desc: 'pressure sensors, temperature controllers, position sensors, and automation components',
    company: 'Italian sensors and automation manufacturer',
    priceCompetitive: true,
    related: ['sick', 'balluff', 'turck'],
    uncertain: false
  },
  'grundfos': {
    display: 'Grundfos',
    focus: 'pumps',
    desc: 'centrifugal pumps, submersible pumps, booster systems, and pump controls',
    company: 'Danish pump manufacturer',
    priceCompetitive: true,
    related: ['ksb', 'wilo'],
    uncertain: false
  },
  'honeywell': {
    display: 'Honeywell',
    focus: 'automation',
    desc: 'sensors, switches, control systems, process automation, and industrial controls',
    company: 'US industrial conglomerate',
    priceCompetitive: true,
    related: ['siemens', 'schneider-electric', 'omron'],
    uncertain: false
  },
  'ifm': {
    display: 'ifm',
    focus: 'sensors',
    desc: 'inductive sensors, photoelectric sensors, pressure sensors, flow sensors, AS-Interface',
    company: 'German sensor manufacturer (ifm electronic)',
    priceCompetitive: true,
    related: ['sick', 'balluff', 'pepperl-plus-fuchs'],
    uncertain: false
  },
  'imi-norgren': {
    display: 'IMI Norgren',
    focus: 'pneumatics',
    desc: 'pneumatic cylinders, valves, FRL units, and motion control',
    company: 'IMI Precision Engineering',
    priceCompetitive: true,
    related: ['festo', 'smc', 'parker'],
    uncertain: false
  },
  'ipf': {
    display: 'ipf electronic',
    focus: 'sensors',
    desc: 'photoelectric sensors, inductive sensors, distance sensors, and safety technology',
    company: 'German sensor manufacturer',
    priceCompetitive: true,
    related: ['sick', 'balluff', 'ifm'],
    uncertain: false
  },
  'keyence': {
    display: 'Keyence',
    focus: 'sensors',
    desc: 'sensors, machine vision, measuring systems, barcode readers, and PLC systems',
    company: 'Japanese sensor and automation manufacturer',
    priceCompetitive: true,
    related: ['sick', 'cognex', 'omron'],
    uncertain: false
  },
  'lenze': {
    display: 'Lenze',
    focus: 'drives',
    desc: 'frequency inverters, servo drives, gearmotors, and motion control',
    company: 'German drive technology manufacturer',
    priceCompetitive: true,
    related: ['siemens', 'sew-eurodrive', 'schneider-electric'],
    uncertain: false
  },
  'leuze': {
    display: 'Leuze',
    focus: 'sensors',
    desc: 'safety light curtains, photoelectric sensors, barcode readers, and sensor solutions',
    company: 'German sensor manufacturer (Leuze electronic)',
    priceCompetitive: true,
    related: ['sick', 'balluff', 'ifm'],
    uncertain: false
  },
  'mac': {
    display: 'MAC',
    focus: 'valves',
    desc: 'pneumatic solenoid valves, valve islands, and pneumatic control',
    company: 'Parker Hannifin (MAC Valves)',
    priceCompetitive: true,
    related: ['festo', 'smc', 'parker'],
    uncertain: false
  },
  'metal-work-pneumatic': {
    display: 'Metal Work Pneumatic',
    focus: 'pneumatics',
    desc: 'pneumatic cylinders, valves, FRL units, and pneumatic components',
    company: 'Italian pneumatics manufacturer',
    priceCompetitive: true,
    related: ['festo', 'smc', 'parker'],
    uncertain: false
  },
  'micro-detectors': {
    display: 'Micro Detectors',
    focus: 'sensors',
    desc: 'photoelectric sensors, inductive sensors, ultrasonic sensors, and sensor technology',
    company: 'Italian sensor manufacturer',
    priceCompetitive: true,
    related: ['sick', 'balluff', 'ifm'],
    uncertain: false
  },
  'mitsubishi-electric': {
    display: 'Mitsubishi Electric',
    focus: 'automation',
    desc: 'PLCs, servo systems, frequency inverters, HMI, and factory automation',
    company: 'Japanese automation manufacturer',
    priceCompetitive: true,
    related: ['siemens', 'omron', 'schneider-electric'],
    uncertain: false
  },
  'omron': {
    display: 'Omron',
    focus: 'automation',
    desc: 'PLCs, sensors, safety systems, relays, switches, and industrial automation',
    company: 'Japanese automation manufacturer',
    priceCompetitive: true,
    related: ['siemens', 'schneider-electric', 'mitsubishi-electric'],
    uncertain: false
  },
  'panasonic': {
    display: 'Panasonic',
    focus: 'automation',
    desc: 'industrial sensors, relays, PLCs, servo motors, and factory automation',
    company: 'Japanese electronics and automation manufacturer',
    priceCompetitive: true,
    related: ['omron', 'keyence', 'mitsubishi-electric'],
    uncertain: false
  },
  'parker': {
    display: 'Parker',
    focus: 'motion',
    desc: 'hydraulic and pneumatic cylinders, valves, filters, motion control, and fluid connectors',
    company: 'US motion and control technologies manufacturer',
    priceCompetitive: true,
    related: ['festo', 'smc', 'bosch-rexroth'],
    uncertain: false
  },
  'pepperl-plus-fuchs': {
    display: 'Pepperl+Fuchs',
    focus: 'sensors',
    desc: 'inductive sensors, ultrasonic sensors, vision sensors, AS-Interface, and fieldbus technology',
    company: 'German sensor and explosion protection manufacturer',
    priceCompetitive: true,
    related: ['sick', 'ifm', 'balluff'],
    uncertain: false
  },
  'phoenix-contact': {
    display: 'Phoenix Contact',
    focus: 'connection',
    desc: 'terminal blocks, connectors, surge protection, power supplies, and industrial communication',
    company: 'German connection technology manufacturer',
    priceCompetitive: true,
    related: ['wago', 'weidmuller', 'schneider-electric'],
    uncertain: false
  },
  'pilz': {
    display: 'Pilz',
    focus: 'safety',
    desc: 'safety relays, safety PLCs, safety sensors, emergency stop devices, and automation',
    company: 'German safety automation manufacturer',
    priceCompetitive: true,
    related: ['schmersal', 'euchner', 'sick'],
    uncertain: false
  },
  'pizzato': {
    display: 'Pizzato',
    focus: 'switches',
    desc: 'position switches, safety switches, foot switches, emergency stop devices, and limit switches',
    company: 'Italian safety switch manufacturer',
    priceCompetitive: true,
    related: ['schmersal', 'euchner', 'bernstein'],
    uncertain: false
  },
  'rexroth': {
    display: 'Rexroth',
    focus: 'hydraulics',
    desc: 'hydraulic cylinders, valves, pumps, pneumatics, and linear motion technology',
    company: 'Bosch Rexroth',
    priceCompetitive: true,
    related: ['bosch-rexroth', 'parker', 'festo'],
    uncertain: false
  },
  'bosch-rexroth': {
    display: 'Bosch Rexroth',
    focus: 'hydraulics',
    desc: 'hydraulic and pneumatic systems, linear motion, electric drives, and automation',
    company: 'Bosch Group',
    priceCompetitive: true,
    related: ['rexroth', 'parker', 'siemens'],
    uncertain: false
  },
  'schmersal': {
    display: 'Schmersal',
    focus: 'safety',
    desc: 'safety switches, safety sensors, safety controllers, rope pull switches, and safety systems',
    company: 'German safety technology manufacturer',
    priceCompetitive: true,
    related: ['pilz', 'euchner', 'sick'],
    uncertain: false
  },
  'schneider-electric': {
    display: 'Schneider Electric',
    focus: 'automation',
    desc: 'PLCs, frequency inverters, contactors, circuit breakers, HMI, and industrial automation',
    company: 'French energy management and automation manufacturer',
    priceCompetitive: true,
    related: ['siemens', 'abb', 'omron'],
    uncertain: false
  },
  'sew-eurodrive': {
    display: 'SEW-Eurodrive',
    focus: 'drives',
    desc: 'gearmotors, frequency inverters, servo drives, and drive automation',
    company: 'German drive technology manufacturer',
    priceCompetitive: true,
    related: ['siemens', 'lenze', 'nord'],
    uncertain: false
  },
  'sick': {
    display: 'Sick',
    focus: 'sensors',
    desc: 'safety light curtains, laser scanners, photoelectric sensors, encoders, and sensor intelligence',
    company: 'German sensor manufacturer',
    priceCompetitive: true,
    related: ['ifm', 'balluff', 'pepperl-plus-fuchs'],
    uncertain: false
  },
  'siko': {
    display: 'Siko',
    focus: 'sensors',
    desc: 'position sensors, magnetic encoders, linear encoders, and position indicators',
    company: 'German position sensor manufacturer',
    priceCompetitive: true,
    related: ['sick', 'baumer', 'turck'],
    uncertain: false
  },
  'turck': {
    display: 'Turck',
    focus: 'sensors',
    desc: 'inductive sensors, fieldbus technology, I/O systems, RFID, and connectivity',
    company: 'German sensor and fieldbus technology manufacturer',
    priceCompetitive: true,
    related: ['sick', 'ifm', 'pepperl-plus-fuchs'],
    uncertain: false
  },
  'wenglor': {
    display: 'wenglor',
    focus: 'sensors',
    desc: 'photoelectric sensors, vision sensors, distance sensors, and sensor solutions',
    company: 'German sensor manufacturer',
    priceCompetitive: true,
    related: ['sick', 'balluff', 'leuze'],
    uncertain: false
  },
  'wika': {
    display: 'WIKA',
    focus: 'measurement',
    desc: 'pressure gauges, temperature sensors, pressure transmitters, and calibration technology',
    company: 'German pressure and temperature measurement manufacturer',
    priceCompetitive: true,
    related: ['endress-hauser', 'siemens'],
    uncertain: false
  },
  'yaskawa': {
    display: 'Yaskawa',
    focus: 'drives',
    desc: 'servo motors, frequency inverters, robots, motion controllers, and drive systems',
    company: 'Japanese robotics and motion control manufacturer',
    priceCompetitive: true,
    related: ['siemens', 'mitsubishi-electric', 'schneider-electric'],
    uncertain: false
  }
};

console.log('Total brands to enrich:', Object.keys(brands).length);
console.log('Price competitive brands:', Object.values(brands).filter(b => b.priceCompetitive).length);
console.log('Uncertain identity brands:', Object.values(brands).filter(b => b.uncertain).length);
