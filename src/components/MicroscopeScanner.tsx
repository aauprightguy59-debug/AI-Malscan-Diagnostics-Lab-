/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sliders, CheckCircle2, User, HelpCircle, RefreshCw, HeartPulse, Zap, ShieldCheck, Dna, AlertTriangle, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { SAMPLE_SLIDES, Patient, RDTResult, HemoglobinResult, G6PDResult, LabFacility } from '../types';
import RDTScanner from './RDTScanner';
import G6PDSafetyGate from './G6PDSafetyGate';

interface MicroscopeScannerProps {
  onScanComplete: (result: {
    imageKey: string;
    imageData: string | null;
    patient: Patient;
    rdtResult?: RDTResult;
    hbResult?: HemoglobinResult;
    g6pdResult?: G6PDResult;
  }) => void;
  isLoading: boolean;
  activeFacility?: LabFacility;
}

export default function MicroscopeScanner({ onScanComplete, isLoading, activeFacility }: MicroscopeScannerProps) {
  // Patient details
  const [patientName, setPatientName] = useState('Grace Terhemba');
  const [patientAge, setPatientAge] = useState('24');
  const [patientWeight, setPatientWeight] = useState('52');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [ninOrHospitalNo, setNinOrHospitalNo] = useState('GBK-2026-9812');
  const [clinicId, setClinicId] = useState(activeFacility?.name || 'Gboko Central Reference Lab');

  // Slide state
  const [selectedSlideKey, setSelectedSlideKey] = useState('falciparum');
  const [focusValue, setFocusValue] = useState(78); // Best focus around 75-80
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Scanning sequence state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: idle, 1: scanning field 1, 2: field 2, 3: field 3, 4: complete
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // V3.0 Hybrid Modules State
  // 1. Hemoglobin Analyzer
  const [hbValue, setHbValue] = useState<string>('6.8'); // Starts with severe anemia sample to demonstrate AI severity alerts
  const [hbDevicePaired, setHbDevicePaired] = useState(true);

  // 2. RDT Scanner Modal
  const [showRDTModal, setShowRDTModal] = useState(false);
  const [rdtResult, setRdtResult] = useState<RDTResult | undefined>(SAMPLE_SLIDES[0].defaultRDT);

  // 3. G6PD Safety Modal
  const [showG6PDModal, setShowG6PDModal] = useState(false);
  const [g6pdResult, setG6pdResult] = useState<G6PDResult | undefined>(SAMPLE_SLIDES[0].defaultG6PD);

  // Focus mechanics
  const isFocused = focusValue >= 70 && focusValue <= 85;
  const blurStrength = Math.max(0, Math.abs(focusValue - 77) / 2.5);

  const selectedSlide = SAMPLE_SLIDES.find(s => s.key === selectedSlideKey);
  const currentImage = selectedSlideKey === 'uploaded' ? uploadedImage : (selectedSlide ? selectedSlide.imagePath : null);

  // Form check
  const isFormValid = patientName.trim() !== '' && patientAge !== '' && patientWeight !== '';

  // Calculate Hemoglobin Result
  const getHemoglobinResult = (): HemoglobinResult => {
    const numHb = parseFloat(hbValue) || 12.0;
    const pcv = Math.round(numHb * 3.1);
    
    let severity: HemoglobinResult['anemiaSeverity'] = 'Normal';
    let transfusion = false;

    if (numHb < 5.0) {
      severity = 'Critical (<5.0 g/dL)';
      transfusion = true;
    } else if (numHb < 7.0) {
      severity = 'Severe Anemia (<7.0 g/dL)';
      transfusion = true;
    } else if (numHb < 10.0) {
      severity = 'Moderate Anemia';
    } else if (numHb < 11.5) {
      severity = 'Mild Anemia';
    }

    return {
      performed: true,
      hbValue: numHb,
      pcvValue: pcv,
      deviceModel: 'HemoCue Hb 301 (Bluetooth)',
      anemiaSeverity: severity,
      bloodTransfusionIndicated: transfusion,
      timestamp: new Date().toISOString()
    };
  };

  const currentHbResult = getHemoglobinResult();

  const handleSlideChange = (key: string) => {
    setSelectedSlideKey(key);
    const sample = SAMPLE_SLIDES.find(s => s.key === key);
    if (sample) {
      setHbValue(sample.defaultHb.toString());
      setRdtResult(sample.defaultRDT);
      setG6pdResult(sample.defaultG6PD);
    }
    setFocusValue(Math.floor(Math.random() * 15) + 72);
    setIsScanning(false);
    setScanStep(0);
    setScanLogs([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          setSelectedSlideKey('uploaded');
          setFocusValue(Math.floor(Math.random() * 15) + 72);
          setIsScanning(false);
          setScanStep(0);
          setScanLogs([]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Automated multi-field scan simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning) {
      if (scanStep === 1) {
        setScanLogs(prev => [...prev, '🔬 Field 1 (100x Oil): Aligning stage reticle and optical focus...']);
        timer = setTimeout(() => {
          setScanStep(2);
          setScanLogs(prev => [...prev, '✓ Field 1 Captured. Counting trophozoite rings...', '🔬 Field 2: Shifting objective to secondary diagnostic field...']);
        }, 1100);
      } else if (scanStep === 2) {
        timer = setTimeout(() => {
          setScanStep(3);
          setScanLogs(prev => [...prev, '✓ Field 2 Captured. Assessing erythrocyte morphology & stippling...', '🔬 Field 3: Fine scanning terminal smear quadrant...']);
        }, 1100);
      } else if (scanStep === 3) {
        timer = setTimeout(() => {
          setScanStep(4);
          setScanLogs(prev => [...prev, '✓ Field 3 Captured. Synthesizing 4-in-1 Hybrid diagnostic matrix...', '⚡ Cross-referencing Microscopy with RDT & Hb Anemia thresholds...']);
        }, 1100);
      } else if (scanStep === 4) {
        timer = setTimeout(() => {
          setIsScanning(false);
          onScanComplete({
            imageKey: selectedSlideKey,
            imageData: selectedSlideKey === 'uploaded' ? uploadedImage : null,
            patient: {
              name: patientName,
              age: parseInt(patientAge),
              weight: parseFloat(patientWeight),
              gender: patientGender,
              clinicId: activeFacility?.name || clinicId,
              ninOrHospitalNo
            },
            rdtResult,
            hbResult: currentHbResult,
            g6pdResult
          });
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [isScanning, scanStep]);

  const startScan = () => {
    if (!isFormValid || !isFocused || isLoading) return;
    setIsScanning(true);
    setScanStep(1);
    setScanLogs(['⚙️ Initializing AI-MalScan V3.0 Hybrid 4-in-1 Diagnostic Stage...']);
  };

  return (
    <div id="microscope-scanner-container" className="space-y-6 animate-fade-in">
      
      {/* V3.0 Hybrid Lab Quick Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">AI-MalScan V3.0 4-in-1 Hybrid Stage</span>
              <span className="text-[9px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/40 font-bold">
                CLINICAL LAB REPLACEMENT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Integrated: 🔬 Thin Smear Microscopy + ⚡ RDT Dual Reader + 🩸 Hemoglobin/PCV + 🛡️ G6PD Safety Gate
            </p>
          </div>
        </div>

        {/* Operating Node Badge */}
        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-500">OPERATING NODE:</span>
          <span className="text-teal-300 font-bold">{activeFacility?.code || 'GBK-REF-01'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl">
        
        {/* Column 1: Patient Intake + Hb/PCV & Module Quick Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          
          {/* Patient Intake Form */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-bold tracking-tight text-white uppercase">1. Patient Intake & Vitals</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">FMoH Form MAL-01</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Patient Full Name</label>
                <input
                  id="patient-name-input"
                  type="text"
                  placeholder="e.g. Grace Terhemba"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  disabled={isScanning || isLoading}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Age (Years)</label>
                <input
                  id="patient-age-input"
                  type="number"
                  placeholder="Age"
                  min="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                  value={patientAge}
                  onChange={e => setPatientAge(e.target.value)}
                  disabled={isScanning || isLoading}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Weight (kg)</label>
                <input
                  id="patient-weight-input"
                  type="number"
                  placeholder="Weight"
                  min="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                  value={patientWeight}
                  onChange={e => setPatientWeight(e.target.value)}
                  disabled={isScanning || isLoading}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Gender</label>
                <select
                  id="patient-gender-select"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                  value={patientGender}
                  onChange={e => setPatientGender(e.target.value as any)}
                  disabled={isScanning || isLoading}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Hospital / NIN #</label>
                <input
                  type="text"
                  placeholder="e.g. GBK-2026-98"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                  value={ninOrHospitalNo}
                  onChange={e => setNinOrHospitalNo(e.target.value)}
                  disabled={isScanning || isLoading}
                />
              </div>
            </div>
          </div>

          {/* Module 3: Hemoglobin / PCV Anemia Reader */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <HeartPulse className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">3. Hemoglobin / PCV Analyzer</span>
              </div>
              <span className="text-[9px] font-mono text-teal-400 bg-slate-900 px-1.5 py-0.5 rounded border border-teal-500/30">
                HemoCue BLE PAIRED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Hb Value (g/dL):</label>
                <div className="relative">
                  <input
                    id="patient-hb-input"
                    type="number"
                    step="0.1"
                    min="2"
                    max="22"
                    value={hbValue}
                    onChange={e => setHbValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-white font-mono"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-500">g/dL</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Est. PCV (Hematocrit):</label>
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-teal-300 font-mono">
                  {currentHbResult.pcvValue}%
                </div>
              </div>
            </div>

            {/* Severity Flag */}
            <div className={`p-2 rounded-lg text-xs flex items-center justify-between ${
              currentHbResult.bloodTransfusionIndicated 
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300' 
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            }`}>
              <span className="font-bold">Severity: {currentHbResult.anemiaSeverity}</span>
              {currentHbResult.bloodTransfusionIndicated && (
                <span className="text-[10px] font-mono font-black uppercase text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/40">
                  FLAG: TRANSFUSE
                </span>
              )}
            </div>
          </div>

          {/* Module 2 & 4: Quick Launchers (RDT & G6PD) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="launch-rdt-modal-btn"
              onClick={() => setShowRDTModal(true)}
              className="p-3 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs font-bold text-teal-300">
                <div className="flex items-center space-x-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span>2. RDT Cassette</span>
                </div>
                <span className="text-[9px] font-mono">{rdtResult ? 'CONFIGURED' : '+ SCAN'}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {rdtResult?.interpretation || 'Pf/Pv Dual Reader'}
              </div>
            </button>

            <button
              id="launch-g6pd-modal-btn"
              onClick={() => setShowG6PDModal(true)}
              className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>4. G6PD Safety</span>
                </div>
                <span className="text-[9px] font-mono">{g6pdResult?.performed ? 'CHECKED' : '+ CHECK'}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {g6pdResult?.status || 'SD Biosensor Gate'}
              </div>
            </button>
          </div>

          {/* Slide Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-300 uppercase">Microscope Glass Smear Slides</span>
              <button
                id="upload-smear-btn"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center space-x-1 border border-teal-500/30 rounded-lg px-2 py-0.5 hover:bg-teal-500/10 transition-all cursor-pointer"
                disabled={isScanning || isLoading}
              >
                <Upload className="h-3 w-3" />
                <span>Upload Custom</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_SLIDES.map((slide) => (
                <button
                  id={`slide-btn-${slide.key}`}
                  key={slide.key}
                  onClick={() => handleSlideChange(slide.key)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedSlideKey === slide.key
                      ? 'bg-teal-950/40 border-teal-500 text-teal-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  disabled={isScanning || isLoading}
                >
                  <span className="text-xs font-bold truncate">{slide.name}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{slide.description}</span>
                </button>
              ))}
              {uploadedImage && (
                <button
                  id="slide-btn-uploaded"
                  onClick={() => handleSlideChange('uploaded')}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedSlideKey === 'uploaded'
                      ? 'bg-teal-950/40 border-teal-500 text-teal-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                  disabled={isScanning || isLoading}
                >
                  <span className="text-xs font-bold">★ Custom Upload</span>
                  <span className="text-[10px] text-teal-400 font-mono mt-0.5">Ready to scan</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Column 2: Microscope Lens Stage Viewer & Focus Control */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-6 space-y-5">
          
          <div className="relative flex flex-col items-center w-full">
            
            {/* Header overlay for microscope */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-2 px-2">
              <span className="font-mono text-teal-400 font-bold">STAGE: 100x OIL IMMERSION</span>
              <span className="font-mono text-[11px] text-slate-500">RESOLUTION: 0.2µm / PIXEL</span>
            </div>

            {/* Circular Microscope Aperture */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-slate-950 shadow-2xl bg-black flex items-center justify-center my-2">
              {currentImage ? (
                <div 
                  className="w-full h-full relative transition-all duration-300"
                  style={{
                    filter: `blur(${blurStrength}px)`,
                    backgroundImage: `url(${currentImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: isScanning 
                      ? `scale(1.25) translate(${scanStep === 1 ? '-12px, -8px' : scanStep === 2 ? '10px, 14px' : scanStep === 3 ? '-8px, 10px' : '0px, 0px'})`
                      : 'scale(1) translate(0px, 0px)',
                    transition: 'transform 1s ease-in-out, filter 0.15s ease-out'
                  }}
                >
                  {/* Simulated Glass Slide Reticle */}
                  <div className="absolute inset-0 pointer-events-none border border-slate-100/10 rounded-full flex items-center justify-center">
                    <div className="w-1/2 h-[1px] bg-slate-100/15"></div>
                    <div className="h-1/2 w-[1px] bg-slate-100/15 absolute"></div>
                    <div className="w-24 h-24 border border-dashed border-slate-100/10 rounded-full absolute"></div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Camera className="h-12 w-12 text-slate-700 mx-auto mb-2 animate-pulse" />
                  <span className="text-xs text-slate-500">No Slide Loaded</span>
                </div>
              )}

              {/* Scanning Overlay Grid */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none bg-teal-500/5 flex flex-col justify-between p-4 z-20">
                  <div className="w-full h-0.5 bg-teal-400 shadow-md shadow-teal-400/50 animate-bounce"></div>
                  
                  {/* AI Target Box indicators bounding the simulated parasites */}
                  <div className="absolute top-1/4 left-1/3 w-10 h-10 border-2 border-rose-500 rounded bg-rose-500/10 animate-pulse flex items-center justify-center">
                    <span className="text-[7px] text-rose-300 font-mono scale-90">RING_TROPH</span>
                  </div>
                  {scanStep >= 2 && (
                    <div className="absolute bottom-1/3 right-1/4 w-8 h-8 border-2 border-teal-400 rounded bg-teal-400/10 animate-pulse flex items-center justify-center">
                      <span className="text-[7px] text-teal-300 font-mono scale-90">PARASITEMIA</span>
                    </div>
                  )}
                  {scanStep >= 3 && (
                    <div className="absolute top-1/2 right-1/3 w-6 h-6 border-2 border-yellow-400 rounded bg-yellow-400/10 animate-pulse flex items-center justify-center">
                      <span className="text-[7px] text-yellow-300 font-mono scale-90">CONF_0.98</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-x-0 bottom-3 text-center">
                    <span className="bg-black/85 px-3 py-1 rounded-full text-[10px] font-mono text-teal-300 border border-teal-500/30 uppercase tracking-wider shadow-md">
                      Auto-Scanning Field {scanStep}/3
                    </span>
                  </div>
                </div>
              )}

              {/* Loader */}
              {isLoading && !isScanning && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center space-y-3 z-30">
                  <RefreshCw className="h-10 w-10 text-teal-400 animate-spin" />
                  <span className="text-xs text-teal-300 font-mono uppercase tracking-widest animate-pulse">Running AI Model...</span>
                </div>
              )}

              {/* Circular lens bezel overlay */}
              <div className="absolute inset-0 border-[16px] border-slate-900 pointer-events-none rounded-full opacity-95"></div>
              <div className="absolute inset-0 border border-slate-800 pointer-events-none rounded-full"></div>
            </div>

            {/* Focal Status Bar */}
            <div className="w-full mt-2 flex items-center justify-between text-xs px-4">
              <span className="text-slate-400">Microscope Lens Focus:</span>
              {isFocused ? (
                <span id="focus-status-badge" className="text-teal-400 font-medium flex items-center space-x-1 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>SHARP FOCUS (100x Oil)</span>
                </span>
              ) : (
                <span id="focus-status-badge" className="text-yellow-400 font-medium bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20">
                  BLURRED (Adjust focus slider)
                </span>
              )}
            </div>
          </div>

          {/* Focus Slider */}
          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Sliders className="h-3.5 w-3.5 text-teal-400" />
                <span>Fine Focus Knob</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Target: 70 - 85 %</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-mono text-slate-500">Min</span>
              <input
                id="microscope-focus-slider"
                type="range"
                min="0"
                max="100"
                value={focusValue}
                onChange={e => setFocusValue(parseInt(e.target.value))}
                className="flex-1 accent-teal-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                disabled={isScanning || isLoading}
              />
              <span className="text-[10px] font-mono text-slate-400 font-bold">{focusValue}%</span>
            </div>
          </div>

          {/* Logs Output Box */}
          {scanLogs.length > 0 && (
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 h-24 overflow-y-auto font-mono text-[11px] text-teal-300/90 space-y-1 scrollbar-thin">
              {scanLogs.map((log, i) => (
                <div key={i} className="animate-fade-in">{log}</div>
              ))}
            </div>
          )}

          {/* Scan Action Button */}
          <div className="w-full">
            <button
              id="initiate-scan-btn"
              onClick={startScan}
              disabled={!isFormValid || !isFocused || isScanning || isLoading}
              className={`w-full py-3.5 rounded-xl font-bold tracking-wider uppercase text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                !isFormValid 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-900'
                  : !isFocused
                  ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/20'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>
                {!isFormValid 
                  ? 'Fill Patient Intake First' 
                  : !isFocused 
                  ? 'Set Focus Knob to Sharp' 
                  : 'Run 4-in-1 AI Diagnostic Scan'}
              </span>
            </button>
          </div>

        </div>

      </div>

      {/* RDT Modal */}
      {showRDTModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <RDTScanner
            initialResult={rdtResult}
            microscopySpecies={selectedSlide?.expectedResult.species}
            microscopyDetected={selectedSlide?.expectedResult.parasiteDetected}
            onSaveRDT={(res) => {
              setRdtResult(res);
              setShowRDTModal(false);
            }}
            onClose={() => setShowRDTModal(false)}
          />
        </div>
      )}

      {/* G6PD Safety Modal */}
      {showG6PDModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <G6PDSafetyGate
            currentG6PD={g6pdResult}
            species={selectedSlide?.expectedResult.species || 'Plasmodium falciparum'}
            patientGender={patientGender}
            onSaveG6PD={(res) => {
              setG6pdResult(res);
              setShowG6PDModal(false);
            }}
            onClose={() => setShowG6PDModal(false)}
          />
        </div>
      )}

    </div>
  );
}
