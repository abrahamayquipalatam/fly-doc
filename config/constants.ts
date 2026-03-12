// flota-specific root folders; the old ROOT_FOLDER_IDS array is deprecated
export const FLOTA_FOLDER_IDS: Record<string, string> = {
  '320': '1uNHh9xBVoKkT_F5RAI-AJNW8AezNDA1j',
  '767': '1gLuWCS1wZAfA4Wdj-QOyti2oOQwUz_Ui',
  '787': '1zaFqFHz13gljtWW18i7imITQ2ut68Ame',
};

// hardcoded test email for the current session
export const EMAIL = 'abrahamayquipa2000@gmail.com';

// the list of required file ids is no longer maintained manually; compliance is driven by `CONTROL` sheet
// kept here only for backwards compatibility with any old code that might reference it
export const REQUIRED_FILE_IDS: string[] = [];

export const DEADLINE_HOURS = 72;

// spreadsheet used both for DB lookups and CONTROL tracking
export const GOOGLE_SHEET_ID = '1A8wfRvUkrEof8z_7ToMSE9v_h71Q_AKs44IoAsAx92E'; // updated to new shared workbook