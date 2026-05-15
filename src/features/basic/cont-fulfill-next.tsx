import { clickElement } from '@src/util';
import { refAnimationFrame } from '@src/utils/reactive-dom';

async function onTileReady(tile: PrunTile) {
  const contextBar = await $(tile.frame, C.ContextControls.container);
  const nextBtn = refAnimationFrame(tile.anchor, () => getNextFulfillButton(tile.anchor));

  createFragmentApp(() => (
    <div
      class={[
        C.ContextControls.item,
        C.fonts.fontRegular,
        C.type.typeSmall,
        !nextBtn.value && C.colors.textDisabled,
      ]}
      onClick={() => {
        const btn = nextBtn.value;
        if (btn) {
          void clickElement(btn);
        }
      }}>
      <span>
        <span class={C.ContextControls.cmd}>FULFILL NEXT</span>
      </span>
    </div>
  )).prependTo(contextBar);
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
