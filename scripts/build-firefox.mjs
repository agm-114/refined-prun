import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(repoRoot);

const fontNames = ['fa-solid-900.woff2', 'fa-regular-400.woff2'];
const originalFonts = new Map();

try {
  for (const name of fontNames) {
    const source = join('patches', 'fonts', name);
    const destination = join('src', 'assets', 'fonts', name);
    const original = readFileSync(destination);
    originalFonts.set(destination, original);
    const replacement = readFileSync(source);
    if (!original.equals(replacement)) {
      copyFileSync(source, destination);
      console.log(`build-firefox: restored ${destination} from ${source}`);
    }
  }

  console.log('build-firefox: running pnpm build');
  runPnpm(['run', 'build']);

  const manifest = JSON.parse(readFileSync(join('dist', 'manifest.json'), 'utf8'));
  const xpiName = `refined-prun-${manifest.version}.xpi`;
  console.log(`build-firefox: packaging dist -> ${xpiName}`);
  runPnpm([
    'exec',
    'web-ext',
    'build',
    '--source-dir',
    'dist',
    '--artifacts-dir',
    '.',
    '--filename',
    xpiName,
    '--overwrite-dest',
    '--no-input',
  ]);
  console.log(`build-firefox: done (${Math.ceil(statSync(xpiName).size / 1024)} KiB)`);
  console.log(`build-firefox: output -> ${xpiName}`);
} finally {
  for (const [destination, original] of originalFonts) {
    writeFileSync(destination, original);
  }
}

function runPnpm(args) {
  const pnpmCli = process.env.npm_execpath;
  if (!pnpmCli) {
    throw new Error('build-firefox: npm_execpath is unavailable');
  }
  const isJavaScriptCli = /\.(?:c?js|mjs)$/i.test(pnpmCli);
  const command = isJavaScriptCli ? process.execPath : pnpmCli;
  const commandArgs = isJavaScriptCli ? [pnpmCli, ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`build-firefox: pnpm ${args.join(' ')} failed`);
  }
}
