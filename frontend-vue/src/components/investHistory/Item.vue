<template>
  <SubMenu></SubMenu>
  <div>
    <form id="itemAddForm">
      <div class="row">
        <label for="company_idx">기업</label>
        <select id="company_idx" name="company_idx">
          <option>기업선택</option>
          <option v-for="company in companyList" :key="company.company_idx" :value="company.company_idx">
            {{company.company_name}}
          </option>
        </select>
      </div>
      <div class="row">
        <label for="item_type">상품타입</label>
        <select id="item_type" name="item_type">
          <option>상품타입선택</option>
          <option v-for="itemType in itemTypeList" :key="itemType.type" :value="itemType.type">
            {{itemType.text}}
          </option>
        </select>
      </div>
      <div class="row">
        <label for="item_name">상품명</label>
        <input type="text" id="item_name" name="item_name" maxlength="50" size="50" placeholder="상품명">
      </div>
      <div class="row">
        <label for="unit">단위</label>
        <select id="unit" name="unit" multiple>
          <option v-for="unit in unitList" :key="unit.unit_idx" :value="unit.unit_idx">
            {{unit.unit}}
          </option>
        </select>
      </div>
    </form>
  </div>
</template>

<script setup>
import SubMenu from './SubMenu.vue';
import {onBeforeMount, ref} from "vue";
import http from '../../libs/http';

const companyList = ref([]);
const itemTypeList = ref([]);
const unitList = ref([]);

onBeforeMount(async () => {
  try {
    let res = null;

    res = await http.get('http://localhost:5000/invest-history/company');
    if (!res.result) throw new Error(res.resultMessage);
    companyList.value = res.data.list;

    res = await http.get('http://localhost:5000/invest-history/unit');
    if (!res.result) throw new Error(res.resultMessage);
    unitList.value = res.data.list;

    res = await http.get('http://localhost:5000/invest-history/item/item-type');
    if (!res.result) throw new Error(res.resultMessage);
    itemTypeList.value = res.data.list;
  } catch (err) {

  }
});


</script>

<style>
#itemAddForm .row {
  padding: 5px 0;
}
#itemAddForm label {
  display: inline-block;
  width: 100px;
  vertical-align: top;
}
#itemAddForm select {
  width: 200px;
}
#itemAddForm select[multiple] option {
  padding: 3px;
}
</style>