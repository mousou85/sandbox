<template>
  <template v-if="routeName == 'login'">
    <main class="block h-screen">
      <Login></Login>
    </main>
  </template>
  <template v-else>
    <header class="block">
      <Menu></Menu>
    </header>
    <main id="contents" class="block">
      <router-view></router-view>
    </main>
  </template>
</template>

<script>
//vue core
import {useStore} from "vuex";
import {computed, onMounted, watch} from 'vue';
import {useRoute} from "vue-router";

//vuex custom module
import {investHistory} from "@/store/investHistory";

//custom components
import Menu from '@/components/Menu.vue';
import Login from '@/components/Login.vue';

export default {
  components: {
    Menu,
    Login,
  },
  setup(props) {
    //set vars: vuex, route
    const store = useStore();
    const route = useRoute();

    //set vars: route name
    const routeName = computed(() => route.name);

    /*
    life cycle hook
     */
    onMounted(() => {
      /*
      load/resize 이벤트에 모바일 여부 설정 메소드 설정
       */
      window.addEventListener('load', () => {
        setMobileFlag();
      });

      window.addEventListener('resize', () => {
        setMobileFlag();
      });
    });

    /*
    watch variables
     */
    watch(routeName, (newRouteName, oldRouteName) => {
      //load vuex module
      if (oldRouteName != newRouteName) {
        //invest history
        const invest = ['investHistory', 'investCompany', 'investItem', 'investUnit'];
        if (invest.includes(newRouteName)) {
          if (!store.hasModule('investHistory')) {
            store.registerModule('investHistory', investHistory);
          }
        } else {
          if (store.hasModule('investHistory')) {
            store.unregisterModule('investHistory');
          }
        }
      }
    });

    /**
     * 모바일 여부 설정
     */
    const setMobileFlag = () => {
      if (window.innerWidth >= 1024) {
        store.dispatch('setMobile', false);
      } else {
        store.dispatch('setMobile', true);
      }
    }

    return {
      routeName,
    }
  }
}
</script>