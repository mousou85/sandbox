<template>
  <div>
    <form id="unitForm" @submit.prevent="addUnit">
      <div class="row">
        <label for="unit">단위</label>
        <input type="text" id="unit" maxlength="10" v-model="addForm.unit">
      </div>
      <div class="row">
        <label>타입</label>
        <label><input type="radio" name="unit_type" value="int" v-model="addForm.unit_type">INT</label>
        <label><input type="radio" name="unit_type" value="float" v-model="addForm.unit_type">FLOAT</label>
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

<script>
import {onBeforeMount, reactive, ref} from "vue";

import {
  getUnitList as requestUnitList,
  addUnit as requestAddUnit,
  editUnit as requestEditUnit,
  delUnit as requestDelUnit
} from '@/modules/investHistory';

export default {
  setup() {
    //set vars: 필요 변수
    const unitList = ref([]);
    const addForm = reactive({unit: '', unit_type: ''});

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      await getUnitList();
    });

    /**
     * get all unit list
     * @returns {Promise<void>}
     */
    const getUnitList = async () => {
      try {
        unitList.value = await requestUnitList();
      } catch (err) {
        unitList.value = [];
      }
    }

    /**
     * add unit
     * @param e
     * @return {Promise<boolean>}
     */
    const addUnit = async (e) => {
      const $form = e.target;

      if (!addForm.unit) {
        alert('단위 입력');
        $form.elements.unit.focus();
        return false;
      }
      if (!addForm.unit_type) {
        alert('타입 선택');
        return false;
      }

      try {
        await requestAddUnit(addForm.unit, addForm.unit_type);

        addForm.unit = '';
        addForm.unit_type = '';

        await getUnitList();
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
        await requestEditUnit(unit.unit_idx, unit.unit, unit.unit_type);
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
        await requestDelUnit(unitIdx);

        await getUnitList();
      } catch (err) {
        alert(err);
      }
    }

    return {
      unitList,
      addForm,
      addUnit,
      editUnit,
      delUnit,
    }
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