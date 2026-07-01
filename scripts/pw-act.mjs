// Attaches to the already-running browser via CDP and runs one action, then
// takes a screenshot. Actions: click <selector>, type <selector> <text>,
// press <key>, screenshot <path>, eval <js-expression>
import { playwright, CDP_ENDPOINT } from './pw-helper.mjs';

const { chromium } = playwright;
const [action, ...rest] = process.argv.slice(2);

const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
const context = browser.contexts()[0];
const page = context.pages()[0];

switch (action) {
  case 'click': {
    await page.click(rest[0]);
    break;
  }
  case 'click-force': {
    await page.click(rest[0], { force: true });
    break;
  }
  case 'type': {
    const [selector, ...textParts] = rest;
    await page.fill(selector, textParts.join(' '));
    break;
  }
  case 'press': {
    await page.keyboard.press(rest[0]);
    break;
  }
  case 'press-on': {
    const [selector, key] = rest;
    await page.press(selector, key);
    break;
  }
  case 'fill-nth': {
    const [selector, index, ...valueParts] = rest;
    await page.locator(selector).nth(Number(index)).fill(valueParts.join(' '));
    break;
  }
  case 'click-nth': {
    const [selector, index] = rest;
    await page.locator(selector).nth(Number(index)).click();
    break;
  }
  case 'screenshot': {
    await page.screenshot({ path: rest[0] });
    console.log('Saved screenshot to', rest[0]);
    break;
  }
  case 'eval': {
    // page.evaluate(string) evaluates the raw expression without auto-invoking
    // function literals, so wrap-and-call explicitly.
    const result = await page.evaluate(`(${rest.join(' ')})()`);
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  default: {
    console.error('Unknown action:', action);
    process.exit(1);
  }
}

process.exit(0);
