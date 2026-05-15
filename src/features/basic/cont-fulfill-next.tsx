import { clickElement } from '@src/util';
import { refAnimationFrame } from '@src/utils/reactive-dom';
import PrunButton from '@src/components/PrunButton.vue';

async function onTileReady(tile: PrunTile) {
  await $(tile.anchor, C.Button.btn);

  const nextBtn = refAnimationFrame(tile.anchor, () => getNextFulfillButton(tile.anchor));

  createFragmentApp(() => (
    <PrunButton
      primary
      disabled={!nextBtn.value}
      onClick={() => {
        const btn = nextBtn.value;
        if (btn) void clickElement(btn);
      }}>
      FULFILL NEXT
    </PrunButton>
  )).prependTo(tile.anchor);
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
