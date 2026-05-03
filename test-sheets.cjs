const { google } = require('googleapis');
const { Buffer } = require('buffer');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

function getGoogleKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY_BASE64");
  const decoded = Buffer.from(raw, 'base64').toString('utf-8').trim();
  const cleaned = decoded.startsWith("'") && decoded.endsWith("'") ? decoded.slice(1, -1) : decoded;
  return JSON.parse(cleaned);
}

const key = getGoogleKey();
const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const GOOGLE_SHEET_ID = '1whwB4OoCfiVnCzk6SIssDoVcflBCfWZD'; // verified

sheets.spreadsheets.values.get({
  spreadsheetId: GOOGLE_SHEET_ID,
  range: 'CONTROL',
}).then(resp => {
  console.log('SUCCESS');
}).catch(err => {
  console.error("ERROR:", err);
});
