import css from '@src/utils/css-utils.module.css';
import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import PrunButton from '@src/components/PrunButton.vue';
import $style from './pli-warehouse-open-button.module.css';

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
    const hiddenClass = computed(() => (warehouseStore.value ? undefined : css.hidden));

    createFragmentApp(() => (
      <PrunButton
        dark
        inline
        class={[$style.openButton, hiddenClass.value]}
        onClick={() => {
          const store = warehouseStore.value;
          if (store) showBuffer(`INV ${store.id.substring(0, 8)}`);
        }}>
        OPEN
      </PrunButton>
    )).appendTo(row);
  });
}

function init() {
  tiles.observe('PLI', onTileReady);
}

features.add(
  import.meta.url,
  init,
  "PLI: Adds an OPEN button to the warehouse row to open the player's warehouse inventory.",
);
