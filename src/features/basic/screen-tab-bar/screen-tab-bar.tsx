import $style from './screen-tab-bar.module.css';
import TabBar from './TabBar.vue';
import FolderCreator from './FolderCreator.vue';
import FldrButton from './FldrButton.vue';
import { userData } from '@src/store/user-data';
import removeArrayElement from '@src/utils/remove-array-element';
import { watchEffectWhileNodeAlive } from '@src/utils/watch';
import { syncState } from '@src/features/basic/screen-tab-bar/sync';

function onListReady(list: HTMLElement) {
  subscribe($$(list, C.ScreenControls.screen), onScreenItemReady);
  watchEffect(() => {
    syncState();
    sortScreenList(list);
  });
}

function sortScreenList(list: HTMLElement) {
  const screens = _$$(list, C.ScreenControls.screen).map(screen => {
    const name = _$(screen, C.ScreenControls.name) as HTMLAnchorElement;
    const id = extractScreenId(name.href);
    const index = id ? userData.tabs.order.indexOf(id) : -1;
    return {
      el: screen,
      index,
    };
  });
  screens.sort((a, b) => a.index - b.index);
  for (const screen of screens) {
    list.appendChild(screen.el);
  }
  list.appendChild(_$(list, C.ScreenControls.undo)!);
}

async function onScreenItemReady(item: HTMLElement) {
  const name = (await $(item, C.ScreenControls.name)) as HTMLAnchorElement;
  const id = extractScreenId(name.href)!;
  if (id === undefined) {
    return;
  }
  const copy = await $(item, C.ScreenControls.copy);
  const hidden = computed(() => userData.tabs.hidden.includes(id));

  watchEffectWhileNodeAlive(name, () => {
    if (hidden.value) {
      name.classList.add($style.hiddenName);
    } else {
      name.classList.remove($style.hiddenName);
    }
  });

  function onClick(e: Event) {
    if (hidden.value) {
      removeArrayElement(userData.tabs.hidden, id);
    } else {
      userData.tabs.hidden.push(id);
    }
    e.stopPropagation();
    e.preventDefault();
  }

  createFragmentApp(() => (
    <div class={[C.ScreenControls.delete, C.type.typeSmall, $style.hideButton]} onClick={onClick}>
      {hidden.value ? 'shw' : 'hide'}
    </div>
  )).before(copy);
}

function extractScreenId(url?: string) {
  return url?.match(/screen=([\w-]+)/)?.[1] ?? undefined;
}

function onContainerReady(container: HTMLElement) {
  createFragmentApp(TabBar).appendTo(container);
  let fldrInserted = false;
  subscribe($$(container, C.HeadItem.label), label => {
    if (fldrInserted || label.textContent !== 'FULL') return;
    const fullItem = label.closest(`.${C.HeadItem.container}`) as HTMLElement | null;
    if (!fullItem) return;
    fldrInserted = true;
    createFragmentApp(FldrButton).before(fullItem);
  });
}

function init() {
  subscribe($$(document, C.ScreenControls.container), onContainerReady);
  subscribe($$(document, C.ScreenControls.screens), onListReady);
  applyCssRule(`.${C.Head.contextAndScreens}`, $style.contextAndScreens);
  applyCssRule(`.${C.ScreenControls.container}`, $style.screenControls);
  xit.add({
    command: 'FLDR',
    name: 'NEW FOLDER',
    description: 'Create a new screen folder.',
    component: () => FolderCreator,
    bufferSize: [450, 110],
  });
}

features.add(import.meta.url, init, 'Adds a tab bar for user screens.');
