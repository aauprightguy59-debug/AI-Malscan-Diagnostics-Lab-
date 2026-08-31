/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const labLogo = '/assets/images/malaria_lab_logo_1783687025061.jpg';
export const falciparumImg = '/assets/images/falciparum_smear_1783686249385.jpg';
export const vivaxImg = '/assets/images/vivax_smear_1783686263162.jpg';
export const malariaeImg = '/assets/images/malariae_smear_1783686277652.jpg';
export const normalImg = '/assets/images/normal_smear_1783686291345.jpg';

export interface LabFacility {
  id: string;
  name: string;
  code: string;
  tier: 'Tertiary Reference Lab' | 'General Hospital Wing' | 'Primary Health Care (PHC)' | 'IDP Camp Field Post' | 'Border Mobile Unit' | 'Community Diagnostic Centre' | 'Private Clinical Laboratory';
  state: string;
  lga: string;
  country?: string;
  accreditationNumber: string;
  chiefTechnician: string;
  chiefTechnicianPhone?: string;
  chiefTechnicianEmail?: string;
  emergencyContact?: string;
  hostingStatus?: 'Online (Cloud Connected)' | 'Local Standalone' | 'Hybrid Mesh';
  cloudSyncEndpoint?: string;
  androidAppVersion?: string;
  hybridModules?: string[];
  registeredAt?: string;
  licenseValidUntil?: string;
}

export interface AndroidAppInfo {
  version: string;
  buildNumber: number;
  apkFileName: string;
  apkSizeMb: number;
  releaseDate: string;
  minAndroidVersion: string;
  targetAndroidVersion: string;
  architecture: string;
  downloadUrl: string;
  checksumSha256: string;
  features: string[];
}

export interface CloudHostingInfo {
  domain: string;
  region: string;
  status: 'Online Active' | 'Local Dev Preview' | 'Offline Mesh';
  syncEndpoint: string;
  lastSyncTimestamp: string;
  sslSecured: boolean;
  dhis2Integrated: boolean;
  nmepSurveillanceFeed: boolean;
}

export interface Patient {
  name: string;
  age: number;
  weight: number;
  gender: 'Male' | 'Female' | 'Other';
  clinicId: string;
  phone?: string;
  ninOrHospitalNo?: string;
}

export interface DiagnosticResult {
  parasiteDetected: boolean;
  species: 'Plasmodium falciparum' | 'Plasmodium vivax' | 'Plasmodium malariae' | 'Plasmodium ovale' | 'None';
  density: number; // parasites per µL
  confidenceScore: number;
  clinicalNotes: string;
}

export interface RDTResult {
  performed: boolean;
  cassetteType: 'Pf (HRP2) / Pv (pLDH) Dual' | 'Pf (HRP2) Single' | 'Pan-Malaria (pLDH)';
  controlLine: boolean; // Must be true for valid test
  hrp2Line: boolean; // Falciparum
  pldhLine: boolean; // Vivax/Pan
  opticalDensityScore: number; // 0.0 - 1.0
  faintLineDetected: boolean;
  interpretation: 'Pf Positive (HRP2+)' | 'Pv/Pan Positive (pLDH+)' | 'Dual Pf+Pv Positive' | 'Negative' | 'Invalid (No Control Line)';
  concordanceStatus: 'Concordant' | 'Sub-microscopic Infection' | 'Suspected HRP2 Deletion' | 'Residual Antigenaemia' | 'Not Evaluated';
  cassetteImage?: string;
  timestamp: string;
}

export interface HemoglobinResult {
  performed: boolean;
  hbValue: number; // in g/dL, e.g. 12.4
  pcvValue: number; // Hematocrit in %, approx Hb * 3
  deviceModel: 'HemoCue Hb 301 (Bluetooth)' | 'URIT-12 Hemoglobinometer' | 'Manual Photometer';
  anemiaSeverity: 'Normal' | 'Mild Anemia' | 'Moderate Anemia' | 'Severe Anemia (<7.0 g/dL)' | 'Critical (<5.0 g/dL)';
  bloodTransfusionIndicated: boolean;
  timestamp: string;
}

