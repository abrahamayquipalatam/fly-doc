import { NextRequest, NextResponse } from 'next/server';
import { drive } from '../../../../lib/google-drive';
import { isAllowedFolder } from '../../../../utils/drive-utils';
import { ensureControlRows } from '../../../../lib/control';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: folderId } = await params;

  if (!(await isAllowedFolder(folderId))) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, thumbnailLink, modifiedTime, size, webViewLink)',
      orderBy: 'name',
    });

    const files = response.data.files || [];
    // If the caller supplied a userName, ensure those files are tracked in CONTROL
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('userName');
    if (userName && files.length > 0) {
      try {
        await ensureControlRows(userName, files.map(f => ({ name: f.name || '' }))); 
      } catch (err) {
        console.error('failed to ensure control rows for folder listing', err);
      }
    }
    return NextResponse.json({ files });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}