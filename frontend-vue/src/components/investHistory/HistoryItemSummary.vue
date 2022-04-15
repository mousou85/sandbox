<template>
  <ul class="tabs" v-if="currentItemIdx > 0">
    <li :class="selectedTab == 'total' ? 'on' : ''" @click="switchTab('total')">종합</li>
    <li :class="selectedTab == 'month' ? 'on' : ''" @click="switchTab('month')">월간</li>
    <li :class="selectedTab == 'year' ? 'on' : ''" @click="switchTab('year')">년간</li>
  </ul>
  <table width="100%" class="summaryTable" v-if="currentItemIdx > 0">
    <template v-if="selectedTab == 'total'">
      <tr>
        <th colspan="3">원금</th>
        <th colspan="3">현재평가</th>
        <th colspan="4">수익율</th>
      </tr>
      <tr>
        <th>원금</th>
        <th>재투자금</th>
        <th>합계</th>
        <th>누적이자</th>
        <th>평가금액</th>
        <th>합계</th>
        <th>수익</th>
        <th>수익율</th>
        <th>수익(재투자금 포함)</th>
        <th>수익율(재투자금 포함)</th>
      </tr>
      <tr>
        <td class="right" v-html="printVal(summaryData, 'inout.principalTotal', 'plain')"></td>
        <td class="right" v-html="printVal(summaryData, 'inout.proceedsTotal', 'plain')"></td>
        <td class="right bold" v-html="printVal(summaryData, 'inout.total', 'plain')"></td>
        <td class="right" v-html="printVal(summaryData, 'revenue.interestTotal')"></td>
        <td class="right" v-html="printVal(summaryData, 'revenue.eval')"></td>
        <td class="right bold" v-html="printVal(summaryData, 'revenue.total')"></td>
        <td class="right bold" v-html="printVal(summaryData, 'earn.earn')"></td>
        <td class="right" v-html="printVal(summaryData, 'earn.ratePercent', 'percent')"></td>
        <td class="right bold" v-html="printVal(summaryData, 'earn.earnIncProceeds')"></td>
        <td class="right" v-html="printVal(summaryData, 'earn.rateIncProceedsPercent', 'percent')"></td>
      </tr>
    </template>
    <template v-else-if="selectedTab == 'month'">
      <tr>
        <th colspan="3">원금</th>
        <th colspan="3">현재평가</th>
        <th colspan="4">수익율</th>
      </tr>
      <tr>
        <th>원금</th>
        <th>재투자금</th>
        <th>합계</th>
        <th>누적이자</th>
        <th>평가금액</th>
        <th>합계</th>
        <th>수익</th>
        <th>수익율</th>
        <th>수익(재투자금 포함)</th>
        <th>수익율(재투자금 포함)</th>
      </tr>
      <tr>
        <td class="right" v-html="printVal(summaryData, 'inout.principalTotal', 'plain+diff')"></td>
        <td class="right" v-html="printVal(summaryData, 'inout.proceedsTotal', 'plain+diff')"></td>
        <td class="right bold" v-html="printVal(summaryData, 'inout.total', 'plain')"></td>
        <td class="right" v-html="printVal(summaryData, 'revenue.interestTotal', 'diff')"></td>
        <td class="right" v-html="printVal(summaryData, 'revenue.eval')"></td>
        <td class="right bold" v-html="printVal(summaryData, 'revenue.total')"></td>
        <td class="right bold" v-html="printVal(summaryData, 'earn.earn', 'diff')"></td>
        <td class="right" v-html="printVal(summaryData, 'earn.ratePercent', 'percent+diff')"></td>
        <td class="right bold" v-html="printVal(summaryData, 'earn.earnIncProceeds', 'diff')"></td>
        <td class="right" v-html="printVal(summaryData, 'earn.rateIncProceedsPercent', 'percent+diff')"></td>
      </tr>
    </template>
  </table>
</template>

<script>
import {computed, reactive, ref, watch} from "vue";
import {useStore} from 'vuex';
import {numberComma} from "@/libs/helper";
import {getItemSummaryTotal, getItemSummaryMonth} from "@/modules/investHistory";

