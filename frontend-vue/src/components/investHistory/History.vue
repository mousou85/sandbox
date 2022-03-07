<template>
  <div>
    <div>
      <label for="itemList">상품선택</label>
      <select id="itemList" @change="selectItem">
        <option value="">상품선택</option>
        <option v-for="item in itemList" :key="item.item_idx" :value="item.item_idx">
          {{item.company_name}} - {{item.item_name}}
        </option>
      </select>
    </div>
    <form id="addForm" @submit.prevent="addHistory">
      <input type="hidden" name="item_idx" v-model="formData.item_idx">

      <fieldset>
        <legend>기록 추가</legend>

        <div class="row">
          <label for="addFormUnitIdx">단위</label>
          <select id="addFormUnitIdx" name="unit_idx" ref="$addFormUnitIdx" v-model="formData.unit_idx" @change="setValUnit">
            <option value="">단위선택</option>
            <option v-for="unit in unitList" :key="unit.unit_idx" :value="unit.unit_idx">{{unit.unit}}</option>
          </select>
        </div>

        <div class="row">
          <label for="addFormHistoryDate">일자</label>
          <input type="date" id="addFormHistoryDate" name="history_date" v-model="formData.history_date">
        </div>

        <div class="row">
          <label>기록 타입</label>
          <label class="short"><input type="radio" name="history_type" value="in" v-model="formData.history_type">유입</label>
          <label class="short"><input type="radio" name="history_type" value="out" v-model="formData.history_type">유출</label>
          <label class="short"><input type="radio" name="history_type" value="revenue" v-model="formData.history_type">평가</label>
        </div>

        <div class="row">
          <label>유입/유출 타입</label>
          <label class="short"><input type="radio" name="inout_type" value="principal" v-model="formData.inout_type">원금</label>
          <label class="short"><input type="radio" name="inout_type" value="proceeds" v-model="formData.inout_type">수익금</label>
        </div>

        <div class="row">
          <label>평가 타입</label>
          <label class="short"><input type="radio" name="revenue_type" value="interest" v-model="formData.revenue_type">이자</label>
          <label class="short"><input type="radio" name="revenue_type" value="eval" v-model="formData.revenue_type">평가금액</label>
        </div>

        <div class="row">
          <label for="addFormVal">금액</label>
          <input type="number" id="addFormVal" name="val" class="val" v-model="formData.val"><span id="valUnit" ref="$valUnit"></span>
        </div>

        <div class="row">
          <label for="addFormMemo">메모</label>
          <textarea id="addFormMemo" name="memo" cols="50" rows="5" v-model="formData.memo"></textarea>
        </div>
      </fieldset>
      <button type="submit">추가</button>
    </form>

    <table id="list">
      <thead>
        <tr>
          <th>날짜</th>
          <th>기록타입</th>
          <th>금액</th>
          <th>메모</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="history in historyList" :key="history.history_idx">
          <td class="center">{{history.history_date}}</td>
          <td class="center">
            <span v-if="['in','out'].includes(history.history_type)">
              {{history.history_type_text}} - {{history.inout_type_text}}
            </span>
            <span v-else>
              {{history.history_type_text}} - {{history.revenue_type_text}}
            </span>
          </td>
          <td class="right">
            {{history.unit_type == 'int' ? parseInt(history.val) : history.val}} {{history.unit}}
          </td>
          <td>{{history.memo}}</td>
          <td class="center">
            <button type="button" @click="delHistory(history.history_idx)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import {onBeforeMount, reactive, ref, watch} from "vue";
import http from "../../libs/http";

const formData = reactive({
  item_idx: '',
  unit_idx: '',
  history_date: '',
  history_type: '',
  inout_type: '',
  revenue_type: '',
  val: '',
  memo: ''
});
const itemList = ref([]);
const unitList = ref([]);
const historyList = ref([]);

const $addFormUnitIdx = ref();
const $valUnit = ref();

