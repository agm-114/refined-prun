<script setup lang="ts">
import { userData } from '@src/store/user-data';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import removeArrayElement from '@src/utils/remove-array-element';

defineOptions({ inheritAttrs: false });

const tabEl = useTemplateRef<HTMLElement>('tab');
const showDropdown = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearHide() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function scheduleHide() {
  hideTimer = setTimeout(() => {
    showDropdown.value = false;
    hideTimer = null;
  }, 150);
}

function onTabEnter() {
  clearHide();
  if (userData.tabs.folders.length > 0) showDropdown.value = true;
}

function onTabLeave() {
  scheduleHide();
}

function onDropdownEnter() {
  clearHide();
}

function onDropdownLeave() {
  scheduleHide();
}

function onClick() {
  void showBuffer('XIT FLDR');
}

function deleteFolder(folderId: string) {
  const folder = userData.tabs.folders.find(f => f.id === folderId);
  if (!folder) return;
  for (const screenId of folder.screenIds) {
    userData.tabs.order.push(screenId);
  }
  removeArrayElement(userData.tabs.folders, folder);
  removeArrayElement(userData.tabs.order, folderId);
  if (userData.tabs.folders.length === 0) showDropdown.value = false;
}

const dropdownStyle = ref<Record<string, string>>({});

watchEffect(() => {
  if (!showDropdown.value) return;
  const rect = tabEl.value?.getBoundingClientRect();
  if (!rect) return;
  dropdownStyle.value = {
    top: `${rect.bottom}px`,
    left: `${rect.left}px`,
  };
});
</script>

<template>
  <div
    ref="tab"
    v-bind="$attrs"
    :class="[C.HeadItem.container, C.fonts.fontRegular, C.type.typeRegular, C.HeadItem.link]"
    @mouseenter="onTabEnter"
    @mouseleave="onTabLeave"
    @click="onClick">
    <span :class="C.HeadItem.label">FLDR</span>
    <div :class="[C.HeadItem.indicator, C.HeadItem.indicatorPrimary]" />
  </div>
  <Teleport to="body">
    <div
      v-if="showDropdown && userData.tabs.folders.length > 0"
      :class="$style.dropdown"
      :style="dropdownStyle"
      @mouseenter="onDropdownEnter"
      @mouseleave="onDropdownLeave">
      <div
        v-for="folder in userData.tabs.folders"
        :key="folder.id"
        :class="C.ScreenControls.screen">
        <span :class="[C.ScreenControls.name, $style.folderName]">{{ folder.name }}</span>
        <div
          :class="[C.ScreenControls.delete, C.type.typeSmall, $style.delBtn]"
          @click.prevent="deleteFolder(folder.id)">
          DEL
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style module>
.dropdown {
  position: fixed;
  z-index: 9999;
  background: #181818;
  border: 1px solid #333;
  min-width: 120px;
}

.folderName {
  color: #7fa8e0;
}

.delBtn {
  width: 26px;
  text-align: center;
}
</style>
