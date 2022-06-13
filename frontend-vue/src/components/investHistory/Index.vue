<template>
  <SubMenu></SubMenu>
  <router-view></router-view>
</template>

<script>
import SubMenu from './SubMenu.vue';

export default {
  components: {
    SubMenu,
  },
  setup() {
  }
}
</script>
