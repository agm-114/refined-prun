import { clickElement } from '@src/util';
import { sleep } from '@src/utils/sleep';
import $style from './contd-bulk-add-commodity.module.css';

function findAddButton(anchor: Element) {
  return _$$(anchor, 'button').find(btn => {
    const t = btn.textContent?.trim().toLowerCase();
    return t === 'add commodity' || t === 'add shipment';
  }) as HTMLElement | undefined;
}

function onTileReady(tile: PrunTile) {
  subscribe($$(tile.anchor, 'button'), btn => {
    const t = (btn as HTMLButtonElement).textContent?.trim().toLowerCase();
    if (t !== 'add commodity' && t !== 'add shipment') {
      return;
    }
    const addBtn = btn as HTMLElement;

    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.min = '1';
    countInput.value = '1';
    countInput.className = $style.countInput;
    addBtn.before(countInput);

    let running = false;
    addBtn.addEventListener('click', async () => {
      if (running) return;
      running = true;
      try {
        const n = Math.max(1, parseInt(countInput.value, 10) || 1);
        for (let i = 1; i < n; i++) {
          const expected = _$$(tile.anchor, C.TemplateSelection.group).length + 1;
          await waitForGroups(tile.anchor, expected);
          await clickElement(findAddButton(tile.anchor));
        }
      } finally {
        running = false;
      }
    });
  });
}

async function waitForGroups(anchor: Element, expected: number, timeout = 2000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (_$$(anchor, C.TemplateSelection.group).length >= expected) {
      return;
    }
    await sleep(50);
  }
}

function init() {
  tiles.observe('CONTD', onTileReady);
}

features.add(
  import.meta.url,
  init,
  'CONTD: Adds a count input beside the add commodity/shipment button to add multiple rows at once.',
);
