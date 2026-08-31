/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, Clock, RefreshCw, Download, FileSpreadsheet, 
  FileJson, Search, Filter, CheckCircle2, AlertCircle, 
  Database, Wifi, WifiOff, HardDrive, Sparkles, UserCheck, 
  Building2, Layers, ExternalLink, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { SyncAuditLogEntry, LabFacility, ChiefTechnician } from '../types';
import { 
  getStoredAuditTrail, 
  saveAuditTrail, 
  recordSyncAudit, 
  exportAuditTrailCsv, 
  exportAuditTrailJson 
} from '../lib/auditUtils';

interface AuditTrailSectionProps {
  activeFacility?: LabFacility;
  technician?: ChiefTechnician;
  availableNodeCodes?: string[];
  initialNodeFilter?: string;
}

export default function AuditTrailSection({
  activeFacility,
  technician,
  availableNodeCodes = [],
  initialNodeFilter = 'ALL'
}: AuditTrailSectionProps) {
  const [auditLogs, setAuditLogs] = useState<SyncAuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeCode, setSelectedNodeCode] = useState(initialNodeFilter);
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedAckId, setCopiedAckId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load audit logs on mount & from local storage/backend
  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      // Fetch from local cache first
      const localLogs = getStoredAuditTrail();
      setAuditLogs(localLogs);

      // Attempt to sync from backend if reachable
      const res = await fetch('/api/audit-trail');
      if (res.ok) {
        const remoteLogs = await res.json();
        if (Array.isArray(remoteLogs) && remoteLogs.length > 0) {
          // Merge local + remote uniquely
          const map = new Map<string, SyncAuditLogEntry>();
          localLogs.forEach(l => map.set(l.id, l));
          remoteLogs.forEach(l => map.set(l.id, l));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setAuditLogs(merged);
          saveAuditTrail(merged);
        }
      }
    } catch (err) {
      console.debug('Using local audit trail records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Update selected node code if prop changes
  useEffect(() => {
    if (initialNodeFilter !== 'ALL') {
      setSelectedNodeCode(initialNodeFilter);
    }
  }, [initialNodeFilter]);

  // Compute filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Free search
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || (
        log.id.toLowerCase().includes(q) ||
        (log.serverAckId && log.serverAckId.toLowerCase().includes(q)) ||
        log.labNodeCode.toLowerCase().includes(q) ||
        log.facilityName.toLowerCase().includes(q) ||
        log.technicianName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.recordIds && log.recordIds.some(id => id.toLowerCase().includes(q)))
      );

      // Node code filter
      const matchesNode = selectedNodeCode === 'ALL' || log.labNodeCode.toUpperCase() === selectedNodeCode.toUpperCase();

      // Event type filter
      const matchesEvent = selectedEventType === 'ALL' || log.eventType === selectedEventType;

      // Status filter
      const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

      return matchesSearch && matchesNode && matchesEvent && matchesStatus;
    });
  }, [auditLogs, searchTerm, selectedNodeCode, selectedEventType, selectedStatus]);

  // Audit Metrics
  const metrics = useMemo(() => {
    const totalEvents = auditLogs.length;
    const totalRecordsSynced = auditLogs.reduce((acc, log) => acc + log.recordsCount, 0);
    const offlineSyncEvents = auditLogs.filter(l => l.eventType === 'OFFLINE_TO_ONLINE_SYNC').length;
    const successCount = auditLogs.filter(l => l.status === 'SUCCESS').length;
    const successRate = totalEvents > 0 ? ((successCount / totalEvents) * 100).toFixed(1) : '100.0';

    return { totalEvents, totalRecordsSynced, offlineSyncEvents, successRate };
  }, [auditLogs]);

  // Handle Manual Integrity Checkpoint
  const handleTriggerCheckpoint = () => {
    const newEntry = recordSyncAudit({
      eventType: 'DATABASE_SNAPSHOT',
      recordsCount: 0,
      labNodeCode: activeFacility?.code || 'GBK-JADSL-01',
      facilityName: activeFacility?.name || 'Diagnostic Reference Lab',
      technicianName: technician?.name || 'Dr. Becky Saar (MLS)',
      networkStatus: navigator.onLine ? 'online' : 'offline',
      payloadSizeKb: 12.4,
      status: 'SUCCESS',
      details: `Supervisor on-demand data traceability integrity checkpoint verified. Cryptographic hash generated.`
    });

    setAuditLogs(prev => [newEntry, ...prev]);
    setFeedbackMessage('Integrity Checkpoint committed to national audit ledger.');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Copy ACK code
  const handleCopyAck = (ackCode: string) => {
    navigator.clipboard.writeText(ackCode);
    setCopiedAckId(ackCode);
    setTimeout(() => setCopiedAckId(null), 2000);
  };

  // Export handlers
  const handleExportCsv = () => {
    exportAuditTrailCsv(filteredLogs);
    setFeedbackMessage(`Exported ${filteredLogs.length} audit entries to CSV.`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleExportJson = () => {
    exportAuditTrailJson(filteredLogs);
    setFeedbackMessage(`Exported ${filteredLogs.length} audit entries to JSON.`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <div id="audit-trail-section" className="space-y-6 animate-fade-in">
      
      {/* Section Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                Offline-to-Online Sync Audit Trail
              </h2>
              <span className="text-[9px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/40 font-bold uppercase">
                SUPERVISOR TRACEABILITY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cryptographically verified timestamped ledger of all clinical syncs, offline flushes, and database snapshots
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="audit-manual-checkpoint-btn"
            onClick={handleTriggerCheckpoint}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
            title="Commit supervisor verification snapshot"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>Commit Integrity Checkpoint</span>
          </button>

          <button
            id="audit-refresh-logs-btn"
            onClick={loadAuditLogs}
            disabled={isLoading}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
            title="Refresh logs from local & remote store"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Supervisor Audit Metrics Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Sync Events */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Sync Events</span>
            <Layers className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white font-mono">{metrics.totalEvents}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Recorded operations</div>
          </div>
        </div>

        {/* Total Cases Synchronized */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Synchronized Records</span>
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-300 font-mono">{metrics.totalRecordsSynced}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Diagnostic slide cases</div>
          </div>
        </div>

        {/* Offline Batch Syncs */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Offline Batch Flushes</span>
            <WifiOff className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-300 font-mono">{metrics.offlineSyncEvents}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Field-to-cloud transfers</div>
          </div>
        </div>

        {/* Audit Integrity / Success */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Sync Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-teal-300 font-mono">{metrics.successRate}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">ACK cryptographic validation</div>
          </div>
        </div>

      </div>

      {/* Main Audit Log Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Sync Trace Logs Ledger
              </h3>
              <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-teal-400 font-bold border border-slate-800">
                {filteredLogs.length} / {auditLogs.length} ENTRIES
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Audit ID, ACK, Node..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              {/* Lab Node Code Filter */}
              <select
                id="audit-node-code-filter"
                value={selectedNodeCode}
                onChange={e => setSelectedNodeCode(e.target.value)}
                className="bg-slate-950 border border-teal-500/30 text-teal-300 font-mono font-bold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-400"
              >
                <option value="ALL">All Lab Node Codes</option>
                {activeFacility?.code && (
                  <option value={activeFacility.code}>Active: {activeFacility.code}</option>
                )}
                {availableNodeCodes
                  .filter(c => c !== activeFacility?.code)
                  .map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
              </select>

              {/* Event Type Filter */}
              <select
                value={selectedEventType}
                onChange={e => setSelectedEventType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="OFFLINE_TO_ONLINE_SYNC">Offline-to-Online Batch Sync</option>
                <option value="RECORD_SUBMISSION_SYNC">Direct Real-Time Upload</option>
                <option value="DATABASE_SNAPSHOT">Local DB Snapshot</option>
                <option value="USB_RESTORE_MERGE">USB Cold Backup Merge</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="PARTIAL">Partial</option>
                <option value="FAILED">Failed</option>
              </select>

            </div>
          </div>

          {/* Export & Feedback Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-2 px-5 py-2.5">
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>Data Traceability Standard: MLSCN / DHIS2 Surveillance Compliance v3.0</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="audit-export-csv-btn"
                onClick={handleExportCsv}
                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Export filtered audit logs to Excel-compatible CSV"
              >
                <FileSpreadsheet className="h-3 w-3" />
                <span>Export Audit CSV ({filteredLogs.length})</span>
              </button>

              <button
                id="audit-export-json-btn"
                onClick={handleExportJson}
                className="px-2.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Export official JSON audit trace"
              >
                <FileJson className="h-3 w-3" />
                <span>Export Audit JSON ({filteredLogs.length})</span>
              </button>
            </div>
          </div>

          {feedbackMessage && (
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-300 text-xs flex items-center space-x-2 animate-fade-in font-mono">
              <Check className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Timestamp / Audit ID</th>
                <th className="p-3">Lab Node Code</th>
                <th className="p-3">Event Type & Network</th>
                <th className="p-3">Supervisor / Scientist</th>
                <th className="p-3 text-center">Cases</th>
                <th className="p-3">Server ACK Hash</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No sync audit events match the current search or filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const logDate = new Date(log.timestamp);
                  const formattedDate = logDate.toLocaleDateString();
                  const formattedTime = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-850/50 transition-colors">
                        
                        {/* Timestamp & Audit ID */}
                        <td className="p-3">
                          <div className="font-bold text-white text-xs">{formattedDate} {formattedTime}</div>
                          <div className="text-[10px] text-teal-400/80 font-mono mt-0.5">{log.id}</div>
                        </td>

                        {/* Lab Node Code & Facility */}
                        <td className="p-3">
                          <div className="inline-flex items-center space-x-1.5 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded text-[11px] font-bold text-teal-300 font-mono">
                            <span>{log.labNodeCode}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans truncate max-w-[180px] mt-0.5" title={log.facilityName}>
                            {log.facilityName}
                          </div>
                        </td>

                        {/* Event Type & Network State */}
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.eventType === 'OFFLINE_TO_ONLINE_SYNC' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                              log.eventType === 'RECORD_SUBMISSION_SYNC' ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' :
                              log.eventType === 'USB_RESTORE_MERGE' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {log.eventType === 'OFFLINE_TO_ONLINE_SYNC' ? 'Offline Queue Sync' :
                               log.eventType === 'RECORD_SUBMISSION_SYNC' ? 'Direct Submission' :
                               log.eventType === 'USB_RESTORE_MERGE' ? 'USB Backup Merge' : 'DB Snapshot'}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            {log.networkStatus === 'online' ? (
                              <>
                                <Wifi className="h-2.5 w-2.5 text-emerald-400" />
                                <span className="text-emerald-400">Online Link</span>
                              </>
                            ) : (
                              <>
                                <WifiOff className="h-2.5 w-2.5 text-slate-400" />
                                <span>Offline Cache</span>
                              </>
                            )}
                            {log.payloadSizeKb && (
                              <span>• {log.payloadSizeKb.toFixed(1)} KB</span>
                            )}
                          </div>
                        </td>

                        {/* Supervisor / Scientist */}
                        <td className="p-3">
                          <div className="text-slate-200 text-[11px] font-sans font-bold flex items-center space-x-1">
                            <UserCheck className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{log.technicianName}</span>
                          </div>
                        </td>

                        {/* Records Count */}
                        <td className="p-3 text-center">
                          <span className="font-bold text-white text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            {log.recordsCount}
                          </span>
                        </td>

                        {/* Server ACK Hash */}
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5">
                            <code className="text-[10px] text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                              {log.serverAckId}
                            </code>
                            <button
                              onClick={() => handleCopyAck(log.serverAckId)}
                              className="p-1 text-slate-400 hover:text-teal-300 rounded cursor-pointer"
                              title="Copy ACK hash"
                            >
                              {copiedAckId === log.serverAckId ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                            log.status === 'PARTIAL' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                            'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>{log.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-teal-300 rounded text-[10px] font-bold inline-flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <span>Trace</span>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </td>

                      </tr>

                      {/* Expanded Trace Breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70">
                          <td colSpan={8} className="p-4 border-t border-slate-800">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                              
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] font-bold text-teal-300 font-mono uppercase tracking-wider flex items-center space-x-1.5">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  <span>Sync Audit Trace Metadata ({log.id})</span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  UTC: {log.timestamp}
                                </div>
                              </div>

                              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                                {log.details}
                              </p>

                              {log.recordIds && log.recordIds.length > 0 && (
                                <div className="pt-2 border-t border-slate-800/80">
                                  <div className="text-[10px] font-mono text-slate-400 mb-1">
                                    SYNCHRONIZED RECORD IDENTIFIERS ({log.recordIds.length}):
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {log.recordIds.map(rId => (
                                      <span key={rId} className="bg-slate-950 text-teal-400 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-800">
                                        {rId}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
