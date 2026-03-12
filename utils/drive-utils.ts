import { FLOTA_FOLDER_IDS } from '../config/constants';
import { drive } from '../lib/google-drive';

/**
 * Determine whether the given folder id is one of the configured roots
 * or a descendant of one of them.  If the folder is nested, we walk up
 * the parent chain until either we hit a permitted root or we reach an
 * item with no parents.
 */
export async function isAllowedFolder(folderId: string): Promise<boolean> {
  const roots = Object.values(FLOTA_FOLDER_IDS);
  if (roots.includes(folderId)) return true;

  try {
    let current = folderId;
    // limit depth to prevent infinite loops
    for (let i = 0; i < 10 && current; i++) {
      const resp = await drive.files.get({
        fileId: current,
        fields: 'id, parents',
      });
      const parents = resp.data.parents || [];
      if (parents.some(p => roots.includes(p))) return true;
      current = parents[0];
    }
  } catch (err) {
    // ignore errors, fall through to false
    console.error('isAllowedFolder error', err);
  }
  return false;
}

export function folderIdForFlota(f: string): string | undefined {
  return FLOTA_FOLDER_IDS[f];
}