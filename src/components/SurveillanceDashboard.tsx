/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
  Search, ShieldAlert, Activity, FileText, CheckCircle, Database, Filter, ArrowUpRight, 
  MapPin, Clock, Info, X, Heart, HeartPulse, Zap, ShieldCheck, Dna, Printer, Layers, AlertOctagon,
  Download, HardDrive, FileSpreadsheet, FileJson, Check, Upload, RefreshCw, BarChart2, History, Building2
} from 'lucide-react';
import { DiagnosticRecord, labLogo, LabFacility, ChiefTechnician } from '../types';
import PrintReportDossier from './PrintReportDossier';
import DatabaseBackupModal from './DatabaseBackupModal';
import AuditTrailSection from './AuditTrailSection';
import { 
  generateSurveillanceCsv, 
  generateDatabaseBackupPackage, 
  triggerFileDownload, 
  saveAutomatedDatabaseSnapshot,
  getAutomatedBackupHistory
} from '../lib/exportUtils';

interface SurveillanceDashboardProps {
  records: DiagnosticRecord[];
  activeFacility?: LabFacility;
  technician?: ChiefTechnician;
  onRestoreRecords?: (restoredRecords: DiagnosticRecord[], mode: 'merge' | 'replace') => void;
}

export default function SurveillanceDashboard({ 
  records, 
  activeFacility,
  technician,
  onRestoreRecords 
}: SurveillanceDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'surveillance' | 'audit_trail'>('surveillance');
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('ALL');
  const [nodeCodeFilter, setNodeCodeFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<DiagnosticRecord | null>(null);
  const [printRecord, setPrintRecord] = useState<DiagnosticRecord | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [lastAutoBackupTime, setLastAutoBackupTime] = useState<string | null>(null);

  // Automated database snapshot on mount and when records change
  useEffect(() => {
    if (records.length > 0) {
      const snap = saveAutomatedDatabaseSnapshot(records, activeFacility, technician);
      if (snap) {
        setLastAutoBackupTime(snap.timestamp);
      }
    }
  }, [records.length, activeFacility?.code]);

  // Extract all distinct Lab Node Codes from dataset & current facility
  const availableNodeCodes = useMemo(() => {
    const codes = new Set<string>();
    if (activeFacility?.code) codes.add(activeFacility.code);
    records.forEach(r => {
      if (r.facility?.code) codes.add(r.facility.code);
      if (r.deviceId && r.deviceId.includes('-')) codes.add(r.deviceId);
    });
    return Array.from(codes);
  }, [records, activeFacility?.code]);

  // 1. CALCULATE HYBRID V3.0 TOP-LEVEL KPIS
  const kpis = useMemo(() => {
    const total = records.length;
    const positiveRecords = records.filter(r => r.result.parasiteDetected);
    const positive = positiveRecords.length;
    const negative = total - positive;
    const positivityRate = total > 0 ? parseFloat(((positive / total) * 100).toFixed(1)) : 0;
    
    // Average parasite density among positive records
    const totalDensity = positiveRecords.reduce((sum, r) => sum + r.result.density, 0);
    const avgDensity = positive > 0 ? Math.round(totalDensity / positive) : 0;

    // Severe Malarial Anemia Count (Hb < 7.0 g/dL)
    const severeAnemia = records.filter(r => r.hbResult && r.hbResult.hbValue < 7.0).length;

    // G6PD Deficiency Count (<30% activity)
    const g6pdDeficient = records.filter(r => r.g6pdResult && r.g6pdResult.status.includes('Deficient')).length;

    // Molecular Tests with K13 Mutation
    const k13Mutations = records.filter(r => r.molecularResult && r.molecularResult.k13MutationDetected).length;

    return { total, positive, negative, positivityRate, avgDensity, severeAnemia, g6pdDeficient, k13Mutations };
  }, [records]);

  // 2. COMPUTE SPECIES DISTRIBUTION
  const speciesData = useMemo(() => {
    const counts: Record<string, number> = {
      'Plasmodium falciparum': 0,
      'Plasmodium vivax': 0,
      'Plasmodium malariae': 0,
      'Plasmodium ovale': 0
    };

    records.forEach(r => {
      if (r.result.parasiteDetected && counts[r.result.species] !== undefined) {
        counts[r.result.species]++;
      }
    });

    const colors = ['#f43f5e', '#f59e0b', '#06b6d4', '#a855f7'];

    return Object.keys(counts)
      .map((key, i) => ({
        name: key.replace('Plasmodium ', 'P. '),
        value: counts[key],
        color: colors[i]
      }))
      .filter(item => item.value > 0);
  }, [records]);

  // 3. COMPUTE OUTBREAK & ANEMIA TRENDS OVER PAST 30 DAYS
  const trendData = useMemo(() => {
    const dailyMap: Record<string, { date: string; Positive: number; SevereAnemia: number; timestamp: number }> = {};
    
    records.forEach(r => {
      const dateObj = new Date(r.timestamp);
      const dateKey = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          Positive: 0,
          SevereAnemia: 0,
          timestamp: dateObj.getTime()
        };
      }
      
      if (r.result.parasiteDetected) {
        dailyMap[dateKey].Positive++;
      }
      if (r.hbResult && r.hbResult.hbValue < 7.0) {
        dailyMap[dateKey].SevereAnemia++;
      }
    });

    return Object.values(dailyMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-15);
  }, [records]);

  // 4. COMPUTE REGIONAL CLINIC HOTSPOTS
  const hotspots = useMemo(() => {
    const clinics: Record<string, { total: number; positive: number; severeAnemia: number }> = {};
    
    records.forEach(r => {
      const cId = r.patient.clinicId || r.facility?.name || 'Gboko Reference Lab';
      if (!clinics[cId]) {
        clinics[cId] = { total: 0, positive: 0, severeAnemia: 0 };
      }
      clinics[cId].total++;
      if (r.result.parasiteDetected) {
        clinics[cId].positive++;
      }
      if (r.hbResult && r.hbResult.hbValue < 7.0) {
        clinics[cId].severeAnemia++;
      }
    });

    return Object.keys(clinics).map(name => {
      const clinic = clinics[name];
      const rate = clinic.total > 0 ? parseFloat(((clinic.positive / clinic.total) * 100).toFixed(1)) : 0;
      
      let riskTier: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
      let riskColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      if (rate >= 40) {
        riskTier = 'HIGH';
        riskColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      } else if (rate >= 20) {
        riskTier = 'MODERATE';
        riskColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      }

      return { name, total: clinic.total, positive: clinic.positive, severeAnemia: clinic.severeAnemia, rate, riskTier, riskColor };
    }).sort((a, b) => b.rate - a.rate);
  }, [records]);

  // 5. LEDGER FILTERING (with Lab Node Code parameter support)
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || (
        r.patient.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.facility?.code && r.facility.code.toLowerCase().includes(q)) ||
        (r.facility?.name && r.facility.name.toLowerCase().includes(q)) ||
        (r.patient.ninOrHospitalNo && r.patient.ninOrHospitalNo.toLowerCase().includes(q)) ||
        r.deviceId.toLowerCase().includes(q)
      );
        
      const matchesSpecies = 
        speciesFilter === 'ALL' ||
        (speciesFilter === 'POSITIVE' && r.result.parasiteDetected) ||
        (speciesFilter === 'NEGATIVE' && !r.result.parasiteDetected) ||
        (speciesFilter === 'SEVERE_ANEMIA' && r.hbResult && r.hbResult.hbValue < 7.0) ||
        r.result.species.toLowerCase().includes(speciesFilter.toLowerCase());

      const matchesNode = 
        nodeCodeFilter === 'ALL' ||
        (r.facility?.code && r.facility.code.toUpperCase() === nodeCodeFilter.toUpperCase()) ||
        (r.deviceId && r.deviceId.toUpperCase() === nodeCodeFilter.toUpperCase());

      return matchesSearch && matchesSpecies && matchesNode;
    });
  }, [records, searchTerm, speciesFilter, nodeCodeFilter]);

  // QUICK EXPORT HANDLERS (Local CSV/JSON export)
  const handleQuickExportJson = (scope: 'filtered' | 'all') => {
    const target = scope === 'filtered' ? filteredRecords : records;
    const pkg = generateDatabaseBackupPackage(target, activeFacility, technician);
    const facCode = activeFacility?.code || 'FAC';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `AIMalScan_Diagnostic_DB_${facCode}_${dateStr}_${target.length}cases.json`;
    triggerFileDownload(JSON.stringify(pkg, null, 2), filename, 'application/json');
    setExportFeedback(`Exported ${target.length} records to JSON backup archive.`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  const handleQuickExportCsv = (scope: 'filtered' | 'all') => {
    const target = scope === 'filtered' ? filteredRecords : records;
    const csv = generateSurveillanceCsv(target, activeFacility);
    const facCode = activeFacility?.code || 'FAC';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `AIMalScan_Surveillance_Ledger_${facCode}_${dateStr}_${target.length}cases.csv`;
    triggerFileDownload(csv, filename, 'text/csv;charset=utf-8;');
    setExportFeedback(`Exported ${target.length} records to CSV spreadsheet.`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  return (
    <div id="surveillance-dashboard-container" className="space-y-6 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                National & Regional Malaria Surveillance Hub
              </h2>
              <span className="text-[9px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/40 font-bold uppercase">
                {activeFacility?.code || 'GBK-NODE-01'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Aggregated epidemiology: Parasitemia trends, severe malarial anemia, G6PD deficiency, and molecular resistance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <span className="text-slate-500">DATABASE:</span>
            <span className="text-teal-400 font-bold">{records.length} CASSETTE CASES</span>
          </div>

          <button
            id="open-database-backup-portal-btn"
            onClick={() => setShowBackupModal(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-mono font-black transition-all shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <HardDrive className="h-4 w-4" />
            <span>Automated DB & USB Backup</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs: Surveillance Hub vs Audit Trail */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          id="tab-surveillance-overview"
          onClick={() => setActiveSubTab('surveillance')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            activeSubTab === 'surveillance'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>Surveillance & Outbreak Analytics</span>
          <span className="bg-slate-950 px-1.5 py-0.5 rounded text-[10px] text-teal-400 border border-slate-800 font-normal">
            {records.length}
          </span>
        </button>

        <button
          id="tab-audit-trail"
          onClick={() => setActiveSubTab('audit_trail')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            activeSubTab === 'audit_trail'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Sync & Offline Audit Trail</span>
          <span className="bg-slate-950 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 border border-slate-800 font-normal">
            TRACEABLE
          </span>
        </button>
      </div>

      {/* TAB CONTENT 1: SURVEILLANCE & OUTBREAK ANALYTICS */}
      {activeSubTab === 'surveillance' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* Total Tested */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Total Tests Run</span>
              <div className="text-2xl font-mono font-black text-white">{kpis.total}</div>
              <div className="text-[10px] text-teal-400 font-mono">{kpis.positive} Positive Cases</div>
            </div>

            {/* Positivity Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Malaria Positivity</span>
              <div className="text-2xl font-mono font-black text-rose-400">{kpis.positivityRate}%</div>
              <div className="text-[10px] text-slate-400 font-mono">Benchmark: &lt;25%</div>
            </div>

            {/* Severe Anemia (<7g/dL) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Severe Anemia Cases</span>
              <div className="text-2xl font-mono font-black text-amber-400">{kpis.severeAnemia}</div>
              <div className="text-[10px] text-amber-300/80 font-mono">Hb &lt; 7.0 g/dL (Transfuse)</div>
            </div>

            {/* G6PD Deficiency */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">G6PD Deficient (&lt;30%)</span>
              <div className="text-2xl font-mono font-black text-indigo-400">{kpis.g6pdDeficient}</div>
              <div className="text-[10px] text-indigo-300/80 font-mono">Primaquine Safety Locked</div>
            </div>

            {/* Avg Parasite Density */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Mean Parasitemia</span>
              <div className="text-2xl font-mono font-black text-teal-300">{kpis.avgDensity.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-mono">parasites / µL</div>
            </div>

          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Outbreak & Anemia Trend Curve */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Outbreak Trajectory & Severe Anemia Burden
                  </h3>
                  <p className="text-[11px] text-slate-400">Longitudinal infection count vs hemolytic emergency cases</p>
                </div>
                <div className="flex items-center space-x-3 text-[10px] font-mono">
                  <span className="flex items-center space-x-1 text-rose-400">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                    <span>Positives</span>
                  </span>
                  <span className="flex items-center space-x-1 text-amber-400">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                    <span>Hb &lt; 7.0 g/dL</span>
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                {trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No longitudinal case trends recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#f8fafc' }}
                      />
                      <Line type="monotone" dataKey="Positive" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="SevereAnemia" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Species Ratio Donut Chart */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Plasmodium Species Distribution
                </h3>
                <p className="text-[11px] text-slate-400">Microscopy species proportion</p>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {speciesData.length === 0 ? (
                  <div className="text-slate-500 text-xs">No species verified yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={speciesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {speciesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-slate-800/80">
                {speciesData.map(item => (
                  <div key={item.name} className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-300 font-bold">{item.name}:</span>
                    <span className="text-slate-400">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* REGIONAL HEALTH FACILITY HOTSPOTS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-teal-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Regional Facility & Community Clinic Outbreak Hotspots
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Ranked by Positivity %</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {hotspots.slice(0, 4).map(spot => (
                <div key={spot.name} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="font-bold text-xs text-white truncate max-w-[150px]" title={spot.name}>
                      {spot.name}
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${spot.riskColor}`}>
                      {spot.riskTier}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-mono font-black text-slate-100">{spot.rate}%</div>
                    <div className="text-[10px] text-slate-400 font-mono">Positivity Rate</div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
                    <span>Total: {spot.total} | Pos: {spot.positive}</span>
                    <span className="text-amber-400">Anemia: {spot.severeAnemia}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMPREHENSIVE CASE LEDGER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
            
            {/* Ledger Header, Filters & Offline Export Toolbar */}
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      4-in-1 Hybrid Diagnostic Surveillance Ledger
                    </h3>
                    <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-teal-400 font-bold border border-slate-800">
                      {filteredRecords.length} / {records.length} CASSETTES
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Unified longitudinal clinical record database with offline USB export</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search patient, ID, Node Code..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Lab Node Code Filter Parameter */}
                  <select
                    id="ledger-node-code-filter"
                    value={nodeCodeFilter}
                    onChange={e => setNodeCodeFilter(e.target.value)}
                    className="bg-slate-950 border border-teal-500/30 text-teal-300 font-mono font-bold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-400"
                    title="Filter records by specific Lab Node Code"
                  >
                    <option value="ALL">All Lab Nodes</option>
                    {activeFacility?.code && (
                      <option value={activeFacility.code}>Active: {activeFacility.code}</option>
                    )}
                    {availableNodeCodes
                      .filter(c => c !== activeFacility?.code)
                      .map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                  </select>

                  {/* Filter Pills */}
                  <select
                    value={speciesFilter}
                    onChange={e => setSpeciesFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">All Diagnoses</option>
                    <option value="POSITIVE">Positive Only</option>
                    <option value="NEGATIVE">Negative Only</option>
                    <option value="SEVERE_ANEMIA">Severe Anemia (&lt;7g/dL)</option>
                    <option value="falciparum">P. falciparum</option>
                    <option value="vivax">P. vivax</option>
                    <option value="malariae">P. malariae</option>
                  </select>
                </div>
              </div>

              {/* Quick Export Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-2 px-5 py-2.5">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-slate-300">Automated Local DB:</span>
                  </span>
                  <span>{records.length} records verified • {lastAutoBackupTime ? `Snapshot ${new Date(lastAutoBackupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Zero-Cloud Safe'}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    id="quick-export-csv-btn"
                    onClick={() => handleQuickExportCsv('filtered')}
                    className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="Export current view to Excel-compatible CSV with UTF-8 BOM"
                  >
                    <FileSpreadsheet className="h-3 w-3" />
                    <span>Export CSV ({filteredRecords.length})</span>
                  </button>

                  <button
                    id="quick-export-json-btn"
                    onClick={() => handleQuickExportJson('filtered')}
                    className="px-2.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="Export current view to structured JSON archive"
                  >
                    <FileJson className="h-3 w-3" />
                    <span>Export JSON ({filteredRecords.length})</span>
                  </button>

                  <button
                    id="open-database-modal-from-ledger-btn"
                    onClick={() => setShowBackupModal(true)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="Open automated backup scheduler & USB storage restore portal"
                  >
                    <HardDrive className="h-3 w-3 text-teal-400" />
                    <span>USB & DB Backup Portal</span>
                  </button>

                  <button
                    id="switch-to-audit-trail-btn"
                    onClick={() => setActiveSubTab('audit_trail')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="View timestamped history of all offline-to-online syncs"
                  >
                    <History className="h-3 w-3" />
                    <span>Sync Audit Trail</span>
                  </button>
                </div>
              </div>

              {exportFeedback && (
                <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-300 text-xs flex items-center space-x-2 animate-fade-in font-mono">
                  <Check className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span>{exportFeedback}</span>
                </div>
              )}
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Case ID / Date</th>
                    <th className="p-3">Lab Node Code</th>
                    <th className="p-3">Patient Details</th>
                    <th className="p-3">1. AI Microscopy</th>
                    <th className="p-3">2. RDT Ag</th>
                    <th className="p-3">3. Hb / PCV</th>
                    <th className="p-3">4. G6PD Safety</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No diagnostic records found matching the specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-850/50 transition-colors">
                        
                        {/* ID / Date */}
                        <td className="p-3">
                          <div className="font-bold text-white text-xs">{rec.id}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(rec.timestamp).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Lab Node Code Column */}
                        <td className="p-3">
                          <div className="inline-flex items-center space-x-1.5 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded text-[11px] font-bold text-teal-300 font-mono">
                            <span>{rec.facility?.code || rec.deviceId || 'GBK-NODE-01'}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-sans truncate max-w-[140px] mt-0.5">
                            {rec.facility?.name || rec.patient.clinicId || 'Diagnostic Lab'}
                          </div>
                        </td>

                        {/* Patient */}
                        <td className="p-3">
                          <div className="font-sans font-bold text-slate-200">{rec.patient.name}</div>
                          <div className="text-[10px] text-slate-500 font-sans">
                            {rec.patient.age}y • {rec.patient.gender} • {rec.patient.ninOrHospitalNo ? `NIN: ${rec.patient.ninOrHospitalNo}` : 'Walk-in'}
                          </div>
                        </td>

                        {/* Microscopy */}
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.result.parasiteDetected 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {rec.result.species.replace('Plasmodium ', 'P. ')}
                          </span>
                          {rec.result.parasiteDetected && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {rec.result.density.toLocaleString()} /µL
                            </div>
                          )}
                        </td>

                        {/* RDT */}
                        <td className="p-3">
                          <span className="text-slate-300 text-[11px]">
                            {rec.rdtResult?.interpretation || 'Tested'}
                          </span>
                          <div className="text-[9px] text-slate-500">
                            {rec.rdtResult?.concordanceStatus || 'Concordant'}
                          </div>
                        </td>

                        {/* Hb / PCV */}
                        <td className="p-3">
                          <div className="font-bold text-white">
                            {rec.hbResult?.hbValue || '--'} <span className="text-[10px] text-slate-400 font-normal">g/dL</span>
                          </div>
                          <div className={`text-[9px] ${rec.hbResult && rec.hbResult.hbValue < 7.0 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                            {rec.hbResult?.anemiaSeverity || 'Normal'}
                          </div>
                        </td>

                        {/* G6PD */}
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                            rec.g6pdResult?.status.includes('Normal') ? 'bg-emerald-500/15 text-emerald-300' :
                            rec.g6pdResult?.status.includes('Deficient') ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-500'
                          }`}>
                            {rec.g6pdResult?.status || 'N/A'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => setPrintRecord(rec)}
                            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-teal-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            title="Print Official Dossier"
                          >
                            Print A4
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT 2: OFFLINE-TO-ONLINE AUDIT TRAIL */}
      {activeSubTab === 'audit_trail' && (
        <AuditTrailSection 
          activeFacility={activeFacility}
          technician={technician}
          availableNodeCodes={availableNodeCodes}
          initialNodeFilter={nodeCodeFilter !== 'ALL' ? nodeCodeFilter : 'ALL'}
        />
      )}

      {/* Print Dossier Modal Preview */}
      {printRecord && (
        <PrintReportDossier
          record={printRecord}
          facility={activeFacility}
          technician={printRecord.technician}
          onClose={() => setPrintRecord(null)}
        />
      )}

      {/* Database Backup, Automated Snapshots & USB Portal Modal */}
      {showBackupModal && (
        <DatabaseBackupModal
          records={records}
          filteredRecords={filteredRecords}
          activeFacility={activeFacility}
          technician={technician}
          onRestoreRecords={onRestoreRecords}
          onClose={() => setShowBackupModal(false)}
        />
      )}

    </div>
  );
}
