import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import PrunButton from '@src/components/PrunButton.vue';
import { setBufferSize, showBuffer } from '@src/infrastructure/prun-ui/buffers';
import { increaseDefaultBufferSize } from '@src/infrastructure/prun-ui/buffer-sizes';
import { clickElement, changeInputValue } from '@src/util';
import { getPrunId } from '@src/infrastructure/prun-ui/attributes';
import { UI_TILES_CHANGE_COMMAND } from '@src/infrastructure/prun-api/client-messages';
import { dispatchClientPrunMessage } from '@src/infrastructure/prun-api/prun-api-listener';

function onTileReady(tile: PrunTile) {
  if (!tile.parameter) {
    return;
  }

  const onClick = (e: MouseEvent) => {
    const warehouse = warehousesStore.getByEntityNaturalId(tile.parameter);
    const storageId = storagesStore.getById(warehouse?.storeId)?.id?.substring(0, 8);
    const cmd = storageId ? `INV ${storageId}` : `WAR ${tile.parameter}`;
    if (e.shiftKey) {
      void openCompanionBuffer(tile, cmd);
    } else {
      void showBuffer(cmd);
    }
  };

  subscribe($$(tile.anchor, C.ActionBar.container), container => {
    createFragmentApp(() => (
      <div class={C.ActionBar.element}>
        <PrunButton primary onClick={onClick}>
          WAREHOUSE
        </PrunButton>
      </div>
    )).appendTo(container);
  });
}

async function openCompanionBuffer(tile: PrunTile, command: string) {
  const windowEl = tile.frame.closest(`.${C.Window.window}`) as HTMLElement | null;

  if (tile.container.classList.contains(C.Window.body)) {
    const parsedW = parseInt(tile.container.style.width, 10);
    const parsedH = parseInt(tile.container.style.height, 10);
    const w = Number.isNaN(parsedW) ? 600 : parsedW;
    const h = Number.isNaN(parsedH) ? 400 : parsedH;
    setBufferSize(tile.id, w + 450, h);

    const splitButton = _$$(tile.frame, C.TileControls.control).find(x => x.textContent === '|');
    await clickElement(splitButton);

    if (!windowEl) {
      return;
    }

    const node = await $(windowEl, C.Node.node);
    const companion = _$$(node, C.Node.child)[1] as HTMLElement | undefined;
    if (companion) {
      await setChildCommand(companion, command);
    }
  } else if (tile.container.classList.contains(C.Node.child)) {
    const node = tile.container.parentElement!;
    const sibling = _$$(node, C.Node.child).find(x => x !== tile.container);
    if (sibling) {
      await setChildCommand(sibling, command);
    }
  }
}

async function setChildCommand(child: Element, command: string) {
  const tileEl = _$(child, C.Tile.tile) as HTMLElement | null;
  if (!tileEl) {
    return;
  }

  const id = getPrunId(tileEl)!;
  const message = UI_TILES_CHANGE_COMMAND(id, command);
  if (!dispatchClientPrunMessage(message)) {
    const input = (await $(child, C.PanelSelector.input)) as HTMLInputElement;
    changeInputValue(input, command);
    input.form!.requestSubmit();
  }
}

function init() {
  tiles.observe('BS', onTileReady);
  increaseDefaultBufferSize('BS', { width: 90 });
}

features.add(import.meta.url, init, 'BS: Adds a "Warehouse" button.');
