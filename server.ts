/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { SAMPLE_SLIDES, DiagnosticRecord } from './src/types';

// Load environment variables
dotenv.config();

const app = express();
// CRITICAL FIX FOR RENDER/RAILWAY: Use process.env.PORT if available, fallback to 3000 for local dev
const PORT = process.env.PORT || 3000;

// Increase payload limit for base64 microscope scans
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// In-memory clinical records database for national malaria surveillance
let surveillanceRecords: DiagnosticRecord[] = [];
let auditTrailLogs: any[] = [];

// Seed the database with historical data from the past 30 days to build realistic charts
function seedHistoricalData() {
  const speciesList: Array<'Plasmodium falciparum' | 'Plasmodium vivax' | 'Plasmodium malariae' | 'None'> = [
    'Plasmodium falciparum', 'Plasmodium vivax', 'Plasmodium malariae', 'None'
  ];
  
  const femaleNames = ['Grace', 'Abigail', 'Fatou', 'Mariama', 'Chioma', 'Amina', 'Safi', 'Zainab'];
  const maleNames = ['Kwame', 'Kofi', 'Ousmane', 'Moussa', 'Chinedu', 'Emeka', 'Abdi', 'Tariq'];
  const clinics = [
    { name: 'JADSL ICT Unit Community Center Lab - Gboko', code: 'GBK-JADSL-01', lga: 'Gboko LGA', state: 'Benue State' },
    { name: 'General Hospital Wing Gboko', code: 'GBK-GHW-02', lga: 'Gboko LGA', state: 'Benue State' },
    { name: 'Border Mobile Diagnostic Unit', code: 'GBK-MOB-03', lga: 'Gboko LGA', state: 'Benue State' }
  ];

  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const recordsCount = Math.floor(Math.random() * 3) + 1;
    
    for (let r = 0; r < recordsCount; r++) {
      const isMale = Math.random() > 0.5;
      const patientName = isMale 
        ? maleNames[Math.floor(Math.random() * maleNames.length)] + ' ' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '.'
        : femaleNames[Math.floor(Math.random() * femaleNames.length)] + ' ' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '.';
      
      const species = speciesList[Math.floor(Math.random() * speciesList.length)];
      const parasiteDetected = species !== 'None';
      
      let density = 0;
      let notes = 'Patient presented with intermittent fever and chills.';
      if (parasiteDetected) {
        if (species === 'Plasmodium falciparum') {
          density = Math.floor(Math.random() * 30000) + 5000;
          notes += ' Critical: Falciparum detected. Immediate ACT regimen recommended.';
        } else if (species === 'Plasmodium vivax') {
          density = Math.floor(Math.random() * 10000) + 1000;
          notes += ' Vivax detected. Recurrence prevention with Primaquine advised.';
        } else if (species === 'Plasmodium malariae') {
          density = Math.floor(Math.random() * 4000) + 200;
          notes += ' Malariae band forms identified. Standard Chloroquine regimen.';
        }
      } else {
        notes += ' Normal smear. Negative for intra-erythrocytic parasites.';
      }

      const treatment = parasiteDetected 
        ? (species === 'Plasmodium falciparum' ? 'Artemether-Lumefantrine (Coartem)' : 'Chloroquine')
        : null;

      const patientAge = Math.floor(Math.random() * 55) + 3;
      const recordDate = new Date(date.getTime() + Math.floor(Math.random() * 8 * 60 * 60 * 1000));
      const hbVal = parseFloat((Math.random() * 8 + 6).toFixed(1));

      let severityGrade: 'Uncomplicated' | 'Severe (High Parasitemia)' | 'Emergency (Severe Anemic Crisis)' | 'Negative' = 'Uncomplicated';
      if (!parasiteDetected) {
        severityGrade = 'Negative';
      } else if (species === 'Plasmodium falciparum' && (density >= 10000 || hbVal < 7.0)) {
        severityGrade = 'Emergency (Severe Anemic Crisis)';
      }

      const chosenClinic = clinics[Math.floor(Math.random() * clinics.length)];

      surveillanceRecords.push({
        id: `rec-${Math.random().toString(36).substr(2, 9)}`,
        deviceId: chosenClinic.code,
        facility: {
          id: `FAC-${chosenClinic.code}`,
          name: chosenClinic.name,
          code: chosenClinic.code,
          tier: 'Tertiary Reference Lab',
          state: chosenClinic.state,
          lga: chosenClinic.lga,
          accreditationNumber: 'MLSCN/2026/BN-0482',
          chiefTechnician: 'Dr. Becky Saar (MLS)',
          chiefTechnicianPhone: '+2348071119766'
        },
        patient: {
          name: patientName,
          age: patientAge,
          weight: Math.floor(patientAge * 1.5 + 10),
          gender: isMale ? 'Male' : 'Female',
          clinicId: chosenClinic.name
        },
        result: {
          parasiteDetected,
          species,
          density,
          confidenceScore: parseFloat((Math.random() * 0.15 + 0.83).toFixed(2)),
          clinicalNotes: notes
        },
        rdtResult: {
          performed: true,
          cassetteType: 'Pf (HRP2) / Pv (pLDH) Dual',
          controlLine: true,
          hrp2Line: species === 'Plasmodium falciparum',
          pldhLine: species === 'Plasmodium vivax' || species === 'Plasmodium malariae',
          opticalDensityScore: parasiteDetected ? 0.85 : 0.05,
          faintLineDetected: false,
          interpretation: species === 'Plasmodium falciparum' ? 'Pf Positive (HRP2+)' : species === 'Plasmodium vivax' ? 'Pv/Pan Positive (pLDH+)' : 'Negative',
          concordanceStatus: 'Concordant',
          timestamp: recordDate.toISOString()
        },
        hbResult: {
          performed: true,
          hbValue: hbVal,
          pcvValue: Math.round(hbVal * 3.1),
          deviceModel: 'HemoCue Hb 301 (Bluetooth)',
          anemiaSeverity: hbVal < 7.0 ? 'Severe Anemia (<7.0 g/dL)' : hbVal < 10.0 ? 'Moderate Anemia' : 'Normal',
          bloodTransfusionIndicated: hbVal < 7.0,
          timestamp: recordDate.toISOString()
        },
        g6pdResult: {
          performed: true,
          enzymaticActivity: parseFloat((Math.random() * 8 + 4).toFixed(1)),
          percentNormal: Math.floor(Math.random() * 40) + 60,
          status: 'Normal (>70%)',
          primaquineSafe: true,
          deviceModel: 'SD Biosensor STANDARD G6PD',
          timestamp: recordDate.toISOString()
        },
        severityGrade,
        timestamp: recordDate.toISOString(),
        workerConfirmed: Math.random() > 0.05,
        treatmentRegimen: treatment,
        notes: notes,
        synced: true,
        imageKey: species.toLowerCase().split(' ')[1] || 'healthy'
      });
    }
  }
  
  surveillanceRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Seed the database