export interface G6PDResult {
  performed: boolean;
  enzymaticActivity: number; // U/g Hb, e.g. 9.8
  percentNormal: number; // e.g. 95%
  status: 'Normal (>70%)' | 'Intermediate (30-70%)' | 'Deficient (<30%)' | 'Pending / Not Tested';
  primaquineSafe: boolean;
  deviceModel: 'SD Biosensor STANDARD G6PD' | 'CareStart G6PD Biosensor' | 'Qualitative FST';
  clinicalWarning?: string;
  timestamp?: string;
}

export interface MolecularResult {
  performed: boolean;
  testType: 'Isothermal LAMP (Loop-Mediated)' | 'miniPCR Thermal Cycling' | 'None';
  triggerReason: 'Hyper-parasitemia (>100k/µL)' | 'Mixed Infection Suspected' | 'HRP2 Gene Deletion Suspected' | 'Weekly Sentinel QA' | 'Manual Request' | 'None';
  targetGenes: Array<'18S rRNA' | 'pfhrp2' | 'pfhrp3' | 'kelch13 (K13 Artemisinin Resistance)' | 'pfcrt' | 'pfmdr1'>;
  dnaDetected: boolean;
  k13MutationDetected: boolean;
  k13MutationDetails?: string; // e.g. "Wild Type (Sensitive)" or "C580Y Resistance Mutation Detected"
  amplificationTimeMin: number;
  cycleThresholdOrIntensity: number;
  timestamp: string;
}

export interface ChiefTechnician {
  id: string;
  name: string;
  title: string;
  licenseNumber: string;
  facility: string;
  role: 'Chief Lab Technician' | 'Senior Parasitologist' | 'Quality Control Director';
  loginTime: string;
}

export interface SyncAuditLogEntry {
  id: string;
  timestamp: string;
  eventType: 'OFFLINE_TO_ONLINE_SYNC' | 'MANUAL_CLOUD_PUSH' | 'USB_RESTORE_MERGE' | 'RECORD_SUBMISSION_SYNC' | 'DATABASE_SNAPSHOT';
  recordsCount: number;
  recordIds?: string[];
  labNodeCode: string;
  facilityName: string;
  technicianName: string;
  networkStatus: 'online' | 'offline';
  payloadSizeKb?: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  details: string;
  serverAckId: string;
}

export interface DiagnosticRecord {
  id: string;
  deviceId: string;
  patient: Patient;
  facility?: LabFacility;
  result: DiagnosticResult;
  rdtResult?: RDTResult;
  hbResult?: HemoglobinResult;
  g6pdResult?: G6PDResult;
  molecularResult?: MolecularResult;
  severityGrade: 'Uncomplicated' | 'Severe (High Parasitemia)' | 'Emergency (Severe Anemic Crisis)' | 'Negative';
  timestamp: string;
  workerConfirmed: boolean | null; // null = pending, true = confirmed, false = flagged/override
  treatmentRegimen: string | null;
  notes: string;
  synced: boolean;
  imageKey: string; // preloaded slide key or 'uploaded'
  technician?: ChiefTechnician;
}

export interface ReagentItem {
  id: string;
  name: string;
  category: 'Stains & Buffers' | 'RDT Cassettes' | 'Microcuvettes & Strips' | 'G6PD Biosensors' | 'Molecular Mastermix' | 'PPE & Consumables';
  stockQuantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  lowStockThreshold: number;
  supplier: string;
  status: 'Adequate' | 'Low Stock' | 'Critical' | 'Expired';
}

