/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DiagnosticRecord, LabFacility, ChiefTechnician } from '../types';

export interface DatabaseBackupPackage {
  schemaVersion: '3.0';
  exportTimestamp: string;
  facility?: LabFacility;
  exportedBy?: ChiefTechnician;
  recordCount: number;
  statistics: {
    positiveCount: number;
    negativeCount: number;
    severeAnemiaCount: number;
    g6pdDeficientCount: number;
    k13MutationCount: number;
  };
  records: DiagnosticRecord[];
}

export interface AutoBackupSnapshot {
  id: string;
  timestamp: string;
  recordCount: number;
  positiveCount: number;
  facilityCode?: string;
  sizeBytes: number;
  data: DatabaseBackupPackage;
}

/**
 * Clean and escape string for CSV format (RFC 4180)
 */
function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const stringValue = String(value);
  // If contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return `"${stringValue}"`;
}

/**
 * Generate RFC 4180-compliant CSV string with UTF-8 BOM for Excel compatibility
 */
export function generateSurveillanceCsv(records: DiagnosticRecord[], facility?: LabFacility): string {
  const headers = [
    'Record ID',
    'Date Time (ISO)',
    'Date (Local)',
    'Facility Name',
    'Facility Code',
    'Facility LGA',
    'Facility State',
    'Patient Name',
    'Patient Age (Yrs)',
    'Patient Gender',
    'Patient Weight (kg)',
    'Patient Phone',
    'Patient NIN / Hosp ID',
    'Sentinel Clinic ID',
    'Microscopy Parasite Detected',
    'Microscopy Species',
    'Microscopy Density (parasites/uL)',
    'Microscopy Confidence (%)',
    'Severity Classification',
    'RDT Performed',
    'RDT Cassette Type',
    'RDT HRP2 (Pf) Line',
    'RDT pLDH (Pv/Pan) Line',
    'RDT Interpretation',
    'RDT Concordance Status',
    'Hemoglobin Hb (g/dL)',
    'Hematocrit PCV (%)',
    'Anemia Severity',
    'Blood Transfusion Indicated',
    'G6PD Biosensor Performed',
    'G6PD Activity (U/g Hb)',
    'G6PD Percent Normal (%)',
    'G6PD Status',
    'Primaquine Safe Flag',
    'Molecular LAMP Performed',
    'Molecular Test Type',
    'Molecular DNA Detected',
    'Molecular K13 Mutation Detected',
    'Molecular K13 Details',
    'Treatment Regimen',
    'Technician Confirmed',
    'Chief Technician Name',
    'Technician License No',
    'Cloud Sync Status',
    'Clinical Diagnostic Notes'
  ];

  const rows: string[] = [];
  rows.push(headers.map(h => escapeCsvCell(h)).join(','));

  records.forEach(rec => {
    const dateObj = new Date(rec.timestamp);
    const dateLocal = isNaN(dateObj.getTime()) ? rec.timestamp : dateObj.toLocaleString('en-GB');

    const row = [
      rec.id,
      rec.timestamp,
      dateLocal,
      rec.facility?.name || facility?.name || 'Benue State Sentinel Lab',
      rec.facility?.code || facility?.code || rec.deviceId,
      rec.facility?.lga || facility?.lga || 'Gboko',
      rec.facility?.state || facility?.state || 'Benue',
      rec.patient.name,
      rec.patient.age,
      rec.patient.gender,
      rec.patient.weight,
      rec.patient.phone || 'N/A',
      rec.patient.ninOrHospitalNo || 'N/A',
      rec.patient.clinicId || 'Gboko Reference Lab',
      rec.result.parasiteDetected ? 'POSITIVE' : 'NEGATIVE',
      rec.result.species,
      rec.result.density,
      Math.round(rec.result.confidenceScore * 100),
      rec.severityGrade,
      rec.rdtResult?.performed ? 'YES' : 'NO',
      rec.rdtResult?.cassetteType || 'N/A',
      rec.rdtResult?.hrp2Line ? 'POSITIVE' : 'NEGATIVE',
      rec.rdtResult?.pldhLine ? 'POSITIVE' : 'NEGATIVE',
      rec.rdtResult?.interpretation || 'Not Done',
      rec.rdtResult?.concordanceStatus || 'N/A',
      rec.hbResult?.performed ? rec.hbResult.hbValue : 'N/A',
      rec.hbResult?.performed ? rec.hbResult.pcvValue : 'N/A',
      rec.hbResult?.anemiaSeverity || 'Not Evaluated',
      rec.hbResult?.bloodTransfusionIndicated ? 'YES - URGENT' : 'NO',
      rec.g6pdResult?.performed ? 'YES' : 'NO',
      rec.g6pdResult?.performed ? rec.g6pdResult.enzymaticActivity : 'N/A',
      rec.g6pdResult?.performed ? `${rec.g6pdResult.percentNormal}%` : 'N/A',
      rec.g6pdResult?.status || 'Not Tested',
      rec.g6pdResult?.primaquineSafe ? 'SAFE' : rec.g6pdResult?.status.includes('Deficient') ? 'CONTRAINDICATED' : 'UNKNOWN',
      rec.molecularResult?.performed ? 'YES' : 'NO',
      rec.molecularResult?.testType || 'None',
      rec.molecularResult?.dnaDetected ? 'DETECTED' : 'NOT DETECTED',
      rec.molecularResult?.k13MutationDetected ? 'RESISTANCE MUTATION DETECTED' : 'WILD TYPE / NONE',
      rec.molecularResult?.k13MutationDetails || 'None',
      rec.treatmentRegimen || 'Standard Supportive Care',
      rec.workerConfirmed === true ? 'CONFIRMED' : rec.workerConfirmed === false ? 'OVERRULED' : 'PENDING',
      rec.technician?.name || facility?.chiefTechnician || 'Staff Scientist',
      rec.technician?.licenseNumber || facility?.accreditationNumber || 'N/A',
      rec.synced ? 'SYNCHRONIZED' : 'LOCAL OFFLINE QUEUE',
      rec.result.clinicalNotes || rec.notes || ''
    ];

    rows.push(row.map(cell => escapeCsvCell(cell)).join(','));
  });

  // Prepend UTF-8 BOM (\uFEFF)
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Generate formatted JSON database backup package
 */
export function generateDatabaseBackupPackage(
  records: DiagnosticRecord[], 
  facility?: LabFacility,
  technician?: ChiefTechnician
): DatabaseBackupPackage {
  const positiveRecords = records.filter(r => r.result.parasiteDetected);
  const severeAnemiaCount = records.filter(r => r.hbResult && r.hbResult.hbValue < 7.0).length;
  const g6pdDeficientCount = records.filter(r => r.g6pdResult && r.g6pdResult.status.includes('Deficient')).length;
  const k13MutationCount = records.filter(r => r.molecularResult && r.molecularResult.k13MutationDetected).length;

  return {
    schemaVersion: '3.0',
    exportTimestamp: new Date().toISOString(),
    facility,
    exportedBy: technician,
    recordCount: records.length,
    statistics: {
      positiveCount: positiveRecords.length,
      negativeCount: records.length - positiveRecords.length,
      severeAnemiaCount,
      g6pdDeficientCount,
      k13MutationCount
    },
    records
  };
}

/**
 * Triggers a browser file download without needing cloud network
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Save automatic database snapshot to local storage
 */
export function saveAutomatedDatabaseSnapshot(
  records: DiagnosticRecord[], 
  facility?: LabFacility,
  technician?: ChiefTechnician
): AutoBackupSnapshot | null {
  if (!records || records.length === 0) return null;

  try {
    const backupPkg = generateDatabaseBackupPackage(records, facility, technician);
    const jsonStr = JSON.stringify(backupPkg);
    const snapshot: AutoBackupSnapshot = {
      id: `snapshot_${Date.now()}`,
      timestamp: new Date().toISOString(),
      recordCount: records.length,
      positiveCount: backupPkg.statistics.positiveCount,
      facilityCode: facility?.code || 'AIMALSCAN-LOCAL',
      sizeBytes: new Blob([jsonStr]).size,
      data: backupPkg
    };

    // Load existing history (keep last 5)
    const existingHistoryRaw = localStorage.getItem('aimalscan_auto_backup_history');
    let history: AutoBackupSnapshot[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];
    
    // Unshift newest snapshot and keep max 5
    history.unshift(snapshot);
    if (history.length > 5) {
      history = history.slice(0, 5);
    }

    localStorage.setItem('aimalscan_auto_backup_history', JSON.stringify(history));
    localStorage.setItem('aimalscan_last_auto_backup_time', snapshot.timestamp);

    return snapshot;
  } catch (err) {
    console.error('Failed to create automated database snapshot:', err);
    return null;
  }
}

/**
 * Retrieve automated backup snapshots from local storage
 */
export function getAutomatedBackupHistory(): AutoBackupSnapshot[] {
  try {
    const raw = localStorage.getItem('aimalscan_auto_backup_history');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load backup history:', e);
    return [];
  }
}

/**
 * Validate imported JSON backup file structure
 */
export function validateImportedBackup(jsonObj: any): { valid: boolean; error?: string; records?: DiagnosticRecord[] } {
  if (!jsonObj) {
    return { valid: false, error: 'File contains invalid or empty data.' };
  }

  // Handle both direct array of records and DatabaseBackupPackage structure
  let records: DiagnosticRecord[] = [];

  if (Array.isArray(jsonObj)) {
    records = jsonObj;
  } else if (jsonObj.records && Array.isArray(jsonObj.records)) {
    records = jsonObj.records;
  } else {
    return { valid: false, error: 'Unrecognized backup format. Expected "records" collection.' };
  }

  if (records.length === 0) {
    return { valid: false, error: 'Backup file contains 0 diagnostic records.' };
  }

  // Validate that records contain essential diagnostic properties
  const sample = records[0];
  if (!sample.id || !sample.patient || !sample.result) {
    return { valid: false, error: 'Diagnostic record schema mismatch. Missing ID, Patient, or Result fields.' };
  }

  return { valid: true, records };
}
