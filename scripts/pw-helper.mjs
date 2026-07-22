// Shared helpers for local-browser-test.mjs and ad-hoc follow-up scripts.
// Playwright is intentionally NOT a project devDependency (kept out of package.json/pnpm-lock) —
// it's installed in isolation under .local/pw-tools so this is purely a local testing tool.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(__dirname, '..');
export const distDir = path.join(root, 'dist');
export const profileDir = path.join(root, '.local', 'browser-profile');
export const CDP_PORT = 9333;
export const CDP_ENDPOINT = `http://127.0.0.1:${CDP_PORT}`;
export const APEX_URL = 'https://apex.prosperousuniverse.com';

const require = createRequire(import.meta.url);
export const playwright = require(path.join(root, '.local', 'pw-tools', 'node_modules', 'playwright'));
