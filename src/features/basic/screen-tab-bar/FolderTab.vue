<script setup lang="ts">
import { screensStore } from '@src/infrastructure/prun-api/data/screens';
import { userData } from '@src/store/user-data';
import removeArrayElement from '@src/utils/remove-array-element';

defineOptions({ inheritAttrs: false });

const { folder } = defineProps<{
  folder: UserData.TabFolder;
}>();

const currentScreenId = computed(() => screensStore.current.value?.id);
const isActive = computed(
  () => currentScreenId.value !== undefined && folder.screenIds.includes(currentScreenId.value),
);

const indicatorClasses = computed(() => ({
  [C.HeadItem.indicator]: true,
  [C.HeadItem.indicatorPrimary]: true,
  [C.HeadItem.indicatorPrimaryActive]: isActive.value,
  [C.effects.shadowPrimary]: isActive.value,
}));

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
  showDropdown.value = true;
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

function rename() {
  const name = window.prompt('Folder name:', folder.name);
  if (name !== null && name.trim() !== '') {
    folder.name = name.trim().toUpperCase();
  }
}

function removeScreen(screenId: string) {
  removeArrayElement(folder.screenIds, screenId);
  userData.tabs.order.push(screenId);
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

function getScreen(id: string) {
  return screensStore.getById(id);
}
</script>

<template>
  <div
    ref="tab"
    v-bind="$attrs"
    :class="$style.folderTab"
    @mouseenter="onTabEnter"
    @mouseleave="onTabLeave"
    @dblclick.prevent="rename">
    <div :class="[C.HeadItem.container, C.fonts.fontRegular, C.type.typeRegular]">
      <span :class="[C.HeadItem.label, $style.folderLabel]">{{ folder.name }}</span>
      <div :class="indicatorClasses" />
    </div>
  </div>
  <Teleport to="body">
    <div
      v-if="showDropdown && folder.screenIds.length > 0"
      :class="$style.dropdown"
      :style="dropdownStyle"
      @mouseenter="onDropdownEnter"
      @mouseleave="onDropdownLeave">
      <div
        v-for="screenId in folder.screenIds"
        :key="screenId"
        :class="C.ScreenControls.screen">
        <a
          :href="`#screen=${screenId}`"
          :class="[C.ScreenControls.name, screenId === currentScreenId && $style.currentScreen]">
          {{ getScreen(screenId)?.name ?? screenId }}
        </a>
        <div
          :class="[C.ScreenControls.delete, C.type.typeSmall, $style.rmvBtn]"
          @click.prevent="removeScreen(screenId)">
          RMV
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style module>
.folderTab {
  flex-shrink: 0;
  cursor: pointer;
}

.folderLabel {
  color: #7fa8e0;

  &:hover {
    color: #7fa8e0;
  }
}

.dropdown {
  position: fixed;
  z-index: 9999;
  background: #181818;
  border: 1px solid #333;
  min-width: 120px;
}

.currentScreen {
  color: #7fa8e0;
}

.rmvBtn {
  width: 26px;
  text-align: center;
}
</style>
