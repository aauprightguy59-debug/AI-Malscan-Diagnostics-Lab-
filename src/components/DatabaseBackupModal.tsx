/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Download, Upload, HardDrive, FileJson, FileSpreadsheet, 
  ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, Clock, 
  Copy, Check, Trash2, ArrowDownCircle, ExternalLink, X, Info
} from 'lucide-react';
import { DiagnosticRecord, LabFacility, ChiefTechnician } from '../types';
import { 
  generateDatabaseBackupPackage, 
  generateSurveillanceCsv, 
  triggerFileDownload,
  saveAutomatedDatabaseSnapshot,
  getAutomatedBackupHistory,
  validateImportedBackup,
  AutoBackupSnapshot
} from '../lib/exportUtils';

interface DatabaseBackupModalProps {
  records: DiagnosticRecord[];
  filteredRecords?: DiagnosticRecord[];
  activeFacility?: LabFacility;
  technician?: ChiefTechnician;
  onRestoreRecords?: (restoredRecords: DiagnosticRecord[], mode: 'merge' | 'replace') => void;
  onClose: () => void;
}

export default function DatabaseBackupModal({
  records,
  filteredRecords,
  activeFacility,
  technician,
  onRestoreRecords,
  onClose
}: DatabaseBackupModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'automated' | 'import'>('export');
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  const [backupHistory, setBackupHistory] = useState<AutoBackupSnapshot[]>([]);
  const [lastAutoTime, setLastAutoTime] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [snapshotSuccessMsg, setSnapshotSuccessMsg] = useState<string | null>(null);

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    valid: boolean;
    records?: DiagnosticRecord[];
    error?: string;
    facility?: LabFacility;
    stats?: { total: number; positive: number; dateRange: string };
  } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load auto backup history on mount
  useEffect(() => {
    loadHistory();
    const storedTime = localStorage.getItem('aimalscan_last_auto_backup_time');
    setLastAutoTime(storedTime);
  }, []);

  const loadHistory = () => {
    const history = getAutomatedBackupHistory();
    setBackupHistory(history);
  };

  const getTargetRecords = () => {
    if (exportScope === 'filtered' && filteredRecords && filteredRecords.length > 0) {
      return filteredRecords;
    }
    return records;
  };

  // 1. EXPORT AS JSON
  const handleExportJson = () => {
    const target = getTargetRecords();
    const backupPkg = generateDatabaseBackupPackage(target, activeFacility, technician);
    const jsonStr = JSON.stringify(backupPkg, null, 2);
    const facCode = activeFacility?.code || 'FAC';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `AIMalScan_Diagnostic_DB_${facCode}_${dateStr}_${target.length}cases.json`;
    
    triggerFileDownload(jsonStr, filename, 'application/json');
  };

  // 2. EXPORT AS CSV
  const handleExportCsv = () => {
    const target = getTargetRecords();
    const csvStr = generateSurveillanceCsv(target, activeFacility);
    const facCode = activeFacility?.code || 'FAC';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `AIMalScan_Surveillance_Ledger_${facCode}_${dateStr}_${target.length}cases.csv`;
    
    triggerFileDownload(csvStr, filename, 'text/csv;charset=utf-8;');
  };

  // 3. COPY JSON TO CLIPBOARD
  const handleCopyJson = () => {
    const target = getTargetRecords();
    const backupPkg = generateDatabaseBackupPackage(target, activeFacility, technician);
    const jsonStr = JSON.stringify(backupPkg, null, 2);
    
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  // 4. CREATE MANUAL AUTOMATED SNAPSHOT
  const handleCreateSnapshot = () => {
    setIsCreatingSnapshot(true);
    setTimeout(() => {
      const snap = saveAutomatedDatabaseSnapshot(records, activeFacility, technician);
      if (snap) {
        loadHistory();
        setLastAutoTime(snap.timestamp);
        setSnapshotSuccessMsg(`Automated recovery snapshot saved successfully (${records.length} cases verified).`);
        setTimeout(() => setSnapshotSuccessMsg(null), 4000);
      }
      setIsCreatingSnapshot(false);
    }, 400);
  };

  // 5. DOWNLOAD INDIVIDUAL SNAPSHOT
  const handleDownloadSnapshot = (snap: AutoBackupSnapshot) => {
    const jsonStr = JSON.stringify(snap.data, null, 2);
    const dateFormatted = snap.timestamp.replace(/[:.]/g, '-');
    const filename = `AIMalScan_Snapshot_${snap.facilityCode || 'FAC'}_${dateFormatted}.json`;
    triggerFileDownload(jsonStr, filename, 'application/json');
  };

  // 6. HANDLE IMPORT FILE CHANGE
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateImportedBackup(parsed);

        if (!validation.valid || !validation.records) {
          setImportPreview({
            valid: false,
            error: validation.error || 'Failed to validate backup schema.'
          });
          return;
        }

        const recs = validation.records;
        const positiveCount = recs.filter(r => r.result.parasiteDetected).length;
        
        // Calculate date range
        let dateRange = 'Unknown';
        if (recs.length > 0) {
          const timestamps = recs.map(r => new Date(r.timestamp).getTime()).filter(t => !isNaN(t));
          if (timestamps.length > 0) {
            const minDate = new Date(Math.min(...timestamps)).toLocaleDateString();
            const maxDate = new Date(Math.max(...timestamps)).toLocaleDateString();
            dateRange = `${minDate} - ${maxDate}`;
          }
        }

        setImportPreview({
          valid: true,
          records: recs,
          facility: parsed.facility,
          stats: {
            total: recs.length,
            positive: positiveCount,
            dateRange
          }
        });

      } catch (err: any) {
        setImportPreview({
          valid: false,
          error: `JSON Parsing error: ${err.message || 'Corrupted file content'}`
        });
      }
    };

    reader.readAsText(file);
  };

  // 7. EXECUTE RESTORE / IMPORT
  const handleExecuteRestore = () => {
    if (!importPreview?.records || !onRestoreRecords) return;

    onRestoreRecords(importPreview.records, importMode);
    setImportSuccessMsg(
      `Successfully ${importMode === 'merge' ? 'merged' : 'restored'} ${importPreview.records.length} records into the active database!`
    );
    setImportPreview(null);
    setImportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Refresh history
    setTimeout(() => {
      saveAutomatedDatabaseSnapshot(records, activeFacility, technician);
      loadHistory();
    }, 500);
  };

  const targetCount = getTargetRecords().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        id="database-backup-modal-card"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
      >
        {/* MODAL HEADER */}
        <div className="bg-slate-950/80 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                  Local Database Backup & USB Storage Portal
                </h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  OFFLINE CAPABLE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Zero-cloud local exports, automated snapshot snapshots, and external USB drive restores
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>USB & File Export (JSON / CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('automated')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'automated'
                ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Automated Database Engine</span>
            {backupHistory.length > 0 && (
              <span className="text-[9px] font-mono bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded-full font-bold">
                {backupHistory.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Restore / Import from USB</span>
          </button>
        </div>

        {/* TAB 1: EXPORT (JSON / CSV / USB) */}
        {activeTab === 'export' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            
            {/* Scope Selection Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Select Export Scope:
                </span>
                <span className="text-[11px] font-mono text-teal-400 font-bold">
                  {targetCount} Records Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  exportScope === 'all' 
                    ? 'bg-teal-500/10 border-teal-500/40 text-slate-200' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                    className="mt-0.5 text-teal-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-white text-xs">All Database Records ({records.length})</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      Full repository backup covering all historical and active diagnostic cases.
                    </p>
                  </div>
                </label>

                <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  exportScope === 'filtered' 
                    ? 'bg-teal-500/10 border-teal-500/40 text-slate-200' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'filtered'}
                    onChange={() => setExportScope('filtered')}
                    className="mt-0.5 text-teal-500 focus:ring-0"
                    disabled={!filteredRecords || filteredRecords.length === records.length}
                  />
                  <div>
                    <div className="font-bold text-white text-xs">
                      Filtered Ledger Set ({filteredRecords ? filteredRecords.length : 0})
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      Only records matching active search terms and epidemiological filters.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Export Format Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Full JSON Backup */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-teal-500/40 transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2.5 text-teal-400">
                    <FileJson className="h-5 w-5" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Structured JSON Archive
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    100% loss-less database backup containing all optical microscopy AI scores, RDT digital readouts, HemoCue values, G6PD enzymatic levels, molecular markers, patient demographics, and technician digital signatures.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    Format: <span className="text-teal-300">.json</span> (AI-MalScan Schema v3.0)
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    id="export-json-btn"
                    onClick={handleExportJson}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download JSON Backup</span>
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer shrink-0"
                    title="Copy Raw JSON to Clipboard"
                  >
                    {copySuccess ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Card 2: Tabular CSV Spreadsheet */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-teal-500/40 transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2.5 text-emerald-400">
                    <FileSpreadsheet className="h-5 w-5" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Tabular CSV Spreadsheet
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Standard comma-separated spreadsheet with UTF-8 BOM encoding. Designed for immediate offline import into Microsoft Excel, WHO Epi Info, DHIS2 Sentinel modules, and statistical packages.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    Format: <span className="text-emerald-300">.csv</span> (Excel & DHIS2 Ready)
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="export-csv-btn"
                    onClick={handleExportCsv}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download CSV Spreadsheet</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Offline USB Protocol Info */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start space-x-3">
              <HardDrive className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-white">External USB Storage Protocol</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Technicians operating in off-grid sentinel facilities (e.g. IDP camps or rural PHCs) should copy downloaded JSON and CSV archives to dedicated laboratory USB storage drives at the end of each shift to ensure audit compliance under MLSCN guidelines.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: AUTOMATED DATABASE ENGINE */}
        {activeTab === 'automated' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            
            {/* Engine Overview Banner */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white uppercase">Automated In-Memory & Local Database</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Continuous local state protection with versioned recovery snapshots
                  </p>
                </div>
              </div>

              <button
                onClick={handleCreateSnapshot}
                disabled={isCreatingSnapshot}
                className="bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isCreatingSnapshot ? 'animate-spin' : ''}`} />
                <span>{isCreatingSnapshot ? 'Saving Snapshot...' : 'Create Snapshot Now'}</span>
              </button>
            </div>

            {snapshotSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{snapshotSuccessMsg}</span>
              </div>
            )}

            {/* Health & Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Protected Cases</span>
                <div className="text-xl font-mono font-bold text-white mt-1">{records.length}</div>
                <div className="text-[9px] text-teal-400 font-mono mt-0.5">100% In-Memory Sync</div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Auto Snapshots</span>
                <div className="text-xl font-mono font-bold text-teal-300 mt-1">{backupHistory.length}</div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">Max 5 Local Rollbacks</div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Last Snapshot</span>
                <div className="text-xs font-mono font-bold text-slate-200 mt-1 truncate">
                  {lastAutoTime ? new Date(lastAutoTime).toLocaleTimeString() : 'Current Session'}
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                  {lastAutoTime ? new Date(lastAutoTime).toLocaleDateString() : 'Auto Active'}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Storage Mode</span>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-1">Zero-Cloud Resilient</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Encrypted Local Engine</div>
              </div>
            </div>

            {/* Snapshot Recovery Points List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Recent Database Recovery Snapshots:
                </span>
                <span className="text-[10px] font-mono text-slate-500">Stored on Workstation</span>
              </div>

              {backupHistory.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-500 text-xs font-mono">
                  No automated snapshots recorded yet. Click "Create Snapshot Now" above to generate your first recovery checkpoint.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono">
                  {backupHistory.map((snap, idx) => (
                    <div key={snap.id || idx} className="p-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            Snapshot: {new Date(snap.timestamp).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {snap.recordCount} records ({snap.positiveCount} positive) • ~{Math.round(snap.sizeBytes / 1024)} KB
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadSnapshot(snap)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                          title="Save this snapshot to USB"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: RESTORE / IMPORT FROM USB */}
        {activeTab === 'import' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            
            {importSuccessMsg && (
              <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-bold">{importSuccessMsg}</span>
              </div>
            )}

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Select Backup Archive File (.json) from USB Drive
                </h3>
                <p className="text-[11px] text-slate-400">
                  Upload an exported AI-MalScan JSON backup file to import cases into this workstation's local database.
                </p>
              </div>

              {/* Upload Dropzone / Button */}
              <div className="border-2 border-dashed border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 text-center space-y-3 bg-slate-900/40 transition-all">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileSelected}
                  className="hidden"
                  id="backup-file-upload-input"
                />
                <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs">
                    {importFile ? importFile.name : 'Click to Browse or Drag USB Backup File Here'}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Supports .json backup packages generated by AI-MalScan Suite
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition-all"
                >
                  Choose File from USB
                </button>
              </div>
            </div>

            {/* Validation & Preview Result */}
            {importPreview && (
              <div className={`p-4 rounded-2xl border ${
                importPreview.valid 
                  ? 'bg-slate-950 border-teal-500/40 space-y-4' 
                  : 'bg-rose-500/10 border-rose-500/30 space-y-2'
              }`}>
                {!importPreview.valid ? (
                  <div className="flex items-center space-x-2 text-rose-400 font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Import Error: {importPreview.error}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2 text-teal-400 font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Valid AI-MalScan Backup Package Detected</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Date Range: {importPreview.stats?.dateRange}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Total Cases:</span>
                        <div className="font-bold text-white text-sm">{importPreview.stats?.total}</div>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Positive Malaria:</span>
                        <div className="font-bold text-rose-400 text-sm">{importPreview.stats?.positive}</div>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-slate-500 text-[10px]">Origin Facility:</span>
                        <div className="font-bold text-teal-300 truncate">
                          {importPreview.facility?.name || 'External Lab'}
                        </div>
                      </div>
                    </div>

                    {/* Merge vs Replace Mode */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Restore Execution Mode:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className={`flex items-start space-x-2 p-2.5 rounded-xl border cursor-pointer ${
                          importMode === 'merge'
                            ? 'bg-teal-500/10 border-teal-500/40 text-slate-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}>
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                            className="mt-0.5 text-teal-500"
                          />
                          <div>
                            <div className="font-bold text-white text-xs">Merge & Sync (Recommended)</div>
                            <div className="text-[10px] text-slate-400">
                              Appends new cases and updates existing matching IDs without losing local scans.
                            </div>
                          </div>
                        </label>

                        <label className={`flex items-start space-x-2 p-2.5 rounded-xl border cursor-pointer ${
                          importMode === 'replace'
                            ? 'bg-rose-500/10 border-rose-500/40 text-slate-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}>
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'replace'}
                            onChange={() => setImportMode('replace')}
                            className="mt-0.5 text-rose-500"
                          />
                          <div>
                            <div className="font-bold text-white text-xs">Full Database Replace</div>
                            <div className="text-[10px] text-slate-400">
                              Overwrites current ledger entirely with the imported archive.
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleExecuteRestore}
                        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Confirm and Restore {importPreview.stats?.total} Diagnostic Cases</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-teal-400"></span>
            <span>Local Database Resilient (Zero Internet Required)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold transition-all cursor-pointer"
          >
            Close Portal
          </button>
        </div>

      </div>
    </div>
  );
}
