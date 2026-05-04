import { NextRequest, NextResponse } from 'next/server';
import { drive } from '../../../../lib/google-drive';
import { isAllowedFolder } from '../../../../utils/drive-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: folderId } = await params;

  if (!(await isAllowedFolder(folderId))) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    // Fetch files and folder name in parallel
    const [response, folderRes] = await Promise.all([
      drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, thumbnailLink, modifiedTime, size, webViewLink)',
        orderBy: 'name',
      }),
      drive.files.get({
        fileId: folderId,
        fields: 'name',
      })
    ]);

    const files = response.data.files || [];
    const folderName = folderRes.data.name;

    return NextResponse.json({ files, folderName });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}