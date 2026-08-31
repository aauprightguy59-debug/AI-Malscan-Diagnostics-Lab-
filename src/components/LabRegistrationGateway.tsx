/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Lock, User, Key, AlertCircle, 
  Eye, EyeOff, Cpu, CheckCircle2,
  MapPin, Award, ArrowRight, Sparkles, RefreshCw
} from 'lucide-react';
import { 
  ChiefTechnician, LabFacility, labLogo 
} from '../types';

// Helper to auto-generate standard Lab Node Code from Lab Name & LGA
const generateLabNodeCode = (labName: string, lgaStr: string): string => {
  let lgaPrefix = 'GBK';
  if (lgaStr && lgaStr.trim()) {
    const cleanLga = lgaStr.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (cleanLga.length >= 3) {
      lgaPrefix = cleanLga.slice(0, 3);
    }
  }
  
  let namePrefix = 'LAB';
  if (labName && labName.trim()) {
    const words = labName.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      namePrefix = words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
      if (namePrefix.length < 3) namePrefix += 'L';
    } else if (words.length === 1 && words[0].length >= 3) {
      namePrefix = words[0].slice(0, 3).toUpperCase();
    }
  }

  const randomNum = Math.floor(Math.random() * 900) + 100;
  return `${lgaPrefix}-${namePrefix}-${randomNum}`;
};

interface LabRegistrationGatewayProps {
  onLogin: (technician: ChiefTechnician, facility: LabFacility) => void;
  initialFacility?: LabFacility;
  networkStatus: 'online' | 'offline';
  onToggleNetwork: (status: 'online' | 'offline') => void;
}

