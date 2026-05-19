import { ref } from 'vue';

export const resupplyOptimalEfficiency = ref(false);

function init() {
  resupplyOptimalEfficiency.value = true;
}

features.add(
  import.meta.url,
  init,
  'XIT ACT: Resupply bill uses optimal (post-resupply) workforce efficiency instead of current degraded efficiency.',
);
