<template>
  <div id="menuWrap">
    <div class="item"></div>
    <router-link to="/">Home</router-link>
  </div>
</template>

<style>

#menuWrap {
  display: block;
  margin: 0;
  padding: 0;
}

#menuWrap .item {
  display: inline-block;
  border-right: 1px solid;
  padding: 10px;
}
</style>