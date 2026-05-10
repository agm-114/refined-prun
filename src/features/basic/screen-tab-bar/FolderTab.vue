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

function deleteFolder() {
  for (const screenId of folder.screenIds.slice()) {
    userData.tabs.order.push(screenId);
  }
  removeArrayElement(userData.tabs.order, folder.id);
  removeArrayElement(userData.tabs.folders, folder);
  showDropdown.value = false;
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
      <span :class="[C.HeadItem.label, C.links.textLink]">{{ folder.name }}</span>
      <div :class="indicatorClasses" />
    </div>
  </div>
  <Teleport to="body">
    <div
      v-if="showDropdown"
      :class="$style.dropdown"
      :style="dropdownStyle"
      @mouseenter="onDropdownEnter"
      @mouseleave="onDropdownLeave">
      <a
        v-for="screenId in folder.screenIds"
        :key="screenId"
        :href="`#screen=${screenId}`"
        :class="[$style.dropdownItem, screenId === currentScreenId && $style.dropdownItemActive]">
        <span :class="$style.screenName">{{ getScreen(screenId)?.name ?? screenId }}</span>
        <span :class="$style.removeBtn" @click.prevent="removeScreen(screenId)">×</span>
      </a>
      <div :class="$style.deleteFolder" @click="deleteFolder">delete folder</div>
    </div>
  </Teleport>
</template>

<style module>
.folderTab {
  flex-shrink: 0;
  cursor: pointer;
}

.dropdown {
  position: fixed;
  z-index: 9999;
  background: #181818;
  border: 1px solid #333;
  min-width: 100px;
}

.dropdownItem {
  display: flex;
  align-items: center;
  padding: 3px 8px;
  text-decoration: none;
  color: inherit;

  &:hover {
    background: #2a2a2a;
  }
}

.dropdownItemActive .screenName {
  color: #7fa8e0;
}

.screenName {
  flex: 1;
}

.removeBtn {
  margin-left: 8px;
  cursor: pointer;
  color: #666;

  &:hover {
    color: #e55;
  }
}

.deleteFolder {
  padding: 3px 8px;
  color: #666;
  cursor: pointer;
  border-top: 1px solid #333;

  &:hover {
    color: #e55;
  }
}
</style>
