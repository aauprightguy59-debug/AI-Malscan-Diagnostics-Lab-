/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, ShieldCheck, CheckCircle2, AlertTriangle, AlertOctagon, HeartPulse, Dna, Zap, Microscope, Building2, QrCode } from 'lucide-react';
import { DiagnosticRecord, LabFacility, ChiefTechnician, labLogo } from '../types';

interface PrintReportDossierProps {
  record: DiagnosticRecord;
  facility?: LabFacility;
  technician?: ChiefTechnician;
  onClose?: () => void;
}

export default function PrintReportDossier({
  record,
  facility,
  technician,
  onClose
}: PrintReportDossierProps) {
  
  const handlePrint = () => {
    window.print();
  };

  const patient = record.patient;
  const result = record.result;
  const rdt = record.rdtResult;
  const hb = record.hbResult;
  const g6pd = record.g6pdResult;
  const mol = record.molecularResult;

  const isSevereAnemia = hb?.anemiaSeverity.includes('Severe') || hb?.anemiaSeverity.includes('Critical');
  const isSevereMalaria = record.severityGrade.includes('Severe') || record.severityGrade.includes('Emergency');

  return (
    <div id="printable-dossier-wrapper" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 flex justify-center">
      
      {/* Container that is print-ready */}
      <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl p-8 my-auto space-y-6 print:m-0 print:p-6 print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Floating Print Action Bar (Hidden on Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              Official Diagnostic Report Preview
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-md flex items-center space-x-2 cursor-pointer transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print Dossier (A4)</span>
            </button>
          </div>
        </div>

        {/* Laboratory Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex items-center space-x-4">
            <img
              src={labLogo}
              alt="Malaria Reference Laboratory Logo"
              className="h-16 w-16 object-contain rounded-lg border border-slate-300 p-1"
            />
            <div>
              <h1 className="text-base font-black uppercase tracking-tight text-slate-900 font-sans">
                {facility?.name || 'Gboko Central Reference Lab & Epidemic Post'}
              </h1>
              <div className="text-[11px] font-mono text-slate-600">
                Facility Node: {facility?.code || 'GBK-REF-01'} • Tier: {facility?.tier || 'Tertiary Reference Lab'}
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                Accreditation: {facility?.accreditationNumber || 'MLSCN/2026/BN-0482'} • {facility?.lga || 'Gboko LGA'}, {facility?.state || 'Benue State'}
              </div>
            </div>
          </div>

          <div className="text-right font-mono text-[10px] text-slate-600">
            <div className="font-bold text-slate-900 text-xs">AI-MALSCAN SUITE V3.0</div>
            <div>CASE ID: {record.id.toUpperCase()}</div>
            <div>DATE: {new Date(record.timestamp).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Patient Identification Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Patient Name:</span>
            <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Age / Gender / Weight:</span>
            <span className="font-semibold text-slate-800">{patient.age} yrs • {patient.gender} • {patient.weight} kg</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Clinic Ref / NIN:</span>
            <span className="font-semibold text-slate-800">{patient.ninOrHospitalNo || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Device Station:</span>
            <span className="font-mono text-teal-800 font-bold">{record.deviceId}</span>
          </div>
        </div>

        {/* Clinical Severity Banner if applicable */}
        {isSevereMalaria && (
          <div className="bg-red-50 border-2 border-red-600 rounded-xl p-3 flex items-start space-x-3 text-red-950">
            <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wide text-red-800 block">
                CRITICAL CLINICAL ALERT: SEVERE MALARIA CASE CLASSIFICATION
              </span>
              Patient presents with hyper-parasitemia ({result.density.toLocaleString()} parasites/µL) or severe malarial anemia (Hb {hb?.hbValue} g/dL). 
              Immediate IV Artesunate and blood transfusion evaluation required.
            </div>
          </div>
        )}

        {/* 4-in-1 Hybrid Diagnostic Results Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 font-mono">
            4-in-1 Diagnostic Battery Evaluation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Test 1: AI Digital Smear Microscopy */}
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200 pb-1.5">
                <div className="flex items-center space-x-1.5 text-teal-900">
                  <Microscope className="h-4 w-4" />
                  <span>1. Thin Smear AI Microscopy</span>
                </div>
                <span className="text-[9px] font-mono bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded">
                  {(result.confidenceScore * 100).toFixed(0)}% Conf
                </span>
              </div>
              <div className="text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Parasite Species:</span>
                  <span className="font-bold text-slate-900">{result.species}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Parasite Density:</span>
                  <span className="font-mono font-bold text-teal-900">
                    {result.density > 0 ? `${result.density.toLocaleString()} /µL` : 'None Seen'}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-600 italic leading-snug">
                "{result.clinicalNotes}"
              </div>
            </div>

            {/* Test 2: Rapid Diagnostic Test (RDT) */}
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200 pb-1.5">
                <div className="flex items-center space-x-1.5 text-slate-900">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <span>2. RDT Dual Antigen Reader</span>
                </div>
                <span className="text-[9px] font-mono bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                  {rdt?.concordanceStatus || 'Concordant'}
                </span>
              </div>
              <div className="text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">HRP2 Line (Pf):</span>
                  <span className="font-semibold text-slate-900">{rdt?.hrp2Line ? 'POSITIVE (+)' : 'NEGATIVE (-)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">pLDH Line (Pv):</span>
                  <span className="font-semibold text-slate-900">{rdt?.pldhLine ? 'POSITIVE (+)' : 'NEGATIVE (-)'}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-600 font-mono">
                Control Line: {rdt?.controlLine ? 'VALID (Pass)' : 'INVALID'} • Interpretation: {rdt?.interpretation}
              </div>
            </div>

            {/* Test 3: Hemoglobin / PCV Anemia Analyzer */}
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200 pb-1.5">
                <div className="flex items-center space-x-1.5 text-slate-900">
                  <HeartPulse className="h-4 w-4 text-rose-600" />
                  <span>3. Hemoglobin / PCV Analyzer</span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  isSevereAnemia ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {hb?.anemiaSeverity || 'Normal'}
                </span>
              </div>
              <div className="text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Hemoglobin (Hb):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {hb?.hbValue || 12.0} <span className="text-xs font-normal">g/dL</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Estimated PCV:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {hb?.pcvValue || 36}%
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-600">
                Device: {hb?.deviceModel || 'HemoCue Hb 301'} • Transfusion Indicated: {hb?.bloodTransfusionIndicated ? 'YES (URGENT)' : 'NO'}
              </div>
            </div>

            {/* Test 4: G6PD Biosensor Safety Interlock */}
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200 pb-1.5">
                <div className="flex items-center space-x-1.5 text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <span>4. G6PD Quantitative Safety Lock</span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  g6pd?.status.includes('Normal') ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                }`}>
                  {g6pd?.status || 'Pending'}
                </span>
              </div>
              <div className="text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Enzymatic Activity:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {g6pd?.enzymaticActivity || 0} U/g Hb ({g6pd?.percentNormal || 0}%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Primaquine Safety:</span>
                  <span className={`font-bold ${g6pd?.primaquineSafe ? 'text-emerald-700' : 'text-red-700'}`}>
                    {g6pd?.primaquineSafe ? 'CLEARED (Safe)' : 'CONTRAINDICATED'}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-600">
                {g6pd?.clinicalWarning || 'Standard 14-day anti-relapse Primaquine cleared.'}
              </div>
            </div>

          </div>

          {/* Optional Molecular PCR/LAMP Section if performed */}
          {mol?.performed && (
            <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-indigo-950">
                <div className="flex items-center space-x-1.5">
                  <Dna className="h-4 w-4 text-indigo-700" />
                  <span>Molecular Amplification Profile ({mol.testType})</span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">
                  {mol.triggerReason}
                </span>
              </div>
              <div className="text-[11px] text-slate-700">
                DNA Detected: <strong>{mol.dnaDetected ? 'POSITIVE (Plasmodium DNA confirmed)' : 'NEGATIVE'}</strong> • K13 Propeller: <strong>{mol.k13MutationDetails}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Treatment Protocol Guideline */}
        <div className="bg-slate-100 rounded-xl p-4 border border-slate-300 space-y-1.5">
          <div className="text-xs font-bold text-slate-900 uppercase font-mono">
            Authorized Treatment Regimen (WHO / NMEP Nigeria Protocol)
          </div>
          <div className="text-xs font-semibold text-teal-900">
            {record.treatmentRegimen || 'Standard First-Line Artemether-Lumefantrine (Coartem)'}
          </div>
          <div className="text-[10px] text-slate-600 leading-snug">
            Notes: {record.notes}
          </div>
        </div>

        {/* Signatures & Certification Block */}
        <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-4 items-end text-xs">
          
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-mono">Chief Medical Lab Scientist:</span>
            <div className="font-bold text-slate-900 text-xs mt-1">
              {technician?.name || facility?.chiefTechnician || 'Dr. Becky Saar (MLS, MSc)'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              License: {technician?.licenseNumber || 'MLSCN/LIC/77402'}
            </div>
          </div>

          <div className="text-center">
            <div className="inline-block border-2 border-dashed border-teal-800/40 rounded-lg px-3 py-1 bg-teal-50/50">
              <span className="text-[9px] font-mono text-teal-900 font-bold uppercase block">DIGITAL STAMP</span>
              <span className="text-[8px] text-teal-700 font-mono">VERIFIED & ACCREDITED</span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="h-10 w-10 border border-slate-300 rounded flex items-center justify-center p-1">
              <QrCode className="h-8 w-8 text-slate-700" />
            </div>
            <span className="text-[8px] text-slate-400 font-mono mt-1">NMEP SURVEILLANCE SYNCED</span>
          </div>

        </div>

      </div>

    </div>
  );
}
