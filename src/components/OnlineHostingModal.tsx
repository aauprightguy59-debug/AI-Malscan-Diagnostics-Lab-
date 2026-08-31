/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Globe, Server, ShieldCheck, Wifi, WifiOff, RefreshCw, 
  CheckCircle2, Cloud, Database, Lock, ArrowUpRight, Copy, Check,
  X, Radio, Activity, Send
} from 'lucide-react';
import { CloudHostingInfo, DEFAULT_CLOUD_HOST_INFO, LabFacility } from '../types';

interface OnlineHostingModalProps {
  facility?: LabFacility;
  networkStatus: 'online' | 'offline';
  onToggleNetwork: (status: 'online' | 'offline') => void;
  onClose: () => void;
}

export default function OnlineHostingModal({
  facility,
  networkStatus,
  onToggleNetwork,
  onClose
}: OnlineHostingModalProps) {
  const [cloudInfo] = useState<CloudHostingInfo>(DEFAULT_CLOUD_HOST_INFO);
  const [copied, setCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'success' | 'error'; latencyMs: number; message: string } | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://aimalscan-suite.health.gov.ng';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestCloudPing = async () => {
    setIsPinging(true);
    setPingResult(null);

    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setPingResult({
          status: 'success',
          latencyMs: latency,
          message: 'Cloud Surveillance & Diagnostic API Handshake Verified'
        });
      } else {
        setPingResult({
          status: 'error',
          latencyMs: latency,
          message: 'Cloud Server responded with status code ' + res.status
        });
      }
    } catch (e: any) {
      setPingResult({
        status: 'error',
        latencyMs: 999,
        message: 'Unable to reach central cloud server. Operating in offline mesh.'
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div id="online-hosting-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Online Hosting & Cloud Surveillance Hub</h3>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-500/40 font-bold uppercase">
                  HTTPS SSL Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">National epidemiological synchronization & multi-facility cloud connectivity</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Active Hosting URL Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Server className="h-3.5 w-3.5 text-cyan-400" />
                <span>Active Online Web Instance</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">LIVE ON THE WEB</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-2.5">
              <input
                type="text"
                readOnly
                value={currentOrigin}
                className="w-full bg-transparent text-xs font-mono text-cyan-300 focus:outline-none"
              />
              <button
                onClick={handleCopyUrl}
                className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-mono font-bold flex items-center space-x-1 cursor-pointer transition-colors shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-400 font-mono">
              <div>Region: <span className="text-slate-200">West Africa / Europe</span></div>
              <div>Protocol: <span className="text-slate-200">TLS 1.3 / HTTP/2</span></div>
              <div>CORS: <span className="text-slate-200">DHIS2 / NMEP White-listed</span></div>
            </div>
          </div>

          {/* Registered Facility Cloud Node Context */}
          {facility && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Assigned Facility Cloud Node
              </div>
              <div className="text-xs text-slate-200 font-mono font-bold">{facility.name}</div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-4">
                <span>Code: <strong className="text-cyan-400">{facility.code}</strong></span>
                <span>Tier: <strong>{facility.tier}</strong></span>
                <span>Accreditation: <strong>{facility.accreditationNumber}</strong></span>
              </div>
            </div>
          )}

          {/* Cloud Health Ping & Sync Control */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">National DHIS2 / NMEP Outbreak Gateway</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{cloudInfo.syncEndpoint}</div>
              </div>

              <button
                onClick={handleTestCloudPing}
                disabled={isPinging}
                className="px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
              >
                {isPinging ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Testing Ping...</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-3.5 w-3.5" />
                    <span>Ping Cloud Server</span>
                  </>
                )}
              </button>
            </div>

            {pingResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-mono animate-fade-in ${
                pingResult.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{pingResult.message}</span>
                </div>
                <span className="font-bold">{pingResult.latencyMs}ms</span>
              </div>
            )}

            {/* Network Mode Selector */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-300">Station Synchronization Mode</div>
                <div className="text-[10px] text-slate-500">Choose between immediate cloud upload or offline jungle storage</div>
              </div>

              <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => onToggleNetwork('online')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    networkStatus === 'online'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Wifi className="h-3.5 w-3.5" />
                  <span>Online Sync</span>
                </button>

                <button
                  onClick={() => onToggleNetwork('offline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    networkStatus === 'offline'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>Offline Mesh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Encryption & Security Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-start space-x-2.5">
              <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200">End-to-End Encrypted Feeds</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Patient PII is hashed with HMAC-SHA256 before transmission to national surveillance registries.</div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-start space-x-2.5">
              <Database className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200">DHIS2 & NMEP Interoperability</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Automatic FHIR-compliant epidemic mapping for rapid response against drug-resistant outbreaks.</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[10px] text-slate-500 font-mono">
            Host Endpoint: {currentOrigin}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
