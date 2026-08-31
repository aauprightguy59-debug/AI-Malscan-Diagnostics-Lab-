/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertOctagon, CheckCircle2, Activity, Zap, Info, X, HeartPulse } from 'lucide-react';
import { G6PDResult } from '../types';

interface G6PDSafetyGateProps {
  currentG6PD?: G6PDResult;
  species: string;
  patientGender: 'Male' | 'Female' | 'Other';
  onSaveG6PD: (result: G6PDResult) => void;
  onClose?: () => void;
}

export const G6PD_PRESETS = [
  {
    label: 'Normal Activity (>70%) - Normal Male/Female',
    activity: 10.2, // U/g Hb
    percent: 95,
    status: 'Normal (>70%)' as const,
    safe: true,
    warning: 'Normal G6PD enzymatic levels. Standard 14-day Primaquine radical cure (0.25-0.5 mg/kg daily) is safe to administer.'
  },
  {
    label: 'Intermediate Deficiency (30-70%) - Heterozygous Female',
    activity: 5.4, // U/g Hb
    percent: 50,
    status: 'Intermediate (30-70%)' as const,
    safe: false,
    warning: 'Intermediate G6PD activity. Patient is at moderate risk of acute hemolysis. Daily Primaquine contraindicated; evaluate Weekly Primaquine (0.75 mg/kg) under clinical supervision.'
  },
  {
    label: 'Severe G6PD Deficiency (<30%) - High Risk Hemolysis',
    activity: 1.8, // U/g Hb
    percent: 18,
    status: 'Deficient (<30%)' as const,
    safe: false,
    warning: 'CRITICAL CONTRAINDICATION: Severe G6PD deficiency detected. Standard daily Primaquine will cause life-threatening intravascular hemolysis, hemoglobinuria (blackwater fever), and acute renal failure. Withhold daily Primaquine; consult hematology specialist.'
  }
];

