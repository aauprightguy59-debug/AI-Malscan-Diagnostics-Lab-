/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle2, AlertTriangle, ShieldCheck, Heart, User, ClipboardList, 
  Info, HelpCircle, Award, Stethoscope, Stamp, Printer, AlertOctagon, HeartPulse, 
  Zap, Microscope, Dna, Lock, Unlock, ArrowUpRight 
} from 'lucide-react';
import { 
  DiagnosticRecord, WHO_TREATMENT_GUIDELINES, ChiefTechnician, LabFacility, 
  labLogo, G6PDResult, RDTResult, HemoglobinResult 
} from '../types';
import PrintReportDossier from './PrintReportDossier';
import G6PDSafetyGate from './G6PDSafetyGate';

interface DiagnosticReportProps {
  record: DiagnosticRecord;
  source: string;
  onAuthorizeRecord: (updatedRecord: DiagnosticRecord) => void;
  isSyncing: boolean;
  networkStatus: 'online' | 'offline';
  technician?: ChiefTechnician | null;
  facility?: LabFacility;
}

export default function DiagnosticReport({
  record,
  source,
  onAuthorizeRecord,
  isSyncing,
  networkStatus,
  technician,
  facility
}: DiagnosticReportProps) {
  const { patient, result, timestamp, id, deviceId } = record;
  const isPositive = result.parasiteDetected;

  // Active inputs for sign-off
  const [workerAction, setWorkerAction] = useState<'confirm' | 'flag'>('confirm');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showG6PDLockModal, setShowG6PDLockModal] = useState(false);

  // Local record state for updates like G6PD
  const [currentG6PD, setCurrentG6PD] = useState<G6PDResult | undefined>(record.g6pdResult);
  const rdt = record.rdtResult;
  const hb = record.hbResult;
  const mol = record.molecularResult;

  // Check safety lock criteria
  const isVivaxOrOvale = result.species.includes('vivax') || result.species.includes('ovale');
  const isG6PDRequiredAndMissing = isVivaxOrOvale && (!currentG6PD || !currentG6PD.performed || currentG6PD.status.includes('Pending'));
  const isG6PDDeficient = currentG6PD && currentG6PD.status.includes('Deficient');

  // Check severe malaria anemia criteria
  const isSevereAnemia = hb ? hb.hbValue < 7.0 : false;
  const isHyperParasitemia = result.density >= 10000;
  const isSevereFalciparumCrisis = result.species === 'Plasmodium falciparum' && (isHyperParasitemia || isSevereAnemia);

  // Auto-fill drug recommendations based on species, severity, and G6PD status
  useEffect(() => {
    if (isPositive && result.species) {
      const guideline = WHO_TREATMENT_GUIDELINES[result.species];
      if (isSevereFalciparumCrisis) {
        setSelectedDrug('IV Artesunate 2.4 mg/kg (Severe Malaria Emergency Protocol)');
      } else if (isVivaxOrOvale) {
        if (isG6PDDeficient) {
          setSelectedDrug('Chloroquine + Weekly Primaquine 0.75 mg/kg for 8 weeks (G6PD Deficient Protocol)');
        } else {
          setSelectedDrug('Chloroquine + Daily Primaquine 0.25-0.5 mg/kg for 14 days (Radical Cure)');
        }
      } else if (guideline && guideline.drugs.length > 0) {
        setSelectedDrug(guideline.drugs[0]);
      }
    } else {
      setSelectedDrug('No antimalarials required');
    }
    setCustomNotes('');
    setWorkerAction('confirm');
  }, [record.id, currentG6PD?.status, isSevereFalciparumCrisis]);

  // Determine severity tier
  const getSeverityTier = () => {
    if (!isPositive) return { label: 'HEALTHY / NEGATIVE', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    if (isSevereFalciparumCrisis || (hb && hb.hbValue < 5.0)) {
      return { label: 'EMERGENCY: SEVERE MALARIA ANEMIA', color: 'bg-red-600 animate-pulse', text: 'text-red-400', border: 'border-red-500/40' };
    }
    if (result.density < 1000) return { label: 'LOW PARASITEMIA', color: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/20' };
    if (result.density < 10000) return { label: 'MODERATE PARASITEMIA', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/20' };
    return { label: 'HIGH PARASITEMIA (URGENT)', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/20' };
  };

  const severity = getSeverityTier();

  const handleAuthorize = () => {
    if (isG6PDRequiredAndMissing) {
      setShowG6PDLockModal(true);
      return;
    }

    const updated: DiagnosticRecord = {
      ...record,
      g6pdResult: currentG6PD,
      severityGrade: isSevereFalciparumCrisis ? 'Emergency (Severe Anemic Crisis)' : isPositive ? 'Uncomplicated' : 'Negative',
      workerConfirmed: workerAction === 'confirm',
      treatmentRegimen: workerAction === 'confirm' ? selectedDrug : 'MANUAL_REVIEW_FLAGGED',
      notes: customNotes.trim() !== '' ? customNotes : result.clinicalNotes,
      synced: false,
      technician: technician || record.technician,
      facility: facility || record.facility
    };
    onAuthorizeRecord(updated);
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div id="diagnostic-report-container" className="space-y-6 animate-fade-in">
      
      {/* Action Bar: Print and Facility Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">AI-MalScan V3.0 Hybrid Reference Dossier</h2>
            <div className="text-[10px] text-slate-400 font-mono">
              Node: <span className="text-teal-300">{facility?.name || 'Gboko Central Reference Lab'}</span> • {facility?.accreditationNumber || 'MLSCN/2026/BN-0482'}
            </div>
          </div>
        </div>

        <button
          id="print-dossier-btn"
          onClick={() => setShowPrintModal(true)}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-teal-500/40 text-teal-300 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-md"
        >
          <Printer className="h-4 w-4 text-teal-400" />
          <span>Print Official Dossier (A4)</span>
        </button>
      </div>

      {/* SECTION 1: SEVERE MALARIA EMERGENCY ALERT BANNER */}
      {isSevereFalciparumCrisis && (
        <div className="bg-gradient-to-r from-red-950/80 to-rose-950/80 border-2 border-red-500/60 rounded-2xl p-5 shadow-2xl flex items-start space-x-4 animate-pulse">
          <div className="h-12 w-12 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
            <AlertOctagon className="h-7 w-7" />
          </div>
          <div className="space-y-1 text-xs text-red-200">
            <div className="flex items-center space-x-2">
              <span className="font-black uppercase tracking-wider text-sm text-red-300">
                CRITICAL AUTOMATIC ALERT: SEVERE FALCIPARUM MALARIA
              </span>
              <span className="bg-red-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded font-mono uppercase">
                EMERGENCY REFERRAL
              </span>
            </div>
            <p className="leading-relaxed">
              <strong>Clinical Logic Tripped: </strong> Species = <em>Plasmodium falciparum</em> + Parasite Density &gt; 10,000/µL ({result.density.toLocaleString()}/µL) + Hemoglobin &lt; 7.0 g/dL ({hb?.hbValue || 'Low'} g/dL).
            </p>
            <div className="bg-red-950/90 border border-red-500/40 p-2.5 rounded-lg text-[11px] font-mono text-red-100 mt-2">
              🚨 IMMEDIATE INTERVENTION PROTOCOL: 
              1. Administer IV Artesunate 2.4 mg/kg bolus at 0h, 12h, 24h.
              2. Order Urgent Screened Packed Red Blood Cells Transfusion (Hb &lt; 7g/dL).
              3. Maintain hydration and monitor for cerebral malaria signs.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: 4-IN-1 HYBRID DIAGNOSTIC BATTERY DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Module 1: AI Microscopy */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-teal-400">
              <Microscope className="h-4 w-4" />
              <span>1. AI Microscopy</span>
            </div>
            <span className="text-[9px] font-mono bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">
              {(result.confidenceScore * 100).toFixed(0)}% Conf
            </span>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Species Classified:</div>
            <div className="text-sm font-black text-white italic truncate mt-0.5">{result.species}</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Parasitemia Density:</div>
            <div className="text-xl font-mono font-black text-teal-300 mt-0.5">
              {isPositive ? result.density.toLocaleString() : '0'} <span className="text-[10px] text-slate-500 font-normal">/µL</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 line-clamp-2 italic">
            "{result.clinicalNotes}"
          </div>
        </div>

        {/* Module 2: RDT Dual Antigen Reader */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
              <Zap className="h-4 w-4" />
              <span>2. RDT Dual Reader</span>
            </div>
            <span className="text-[9px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
              {rdt?.concordanceStatus || 'Concordant'}
            </span>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Antigen Line Bands:</div>
            <div className="flex items-center space-x-2 mt-1 font-mono text-xs">
              <span className={`px-1.5 py-0.5 rounded ${rdt?.hrp2Line ? 'bg-rose-500/20 text-rose-300 font-bold' : 'bg-slate-900 text-slate-500'}`}>
                Pf (HRP2) {rdt?.hrp2Line ? '+' : '-'}
              </span>
              <span className={`px-1.5 py-0.5 rounded ${rdt?.pldhLine ? 'bg-blue-500/20 text-blue-300 font-bold' : 'bg-slate-900 text-slate-500'}`}>
                Pv (pLDH) {rdt?.pldhLine ? '+' : '-'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Optical Verification:</div>
            <div className="text-xs text-slate-300 font-mono mt-0.5">
              Control: {rdt?.controlLine ? 'VALID (Pass)' : 'INVALID'} • OD: {rdt?.opticalDensityScore?.toFixed(2) || '0.00'}
            </div>
          </div>

          <div className="text-[10px] text-slate-400">
            Interpretation: <strong className="text-slate-200">{rdt?.interpretation || 'Negative'}</strong>
          </div>
        </div>

        {/* Module 3: Hemoglobin / PCV Anemia Analyzer */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-400">
              <HeartPulse className="h-4 w-4" />
              <span>3. Hb / PCV Analyzer</span>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
              isSevereAnemia ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {hb?.anemiaSeverity || 'Normal'}
            </span>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Hemoglobin Level:</div>
            <div className="text-xl font-mono font-black text-white mt-0.5">
              {hb?.hbValue || 12.0} <span className="text-xs font-normal text-slate-400">g/dL</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Calculated Hematocrit (PCV):</div>
            <div className="text-xs font-mono text-teal-300 mt-0.5">
              PCV: {hb?.pcvValue || 36}% • Model: HemoCue 301
            </div>
          </div>

          <div className={`text-[10px] font-mono px-2 py-1 rounded ${
            hb?.bloodTransfusionIndicated ? 'bg-rose-950 text-rose-300 font-bold border border-rose-500/40' : 'text-slate-400'
          }`}>
            {hb?.bloodTransfusionIndicated ? '⚠️ URGENT TRANSFUSION INDICATED' : 'Transfusion not required'}
          </div>
        </div>

        {/* Module 4: G6PD Biosensor Safety Gate */}
        <div className={`bg-slate-950 border rounded-2xl p-4 space-y-3 shadow-xl ${
          isG6PDRequiredAndMissing ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-400">
              <ShieldCheck className="h-4 w-4" />
              <span>4. G6PD Safety Lock</span>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
              currentG6PD?.status?.includes('Normal') ? 'bg-emerald-500/20 text-emerald-300' :
              isG6PDRequiredAndMissing ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {currentG6PD?.status || 'Pending'}
            </span>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Enzymatic Activity:</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              {currentG6PD?.enzymaticActivity?.toFixed(1) || '--'} U/g Hb ({currentG6PD?.percentNormal || '--'}%)
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Primaquine Clearance:</div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              {currentG6PD?.primaquineSafe ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <Unlock className="h-3.5 w-3.5" />
                  <span>CLEARED (Safe)</span>
                </span>
              ) : isG6PDRequiredAndMissing ? (
                <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                  <Lock className="h-3.5 w-3.5" />
                  <span>SAFETY LOCKED</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-400 flex items-center space-x-1">
                  <Lock className="h-3.5 w-3.5" />
                  <span>CONTRAINDICATED</span>
                </span>
              )}
            </div>
          </div>

          {isVivaxOrOvale && (
            <button
              onClick={() => setShowG6PDLockModal(true)}
              className="w-full py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-500/40 transition-colors cursor-pointer"
            >
              {isG6PDRequiredAndMissing ? '⚡ Enter G6PD Reading Now' : 'Edit G6PD Biosensor'}
            </button>
          )}
        </div>

      </div>

      {/* SECTION 3: WORKER SIGN-OFF & TREATMENT DECISION CONSOLE */}
      {record.workerConfirmed === null ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-teal-400" />
              <h3 className="text-md font-semibold text-white tracking-tight">Chief Lab Scientist Authorization & Prescribing Console</h3>
            </div>
            {technician && (
              <div className="flex items-center space-x-2 bg-teal-500/10 border border-teal-500/30 px-3 py-1 rounded-lg text-[11px] font-mono text-teal-300">
                <Award className="h-3.5 w-3.5 text-teal-400" />
                <span>Authorized Signer: <strong className="text-white">{technician.name}</strong> ({technician.licenseNumber})</span>
              </div>
            )}
          </div>

          {/* Action selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              id="action-confirm-btn"
              onClick={() => setWorkerAction('confirm')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                workerAction === 'confirm'
                  ? 'bg-teal-950/20 border-teal-500 text-teal-200 shadow-md shadow-teal-500/5'
                  : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-wider">Confirm 4-in-1 Diagnosis</span>
                <CheckCircle2 className={`h-4.5 w-4.5 ${workerAction === 'confirm' ? 'text-teal-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Authorize multi-modal findings and dispense verified WHO treatment regimen.</p>
            </button>

            <button
              id="action-flag-btn"
              onClick={() => setWorkerAction('flag')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                workerAction === 'flag'
                  ? 'bg-rose-950/20 border-rose-500 text-rose-200 shadow-md shadow-rose-500/5'
                  : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-wider">Flag for Expert Review</span>
                <AlertTriangle className={`h-4.5 w-4.5 ${workerAction === 'flag' ? 'text-rose-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Flag slide for secondary manual examination or molecular PCR escalation.</p>
            </button>
          </div>

          {/* Treatment Details if confirmed */}
          {workerAction === 'confirm' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Heart className="h-4 w-4 text-rose-400 animate-pulse" />
                  <span>WHO / Federal Ministry of Health Prescribed Treatment Regimen</span>
                </div>
                <span className="bg-teal-500/10 text-teal-300 text-[9px] font-bold px-2 py-0.5 rounded border border-teal-500/20 uppercase">
                  Regimen Assistant Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Prescription Drug */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Prescribed Antimalarial Agent</label>
                  <select
                    id="treatment-drug-select"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    value={selectedDrug}
                    onChange={e => setSelectedDrug(e.target.value)}
                  >
                    {isSevereFalciparumCrisis ? (
                      <>
                        <option value="IV Artesunate 2.4 mg/kg (Severe Malaria Emergency Protocol)">IV Artesunate 2.4 mg/kg (Severe Malaria Emergency Protocol)</option>
                        <option value="IM Artemether 3.2 mg/kg Loading Dose">IM Artemether 3.2 mg/kg Loading Dose</option>
                      </>
                    ) : isPositive ? (
                      WHO_TREATMENT_GUIDELINES[result.species]?.drugs.map((drug, idx) => (
                        <option key={idx} value={drug}>{drug}</option>
                      )) || <option value="Oral Chloroquine">Oral Chloroquine</option>
                    ) : (
                      <option value="No antimalarials required">No antimalarials required</option>
                    )}
                  </select>
                </div>

                {/* Patient Context */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 flex items-center space-x-3 text-xs">
                  <Info className="h-5 w-5 text-teal-400 shrink-0" />
                  <div className="text-[11px] text-slate-400 leading-snug">
                    <span className="text-white font-semibold">Dosing Rule: </span>
                    Patient is <span className="text-teal-300 font-bold">{patient.age}y / {patient.weight}kg</span>. 
                    {isSevereFalciparumCrisis && ' Auto-escalated to IV Artesunate for severe malarial anemia.'}
                  </div>
                </div>
              </div>

              {/* Dosing Details */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-1.5 text-xs font-mono">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Clinical Dosing Schedule:</div>
                <div className="text-white">
                  {WHO_TREATMENT_GUIDELINES[result.species]?.schedule || 'Follow standard protocol.'}
                </div>
                {WHO_TREATMENT_GUIDELINES[result.species]?.warning && (
                  <div className="text-amber-400 text-[10px] pt-1 border-t border-slate-800">
                    ⚠️ {WHO_TREATMENT_GUIDELINES[result.species]?.warning}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clinician Review Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Chief Scientist Sign-off Observations</label>
            <textarea
              id="clinical-review-notes"
              rows={2}
              placeholder="e.g. 4-in-1 hybrid findings reviewed. Patient admitted for IV Artesunate and packed cell transfusion. Report synchronized to Benue surveillance registry."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-600 font-mono"
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
            />
          </div>

          {/* Authorize Button */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${networkStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>{networkStatus === 'online' ? 'Online: Immediate National Sync' : 'Offline Field Mode: Queued Locally'}</span>
            </div>
            
            <button
              id="authorize-and-sign-btn"
              onClick={handleAuthorize}
              disabled={isSyncing}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase shadow-lg cursor-pointer ${
                isG6PDRequiredAndMissing 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : workerAction === 'confirm'
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-slate-950'
              } transition-all`}
            >
              {isG6PDRequiredAndMissing ? '⚠️ Complete G6PD Check to Authorize' : isSyncing ? 'Synchronizing Case...' : 'Authorize & Sign Case Dossier'}
            </button>
          </div>
        </div>
      ) : (
        /* Signoff Completed Status Card */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg border ${record.workerConfirmed ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">Case Authorized & Signed Off</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Regimen prescribed: <span className="text-slate-200">{record.treatmentRegimen}</span>
              </p>
              {(record.technician || technician) && (
                <p className="text-[11px] text-teal-400 font-mono mt-1 flex items-center space-x-1.5">
                  <Award className="h-3.5 w-3.5" />
                  <span>
                    Authenticated by: <strong>{(record.technician || technician)?.name}</strong> ({(record.technician || technician)?.licenseNumber}) - {(record.technician || technician)?.facility}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print A4 Dossier</span>
            </button>
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded border ${
              record.synced 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
            }`}>
              {record.synced ? '● SYNCED TO SURVEILLANCE' : '◷ LOCAL QUEUE'}
            </span>
          </div>
        </div>
      )}

      {/* Print Dossier Modal Preview */}
      {showPrintModal && (
        <PrintReportDossier
          record={record}
          facility={facility}
          technician={technician || record.technician}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* G6PD Safety Modal */}
      {showG6PDLockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <G6PDSafetyGate
            currentG6PD={currentG6PD}
            species={result.species}
            patientGender={patient.gender}
            onSaveG6PD={(res) => {
              setCurrentG6PD(res);
              setShowG6PDLockModal(false);
            }}
            onClose={() => setShowG6PDLockModal(false)}
          />
        </div>
      )}

    </div>
  );
}
