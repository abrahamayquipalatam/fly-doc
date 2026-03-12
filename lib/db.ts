import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'db.json');

let db: any = { downloads: [] };

if (fs.existsSync(dbPath)) {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function save() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export const downloads = {
  create: (data: any) => {
    const item = { id: crypto.randomUUID(), ...data };
    db.downloads.push(item);
    save();
    return item;
  },
  findMany: (where: any) => {
    return db.downloads.filter((d: any) => {
      for (const key in where) {
        if (d[key] !== where[key]) return false;
      }
      return true;
    });
  },
  update: (where: any, data: any) => {
    const item = db.downloads.find((d: any) => d.id === where.id);
    if (item) {
      Object.assign(item, data);
      save();
    }
  },
};