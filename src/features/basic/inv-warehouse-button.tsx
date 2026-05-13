import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
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

  const onClick = () => {
    const id = naturalId.value;
    const warehouse = warehousesStore.getByEntityNaturalId(id);
    const storageId = storagesStore.getById(warehouse?.storeId)?.id?.substring(0, 8);
    void showBuffer(storageId ? `INV ${storageId}` : `WAR ${id}`);
  };

  createFragmentApp(() => {
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
  }).appendTo(contextBar);
}

function init() {
  tiles.observe('INV', onTileReady);
}

features.add(import.meta.url, init, 'INV: Adds a "Warehouse" button to base inventories.');
