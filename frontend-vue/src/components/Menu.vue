<template>
  <Menubar
      :model="menus"
  ></Menubar>
</template>

<script>
import {ref} from "vue";

import Menubar from 'primevue/menubar';

export default {
  components: {
    Menubar
  },
  setup() {
    const menus = ref([
      {label: 'Home', icon: 'pi pi-home', to: '/'},
      {
        label: 'Invest',
        icon: 'pi pi-dollar',
        to: '/invest-history'
      },
    ]);

    return {
      menus,
    }
  }
}
</script>

<style scoped>
.p-menubar :deep(.p-menubar-root-list .p-menuitem .router-link-active) {
  border: 1px solid #c0c0c0;
}
</style>