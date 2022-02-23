<template>
  <div>
    <form id="unitForm" @submit.prevent="addUnit">
      <div class="row">
        <label for="unit">단위</label>
        <input type="text" id="unit" maxlength="10" v-model="unitForm.unit">
      </div>
      <div class="row">
        <label>타입</label>
        <label><input type="radio" name="unit_type" value="int" v-model="unitForm.unit_type">INT</label>
        <label><input type="radio" name="unit_type" value="float" v-model="unitForm.unit_type">FLOAT</label>
      </div>
      <button type="submit">등록</button>
    </form>

    <table id="list">
      <thead>
        <tr>
          <th>IDX</th>
          <th>단위</th>
          <th>타입</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="unit in unitList" :key="unit.unit_idx">
          <td class="center">{{unit.unit_idx}}</td>
          <td><input type="text" maxlength="10" size="10" v-model="unit.unit"></td>
          <td>
            <select v-model="unit.unit_type">
              <option value="int">INT</option>
              <option value="float">FLOAT</option>
            </select>
          </td>
          <td class="center">
            <button type="button" @click="editUnit(unit)">수정</button>
            <button type="button" @click="delUnit(unit.unit_idx)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import {onBeforeMount, reactive, ref} from "vue";
import http from '../../libs/http';

const unitList = ref([]);
const unitForm = reactive({unit: '', unit_type: ''});

onBeforeMount(async () => {
  unitList.value = await getUnitList();
});

/**
 * get unit list
 * @return {Promise<[]>}
 */
const getUnitList = async () => {
  try {
    const res = await http.get('http://localhost:5000/invest-history/unit');
    if (!res.result) throw new Error(res.resultMessage);
    return res.data.list;
  } catch (err) {
    return [];
  }
}

/**
 * add unit
 * @param e
 * @return {Promise<boolean>}
 */
const addUnit = async (e) => {
  const $form = e.target;

  if (!unitForm.unit) {
    alert('단위 입력');
    $form.elements.unit.focus();
    return false;
  }
  if (!unitForm.unit_type) {
    alert('타입 선택');
    return false;
  }

  try {
    const res = await http.post('http://localhost:5000/invest-history/unit', unitForm);
    if (!res.result) throw new Error(res.resultMessage);

    unitForm.unit = '';
    unitForm.unit_type = '';

    unitList.value = await getUnitList();
  } catch (err) {
    alert(err);
    return false;
  }
}

/**
 * edit unit
 * @param {Object} unit
 * @return {Promise<boolean>}
 */
const editUnit = async (unit) => {
  try {
    const res = await http.put(`http://localhost:5000/invest-history/unit/${unit.unit_idx}`, {
      unit: unit.unit,
      unit_type: unit.unit_type
    });
    if (!res.result) throw new Error(res.resultMessage);
  } catch (err) {
    alert(err);
    return false;
  }
}

/**
 * delete unit
 * @param {number} unitIdx
 * @return {Promise<void>}
 */
const delUnit = async (unitIdx) => {
  try {
    const res = await http.delete(`http://localhost:5000/invest-history/unit/${unitIdx}`);
    if (!res.result) throw new Error(res.resultMessage);

    unitList.value = await getUnitList();
  } catch (err) {
    alert(err);
  }
}

</script>

<style scoped>
#unitForm .row {
  padding: 5px 0;
}
#unitForm label {
  display: inline-block;
  width: 100px;
  vertical-align: top;
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