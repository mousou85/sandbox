<template>
  <div>
    <form id="itemAddForm" @submit.prevent="formSubmit">
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
      <button ref="htmlBtnFormSubmit">등록</button>
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
            <button type="button" @click="setEditForm(item)">수정</button>
            <button type="button" @click="delItem(item.item_idx)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

import {onBeforeMount, reactive, ref} from "vue";

import {
  getItemList as requestItemList,
  getCompanyList as requestCompanyList,
  getUnitList as requestUnitList,
  getItemTypeList as requestItemTypeList,
  addItem as requestAddItem,
  editItem as requestEditItem,
  delItem as requestDelItem,
} from '@/modules/investHistory';

export default {
  setup() {
    //set vars: 필요 변수
    const companyList = ref([]);
    const itemTypeList = ref([]);
    const unitList = ref([]);
    const itemList = ref([]);
    const itemFormData = reactive({
      item_idx: '',
      company_idx: '',
      item_type: '',
      item_name: '',
      units: [],
    });
    const htmlBtnFormSubmit = ref();

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      try {
        companyList.value = await requestCompanyList();

        itemTypeList.value = await requestItemTypeList();

        unitList.value = await requestUnitList();

        await getItemList();
      } catch (err) {
      }
    });

    /**
     * print unit set list
     * @param {Object[]} unitSet
     * @returns {string}
     */
    const printUnitText = (unitSet) => {
      let list = [];
      for (const unit of unitSet) {
        list.push(unit.unit);
      }

      return list.join(',');
    }

    /**
     * reset form
     */
    const resetForm = () => {
      for (let key of Object.keys(itemFormData)) {
        if (key == 'units') {
          itemFormData[key] = [];
        } else {
          itemFormData[key] = '';
        }
      }

      htmlBtnFormSubmit.value.innerText = '등록';
    }

    /**
     * get item list
     * @return {Promise<void>}
     */
    const getItemList = async () => {
      try {
        itemList.value = await requestItemList();
      } catch (err) {
        itemList.value = [];
      }
    };

    /**
     * add item
     * @param $event
     * @returns {Promise<boolean>}
     */
    const formSubmit = async ($event) => {
      const $form = $event.target;
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
        if (itemFormData.item_idx > 0) {
          await requestEditItem({
              item_idx: itemFormData.item_idx,
              company_idx: itemFormData.company_idx,
              item_type: itemFormData.item_type,
              item_name: itemFormData.item_name,
              units: itemFormData.units
            });

          alert('수정 완료');
        } else {
          await requestAddItem({
              company_idx: itemFormData.company_idx,
              item_name: itemFormData.item_name,
              item_type: itemFormData.item_type,
              units: itemFormData.units
            });

          alert('등록 완료');
        }

        await getItemList();

        resetForm();
      } catch (err) {
        alert(err);
        return false;
      }
    }

    const setEditForm = async (item) => {
      itemFormData.item_idx = item.item_idx;
      itemFormData.company_idx = item.company_idx;
      itemFormData.item_type = item.item_type;
      itemFormData.item_name = item.item_name;
      itemFormData.units = [];
      for (const unit of item.unit_set) {
        itemFormData.units.push(unit.unit_idx);
      }

      htmlBtnFormSubmit.value.innerText = '수정';
    }

    const delItem = async (itemIdx) => {
      try {
        await requestDelItem(itemIdx);

        await getItemList();
      } catch (err) {
        alert(err);
      }
    }

    return {
      companyList,
      itemTypeList,
      unitList,
      itemList,
      htmlBtnFormSubmit,
      itemFormData,
      formSubmit,
      setEditForm,
      delItem,
      printUnitText,
    }
  }
}
</script>

<style scoped>
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