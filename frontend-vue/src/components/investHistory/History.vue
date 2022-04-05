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
          <label>단위</label>
          <label class="short" v-for="unit in unitList" :key="unit.unit_idx">
            <input type="radio" name="unit_idx" ref="$addFormUnitIdx" v-model="formData.unit_idx" :value="unit.unit_idx" @change="setValUnit">
            {{ unit.unit }}
          </label>
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

        <div class="row" v-if="['in', 'out'].includes(formData.history_type)">
          <label>유입/유출 타입</label>
          <label class="short"><input type="radio" name="inout_type" value="principal" v-model="formData.inout_type">원금</label>
          <label class="short"><input type="radio" name="inout_type" value="proceeds" v-model="formData.inout_type">수익금</label>
        </div>

        <div class="row" v-else-if="formData.history_type == 'revenue'">
          <label>평가 타입</label>
          <label class="short"><input type="radio" name="revenue_type" value="interest" v-model="formData.revenue_type">이자</label>
          <label class="short"><input type="radio" name="revenue_type" value="eval" v-model="formData.revenue_type">평가금액</label>
        </div>

        <div class="row">
          <label for="addFormVal">금액</label>
          <input type="text" id="addFormVal" name="val" class="val" v-model="formData.val"><span id="valUnit" ref="$valUnit"></span>
        </div>

        <div class="row">
          <label for="addFormMemo">메모</label>
          <textarea id="addFormMemo" name="memo" cols="50" rows="5" v-model="formData.memo"></textarea>
        </div>
      </fieldset>
      <button type="submit">추가</button>
    </form>

    <div style="overflow: hidden;">
      <table width="100%" class="summaryTable">
        <tr>
          <th colspan="6">잔고</th>
          <th colspan="3">현재평가</th>
          <th colspan="4">수익율</th>
        </tr>
        <tr>
          <th>잔고</th>
          <th>유입</th>
          <th>유출</th>
          <th>잔고(수익금제외)</th>
          <th>유입(수익금제외)</th>
          <th>유출(수익금제외)</th>
          <th>이자</th>
          <th>평가금액</th>
          <th>합계</th>
          <th>수익(수익금제외)</th>
          <th>수익율(수익금제외)</th>
          <th>수익</th>
          <th>수익율</th>
        </tr>
        <tr>
          <td class="right bold">{{ printVal(summaryData.deposit, summaryData.unit, summaryData.unitType) }}</td>
          <td class="right">{{ printVal(summaryData.in.total, summaryData.unit, summaryData.unitType) }}</td>
          <td class="right" v-html="printVal(summaryData.out.total * -1, summaryData.unit, summaryData.unitType)"></td>
          <td class="right bold">{{ printVal(summaryData.excludeProceedsDeposit, summaryData.unit, summaryData.unitType) }}</td>
          <td class="right">{{ printVal(summaryData.in.principal, summaryData.unit, summaryData.unitType) }}</td>
          <td class="right" v-html="printVal(summaryData.out.principal * -1, summaryData.unit, summaryData.unitType)"></td>
          <td class="right">{{ printVal(summaryData.revenue.interest, summaryData.unit, summaryData.unitType) }}</td>
          <td class="right" v-html="printVal(summaryData.revenue.eval, summaryData.unit, summaryData.unitType)"></td>
          <td class="right bold" v-html="printVal(summaryData.revenue.total, summaryData.unit, summaryData.unitType)"></td>
          <td class="right bold" v-html="printVal(summaryData.revenueRate.excludeProceedsDiff, summaryData.unit, summaryData.unitType)"></td>
          <td class="right">{{ summaryData.revenueRate.excludeProceedsRate }}%</td>
          <td class="right bold" v-html="printVal(summaryData.revenueRate.diff, summaryData.unit, summaryData.unitType)"></td>
          <td class="right">{{ summaryData.revenueRate.rate }}%</td>
        </tr>
      </table>

      <h4 style="text-align: center;">
        <button type="button" @click="changeHistoryListMonth('prev')">◀</button>&nbsp;&nbsp;
        <span>{{thisMonth.format('YYYY-MM')}}</span>
        &nbsp;&nbsp;<button type="button" @click="changeHistoryListMonth('next')">▶</button>
      </h4>
      <div style="float: left;width: 45%;">
        <h5>유입/유출</h5>
        <ul class="unitTab">
          <li v-for="unit in unitList" :key="unit.unit_idx" :class="unit.unit == selectedTab.inout ? 'on' : ''" @click="switchTab('inout', unit.unit)">
            {{unit.unit}}
          </li>
        </ul>
        <table id="inoutList" class="list" style="width:100%;">
          <colgroup>
            <col style="width: 90px;">
            <col style="width: 90px;">
            <col style="width: 130px;">
            <col>
            <col style="width: 80px;">
          </colgroup>
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
            <tr v-for="history in inoutList" :key="history.history_idx">
              <td class="center">{{history.history_date}}</td>
              <td class="center">
              <span v-if="['in','out'].includes(history.history_type)">
                {{history.history_type_text}} - {{history.inout_type_text}}
              </span>
                <span v-else>
                {{history.history_type_text}} - {{history.revenue_type_text}}
              </span>
              </td>
              <td class="right" v-html="printVal((history.history_type == 'out' ? (history.val * -1) : history.val), history.unit, history.unit_type)">
              </td>
              <td>{{history.memo}}</td>
              <td class="center">
                <button type="button" @click="delHistory(history.history_idx, history.history_type)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="float: left;width: 45%;margin-left: 20px;">
        <h5>평가</h5>
        <ul class="unitTab">
          <li v-for="unit in unitList" :key="unit.unit_idx" :class="unit.unit == selectedTab.revenue ? 'on' : ''" @click="switchTab('revenue', unit.unit)">
            {{unit.unit}}
          </li>
        </ul>
        <table id="revenueList" class="list" style="width: 100%;">
          <colgroup>
            <col style="width: 90px;">
            <col style="width: 90px;">
            <col style="width: 130px;">
            <col>
            <col style="width: 80px;">
          </colgroup>
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
            <tr v-for="history in revenueList" :key="history.history_idx">
              <td class="center">{{history.history_date}}</td>
              <td class="center">
              <span v-if="['in','out'].includes(history.history_type)">
                {{history.history_type_text}} - {{history.inout_type_text}}
              </span>
                <span v-else>
                {{history.history_type_text}} - {{history.revenue_type_text}}
              </span>
              </td>
              <td class="right" v-html="printVal(history.val, history.unit, history.unit_type)">
              </td>
              <td>{{history.memo}}</td>
              <td class="center">
                <button type="button" @click="delHistory(history.history_idx, history.history_type)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onBeforeMount, reactive, ref, watch} from "vue";
