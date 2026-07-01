// Attaches to the already-running browser (launched by local-browser-test.mjs)
// via CDP and takes a screenshot without touching the profile or relaunching.
// Usage: node scripts/pw-screenshot.mjs <output-path>
import { playwright, CDP_ENDPOINT } from './pw-helper.mjs';

const { chromium } = playwright;
const outPath = process.argv[2];
if (!outPath) {
  console.error('Usage: node scripts/pw-screenshot.mjs <output-path>');
  process.exit(1);
}

const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
const context = browser.contexts()[0];
const page = context.pages()[0];
console.log('URL:', page.url());
console.log('Title:', await page.title());
await page.screenshot({ path: outPath });
console.log('Saved screenshot to', outPath);
// Deliberately not calling browser.close() here: over CDP that terminates the
// real browser process. Just let this process exit; the connection drops on its own.
process.exit(0);
