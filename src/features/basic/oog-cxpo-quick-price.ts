import { setQuickPriceEnabled } from './cxpo-order-book/quick-price';

function init() {
  setQuickPriceEnabled(true);
}

features.add(
  import.meta.url,
  init,
  'CXPO: Shows ghost price rows to quickly undercut/outbid in the order book.',
);
