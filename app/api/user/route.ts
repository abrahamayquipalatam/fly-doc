import { GOOGLE_SHEET_ID_AUTH, DB_SHEET_NAME, FLOTA_FOLDER_IDS } from '@/config/constants';
import { NextRequest, NextResponse } from 'next/server';
import { sheets } from '../../../lib/google-drive';

interface UserInfo {
  name: string;
  email: string;
  flota: string;
  folderId: string;
}

// reads the "BD" sheet looking for the email and returns user info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailToFind = searchParams.get('email');

    if (!emailToFind) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // grab the entire BD sheet (columns A:D)
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID_AUTH,
      range: `${DB_SHEET_NAME}!A:D`,
    });


    const rows: any[] = resp.data.values || [];
    // skip header row if present
    for (let i = 1; i < rows.length; i++) {
        // NOMBRES Y APELLIDOS	CORREO	FLOTA	CONTRASEÑA
        const [name, email, flota] = rows[i];
      if (email?.toLowerCase() === emailToFind.toLowerCase()) {
        const folderId = FLOTA_FOLDER_IDS[flota];
        if (!folderId) {
          return NextResponse.json({ error: 'Unknown flota for user' }, { status: 500 });
        }
        const result: UserInfo = { name, email, flota, folderId };
        return NextResponse.json(result);
      }
    }

    return NextResponse.json({ error: 'User not found in sheet' }, { status: 404 });
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