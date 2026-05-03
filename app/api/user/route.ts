import { GOOGLE_SHEET_ID, FLOTA_FOLDER_IDS } from '@/config/constants';
import { NextRequest, NextResponse } from 'next/server';
import { sheets } from '../../../lib/google-drive';

interface FolderInfo {
  id: string;
  name: string;
}

interface UserInfo {
  name: string;
  email: string;
  flota: string;
  folders: FolderInfo[];
  folderId: string; // for backwards compatibility
}

// reads the "CONTROL" sheet looking for the email and returns user info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailToFind = searchParams.get('email');

    if (!emailToFind) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // grab the CONTROL sheet
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `CONTROL`,
    });

    const rows: any[] = resp.data.values || [];
    // skip header row if present
    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r.length < 5) continue;
        
        // |BP|FLOTA|RANGO|APELLIDOS Y NOMBRES|CORREO|
        const rFlota = r[1];
        const rRango = r[2];
        const rName = r[3];
        const email = r[4];
        
      if (email?.toString().toLowerCase().trim() === emailToFind.toLowerCase().trim()) {
        const folders = [];
        let mappedFlota = rFlota || '';
        if (mappedFlota.includes('320')) mappedFlota = '320';
        else if (mappedFlota.includes('767')) mappedFlota = '767';
        else if (mappedFlota.includes('787')) mappedFlota = '787';
        else if (mappedFlota === 'DV') mappedFlota = 'DESPACHO';

        const mainFolderId = FLOTA_FOLDER_IDS[mappedFlota];
        if (mainFolderId) {
            folders.push({ id: mainFolderId, name: `Flota ${rFlota}` });
        }
        
        if (rRango === 'EXCP') {
            const despachoId = FLOTA_FOLDER_IDS['DESPACHO'];
            if (despachoId) {
                folders.push({ id: despachoId, name: 'DESPACHO' });
            }
        }
        
        if (folders.length === 0) {
          return NextResponse.json({ error: 'Unknown flota for user' }, { status: 500 });
        }
        
        const result: UserInfo = { 
            name: rName, 
            email, 
            flota: rFlota, 
            folders,
            folderId: folders[0].id // fallback
        };
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