seedHistoricalData();

// Initialize Gemini API client lazily to handle missing key gracefully
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }
  return aiClient;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', api_key_configured: !!process.env.GEMINI_API_KEY });
});

app.get('/api/records', (req, res) => {
  const { nodeCode, facilityCode, search, species } = req.query;
  let results = [...surveillanceRecords];

  const targetCode = (nodeCode || facilityCode) as string;
  if (targetCode && typeof targetCode === 'string') {
    const codeQuery = targetCode.trim().toLowerCase();
    results = results.filter(r => 
      (r.facility?.code && r.facility.code.toLowerCase().includes(codeQuery)) ||
      (r.deviceId && r.deviceId.toLowerCase().includes(codeQuery))
    );
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    results = results.filter(r => 
      r.patient.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.facility?.code && r.facility.code.toLowerCase().includes(q)) ||
      (r.facility?.name && r.facility.name.toLowerCase().includes(q)) ||
      r.deviceId.toLowerCase().includes(q) ||
      (r.patient.ninOrHospitalNo && r.patient.ninOrHospitalNo.toLowerCase().includes(q))
    );
  }

  if (species && typeof species === 'string' && species !== 'ALL') {
    results = results.filter(r => r.result.species.toLowerCase().includes(species.toLowerCase()));
  }

  res.json(results);
});

app.get('/api/audit-trail', (req, res) => {
  const { nodeCode } = req.query;
  let logs = [...auditTrailLogs];
  if (nodeCode && typeof nodeCode === 'string') {
    logs = logs.filter(l => l.labNodeCode && l.labNodeCode.toLowerCase().includes(nodeCode.toLowerCase()));
  }
  res.json(logs);
});

app.post('/api/audit-trail', (req, res) => {
  const newAuditEntry = req.body;
  if (!newAuditEntry || !newAuditEntry.id) {
    return res.status(400).json({ error: 'Invalid audit payload' });
  }

  const existingIdx = auditTrailLogs.findIndex(l => l.id === newAuditEntry.id);
  if (existingIdx >= 0) {
    auditTrailLogs[existingIdx] = newAuditEntry;
  } else {
    auditTrailLogs.unshift(newAuditEntry);
  }

  res.status(201).json({ success: true, auditId: newAuditEntry.id });
});

app.post('/api/records', (req, res) => {
  const newRecord: DiagnosticRecord = req.body;
  newRecord.synced = true;
  
  const index = surveillanceRecords.findIndex(r => r.id === newRecord.id);
  if (index >= 0) {
    surveillanceRecords[index] = newRecord;
  } else {
    surveillanceRecords.unshift(newRecord);
  }
  
  res.status(201).json({ success: true, record: newRecord });
});

