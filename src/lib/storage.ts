import type { AppData, Profile, SessionLog } from '../types';
import { defaultBells } from './units';

const KEY = 'pood_data_v1';
const BACKUP_KEY = 'pood_data_backup'; // secondary copy, written on every save
export const DATA_VERSION = 1;

export const DEFAULT_PROFILE: Profile = {
  unit: 'kg',
  bells: defaultBells('new').bells,
  workingBell: defaultBells('new').working,
  experience: 'new',
  daysPerWeek: 3,
  soundOn: true,
  vibrateOn: true,
};

function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    profile: { ...DEFAULT_PROFILE },
    logs: [],
    sessionNotes: {},
    onboarded: false,
  };
}

function migrate(raw: unknown): AppData {
  const base = emptyData();
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<AppData>;
  return {
    version: DATA_VERSION,
    profile: { ...base.profile, ...(data.profile ?? {}) },
    logs: Array.isArray(data.logs) ? (data.logs as SessionLog[]) : [],
    sessionNotes: data.sessionNotes ?? {},
    onboarded: Boolean(data.onboarded),
  };
}

// Load app data. Falls back to the backup copy if the primary is corrupt.
export function loadData(): AppData {
  for (const key of [KEY, BACKUP_KEY]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return migrate(JSON.parse(raw));
    } catch {
      // try the next source
    }
  }
  return emptyData();
}

// Persist app data to two keys so a half-written primary never loses everything.
export function saveData(data: AppData): void {
  const json = JSON.stringify({ ...data, version: DATA_VERSION });
  try {
    localStorage.setItem(KEY, json);
    localStorage.setItem(BACKUP_KEY, json);
  } catch {
    // Storage full or blocked — surfaced to the user via the Settings backup nudge.
  }
}

export function resetData(): AppData {
  const fresh = emptyData();
  saveData(fresh);
  return fresh;
}

// ---- File export / import (the durable backup the user asked for) ----

export interface ExportFile {
  app: 'pood';
  version: number;
  exportedAt: string;
  data: AppData;
}

export function buildExport(data: AppData): ExportFile {
  return { app: 'pood', version: DATA_VERSION, exportedAt: new Date().toISOString(), data };
}

// Trigger a download of the current data as a JSON file.
export function downloadBackup(data: AppData): void {
  const payload = buildExport(data);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `pood-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  ok: boolean;
  data?: AppData;
  error?: string;
}

// Parse and validate an imported backup file's text.
export function parseImport(text: string): ImportResult {
  try {
    const parsed = JSON.parse(text) as Partial<ExportFile> | Partial<AppData>;
    // Accept either a wrapped export file or a bare AppData object.
    const candidate =
      parsed && typeof parsed === 'object' && 'data' in parsed && parsed.data
        ? (parsed as ExportFile).data
        : (parsed as AppData);
    if (!candidate || typeof candidate !== 'object') {
      return { ok: false, error: 'File is not a valid Pood backup.' };
    }
    const data = migrate(candidate);
    if (!Array.isArray(data.logs)) {
      return { ok: false, error: 'Backup is missing workout history.' };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Could not read the file. Is it a Pood backup?' };
  }
}

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older webviews.
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