export interface SyncStats {
  totalScans: number;
  positiveCount: number;
  negativeCount: number;
  positivityRate: number;
  speciesBreakdown: Record<string, number>;
  avgDensity: number;
  severeAnemiaCount: number;
  g6pdDeficientCount: number;
  molecularTestsRun: number;
  k13MutationsFound: number;
}

export const REGISTERED_FACILITIES: LabFacility[] = [
  {
    id: 'FAC-GBK-001',
    name: 'JADSL ICT Unit Community Center Lab - Gboko',
    code: 'GBK-JADSL-01',
    tier: 'Tertiary Reference Lab',
    state: 'Benue State',
    lga: 'Gboko LGA',
    country: 'Nigeria',
    accreditationNumber: 'MLSCN/2026/BN-0482',
    chiefTechnician: 'Dr. Becky Saar (MLS, MSc Parasitology)',
    chiefTechnicianPhone: '+2348071119766',
    chiefTechnicianEmail: 'beckysaar515@gmail.com',
    emergencyContact: '+2348071119766',
    hostingStatus: 'Online (Cloud Connected)',
    cloudSyncEndpoint: 'https://aimalscan-surveillance.cloud.gov.ng/api/v3',
    androidAppVersion: 'v3.0.4-hybrid-arm64-v8a',
    hybridModules: [
      'Digital Thin Smear AI Optical Rig (100x Oil)',
      'Pf/Pv Dual Antigen Computer Vision RDT Reader',
      'HemoCue Hb 301 Bluetooth Anemia Analyzer',
      'STANDARD G6PD Quantitative Biosensor Gatekeeper',
      'Isothermal LAMP 18S / pfhrp2 / K13 Profiler'
    ],
    registeredAt: '2026-01-15T08:00:00.000Z',
    licenseValidUntil: '2027-12-31'
  },
  {
    id: 'FAC-MKR-002',
    name: 'Mkar General Hospital Diagnostic Wing',
    code: 'MKR-GH-02',
    tier: 'General Hospital Wing',
    state: 'Benue State',
    lga: 'Gboko LGA',
    country: 'Nigeria',
    accreditationNumber: 'MLSCN/2025/BN-0199',
    chiefTechnician: 'Elder Emmanuel Tyover (FMLSCN)',
    chiefTechnicianPhone: '+2348034567890',
    chiefTechnicianEmail: 'lab.mkar@hospital.org.ng',
    emergencyContact: '+2348071119766',
    hostingStatus: 'Online (Cloud Connected)',
    cloudSyncEndpoint: 'https://aimalscan-surveillance.cloud.gov.ng/api/v3',
    androidAppVersion: 'v3.0.4-hybrid-arm64-v8a',
    hybridModules: [
      'Digital Thin Smear AI Optical Rig (100x Oil)',
      'Pf/Pv Dual Antigen Computer Vision RDT Reader',
      'HemoCue Hb 301 Bluetooth Anemia Analyzer',
      'STANDARD G6PD Quantitative Biosensor Gatekeeper'
    ],
    registeredAt: '2026-02-10T09:30:00.000Z',
    licenseValidUntil: '2027-12-31'
  },
  {
    id: 'FAC-IDP-003',
    name: 'Makurdi Abagana IDP Camp Emergency Mobile Lab',
    code: 'IDP-ABG-03',
    tier: 'IDP Camp Field Post',
    state: 'Benue State',
    lga: 'Makurdi LGA',
    country: 'Nigeria',
    accreditationNumber: 'UNHCR-NCDC/BN-EMG-12',
    chiefTechnician: 'Grace Terfa (BMLS)',
    chiefTechnicianPhone: '+2348029876543',
    chiefTechnicianEmail: 'abagana.fieldlab@ncdc.gov.ng',
    emergencyContact: '+2348071119766',
    hostingStatus: 'Hybrid Mesh',
    cloudSyncEndpoint: 'https://aimalscan-surveillance.cloud.gov.ng/api/v3',
    androidAppVersion: 'v3.0.4-hybrid-arm64-v8a',
    hybridModules: [
      'Digital Thin Smear AI Optical Rig (100x Oil)',
      'Pf/Pv Dual Antigen Computer Vision RDT Reader',
      'HemoCue Hb 301 Bluetooth Anemia Analyzer',
      'STANDARD G6PD Quantitative Biosensor Gatekeeper'
    ],
    registeredAt: '2026-03-01T07:15:00.000Z',
    licenseValidUntil: '2027-06-30'
  },
  {
    id: 'FAC-KAT-004',
    name: 'Katsina-Ala Cross-River Border Sentinel Node',
    code: 'KAT-BOR-04',
    tier: 'Border Mobile Unit',
    state: 'Benue State',
    lga: 'Katsina-Ala LGA',
    country: 'Nigeria',
    accreditationNumber: 'FMoH/NMEP/2026/BN-077',
    chiefTechnician: 'Kofi Mensah (Field Epi, MLS)',
    chiefTechnicianPhone: '+2348055551234',
    chiefTechnicianEmail: 'border.surveillance@nmep.gov.ng',
    emergencyContact: '+2348071119766',
    hostingStatus: 'Local Standalone',
    cloudSyncEndpoint: 'https://aimalscan-surveillance.cloud.gov.ng/api/v3',
    androidAppVersion: 'v3.0.4-hybrid-arm64-v8a',
    hybridModules: [
      'Digital Thin Smear AI Optical Rig (100x Oil)',
      'Pf/Pv Dual Antigen Computer Vision RDT Reader',
      'HemoCue Hb 301 Bluetooth Anemia Analyzer'
    ],
    registeredAt: '2026-03-12T11:45:00.000Z',
    licenseValidUntil: '2027-12-31'
  }
];

