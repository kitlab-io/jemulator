import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const electronDistDir = path.resolve(rootDir, 'dist', 'needle');
const backupDir = path.resolve(rootDir, '.needle-build-backup');

console.log('🔄 Restoring Needle JS build from backup...');
fs.ensureDirSync(path.dirname(electronDistDir));
fs.copySync(backupDir, electronDistDir, { overwrite: true });
console.log(`✅ Needle JS build restored to ${electronDistDir}`);
