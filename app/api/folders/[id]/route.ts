import { NextRequest, NextResponse } from 'next/server';
import { drive } from '../../../../lib/google-drive';
import { isAllowedFolder } from '../../../../utils/drive-utils';

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
    return NextResponse.json({ files });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}