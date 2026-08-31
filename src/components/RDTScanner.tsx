/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, Sliders, Layers, Sparkles, X, Info, ShieldCheck, Zap } from 'lucide-react';
import { RDTResult } from '../types';

interface RDTScannerProps {
  initialResult?: RDTResult;
  microscopySpecies?: string;
  microscopyDetected?: boolean;
  onSaveRDT: (result: RDTResult) => void;
  onClose?: () => void;
}

export const SAMPLE_RDT_CASSETTES = [
  {
    id: 'rdt_pf_positive',
    name: 'Pf Positive (Strong HRP2+ Line)',
    description: 'High-affinity Pf HRP2 line with distinct control line. Indicates active or recent P. falciparum infection.',
    controlLine: true,
    hrp2Line: true,
    pldhLine: false,
    opticalDensity: 0.94,
    faintLine: false,
    interpretation: 'Pf Positive (HRP2+)' as const,
    cLineIntensity: 96,
    pfLineIntensity: 88,
    pvLineIntensity: 4
  },
  {
    id: 'rdt_dual_positive',
    name: 'Dual Pf + Pv Positive (HRP2+ / pLDH+)',
    description: 'Triple line band indicating mixed infection or co-circulation of P. falciparum and P. vivax/ovale.',
    controlLine: true,
    hrp2Line: true,
    pldhLine: true,
    opticalDensity: 0.91,
    faintLine: false,
    interpretation: 'Dual Pf+Pv Positive' as const,
    cLineIntensity: 92,
    pfLineIntensity: 84,
    pvLineIntensity: 78
  },
  {
    id: 'rdt_faint_pf',
    name: 'Pf Faint Line (Low Density HRP2+)',
    description: 'Low-parasitemia smear (<100 parasites/µL) creating a faint band easily missed by human eyes in remote clinics.',
    controlLine: true,
    hrp2Line: true,
    pldhLine: false,
    opticalDensity: 0.38,
    faintLine: true,
    interpretation: 'Pf Positive (HRP2+)' as const,
    cLineIntensity: 94,
    pfLineIntensity: 36,
    pvLineIntensity: 3
  },
  {
    id: 'rdt_pv_positive',
    name: 'Pv / Pan Positive (pLDH+ Only)',
    description: 'Control line and pLDH band present, HRP2 absent. Characteristic of non-falciparum (P. vivax, P. malariae, P. ovale).',
    controlLine: true,
    hrp2Line: false,
    pldhLine: true,
    opticalDensity: 0.82,
    faintLine: false,
    interpretation: 'Pv/Pan Positive (pLDH+)' as const,
    cLineIntensity: 95,
    pfLineIntensity: 5,
    pvLineIntensity: 79
  },
  {
    id: 'rdt_negative',
    name: 'Negative Control (Control Line Only)',
    description: 'Valid test showing single vibrant control band. No parasite antigen detected.',
    controlLine: true,
    hrp2Line: false,
    pldhLine: false,
    opticalDensity: 0.04,
    faintLine: false,
    interpretation: 'Negative' as const,
    cLineIntensity: 98,
    pfLineIntensity: 2,
    pvLineIntensity: 3
  }
];

