import { PrunI18N } from '@src/infrastructure/prun-ui/i18n';

export function closePrunWindow(window: Element | null | undefined) {
  if (!window) {
    return;
  }

  const close = PrunI18N['Window.action.close']?.[0]?.value;
  const button = _$$(window, C.Window.button).find(
    x => x.textContent === close,
  ) as HTMLButtonElement;
  button.click();
}

export function closeTileWindow(tile: PrunTile) {
  if (!tile.docked) {
    closePrunWindow(tile.window);
  }
}
