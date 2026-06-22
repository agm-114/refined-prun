import { clickElement } from '@src/util';
import { PrunI18N } from '@src/infrastructure/prun-ui/i18n';

export async function closeWindow(window: HTMLElement | null | undefined) {
  if (!window) {
    return;
  }

  const close = PrunI18N['Window.action.close']?.[0]?.value;
  const button = _$$(window, C.Window.button).find(x => x.textContent === close);
  await clickElement(button);
}