export default function RDTScanner({
  initialResult,
  microscopySpecies,
  microscopyDetected,
  onSaveRDT,
  onClose
}: RDTScannerProps) {
  const [selectedSampleId, setSelectedSampleId] = useState(initialResult?.hrp2Line ? 'rdt_pf_positive' : 'rdt_negative');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [analyzed, setAnalyzed] = useState(!!initialResult);
  const [cassetteType, setCassetteType] = useState<'Pf (HRP2) / Pv (pLDH) Dual' | 'Pf (HRP2) Single' | 'Pan-Malaria (pLDH)'>('Pf (HRP2) / Pv (pLDH) Dual');
  
  // Optical readings
  const selectedSample = SAMPLE_RDT_CASSETTES.find(c => c.id === selectedSampleId) || SAMPLE_RDT_CASSETTES[0];
  const [exposureGain, setExposureGain] = useState(1.0);
  const [contrastEnhance, setContrastEnhance] = useState(true);

  const startRdtScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setAnalyzed(false);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setAnalyzed(true);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  // Determine Concordance against Microscopy
  const computeConcordance = (): RDTResult['concordanceStatus'] => {
    const rdtPositive = selectedSample.hrp2Line || selectedSample.pldhLine;
    const microPositive = !!microscopyDetected;

    if (rdtPositive && microPositive) return 'Concordant';
    if (!rdtPositive && !microPositive) return 'Concordant';
    if (rdtPositive && !microPositive) return 'Sub-microscopic Infection';
    if (!rdtPositive && microPositive) return 'Suspected HRP2 Deletion';
    return 'Not Evaluated';
  };

  const handleSave = () => {
    const result: RDTResult = {
      performed: true,
      cassetteType,
      controlLine: selectedSample.controlLine,
      hrp2Line: selectedSample.hrp2Line,
      pldhLine: selectedSample.pldhLine,
      opticalDensityScore: selectedSample.opticalDensity,
      faintLineDetected: selectedSample.faintLine,
      interpretation: selectedSample.interpretation,
      concordanceStatus: computeConcordance(),
      timestamp: new Date().toISOString()
    };
    onSaveRDT(result);
    if (onClose) onClose();
  };

  return (
    <div id="rdt-scanner-modal" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white uppercase tracking-tight">AI RDT Dual-Band Visual Analyzer</h3>
              <span className="text-[9px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/40 font-bold uppercase">
                Module 1 (V3.0)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Objective computer-vision scanning of rapid antigen cassette test strips</p>
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

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D-Printed Cassette Holder Simulation */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Cassette Optical Stage (Phone / LED Adapter)</span>
            <span className="font-mono text-teal-400 text-[11px]">LED Lumens: 450lm (Calibrated)</span>
          </div>

          {/* Virtual Cassette Optical Reader Window */}
          <div className="relative bg-slate-950 rounded-2xl p-6 border-2 border-slate-800 flex flex-col items-center justify-center min-h-[300px] overflow-hidden shadow-inner">
            
            {/* Alignment Reticle HUD */}
            <div className="absolute inset-4 border border-teal-500/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between text-[9px] font-mono text-teal-400/60">
                <span>[ALIGN_TL]</span>
                <span>[OPTICAL_ZONE]</span>
                <span>[ALIGN_TR]</span>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-teal-400/60">
                <span>GAIN: {exposureGain.toFixed(1)}x</span>
                <span>SPECTRAL: 525nm</span>
              </div>
            </div>

            {/* Scan Beam Effect */}
            {isScanning && (
              <div 
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 shadow-[0_0_15px_#14b8a6] z-20 transition-all duration-300 pointer-events-none"
                style={{ top: `${scanProgress}%` }}
              />
            )}

            {/* Realistic RDT Cassette Model */}
            <div className="relative w-44 bg-slate-100 rounded-2xl p-3 shadow-2xl border-4 border-slate-300 text-slate-900 font-sans select-none my-2">
              {/* Cassette Header */}
              <div className="flex justify-between items-center border-b border-slate-300 pb-1 mb-2">
                <span className="text-[9px] font-black tracking-tighter text-slate-800">MALARIA Pf/Pv Ag</span>
                <span className="text-[8px] font-mono bg-slate-200 px-1 rounded text-slate-700">LOT: 2026-F</span>
              </div>

              {/* Nitrocellulose Reaction Strip Window */}
              <div className="relative bg-amber-50/90 border-2 border-slate-400 rounded-lg h-36 w-full flex flex-row justify-around items-center px-3 py-2 shadow-inner overflow-hidden">
                
                {/* Band Indicator Labels on Left */}
                <div className="flex flex-col justify-between h-full text-[10px] font-black font-mono text-slate-600">
                  <div className="flex items-center space-x-1">
                    <span className="w-3 text-center">C</span>
                    <span className="text-[7px] text-slate-500 font-normal">Ctrl</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 text-center text-rose-700">Pf</span>
                    <span className="text-[7px] text-slate-500 font-normal">HRP2</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 text-center text-blue-700">Pv</span>
                    <span className="text-[7px] text-slate-500 font-normal">pLDH</span>
                  </div>
                </div>

                {/* The Chromatographic Test Strip Bands */}
                <div className="relative h-full w-14 bg-amber-50/50 border-x border-slate-300 flex flex-col justify-between py-2 px-1">
                  
                  {/* Control Line (C) */}
                  <div className="w-full flex items-center justify-center">
                    <div 
                      className="w-full h-1.5 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: selectedSample.controlLine ? '#991b1b' : 'transparent',
                        opacity: selectedSample.controlLine ? (selectedSample.cLineIntensity / 100) : 0
                      }}
                    />
                  </div>

                  {/* Pf HRP2 Line */}
                  <div className="w-full flex items-center justify-center">
                    <div 
                      className="w-full h-1.5 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: selectedSample.hrp2Line ? '#b91c1c' : 'transparent',
                        opacity: selectedSample.hrp2Line ? (selectedSample.pfLineIntensity / 100) : 0,
                        boxShadow: selectedSample.faintLine ? '0 0 2px rgba(185, 28, 28, 0.4)' : 'none'
                      }}
                    />
                  </div>

                  {/* Pv/Pan pLDH Line */}
                  <div className="w-full flex items-center justify-center">
                    <div 
                      className="w-full h-1.5 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: selectedSample.pldhLine ? '#1d4ed8' : 'transparent',
                        opacity: selectedSample.pldhLine ? (selectedSample.pvLineIntensity / 100) : 0
                      }}
                    />
                  </div>

                </div>

                {/* Optical Pixel Density Intensity Meter */}
                <div className="flex flex-col justify-between h-full text-[8px] font-mono text-slate-500 text-right">
                  <span>{selectedSample.controlLine ? `${selectedSample.cLineIntensity}%` : '0%'}</span>
                  <span className={selectedSample.hrp2Line ? 'text-rose-600 font-bold' : ''}>
                    {selectedSample.hrp2Line ? `${selectedSample.pfLineIntensity}%` : '0%'}
                  </span>
                  <span className={selectedSample.pldhLine ? 'text-blue-600 font-bold' : ''}>
                    {selectedSample.pldhLine ? `${selectedSample.pvLineIntensity}%` : '0%'}
                  </span>
                </div>
              </div>

              {/* Sample Blood Well (S) & Buffer Well (B) */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                <div className="flex items-center space-x-1.5">
                  <div className="h-4 w-4 rounded-full bg-rose-900/80 border border-slate-400 shadow-inner flex items-center justify-center text-[7px] text-white font-bold">
                    S
                  </div>
                  <span className="text-[8px] text-slate-500">Blood 5µL</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="h-4 w-4 rounded-full bg-slate-300 border border-slate-400 shadow-inner flex items-center justify-center text-[7px] text-slate-700 font-bold">
                    B
                  </div>
                  <span className="text-[8px] text-slate-500">Buffer 3 drops</span>
                </div>
              </div>

            </div>

            {/* Scanning Indicator */}
            {isScanning && (
              <div className="mt-2 text-xs font-mono text-teal-400 animate-pulse flex items-center space-x-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Digitizing chromatographic profile ({scanProgress}%)...</span>
              </div>
            )}
          </div>

          {/* Cassette Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Select Test Sample Cassette (or Camera Stream):</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_RDT_CASSETTES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setSelectedSampleId(sample.id);
                    setAnalyzed(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedSampleId === sample.id
                      ? 'bg-teal-500/15 border-teal-500/50 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{sample.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{sample.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Optical Line Analysis & Concordance Engine */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          
          <div className="space-y-4">
            {/* Calibration & Optics Controls */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/70">
                <div className="flex items-center space-x-2">
                  <Sliders className="h-3.5 w-3.5 text-teal-400" />
                  <span>Optical Line Density Calibration</span>
                </div>
                <button
                  onClick={() => setContrastEnhance(!contrastEnhance)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    contrastEnhance ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {contrastEnhance ? 'High Dynamic Filter: ON' : 'Filter: OFF'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">RDT Format:</span>
                  <select
                    value={cassetteType}
                    onChange={(e) => setCassetteType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 mt-1"
                  >
                    <option value="Pf (HRP2) / Pv (pLDH) Dual">Pf (HRP2) / Pv (pLDH) Dual</option>
                    <option value="Pf (HRP2) Single">Pf (HRP2) Single</option>
                    <option value="Pan-Malaria (pLDH)">Pan-Malaria (pLDH)</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Sensor Exposure:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={exposureGain}
                    onChange={e => setExposureGain(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Analysis Action Button */}
            {!analyzed && (
              <button
                id="execute-rdt-scan-btn"
                onClick={startRdtScan}
                disabled={isScanning}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isScanning ? 'Processing Chromatographic Bands...' : 'Analyze RDT Cassette with AI'}</span>
              </button>
            )}

            {/* Result Report Summary Card */}
            {analyzed && (
              <div className="bg-slate-950 p-4 rounded-xl border border-teal-500/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">AI Optical Scan Result</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    selectedSample.interpretation.includes('Positive') 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {selectedSample.interpretation}
                  </span>
                </div>

                {/* Biomarker line readouts */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Control Band (C)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {selectedSample.controlLine ? 'VALID (Pass)' : 'INVALID'}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">HRP2 Antigen (Pf)</span>
                    <span className={`font-mono font-bold ${selectedSample.hrp2Line ? 'text-rose-400' : 'text-slate-400'}`}>
                      {selectedSample.hrp2Line ? (selectedSample.faintLine ? 'FAINT (+)' : 'STRONG (+)') : 'NEGATIVE (-)'}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">pLDH Antigen (Pv)</span>
                    <span className={`font-mono font-bold ${selectedSample.pldhLine ? 'text-blue-400' : 'text-slate-400'}`}>
                      {selectedSample.pldhLine ? 'DETECTED (+)' : 'NEGATIVE (-)'}
                    </span>
                  </div>
                </div>

                {/* Concordance with Microscopy check */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Hybrid Concordance Assessment:</span>
                    <span className={`font-mono font-bold text-[10px] px-1.5 py-0.2 rounded uppercase ${
                      computeConcordance() === 'Concordant' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                    }`}>
                      {computeConcordance()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {computeConcordance() === 'Concordant' && (
                      <span>Microscopy slide findings and RDT chromatographic band lines are in 100% diagnostic agreement.</span>
                    )}
                    {computeConcordance() === 'Sub-microscopic Infection' && (
                      <span className="text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-amber-400" />
                        <strong>Sub-microscopic alert: </strong> Microscopy smear was reported negative, but RDT detected circulating HRP2 antigens (low parasitemia &lt;50 parasites/µL or persistent antigenemia).
                      </span>
                    )}
                    {computeConcordance() === 'Suspected HRP2 Deletion' && (
                      <span className="text-rose-300">
                        <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-rose-400" />
                        <strong>Gene Deletion Alert: </strong> Microscopy demonstrated visible intra-erythrocytic parasites, but RDT failed to detect HRP2. Suspect <em>pfhrp2/pfhrp3</em> gene deletion or prozone effect. Molecular LAMP confirmation recommended.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer save buttons */}
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
              id="confirm-rdt-record-btn"
              onClick={handleSave}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-teal-500/20"
            >
              Save RDT Result to Case
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
