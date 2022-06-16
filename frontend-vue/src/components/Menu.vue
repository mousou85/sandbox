<template>
  <template v-if="!isMobile">
    <Menubar
        :model="menus"
        class="gnb"
    >
    </Menubar>
  </template>
  <template v-else>
    <div class="p-menubar gnb">
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
      <PanelMenu
        :model="menus"
      >
      </PanelMenu>
    </Sidebar>
  </template>
</template>

<script>
import {useStore} from "vuex";
import {ref, computed} from "vue";

import Menubar from 'primevue/menubar';
import Sidebar from 'primevue/sidebar';
import PanelMenu from 'primevue/panelmenu';

export default {
  components: {
    Menubar,
    Sidebar,
    PanelMenu,
  },
  setup(props) {
    //set vars: vuex
    const store = useStore();

    const SITE_NAME = computed(() => store.getters['getSiteName']);
    const isMobile = computed(() => store.getters["isMobile"]);

    const showSidebar = ref(false);

    const menus = ref([
      {
        key: 'home',
        label: 'Home',
        icon: 'pi pi-home',
        to: '/'
      },
      {
        key: 'invest',
        label: 'Invest',
        icon: 'pi pi-dollar',
        // to: '/invest-history',
        items: [
          {key: 'invest-history', label: 'history', to: '/invest-history/history'},
          {key: 'invest-company', label: 'company', to: '/invest-history/company'},
          {key: 'invest-item', label: 'item', to: '/invest-history/item'},
          {key: 'invest-unit', label: 'unit', to: '/invest-history/unit'},
        ]
      },
      {
        key: 'login',
        label: 'Login',
        to: '/login',
      }
    ]);

    return {
      SITE_NAME,
      isMobile,
      menus,
      showSidebar,
    }
  }
}
</script>