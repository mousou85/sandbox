<template>
  <header class="block">
    <Menu></Menu>
  </header>
  <main class="block">
    <router-view></router-view>
  </main>
</template>

<script>
import {useStore} from "vuex";
import {onMounted} from 'vue';

import Menu from '@/components/Menu.vue';

export default {
  components: {
    Menu
  },
  setup() {
    //set vars: vuex
    const store = useStore();

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
  }
}
</script>


<style scoped>
</style>