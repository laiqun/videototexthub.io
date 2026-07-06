import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const outputServerDir = resolve(projectRoot, '.output/server');


const ssrPath = ".output/server/_ssr/ssr.mjs";
const code = readFileSync(ssrPath, "utf-8");

const match = code.match(/ssr_exports\s+as\s+([a-zA-Z_$][\w$]*)/);

const exportName = match?.[1];

const out = `import { ${exportName} as ssr } from './_ssr/ssr.mjs';

export const HelloWorldDurableObject = ssr.HelloWorldDurableObject;
export const FfmpegContainer = ssr.FfmpegContainer;

export { default } from './index.mjs';
`;

writeFileSync(".output/server/worker-entry.mjs", out);


const filesToCopy = [
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
