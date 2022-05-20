<template>
  <div>
    <h4><i class="pi pi-sort-alt"></i>유입/유출</h4>

    <TabMenu
        :model="usableUnitList"
        :activeIndex="selectedTab.activeIndex"
    >
      <template #item="{item}">
        <a class="p-menuitem-link" role="presentation" @click="switchTab(item.unit)">{{item.unit}}</a>
      </template>
    </TabMenu>

    <DataTable :value="historyList" editMode="row" dataKey="history_idx" v-model:editingRows="editHistoryRow" @row-edit-save="editHistory2">
      <ColumnGroup type="header">
        <Row>
          <Column header="날짜" class="text-center"></Column>
          <Column header="기록타입" class="text-center"></Column>
          <Column header="금액" class="text-center"></Column>
          <Column header="메모" class="text-center"></Column>
          <Column header="수정" class="text-center"></Column>
          <Column header="삭제" class="text-center"></Column>
        </Row>
      </ColumnGroup>

      <Column field="history_date" class="text-center"></Column>
      <Column field="inout_type_text" class="text-center"></Column>
      <Column field="val" class="text-right">
        <template #editor="{data, field}">
          <InputNumber v-model="data[field]"></InputNumber>
        </template>
        <template #body="{data}">
          <span v-html="printVal(data)"></span>
        </template>
      </Column>
      <Column field="memo"></Column>
      <Column :rowEditor="true" class="text-center"></Column>
      <Column class="text-center">
        <template #body="{data}">
          <button type="button" class="p-row-editor-init p-link" @click="delHistory(data.history_idx)">
            <i class="pi pi-times"></i>
          </button>
        </template>
      </Column>
    </DataTable>

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
      <tr v-for="history in historyList" :key="history.history_idx">
        <template v-if="!history.edit_flag">
          <td class="center">{{history.history_date}}</td>
          <td class="center">
            {{history.inout_type_text}}
          </td>
          <td class="right" v-html="printVal(history)">
          </td>
          <td>{{history.memo}}</td>
          <td class="center">
            <button type="button" @click="history.edit_flag = true">수정</button>
            <button type="button" @click="delHistory(history.history_idx)">삭제</button>
          </td>
        </template>
        <template v-else>
          <td class="center"><input type="date" name="history_date" v-model="history.history_date"></td>
          <td class="center">
            {{history.inout_type_text}}
          </td>
          <td>
            <input type="text" name="val" style="text-align: right;width: 80px;" v-model="history.valText">{{history.unit}}
          </td>
          <td><textarea name="memo" v-model="history.memo"></textarea></td>
          <td class="center">
            <button type="button" @click="editHistory(history)">수정</button>
            <button type="button" @click="cancelEditHistory(history)">취소</button>
          </td>
        </template>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import {useStore} from "vuex";
import {computed, onBeforeMount, reactive, ref, watch} from "vue";

import TabMenu from "primevue/tabmenu";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import ColumnGroup from "primevue/columngroup";
import Row from "primevue/row";
import InputNumber from "primevue/inputnumber";

import {
  getHistoryList as requestHistoryList,
  editHistory as requestEditHistory,
  delHistory as requestDelHistory
} from "@/modules/investHistory";
import {numberComma, numberUncomma} from "@/libs/helper";

