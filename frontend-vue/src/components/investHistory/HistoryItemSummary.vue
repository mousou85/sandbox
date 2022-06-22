<template>
  <TabMenu
      :model="tabMenus"
      :activeIndex="selectedTab.index"
      v-if="currentItemIdx > 0"
  >
    <template #item="{item}">
      <a class="p-menuitem-link" role="presentation" @click="switchTab(item.value)">{{item.label}}</a>
    </template>
  </TabMenu>

  <DataTable :value="summaryData.data" v-if="currentItemIdx > 0" class="bordered condensed font-small" responsiveLayout="stack">
    <ColumnGroup type="header">
      <Row>
        <Column header="투자금" :colspan="3" class="text-center"></Column>
        <Column header="현재평가" :colspan="3" class="text-center"></Column>
        <Column header="수익율" :colspan="4" class="text-center"></Column>
      </Row>
      <Row>
        <Column header="원금" class="text-center"></Column>
        <Column header="재투자금" class="text-center"></Column>
        <Column header="합계" class="text-center"></Column>

        <Column header="누적이자" class="text-center"></Column>
        <Column header="평가금액" class="text-center"></Column>
        <Column header="합계" class="text-center"></Column>

        <Column header="수익" class="text-center"></Column>
        <Column header="수익율" class="text-center"></Column>
        <Column header="수익(재투자금 포함)" class="text-center"></Column>
        <Column header="수익율(재투자금 포함)" class="text-center"></Column>
      </Row>
    </ColumnGroup>

    <template v-if="selectedTab.value == 'total'">
      <Column field="inout.principalTotal" header="투자금-원금" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'inout.principalTotal', 'plain')"></span>
        </template>
      </Column>
      <Column field="inout.proceedsTotal" header="투자금-재투자금" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'inout.proceedsTotal', 'plain')"></span>
        </template>
      </Column>
      <Column field="inout.total" header="투자금-합계" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'inout.total', 'plain')"></span>
        </template>
      </Column>

      <Column field="revenue.interestTotal" header="현재평가-누적이자" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'revenue.interestTotal')"></span>
        </template>
      </Column>
      <Column field="revenue.eval" header="현재평가-평가금액" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'revenue.eval')"></span>
        </template>
      </Column>
      <Column field="revenue.total" header="현재평가-합계" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'revenue.total')"></span>
        </template>
      </Column>

      <Column field="earn.earn" header="수익율-수익" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'earn.earn')"></span>
        </template>
      </Column>
      <Column field="earn.ratePercent" header="수익율-수익율" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'earn.ratePercent', 'percent')"></span>
        </template>
      </Column>
      <Column field="earn.earnIncProceeds" header="수익율-수익(재투자금 포함)" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'earn.earnIncProceeds')"></span>
        </template>
      </Column>
      <Column field="earn.rateIncProceedsPercent" header="수익율-수익율(재투자금 포함)" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'earn.rateIncProceedsPercent', 'percent')"></span>
        </template>
      </Column>
    </template>

    <template v-else>
      <Column field="inout.principalTotal" header="투자금-원금" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'inout.principalTotal', 'plain+diff')"></span>
        </template>
      </Column>
      <Column field="inout.proceedsTotal" header="투자금-재투자금" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'inout.proceedsTotal', 'plain+diff')"></span>
        </template>
      </Column>
      <Column field="inout.total" header="투자금-합계" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'inout.total', 'plain')"></span>
        </template>
      </Column>

      <Column field="revenue.interestTotal" header="현재평가-누적이자" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'revenue.interestTotal', 'diff')"></span>
        </template>
      </Column>
      <Column field="revenue.eval" header="현재평가-평가금액" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'revenue.eval', 'diff')"></span>
        </template>
      </Column>
      <Column field="revenue.total" header="현재평가-합계" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'revenue.total', 'diff')"></span>
        </template>
      </Column>

      <Column field="earn.earn" header="수익율-수익" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'earn.earn', 'diff')"></span>
        </template>
      </Column>
      <Column field="earn.ratePercent" header="수익율-수익율" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'earn.ratePercent', 'percent+diff')"></span>
        </template>
      </Column>
      <Column field="earn.earnIncProceeds" header="수익율-수익(재투자금 포함)" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'earn.earnIncProceeds', 'diff')"></span>
        </template>
      </Column>
      <Column field="earn.rateIncProceedsPercent" header="수익율-수익율(재투자금 포함)" class="text-right">
        <template #body="{data}">
          <span v-html="printVal(data, 'earn.rateIncProceedsPercent', 'percent+diff')"></span>
        </template>
      </Column>
    </template>
  </DataTable>
