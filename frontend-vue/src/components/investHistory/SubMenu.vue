<template>
  <TabMenu
      :model="subMenus"
      class="block"
  ></TabMenu>
</template>

<script>
import {ref} from "vue";

import TabMenu from 'primevue/tabmenu';

export default {
  components: {
    TabMenu
  },
  setup() {
    const subMenus = ref([
      {label: 'history', to: '/invest-history/history'},
      {label: 'group', to: '/invest-history/group'},
      {label: 'item', to: '/invest-history/item'},
      {label: 'unit', to: '/invest-history/unit'},
    ]);

    return {
      subMenus
    }
  }
}
</script>


<style scoped>
</style>