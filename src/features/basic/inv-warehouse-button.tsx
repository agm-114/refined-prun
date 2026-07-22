import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { openCompanionBuffer, showBuffer } from '@src/infrastructure/prun-ui/buffers';
import { getInvStore } from '@src/core/store-id';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { getEntityNaturalIdFromAddress } from '@src/infrastructure/prun-api/data/addresses';

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

function init() {
  tiles.observe('INV', onTileReady);
}

features.add(import.meta.url, init, 'INV: Adds a "Warehouse" button to base inventories.');