export const BENUE_FACILITIES = REGISTERED_FACILITIES;

export const DEFAULT_ANDROID_APP_INFO: AndroidAppInfo = {
  version: '3.0.4 (Build 3042)',
  buildNumber: 3042,
  apkFileName: 'AI-MalScan-HybridLab-v3.0.4.apk',
  apkSizeMb: 24.8,
  releaseDate: 'August 2026',
  minAndroidVersion: 'Android 8.0 (API Level 26 - Oreo)',
  targetAndroidVersion: 'Android 14 (API Level 34 - UpsideDownCake)',
  architecture: 'arm64-v8a / armeabi-v7a / x86_64',
  downloadUrl: '/downloads/AI-MalScan-HybridLab-v3.0.4.apk',
  checksumSha256: '9f8b4a2c7e1d5f309a826471e5c3b901f48206d4e7b1a29384756c0192837465',
  features: [
    'USB-OTG Direct Microscope Camera Bridge (100x Oil Immersion 4K Sensor)',
    'Bluetooth Low Energy (BLE) Auto-Pairing with HemoCue Hb 301 & SD Biosensor G6PD',
    'Offline SQLite / IndexedDB Storage with Auto-Sync when Internet Connectivity is Restored',
    'Integrated Camera RDT Dual Band Computer Vision & Colorimetric Line Analyzer',
    'WHO / NMEP Automated Drug Dosage & Safety Interlock Engine',
    'QR Code & Barcode Patient Sample Scanner for High-Throughput Outpatient Triaging',
    'MLSCN Digital Watermark & Verified Diagnostic Certificate Generator'
  ]
};

export const DEFAULT_CLOUD_HOST_INFO: CloudHostingInfo = {
  domain: 'aimalscan.health.gov.ng',
  region: 'Nigeria / Sub-Saharan Africa Cloud Hub (Lagos Node)',
  status: 'Online Active',
  syncEndpoint: 'https://nmep-dhis2-surveillance.gov.ng/api/v3/malaria-records',
  lastSyncTimestamp: new Date().toISOString(),
  sslSecured: true,
  dhis2Integrated: true,
  nmepSurveillanceFeed: true
};

