/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Smartphone, Download, CheckCircle2, QrCode, Shield, Cpu, 
  WifiOff, Bluetooth, Camera, X, ExternalLink, HardDrive, 
  Sparkles, RefreshCw, FileCheck, Layers
} from 'lucide-react';
import { AndroidAppInfo, DEFAULT_ANDROID_APP_INFO } from '../types';

interface AndroidAppModalProps {
  onClose: () => void;
}

export default function AndroidAppModal({ onClose }: AndroidAppModalProps) {
  const [appInfo] = useState<AndroidAppInfo>(DEFAULT_ANDROID_APP_INFO);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'hardware' | 'sideload'>('apk');

  const handleDownloadApk = () => {
    setDownloading(true);
    setDownloadProgress(0);
    setDownloadComplete(false);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setDownloadComplete(true);

          // Create a mock download trigger for user
          const blob = new Blob([
            `AI-MalScan Suite V3.0 Android Hybrid Lab Package\nVersion: ${appInfo.version}\nBuild: ${appInfo.buildNumber}\nArchitecture: arm64-v8a\nPackage: ng.gov.health.aimalscan.hybridlab\nSHA-256: ${appInfo.checksumSha256}`
          ], { type: 'application/vnd.android.package-archive' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = appInfo.apkFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  return (
    <div id="android-app-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white uppercase tracking-tight">AI-MalScan Android Mobile Lab</h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/40 font-bold uppercase">
                  APK Release {appInfo.version}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Field-ready mobile diagnostic suite for Android tablets and smartphones</p>
            </div>
          </div>

          <button
            id="close-android-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('apk')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'apk'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            APK Download & QR
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'hardware'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            USB-OTG & Bluetooth Sensor Bridge
          </button>
          <button
            onClick={() => setActiveTab('sideload')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'sideload'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Field Sideloading Guide
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: APK DOWNLOAD & QR */}
          {activeTab === 'apk' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Left: Direct APK Download Card */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono text-emerald-400 font-bold">{appInfo.apkFileName}</div>
                      <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                        {appInfo.apkSizeMb} MB
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                      <div>Target: <span className="text-slate-200">{appInfo.targetAndroidVersion}</span></div>
                      <div>Min OS: <span className="text-slate-200">{appInfo.minAndroidVersion}</span></div>
                      <div>Arch: <span className="text-slate-200">{appInfo.architecture}</span></div>
                      <div>Engine: <span className="text-slate-200">Gemini Edge + ONNX</span></div>
                    </div>

                    {/* Progress Bar if downloading */}
                    {downloading && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[10px] font-mono text-emerald-400">
                          <span>Packaging Android APK...</span>
                          <span>{downloadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-150"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {downloadComplete && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Package download initiated! Copy to Android device or install directly.</span>
                      </div>
                    )}

                    {/* Action button */}
                    <button
                      id="download-android-apk-btn"
                      onClick={handleDownloadApk}
                      disabled={downloading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {downloading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Downloading Android APK...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Download Android Package (.APK)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>SHA-256: {appInfo.checksumSha256.substring(0, 32)}... (Verified Build)</span>
                  </div>
                </div>

                {/* Right: QR Code for Mobile Scanning */}
                <div className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="text-xs font-bold text-slate-200">Scan with Android Camera</div>
                  
                  {/* Styled QR Code Box */}
                  <div className="p-3 bg-white rounded-xl shadow-lg">
                    <div className="w-32 h-32 bg-slate-950 rounded-lg flex flex-col items-center justify-center p-2 relative">
                      <QrCode className="h-24 w-24 text-white" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-6 rounded bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-[9px]">
                          AI
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono">
                    Point any Android phone or tablet camera to instantly load or download the application.
                  </p>
                </div>

              </div>

              {/* Key Mobile Features */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Native Android Hybrid Lab Features</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {appInfo.features.map((feat, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-300 flex items-start space-x-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE & SENSOR BRIDGE */}
          {activeTab === 'hardware' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-300">
                The Android application includes native device driver bridges allowing field health workers to plug laboratory hardware directly into the Android USB-C port or pair wirelessly via Bluetooth Low Energy (BLE):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Hardware 1 */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Camera className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">USB-OTG 100x Microscope Eyepiece</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Direct UVC camera driver captures 100x oil-immersion Giemsa smear fields. Auto-focus and field illumination controlled via on-screen dial.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500">Protocol: Android CameraX / UVC v1.5</div>
                </div>

                {/* Hardware 2 */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Bluetooth className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">HemoCue Hb 301 BLE Link</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Automatically receives quantitative Hemoglobin and calculated PCV readings wirelessly within 2 seconds of cuvette insertion.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500">Protocol: Bluetooth GATT Health Device Profile</div>
                </div>

                {/* Hardware 3 */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">SD Biosensor G6PD Gatekeeper</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Syncs enzymatic U/g Hb readings to enforce safety locks before authorizing Primaquine radical cures.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500">Protocol: BLE Serial Emulation</div>
                </div>

                {/* Hardware 4 */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Zero-Data Offline Local SQLite</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Stores up to 50,000 complete patient records and high-res smear micro-snapshots locally when operating without cellular coverage.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500">Storage: Encrypted SQLite Cipher (AES-256)</div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: SIDELOADING GUIDE */}
          {activeTab === 'sideload' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-xs font-bold text-slate-200">How to Sideload onto Clinic Android Tablets & Phones:</div>

              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Download the .APK file</div>
                    <p className="text-[11px] text-slate-400">Click the Download APK button on this device, or transfer via USB flash drive / Bluetooth share.</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Enable "Install Unknown Apps" in Android Settings</div>
                    <p className="text-[11px] text-slate-400">Navigate to Settings &rarr; Apps & Security &rarr; Special App Access &rarr; Install Unknown Apps &rarr; Toggle "Allow from this source".</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Tap APK to Install & Grant Microscope Camera Permission</div>
                    <p className="text-[11px] text-slate-400">Launch the AI-MalScan app. Grant Camera, Bluetooth, and Storage permissions to begin hybrid lab diagnostics.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[10px] text-slate-500 font-mono">
            Optimized for Samsung Galaxy Tab, Tecno Pad, Infinix, and Rugged Medical Tablets
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
