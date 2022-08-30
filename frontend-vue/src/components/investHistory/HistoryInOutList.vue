<template>
  <div class="w-full">
    <h4><i class="pi pi-sort-alt"></i>유입/유출</h4>

    <TabMenu
        :model="usableUnitList"
        :activeIndex="selectedTab.activeIndex"
    >
      <template #item="{item}">
        <a class="p-menuitem-link" role="presentation" @click="switchTab(item.unit)">{{item.unit}}</a>
      </template>
    </TabMenu>

    <DataTable :value="historyList" class="font-small bordered condensed" editMode="row" dataKey="history_idx" v-model:editingRows="editHistoryRow" @row-edit-save="editHistory" responsiveLayout="stack">
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

      <Column header="날짜" field="history_date" class="text-center">
        <template #editor="{data, field}">
          <Calendar
              v-model="data[field]"
              selectionMode="single"
              dateFormat="yy-mm-dd"
              modelValue="2022-05-01"
              :showIcon="false"
              inputClass="text-center"
          ></Calendar>
        </template>
      </Column>
      <Column header="기록타입" field="inout_type_text" class="text-center"></Column>
      <Column header="금액" field="val" class="text-right">
        <template #editor="{data, field}">
          <InputNumber
              v-model="data[field]"
              mode="decimal"
              :format="true"
              :suffix="` ${selectedTab.value != '' ? selectedTab.value : 'KRW'}`"
              :minFractionDigits="selectedTab.minPrecision"
              :maxFractionDigits="selectedTab.maxPrecision"
              inputClass="text-right"
          ></InputNumber>
        </template>
        <template #body="{data}">
          <span v-html="printVal(data)"></span>
        </template>
      </Column>
      <Column header="메모" field="memo">
        <template #editor="{data, field}">
          <Textarea
              v-model="data[field]"
              :autoResize="true"
              rows="3"
              cols="10"
          ></Textarea>
        </template>
      </Column>
      <Column header="수정" :rowEditor="true" class="text-center"></Column>
      <Column header="삭제" class="text-center">
        <template #body="{data}">
          <button type="button" class="p-row-editor-init p-link" @click="delHistory(data.history_idx)">
            <i class="pi pi-times"></i>
          </button>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script>
import {useStore} from "vuex";
import {computed, onBeforeMount, reactive, ref, watch} from "vue";

import dayjs from "dayjs";

import TabMenu from "primevue/tabmenu";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import ColumnGroup from "primevue/columngroup";
import Row from "primevue/row";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";
import Calendar from "primevue/calendar";

import {useInvestApi} from '@/apis/investHistory';
import {numberComma, numberUncomma} from "@/libs/helper";

export default {
  components: {
    TabMenu,
    DataTable,
    Column,
    ColumnGroup,
    Row,
    InputNumber,
    Textarea,
    Calendar,
  },
  props: [
      'thisMonth',
      'usableUnitList',
  ],
  setup(props) {
    //set vars: vuex
    const store = useStore();

    //set vars: api module
    const investApi = useInvestApi();

    //set vars: 필요 변수
    const itemIdx = computed(() => store.getters["investHistory/getCurrentItemIdx"]);
    const updateListFlag = computed(() => store.getters['investHistory/getUpdateInOutListFlag']);
    const selectedTab = reactive({
      value: 'KRW',
      activeIndex: 0,
      unit_type: '',
      minPrecision: computed(() => {
        return selectedTab.unit_type == 'float' ? 1 : 0;
      }),
      maxPrecision: computed(() => {
        return selectedTab.unit_type == 'float' ? 8 : 0;
      })
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
              selectedTab.unit_type = props.usableUnitList[arrKey].unit_type;
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
          historyList.value = await investApi.getHistoryList(
              itemIdx.value,
              'inout',
              selectedTab.value,
              props.thisMonth.value.format('YYYY-MM-DD')
            );
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
     * @param {Object} event
     * @returns {Promise<boolean>}
     */
    const editHistory = async(event) => {
      const {newData: history} = event;

      const date = dayjs(history.history_date);
      history.history_date = date.format('YYYY-MM-DD');

      try {
        const reqData = {
          history_date: history.history_date,
          val: history.val,
          memo: history.memo
        };

        await investApi.editHistory(history.history_idx, reqData);

        store.commit('investHistory/setUpdateSummaryFlag', true);
        store.commit('investHistory/setUpdateInOutListFlag', true);
      } catch (err) {
        alert(err);
        return false;
      }
    }

    /**
     * 히스토리 삭제
     * @param historyIdx
     * @returns {Promise<void>}
     */
    const delHistory = async (historyIdx) => {
      if (!confirm('이 기록을 삭제하시겠습니까?')) return;

      try {
        await investApi.delHistory(historyIdx);

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
          selectedTab.unit_type = props.usableUnitList[arrKey].unit_type;
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
      delHistory
    }
  }
}
</script>

<style scoped>
.p-datatable :deep(.p-inputtext) {
  font-size: 0.9rem;
}
.p-inputnumber :deep(input),
.p-inputtextarea {
  width: 100%;
}

@media screen and (max-width: 960px) {
  .p-datatable :deep(td .diff) {
    font-size: 0.8rem;
  }
  .p-inputtextarea {
    width: 18rem;
  }
}
</style>