export const INITIAL_REAGENTS: ReagentItem[] = [
  {
    id: 'REA-001',
    name: 'Giemsa Stain Solution (Stock 1000ml)',
    category: 'Stains & Buffers',
    stockQuantity: 1850,
    unit: 'mL',
    batchNumber: 'GMS-2026-B8',
    expiryDate: '2027-11-30',
    lowStockThreshold: 500,
    supplier: 'Sigma-Aldrich West Africa',
    status: 'Adequate'
  },
  {
    id: 'REA-002',
    name: 'Buffer Tablets pH 7.2 (Weise Formula)',
    category: 'Stains & Buffers',
    stockQuantity: 240,
    unit: 'Tablets',
    batchNumber: 'BUF-72-990',
    expiryDate: '2028-04-15',
    lowStockThreshold: 50,
    supplier: 'BD Diagnostics Nigeria',
    status: 'Adequate'
  },
  {
    id: 'REA-003',
    name: 'SD Bioline Malaria Ag P.f/P.v Dual RDT Cassettes',
    category: 'RDT Cassettes',
    stockQuantity: 420,
    unit: 'Cassettes',
    batchNumber: 'SDB-26F-091',
    expiryDate: '2027-08-20',
    lowStockThreshold: 100,
    supplier: 'Abbott Rapid Diagnostics',
    status: 'Adequate'
  },
  {
    id: 'REA-004',
    name: 'HemoCue Hb 301 Microcuvettes (Box of 200)',
    category: 'Microcuvettes & Strips',
    stockQuantity: 380,
    unit: 'Cuvettes',
    batchNumber: 'HC-301-443',
    expiryDate: '2027-05-10',
    lowStockThreshold: 80,
    supplier: 'Radiometer / HemoCue Africa',
    status: 'Adequate'
  },
  {
    id: 'REA-005',
    name: 'STANDARD G6PD Quantitative Biosensor Strips',
    category: 'G6PD Biosensors',
    stockQuantity: 95,
    unit: 'Test Strips',
    batchNumber: 'G6PD-SD-710',
    expiryDate: '2026-12-15',
    lowStockThreshold: 40,
    supplier: 'SD Biosensor Global Health',
    status: 'Low Stock'
  },
  {
    id: 'REA-006',
    name: 'NEB WarmStart LAMP 2X Mastermix (Pf/Pv DNA)',
    category: 'Molecular Mastermix',
    stockQuantity: 65,
    unit: 'Reactions',
    batchNumber: 'NEB-LMP-042',
    expiryDate: '2027-01-30',
    lowStockThreshold: 25,
    supplier: 'New England Biolabs (via Inqaba Biotec)',
    status: 'Adequate'
  },
  {
    id: 'REA-007',
    name: 'K13 Artemisinin Resistance Mutation Primers',
    category: 'Molecular Mastermix',
    stockQuantity: 40,
    unit: 'Reactions',
    batchNumber: 'K13-PRM-19',
    expiryDate: '2027-03-22',
    lowStockThreshold: 20,
    supplier: 'Inqaba Biotec Ibadan',
    status: 'Adequate'
  },
  {
    id: 'REA-008',
    name: 'Synthetic Immersion Oil Type A (ND 1.515)',
    category: 'PPE & Consumables',
    stockQuantity: 120,
    unit: 'mL',
    batchNumber: 'OIL-CARG-88',
    expiryDate: '2029-10-01',
    lowStockThreshold: 30,
    supplier: 'Cargille Labs',
    status: 'Adequate'
  }
];

