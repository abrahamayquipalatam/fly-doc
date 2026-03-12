import cron from 'node-cron';
import { downloads } from '../lib/db.js';
import { sheets } from '../lib/google-drive.js';
import { GOOGLE_SHEET_ID } from '../config/constants.js';

cron.schedule('0 * * * *', async () => { // every hour
  console.log('Checking compliance...');
  const now = new Date();
  const expired = downloads.findMany({}).filter((d: any) => new Date(d.deadline) < now && !d.escalated);

  for (const d of expired) {
    console.log(`Escalating user ${d.userId} for file ${d.fileId}`);
    // Log to Google Sheets
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'Sheet1!A:D', // Adjust range
        valueInputOption: 'RAW',
        requestBody: {
          values: [[d.userId, d.fileId, d.deadline, 'Escalated']],
        },
      });
    } catch (error) {
      console.error('Failed to log to sheets:', error);
    }
    downloads.update({ id: d.id }, { escalated: true });
  }
});