// flota-specific root folders; the old ROOT_FOLDER_IDS array is deprecated
export const FLOTA_FOLDER_IDS: Record<string, string> = {
  '320': '1uNHh9xBVoKkT_F5RAI-AJNW8AezNDA1j',
  '767': '1gLuWCS1wZAfA4Wdj-QOyti2oOQwUz_Ui',
  '787': '1zaFqFHz13gljtWW18i7imITQ2ut68Ame',
};

// hardcoded test email for the current session
export const EMAIL = 'abraham.ayquipa@latam.com';

// the list of required file ids is no longer maintained manually; compliance is driven by the
// `CONTROL` sheet.  all files that can be downloaded should be treated as "required" and
// are populated in CONTROL automatically when a user browses or downloads them.  this
// constant exists only for backwards compatibility and is effectively unused.
export const REQUIRED_FILE_IDS: string[] = [];

export const DEADLINE_HOURS = 1;

// spreadsheet used both for DB lookups and CONTROL tracking
export const GOOGLE_SHEET_ID = '1A8wfRvUkrEof8z_7ToMSE9v_h71Q_AKs44IoAsAx92E'; // updated to new shared workbook