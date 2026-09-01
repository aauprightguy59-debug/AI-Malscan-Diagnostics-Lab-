/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, User, Key, Building2, AlertCircle, 
  Eye, EyeOff, Cpu
} from 'lucide-react';
import { ChiefTechnician, labLogo } from '../types';

interface TechnicianLoginProps {
  onLogin: (technician: ChiefTechnician) => void;
}

export default function TechnicianLogin({ onLogin }: TechnicianLoginProps) {
  const [labName, setLabName] = useState('JADSL ICT Unit Community Center Lab - Gboko');
  const [name, setName] = useState('Dr. Emmanuel Orkaa, MLS');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!labName.trim()) {
      setError('Diagnostic Lab Name is mandatory to identify the testing laboratory.');
      return;
    }
    if (!name.trim()) {
      setError('Chief Lab Technician Name is mandatory to access the diagnostic suite.');
      return;
    }
    if (!password.trim()) {
      setError('Login Password is required to unlock diagnostic instruments.');
      return;
    }

    const storedPassword = localStorage.getItem('aimalscan_lab_password');
    if (storedPassword && password !== storedPassword) {
      setError('Invalid Chief Technician Password. Please enter your registered facility password.');
      return;
    }

    if (!storedPassword) {
      localStorage.setItem('aimalscan_lab_password', password.trim());
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const technician: ChiefTechnician = {
        id: `tech-${Math.random().toString(36).substr(2, 7)}`,
        name: name.trim(),
        title: 'Chief Medical Laboratory Scientist',
        licenseNumber: 'MLS-GBK-2026-088',
        facility: labName.trim(),
        role: 'Chief Lab Technician',
        loginTime: new Date().toISOString()
      };

      if (rememberMe) {
        localStorage.setItem('aimalscan_technician_session', JSON.stringify(technician));
      } else {
        sessionStorage.setItem('aimalscan_technician_session', JSON.stringify(technician));
      }

      onLogin(technician);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div id="technician-login-screen" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* Top Banner Bar */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative h-9 w-9 rounded-lg overflow-hidden border border-teal-500/30 shrink-0 bg-slate-950">
              <img 
                src={labLogo} 
                alt="AI-MalScan Malaria Lab Logo" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-tight text-white uppercase">AI-MalScan Suite</span>
                <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-teal-400">
                  SECURITY GATEWAY
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Digital Microscope Parasitemia Diagnostic & National Surveillance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg text-rose-400 text-[11px] font-mono font-medium">
            <Lock className="h-3.5 w-3.5 text-rose-400" />
            <span>CONSOLE LOCKED: AUTHENTICATION REQUIRED</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Security Context & Authority Info */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-bold tracking-wider uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Restricted Medical Device Access</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-teal-500/40 shadow-lg shadow-teal-500/20 shrink-0 bg-slate-950">
                  <img 
                    src={labLogo} 
                    alt="Malaria Lab Logo" 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight leading-tight">Chief Lab Technician Portal</h2>
                  <p className="text-xs text-teal-400 font-mono">Microscopic & Surveillance Authorization</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This digital diagnostic station interfaces with automated parasite quantification engines and national outbreak reporting feeds. In accordance with clinical pathology standards, only authorized Chief Laboratory Technicians and Medical Laboratory Scientists may operate the scanner and sign off on treatments.
              </p>
            </div>
          </div>

          {/* Right Column: Authentication Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-teal-400" />
                    <span>Laboratory Staff Authentication</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Please provide your Chief Technician credentials to initiate session</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Key className="h-4 w-4" />
                </div>
              </div>

              {error && (
                <div className="mb-5 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-start space-x-3 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-300 font-medium">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" id="chief-technician-login-form">
                {/* Diagnostic Lab Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Diagnostic Lab Name <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <input
                      id="diagnostic-lab-name-input"
                      type="text"
                      required
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      placeholder="Enter Diagnostic Lab Name (e.g. JADSL ICT Unit Lab - Gboko)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Technician Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Lab Technician Name <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="technician-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Chief Lab Technician Name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Login Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Login Password <span className="text-teal-400">*</span>
                    </label>
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
                      placeholder="Enter technician login password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
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

                {/* Checkbox Options */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-teal-500 focus:ring-teal-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Keep Chief Technician authenticated on this workstation</span>
                  </label>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    id="submit-technician-login-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{isSubmitting ? 'Authenticating Credentials...' : 'Unlock AI-MalScan Console & Access Diagnostic Suite'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Security Assurance Note */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
              <Cpu className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span>All blood slide analyses and outbound outbreak surveillance logs are digitally signed with the Chief Technician’s credentials.</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-slate-500 text-[11px] font-mono">
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