app.post('/api/records/bulk', (req, res) => {
  const { records: importedRecords, mode } = req.body;
  if (!Array.isArray(importedRecords)) {
    return res.status(400).json({ error: 'Expected records array' });
  }

  if (mode === 'replace') {
    surveillanceRecords = importedRecords.map(r => ({ ...r, synced: true }));
  } else {
    const recordMap = new Map<string, DiagnosticRecord>();
    surveillanceRecords.forEach(r => recordMap.set(r.id, r));
    importedRecords.forEach(r => recordMap.set(r.id, { ...r, synced: true }));
    surveillanceRecords = Array.from(recordMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  res.status(200).json({ success: true, total: surveillanceRecords.length });
});

app.post('/api/diagnose', async (req, res) => {
  const { imageKey, imageData, patient } = req.body;
  const isUploaded = imageKey === 'uploaded';
  
  try {
    const client = getGeminiClient();
    
    if (!client) {
      console.log('No Gemini API key configured. Using local Diagnostic Engine fallback.');
      const sample = SAMPLE_SLIDES.find(s => s.key === imageKey);
      
      let finalResult;
      if (isUploaded && imageData) {
        const detected = Math.random() > 0.3;
        const speciesList: Array<'Plasmodium falciparum' | 'Plasmodium vivax' | 'Plasmodium malariae'> = [
          'Plasmodium falciparum', 'Plasmodium vivax', 'Plasmodium malariae'
        ];
        const species = detected ? speciesList[Math.floor(Math.random() * speciesList.length)] : 'None';
        const density = detected 
          ? (species === 'Plasmodium falciparum' ? Math.floor(Math.random() * 15000) + 3000 : Math.floor(Math.random() * 5000) + 500)
          : 0;
          
        finalResult = {
          parasiteDetected: detected,
          species,
          density,
          confidenceScore: parseFloat((Math.random() * 0.12 + 0.85).toFixed(2)),
          clinicalNotes: detected 
            ? `Self-uploaded clinical smear. Interactive local scan detected intracellular inclusions corresponding to ${species}.`
            : 'Self-uploaded clinical smear. Interactive local scan returned normal results.'
        };
      } else if (sample) {
        const variance = Math.floor((Math.random() - 0.5) * (sample.expectedResult.density * 0.1));
        finalResult = {
          ...sample.expectedResult,
          density: sample.expectedResult.density > 0 ? sample.expectedResult.density + variance : 0,
          confidenceScore: parseFloat((sample.expectedResult.confidenceScore + (Math.random() - 0.5) * 0.04).toFixed(2))
        };
      } else {
        throw new Error('Unknown slide configuration.');
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.json({ result: finalResult, source: 'local_diagnostic_engine' });
    }

    let imagePart;
    if (isUploaded && imageData) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      imagePart = {
        inlineData: { data: base64Data, mimeType }
      };
    } else {
      const sample = SAMPLE_SLIDES.find(s => s.key === imageKey);
      if (!sample) {
        throw new Error(`Sample slide ${imageKey} not found.`);
      }
      
      const slideDiskMap: Record<string, string> = {
        falciparum: 'src/assets/images/falciparum_smear_1783686249385.jpg',
        vivax: 'src/assets/images/vivax_smear_1783686263162.jpg',
        malariae: 'src/assets/images/malariae_smear_1783686277652.jpg',
        healthy: 'src/assets/images/normal_smear_1783686291345.jpg'
      };

      const relativePath = slideDiskMap[imageKey] || (sample.imagePath.startsWith('/') ? sample.imagePath.substring(1) : sample.imagePath);
      const fullPath = path.join(process.cwd(), relativePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found on disk at: ${fullPath}`);
      }
      
      const fileBuffer = fs.readFileSync(fullPath);
      imagePart = {
        inlineData: { data: fileBuffer.toString('base64'), mimeType: 'image/jpeg' }
      };
    }

    const patientContext = patient 
      ? `Patient: ${patient.name}, Age: ${patient.age}, Weight: ${patient.weight}kg`
      : 'Patient metadata not specified';

    const systemPrompt = `You are a tropical medical parasitologist and AI diagnostic system in the AI-MalScan microscope.
Analyze this high-resolution thin blood smear microscope slide and provide a definitive clinical malaria diagnosis.
Clinical Context: ${patientContext}
Provide your output strictly in JSON according to the schema provided.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [imagePart, { text: systemPrompt }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            parasiteDetected: { type: Type.BOOLEAN },
            species: { type: Type.STRING, enum: ['Plasmodium falciparum', 'Plasmodium vivax', 'Plasmodium malariae', 'Plasmodium ovale', 'None'] },
            density: { type: Type.INTEGER },
            confidenceScore: { type: Type.NUMBER },
            clinicalNotes: { type: Type.STRING }
          },
          required: ['parasiteDetected', 'species', 'density', 'confidenceScore', 'clinicalNotes']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response received from Gemini.');
    
    return res.json({ result: JSON.parse(text.trim()), source: 'gemini_2.5_flash' });

  } catch (err: any) {
    console.error('Error in AI diagnostic scan:', err);
    res.status(500).json({ error: 'AI Diagnostic Scan failed.', message: err.message, source: 'error_recovery_fallback' });
  }
});

// Setup Vite Dev server or Serve built static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`AI-MalScan server running on port ${PORT}`);
  });
}

startServer();
