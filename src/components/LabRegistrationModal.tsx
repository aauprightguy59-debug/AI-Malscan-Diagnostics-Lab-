/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Building2, Plus, CheckCircle2, ShieldCheck, MapPin, X, Award, Stethoscope, Save, Sparkles, RefreshCw } from 'lucide-react';
import { LabFacility } from '../types';

interface LabRegistrationModalProps {
  currentFacility: LabFacility;
  onUpdateFacility: (facility: LabFacility) => void;
  onClose: () => void;
}

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

export default function LabRegistrationModal({
  currentFacility,
  onUpdateFacility,
  onClose
}: LabRegistrationModalProps) {
  const [name, setName] = useState(currentFacility.name);
  const [code, setCode] = useState(currentFacility.code);
  const [tier, setTier] = useState<LabFacility['tier']>(currentFacility.tier);
  const [state, setState] = useState(currentFacility.state || 'Benue State');
  const [lga, setLga] = useState(currentFacility.lga || 'Gboko LGA');
  const [country, setCountry] = useState(currentFacility.country || 'Nigeria');
  const [chiefTech, setChiefTech] = useState(currentFacility.chiefTechnician || 'Dr. Becky Saar (MLS)');
  const [phone, setPhone] = useState(currentFacility.chiefTechnicianPhone || '+2348071119766');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRegenerateCode = () => {
    setCode(generateLabNodeCode(name, lga));
  };

  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const updatedFacility: LabFacility = {
      ...currentFacility,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      tier,
      state: state.trim(),
      lga: lga.trim(),
      country: country.trim(),
      chiefTechnician: chiefTech.trim() || currentFacility.chiefTechnician,
      chiefTechnicianPhone: phone.trim() || currentFacility.chiefTechnicianPhone,
      emergencyContact: phone.trim() || currentFacility.emergencyContact
    };

    localStorage.setItem('aimalscan_active_facility', JSON.stringify(updatedFacility));
    onUpdateFacility(updatedFacility);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div id="facility-registration-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100 max-w-2xl w-full mx-auto my-auto">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Diagnostic Lab Registration</h3>
                <span className="text-[9px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/40 font-bold uppercase">
                  MLSCN ACCREDITED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Register your diagnostic laboratory facility to authenticate and unlock diagnostic suite instruments.</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSaveFacility} className="p-6 space-y-4">
          
          {savedSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-300 font-bold animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Diagnostic Lab Registration Updated Successfully!</span>
            </div>
          )}

          {/* Diagnostic Lab Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Diagnostic Lab Name <span className="text-teal-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JADSL ICT Unit Community Center Lab"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          {/* Code & Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Lab Node Code <span className="text-teal-400">*</span>
                </label>
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] font-mono bg-teal-500/15 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30 flex items-center space-x-1">
                    <Sparkles className="h-2.5 w-2.5 text-teal-400" />
                    <span>AUTO-GENERATED</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    title="Regenerate unique node identifier"
                    className="p-1 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. GBK-JADSL-01"
                className="w-full bg-slate-950 border border-teal-500/40 rounded-xl px-3 py-2.5 text-xs text-teal-300 font-bold uppercase focus:outline-none focus:border-teal-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Facility Classification
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
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

          {/* State & LGA (License Removed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                State / Province
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                LGA / District
              </label>
              <input
                type="text"
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Chief Tech & Diagnostic Lab Hotline Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Chief Scientist / Director
              </label>
              <input
                type="text"
                value={chiefTech}
                onChange={(e) => setChiefTech(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Diagnostic Lab Hotline Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Registered Lab Details</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