export default {
  props: [
    'thisMonth'
  ],
  setup(props) {
    //set vars: vuex
    const store = useStore();

    //set vars: 필요 변수
    const currentItemIdx = computed(() => store.getters["investHistory/getCurrentItemIdx"]);
    const updateSummaryFlag = computed(() => store.getters['investHistory/getUpdateSummaryFlag']);
    const selectedTab = ref('total');
    const summaryData = reactive({
      year: '',
      month: '',
      unit: '',
      unitType: '',
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
          if (summaryData.revenue.eval == 0) {
            return summaryData.inout.total + summaryData.revenue.interestTotal;
          } else {
            return summaryData.revenue.eval + summaryData.revenue.interestTotal;
          }
        }),
        interestTotal: 0,
        interestPrev: 0,
        interestCurrent: 0,
        eval: 0,
      },
      earn: {
        earn: 0,
        rate: 0,
        ratePercent: computed(() => {
          return summaryData.earn.rate != 0
            ? Math.floor(summaryData.earn.rate * 10000) / 100
            : 0;
        }),
        earnIncProceeds: 0,
        rateIncProceeds: 0,
        rateIncProceedsPercent: computed(() => {
          return summaryData.earn.rateIncProceeds != 0
              ? Math.floor(summaryData.earn.rateIncProceeds * 10000) / 100
              : 0;
        })
      },
      earnPrevDiff: {
        earn: 0,
        rate: 0,
        ratePercent: computed(() => {
          return summaryData.earnPrevDiff.rate != 0
              ? Math.floor(summaryData.earnPrevDiff.rate * 10000) / 100
              : 0;
        }),
        earnIncProceeds: 0,
        rateIncProceeds: 0,
        rateIncProceedsPercent: computed(() => {
          return summaryData.earnPrevDiff.rateIncProceeds != 0
              ? Math.floor(summaryData.earnPrevDiff.rateIncProceeds * 10000) / 100
              : 0;
        })
      }
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

    /**
     * 요약 데이터 반환
     * @returns {Promise<void>}
     */
    const getSummary = async () => {
      try {
        if (currentItemIdx.value > 0) {
          let data;
          if (selectedTab.value == 'total') {
            data = await getItemSummaryTotal(currentItemIdx.value);
          } else if (selectedTab.value == 'month') {
            data = await getItemSummaryMonth(currentItemIdx.value, props.thisMonth.value.format('YYYY-MM-DD'));
          }

          summaryData.unit = data.unit;
          summaryData.unitType = data.unitType;
          summaryData.inout.total = data.inout.total;
          summaryData.revenue.eval = data.revenue.eval;
          summaryData.earn.earn = data.earn.earn;
          summaryData.earn.rate = data.earn.rate;
          summaryData.earn.earnIncProceeds = data.earn.earnIncProceeds;
          summaryData.earn.rateIncProceeds = data.earn.rateIncProceeds;

          if (selectedTab.value == 'total') {
            summaryData.year = '';
            summaryData.month = '';
            summaryData.inout.principalTotal = data.inout.principal;
            summaryData.inout.principalPrev = 0;
            summaryData.inout.principalCurrent = 0;
            summaryData.inout.proceedsTotal = data.inout.proceeds;
            summaryData.inout.proceedsPrev = 0;
            summaryData.inout.proceedsCurrent = 0;
            summaryData.revenue.interestTotal = data.revenue.interest;
            summaryData.revenue.interestPrev = 0;
            summaryData.revenue.interestCurrent = 0;
            summaryData.earnPrevDiff.earn = 0;
            summaryData.earnPrevDiff.rate = 0;
            summaryData.earnPrevDiff.earnIncProceeds = 0;
            summaryData.earnPrevDiff.rateIncProceeds = 0;
          } else if (selectedTab.value == 'month') {
            summaryData.year = data.year;
            summaryData.month = data.month;
            summaryData.inout.principalTotal = data.inout.principalTotal;
            summaryData.inout.principalPrev = data.inout.principalPrev;
            summaryData.inout.principalCurrent = data.inout.principalCurrent;
            summaryData.inout.proceedsTotal = data.inout.proceedsTotal;
            summaryData.inout.proceedsPrev = data.inout.proceedsPrev;
            summaryData.inout.proceedsCurrent = data.inout.proceedsCurrent;
            summaryData.revenue.interestTotal = data.revenue.interestTotal;
            summaryData.revenue.interestPrev = data.revenue.interestPrev;
            summaryData.revenue.interestCurrent = data.revenue.interestCurrent;
            summaryData.earnPrevDiff.earn = data.earnPrevDiff.earn;
            summaryData.earnPrevDiff.rate = data.earnPrevDiff.rate;
            summaryData.earnPrevDiff.earnIncProceeds = data.earnPrevDiff.earnIncProceeds;
            summaryData.earnPrevDiff.rateIncProceeds = data.earnPrevDiff.rateIncProceeds;
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
      const unit = data.unit;
      const unitType = data.unitType;

      const valKeyArr = valKey.split('.');
      let val = data;
      for (const key of valKeyArr) {
        val = val[key];
      }

      let printTypeArr = [];
      if (printType) {
        printTypeArr = printType.split('+');
      }

      if (!printTypeArr.includes('percent') && unitType == 'int') {
        val = parseInt(val);
      }

      //이전과 차이 출력
      let diffStr = '';
      if (printTypeArr.includes('diff')) {
        let diffVal;
        if (/principalTotal$/.test(valKey)) {
          diffVal = data.inout.principalCurrent;
        } else if (/interestTotal$/.test(valKey)) {
          diffVal = data.revenue.interestCurrent;
        } else if (/earn\.earn$/.test(valKey)) {
          diffVal = data.earnPrevDiff.earn;
        } else if (/earn\.ratePercent$/.test(valKey)) {
          diffVal = data.earnPrevDiff.ratePercent;
        } else if (/earn\.earnIncProceeds$/.test(valKey)) {
          diffVal = data.earnPrevDiff.earnIncProceeds;
        } else if (/earn\.rateIncProceedsPercent$/.test(valKey)) {
          diffVal = data.earnPrevDiff.rateIncProceedsPercent;
        }

        if (diffVal) {
          if (!printTypeArr.includes('percent') && unitType == 'int') {
            diffVal = parseInt(diffVal);
          }

          if (printTypeArr.includes('plain')) {
            if (diffVal > 0) diffStr = `<br><span class="diff">(+${numberComma(diffVal)})</span>`;
            else if (diffVal < 0) diffStr = `<br><span class="diff">(-${numberComma(diffVal)})</span>`;
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
      selectedTab,
      summaryData,
      switchTab,
      printVal
    }
  }
}
</script>

<style scoped>
.tabs {
  list-style: none;
  padding: 0;
  overflow: hidden;
  margin: 1em 0 0 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  border-collapse: collapse;
  font-size: 0.8em;
}
.tabs li {
  flex-basis: 10%;
  padding: 0.2em 0.5em;
  text-align: center;
  border-top: 1px solid;
  border-left: 1px solid;
  border-right: 1px solid;
  cursor: pointer;
}
.tabs li.on {
  background: lightyellow;
  font-weight: bold;
}
.summaryTable {
  border: 1px solid;
  border-collapse: collapse;
  margin-top: 0;
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
.summaryTable .right {
  text-align: right;
}
.summaryTable .diff {
  font-size: 0.5em;
}
</style>