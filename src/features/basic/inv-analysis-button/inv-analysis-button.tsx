import { getInvStore } from '@src/core/store-id';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { getEntityNaturalIdFromAddress } from '@src/infrastructure/prun-api/data/addresses';
import { openCompanionBuffer, setBufferSize } from '@src/infrastructure/prun-ui/buffers';
import StoSummaryPanel from './StoSummaryPanel.vue';

async function onTileReady(tile: PrunTile) {
  const store = computed(() => getInvStore(tile.parameter));
  const site = computed(() =>
    store.value ? sitesStore.getById(store.value.addressableId) : undefined,
  );
  const naturalId = computed(() =>
    site.value ? getEntityNaturalIdFromAddress(site.value.address) : undefined,
  );

  const contextBar = await $(tile.frame, C.ContextControls.container);

  let panelShown = false;

  createFragmentApp(() => {
    if (!naturalId.value) {
      return null;
    }
    return (
      <div
        class={[C.ContextControls.item, C.fonts.fontRegular, C.type.typeSmall]}
        onClick={() => {
          if (!panelShown) {
            showPanel(tile, naturalId.value!);
            panelShown = true;
          }
        }}>
        <span>
          <span class={C.ContextControls.cmd}>ANALYSIS</span>
        </span>
      </div>
    );
  }).prependTo(contextBar);
}

function showPanel(tile: PrunTile, naturalId: string) {
  const storeContainer = _$(tile.anchor, C.StoreView.container) as HTMLElement | null;
  if (!storeContainer) {
    return;
  }

  // Make anchor a flex column so the panel sits below the store view.
  tile.anchor.style.display = 'flex';
  tile.anchor.style.flexDirection = 'column';
  storeContainer.style.flex = '1';
  storeContainer.style.minHeight = '0';
  storeContainer.style.overflow = 'hidden';

  const panelWrapper = document.createElement('div');
  panelWrapper.style.flexShrink = '0';
  tile.anchor.appendChild(panelWrapper);

  let ro: ResizeObserver | undefined;

  createFragmentApp(StoSummaryPanel, {
    naturalId,
    onExpand: () => {
      ro?.disconnect();
      panelWrapper.remove();
      void openAnalysis(tile, naturalId);
    },
  }).appendTo(panelWrapper);

  // Grow a solo floating buffer so the panel doesn't cover existing content.
  if (tile.container.classList.contains(C.Window.body)) {
    const parsedW = parseInt(tile.container.style.width, 10);
    const parsedH = parseInt(tile.container.style.height, 10);
    const w = Number.isNaN(parsedW) ? 600 : parsedW;
    const h = Number.isNaN(parsedH) ? 400 : parsedH;
    let prevPanelHeight = 0;
    ro = new ResizeObserver(() => {
      const panelHeight = panelWrapper.offsetHeight;
      if (panelHeight !== prevPanelHeight) {
        prevPanelHeight = panelHeight;
        setBufferSize(tile.id, w, h + panelHeight);
      }
    });
    ro.observe(panelWrapper);
  }
}

async function openAnalysis(tile: PrunTile, naturalId: string) {
  await openCompanionBuffer(tile, `XIT STO ${naturalId}`, 'vertical');
}

function init() {
  tiles.observe('INV', onTileReady);
}

features.add(
  import.meta.url,
  init,
  'INV: Adds an Analysis button that shows an XIT STO summary pane, expandable to a full companion buffer.',
);
