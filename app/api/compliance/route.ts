import { GOOGLE_SHEET_ID, GOOGLE_SHEET_ID_AUTH, DB_SHEET_NAME, FLOTA_FOLDER_IDS } from '@/config/constants';
import { NextRequest, NextResponse } from 'next/server';
import { downloads } from '../../../lib/db';
import { sheets, drive } from '../../../lib/google-drive';
import { getAllDescendantFiles } from '../../../utils/drive-utils';
import { ensureControlRows } from '../../../lib/control';

// Simple in-memory cache for Drive files to avoid constant recursive fetching
const fileCache: Record<string, { files: any[], timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

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
    // 1. Parallelize initial basic data fetching from Sheets
    const [batchResp, dbResp] = await Promise.all([
      sheets.spreadsheets.values.batchGet({
        spreadsheetId: GOOGLE_SHEET_ID,
        ranges: ['HOUR!A2', 'CONTROL!A:C'],
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID_AUTH,
        range: `${DB_SHEET_NAME}!A:D`,
      }),
    ]);

    const hourValue = batchResp.data.valueRanges?.[0]?.values?.[0]?.[0];
    const controlRowsFromBatch = batchResp.data.valueRanges?.[1]?.values || [];
    let baseDate = new Date();
    if (hourValue) {
      // Parse '20/03/2026 23:09:48'
      const [datePart, timePart] = hourValue.split(' ');
      if (datePart && timePart) {
        const [day, month, year] = datePart.split('/').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        baseDate = new Date(year, month - 1, day, hours, minutes, seconds);
      }
    }
    
    const DEADLINE_HOURS_OVERRIDE = 72;
    const deadline = new Date(baseDate.getTime() + DEADLINE_HOURS_OVERRIDE * 60 * 60 * 1000);
    const now = new Date();
    const timeLeftMs = deadline.getTime() - now.getTime();
    const timeLeftHours = Math.max(0, Math.ceil(timeLeftMs / (1000 * 60 * 60)));

    const dbRows = dbResp.data.values || [];
    // Identify user in DB
    const userDbRow = dbRows.find(r => r[0] === userName);

    let currentDriveFiles: {id: string, name: string, mimeType: string}[] = [];

    if (userDbRow) {
      const flota = userDbRow[2];
      const rootFolderId = Object.entries(FLOTA_FOLDER_IDS).find(([k]) => k === flota)?.[1];
      
      if (rootFolderId) {
        // Check cache first
        const cached = fileCache[rootFolderId];
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
          currentDriveFiles = cached.files;
        } else {
          // Recursive fetch
          currentDriveFiles = await getAllDescendantFiles(rootFolderId);
          fileCache[rootFolderId] = { files: currentDriveFiles, timestamp: Date.now() };
        }
        
        // Auto-populate CONTROL sheet with all descendant files if they are not there
        if (userName && currentDriveFiles.length > 0) {
           await ensureControlRows(userName, currentDriveFiles);
        }
      }
    }

    // 3. Process control rows (we already fetched them in controlRowsFromBatch)
    const rows: any[] = controlRowsFromBatch;
    const dataRows = rows.slice(1);

    // 4. Sync deletions
    const driveFileNames = new Set(currentDriveFiles.map(f => f.name));
    let rowChanged = false;
    const newSheetRows: any[][] = [rows[0] || ['User', 'File', 'Downloaded']]; // Start with header
    
    dataRows.forEach((row) => {
      if (row[0] === userName) {
        // If the file is in our sheet but no longer in the recursive Drive list, skip it
        if (currentDriveFiles.length > 0 && !driveFileNames.has(row[1])) {
          rowChanged = true;
          return; 
        }
      }
      newSheetRows.push(row);
    });

    if (rowChanged) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'CONTROL!A:C',
        valueInputOption: 'RAW',
        requestBody: { values: newSheetRows },
      });
      // Clear trailing rows if necessary
      if (newSheetRows.length < rows.length) {
         await sheets.spreadsheets.values.clear({
           spreadsheetId: GOOGLE_SHEET_ID,
           range: `CONTROL!A${newSheetRows.length + 1}:C${rows.length}`,
         });
      }
    }

    const finalUserRows = newSheetRows.slice(1).filter(r => r[0] === userName);
    const requiredFiles = finalUserRows.map(r => {
      const driveMatch = currentDriveFiles.find(f => f.name === r[1]);
      return { 
        name: r[1], 
        downloaded: (r[2] && r[2].toString().toLowerCase() === 'true'),
        mimeType: driveMatch ? driveMatch.mimeType : 'application/octet-stream'
      };
    });

    return NextResponse.json({
      downloaded: requiredFiles.filter(f => f.downloaded).length,
      total: requiredFiles.length,
      deadline: deadline.toISOString(),
      timeLeft: timeLeftHours,
      requiredFiles,
    });
  } catch (error: any) {
    console.error('compliance handler error', error);
    if (error?.code === 403) {
      return NextResponse.json({ error: 'Google Sheets API access denied' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
 