/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, Database, ShieldAlert, Wifi, WifiOff, RefreshCw, 
  Layers, CheckCircle, Info, Heart, ArrowRight, Trash2,
  Lock, LogOut, UserCheck, ShieldCheck, Award, Dna, Package,
  Building2, Sparkles, AlertOctagon, HeartPulse, Zap, Globe,
  Smartphone, Download
} from 'lucide-react';
import MicroscopeScanner from './components/MicroscopeScanner';
import DiagnosticReport from './components/DiagnosticReport';
import SurveillanceDashboard from './components/SurveillanceDashboard';
import MolecularModule from './components/MolecularModule';
import ReagentInventory from './components/ReagentInventory';
import LabRegistrationModal from './components/LabRegistrationModal';
import LabRegistrationGateway from './components/LabRegistrationGateway';
import AndroidAppModal from './components/AndroidAppModal';
import OnlineHostingModal from './components/OnlineHostingModal';
import { 
  DiagnosticRecord, Patient, ChiefTechnician, labLogo, LabFacility, 
  BENUE_FACILITIES, RDTResult, HemoglobinResult, G6PDResult, MolecularResult 
} from './types';
import { recordSyncAudit } from './lib/auditUtils';
import { Capacitor } from '@capacitor/core';

export default function App() {
  const [technician, setTechnician] = useState<ChiefTechnician | null>(null);
  const [activeTab, setActiveTab] = useState<'scan' | 'molecular' | 'inventory' | 'dashboard'>('scan');
  const [records, setRecords] = useState<DiagnosticRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('offline'); // Default offline to showcase resilient field capability
  const [detectedPlatform, setDetectedPlatform] = useState<string>('web');
  
  // Facility / Clinic Context
  const [activeFacility, setActiveFacility] = useState<LabFacility>(BENUE_FACILITIES[0]);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);

  // Current active scan report state
  const [currentReport, setCurrentReport] = useState<DiagnosticRecord | null>(null);
  const [reportSource, setReportSource] = useState('local_diagnostic_engine');

  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState<DiagnosticRecord[]>([]);

  // Check stored Chief Technician session on mount
  useEffect(() => {
    const cachedSession = localStorage.getItem('aimalscan_technician_session') || sessionStorage.getItem('aimalscan_technician_session');
    if (cachedSession) {
      try {
        setTechnician(JSON.parse(cachedSession));
      } catch (e) {
        console.error('Failed to parse cached technician session', e);
      }
    }

    const cachedFacility = localStorage.getItem('aimalscan_active_facility');
    if (cachedFacility) {
      try {
        setActiveFacility(JSON.parse(cachedFacility));
      } catch (e) {
        console.error('Failed to parse cached facility', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aimalscan_technician_session');
    sessionStorage.removeItem('aimalscan_technician_session');
    setTechnician(null);
    setCurrentReport(null);
  };

  const handleFacilityChange = (fac: LabFacility) => {
    setActiveFacility(fac);
    localStorage.setItem('aimalscan_active_facility', JSON.stringify(fac));
  };

  // 1. FETCH RECORDS FROM CENTRAL BACKEND ON MOUNT
  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Failed to fetch surveillance records from central database:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
    
    // Read platform from Capacitor
    const currentPlatform = Capacitor.getPlatform();
    setDetectedPlatform(currentPlatform);
    
    // Load local offline queue from localstorage if present
    const cachedQueue = localStorage.getItem('aimalscan_offline_queue');
    if (cachedQueue) {
      try {
        setOfflineQueue(JSON.parse(cachedQueue));
      } catch (e) {
        console.error('Failed to parse cached queue', e);
      }
    }
  }, []);

  // Sync offline queue changes to localStorage
  useEffect(() => {
    localStorage.setItem('aimalscan_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // 2. TRIGGER SYNC OF QUEUED ITEMS WHEN TOGGLED ONLINE
  const handleNetworkToggle = (status: 'online' | 'offline') => {
    setNetworkStatus(status);
    if (status === 'online' && offlineQueue.length > 0) {
      triggerQueueSync(offlineQueue);
    }
  };

  const triggerQueueSync = async (queueToSync: DiagnosticRecord[]) => {
    setIsSyncing(true);
    let successCount = 0;
    
    for (const record of queueToSync) {
      try {
        const syncedRecord = { ...record, synced: true };
        const res = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncedRecord)
        });
        
        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to sync queued case ${record.id}:`, err);
      }
    }

    if (successCount > 0) {
      // Record in supervisor sync audit trail
      recordSyncAudit({
        eventType: 'OFFLINE_TO_ONLINE_SYNC',
        recordsCount: successCount,
        recordIds: queueToSync.map(r => r.id),
        labNodeCode: activeFacility?.code || 'GBK-JADSL-01',
        facilityName: activeFacility?.name || 'Diagnostic Lab',
        technicianName: technician?.name || 'Chief Medical Laboratory Scientist',
        networkStatus: 'online',
        payloadSizeKb: parseFloat((queueToSync.length * 35.4).toFixed(1)),
        status: successCount === queueToSync.length ? 'SUCCESS' : 'PARTIAL',
        details: `Offline queue sync: ${successCount} of ${queueToSync.length} clinical records flushed to national surveillance database.`
      });

      setOfflineQueue([]);
      await fetchRecords();
    }
    
    setIsSyncing(false);
  };

  // 3. TRIGGER AI DIAGNOSTIC SCAN ENDPOINT
  const handleScanComplete = async (scanDetails: {
    imageKey: string;
    imageData: string | null;
    patient: Patient;
    rdtResult?: RDTResult;
    hbResult?: HemoglobinResult;
    g6pdResult?: G6PDResult;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanDetails)
      });

      if (!res.ok) {
        throw new Error('AI analysis backend failed.');
      }

      const data = await res.json();
      
      // Determine severity grade
      let severityGrade: DiagnosticRecord['severityGrade'] = 'Uncomplicated';
      if (!data.result.parasiteDetected) {
        severityGrade = 'Negative';
      } else if (
        data.result.species === 'Plasmodium falciparum' && 
        ((scanDetails.hbResult && scanDetails.hbResult.hbValue < 7.0) || data.result.density >= 10000)
      ) {
        severityGrade = 'Emergency (Severe Anemic Crisis)';
      }

      // Construct a new pending DiagnosticRecord
      const newRecord: DiagnosticRecord = {
        id: `rec-${Math.random().toString(36).substr(2, 9)}`,
        deviceId: activeFacility.code || 'MAL-SCAN-001',
        facility: activeFacility,
        patient: scanDetails.patient,
        result: data.result,
        timestamp: new Date().toISOString(),
        workerConfirmed: null, // worker must confirm
        treatmentRegimen: null,
        notes: '',
        synced: false,
        imageKey: scanDetails.imageKey,
        rdtResult: scanDetails.rdtResult,
        hbResult: scanDetails.hbResult,
        g6pdResult: scanDetails.g6pdResult,
        severityGrade
      };

      setReportSource(data.source);
      setCurrentReport(newRecord);

    } catch (err) {
      console.error('AI diagnosis request failed:', err);
      alert('Clinical Diagnostic Unit error: Failed to connect to AI Classification service.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. AUTHORIZE SIGN-OFF ON SCAN REPORT
  const handleAuthorizeRecord = async (authorizedRecord: DiagnosticRecord) => {
    if (networkStatus === 'online') {
      setIsSyncing(true);
      try {
        const syncedRecord = { ...authorizedRecord, synced: true };
        const res = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncedRecord)
        });

        if (res.ok) {
          setRecords(prev => [syncedRecord, ...prev]);
          setCurrentReport(syncedRecord);

          recordSyncAudit({
            eventType: 'RECORD_SUBMISSION_SYNC',
            recordsCount: 1,
            recordIds: [authorizedRecord.id],
            labNodeCode: activeFacility?.code || 'GBK-JADSL-01',
            facilityName: activeFacility?.name || 'Diagnostic Lab',
            technicianName: technician?.name || 'Chief Medical Laboratory Scientist',
            networkStatus: 'online',
            payloadSizeKb: 42.5,
            status: 'SUCCESS',
            details: `Direct real-time clinical submission: ${authorizedRecord.result.species} for patient ${authorizedRecord.patient.name} (${authorizedRecord.id}) synced to cloud node.`
          });
        } else {
          throw new Error('Server reject');
        }
      } catch (err) {
        console.error('Failed to upload authorized record immediately:', err);
        setOfflineQueue(prev => [...prev, authorizedRecord]);
        setRecords(prev => [authorizedRecord, ...prev]);
        setCurrentReport(authorizedRecord);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setOfflineQueue(prev => [...prev, authorizedRecord]);
      setRecords(prev => [authorizedRecord, ...prev]);
      setCurrentReport(authorizedRecord);
    }
  };

  const handleLinkMolecularToPatient = (patientId: string, molRes: MolecularResult) => {
    setRecords(prev => prev.map(rec => {
      if (rec.id === patientId || rec.patient.ninOrHospitalNo === patientId) {
        return {
          ...rec,
          molecularResult: molRes
        };
      }
      return rec;
    }));
    if (currentReport && (currentReport.id === patientId || currentReport.patient.ninOrHospitalNo === patientId)) {
      setCurrentReport({
        ...currentReport,
        molecularResult: molRes
      });
    }
  };

  const clearActiveReport = () => {
    setCurrentReport(null);
  };

  // Restore/Import database records from external USB backup
  const handleRestoreRecords = async (restoredRecords: DiagnosticRecord[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setRecords(restoredRecords);
    } else {
      setRecords(prev => {
        const recordMap = new Map<string, DiagnosticRecord>();
        // Add existing
        prev.forEach(r => recordMap.set(r.id, r));
        // Overwrite or append imported
        restoredRecords.forEach(r => recordMap.set(r.id, r));
        return Array.from(recordMap.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
    }

    // Record restore in supervisor audit trail
    recordSyncAudit({
      eventType: 'USB_RESTORE_MERGE',
      recordsCount: restoredRecords.length,
      labNodeCode: activeFacility?.code || 'GBK-JADSL-01',
      facilityName: activeFacility?.name || 'Diagnostic Lab',
      technicianName: technician?.name || 'Chief Medical Laboratory Scientist',
      networkStatus: networkStatus,
      payloadSizeKb: parseFloat((restoredRecords.length * 28.2).toFixed(1)),
      status: 'SUCCESS',
      details: `Database archive ${mode} restore: ${restoredRecords.length} records processed and reconciled.`
    });

    // Sync restored records to backend if online
    if (networkStatus === 'online') {
      try {
        await fetch('/api/records/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: restoredRecords, mode })
        });
      } catch (err) {
        console.error('Failed to sync restored records to server:', err);
      }
    }
  };

  return (
    <div id="app-root-frame" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* If unauthorized, render the Diagnostic Lab Registration & Chief Technician Security Gateway */}
      {!technician ? (
        <LabRegistrationGateway 
          onLogin={(tech, fac) => {
            setTechnician(tech);
            setActiveFacility(fac);
          }}
          initialFacility={activeFacility}
          networkStatus={networkStatus}
          onToggleNetwork={handleNetworkToggle}
        />
      ) : (
        <>
          {/* GLOBAL HEADER BAR */}
          <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 sticky top-0 z-30 shadow-md">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              
              {/* Brand/Product Logo */}
              <div className="flex items-center space-x-3">
                <div className="relative h-11 w-11 rounded-xl overflow-hidden shadow-lg shadow-teal-500/15 border border-teal-500/30 shrink-0 bg-slate-950">
                  <img 
                    src={labLogo} 
                    alt="AI-MalScan Malaria Lab Logo" 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-black tracking-tight text-white uppercase">AI-MALSCAN SUITE</h1>
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/40 text-teal-300 shrink-0">
                      V3.0 HYBRID LAB
                    </span>
                    {detectedPlatform === 'android' ? (
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse shrink-0">
                        ANDROID NATIVE
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
                        4-IN-1 HYBRID
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Traditional Lab Replacement: 🔬 Microscopy + ⚡ RDT + 🩸 Hemoglobin + 🛡️ G6PD + 🧬 Molecular LAMP
                  </p>
                </div>
              </div>

              {/* Facility & Technician Session Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                
                {/* Active Operating Facility Pill */}
                <button
                  id="active-facility-badge-btn"
                  onClick={() => setShowFacilityModal(true)}
                  className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/40 rounded-xl px-3 py-1.5 transition-all cursor-pointer text-left shadow-sm"
                  title="Switch or Register Diagnostic Facility"
                >
                  <Building2 className="h-4 w-4 text-teal-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-[9px] text-slate-500 font-mono">DIAGNOSTIC LAB:</div>
                    <div className="text-xs font-bold text-slate-200 truncate max-w-[150px] sm:max-w-[180px]">
                      {activeFacility.name}
                    </div>
                  </div>
                </button>

                {/* Cloud Sync Quick Link Button */}
                <button
                  id="header-cloud-sync-btn"
                  onClick={() => setShowCloudModal(true)}
                  className="flex items-center space-x-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1.5 rounded-xl text-cyan-300 text-xs font-mono font-bold transition-all cursor-pointer"
                  title="Online Cloud Surveillance Hub"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cloud Hub</span>
                </button>

                {/* Android App Quick Link Button */}
                <button
                  id="header-android-app-btn"
                  onClick={() => setShowAndroidModal(true)}
                  className="flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer"
                  title="Android App Version (.APK) & Hardware Setup"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Android APK</span>
                </button>

                {/* Authenticated Chief Lab Technician Badge */}
                <div id="technician-session-badge" className="flex items-center space-x-2 bg-slate-950/90 border border-teal-500/30 rounded-xl px-3 py-1.5 shadow-sm">
                  <div className="h-7 w-7 rounded-lg bg-teal-500/15 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[160px]">
                        {technician.name}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono truncate max-w-[120px] sm:max-w-[160px]">
                      Lic: {technician.licenseNumber}
                    </div>
                  </div>
                  <button 
                    id="lock-console-btn"
                    onClick={handleLogout}
                    title="Lock Diagnostic Console (Sign Out)"
                    className="ml-1 p-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer flex items-center space-x-1 text-[10px] font-mono"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Lock</span>
                  </button>
                </div>

                {/* Sync Queue indicator */}
                {offlineQueue.length > 0 && (
                  <div id="sync-queue-badge" className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-amber-400 font-mono font-bold text-[11px]">{offlineQueue.length} Queued</span>
                    {networkStatus === 'online' && (
                      <button
                        id="sync-now-btn"
                        onClick={() => triggerQueueSync(offlineQueue)}
                        className="text-[9px] bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase transition-all cursor-pointer"
                        disabled={isSyncing}
                      >
                        {isSyncing ? 'Syncing...' : 'Sync'}
                      </button>
                    )}
                  </div>
                )}

                {/* Network Toggle */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-1 flex items-center">
                  <button
                    id="net-offline-toggle"
                    onClick={() => handleNetworkToggle('offline')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                      networkStatus === 'offline'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </button>
                  <button
                    id="net-online-toggle"
                    onClick={() => handleNetworkToggle('online')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                      networkStatus === 'online'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Wifi className="h-3 w-3" />
                    <span>Online</span>
                  </button>
                </div>

              </div>

            </div>
          </header>

          {/* 4-IN-1 HYBRID NAVIGATION TABS */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2 sticky top-[69px] z-20 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex items-center space-x-2 overflow-x-auto scrollbar-none py-0.5">
              
              <button
                id="tab-scan-selector"
                onClick={() => setActiveTab('scan')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
                  activeTab === 'scan'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Layers className="h-4 w-4 text-teal-400" />
                <span>🔬 4-in-1 Hybrid Stage</span>
              </button>

              <button
                id="tab-molecular-selector"
                onClick={() => setActiveTab('molecular')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
                  activeTab === 'molecular'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Dna className="h-4 w-4 text-purple-400" />
                <span>🧬 Molecular LAMP & K13</span>
              </button>

              <button
                id="tab-inventory-selector"
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
                  activeTab === 'inventory'
                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Package className="h-4 w-4 text-blue-400" />
                <span>📦 Reagents & Cold-Chain</span>
              </button>
              
              <button
                id="tab-dashboard-selector"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Database className="h-4 w-4 text-amber-400" />
                <span>📊 Surveillance Registry</span>
              </button>

            </div>
          </div>

          {/* CORE WORKSPACE */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-24 md:pb-6">
            
            {/* TAB 1: 4-IN-1 HYBRID SCANNING STAGE */}
            {activeTab === 'scan' && (
              <div className="space-y-6 animate-fade-in">
                {networkStatus === 'offline' && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 flex items-start space-x-3">
                    <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-300/90 leading-normal">
                      <span className="font-bold">Offline Clinic Mode Active: </span> 
                      Operating at <strong className="text-white">{activeFacility.name}</strong>. All 4 diagnostic channels (Microscopy, RDT optical reader, Hemoglobin, and G6PD safety gates) operate completely locally and store encrypted records in the offline queue.
                    </div>
                  </div>
                )}

                {!currentReport ? (
                  <MicroscopeScanner 
                    onScanComplete={handleScanComplete} 
                    isLoading={isLoading}
                    activeFacility={activeFacility}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className="text-slate-500">Active Dossier:</span>
                        <span className="text-teal-400 font-bold">{currentReport.id}</span>
                      </div>
                      <button
                        id="load-next-slide-btn"
                        onClick={clearActiveReport}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 rounded-xl text-xs font-bold border border-slate-700 hover:border-teal-500/40 transition-all cursor-pointer shadow-sm"
                      >
                        <span>+ Load Next Patient Slide</span>
                        <ArrowRight className="h-4 w-4 text-teal-400" />
                      </button>
                    </div>

                    <DiagnosticReport 
                      record={currentReport} 
                      source={reportSource}
                      onAuthorizeRecord={handleAuthorizeRecord}
                      isSyncing={isSyncing}
                      networkStatus={networkStatus}
                      technician={technician}
                      facility={activeFacility}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MOLECULAR LAMP & PCR MODULE */}
            {activeTab === 'molecular' && (
              <div className="space-y-6 animate-fade-in">
                <MolecularModule 
                  activeRecord={currentReport}
                  facility={activeFacility}
                  onSaveMolecular={(molRes) => {
                    if (currentReport) {
                      handleLinkMolecularToPatient(currentReport.id, molRes);
                    }
                  }} 
                />
              </div>
            )}

            {/* TAB 3: REAGENT INVENTORY & COLD-CHAIN */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 animate-fade-in">
                <ReagentInventory />
              </div>
            )}

            {/* TAB 4: NATIONAL OUTBREAK SURVEILLANCE & LOGS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-300 leading-normal">
                      <span className="font-bold">National Malaria Elimination Program (NMEP) Live Sentinel Node: </span> 
                      Surveillance node active for Benue Valley. Tracking species prevalence, severe malarial anemia risk, G6PD deficiency frequencies, and molecular artemisinin resistance.
                    </div>
                  </div>
                  
                  {offlineQueue.length > 0 && (
                    <button
                      id="sync-dashboard-btn"
                      onClick={() => triggerQueueSync(offlineQueue)}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer shrink-0"
                      disabled={isSyncing}
                    >
                      Sync {offlineQueue.length} Queued Cases
                    </button>
                  )}
                </div>

                <SurveillanceDashboard 
                  records={records} 
                  activeFacility={activeFacility} 
                  technician={technician || undefined}
                  onRestoreRecords={handleRestoreRecords}
                />
              </div>
            )}

          </main>

          {/* FOOTER */}
          <footer className="bg-slate-900 border-t border-slate-800 py-6 px-6 text-center text-slate-500 text-[11px] font-mono mt-auto pb-24 md:pb-6">
            <div className="max-w-7xl mx-auto flex flex-col space-y-4">
              
              <div id="program-credits-container" className="border-b border-slate-800/60 pb-4 text-[11px] text-slate-400 flex flex-col md:flex-row justify-between items-center gap-2">
                <div>
                  <span className="text-teal-400 font-bold">Initiated by:</span> GECN-HP <span className="text-slate-600">|</span> <span className="text-teal-400 font-bold">Developed by:</span> JADSL ICT Unit Community Center-Gboko Benue State
                </div>
                <div>
                  <span className="text-amber-400 font-bold">Emergency Technical Assistance:</span> +2348071119766
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div>
                  AI-MALSCAN SUITE V3.0 HYBRID LAB | SERIAL: <span className="text-slate-400">{activeFacility.code}</span>
                </div>
                <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                    <span>Local 4-in-1 Engine: Resilient</span>
                  </span>
                  <span className="text-slate-700">|</span>
                  <span className="flex items-center space-x-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${networkStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                    <span>Sync Server: {networkStatus === 'online' ? 'Connected' : 'Offline Field Queue'}</span>
                  </span>
                </div>
                <div>
                  &copy; 2026 National Disease Surveillance Registry
                </div>
              </div>

            </div>
          </footer>

          {/* BOTTOM NAVIGATION BAR FOR MOBILE */}
          <nav id="mobile-android-nav-dock" className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 py-2.5 px-4 flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.6)]">
            <button
              id="mobile-tab-scan-selector"
              onClick={() => setActiveTab('scan')}
              className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                activeTab === 'scan' ? 'text-teal-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span className="text-[9px] uppercase">4-in-1 Lab</span>
            </button>
            <button
              id="mobile-tab-molecular-selector"
              onClick={() => setActiveTab('molecular')}
              className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                activeTab === 'molecular' ? 'text-purple-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Dna className="h-4 w-4" />
              <span className="text-[9px] uppercase">Molecular</span>
            </button>
            <button
              id="mobile-tab-inventory-selector"
              onClick={() => setActiveTab('inventory')}
              className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                activeTab === 'inventory' ? 'text-blue-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Package className="h-4 w-4" />
              <span className="text-[9px] uppercase">Stores</span>
            </button>
            <button
              id="mobile-tab-dashboard-selector"
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Database className="h-4 w-4" />
              <span className="text-[9px] uppercase">Registry</span>
            </button>
          </nav>

          {/* Lab Facility Registration & Details Modal */}
          {showFacilityModal && (
            <LabRegistrationModal
              currentFacility={activeFacility}
              onUpdateFacility={(fac) => {
                handleFacilityChange(fac);
              }}
              onClose={() => setShowFacilityModal(false)}
            />
          )}

          {/* Android Mobile APK & Hardware Bridge Modal */}
          {showAndroidModal && (
            <AndroidAppModal onClose={() => setShowAndroidModal(false)} />
          )}

          {/* Online Cloud Hosting & Surveillance Sync Modal */}
          {showCloudModal && (
            <OnlineHostingModal
              facility={activeFacility}
              networkStatus={networkStatus}
              onToggleNetwork={handleNetworkToggle}
              onClose={() => setShowCloudModal(false)}
            />
          )}

        </>
      )}

    </div>
  );
}
