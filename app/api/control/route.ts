import { GOOGLE_SHEET_ID } from '@/config/constants';
import { sheets } from '../../../lib/google-drive';
import { NextRequest, NextResponse } from 'next/server';

// Only POST is used for now: initialize control rows for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, files } = body as { userName: string; files: Array<{ id: string; name: string }> };

    if (!userName || !Array.isArray(files)) {
      return NextResponse.json({ error: 'userName and files are required' }, { status: 400 });
    }

    // read existing rows from CONTROL sheet
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'CONTROL!A:C',
    });

    const existing: any[] = resp.data.values || [];

    // build a set of "userName|fileName" that already exist (skip header row if present)
    const seen = new Set<string>();
    existing.slice(1).forEach(row => {
      if (row[0] && row[1]) {
        seen.add(`${row[0]}|${row[1]}`);
      }
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
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'CONTROL!A:C',
        valueInputOption: 'RAW',
        requestBody: { values: toAppend },
      });
    }

    return NextResponse.json({ added: toAppend.length });
  } catch (error) {
    console.error('control init failed', error);
    return NextResponse.json({ error: 'Failed to initialize control' }, { status: 500 });
  }
}