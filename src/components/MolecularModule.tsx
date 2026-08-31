/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Dna, Activity, Zap, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Filter, Database, ShieldAlert, Layers, Play, Clock } from 'lucide-react';
import { MolecularResult, DiagnosticRecord, LabFacility } from '../types';

interface MolecularModuleProps {
  activeRecord?: DiagnosticRecord | null;
  facility?: LabFacility;
  onSaveMolecular: (molecularResult: MolecularResult) => void;
}

export const MOLECULAR_TARGETS = [
  { id: '18S rRNA', name: 'Plasmodium 18S rRNA (Pan-Species DNA)', description: 'Ultra-sensitive pan-genus ribosomal DNA target. Sensitivity limit: 0.1 parasites/µL.' },
  { id: 'pfhrp2', name: 'pfhrp2 Gene (Falciparum HRP2 Deletion Screen)', description: 'Verifies intact HRP2 locus. Critical for investigating false-negative RDTs.' },
  { id: 'kelch13', name: 'Kelch-13 (K13 Artemisinin Resistance Propeller)', description: 'Screens for C580Y, R561H, and M572I mutations associated with delayed parasite clearance.' },
  { id: 'pfmdr1', name: 'pfmdr1 / pfcrt (Multidrug Efflux & Chloroquine Transporter)', description: 'Monitors N86Y and K76T mutations determining partner-drug tolerance.' }
];

