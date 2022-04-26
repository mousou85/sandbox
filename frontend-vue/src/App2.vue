<script setup>
import Menu from './components/Menu.vue';
</script>

<template>
  <header>
    <Menu></Menu>
  </header>
  <main>
    <router-view></router-view>
  </main>
</template>

<style>
body {
  margin: 0;
}

header {
  display: block;
}
main {
  display: block;
  padding: 20px;
}
</style>