</template>

<script>
import {computed, onBeforeMount, reactive, ref, watch} from "vue";
import {useStore} from 'vuex';

import TabMenu from "primevue/tabmenu";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';

import {useInvestApi} from '@/apis/investHistory';
import {numberComma} from "@/libs/helper";

export default {
  components: {
    TabMenu,
    DataTable,
    Column,
    ColumnGroup,
    Row,
  },
  props: [
    'thisMonth'
  ],
  setup(props) {
    //set vars: vuex
    const store = useStore();

    //set vars: api module
    const investApi = useInvestApi();

    //set vars: 필요 변수
    const currentItemIdx = computed(() => store.getters["investHistory/getCurrentItemIdx"]);
    const updateSummaryFlag = computed(() => store.getters['investHistory/getUpdateSummaryFlag']);
    const tabMenus = ref([
      {label: '종합', value: 'total'},
      {label: '월간', value: 'month'},
      {label: '년간', value: 'year'},
    ]);
    const selectedTab = reactive({
      value: 'total',
      index: 0,
    })
    const summaryData = reactive({
      year: '',
      month: '',
      unit: '',
      unitType: '',
      data: [
        {
          inout: {
            total: 0,
            principalTotal: 0,
            principalPrev: 0,
            principalCurrent: 0,
            proceedsTotal: 0,
            proceedsPrev: 0,
            proceedsCurrent: 0,
          },
          revenue: {
            total: computed(() => {
              const data = summaryData.data[0];
              if (data.revenue.eval == 0) {
                return data.inout.total + data.revenue.interestTotal;
              } else {
                return data.revenue.eval + data.revenue.interestTotal;
              }
            }),
            totalPrev: computed(() => {
              const data = summaryData.data[0];
              return data.revenue.total - (data.revenue.interestPrev + data.revenue.evalPrev);
            }),
            interestTotal: 0,
            interestPrev: 0,
            interestCurrent: 0,
            eval: 0,
            evalPrev: 0,
          },
          earn: {
            earn: 0,
            rate: 0,
            ratePercent: computed(() => {
              const data = summaryData.data[0];
              return data.earn.rate != 0
                  ? Math.floor(data.earn.rate * 10000) / 100
                  : 0;
            }),
            earnIncProceeds: 0,
            rateIncProceeds: 0,
            rateIncProceedsPercent: computed(() => {
              const data = summaryData.data[0];
              return data.earn.rateIncProceeds != 0
                  ? Math.floor(data.earn.rateIncProceeds * 10000) / 100
                  : 0;
            })
          },
          earnPrevDiff: {
            earn: 0,
            rate: 0,
            ratePercent: computed(() => {
              const data = summaryData.data[0];
              return data.earnPrevDiff.rate != 0
                  ? Math.floor(data.earnPrevDiff.rate * 10000) / 100
                  : 0;
            }),
            earnIncProceeds: 0,
            rateIncProceeds: 0,
            rateIncProceedsPercent: computed(() => {
              const data = summaryData.data[0];
              return data.earnPrevDiff.rateIncProceeds != 0
                  ? Math.floor(data.earnPrevDiff.rateIncProceeds * 10000) / 100
                  : 0;
            })
          }
        }
      ]
    });

    /*
    watch variables
     */
    watch([updateSummaryFlag, () => props.thisMonth.value],
      async ([newSummaryFlag, newThisMonth], [oldSummaryFlag, oldThisMonth]) => {
        if (selectedTab.value == 'month' && newThisMonth.format('YYYY-MM') != oldThisMonth.format('YYYY-MM')) {
          newSummaryFlag = true;
        }
        if (selectedTab.value == 'year' && newThisMonth.format('YYYY') != oldThisMonth.format('YYYY')) {
          newSummaryFlag = true;
        }

        if (newSummaryFlag) {
          await getSummary();
        }
    });

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      await getSummary();
    });

    /**
     * 요약 데이터 반환
     * @returns {Promise<void>}
     */
    const getSummary = async () => {
      try {
        if (currentItemIdx.value > 0) {
          let data;
          if (selectedTab.value == 'total') {
            data = await investApi.getItemSummaryTotal(currentItemIdx.value);
          } else if (selectedTab.value == 'month') {
            data = await investApi.getItemSummaryMonth(currentItemIdx.value, props.thisMonth.value.format('YYYY-MM-DD'));
          } else if (selectedTab.value == 'year') {
            data = await investApi.getItemSummaryYear(currentItemIdx.value, props.thisMonth.value.format('YYYY'));
          }

          summaryData.unit = data.unit;
          summaryData.unitType = data.unitType;
          summaryData.data[0].inout.total = data.inout.total;
          summaryData.data[0].revenue.eval = data.revenue.eval;
          summaryData.data[0].earn.earn = data.earn.earn;
          summaryData.data[0].earn.rate = data.earn.rate;
          summaryData.data[0].earn.earnIncProceeds = data.earn.earnIncProceeds;
          summaryData.data[0].earn.rateIncProceeds = data.earn.rateIncProceeds;

          if (selectedTab.value == 'total') {
            summaryData.year = '';
            summaryData.month = '';
            summaryData.data[0].inout.principalTotal = data.inout.principal;
            summaryData.data[0].inout.principalPrev = 0;
            summaryData.data[0].inout.principalCurrent = 0;
            summaryData.data[0].inout.proceedsTotal = data.inout.proceeds;
            summaryData.data[0].inout.proceedsPrev = 0;
            summaryData.data[0].inout.proceedsCurrent = 0;
            summaryData.data[0].revenue.interestTotal = data.revenue.interest;
            summaryData.data[0].revenue.interestPrev = 0;
            summaryData.data[0].revenue.interestCurrent = 0;
            summaryData.data[0].revenue.evalPrev = 0;
            summaryData.data[0].earnPrevDiff.earn = 0;
            summaryData.data[0].earnPrevDiff.rate = 0;
            summaryData.data[0].earnPrevDiff.earnIncProceeds = 0;
            summaryData.data[0].earnPrevDiff.rateIncProceeds = 0;
          } else {
            summaryData.year = data.year;
            summaryData.month = data.month;
            summaryData.data[0].inout.principalTotal = data.inout.principalTotal;
            summaryData.data[0].inout.principalPrev = data.inout.principalPrev;
            summaryData.data[0].inout.principalCurrent = data.inout.principalCurrent;
            summaryData.data[0].inout.proceedsTotal = data.inout.proceedsTotal;
            summaryData.data[0].inout.proceedsPrev = data.inout.proceedsPrev;
            summaryData.data[0].inout.proceedsCurrent = data.inout.proceedsCurrent;
            summaryData.data[0].revenue.interestTotal = data.revenue.interestTotal;
            summaryData.data[0].revenue.interestPrev = data.revenue.interestPrev;
            summaryData.data[0].revenue.interestCurrent = data.revenue.interestCurrent;
            summaryData.data[0].revenue.evalPrev = data.revenue.evalPrev;
            summaryData.data[0].earnPrevDiff.earn = data.earnPrevDiff.earn;
            summaryData.data[0].earnPrevDiff.rate = data.earnPrevDiff.rate;
            summaryData.data[0].earnPrevDiff.earnIncProceeds = data.earnPrevDiff.earnIncProceeds;
            summaryData.data[0].earnPrevDiff.rateIncProceeds = data.earnPrevDiff.rateIncProceeds;
          }
        }
      } catch (err) {

      } finally {
        store.commit('investHistory/setUpdateSummaryFlag', false);
      }
    };

    /**
     * 탭 변경
     * @param {string} type
     */
    const switchTab = (type) => {
      if (selectedTab.value != type) {
        selectedTab.value = type;
        if (type == 'total') selectedTab.index = 0;
        else if (type == 'month') selectedTab.index = 1;
        else if (type == 'year') selectedTab.index = 2;

        store.commit('investHistory/setUpdateSummaryFlag', true);
      }
    }

    /**
     * 값 출력
     * @param {Object} data
     * @param {string} valKey
     * @param {string} [printType]
     * @return {string}
     */
    const printVal = (data, valKey, printType) => {
      const unit = summaryData.unit;
      const unitType = summaryData.unitType;

      let printTypeArr = [];
      if (printType) {
        printTypeArr = printType.split('+');
      }

      const valKeyArr = valKey.split('.');
      let val = data;
      for (const key of valKeyArr) {
        val = val[key];
      }

      if (!printTypeArr.includes('percent') && unitType == 'int') {
        val = parseInt(val);
      }

      //이전과 차이 출력
      let diffStr = '';
      if (printTypeArr.includes('diff')) {
        let diffVal;
        switch (valKey) {
          case 'inout.principalTotal':
            diffVal = data.inout.principalCurrent;
            break;
          case 'inout.proceedsTotal':
            diffVal = data.inout.proceedsCurrent;
            break;
          case 'revenue.interestTotal':
            diffVal = data.revenue.interestCurrent;
            break;
          case 'revenue.eval':
            diffVal = data.revenue.eval - data.revenue.evalPrev;
            break;
          case 'revenue.total':
            diffVal = data.revenue.totalPrev;
            break;
          case 'earn.earn':
            diffVal = data.earnPrevDiff.earn;
            break;
          case 'earn.ratePercent':
            diffVal = data.earnPrevDiff.ratePercent;
            break;
          case 'earn.earnIncProceeds':
            diffVal = data.earnPrevDiff.earnIncProceeds;
            break;
          case 'earn.rateIncProceedsPercent':
            diffVal = data.earnPrevDiff.rateIncProceedsPercent;
            break;
        }

        if (diffVal) {
          if (!printTypeArr.includes('percent') && unitType == 'int') {
            diffVal = parseInt(diffVal);
          }

          if (printTypeArr.includes('plain')) {
            if (diffVal > 0) diffStr = `<br><span class="diff">(+${numberComma(diffVal)})</span>`;
            else if (diffVal < 0) diffStr = `<br><span class="diff">(${numberComma(diffVal)})</span>`;
          } else if (printTypeArr.includes('percent')) {
            if (diffVal > 0) diffStr = `<br><span class="diff" style="color: red;">(+${diffVal} %)</span>`;
            else if (diffVal < 0) diffStr = `<br><span class="diff" style="color: blue;">(${diffVal} %)</span>`;
          } else {
            if (diffVal > 0) diffStr = `<br><span class="diff" style="color: red;">(+${numberComma(diffVal)})</span>`;
            else if (diffVal < 0) diffStr = `<br><span class="diff" style="color: blue;">(${numberComma(diffVal)})</span>`;
          }
        }
      }

      //결과 출력
      let retStr;
      if (printTypeArr.includes('plain')) {
        retStr = `${numberComma(val)} ${unit}${diffStr}`;
      } else if (printTypeArr.includes('percent')) {
        if (val < 0) retStr = `<span style="color: blue">${val}</span> %${diffStr}`;
        else if (val > 0) retStr = `<span style="color: red;">${val}</span> %${diffStr}`;
        else retStr = `${val} %`;
      } else {
        if (val < 0) retStr = `<span style="color: blue">${numberComma(val)}</span> ${unit}${diffStr}`;
        else if (val > 0) retStr = `<span style="color: red;">${numberComma(val)}</span> ${unit}${diffStr}`;
        else retStr = `${numberComma(val)} ${unit}${diffStr}`;
      }

      return retStr;
    }

    return {
      currentItemIdx,
      tabMenus,
      selectedTab,
      summaryData,
      switchTab,
      printVal,
    }
  }
}
</script>

<style scoped>
.p-datatable :deep(td .diff) {
  font-size: 0.6rem !important;
}

@media screen and (max-width: 960px) {
  .p-datatable :deep(td .diff) {
    font-size: 0.75rem !important;
  }
}
</style>