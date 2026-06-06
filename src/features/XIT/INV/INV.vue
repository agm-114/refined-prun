<script setup lang="ts">
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { shipsStore } from '@src/infrastructure/prun-api/data/ships';
import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import {
  getEntityNameFromAddress,
  getEntityNaturalIdFromAddress,
  isStationLine,
  getLocationLineFromAddress,
} from '@src/infrastructure/prun-api/data/addresses';
import RadioItem from '@src/components/forms/RadioItem.vue';
import LoadingSpinner from '@src/components/LoadingSpinner.vue';
import InvBar from '@src/features/XIT/BS/InvBar.vue';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import { fixed0 } from '@src/utils/format';
import { useTileState } from './tile-state';

type InvType = 'BASE' | 'SHIP' | 'WAREHOUSE' | 'CX';

const TYPE_ORDER: Record<InvType, number> = { BASE: 0, SHIP: 1, WAREHOUSE: 2, CX: 3 };

interface InvRow {
  storeId: string;
  type: InvType;
  label: string;
  naturalId?: string;
  warehousePlanetId?: string;
  onClickCmd: string;
  weightCapacity: number;
  volumeCapacity: number;
}

const showBase = useTileState('showBase');
const showShip = useTileState('showShip');
const showWarehouse = useTileState('showWarehouse');
const showCx = useTileState('showCx');
const showBaseWar = useTileState('showBaseWar');

const basePlanetIds = computed(() => {
  const sites = sitesStore.all.value;
  if (!sites) return new Set<string>();
  return new Set(
    sites
      .map(site => getEntityNaturalIdFromAddress(site.address))
      .filter((id): id is string => !!id),
  );
});

const allRows = computed<InvRow[] | undefined>(() => {
  const stores = storagesStore.nonFuelStores.value;
  const sites = sitesStore.all.value;
  const ships = shipsStore.all.value;
  const warehouses = warehousesStore.all.value;

  if (!stores || !sites || !ships || !warehouses) return undefined;

  const rows: InvRow[] = [];

  for (const store of stores) {
    if (store.type === 'STORE') {
      const site = sitesStore.getById(store.addressableId);
      if (!site) continue;
      const naturalId = getEntityNaturalIdFromAddress(site.address);
      if (!naturalId) continue;
      rows.push({
        storeId: store.id,
        type: 'BASE',
        label: getEntityNameFromAddress(site.address) ?? naturalId,
        naturalId,
        onClickCmd: `INV ${store.id.substring(0, 8)}`,
        weightCapacity: store.weightCapacity,
        volumeCapacity: store.volumeCapacity,
      });
    } else if (store.type === 'SHIP_STORE') {
      const ship = ships.find(s => s.idShipStore === store.id);
      if (!ship) continue;
      rows.push({
        storeId: store.id,
        type: 'SHIP',
        label: ship.name || ship.registration,
        onClickCmd: `SHPI ${ship.registration}`,
        weightCapacity: store.weightCapacity,
        volumeCapacity: store.volumeCapacity,
      });
    } else if (store.type === 'WAREHOUSE_STORE') {
      const warehouse = warehouses.find(w => w.storeId === store.id);
      if (!warehouse) continue;
      const locationLine = getLocationLineFromAddress(warehouse.address);
      const isCx = isStationLine(locationLine);
      const naturalId = getEntityNaturalIdFromAddress(warehouse.address);
      const label = getEntityNameFromAddress(warehouse.address) ?? naturalId ?? 'Unknown';
      rows.push({
        storeId: store.id,
        type: isCx ? 'CX' : 'WAREHOUSE',
        label,
        warehousePlanetId: isCx ? undefined : naturalId,
        onClickCmd: `INV ${store.id.substring(0, 8)}`,
        weightCapacity: store.weightCapacity,
        volumeCapacity: store.volumeCapacity,
      });
    }
  }

  rows.sort((a, b) => {
    const typeOrder = TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    if (typeOrder !== 0) return typeOrder;
    return a.label.localeCompare(b.label);
  });

  return rows;
});

const filteredRows = computed(() => {
  const rows = allRows.value;
  if (!rows) return undefined;

  return rows.filter(row => {
    if (row.type === 'BASE' && !showBase.value) return false;
    if (row.type === 'SHIP' && !showShip.value) return false;
    if (row.type === 'WAREHOUSE' && !showWarehouse.value) return false;
    if (row.type === 'CX' && !showCx.value) return false;
    if (!showBaseWar.value && row.type === 'WAREHOUSE' && row.warehousePlanetId) {
      if (basePlanetIds.value.has(row.warehousePlanetId)) return false;
    }
    return true;
  });
});

function formatCapacity(row: InvRow) {
  return `${fixed0(row.weightCapacity)}t / ${fixed0(row.volumeCapacity)}m³`;
}
</script>

<template>
  <LoadingSpinner v-if="!filteredRows" />
  <template v-else>
    <div :class="C.ComExOrdersPanel.filter">
      <RadioItem v-model="showBase" horizontal>BASE</RadioItem>
      <RadioItem v-model="showShip" horizontal>SHIP</RadioItem>
      <RadioItem v-model="showWarehouse" horizontal>WAREHOUSE</RadioItem>
      <RadioItem v-model="showCx" horizontal>CX</RadioItem>
      <div :class="$style.separator" />
      <RadioItem v-model="showBaseWar" horizontal>BASE WAR</RadioItem>
    </div>
    <table :class="$style.table">
      <thead>
        <tr>
          <th :class="$style.nameCol">Name</th>
          <th :class="$style.typeCol">Type</th>
          <th :class="$style.barCol">Inventory</th>
          <th :class="$style.sizeCol">Capacity</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filteredRows" :key="row.storeId" :class="$style.row">
          <td :class="$style.nameCell">
            <span :class="C.Link.link" @click="showBuffer(row.onClickCmd)">{{ row.label }}</span>
          </td>
          <td :class="$style.typeCell">{{ row.type }}</td>
          <td :class="$style.barCell">
            <InvBar
              :store-id="row.storeId"
              :natural-id="row.naturalId"
              :on-click-cmd="row.onClickCmd" />
          </td>
          <td :class="$style.sizeCell">{{ formatCapacity(row) }}</td>
        </tr>
      </tbody>
    </table>
  </template>
</template>

<style module>
.separator {
  width: 1px;
  align-self: stretch;
  background-color: #2b485a;
  margin: 0 0.25rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.nameCol {
  width: auto;
}

.typeCol {
  width: 0;
  white-space: nowrap;
}

.barCol {
  width: 40%;
  min-width: 80px;
}

.sizeCol {
  width: 0;
  white-space: nowrap;
}

.row {
  border-bottom: 1px solid #2b485a;
}

.nameCell {
  padding: 4px 6px;
  max-width: 20ch;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.typeCell {
  padding: 4px 6px;
  font-size: 11px;
  opacity: 0.7;
  text-align: center;
  white-space: nowrap;
}

.barCell {
  padding: 2px;
  padding-bottom: 0;
}

.sizeCell {
  padding: 4px 6px;
  white-space: nowrap;
  font-size: 11px;
  text-align: right;
}
</style>