import dayjs from 'dayjs';
import http from "../../libs/http";
import {numberComma, numberUncomma} from "../../libs/helper";

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
const summaryData = reactive({
  unit: '',
  unitType: '',
  deposit: 0,
  excludeProceedsDeposit: 0,
  in: {
    total: 0,
    principal: 0,
    proceeds: 0,
  },
  out: {
    total: 0,
    principal: 0,
    proceeds: 0,
  },
  revenue: {
    total: 0,
    interest: 0,
    eval: 0,
  },
  revenueRate: {
    diff: 0,
    rate: 0,
    excludeProceedsDiff: 0,
    excludeProceedsRate: 0
  }
});
const itemList = ref([]);
const unitList = ref([]);
const inoutList = ref([]);
const revenueList = ref([]);
const selectedTab = reactive({
  'inout': '',
  'revenue': ''
});
const thisMonth = ref(dayjs());

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

watch(() => formData.val, (newVal) => {
  newVal = numberUncomma(newVal);
  formData.val = numberComma(newVal);
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

const getSummaryData = async (itemIdx) => {
  try {
    const res = await http.get(`http://localhost:5000/invest-history/summary/${itemIdx}`);
    if (!res.result) throw new Error(res.resultMessage);

    const data = res.data;

    for (const key1 of Object.keys(data)) {
      const val1 = data[key1];

      if (summaryData.hasOwnProperty(key1)) {
        if (typeof val1 == 'object') {
          for (const key2 of Object.keys(val1)) {
            const val2 = val1[key2];

            if (summaryData[key1].hasOwnProperty(key2)) {
              summaryData[key1][key2] = val2;
            }
          }
        } else {
          summaryData[key1] = val1;
        }
      }

    }
  } catch (err) {

  }
}

const selectItem = async ($event) => {
  formData.item_idx = $event.target.value;
  try {
    selectedTab.inout = 'KRW';
    selectedTab.revenue = 'KRW';
    unitList.value = await getUnitList(formData.item_idx);
    inoutList.value = await getHistoryList(formData.item_idx, 'inout', selectedTab.inout, thisMonth.value.format('YYYY-MM-DD'));
    revenueList.value = await getHistoryList(formData.item_idx, 'revenue', selectedTab.revenue, thisMonth.value.format('YYYY-MM-DD'));
    await getSummaryData(formData.item_idx);
  } catch (err) {
  }
}

const switchTab = async (historyType, unit) => {
  const itemIdx = formData.item_idx;
  if (historyType == 'inout') {
    selectedTab.inout = unit;
    inoutList.value = await getHistoryList(itemIdx, 'inout', unit, thisMonth.value.format('YYYY-MM-DD'));
  } else if (historyType == 'revenue') {
    selectedTab.revenue = unit;
    revenueList.value = await getHistoryList(itemIdx, 'revenue', unit, thisMonth.value.format('YYYY-MM-DD'));
  }
}

const changeHistoryListMonth = async (type) => {
  if (type == 'prev') {
    thisMonth.value = thisMonth.value.subtract(1, 'month');
  } else if (type == 'next') {
    thisMonth.value = thisMonth.value.add(1, 'month');
  }

  inoutList.value = await getHistoryList(formData.item_idx, 'inout', selectedTab.inout, thisMonth.value.format('YYYY-MM-DD'));
  revenueList.value = await getHistoryList(formData.item_idx, 'revenue', selectedTab.revenue, thisMonth.value.format('YYYY-MM-DD'));
}

const setValUnit = ($event) => {
  for (const unit of unitList.value) {
    if (unit.unit_idx == $event.target.value) {
      $valUnit.value.innerText = unit.unit;
      break;
    }
  }
}

const printVal = (val, unit, unitType) => {
  if (unitType == 'int') {
    val = parseInt(val);
  }
  return val < 0 ? `<span style="color: blue">${numberComma(val)} ${unit}</span>` : `${numberComma(val)} ${unit}`;
}

/**
 * 히스토리 리스트 반환
 * @param {number} itemIdx
 * @param {string} [historyType]
 * @param {string} [unit]
 * @param {string} [date]
 * @return {Promise<*[]|*>}
 */
const getHistoryList = async (itemIdx, historyType, unit, date) => {
  try {
    if (!itemIdx) throw Error("item_idx not set");

    let params = {};
    if (historyType) params['history_type'] = historyType;
    if (unit) params['unit'] = unit;
    if (date) params['date'] = date;

    const res = await http.get(`http://localhost:5000/invest-history/history/${itemIdx}`, params);
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
  formData.val = numberUncomma(formData.val);

  try {
    const res = await http.post(`http://localhost:5000/invest-history/history/${formData.item_idx}/`, formData);
    if (!res.result) throw new Error(res.resultMessage);

    if (['in', 'out'].includes(formData.history_type)) {
      for (const unit of unitList.value) {
        if (formData.unit_idx == unit.unit_idx) {
          selectedTab.inout = unit.unit;
        }
      }
      inoutList.value = await getHistoryList(formData.item_idx, 'inout', selectedTab.inout, thisMonth.value.format('YYYY-MM-DD'));
    } else if (formData.history_type == 'revenue') {
      for (const unit of unitList.value) {
        if (formData.unit_idx == unit.unit_idx) {
          selectedTab.revenue = unit.unit;
        }
      }
      revenueList.value = await getHistoryList(formData.item_idx, 'revenue', selectedTab.revenue, thisMonth.value.format('YYYY-MM-DD'));
    }

    // formData.unit_idx = '';
    // formData.history_date = '';
    // formData.history_type = '';
    // formData.inout_type = '';
    // formData.revenue_type = '';
    formData.val = '';
    formData.memo = '';

    document.getElementById('valUnit').innerText = '';

    await getSummaryData(formData.item_idx);
  } catch (err) {
    alert(err);
    return false;
  }
}

/**
 * 히스토리 삭제
 * @param historyIdx
 * @param historyType
 * @return {Promise<boolean>}
 */
const delHistory = async (historyIdx, historyType) => {
  try {
    const res = await http.delete(`http://localhost:5000/invest-history/history/${formData.item_idx}/${historyIdx}`);
    if (!res.result) throw new Error(res.resultMessage);

    if (['in', 'out'].includes(historyType)) {
      inoutList.value = await getHistoryList(formData.item_idx, 'inout', formData.unit_idx, thisMonth.value.format('YYYY-MM-DD'));
    } else if (historyType == 'revenue') {
      revenueList.value = await getHistoryList(formData.item_idx, 'revenue', formData.unit_idx, thisMonth.value.format('YYYY-MM-DD'));
    }

    await getSummaryData(formData.item_idx);
  } catch (err) {
    alert(err);
    return false;
  }
};

</script>

<style scoped>
.list {
  border: 1px solid;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 0.8em;
}
.list th, .list td {
  border: 1px solid;
  padding: 5px;
}
.list .center {
  text-align: center;
}
.list .right {
  text-align: right;
}

.summaryTable {
  border: 1px solid;
  border-collapse: collapse;
  margin-top: 10px;
  overflow: hidden;
  font-size: 0.8em;
}
.summaryTable th, .summaryTable td {
  border: 1px solid;
  padding: 5px;
}
.summaryTable .bold {
  font-weight: bold;
}
.summaryTable .center {
  text-align: center;
}
.summaryTable .right {
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

.unitTab {
  list-style: none;
  padding: 0;
  overflow: hidden;
  margin: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  border-collapse: collapse;
  border-bottom: 1px solid;
  font-size: 0.8em;
}
.unitTab li {
  flex-basis: 20%;
  padding: 0.2em 0.5em;
  text-align: center;
  border-top: 1px solid;
  border-left: 1px solid;
  border-right: 1px solid;
  cursor: pointer;
}
.unitTab li.on {
  background: lightyellow;
  font-weight: bold;
}
</style>