<template>
  <template v-if="!isMobile">
    <Menubar
        :model="menus"
        class="gnb"
    >
      <template #end>
        <template v-if="isLogin">
          <Button label="LOGOUT" class="p-button-sm p-button-outlined p-button-rounded p-button-danger" icon="pi pi-sign-out" @click="logout"></Button>
        </template>
        <template v-else>
          <Button label="LOGIN" class="p-button-sm p-button-outlined p-button-rounded p-button-info" icon="pi pi-sign-in" @click="login"></Button>
        </template>
      </template>
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
      <template #header>
        <template v-if="isLogin">
          <Button label="LOGOUT" class="p-button-sm p-button-outlined p-button-rounded p-button-danger" icon="pi pi-sign-out" @click="logout"></Button>
        </template>
        <template v-else>
          <Button label="LOGIN" class="p-button-sm p-button-outlined p-button-rounded p-button-info" icon="pi pi-sign-in" @click="login"></Button>
        </template>
      </template>
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
import {useRouter} from 'vue-router';

import Menubar from 'primevue/menubar';
import Sidebar from 'primevue/sidebar';
import PanelMenu from 'primevue/panelmenu';
import Button from "primevue/button";

export default {
  components: {
    Menubar,
    Sidebar,
    PanelMenu,
    Button,
  },
  setup(props) {
    //set vars: vuex, router
    const store = useStore();
    const router = useRouter();

    //set vars: constant
    const SITE_NAME = computed(() => store.getters['getSiteName']);
    const isMobile = computed(() => store.getters["isMobile"]);
    const isLogin = computed(() => store.getters['user/isLogin']);

    //set vars: sidebar flag
    const showSidebar = ref(false);

    //set vars: menu
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
      }
    ]);

    /**
     * login event
     */
    const login = () => {
      router.push({name: 'login'});
    }

    /**
     * logout event
     */
     const logout = () => {
       store.dispatch('user/logout');
       router.push({name: 'login'});
     }

    return {
      SITE_NAME,
      isMobile,
      isLogin,
      menus,
      showSidebar,
      login,
      logout,
    }
  }
}
</script>

<style>
.p-sidebar .p-sidebar-header .p-sidebar-header-content {
  flex-grow: 1;
}
</style>