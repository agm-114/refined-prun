import { shipsStore } from '@src/infrastructure/prun-api/data/ships';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { openCompanionBuffer, showBuffer } from '@src/infrastructure/prun-ui/buffers';
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

  const baseStore = computed(() => {
    const id = planetNaturalId.value;
    if (!id) {
      return undefined;
    }
    const site = sitesStore.getByPlanetNaturalId(id);
    return storagesStore.all.value?.find(x => x.addressableId === site?.siteId);
  });

  const contextBar = await $(tile.frame, C.ContextControls.container);

  createFragmentApp(() => {
    const store = baseStore.value;
    const id = planetNaturalId.value;
    if (!store || !id) {
      return null;
    }
    return (
      <div
        class={[C.ContextControls.item, C.fonts.fontRegular, C.type.typeSmall]}
        onClick={(e: MouseEvent) => {
          const cmd = `INV ${store.id.substring(0, 8)}`;
          if (e.shiftKey) {
            void openCompanionBuffer(tile, cmd);
          } else {
            showBuffer(cmd);
          }
        }}>
        <span>
          <span class={C.ContextControls.cmd}>INV {id}</span>
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
