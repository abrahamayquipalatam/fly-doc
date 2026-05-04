import { GOOGLE_SHEET_ID, FLOTA_FOLDER_IDS } from '@/config/constants';
import { NextRequest, NextResponse } from 'next/server';
import { sheets } from '../../../lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    if (!email.toLowerCase().endsWith('@latam.com')) {
      return NextResponse.json({ error: 'Acceso denegado: solo correos @latam.com permitidos.' }, { status: 403 });
    }

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'CONTROL',
    });

    const rows: any[] = resp.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const headerRow = rows[0] || [];
    const now = new Date();
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
    const currentMonthStr = `${monthNames[now.getMonth()]}-${now.getFullYear().toString().slice(-2)}`;
    
    let monthColIndex = headerRow.findIndex((h: any) => h?.toString().toLowerCase().trim() === currentMonthStr.toLowerCase());
    
    // Fallback calculation based on User's mapping: F (index 5) is may-26
    if (monthColIndex === -1) {
        monthColIndex = 5 + (now.getFullYear() - 2026) * 12 + (now.getMonth() - 4);
    }

    let userRowIndex = -1;
    let name = '', rowEmail = '', flota = '', rango = '';

    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r.length >= 5) {
            const currentEmail = r[4];
            if (currentEmail?.toString().toLowerCase().trim() === email.toLowerCase().trim()) {
                userRowIndex = i;
                flota = r[1];
                rango = r[2];
                name = r[3];
                rowEmail = currentEmail;
                break;
            }
        }
    }

    if (userRowIndex !== -1) {
        // Update the CONTROL sheet with an "X" for the current month
        if (monthColIndex >= 0) {
            let targetRow = [...rows[userRowIndex]];
            while(targetRow.length <= monthColIndex) targetRow.push("");
            targetRow[monthColIndex] = "X";

            try {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: GOOGLE_SHEET_ID,
                    range: `CONTROL!A${userRowIndex + 1}`,
                    valueInputOption: 'RAW',
                    requestBody: { values: [targetRow] }
                });
            } catch (err: any) {
                console.error('Failed to update control sheet', err);
            }
        }

        const folders = [];
        let mappedFlota = flota;
        if (flota.includes('320')) mappedFlota = '320';
        else if (flota.includes('767')) mappedFlota = '767';
        else if (flota.includes('787')) mappedFlota = '787';
        else if (flota === 'DV') mappedFlota = 'DESPACHO';

        const mainFolderId = FLOTA_FOLDER_IDS[mappedFlota];
        if (mainFolderId) {
            folders.push({ id: mainFolderId, name: `Flota ${flota}` });
        }
        
        if (rango === 'EXCP') {
            const despachoId = FLOTA_FOLDER_IDS['DESPACHO'];
            if (despachoId) {
                folders.push({ id: despachoId, name: `DESPACHO` });
            }
        }

        if (folders.length === 0) {
            return NextResponse.json({ error: 'Unknown flota for user' }, { status: 500 });
        }

        return NextResponse.json({
          name,
          email: rowEmail,
          flota,
          folders,
          folderId: folders[0].id
        });
    }

    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  } catch (err: any) {
    console.error('failed to authenticate', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
