import { clickElement } from '@src/util';
import { refAnimationFrame } from '@src/utils/reactive-dom';
import PrunButton from '@src/components/PrunButton.vue';

async function onTileReady(tile: PrunTile) {
  const cmdRow = await $(tile.anchor, C.FormComponent.containerCommand);
  const cmdInput = await $(cmdRow, C.FormComponent.input);

  const nextBtn = refAnimationFrame(tile.anchor, () => getNextFulfillButton(tile.anchor));

  createFragmentApp(() => (
    <PrunButton primary disabled={!nextBtn.value} onClick={onClick}>
      FULFILL NEXT
    </PrunButton>
  )).prependTo(cmdInput);

  async function onClick() {
    const btn = nextBtn.value;
    if (!btn) return;

    await clickElement(btn);

    const overlay = await $(tile.frame, C.ActionFeedback.overlay);
    await waitUntilDone(overlay);
    if (overlay.classList.contains(C.ActionFeedback.success)) {
      await clickElement(overlay);
    }
  }
}

async function waitUntilDone(overlay: Element) {
  if (!overlay.classList.contains(C.ActionFeedback.progress)) {
    return;
  }
  await new Promise<void>(resolve => {
    const observer = new MutationObserver(() => {
      if (!overlay.classList.contains(C.ActionFeedback.progress)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(overlay, { attributes: true });
  });
}

function getNextFulfillButton(anchor: Element): HTMLElement | undefined {
  return (_$$(anchor, C.Button.btn) as HTMLElement[]).find(
    btn =>
      !btn.classList.contains(C.Button.disabled) &&
      btn.textContent?.trim().toUpperCase() === 'FULFILL',
  );
}

function init() {
  tiles.observe('CONT', onTileReady);
}

features.add(
  import.meta.url,
  init,
  'CONT: Adds a Fulfill Next button to sequentially fulfill contract conditions.',
);
