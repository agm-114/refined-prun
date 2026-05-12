import FolderCreator from './FolderCreator.vue';
import FldrButton from './FldrButton.vue';

function onContainerReady(container: HTMLElement) {
  let fldrInserted = false;
  subscribe($$(container, C.HeadItem.label), label => {
    if (fldrInserted || label.textContent !== 'FULL') {
      return;
    }
    const fullItem = label.closest(`.${C.HeadItem.container}`) as HTMLElement | null;
    if (!fullItem) {
      return;
    }
    fldrInserted = true;
    createFragmentApp(FldrButton).before(fullItem);
  });
}

function init() {
  subscribe($$(document, C.ScreenControls.container), onContainerReady);
  xit.add({
    command: 'FLDR',
    name: 'NEW FOLDER',
    description: 'Create a new screen folder.',
    component: () => FolderCreator,
    bufferSize: [450, 110],
  });
}

features.add(import.meta.url, init, 'Adds folder management to the screen tab bar.');
