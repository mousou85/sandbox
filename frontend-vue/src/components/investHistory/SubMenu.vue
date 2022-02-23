<template>
  <div id="subMenu">
    <router-link to="/invest-history" custom v-slot="{navigate, href, route}">
      <button type="button" @click="navigate">히스토리</button>
    </router-link>
    <router-link to="/invest-history/company" custom v-slot="{navigate, href, route}">
      <button type="button" @click="navigate">기업관리</button>
    </router-link>
    <router-link to="/invest-history/item" custom v-slot="{navigate, href, route}">
      <button type="button" @click="navigate">상품관리</button>
    </router-link>
    <router-link to="/invest-history/unit" custom v-slot="{navigate, href, route}">
      <button type="button" @click="navigate">단위관리</button>
    </router-link>
  </div>
</template>

<script setup>

</script>


<style>
#subMenu {
  display: block;
  padding-bottom: 10px;
  border-bottom: 1px solid;
}
#subMenu button {
  margin-right: 5px;
}
</style>