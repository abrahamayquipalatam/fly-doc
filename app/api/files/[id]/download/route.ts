import { NextRequest, NextResponse } from 'next/server';
import { drive } from '../../../../../lib/google-drive';
import { downloads } from '../../../../../lib/db';
import { DEADLINE_HOURS } from '../../../../../config/constants';
import { markFileRead } from '../../../../../lib/control';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: fileId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const preview = searchParams.get('preview') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

    try {
        // Resolve shortcut if it is one
        let targetId = fileId;
        let fileResponse = await drive.files.get({
            fileId: targetId,
            fields: 'id, name, mimeType, shortcutDetails',
        });

        if (fileResponse.data.mimeType === 'application/vnd.google-apps.shortcut' && fileResponse.data.shortcutDetails?.targetId) {
            targetId = fileResponse.data.shortcutDetails.targetId;
            fileResponse = await drive.files.get({
                fileId: targetId,
                fields: 'id, name, mimeType',
            });
        }

        const file = fileResponse.data;

        // Register download
        const downloadedAt = new Date();
        const deadline = new Date(downloadedAt.getTime() + DEADLINE_HOURS * 60 * 60 * 1000);

        downloads.create({
            fileId: targetId,
            userId,
            downloadedAt: downloadedAt.toISOString(),
            deadline: deadline.toISOString(),
        });

        // update control sheet if caller provided a userName
        const userName = searchParams.get('userName');
        if (userName) {
          try {
            // always use the actual file name we got from Drive
            await markFileRead(userName, file.name || '');
          } catch (err) {
            console.error('failed to mark control row:', err);
          }
        }

        const isGoogleDoc = file.mimeType?.startsWith('application/vnd.google-apps.');
        const isExportable = isGoogleDoc && !file.mimeType?.endsWith('.folder') && !file.mimeType?.endsWith('.shortcut');

        let streamData: any;
        let mimeType = file.mimeType || 'application/octet-stream';
        let fileName = file.name;

        if (isExportable) {
            // Google application files must be exported (for example to PDF)
            const exportResponse = await drive.files.export(
                { fileId: targetId, mimeType: 'application/pdf' },
                { responseType: 'stream' }
            );
            streamData = exportResponse.data;
            mimeType = 'application/pdf';
            if (!fileName?.toLowerCase().endsWith('.pdf')) {
                fileName = `${fileName}.pdf`;
            }
        } else {
            const streamResponse = await drive.files.get(
                { fileId: targetId, alt: 'media' },
                { responseType: 'stream' }
            );
            streamData = streamResponse.data;
        }

        const headers = new Headers();
        headers.set('Content-Type', mimeType);

        // Content-Disposition header must only contain characters in the
        // Latin-1 (ISO-8859-1) range.  Node throws the "Cannot convert argument
        // to a ByteString" error if a filename contains characters > 255
        // (e.g. en‑dash, accented letters).  To support arbitrary unicode
        // names we:
        //   * provide a sanitized ASCII fallback in `filename`
        //   * add an RFC‑5987 encoded `filename*` parameter with the UTF-8
        //     version so browsers can still use the correct name.
        const dispositionType = preview ? 'inline' : 'attachment';
        const asciiName = fileName
          // remove potentially problematic characters (non-ASCII)
          .normalize('NFKD')
          .replace(/[\u0100-\uFFFF]/g, '')
          .replace(/"/g, '');
        const encodedName = encodeURIComponent(fileName);
        headers.set(
          'Content-Disposition',
          `${dispositionType}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`
        );

        return new NextResponse(streamData, { headers });
    } catch (error: any) {
    console.error('Error description:', error.message || error);
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    return NextResponse.json({ 
      error: 'Failed to download file', 
      details: error.message,
      status: error.status || error.code || 500
    }, { status: 500 });
  }
}