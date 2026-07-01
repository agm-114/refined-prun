---
name: run
description: Launch a real Edge browser with the refined-prun extension loaded via a persistent profile, so you can log into Prosperous Universe once and then drive/observe the live game UI (navigate, click, screenshot) across many tool calls. Triggers on "run the app", "test this in the browser", "verify this feature", "take a screenshot of the game". Do NOT use for pure unit/type checks (use `pnpm run compile`) — this is for visual/behavioral verification against the real game.
---

# Run: Local Browser Test Harness

This is a Manifest V3 browser extension (see `docs/architecture.md`) — it intercepts
the game's WebSocket and injects a page-level `<script>` at `document_start`, so it
**must** run as a real unpacked extension in a real Chromium-based browser. It cannot
be tested by just visiting the game as a webpage.

This skill launches Edge (already installed on Windows) with the built extension via
Playwright, using a persistent profile so login survives across runs. It exposes a CDP
debug port so follow-up steps can attach and drive the page without relaunching.

## Prerequisites (one-time per machine)

1. **pnpm on PATH.** `corepack prepare pnpm@<version> --activate` fails with `EPERM`
   writing to `C:\Program Files\nodejs\pnpm` (no admin rights). Fix once:
   ```
   npm install -g pnpm@10.32.1
   ```
   (Match the version pinned in `package.json`'s `packageManager` field.) Verify with
   `pnpm --version`. If this still isn't available, fall back to `npx pnpm@10.32.1 <cmd>`
   for every command below.

2. **Isolated Playwright install.** Playwright is deliberately **not** a project
   devDependency (kept out of `package.json`/`pnpm-lock.yaml`) — it's a personal testing
   tool, installed once under the gitignored `.local/` directory:
   ```
   mkdir -p .local/pw-tools
   cd .local/pw-tools && npm init -y
   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install playwright --no-save --prefix .
   cd -
   ```
   `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` skips downloading Playwright's bundled Chromium —
   unnecessary since we launch the system Edge via `channel: 'msedge'`. Check
   `.local/pw-tools/node_modules/playwright` exists before redoing this step.

Both are already satisfied if `.local/pw-tools/node_modules/playwright` and a working
`pnpm` exist — skip straight to "Every session" below.

## Every session

### 1. Build the extension

Check out the branch/commit under test first if it isn't already current, then:
```
pnpm install   # only if node_modules is missing
pnpm run build:fast
```
`build:fast` skips `tsc --noEmit` (faster; run `pnpm run compile` separately if you want
type errors surfaced). Output goes to `dist/`.

### 2. Launch the browser

```
node scripts/local-browser-test.mjs
```
Run this with a **backgrounded/non-blocking** shell call — the process blocks forever on
purpose (`await new Promise(() => {})`) to keep the browser subprocess alive and to hold
the CDP port open at `http://127.0.0.1:9333`. Killing the process kills the browser.

First time ever: tell the user the window is open at `apex.prosperousuniverse.com` and
**wait for them to log in manually** — do not attempt this yourself. After that, the
profile at `.local/browser-profile` persists the session; **you will not need to log in
again in future sessions** unless the user clears that directory.

To verify persistence after a fresh checkout of this skill: close cleanly with
`node scripts/pw-close.mjs` (sends `browser.close()` over CDP — a clean shutdown flushes
the profile), then relaunch and confirm the page loads straight into the game (no login
form). Skip this check once you've already confirmed it works on this machine.

### 3. Drive and observe the page

Use `scripts/pw-act.mjs` for everything else — it attaches to the already-running
browser via `chromium.connectOverCDP()` each time, so it never touches the profile or
relaunches anything:

```
node scripts/pw-act.mjs click '<selector>'
node scripts/pw-act.mjs click-force '<selector>'          # bypass actionability checks
node scripts/pw-act.mjs type '<selector>' <text>           # page.fill
node scripts/pw-act.mjs fill-nth '<selector>' <index> <text>
node scripts/pw-act.mjs click-nth '<selector>' <index>
node scripts/pw-act.mjs press '<key>'                       # keyboard.press, global focus
node scripts/pw-act.mjs press-on '<selector>' '<key>'        # press targeted at one element
node scripts/pw-act.mjs eval "() => { ...; return x; }"      # see gotcha #1 below
node scripts/pw-act.mjs screenshot '<absolute-output-path>'
```

For one-off screenshots without any interaction, `scripts/pw-screenshot.mjs <path>` is
a shorthand that also prints the current URL and title.

**Never call `browser.close()` in an observe/act script.** Over `connectOverCDP`,
`browser.close()` terminates the real browser process (unlike `chromium.connect()` to a
Playwright server, where it just disconnects). Only `pw-close.mjs` should call it, and
only when you actually intend to shut the browser down.

### 4. Cleanup

```
node scripts/pw-close.mjs
```
then stop the backgrounded launcher process (`TaskStop` on its task id, or Ctrl+C if
running in a foreground terminal — the launcher also has a SIGINT handler that closes
the context cleanly).

## Gotchas learned the hard way

1. **`page.evaluate(someString)` does not auto-invoke a function-literal string.** Unlike
   passing a real JS function reference, a string is evaluated as a raw expression — a
   string like `"() => document.title"` evaluates to the function object itself (which
   serializes to `undefined`), it does not call it. `pw-act.mjs`'s `eval` action already
   wraps this correctly (`(${code})()`) — just use it, don't call `page.evaluate` raw
   with an unwrapped string elsewhere.

2. **Button/link text is often styled all-caps via CSS but the DOM text is mixed-case**
   (e.g. the "VIEW" button's actual `textContent` is `"View"`, "NEW BFR" is real caps,
   "SELECT TEMPLATE"'s real text is `"Select Template"`, the "all" button is genuinely
   lowercase). Match case-insensitively (`.toLowerCase()`) when searching by text, or
   prefer matching on stable class names / attributes once you've found them once.

3. **A just-filled input keeps focus, and its focus-ring can cover a sibling button.**
   Several of the game's custom form-input components render an absolutely-positioned
   focus-ring pseudo-element (`::before`) on the wrapper div. A statically-positioned
   sibling (like an injected action button) painted *before* that pseudo-element in the
   normal stacking order ends up *underneath* it while the input has focus — Playwright
   reports this as `<div ...> intercepts pointer events` and the click times out. Fix:
   blur first (`document.activeElement.blur()` via `eval`, or click a neutral area) and
   retry. This exact issue was a real bug in the CONTD "all" button feature (fixed by
   giving the button `position: relative; z-index: 1` in
   `src/features/basic/contd-fill-all-button.module.css`) — when testing any injected
   button that sits next to an editable field, always test the click **immediately after
   typing** (the natural user flow), not after an unrelated pause where focus may have
   already moved on.

4. **Opening any buffer:** either click an existing shortcut (left sidebar, or an
   in-tile link), or click **NEW BFR** (bottom-left corner) to open an empty floating
   buffer, then type the command code (e.g. `CONTD`) into its "Enter content command"
   input and press Enter — **on that specific input**, via `press-on`, not a bare
   `keyboard.press('Enter')` (which sends the key to whatever has focus and may not
   submit if focus isn't exactly where you think). See `docs/game/ui-concepts.md` →
   "Opening a Buffer (Two Paths)".

5. **`CONTD` with no draft ID opens the CONTRACT DRAFTS list**, not a template directly.
   Click "View" on a draft row to open it, then "Select Template" to reach the
   BUYING/SELLING commodity template (the screen with Amount / Price per unit /
   "add commodity" — this is what `C.TemplateSelection.group` in
   `contd-fill-all-button.tsx` targets). "add commodity" appends another row, useful for
   testing anything that needs 2+ commodity sections.

6. **Never click anything that would talk to the game server** (submitting a contract
   draft, placing an order, etc.) — per `docs/contributing.md`, every server-affecting
   action needs an explicit user click. Navigation, opening screens, filling local form
   fields, and screenshotting are all safe for you to drive; anything with a "Save" /
   "Submit" / "Send" effect is not — ask the user to click it themselves.

## Files

- `scripts/pw-helper.mjs` — shared constants (paths, CDP port, APEX URL) and the
  `require()`-via-absolute-path trick that loads the isolated Playwright install
  (plain `import 'playwright'` won't resolve since it's outside the normal
  `node_modules` lookup chain from `scripts/`).
- `scripts/local-browser-test.mjs` — the long-running launcher.
- `scripts/pw-close.mjs` — clean shutdown (flushes the profile).
- `scripts/pw-screenshot.mjs` — quick one-off screenshot + URL/title.
- `scripts/pw-act.mjs` — generic action runner for everything else.
