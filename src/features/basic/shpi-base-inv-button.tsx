import { shipsStore } from '@src/infrastructure/prun-api/data/ships';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import {
  getLocationLineFromAddress,
  isPlanetLine,
} from '@src/infrastructure/prun-api/data/addresses';

async function onTileReady(tile: PrunTile) {
  const ship = computed(() => shipsStore.getByRegistration(tile.parameter));

  const baseStore = computed(() => {
    const s = ship.value;
    if (!s || s.flightId !== null) {
      return undefined;
    }
    const location = getLocationLineFromAddress(s.address ?? undefined);
    if (!isPlanetLine(location)) {
      return undefined;
    }
    const site = sitesStore.getByPlanetNaturalId(location.entity.naturalId);
    return storagesStore.all.value?.find(x => x.addressableId === site?.siteId);
  });

  const contextBar = await $(tile.frame, C.ContextControls.container);

  createFragmentApp(() => {
    const store = baseStore.value;
    if (!store) {
      return null;
    }
    return (
      <div
        class={[C.Button.primary, C.ContextControls.item, C.fonts.fontRegular, C.type.typeSmall]}
        onClick={() => showBuffer(`INV ${store.id.substring(0, 8)}`)}>
        <span>
          <span class={C.ContextControls.cmd} style={{ color: 'white' }}>BASE INV</span>
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
  'SHPI: Adds a Base Inv button when the ship is landed at a planet with a player base.',
);