export default function G6PDSafetyGate({
  currentG6PD,
  species,
  patientGender,
  onSaveG6PD,
  onClose
}: G6PDSafetyGateProps) {
  const isVivaxOrOvale = species.includes('vivax') || species.includes('ovale');
  
  const [selectedActivity, setSelectedActivity] = useState<number>(currentG6PD?.enzymaticActivity || 10.2);
  const [deviceModel, setDeviceModel] = useState<'SD Biosensor STANDARD G6PD' | 'CareStart G6PD Biosensor' | 'Qualitative FST'>('SD Biosensor STANDARD G6PD');
  const [isReading, setIsReading] = useState(false);

  // Reference Normal median in Sub-Saharan Africa is ~10.8 U/g Hb
  const calculatePercent = (activity: number) => {
    const normalRef = 10.8;
    return Math.min(100, Math.round((activity / normalRef) * 100));
  };

  const currentPercent = calculatePercent(selectedActivity);
  
  const determineStatus = (percent: number): G6PDResult['status'] => {
    if (percent > 70) return 'Normal (>70%)';
    if (percent >= 30) return 'Intermediate (30-70%)';
    return 'Deficient (<30%)';
  };

  const currentStatus = determineStatus(currentPercent);
  const isPrimaquineSafe = currentStatus === 'Normal (>70%)';

  const getClinicalAlert = () => {
    if (currentStatus === 'Normal (>70%)') {
      return 'Enzymatic activity is within normal safety thresholds. Full 14-day anti-hypnozoite Primaquine regimen cleared for relapse prevention.';
    }
    if (currentStatus === 'Intermediate (30-70%)') {
      return 'Intermediate deficiency. Increased hemolytic vulnerability. Standard daily Primaquine contraindicated. Switch to weekly regimen (0.75 mg/kg once weekly for 8 weeks).';
    }
    return 'DANGER: SEVERE G6PD DEFICIENCY (<30%). DO NOT ADMINISTER DAILY PRIMAQUINE OR TAFENOQUINE. Fatal drug-induced acute hemolytic crisis risk.';
  };

  const handleApplyPreset = (preset: typeof G6PD_PRESETS[0]) => {
    setSelectedActivity(preset.activity);
  };

  const handleSave = () => {
    const result: G6PDResult = {
      performed: true,
      enzymaticActivity: selectedActivity,
      percentNormal: currentPercent,
      status: currentStatus,
      primaquineSafe: isPrimaquineSafe,
      deviceModel,
      clinicalWarning: getClinicalAlert(),
      timestamp: new Date().toISOString()
    };
    onSaveG6PD(result);
    if (onClose) onClose();
  };

  return (
    <div id="g6pd-safety-gate-modal" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100 max-w-3xl w-full mx-auto">
      {/* Header */}
      <div className={`px-6 py-4 border-b border-slate-800 flex items-center justify-between ${
        isVivaxOrOvale ? 'bg-amber-950/40' : 'bg-slate-950'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
            isVivaxOrOvale ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
          }`}>
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white uppercase tracking-tight">SD Biosensor G6PD Safety Gatekeeper</h3>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/40 font-bold uppercase">
                Module 4 (Safety Interlock)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Mandatory enzymatic screening before Primaquine / 8-aminoquinoline radical cure</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        
        {/* Warning Banner for Vivax / Ovale */}
        {isVivaxOrOvale && (
          <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-xl p-4 flex items-start space-x-3">
            <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed">
              <span className="font-bold uppercase tracking-wide text-rose-300 block mb-0.5">
                Clinical Safety Protocol Triggered ({species}):
              </span>
              Plasmodium vivax / ovale requires Primaquine to eliminate dormant liver hypnozoites and prevent relapse. 
              <strong> You cannot authorize the final prescription until quantitative G6PD enzymatic levels are confirmed.</strong>
            </div>
          </div>
        )}

        {/* Biosensor Hardware Simulator */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left: Device Display Mockup */}
          <div className="md:col-span-6 bg-slate-950 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between shadow-inner">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pb-2 border-b border-slate-800/80">
              <span className="text-teal-400 font-bold">SD BIOSENSOR STANDARD</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded">CODE CHIP: G6-2026</span>
            </div>

            {/* LCD Biosensor Screen */}
            <div className="my-4 bg-emerald-950/40 border-2 border-emerald-500/40 rounded-xl p-5 text-center shadow-inner relative overflow-hidden">
              <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 mb-1">
                Quantitative G6PD Activity
              </div>
              <div className="text-4xl font-mono font-black text-emerald-300 tracking-tight">
                {selectedActivity.toFixed(1)} <span className="text-lg font-normal text-emerald-400/80">U/g Hb</span>
              </div>
              <div className="mt-2 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                <span>{currentPercent}% Normal Activity</span>
              </div>

              {/* Status Band */}
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider">
                <span className={`px-2 py-0.5 rounded ${
                  currentStatus === 'Normal (>70%)' ? 'bg-emerald-500/20 text-emerald-300' :
                  currentStatus === 'Intermediate (30-70%)' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-rose-500/20 text-rose-300'
                }`}>
                  Status: {currentStatus}
                </span>
              </div>
            </div>

            {/* Microcuvette Input Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Adjust Test Reading (U/g Hb):</span>
                <span className="font-mono text-white font-bold">{selectedActivity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="16.0"
                step="0.1"
                value={selectedActivity}
                onChange={e => setSelectedActivity(parseFloat(e.target.value))}
                className="w-full accent-teal-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0.5 (Severe)</span>
                <span>4.0 (30% cutoff)</span>
                <span>8.0 (70% cutoff)</span>
                <span>16.0 (High)</span>
              </div>
            </div>

          </div>

          {/* Right: Presets & Clinical Interpretation */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-400">Quick Diagnostic Presets:</label>
              <div className="space-y-2">
                {G6PD_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(preset)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      Math.abs(selectedActivity - preset.activity) < 0.5
                        ? 'bg-teal-500/15 border-teal-500/50 text-white shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{preset.label.split('-')[0]}</span>
                      <span className="font-mono text-[11px] text-teal-400">{preset.activity} U/g Hb</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{preset.label.split('-')[1]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Decision Support Box */}
            <div className={`p-4 rounded-xl border ${
              isPrimaquineSafe 
                ? 'bg-emerald-950/30 border-emerald-500/30' 
                : 'bg-rose-950/40 border-rose-500/40'
            }`}>
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
                {isPrimaquineSafe ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertOctagon className="h-4 w-4 text-rose-400" />
                )}
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {isPrimaquineSafe ? 'Primaquine Clearance: SAFE' : 'Primaquine Safety Lock: BLOCKED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {getClinicalAlert()}
              </p>
            </div>

          </div>

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          )}
          
          <button
            id="save-g6pd-record-btn"
            onClick={handleSave}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-teal-500/20"
          >
            Confirm G6PD Screening Result
          </button>
        </div>

      </div>
    </div>
  );
}