export default {
  components: {
    TabMenu,
    DataTable,
    Column,
    ColumnGroup,
    Row,
    InputNumber,
  },
  props: [
      'thisMonth',
      'usableUnitList',
  ],
  setup(props) {
    //set vars: vuex
    const store = useStore();

    //set vars: 필요 변수
    const itemIdx = computed(() => store.getters["investHistory/getCurrentItemIdx"]);
    const updateListFlag = computed(() => store.getters['investHistory/getUpdateInOutListFlag']);
    const selectedTab = reactive({
      value: 'KRW',
      activeIndex: 0,
    });
    const editHistoryRow = ref([]);
    const historyList = ref([]);

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      await getHistoryList();
    });

    /*
    watch variables
     */
    watch(
      [updateListFlag, itemIdx],
      async ([newUpdateListFlag, newItemIdx], [oldUpdateListFlag, oldItemIdx]) => {
        //히스토리 리스트 업데이트
        if (newUpdateListFlag) {
          await getHistoryList();
        }

        //unit 탭 설정
        if (newItemIdx != oldItemIdx && props.usableUnitList.length > 0) {
          for (const arrKey in props.usableUnitList) {
            if (selectedTab.value == props.usableUnitList[arrKey].unit) {
              selectedTab.activeIndex = parseInt(arrKey);
              break;
            }
          }
        }
      }
    );

    /**
     * 히스토리 목록 반환
     * @returns {Promise<void>}
     */
    const getHistoryList = async() => {
      try {
        if (itemIdx.value > 0) {
          historyList.value = await requestHistoryList(
              itemIdx.value,
              'inout',
              selectedTab.value,
              props.thisMonth.value.format('YYYY-MM-DD')
            );

          for (const history of historyList.value) {
            history.edit_flag = false;
            history.original_history_date = history.history_date;
            history.original_memo = history.memo;
            history.original_val = history.val;
          }
        } else {
          historyList.value = [];
        }
      } catch (err) {
        alert(err);
        historyList.value = [];
      } finally {
        store.commit('investHistory/setUpdateInOutListFlag', false);
      }
    }

    /**
     * 히스토리 수정
     * @param history
     * @returns {Promise<boolean>}
     */
    const editHistory = async(history) => {
      try {
        const reqData = {
          history_idx: history.history_idx,
          history_date: history.history_date,
          val: history.val,
          memo: history.memo
        };

        await requestEditHistory(reqData);

        store.commit('investHistory/setUpdateSummaryFlag', true);
        store.commit('investHistory/setUpdateInOutListFlag', true);
      } catch (err) {
        alert(err);
        return false;
      }
    }

    /**
     * 히스토리 수정
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    const editHistory2 = async(event) => {
      const {newData: history} = event;

      try {
        const reqData = {
          history_idx: history.history_idx,
          history_date: history.history_date,
          val: history.val,
          memo: history.memo
        };

        await requestEditHistory(reqData);

        store.commit('investHistory/setUpdateSummaryFlag', true);
        store.commit('investHistory/setUpdateInOutListFlag', true);
      } catch (err) {
        alert(err);
        return false;
      }
    }

    /**
     * 히스토리 수정 취소
     * @param history
     */
    const cancelEditHistory = (history) => {
      history.val = history.original_val;
      history.history_date = history.original_history_date;
      history.memo = history.original_memo;
      history.edit_flag = false;
    }

    /**
     * 히스토리 삭제
     * @param historyIdx
     * @returns {Promise<void>}
     */
    const delHistory = async (historyIdx) => {
      if (!confirm('이 기록을 삭제하시겠습니까?')) return;

      try {
        await requestDelHistory(historyIdx);

        store.commit('investHistory/setUpdateSummaryFlag', true);
        store.commit('investHistory/setUpdateInOutListFlag', true);
      } catch (err) {
        alert(err);
      }
    }

    /**
     * 탭 전환
     * @param {string} unit
     * @return {Promise<void>}
     */
    const switchTab =  (unit) => {
      selectedTab.value = unit;
      for (const arrKey in props.usableUnitList) {
        const _unit = props.usableUnitList[arrKey];
        if (_unit.unit == unit) {
          selectedTab.activeIndex = parseInt(arrKey);
          break;
        }
      }

      store.commit('investHistory/setUpdateInOutListFlag', true);
    }

    /**
     * 값 출력
     * @param {Object} history
     * @return {string}
     */
    const printVal = (history) => {
      let val = history.val;
      if (history.unitType == 'int') {
        val = parseInt(val);
      }

      let retStr;
      if (val < 0) retStr = `<span style="color: blue">${numberComma(val)}</span> ${history.unit}`;
      else if (val > 0) retStr = `<span style="color: red;">${numberComma(val)}</span> ${history.unit}`;
      else retStr = `${numberComma(val)} ${history.unit}`;

      return retStr;
    }

    return {
      selectedTab,
      editHistoryRow,
      historyList,
      switchTab,
      printVal,
      editHistory,
      editHistory2,
      cancelEditHistory,
      delHistory
    }
  }
}
</script>

<style scoped>
.p-datatable :deep(th[role="cell"]),
.p-datatable :deep(td[role="cell"]) {
  border-width: 1px;
  padding: 0.75rem;
}
.p-datatable :deep(th .p-column-title) {
  display: block;
  width: 100%;
  text-align: center;
}

.list {
  border: 1px solid;
  border-collapse: collapse;
  margin-top: 0;
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
</style>