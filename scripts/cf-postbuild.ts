import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const outputServerDir = resolve(projectRoot, '.output/server');

const filesToCopy = [
  resolve(projectRoot, 'fake_output/server/worker-entry.mjs'),
  resolve(projectRoot, 'Dockerfile_ffmpeg'),
  resolve(projectRoot, 'server.py'),
];

mkdirSync(outputServerDir, { recursive: true });

for (const sourcePath of filesToCopy) {
  const targetPath = resolve(outputServerDir, basename(sourcePath));
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

const wranglerConfigPath = resolve(outputServerDir, 'wrangler.json');
const wranglerConfig = JSON.parse(readFileSync(wranglerConfigPath, 'utf8')) as {
  main?: string;
};

wranglerConfig.main = 'worker-entry.mjs';

writeFileSync(wranglerConfigPath, JSON.stringify(wranglerConfig, null, 2) + '\n');
