<template>
  <table width="100%" class="summaryTable" v-if="currentItemIdx > 0">
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
      <td class="right" v-html="printVal(summaryData.inout.principal, 'plain')"></td>
      <td class="right" v-html="printVal(summaryData.inout.proceeds, 'plain')"></td>
      <td class="right bold" v-html="printVal(summaryData.inout.total, 'plain')"></td>
      <td class="right" v-html="printVal(summaryData.revenue.interest)"></td>
      <td class="right" v-html="printVal(summaryData.revenue.eval)"></td>
      <td class="right bold" v-html="printVal(summaryData.revenue.total)"></td>
      <td class="right bold" v-html="printVal(summaryData.earn.earn)"></td>
      <td class="right" v-html="printVal(summaryData.earn.ratePercent, 'percent')"></td>
      <td class="right bold" v-html="printVal(summaryData.earn.earnIncProceeds)"></td>
      <td class="right" v-html="printVal(summaryData.earn.rateIncProceedsPercent, 'percent')"></td>
    </tr>
  </table>
</template>

<script>
import {computed, reactive, watch} from "vue";
import {useStore} from 'vuex';
import {numberComma} from "@/libs/helper";
import {getItemSummaryTotal} from "@/modules/investHistory";

export default {
  setup() {
    //set vars: vuex
    const store = useStore();

    //set vars: 필요 변수
    const currentItemIdx = computed(() => store.getters["investHistory/getCurrentItemIdx"]);
    const updateSummaryFlag = computed(() => store.getters['investHistory/getUpdateSummaryFlag']);
    const summaryData = reactive({
      unit: '',
      unitType: '',
      inout: {
        total: 0,
        principal: 0,
        proceeds: 0
      },
      revenue: {
        total: computed(() => {
          if (summaryData.revenue.eval == 0) {
            return summaryData.inout.total + summaryData.revenue.interest;
          } else {
            return summaryData.revenue.eval + summaryData.revenue.interest;
          }
        }),
        interest: 0,
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
      }
    });

    /*
    watch variables
     */
    watch(updateSummaryFlag, async (newSummaryFlag) => {
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
          const data = await getItemSummaryTotal(currentItemIdx.value);

          summaryData.unit = data.unit;
          summaryData.unitType = data.unitType;
          summaryData.inout.total = data.inout.total;
          summaryData.inout.principal = data.inout.principal;
          summaryData.inout.proceeds = data.inout.proceeds;
          summaryData.revenue.interest = data.revenue.interest;
          summaryData.revenue.eval = data.revenue.eval;
          summaryData.earn.earn = data.earn.earn;
          summaryData.earn.rate = data.earn.rate;
          summaryData.earn.earnIncProceeds = data.earn.earnIncProceeds;
          summaryData.earn.rateIncProceeds = data.earn.rateIncProceeds;
        }
      } catch (err) {

      } finally {
        store.commit('investHistory/setUpdateSummaryFlag', false);
      }
    };

    /**
     * 값 출력
     * @param {number|string} val
     * @param {string} [valType]
     * @return {string}
     */
    const printVal = (val, valType) => {
      if (valType != 'percent' && summaryData.unitType == 'int') {
        val = parseInt(val);
      }

      let retStr;
      if (valType == 'plain') {
        retStr = `${numberComma(val)} ${summaryData.unit}`;
      } else if (valType == 'percent') {
        if (val < 0) retStr = `<span style="color: blue">${val}</span> %`;
        else if (val > 0) retStr = `<span style="color: red;">${val}</span> %`;
        else retStr = `${val} %`;
      } else {
        if (val < 0) retStr = `<span style="color: blue">${numberComma(val)}</span> ${summaryData.unit}`;
        else if (val > 0) retStr = `<span style="color: red;">${numberComma(val)}</span> ${summaryData.unit}`;
        else retStr = `${numberComma(val)} ${summaryData.unit}`;
      }

      return retStr;
    }

    return {
      currentItemIdx,
      summaryData,
      printVal
    }
  }
}
</script>

<style scoped>
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
.summaryTable .right {
  text-align: right;
}
</style>