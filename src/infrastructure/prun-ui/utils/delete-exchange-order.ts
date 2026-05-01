import { clickElement } from '@src/util';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import { mirrorConfirmationOverlay } from '@src/infrastructure/prun-ui/utils/mirror-confirmation-overlay';
import { getPrunId } from '@src/infrastructure/prun-ui/attributes';
import onNodeDisconnected from '@src/utils/on-node-disconnected';
import { showConfirmationOverlay } from '@src/infrastructure/prun-ui/tile-overlay';
import ActionFeedbackProgress from '@src/components/ActionFeedbackProgress.vue';
import { watchUntil } from '@src/utils/watch';
import { cxosStore } from '@src/infrastructure/prun-api/data/cxos';
import { fxosStore } from '@src/infrastructure/prun-api/data/fxos';
import { sleep } from '@src/utils/sleep';
import { refAnimationFrame } from '@src/utils/reactive-dom';

export async function deleteExchangeOrderFromClick(
  event: Event,
  orderId: string,
  screenCommand: 'CXOS' | 'FXOS',
) {
  event.preventDefault();
  event.stopPropagation();
  return await new Promise<boolean>(resolve => {
    showConfirmationOverlay(
      event,
      async () => {
        const success = await deleteExchangeOrder(event.target as Element, orderId, screenCommand);
        resolve(success);
      },
      { message: 'Delete this order?', confirmLabel: 'Delete' },
    );
  });
}

export async function deleteExchangeOrder(
  target: Element,
  orderId: string,
  screenCommand: 'CXOS' | 'FXOS',
) {
  orderId = orderId.toLowerCase();
  const dismissProgress = showManualProgressOverlay(target);

  const shouldClose = ref(false);
  const stopWatch = watch(shouldClose, value => {
    if (value) {
      dismissProgress();
      stopWatch();
    }
  });

  // FXOS doesn't support 9999 D:
  const isCX = screenCommand === 'CXOS';
  const commandWithParameter = isCX ? `${screenCommand} 9999` : screenCommand;
  const window = await showBuffer(commandWithParameter, {
    autoClose: true,
    closeWhen: shouldClose,
    force: true,
  });
  await watchUntil(() => (isCX ? cxosStore.fetched.value : fxosStore.fetched.value));
  const orderCount = (isCX ? cxosStore.all.value?.length : fxosStore.all.value?.length) ?? 0;
  if (orderCount === 0) {
    shouldClose.value = true;
    return false;
  }
  await awaitBufferLoad(window);
  const button = await findOrderDangerButton(window, orderId);
  if (!button) {
    shouldClose.value = true;
    return false;
  }
  mirrorConfirmationOverlay(window, target);
  await clickElement(button);
  const outcome = await awaitActionOutcome(window);
  onNodeDisconnected(outcome, () => {
    shouldClose.value = true;
  });
  return outcome.classList.contains(C.ActionFeedback.success);
}

function awaitActionOutcome(window: Element) {
  return new Promise<Element>(resolve => {
    const findOutcome = () =>
      _$(window, C.ActionFeedback.error) ?? _$(window, C.ActionFeedback.success);
    const existing = findOutcome();
    if (existing) {
      resolve(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const outcome = findOutcome();
      if (outcome) {
        observer.disconnect();
        resolve(outcome);
      }
    });
    observer.observe(window, { childList: true, subtree: true });
  });
}

function showManualProgressOverlay(target: Element) {
  const targetBody = target.closest(`.${C.TileFrame.body}`);
  if (!targetBody) {
    return () => {};
  }
  const before = new Set(Array.from(targetBody.children));
  const progressApp = createFragmentApp(ActionFeedbackProgress);
  progressApp.appendTo(targetBody);
  const manual = Array.from(targetBody.children).filter(x => !before.has(x));

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) {
      return;
    }
    dismissed = true;
    progressApp.unmount();
    observer.disconnect();
  };

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const added of Array.from(mutation.addedNodes)) {
        if (
          added instanceof Element &&
          added.classList.contains(C.ActionFeedback.overlay) &&
          !manual.includes(added)
        ) {
          dismiss();
          return;
        }
      }
    }
  });
  observer.observe(targetBody, { childList: true });
  return dismiss;
}

async function awaitBufferLoad(window: Element) {
  // Allow FXOS to display the table after loading.
  await sleep(100);

  const loading = _$(window, C.Loading.loader);
  if (loading) {
    await new Promise<void>(resolve => {
      onNodeDisconnected(loading, resolve);
    });
  }
}

async function findOrderDangerButton(window: Element, orderId: string) {
  const tbody = _$(window, 'tbody');
  if (!tbody) {
    return undefined;
  }

  const loadMoreButton = _$(window, C.EndlessScrollControl.loadMore);
  let nextRowIndex = 0;
  while (true) {
    while (nextRowIndex < tbody.children.length) {
      const row = tbody.children[nextRowIndex] as HTMLElement | undefined;
      nextRowIndex++;
      if (!row) {
        continue;
      }
      const isMatch = getPrunId(row)?.startsWith(orderId);
      if (isMatch) {
        return _$(row, C.Button.danger);
      }
    }

    const canClickLoadMore =
      loadMoreButton && !loadMoreButton.classList.contains(C.EndlessScrollControl.hidden);
    if (!canClickLoadMore) {
      break;
    }

    await clickElement(loadMoreButton);
    const isReady = refAnimationFrame(tbody, x => nextRowIndex < x.children.length);
    await watchUntil(isReady);
  }

  return undefined;
}
