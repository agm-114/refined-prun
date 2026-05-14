import { shipsStore } from '@src/infrastructure/prun-api/data/ships';
import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import {
  getLocationLineFromAddress,
  isPlanetLine,
} from '@src/infrastructure/prun-api/data/addresses';

async function onTileReady(tile: PrunTile) {
  const ship = computed(() => shipsStore.getByRegistration(tile.parameter));

  const planetNaturalId = computed(() => {
    const s = ship.value;
    if (!s || s.flightId !== null) {
      return undefined;
    }
    const location = getLocationLineFromAddress(s.address ?? undefined);
    if (!isPlanetLine(location)) {
      return undefined;
    }
    return location.entity.naturalId;
  });

  const warehouseStore = computed(() => {
    const id = planetNaturalId.value;
    if (!id) {
      return undefined;
    }
    const warehouse = warehousesStore.getByEntityNaturalId(id);
    return storagesStore.getById(warehouse?.storeId);
  });

  const contextBar = await $(tile.frame, C.ContextControls.container);

  createFragmentApp(() => {
    const ws = warehouseStore.value;
    const id = planetNaturalId.value;
    if (!ws || !id) {
      return null;
    }
    return (
      <div
        class={[C.ContextControls.item, C.fonts.fontRegular, C.type.typeSmall]}
        onClick={() => showBuffer(`INV ${ws.id.substring(0, 8)}`)}>
        <span>
          <span class={C.ContextControls.cmd}>WAR {id}</span>
        </span>
      </div>
    );
  }).prependTo(contextBar);
}

function init() {
  tiles.observe('SHPI', onTileReady);
}

features.add(
  import.meta.url,
  init,
  'SHPI: Adds a Warehouse button when the ship is landed at a planet with a player warehouse.',
);
