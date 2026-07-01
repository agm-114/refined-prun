import { changeInputValue, focusElement } from '@src/util';
import PrunButton from '@src/components/PrunButton.vue';

function onTileReady(tile: PrunTile) {
  let firstGroup: Element | undefined;

  subscribe($$(tile.anchor, C.TemplateSelection.group), group => {
    if (firstGroup !== undefined) {
      return;
    }
    firstGroup = group;

    const amountInput = group.querySelector(
      'input[inputmode="numeric"]',
    ) as HTMLInputElement | null;
    if (amountInput) {
      addAllButton(tile.anchor, amountInput, 'input[inputmode="numeric"]');
    }

    const priceInput = group.querySelector('input[inputmode="decimal"]') as HTMLInputElement | null;
    if (priceInput) {
      addAllButton(tile.anchor, priceInput, 'input[inputmode="decimal"]');
    }
  });
}

function addAllButton(anchor: Element, sourceInput: HTMLInputElement, selector: string) {
  createFragmentApp(() => (
    <PrunButton dark inline onClick={() => fillAll(anchor, sourceInput, selector)}>
      all
    </PrunButton>
  )).before(sourceInput);
}

function fillAll(anchor: Element, sourceInput: HTMLInputElement, selector: string) {
  const value = sourceInput.value;
  for (const group of _$$(anchor, C.TemplateSelection.group)) {
    const target = group.querySelector(selector) as HTMLInputElement | null;
    if (target && target !== sourceInput) {
      focusElement(target);
      changeInputValue(target, value);
    }
  }
}

function init() {
  tiles.observe('CONTD', onTileReady);
}

features.add(
  import.meta.url,
  init,
  'CONTD: Adds "all" buttons next to the first amount/price per unit fields to copy the value to every commodity section.',
);