onBeforeMount(async () => {
  try {
    let res;

    res = await getItemList();
    itemList.value = res;
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

const getUnitList = async (itemIdx) => {
  try {
    const res = await http.get(`http://localhost:5000/invest-history/unit-set/${itemIdx}`);
    if (!res.result) throw new Error(res.resultMessage);
    return res.data.list;
  } catch (err) {
    return [];
  }
}

const selectItem = async ($event) => {
  formData.item_idx = $event.target.value;
  try {
    unitList.value = await getUnitList(formData.item_idx);
    historyList.value = await getHistoryList(formData.item_idx);
  } catch (err) {
  }
}

const setValUnit = ($event) => {
  let unit = '';
  if ($event.target.selectedIndex > 0) {
    unit = unitList.value[$event.target.selectedIndex - 1].unit;
  }

  $valUnit.value.innerText = unit;
}

/**
 * 히스토리 리스트 반환
 * @param itemIdx
 * @return {Promise<*[]|*>}
 */
const getHistoryList = async (itemIdx) => {
  try {
    const res = await http.get(`http://localhost:5000/invest-history/history/${itemIdx}`);
    if (!res.result) throw new Error(res.resultMessage);
    return res.data.list;
  } catch (err) {
    return [];
  }
};

/**
 * 히스토리 추가
 * @param $event
 * @return {Promise<boolean>}
 */
const addHistory = async ($event) => {
  const $form = $event.target;

  if (!formData.item_idx) {
    alert('상품 선택');
    return false;
  }
  if (!formData.unit_idx) {
    alert('단위 선택');
    $form.elements.unit_idx.focus();
    return false;
  }
  if (!formData.history_date) {
    alert('날짜 선택');
    $form.elements.history_date.focus();
    return false;
  }
  if (!formData.history_type) {
    alert('기록 타입 선택');
    return false;
  }
  if (['in', 'out'].includes(formData.history_type)) {
    if (!formData.inout_type) {
      alert('유입/유출 타입 선택');
      return false;
    }
  } else {
    if (!formData.revenue_type) {
      alert('평가 타입 선택');
      return false;
    }
  }
  if (!formData.val) {
    alert('금액 입력');
    return false;
  }

  try {
    const res = await http.post(`http://localhost:5000/invest-history/history/${formData.item_idx}/`, formData);
    if (!res.result) throw new Error(res.resultMessage);

    alert('추가 완료');

    formData.unit_idx = '';
    formData.history_date = '';
    formData.history_type = '';
    formData.inout_type = '';
    formData.revenue_type = '';
    formData.val = '';
    formData.memo = '';

    document.getElementById('valUnit').innerText = '';

  } catch (err) {
    alert(err);
    return false;
  }
}

/**
 * 히스토리 삭제
 * @param historyIdx
 * @return {Promise<boolean>}
 */
const delHistory = async (historyIdx) => {
  try {
    const res = await http.delete(`http://localhost:5000/invest-history/history/${formData.item_idx}/${historyIdx}`);
    if (!res.result) throw new Error(res.resultMessage);

    historyList.value = await getHistoryList(formData.item_idx);
  } catch (err) {
    alert(err);
    return false;
  }
};

</script>

<style scoped>
#list {
  border: 1px solid;
  border-collapse: collapse;
  margin-top: 10px;
}
#list th, #list td {
  border: 1px solid;
  padding: 5px;
}
#list .center {
  text-align: center;
}
#list .right {
  text-align: right;
}

#addForm {
  width: fit-content;
}
#addForm fieldset {
  width: available;
  border: none;
  border-top: 1px solid;
  margin-top: 10px;

}
#addForm .row {
  padding: 5px 0;
}
#addForm label {
  display: inline-block;
  width: 150px;
  vertical-align: top;
}
#addForm label.short {
  width: 100px;
}
#addForm select {
  width: 200px;
}
#addForm input.val {
  text-align: right;
  width: 10em;
}
</style>