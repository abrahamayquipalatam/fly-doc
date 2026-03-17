import { GOOGLE_SHEET_ID, EMAIL, FLOTA_FOLDER_IDS } from '@/config/constants';
import { NextRequest, NextResponse } from 'next/server';
import { sheets } from '../../../lib/google-drive';

interface UserInfo {
  name: string;
  email: string;
  flota: string;
  folderId: string;
}

// reads the "DB" sheet looking for the hardcoded EMAIL and returns user info
export async function GET(request: NextRequest) {
  try {
    // grab the entire DB sheet (columns A:C)
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'DB!A:C',
    });

    const rows: any[] = resp.data.values || [];
    // skip header row if present
    for (let i = 1; i < rows.length; i++) {
      const [name, email, flota] = rows[i];
      if (email === EMAIL) {
        const folderId = FLOTA_FOLDER_IDS[flota];
        if (!folderId) {
          return NextResponse.json({ error: 'Unknown flota for user' }, { status: 500 });
        }
        const result: UserInfo = { name, email, flota, folderId };
        return NextResponse.json(result);
      }
    }

    return NextResponse.json({ error: 'User not found in DB sheet' }, { status: 404 });
  } catch (err: any) {
    console.error('failed to lookup user info', err);

    if (err?.code === 403) {
      return NextResponse.json(
        { error: 'Google Sheets API access denied or not enabled' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch user information' }, { status: 500 });
  }
} 