export default function MolecularModule({
  activeRecord,
  facility,
  onSaveMolecular
}: MolecularModuleProps) {
  // Test selection
  const [testType, setTestType] = useState<'Isothermal LAMP (Loop-Mediated)' | 'miniPCR Thermal Cycling'>('Isothermal LAMP (Loop-Mediated)');
  const [triggerReason, setTriggerReason] = useState<MolecularResult['triggerReason']>(
    activeRecord?.result.density && activeRecord.result.density > 100000 
      ? 'Hyper-parasitemia (>100k/µL)' 
      : 'Weekly Sentinel QA'
  );
  
  const [selectedGenes, setSelectedGenes] = useState<Array<MolecularResult['targetGenes'][number]>>([
    '18S rRNA',
    'kelch13 (K13 Artemisinin Resistance)'
  ]);

  // Reaction State
  const [isRunning, setIsRunning] = useState(false);
  const [progressMin, setProgressMin] = useState(0); // 0 to 30 minutes
  const [completed, setCompleted] = useState(false);
  const [fluorescenceData, setFluorescenceData] = useState<number[]>([]);
  
  // Results
  const [dnaDetected, setDnaDetected] = useState(true);
  const [k13Mutation, setK13Mutation] = useState(false);
  const [k13Details, setK13Details] = useState('Wild Type (Sensitive to Artemisinin ACTs)');

  // Auto-set trigger reason if patient record is passed
  useEffect(() => {
    if (activeRecord) {
      if (activeRecord.result.density > 100000) {
        setTriggerReason('Hyper-parasitemia (>100k/µL)');
      } else if (activeRecord.rdtResult && activeRecord.result.parasiteDetected && !activeRecord.rdtResult.hrp2Line) {
        setTriggerReason('HRP2 Gene Deletion Suspected');
        setSelectedGenes(['18S rRNA', 'pfhrp2', 'pfhrp3']);
      }
    }
  }, [activeRecord]);

  const toggleGene = (geneId: string) => {
    const typedGene = geneId as MolecularResult['targetGenes'][number];
    if (selectedGenes.includes(typedGene)) {
      if (selectedGenes.length > 1) {
        setSelectedGenes(selectedGenes.filter(g => g !== typedGene));
      }
    } else {
      setSelectedGenes([...selectedGenes, typedGene]);
    }
  };

  const startMolecularRun = () => {
    setIsRunning(true);
    setProgressMin(0);
    setCompleted(false);
    setFluorescenceData([12, 14, 15]);

    const totalMinutes = testType.includes('LAMP') ? 25 : 45;
    let currentMinute = 0;
    const currentPoints = [12, 14, 15];

    const timer = setInterval(() => {
      currentMinute += 2;
      setProgressMin(currentMinute);

      // S-curve amplification kinetics
      if (dnaDetected) {
        if (currentMinute < 10) {
          currentPoints.push(15 + Math.random() * 5);
        } else if (currentMinute < 20) {
          const boost = Math.pow(currentMinute - 8, 2.3);
          currentPoints.push(Math.min(850, Math.round(20 + boost)));
        } else {
          currentPoints.push(Math.min(920, Math.round(820 + (currentMinute - 20) * 8 + Math.random() * 10)));
        }
      } else {
        currentPoints.push(15 + Math.random() * 3);
      }

      setFluorescenceData([...currentPoints]);

      if (currentMinute >= totalMinutes) {
        clearInterval(timer);
        setIsRunning(false);
        setCompleted(true);
      }
    }, 200);
  };

  const handleSaveResult = () => {
    const result: MolecularResult = {
      performed: true,
      testType,
      triggerReason,
      targetGenes: selectedGenes,
      dnaDetected,
      k13MutationDetected: k13Mutation,
      k13MutationDetails: k13Mutation 
        ? 'C580Y Mutation Detected (Candidate Artemisinin Resistance Flag)' 
        : 'Wild Type (Sensitive to First-Line ACT Regimens)',
      amplificationTimeMin: testType.includes('LAMP') ? 24.5 : 42.0,
      cycleThresholdOrIntensity: dnaDetected ? 14.8 : 40.0,
      timestamp: new Date().toISOString()
    };

    onSaveMolecular(result);
  };

  return (
    <div id="molecular-module-container" className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Dna className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Portable Molecular Confirmation Suite</h2>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/40 font-bold uppercase">
                Module 2 (PCR / LAMP)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Low-cost isothermal amplification & drug-resistance genomic monitoring for remote Benue & IDP sentinel clinics
            </p>
          </div>
        </div>

        {/* Sentinel Device Status */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-3 text-xs font-mono">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <div className="text-slate-400 text-[10px]">DEVICE LINK:</div>
            <div className="text-white font-bold">miniPCR / NEB WarmStart LAMP</div>
          </div>
          <div className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-teal-400">
            USB / BLE CONNECTED
          </div>
        </div>
      </div>

      {/* Main Grid: Protocol Configuration & Amplification Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Setup & Smart Trigger Rules */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Smart Trigger Criteria Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Filter className="h-4 w-4 text-teal-400" />
                <span>Smart Cost-Containment Trigger Rules</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">WHO Benue Protocol</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              To minimize reagent costs in Gboko & IDP camps, molecular testing is executed only on high-value clinical triggers:
            </p>

            <div className="space-y-2">
              {[
                { key: 'Hyper-parasitemia (>100k/µL)', label: '1. Hyper-Parasitemia Failure (>100,000/µL or Persistent Fever)' },
                { key: 'Mixed Infection Suspected', label: '2. Mixed Species Infection (e.g. Pf + Pv Co-Circulation)' },
                { key: 'HRP2 Gene Deletion Suspected', label: '3. Suspected HRP2 Deletion (Microscopy+ / RDT-)' },
                { key: 'Weekly Sentinel QA', label: '4. Weekly Sentinel Surveillance (5 Random QA Samples)' }
              ].map((rule) => (
                <button
                  key={rule.key}
                  onClick={() => setTriggerReason(rule.key as any)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    triggerReason === rule.key
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-white font-medium shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {rule.label}
                </button>
              ))}
            </div>
          </div>

          {/* Technology & Gene Target Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Assay Chemistry & Targets</span>
              <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-teal-400 font-mono">65°C Isothermal</span>
            </div>

            {/* Test Type */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTestType('Isothermal LAMP (Loop-Mediated)')}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  testType.includes('LAMP')
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Isothermal LAMP (25 Min)
              </button>
              <button
                onClick={() => setTestType('miniPCR Thermal Cycling')}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  testType.includes('miniPCR')
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                miniPCR Cycling (45 Min)
              </button>
            </div>

            {/* Target Genes */}
            <div className="space-y-2">
              <label className="block text-[11px] font-medium text-slate-400">Target Genomic Loci:</label>
              {MOLECULAR_TARGETS.map((target) => {
                const isSelected = selectedGenes.some(g => g.includes(target.id));
                return (
                  <button
                    key={target.id}
                    onClick={() => toggleGene(target.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 border-teal-500/40 text-white'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={isSelected ? 'text-teal-300' : ''}>{target.name}</span>
                      <span className="text-[10px] font-mono">{isSelected ? 'ACTIVE' : 'OFF'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{target.description}</div>
                  </button>
                );
              })}
            </div>

            {/* Run Action */}
            <button
              id="start-molecular-run-btn"
              onClick={startMolecularRun}
              disabled={isRunning}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Amplifying DNA in Heated Block ({progressMin}m)...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Execute Molecular Amplification</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Right Col: Real-time Amplification Curve & Resistance Marker Analysis */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Amplification Chart Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Activity className="h-4 w-4 text-indigo-400" />
                <span>Real-Time Fluorometric Amplification Kinetic Curve</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Channel: FAM/SYBR (520nm)</span>
            </div>

            {/* Kinetic Graph Visualizer */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 h-64 relative flex flex-col justify-between overflow-hidden">
              
              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 pointer-events-none opacity-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="border border-slate-600" />
                ))}
              </div>

              {/* Threshold Line */}
              <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-rose-500/40 pointer-events-none">
                <span className="text-[8px] font-mono text-rose-400 bg-slate-950 px-1 ml-2">Ct Threshold Line (ΔRn = 200)</span>
              </div>

              {/* SVG Curve */}
              <svg className="w-full h-full overflow-visible">
                {fluorescenceData.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={fluorescenceData
                      .map((val, idx) => {
                        const x = (idx / Math.max(1, fluorescenceData.length - 1)) * 480;
                        const y = 200 - (val / 1000) * 180;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                )}
              </svg>

              {/* Status footer inside graph */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500 z-10 pt-2 border-t border-slate-800/80">
                <span>0 min (Annealing)</span>
                <span>15 min (Log Phase)</span>
                <span>{testType.includes('LAMP') ? '25 min (Plateau)' : '45 min'}</span>
              </div>
            </div>

            {/* Kinetics Stats Readout */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Amplification Time (Tt)</span>
                <span className="font-mono font-bold text-teal-400 text-sm">
                  {completed ? (testType.includes('LAMP') ? '14.2 min' : '22.8 min') : '--'}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Genomic Copy Number</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  {completed ? '~4.2 x 10⁵ /µL' : '--'}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">DNA Specificity (18S)</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {completed ? '99.8% Match' : '--'}
                </span>
              </div>
            </div>

          </div>

          {/* Drug Resistance Screening Results (K13) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>Drug-Resistance Genomic Profiling</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">K13 / HRP2 Status</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* K13 Toggle / Readout */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Kelch-13 Propeller:</span>
                  <button
                    onClick={() => {
                      setK13Mutation(!k13Mutation);
                      setK13Details(!k13Mutation ? 'C580Y Mutation Detected (Resistance)' : 'Wild Type (Sensitive)');
                    }}
                    className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                      k13Mutation ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {k13Mutation ? 'MUTANT (C580Y)' : 'WILD TYPE'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {k13Mutation ? (
                    <span className="text-rose-300 font-semibold">
                      ⚠️ Artemisinin resistance marker detected. Alert national surveillance node for potential ACT regimen escalation.
                    </span>
                  ) : (
                    <span>Sensitive to standard ACT (Coartem / ASAQ). No artemisinin delayed clearance propeller mutations found.</span>
                  )}
                </p>
              </div>

              {/* pfhrp2 Deletion Status */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">pfhrp2 / pfhrp3 Genes:</span>
                  <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    INTACT (+/+)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Antigen genes are intact. No diagnostic escape gene deletions identified.
                </p>
              </div>

            </div>

            {/* Save to Patient Dossier */}
            {completed && (
              <div className="pt-2 flex justify-end">
                <button
                  id="save-molecular-to-case-btn"
                  onClick={handleSaveResult}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  Attach Molecular Confirmation to Patient Case
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
