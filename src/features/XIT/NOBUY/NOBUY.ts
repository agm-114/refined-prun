import NOBUY from '@src/features/XIT/NOBUY/NOBUY.vue';

xit.add({
  command: 'NOBUY',
  name: 'NO BUY LIST',
  description: 'Global list of materials excluded from all ACT material group bills.',
  component: () => NOBUY,
});
