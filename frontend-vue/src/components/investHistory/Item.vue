<template>
  <div>
    <form id="itemAddForm" @submit.prevent="itemFormSubmit">
      <input type="hidden" id="item_idx" name="item_idx" v-model="itemFormData.item_idx">

      <div class="row">
        <label for="company_idx">기업</label>
        <select id="company_idx" name="company_idx" v-model="itemFormData.company_idx">
          <option value="">기업선택</option>
          <option v-for="company in companyList" :key="company.company_idx" :value="company.company_idx">
            {{company.company_name}}
          </option>
        </select>
      </div>
      <div class="row">
        <label for="item_type">상품타입</label>
        <select id="item_type" name="item_type" v-model="itemFormData.item_type">
          <option value="">상품타입선택</option>
          <option v-for="itemType in itemTypeList" :key="itemType.type" :value="itemType.type">
            {{itemType.text}}
          </option>
        </select>
      </div>
      <div class="row">
        <label for="item_name">상품명</label>
        <input type="text" id="item_name" name="item_name" maxlength="50" size="50" placeholder="상품명" v-model="itemFormData.item_name">
      </div>
      <div class="row">
        <label for="unit">단위</label>
        <select id="unit" name="unit" multiple v-model="itemFormData.units">
          <option v-for="unit in unitList" :key="unit.unit_idx" :value="unit.unit_idx">
            {{unit.unit}}
          </option>
        </select>
      </div>
      <button ref="btnFormSubmit">등록</button>
    </form>

    <table id="list">
      <thead>
        <tr>
          <th>IDX</th>
          <th>기업명</th>
          <th>상품명</th>
          <th>상품타입</th>
          <th>단위</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in itemList" :key="item.item_idx">
          <td class="center">{{item.item_idx}}</td>
          <td class="center">{{item.company_name}}</td>
          <td>{{item.item_name}}</td>
          <td>{{item.item_type_text}}</td>
          <td>{{printUnitText(item.unit_set)}}</td>
          <td>
            <button type="button" @click="itemEdit(item.item_idx)">수정</button>
            <button type="button" @click="itemDel(item.item_idx)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import {onBeforeMount, reactive, ref} from "vue";
import http from '../../libs/http';

const companyList = ref([]);
const itemTypeList = ref([]);
const unitList = ref([]);
const itemFormData = reactive({
  item_idx: '',
  company_idx: '',
  item_type: '',
  item_name: '',
  units: [],
});
const itemList = ref([]);
const btnFormSubmit = ref();

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

    itemList.value = await getItemList();
  } catch (err) {

  }
});

/**
 * get item list
 * @return {Promise<[]>}
 */
const getItemList = async () => {
  try {
    const res = await http.get('http://localhost:5000/invest-history/item/');
    if (!res.result) throw new Error(res.resultMessage);
    return res.data.list;
  } catch (err) {
    return [];
  }
};

/**
 * print list unit
 * @param {Array<Object>} unitSet
 * @return {string}
 */
const printUnitText = (unitSet) => {
  let list = [];
  for (let unit of unitSet) {
    list.push(unit.unit);
  }
  return list.join(',');
}

/**
 * add/edit item form submit
 * @param e
 * @return {Promise<boolean>}
 */
const itemFormSubmit = async (e) => {
  const $form = e.target;
  const $companyIdx = $form.elements.company_idx;
  const $itemType = $form.elements.item_type;
  const $itemName = $form.elements.item_name;

  if (!itemFormData.company_idx) {
    alert('기업선택');
    $companyIdx.focus();
    return false;
  }
  if (!itemFormData.item_type) {
    alert('상품타입선택');
    $itemType.focus();
    return false;
  }
  if (!itemFormData.item_name) {
    alert('상품명 입력');
    $itemName.focus();
    return false;
  }

  try {
    if (itemFormData.item_idx) {
      const res = await http.put(`http://localhost:5000/invest-history/item/${itemFormData.item_idx}`, itemFormData);
      if (!res.result) throw new Error(res.resultMessage);
      alert('수정완료');
    } else {
      const res = await http.post('http://localhost:5000/invest-history/item/', itemFormData);
      if (!res.result) throw new Error(res.resultMessage);
      alert('등록완료');
    }

    itemList.value = await getItemList();
  } catch (err) {
    alert(err);
    return false;
  }

  resetForm();
};

/**
 * edit item form setting
 * @param {number} itemIdx
 * @return {Promise<boolean>}
 */
const itemEdit = async (itemIdx) => {
  try {
    const res = await http.get(`http://localhost:5000/invest-history/item/${itemIdx}`);
    if (!res.result) throw new Error(res.resultMessage);

    const data = res.data;
    itemFormData.item_idx = data.item_idx;
    itemFormData.item_name = data.item_name;
    itemFormData.company_idx = data.company_idx;
    itemFormData.item_type = data.item_type;
    itemFormData.units = [];
    for (let unit of data.unit_set) {
      itemFormData.units.push(unit.unit_idx);
    }

    btnFormSubmit.value.innerText = '수정';
  } catch (err) {
    alert(err);
    return false;
  }
}

const itemDel = async (itemIdx) => {
  try {
    const res = await http.delete(`http://localhost:5000/invest-history/item/${itemIdx}`);
    if (!res.result) throw new Error(res.resultMessage);

    itemList.value = await getItemList();
  } catch (err) {
    alert(err);
    return false;
  }
}

/**
 * form reset
 */
const resetForm = () => {
  for (let key of Object.keys(itemFormData)) {
    if (key == 'units') {
      itemFormData[key] = [];
    } else {
      itemFormData[key] = '';
    }
  }

  btnFormSubmit.value.innerText = '등록';
}

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

#list {
  border: 1px solid;
  border-collapse: collapse;
}
#list th, #list td {
  border: 1px solid;
  padding: 5px;
}
#list .center {
  text-align: center;
}
</style>