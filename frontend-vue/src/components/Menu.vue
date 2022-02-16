<template>
  <div id="menuWrap">
    <router-link :to="{name: 'index'}" class="item" active-class="active">Home</router-link>
    <router-link :to="{name: 'invest-company'}" class="item" active-class="active">Company</router-link>
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

#menuWrap a.item {
  text-decoration: none;
  color: black;
}

#menuWrap a.item:hover {
  text-decoration: underline;
}

#menuWrap a.item.active {
  color: green;
}
</style>