export const SAMPLE_SLIDES = [
  {
    key: 'falciparum',
    name: 'Plasmodium falciparum Smear',
    description: 'High parasitemia thin blood smear showing multiple ring-form trophozoites inside red blood cells. Common double-dot chromatin and delicate rings.',
    imagePath: falciparumImg,
    expectedResult: {
      parasiteDetected: true,
      species: 'Plasmodium falciparum' as const,
      density: 18500,
      confidenceScore: 0.98,
      clinicalNotes: 'Characteristic multi-infection ring-form trophozoites observed. Delicate cytoplasm with distinct chromatin dots, typical of Plasmodium falciparum. Estimated density is high, requiring rapid clinical intervention.'
    },
    defaultHb: 6.8, // Severe anemia threshold flag
    defaultRDT: {
      performed: true,
      cassetteType: 'Pf (HRP2) / Pv (pLDH) Dual' as const,
      controlLine: true,
      hrp2Line: true,
      pldhLine: false,
      opticalDensityScore: 0.96,
      faintLineDetected: false,
      interpretation: 'Pf Positive (HRP2+)' as const,
      concordanceStatus: 'Concordant' as const,
      timestamp: new Date().toISOString()
    },
    defaultG6PD: {
      performed: true,
      enzymaticActivity: 10.4,
      percentNormal: 92,
      status: 'Normal (>70%)' as const,
      primaquineSafe: true,
      deviceModel: 'SD Biosensor STANDARD G6PD' as const
    }
  },
  {
    key: 'vivax',
    name: 'Plasmodium vivax Smear',
    description: 'Thin blood smear with enlarged red blood cells showing ameboid-form trophozoites and subtle Schüffner dots.',
    imagePath: vivaxImg,
    expectedResult: {
      parasiteDetected: true,
      species: 'Plasmodium vivax' as const,
      density: 4200,
      confidenceScore: 0.94,
      clinicalNotes: 'Enlarged infected red blood cells containing irregular, ameboid trophozoites. Fine, eosinophilic stippling (Schüffner\'s dots) is present in the erythrocyte cytoplasm, confirming Plasmodium vivax.'
    },
    defaultHb: 11.2,
    defaultRDT: {
      performed: true,
      cassetteType: 'Pf (HRP2) / Pv (pLDH) Dual' as const,
      controlLine: true,
      hrp2Line: false,
      pldhLine: true,
      opticalDensityScore: 0.88,
      faintLineDetected: false,
      interpretation: 'Pv/Pan Positive (pLDH+)' as const,
      concordanceStatus: 'Concordant' as const,
      timestamp: new Date().toISOString()
    },
    defaultG6PD: {
      performed: false, // Requires safety gatekeeper check!
      enzymaticActivity: 0,
      percentNormal: 0,
      status: 'Pending / Not Tested' as const,
      primaquineSafe: false,
      deviceModel: 'SD Biosensor STANDARD G6PD' as const,
      clinicalWarning: 'G6PD quantitative screening is MANDATORY before administering 14-day Primaquine for P. vivax radical cure.'
    }
  },
  {
    key: 'malariae',
    name: 'Plasmodium malariae Smear',
    description: 'Thin blood smear exhibiting normal-sized red blood cells with distinctive band-form trophozoites stretching across the cells.',
    imagePath: malariaeImg,
    expectedResult: {
      parasiteDetected: true,
      species: 'Plasmodium malariae' as const,
      density: 1200,
      confidenceScore: 0.91,
      clinicalNotes: 'Compact, band-shaped trophozoites stretching across normal-sized, mature erythrocytes. Pigment is dark brown and coarse. Confirmed Plasmodium malariae with typical low-density presentation.'
    },
    defaultHb: 12.8,
    defaultRDT: {
      performed: true,
      cassetteType: 'Pf (HRP2) / Pv (pLDH) Dual' as const,
      controlLine: true,
      hrp2Line: false,
      pldhLine: true,
      opticalDensityScore: 0.72,
      faintLineDetected: true,
      interpretation: 'Pv/Pan Positive (pLDH+)' as const,
      concordanceStatus: 'Concordant' as const,
      timestamp: new Date().toISOString()
    },
    defaultG6PD: {
      performed: true,
      enzymaticActivity: 11.1,
      percentNormal: 98,
      status: 'Normal (>70%)' as const,
      primaquineSafe: true,
      deviceModel: 'SD Biosensor STANDARD G6PD' as const
    }
  },
  {
    key: 'healthy',
    name: 'Normal Healthy Control',
    description: 'Giemsa-stained thin blood smear showcasing healthy red blood cells, a polymorphonuclear white blood cell, and no intracellular inclusions.',
    imagePath: normalImg,
    expectedResult: {
      parasiteDetected: false,
      species: 'None' as const,
      density: 0,
      confidenceScore: 0.99,
      clinicalNotes: 'Erythrocytes exhibit normal morphology, size, and hemoglobinization. No intracellular parasites, ring forms, or Schüffner\'s dots detected. Healthy negative control.'
    },
    defaultHb: 13.6,
    defaultRDT: {
      performed: true,
      cassetteType: 'Pf (HRP2) / Pv (pLDH) Dual' as const,
      controlLine: true,
      hrp2Line: false,
      pldhLine: false,
      opticalDensityScore: 0.05,
      faintLineDetected: false,
      interpretation: 'Negative' as const,
      concordanceStatus: 'Concordant' as const,
      timestamp: new Date().toISOString()
    },
    defaultG6PD: {
      performed: true,
      enzymaticActivity: 12.0,
      percentNormal: 100,
      status: 'Normal (>70%)' as const,
      primaquineSafe: true,
      deviceModel: 'SD Biosensor STANDARD G6PD' as const
    }
  }
];

