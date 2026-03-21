import { GOOGLE_SHEET_ID, DB_SHEET_NAME, FLOTA_FOLDER_IDS } from '@/config/constants';
import { NextRequest, NextResponse } from 'next/server';
import { sheets } from '../../../lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Read columns A:D from BD sheet
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${DB_SHEET_NAME}!A:D`,
    });

    const rows: any[] = resp.data.values || [];
    // skip header row if present
    for (let i = 1; i < rows.length; i++) {
        // NOMBRES Y APELLIDOS	CORREO	FLOTA	CONTRASEÑA
      const [name, rowEmail, flota, rowPassword] = rows[i];
      if (rowEmail?.toLowerCase() === email.toLowerCase() && rowPassword === password) {
        const folderId = FLOTA_FOLDER_IDS[flota];
        if (!folderId) {
            return NextResponse.json({ error: 'Unknown flota for user' }, { status: 500 });
        }
        return NextResponse.json({
          name,
          email: rowEmail,
          flota,
          folderId
        });
      }
    }

    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  } catch (err: any) {
    console.error('failed to authenticate', err);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
