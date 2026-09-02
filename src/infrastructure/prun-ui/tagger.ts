export enum ElementTag {
  FXPO_LOTS_FIELD = 'rp-fxpo-lots-field',
  FXPO_CURRENT_PRICE_FIELD = 'rp-fxpo-current-price-field',
  FXPO_MAXIMUM_PRICE_FIELD = 'rp-fxpo-maximum-price-field',
  FXPO_MINIMUM_PRICE_FIELD = 'rp-fxpo-minimum-price-field',
  POPID_RESERVE_CELL = 'rp-popid-reserve-cell',
}

export function tagUI() {
  tagFxpoFields();
  tagPopidColumns();
}

function tagFxpoFields() {
  const map = buildMap([
    [L.ForExPlaceOrderForm.label.lots(), ElementTag.FXPO_LOTS_FIELD],
    [L.ForExPlaceOrderForm.label.price(), ElementTag.FXPO_CURRENT_PRICE_FIELD],
    [L.ForExPlaceOrderForm.limit.maximum(), ElementTag.FXPO_MAXIMUM_PRICE_FIELD],
    [L.ForExPlaceOrderForm.limit.minimum(), ElementTag.FXPO_MINIMUM_PRICE_FIELD],
  ]);

  tiles.observe('FXPO', tile => {
    subscribe($$(tile.anchor, C.forms.formComponent), formComponent => {
      const label = _$(formComponent, 'label');
      if (!label) {
        return;
      }
      const span = _$(label, 'span');
      if (!span) {
        return;
      }
      const textContent = span.textContent;
      if (textContent) {
        const tag = map.get(textContent);
        if (tag !== undefined) {
          formComponent.classList.add(tag);
        }
      }
    });
  });
}

function tagPopidColumns() {
  const columnTags = buildMap([[L.Contribution.table.reserve(), ElementTag.POPID_RESERVE_CELL]]);

  tiles.observe('POPID', tile => {
    subscribe($$(tile.anchor, 'table'), table => tagTable(table, columnTags));
  });
}

function tagTable(table: HTMLTableElement, tagMap: Map<string, ElementTag>) {
  subscribe($$(table, 'thead'), thead => {
    const headerRow = thead.children[0];
    if (headerRow === undefined) {
      return;
    }
    const cells = Array.from(headerRow.children);
    const tags = cells.map(x => tagMap.get(x.textContent ?? ''));
    if (tags.every(x => x === undefined)) {
      return;
    }
    subscribe($$(table, 'tbody'), tbody => {
      subscribe($$(tbody, 'tr'), tr => {
        for (let i = 0; i < tags.length; i++) {
          const tag = tags[i];
          if (tag !== undefined) {
            tr.children.item(i)?.classList.add(tag);
          }
        }
      });
    });
  });
}

function buildMap(items: [string | undefined, ElementTag][]) {
  const map = new Map<string, ElementTag>();
  for (const [key, value] of items) {
    if (key !== undefined) {
      map.set(key, value);
    }
  }
  return map;
}