export default function LabRegistrationGateway({
  onLogin,
  initialFacility,
  networkStatus,
  onToggleNetwork
}: LabRegistrationGatewayProps) {
  // Stored registered lab facility (only exists once user registers a lab)
  const [registeredFacility, setRegisteredFacility] = useState<LabFacility | null>(() => {
    const saved = localStorage.getItem('aimalscan_active_facility');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing active facility', e);
      }
    }
    return null;
  });

  // Steps are strictly 'register' (Lab Registration) -> 'signin' (Chief Scientist Security Sign-In)
  const [activeStep, setActiveStep] = useState<'register' | 'signin'>(() => {
    return registeredFacility ? 'signin' : 'register';
  });

  // Sign In Form States
  const [technicianName, setTechnicianName] = useState(() => {
    return registeredFacility?.chiefTechnician || 'Dr. Becky Saar (MLS, MSc Parasitology)';
  });
  const [licenseNumber, setLicenseNumber] = useState('MLSCN-GBK-2026-088');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lab Registration Form States
  const [newLabName, setNewLabName] = useState(registeredFacility?.name || '');
  const [newLabTier, setNewLabTier] = useState<LabFacility['tier']>(
    registeredFacility?.tier || 'Tertiary Reference Lab'
  );
  const [newState, setNewState] = useState(registeredFacility?.state || 'Benue State');
  const [newLga, setNewLga] = useState(registeredFacility?.lga || 'Gboko LGA');
  const [newCountry, setNewCountry] = useState(registeredFacility?.country || 'Nigeria');
  const [newChiefTech, setNewChiefTech] = useState(registeredFacility?.chiefTechnician || 'Dr. Becky Saar (MLS)');
  const [newPhone, setNewPhone] = useState(registeredFacility?.chiefTechnicianPhone || '+2348071119766');
  const [newEmail, setNewEmail] = useState(registeredFacility?.chiefTechnicianEmail || 'lab@aimalscan.org.ng');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Auto-generated Lab Node Code state
  const [newLabCode, setNewLabCode] = useState(() => {
    return registeredFacility?.code || '';
  });
  const [isAutoCode, setIsAutoCode] = useState(!registeredFacility?.code);
  const [generatedCodeMessage, setGeneratedCodeMessage] = useState<string | null>(null);

  // Manual regenerate / preview fresh Lab Node Code
  const handleRegenerateNodeCode = () => {
    const freshCode = generateLabNodeCode(newLabName || 'Diagnostic Lab', newLga || 'Gboko LGA');
    setNewLabCode(freshCode);
    setIsAutoCode(true);
  };

  const handleLabNameChange = (val: string) => {
    setNewLabName(val);
  };

  const handleLgaChange = (val: string) => {
    setNewLga(val);
  };

  // Save / Register Diagnostic Lab
  const handleRegisterLab = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newLabName.trim()) {
      setError('Diagnostic Lab Name is required before registration.');
      return;
    }
    
    // Auto-generate fresh unique Lab Node Code upon clicking Register
    const finalCode = (isAutoCode || !newLabCode.trim())
      ? generateLabNodeCode(newLabName, newLga)
      : newLabCode.trim().toUpperCase();

    setNewLabCode(finalCode);
    setGeneratedCodeMessage(finalCode);

    const hybridMods: string[] = [
      'Digital Thin Smear AI Optical Rig (100x Oil)',
      'Pf/Pv Dual Antigen Computer Vision RDT Reader',
      'HemoCue Hb 301 Bluetooth Anemia Analyzer',
      'STANDARD G6PD Quantitative Biosensor Gatekeeper',
      'Isothermal LAMP 18S / pfhrp2 / K13 Profiler'
    ];

    const newFac: LabFacility = {
      id: `FAC-${Date.now().toString(36).toUpperCase()}`,
      name: newLabName.trim(),
      code: finalCode,
      tier: newLabTier,
      state: newState.trim() || 'Benue State',
      lga: newLga.trim() || 'Gboko LGA',
      country: newCountry.trim() || 'Nigeria',
      accreditationNumber: registeredFacility?.accreditationNumber || `MLSCN/2026/BN-${Math.floor(Math.random() * 800) + 100}`,
      chiefTechnician: newChiefTech.trim() || 'Chief Medical Laboratory Scientist',
      chiefTechnicianPhone: newPhone.trim() || '+2348071119766',
      chiefTechnicianEmail: newEmail.trim() || 'lab@aimalscan.org.ng',
      emergencyContact: newPhone.trim() || '+2348071119766',
      hostingStatus: 'Online (Cloud Connected)',
      cloudSyncEndpoint: 'https://aimalscan-surveillance.cloud.gov.ng/api/v3',
      androidAppVersion: 'v3.0.4-hybrid-arm64-v8a',
      hybridModules: hybridMods,
      registeredAt: new Date().toISOString(),
      licenseValidUntil: '2027-12-31'
    };

    setRegisteredFacility(newFac);
    localStorage.setItem('aimalscan_active_facility', JSON.stringify(newFac));

    if (newChiefTech.trim()) {
      setTechnicianName(newChiefTech.trim());
    }

    setRegistrationSuccess(true);
    setTimeout(() => {
      setRegistrationSuccess(false);
      setActiveStep('signin');
    }, 1200);
  };

  // Submit Chief Technician Sign In
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!registeredFacility) {
      setError('Please register your Diagnostic Lab first before logging in for use.');
      setActiveStep('register');
      return;
    }
    if (!technicianName.trim()) {
      setError('Chief Medical Lab Scientist name is mandatory.');
      return;
    }
    if (!password.trim()) {
      setError('Staff login password is required to unlock diagnostic instruments.');
      return;
    }
    if (password !== 'SCAN01') {
      setError('Invalid Chief Technician Password. (Hint: Use default password SCAN01).');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const technician: ChiefTechnician = {
        id: `tech-${Math.random().toString(36).substr(2, 7)}`,
        name: technicianName.trim(),
        title: 'Chief Medical Laboratory Scientist',
        licenseNumber: licenseNumber.trim() || 'MLSCN-GBK-2026-088',
        facility: registeredFacility.name,
        role: 'Chief Lab Technician',
        loginTime: new Date().toISOString()
      };

      if (rememberMe) {
        localStorage.setItem('aimalscan_technician_session', JSON.stringify(technician));
        localStorage.setItem('aimalscan_active_facility', JSON.stringify(registeredFacility));
      } else {
        sessionStorage.setItem('aimalscan_technician_session', JSON.stringify(technician));
        sessionStorage.setItem('aimalscan_active_facility', JSON.stringify(registeredFacility));
      }

      onLogin(technician, registeredFacility);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div id="lab-registration-gateway" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* Top Banner Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-teal-500/40 shrink-0 bg-slate-950 shadow-md shadow-teal-500/10">
              <img 
                src={labLogo} 
                alt="AI-MalScan Malaria Lab Logo" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black tracking-tight text-white uppercase">AI-MalScan Suite V3.0</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold uppercase">
                  LAB REGISTRATION GATEWAY
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Official Diagnostic Facility Registration & Security Access</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              <span>Diagnostic Security Portal</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Authentication & Registration Container */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Hybrid Lab Authority & Accreditation Overview */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="space-y-5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-bold tracking-wider uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>MLSCN & NMEP Accredited Gateway</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                  Diagnostic Lab Registration
                </h1>
                <p className="text-xs text-teal-300/90 font-medium leading-relaxed">
                  Register your diagnostic laboratory facility to authenticate and unlock diagnostic suite instruments.
                </p>
                <div className="space-y-2.5 pt-1 text-[11px] text-slate-300 leading-relaxed">
                  <p>
                    The AI-MalScan Hybrid Laboratory is designed as a shared national asset supporting multiple authorized users per facility. To maintain compliance, accountability, and real-time outbreak surveillance, access to the diagnostic workflow and instruments is controlled through facility-level authentication.
                  </p>
                  <p className="text-slate-400">
                    All laboratories must be registered and verified on the national network before activation. Once authenticated, authorized staff are granted role-based access to the Diagnostic Microscope Unit and the Central Surveillance Dashboard, ensuring every result is traceable to a facility, user, and clinic site.
                  </p>
                </div>
              </div>

              {/* Status / Active Lab Display Card */}
              {registeredFacility ? (
                <div className="bg-slate-950 border border-teal-500/40 rounded-2xl p-4 space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-teal-400 font-bold flex items-center space-x-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Registered Lab Facility</span>
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold">
                      READY FOR LOGIN
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white line-clamp-2">
                    {registeredFacility.name}
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono flex flex-col space-y-1 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span>Node Code: <strong className="text-teal-300">{registeredFacility.code}</strong></span>
                      <span>Tier: <strong className="text-slate-200">{registeredFacility.tier}</strong></span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      <span>{registeredFacility.lga}, {registeredFacility.state} ({registeredFacility.country || 'Nigeria'})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Registration Required</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Please provide your diagnostic laboratory name, node code, and location details in Step 1 to register your workstation.
                  </p>
                </div>
              )}

              {/* Protocol info */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2 text-[11px]">
                <div className="text-teal-400 font-bold flex items-center space-x-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Restricted Diagnostic Access</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[10px]">
                  All diagnostic modules, instrument interfaces, mobile APKs, and cloud sync endpoints are securely unlocked only after laboratory registration and Chief Scientist authentication.
                </p>
              </div>

            </div>

          </div>

          {/* Right Column: 2-Step Process (1. Register Lab -> 2. Chief Sign-In) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            
            <div>
              {/* Step Navigation Tabs */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
                
                <button
                  id="tab-register-lab-btn"
                  onClick={() => setActiveStep('register')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    activeStep === 'register'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Step 1: Register Diagnostic Lab</span>
                </button>

                <button
                  id="tab-signin-btn"
                  onClick={() => {
                    if (!registeredFacility) {
                      setError('Please register your Diagnostic Lab first before proceeding to Chief Scientist sign-in.');
                      return;
                    }
                    setActiveStep('signin');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    activeStep === 'signin'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Step 2: Chief Scientist Sign-In</span>
                </button>

              </div>

              {/* Error Notification */}
              {error && (
                <div className="mb-5 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-start space-x-3 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-300 font-medium">{error}</div>
                </div>
              )}

              {/* Registration Success Notification */}
              {registrationSuccess && (
                <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center space-x-3 animate-fade-in shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="text-xs text-emerald-300 font-bold">
                    Diagnostic Lab Registered! Generated Lab Node Code:{' '}
                    <span className="font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-200">
                      {generatedCodeMessage || newLabCode}
                    </span>{' '}
                    • Proceeding to Chief Scientist Sign-In...
                  </div>
                </div>
              )}

              {/* STEP 1: REGISTER DIAGNOSTIC LAB FORM */}
              {activeStep === 'register' && (
                <form onSubmit={handleRegisterLab} className="space-y-3.5 animate-fade-in" id="register-diagnostic-lab-form">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-tight">Register Diagnostic Lab</h2>
                      <p className="text-[11px] text-slate-400">Register your laboratory facility details before logging in</p>
                    </div>
                    {registeredFacility && (
                      <button
                        type="button"
                        onClick={() => setActiveStep('signin')}
                        className="text-xs font-mono text-teal-400 hover:text-teal-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Already Registered? Sign In</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Diagnostic Lab Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Diagnostic Lab Name <span className="text-teal-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <input
                        id="new-lab-name-input"
                        type="text"
                        required
                        value={newLabName}
                        onChange={(e) => handleLabNameChange(e.target.value)}
                        placeholder="e.g. JADSL ICT Unit Community Center Lab - Gboko"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Grid 1: Auto-Generated Code & Tier */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Lab Node Code <span className="text-teal-400">*</span>
                        </label>
                        <div className="flex items-center space-x-1">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center space-x-1 ${
                            newLabCode
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                          }`}>
                            <Sparkles className="h-2.5 w-2.5 text-teal-400" />
                            <span>{newLabCode ? 'NODE CODE READY' : 'GENERATES ON REGISTER'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleRegenerateNodeCode}
                            title="Preview / generate code now"
                            className="p-1 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <input
                        id="new-lab-code-input"
                        type="text"
                        value={newLabCode}
                        onChange={(e) => {
                          setNewLabCode(e.target.value);
                          setIsAutoCode(false);
                        }}
                        placeholder="Auto-generated on clicking 'Register Lab & Proceed'"
                        className="w-full bg-slate-950 border border-teal-500/40 rounded-xl px-3 py-2.5 text-xs text-teal-300 font-bold placeholder-slate-600 focus:outline-none focus:border-teal-400 font-mono uppercase"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        {newLabCode 
                          ? 'Identifier ready. Will bind to facility upon registration.' 
                          : '⚡ Auto-generates unique identifier upon clicking "Register Lab & Proceed".'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Facility Tier / Classification
                      </label>
                      <select
                        id="new-lab-tier-select"
                        value={newLabTier}
                        onChange={(e) => setNewLabTier(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="Tertiary Reference Lab">Tertiary Reference Lab</option>
                        <option value="General Hospital Wing">General Hospital Wing</option>
                        <option value="Primary Health Care (PHC)">Primary Health Care (PHC)</option>
                        <option value="IDP Camp Field Post">IDP Camp Field Post</option>
                        <option value="Border Mobile Unit">Border Mobile Unit</option>
                        <option value="Community Diagnostic Centre">Community Diagnostic Centre</option>
                        <option value="Private Clinical Laboratory">Private Clinical Laboratory</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid 2: State, LGA (MLSCN License Removed) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        placeholder="e.g. Benue State"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        LGA / District
                      </label>
                      <input
                        type="text"
                        value={newLga}
                        onChange={(e) => handleLgaChange(e.target.value)}
                        placeholder="e.g. Gboko LGA"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Chief Scientist / Tech Name & Diagnostic Lab Hotline Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Chief Scientist / Director
                      </label>
                      <input
                        type="text"
                        value={newChiefTech}
                        onChange={(e) => setNewChiefTech(e.target.value)}
                        placeholder="e.g. Dr. Becky Saar (MLS)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Diagnostic Lab Hotline Phone
                      </label>
                      <input
                        type="text"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+2348071119766"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      id="save-new-lab-btn"
                      type="submit"
                      className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Register Lab & Proceed to Chief Scientist Sign-In</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: CHIEF TECHNICIAN SIGN IN */}
              {activeStep === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4 animate-fade-in" id="chief-technician-signin-form">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-tight">Chief Scientist Security Sign-In</h2>
                      <p className="text-[11px] text-slate-400">Unlock diagnostic instruments for your registered laboratory</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep('register')}
                      className="text-xs font-mono text-teal-400 hover:text-teal-300 underline cursor-pointer"
                    >
                      Edit / Change Lab Registration
                    </button>
                  </div>

                  {/* Registered Lab Display Badge */}
                  <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{registeredFacility?.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Code: <strong className="text-teal-300">{registeredFacility?.code}</strong> • {registeredFacility?.lga}, {registeredFacility?.state}
                        </div>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40">
                      REGISTERED
                    </span>
                  </div>

                  {/* Technician Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Chief Lab Scientist / Technician Name <span className="text-teal-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        id="technician-name-input"
                        type="text"
                        required
                        value={technicianName}
                        onChange={(e) => setTechnicianName(e.target.value)}
                        placeholder="Enter Chief Lab Technician Name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Professional License Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      MLSCN License / Registration Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Award className="h-4 w-4" />
                      </div>
                      <input
                        id="technician-license-input"
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. MLSCN-GBK-2026-088"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Login Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Login Password <span className="text-teal-400">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-teal-400">Default: SCAN01</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Key className="h-4 w-4" />
                      </div>
                      <input
                        id="technician-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (e.g. SCAN01)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Keep authenticated checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-teal-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>Keep Chief Technician authenticated on this workstation</span>
                    </label>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-2">
                    <button
                      id="submit-technician-login-btn"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{isSubmitting ? 'Verifying Lab & Unlocking Instruments...' : 'Unlock AI-MalScan Console & Access Diagnostic Suite'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Bottom Security Note */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center text-[10px] text-slate-500 font-mono">
              <div className="flex items-center space-x-1.5">
                <Cpu className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>Digitally signed under MLSCN diagnostic standards</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 px-6 text-center text-slate-500 text-[11px] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div>
            <span className="text-teal-400 font-bold">Initiated by:</span> GECN-HP <span className="text-slate-600">|</span> <span className="text-teal-400 font-bold">Developed by:</span> JADSL ICT Unit Community Center-Gboko Benue State
          </div>
          <div className="text-amber-400 font-bold">
            Emergency Technical Assistance: +2348071119766
          </div>
        </div>
      </footer>

    </div>
  );
}
