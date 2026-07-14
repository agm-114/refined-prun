import { flightPlansStore } from '@src/infrastructure/prun-api/data/flight-plans';
import { flightsStore } from '@src/infrastructure/prun-api/data/flights';
import { shipsStore } from '@src/infrastructure/prun-api/data/ships';
import { getPrice } from '@src/infrastructure/fio/cx';
import { fixed0, formatCurrency } from '@src/utils/format';
import { getPrunId } from '@src/infrastructure/prun-ui/attributes';

const costLineSelector = '[data-rp-sfc-flight-cost]';

function onTileReady(tile: PrunTile) {
  void onMissionPlanReady(tile);
}

async function onMissionPlanReady(tile: PrunTile) {
  const [table, stats] = await Promise.all([
    $(tile.anchor, C.MissionPlan.table),
    $(tile.anchor, C.MissionPlan.stats),
  ]);
  const line = getOrCreateCostLine(table);

  let scheduled = false;
  const update = () => {
    scheduled = false;
    if (!tile.anchor.isConnected) {
      observer.disconnect();
      return;
    }

    updateCostLine(tile, table, stats, line);
  };
  const scheduleUpdate = () => {
    if (scheduled) {
      return;
    }
    scheduled = true;
    requestAnimationFrame(update);
  };

  const observer = new MutationObserver(scheduleUpdate);
  observer.observe(table, { childList: true, subtree: true, characterData: true });
  observer.observe(stats, { childList: true, subtree: true, characterData: true });

  scheduleUpdate();
  setTimeout(scheduleUpdate, 2000);
  setTimeout(scheduleUpdate, 10000);
}

function getOrCreateCostLine(table: HTMLElement) {
  const existing = table.querySelector(costLineSelector);
  if (existing instanceof HTMLElement) {
    return existing;
  }

  const line = document.createElement('div');
  line.dataset.rpSfcFlightCost = 'true';
  return line;
}

function updateCostLine(tile: PrunTile, table: HTMLElement, stats: Element, line: HTMLElement) {
  const damageCell = getSummaryDamageCell(table);
  if (!damageCell) {
    return;
  }

  const ship = shipsStore.getByRegistration(tile.parameter);
  const planId = getPrunId(table);
  const cost = getFlightCost(ship, planId, stats.textContent);
  const text = `Cost: ${formatCurrency(cost, fixed0)}`;
  if (line.textContent !== text) {
    line.textContent = text;
  }
  if (line.parentElement !== damageCell) {
    damageCell.appendChild(line);
  }
}

function getSummaryDamageCell(table: HTMLElement) {
  const rows = Array.from(table.getElementsByTagName('tr'));
  const summary = rows.find(
    x => x.children[0]?.textContent?.trim() === '' && x.children[5] !== undefined,
  );
  const row = summary ?? rows.findLast(x => x.children[5] !== undefined);
  return row?.children[5];
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

  return fuelCost + (parseFee(statsText) ?? 0);
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

  let fee = 0;
  let hasFee = false;
  for (const match of text.matchAll(/([\d.,]+)\s*(?:AIC|CIS|ICA|NCC)/gi)) {
    const value = parseFeeNumber(match[1]);
    if (value === undefined) {
      continue;
    }
    fee += value;
    hasFee = true;
  }

  if (hasFee) {
    return fee;
  }

  if (/fees?\s*--/i.test(text)) {
    return undefined;
  }

  const match = /fees?\s*[^\dA-Za-z]*([\d.,]+)/i.exec(text);
  return match?.[1] ? parseFeeNumber(match[1]) : undefined;
}

function parseFeeNumber(text: string) {
  const value = Number(text.replaceAll(',', ''));
  return isFinite(value) ? value : undefined;
}

function init() {
  tiles.observe('SFC', onTileReady);
}

features.add(import.meta.url, init, 'SFC: Shows the total flight cost including fees and fuel.');