export const WHO_TREATMENT_GUIDELINES: Record<string, { drugs: string[]; schedule: string; warning?: string }> = {
  'Plasmodium falciparum': {
    drugs: ['Artemether-Lumefantrine (Coartem)', 'Artesunate-Amodiaquine (ASAQ)', 'IV Artesunate (for Severe Cases)'],
    schedule: '6-dose regimen over 3 days (morning & evening with fatty meal or milk). If severe (Hb <7g/dL or density >100,000/µL), start IV Artesunate 2.4 mg/kg immediately at 0h, 12h, 24h.',
    warning: 'Critical: High mortality risk. In severe falciparum anemia, transfuse with screened packed cells.'
  },
  'Plasmodium vivax': {
    drugs: ['Chloroquine', 'Primaquine (14-day Radical Cure for Hypnozoites)'],
    schedule: 'Chloroquine 25 mg base/kg divided over 3 days + Primaquine 0.25–0.5 mg/kg daily for 14 days (STRICTLY CONTRAINDICATED if G6PD < 30%).',
    warning: 'MANDATORY SAFETY PROTOCOL: Test G6PD prior to Primaquine. If G6PD deficient (<30%), switch to Weekly Primaquine 0.75 mg/kg for 8 weeks under direct hospital surveillance.'
  },
  'Plasmodium malariae': {
    drugs: ['Chloroquine', 'Artemether-Lumefantrine'],
    schedule: 'Standard 3-day Chloroquine or ACT course. Highly sensitive to first-line antimalarials.',
    warning: 'Generally mild course, but monitor for glomerulopathy in chronic infections.'
  },
  'Plasmodium ovale': {
    drugs: ['Chloroquine', 'Primaquine (Relapse Prevention)'],
    schedule: 'Chloroquine for 3 days, followed by Primaquine for 14 days for hypnozoite liver stage clearance (subject to G6PD clearance).',
    warning: 'Ensure G6PD activity >70% before initiating daily 14-day primaquine.'
  },
  'None': {
    drugs: ['No antimalarials required'],
    schedule: 'Check for alternative febrile causes (Typhoid Widal/Blood Culture, Dengue NS1, Respiratory Viral Infection, Urinary Tract Infection).',
    warning: 'Malaria negative by both AI Microscopy and RDT. Do not prescribe antimalarials empirically.'
  }
};
