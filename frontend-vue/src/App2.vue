<script setup>
import Menu from './components/Menu.vue';
</script>

<template>
  <header class="block">
    <Menu></Menu>
  </header>
  <main class="block">
    <router-view></router-view>
  </main>
</template>

<style scoped>
</style>