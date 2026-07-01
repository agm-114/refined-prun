// Gracefully closes the browser launched by local-browser-test.mjs, so the
// profile (login session) is flushed to disk on a clean shutdown.
// Usage: node scripts/pw-close.mjs
import { playwright, CDP_ENDPOINT } from './pw-helper.mjs';

const { chromium } = playwright;

const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
await browser.close();
console.log('Browser closed.');
