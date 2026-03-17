import { GOOGLE_SHEET_ID } from '@/config/constants';
import { sheets } from './google-drive';

const SHEET_ID = GOOGLE_SHEET_ID;

/**
 * ensure that the CONTROL sheet has an entry for each file in the list
 * rows are [userName, fileName, was_read]
 */
export async function ensureControlRows(userName: string, files: Array<{ name: string }>) {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'CONTROL!A:C',
  });
  const existing: any[] = resp.data.values || [];
  const seen = new Set<string>();
  existing.slice(1).forEach(row => {
    if (row[0] && row[1]) seen.add(`${row[0]}|${row[1]}`);
  });
  const toAppend: string[][] = [];
  files.forEach(f => {
    const key = `${userName}|${f.name}`;
    if (!seen.has(key)) {
      toAppend.push([userName, f.name, 'false']);
      seen.add(key);
    }
  });
  if (toAppend.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'CONTROL!A:C',
      valueInputOption: 'RAW',
      requestBody: { values: toAppend },
    });
  }
  return toAppend.length;
}

/**
 * mark a single file as read/downloaded for the user in CONTROL sheet
 */
export async function markFileRead(userName: string, fileName: string) {
  // read sheet to find the row index
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'CONTROL!A:C',
  });
  const rows: any[] = resp.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    const [u, f] = rows[i];
    if (u === userName && f === fileName) {
      const rowIndex = i + 1; // sheets are 1-indexed
      const cell = `C${rowIndex}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `CONTROL!${cell}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['true']] },
      });
      return true;
    }
  }
  // not found: optionally append a new row
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'CONTROL!A:C',
    valueInputOption: 'RAW',
    requestBody: { values: [[userName, fileName, 'true']] },
  });
  return false;
}