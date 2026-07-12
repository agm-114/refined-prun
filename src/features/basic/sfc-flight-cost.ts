import { flightPlansStore } from '@src/infrastructure/prun-api/data/flight-plans';
import { flightsStore } from '@src/infrastructure/prun-api/data/flights';
import { shipsStore } from '@src/infrastructure/prun-api/data/ships';
import { getPrice } from '@src/infrastructure/fio/cx';
import { formatCurrency } from '@src/utils/format';
import { refPrunId } from '@src/infrastructure/prun-ui/attributes';
import { refTextContent } from '@src/utils/reactive-dom';
import { watchEffectWhileNodeAlive } from '@src/utils/watch';

function onTileReady(tile: PrunTile) {
  const ship = computed(() => shipsStore.getByRegistration(tile.parameter));
  void onMissionPlanReady(tile.anchor, ship);
}

async function onMissionPlanReady(anchor: HTMLElement, ship: Ref<PrunApi.Ship | undefined>) {
  const [table, stats] = await Promise.all([
    $(anchor, C.MissionPlan.table),
    $(anchor, C.MissionPlan.stats),
  ]);
  const statsText = refTextContent(stats);
  const planId = refPrunId(table);
  const cost = computed(() => getFlightCost(ship.value, planId.value, statsText.value));
  const line = document.createElement('div');
  line.textContent = 'Cost: --';

  watchEffectWhileNodeAlive(anchor, () => {
    line.textContent = `Cost: ${formatCurrency(cost.value)}`;
    if (stats.lastChild !== line) {
      stats.appendChild(line);
    }
  });
}

function getFlightCost(
  ship: PrunApi.Ship | undefined,
  planId: string | null,
  statsText: string | null,
) {
  const fuelCost = getFuelCost(ship, planId);
  if (fuelCost === undefined) {
    return undefined;
  }

  const fee = parseFee(statsText);
  if (fee === undefined) {
    return fuelCost;
  }

  return fee + fuelCost;
}

function getFuelCost(ship: PrunApi.Ship | undefined, planId: string | null) {
  const segments = getSegments(ship, planId);
  if (!segments) {
    return undefined;
  }

  let sf = 0;
  let ff = 0;
  for (const segment of segments) {
    sf += segment.stlFuelConsumption ?? 0;
    ff += segment.ftlFuelConsumption ?? 0;
  }

  const sfCost = getFuelTypeCost('SF', sf);
  const ffCost = getFuelTypeCost('FF', ff);
  if (sfCost === undefined || ffCost === undefined) {
    return undefined;
  }

  return sfCost + ffCost;
}

function getFuelTypeCost(ticker: string, amount: number) {
  if (amount === 0) {
    return 0;
  }

  const price = getPrice(ticker);
  return price === undefined ? undefined : amount * price;
}

function getSegments(ship: PrunApi.Ship | undefined, planId: string | null) {
  if (!ship) {
    return undefined;
  }

  if (ship.flightId) {
    return flightsStore.getById(ship.flightId)?.segments;
  }

  if (!planId) {
    return undefined;
  }

  return flightPlansStore.getById(planId)?.segments;
}

function parseFee(text: string | null) {
  if (!text) {
    return undefined;
  }

  const match = /fees?\s*(?:--|[^\dA-Za-z]*([\d.,]+))/i.exec(text);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1].replaceAll(',', ''));
  return isFinite(value) ? value : undefined;
}

function init() {
  tiles.observe('SFC', onTileReady);
}

features.add(import.meta.url, init, 'SFC: Shows the total flight cost including fees and fuel.');
