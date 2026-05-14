import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import PrunButton from '@src/components/PrunButton.vue';

function onTileReady(tile: PrunTile) {
  subscribe($$(tile.anchor, C.PlanetaryProjectsList.row), row => {
    const link = _$(row, C.Link.link);
    if (!link || link.textContent !== 'Warehouse') {
      return;
    }

    const warehouse = computed(() => warehousesStore.getByEntityNaturalIdOrName(tile.parameter));
    const warehouseStore = computed(() =>
      storagesStore
        .getByAddressableId(warehouse.value?.warehouseId)
        ?.find(x => x.type === 'WAREHOUSE_STORE'),
    );

    createFragmentApp(() => {
      const ws = warehouseStore.value;
      if (ws) {
        return (
          <PrunButton primary inline style={{ marginLeft: '4px' }} onClick={() => showBuffer(`INV ${ws.id.substring(0, 8)}`)}>
            OPEN
          </PrunButton>
        );
      }
      return (
        <PrunButton primary inline style={{ marginLeft: '4px' }} onClick={() => showBuffer(`WAR ${tile.parameter}`)}>
          RENT
        </PrunButton>
      );
    }).appendTo(row);
  });
}

function init() {
  tiles.observe('PLI', onTileReady);
}

features.add(
  import.meta.url,
  init,
  "PLI: Adds an OPEN/RENT button to the warehouse row depending on whether the player has a warehouse.",
);
