<template>
  <template v-if="!isMobile">
    <Menubar
        :model="menus"
    >
    </Menubar>
  </template>
  <template v-else>
    <div class="p-menubar">
      <a class="p-menubar-button" @click="showSidebar = !showSidebar">
        <i class="pi pi-bars"></i>
      </a>
      <div class="flex flex-grow-1 align-content-center">
        <h1 class="text-base flex-grow-1 text-center">{{SITE_NAME}}</h1>
      </div>
    </div>
    <Sidebar
        v-model:visible="showSidebar"
        position="left"
    >

      <Tree
          :value="menus"
      >
        <template #default="{node}">
          <a :href="node.to">{{node.label}}</a>
        </template>
      </Tree>
    </Sidebar>
  </template>
</template>

<script>
import {useStore} from "vuex";
import {ref, computed} from "vue";

import Menubar from 'primevue/menubar';
import Sidebar from 'primevue/sidebar';
import Tree from 'primevue/tree';

export default {
  components: {
    Menubar,
    Sidebar,
    Tree,
  },
  setup(props) {
    //set vars: vuex
    const store = useStore();

    const SITE_NAME = computed(() => store.getters['getSiteName']);
    const isMobile = computed(() => store.getters["isMobile"]);

    const showSidebar = ref(false);

    const menus = ref([
      {label: 'Home', icon: 'pi pi-home', to: '/'},
      {
        label: 'Invest',
        icon: 'pi pi-dollar',
        to: '/invest-history'
      },
    ]);

    const test = ref([
      {
        key: 0,
        label: 'Home',
        icon: 'pi pi-home',
        url: '/'
      },
      {
        key: 1,
        label: 'Invest',
        icon: 'pi pi-dollar',
        url: '/invest-history'
      },
    ]);

    return {
      SITE_NAME,
      isMobile,
      menus,
      showSidebar,
      test,
    }
  }
}
</script>

<style scoped>
.p-menubar {
  border-radius: 0 0 6px 6px;
}
.p-menubar :deep(.p-menubar-root-list .p-menuitem .router-link-active) {
  border: 1px solid #c0c0c0;
}

@media screen and (max-width: 960px) {
  .p-menubar {
    border-radius: 0;
  }
}
</style>
<style>
@media screen and (max-width: 960px) {
  .p-sidebar {
    width: 75%;
  }
}
</style>