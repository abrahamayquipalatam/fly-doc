import { google } from 'googleapis';

function getGoogleKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

  if (!raw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY_BASE64");
  }

  const decoded = Buffer.from(raw, 'base64').toString('utf-8').trim();

  const cleaned =
    decoded.startsWith("'") && decoded.endsWith("'")
      ? decoded.slice(1, -1)
      : decoded;

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Invalid JSON:", cleaned);
    throw e;
  }
}

const key = getGoogleKey();

const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets'
  ],
});

export const drive = google.drive({ version: 'v3', auth });
export const sheets = google.sheets({ version: 'v4', auth });