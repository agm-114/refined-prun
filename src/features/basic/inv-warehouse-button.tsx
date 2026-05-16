import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { setBufferSize, showBuffer } from '@src/infrastructure/prun-ui/buffers';
import { getInvStore } from '@src/core/store-id';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { getEntityNaturalIdFromAddress } from '@src/infrastructure/prun-api/data/addresses';
import { clickElement, changeInputValue } from '@src/util';
import { getPrunId } from '@src/infrastructure/prun-ui/attributes';
import { UI_TILES_CHANGE_COMMAND } from '@src/infrastructure/prun-api/client-messages';
import { dispatchClientPrunMessage } from '@src/infrastructure/prun-api/prun-api-listener';

async function onTileReady(tile: PrunTile) {
  if (!tile.parameter) {
    return;
  }

  const store = getInvStore(tile.parameter);
  if (store?.type !== 'STORE') {
    return;
  }

  const naturalId = computed(() => {
    const site = sitesStore.getById(store.addressableId);
    return getEntityNaturalIdFromAddress(site?.address);
  });

  const contextBar = await $(tile.frame, C.ContextControls.container);

  const onClick = (e: MouseEvent) => {
    const id = naturalId.value;
    const warehouse = warehousesStore.getByEntityNaturalId(id);
    const storageId = storagesStore.getById(warehouse?.storeId)?.id?.substring(0, 8);
    const cmd = storageId ? `INV ${storageId}` : `WAR ${id}`;
    if (e.shiftKey) {
      void openCompanionBuffer(tile, cmd);
    } else {
      void showBuffer(cmd);
    }
  };

  // Insert after the analysis button (first child, prepended by inv-analysis-button)
  // so the order is: ANALYSIS, WAR, game buttons
  const anchorNode = contextBar.firstChild;
  const app = createFragmentApp(() => {
    const id = naturalId.value;
    if (!id) {
      return null;
    }
    return (
      <div
        class={[C.ContextControls.item, C.fonts.fontRegular, C.type.typeSmall]}
        onClick={onClick}>
        <span>
          <span class={C.ContextControls.cmd}>WAR {id}</span>
        </span>
      </div>
    );
  });

  if (anchorNode) {
    app.after(anchorNode);
  } else {
    app.prependTo(contextBar);
  }
}

async function openCompanionBuffer(tile: PrunTile, command: string) {
  const windowEl = tile.frame.closest(`.${C.Window.window}`) as HTMLElement | null;

  if (tile.container.classList.contains(C.Window.body)) {
    const w = parseInt(tile.container.style.width, 10) || 600;
    const h = parseInt(tile.container.style.height, 10) || 400;
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
  tiles.observe('INV', onTileReady);
}

features.add(import.meta.url, init, 'INV: Adds a "Warehouse" button to base inventories.');
