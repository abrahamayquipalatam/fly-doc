import { NextRequest, NextResponse } from 'next/server';
import { drive } from '../../../../../lib/google-drive';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: fileId } = await params;
  const { searchParams } = new URL(request.url);
  const preview = searchParams.get('preview') === 'true';

  try {
    // Resolve shortcut if it is one
    let targetId = fileId;
    let fileResponse = await drive.files.get({
      fileId: targetId,
      fields: 'id, name, mimeType, size, shortcutDetails',
    });

    if (fileResponse.data.mimeType === 'application/vnd.google-apps.shortcut' && fileResponse.data.shortcutDetails?.targetId) {
      targetId = fileResponse.data.shortcutDetails.targetId;
      fileResponse = await drive.files.get({
        fileId: targetId,
        fields: 'id, name, mimeType, size',
      });
    }

    const file = fileResponse.data;
    let fileName = file.name || '';

    const fileSize = file.size;
    const isGoogleDoc = file.mimeType?.startsWith('application/vnd.google-apps.');
    const isExportable = isGoogleDoc && !file.mimeType?.endsWith('.folder') && !file.mimeType?.endsWith('.shortcut');

    let streamData: any;
    let mimeType = file.mimeType || 'application/octet-stream';
    const headers = new Headers();
    let status = 200;

    if (isExportable) {
      // Google application files must be exported (for example to PDF)
      const exportResponse = await drive.files.export(
        { fileId: targetId, mimeType: 'application/pdf' },
        { responseType: 'stream' }
      );
      streamData = exportResponse.data;
      mimeType = 'application/pdf';
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        fileName = `${fileName}.pdf`;
      }
    } else {
      const rangeHeader = request.headers.get('range');
      let headersConfig: any = {};

      if (rangeHeader && fileSize) {
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Number(fileSize) - 1;
        const chunksize = (end - start) + 1;

        headersConfig = { Range: `bytes=${start}-${end}` };
        status = 206;
        headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Content-Length', chunksize.toString());
      } else if (fileSize) {
        headers.set('Content-Length', fileSize.toString());
        headers.set('Accept-Ranges', 'bytes');
      }

      const streamResponse = await drive.files.get(
        { fileId: targetId, alt: 'media' },
        { responseType: 'stream', headers: headersConfig }
      );
      streamData = streamResponse.data;
    }

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

    return new NextResponse(streamData, { status, headers });
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