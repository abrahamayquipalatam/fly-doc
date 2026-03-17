import { DEADLINE_HOURS, GOOGLE_SHEET_ID } from '@/config/constants';
import { NextRequest, NextResponse } from 'next/server';
import { downloads } from '../../../lib/db';
import { sheets } from '../../../lib/google-drive';

// compliance is derived from the CONTROL sheet entries for the given user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // we expect the caller to pass the human-readable name as `userName`.  
  const userId = searchParams.get('userId');
  const userName = searchParams.get('userName');

  if (!userName && !userId) {
    return NextResponse.json({ error: 'userName or userId required' }, { status: 400 });
  }

  try {
    // read control rows, filter by whichever identifier we have (preference for name)
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'CONTROL!A:C',
    });
    const rows: any[] = resp.data.values || [];

    const userRows = rows
      .slice(1) // ignore header
      .filter(r => {
        if (userName) return r[0] === userName;
        return r[0] === userId;
      });
    const total = userRows.length;
    const downloaded = userRows.filter(r => r[2] && (r[2].toString().toLowerCase() === 'true')).length;

    // deadline logic is same as before but based on downloads table
    const userDownloads = downloads.findMany({ userId: userId || '' });
    let deadline: Date | null = null;
    if (userDownloads.length > 0) {
      const earliestDownload = userDownloads.reduce((earliest: any, d: any) => d.downloadedAt < earliest.downloadedAt ? d : earliest);
      deadline = new Date(new Date(earliestDownload.downloadedAt).getTime() + DEADLINE_HOURS * 60 * 60 * 1000);
    } else {
      deadline = new Date(Date.now() + DEADLINE_HOURS * 60 * 60 * 1000);
    }
    const now = new Date();
    const timeLeft = deadline > now ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)) : 0;

    // prepare file list for UI
    const requiredFiles = userRows.map(r => ({ name: r[1], downloaded: (r[2] && r[2].toString().toLowerCase() === 'true') }));

    return NextResponse.json({
      downloaded,
      total,
      deadline: deadline.toISOString(),
      timeLeft,
      requiredFiles,
    });
  } catch (error: any) {
    console.error('compliance handler error', error);

    // if the request failed due to a disabled Sheets API, return a helpful
    // message so that developers know what to fix
    if (error?.code === 403) {
      return NextResponse.json(
        { error: 'Google Sheets API access denied or not enabled' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch compliance' }, { status: 500 });
  }
} 