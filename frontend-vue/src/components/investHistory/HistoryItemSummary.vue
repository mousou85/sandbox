<template>
  <table width="100%" class="summaryTable" v-if="currentItemIdx > 0">
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
      <td class="right bold" v-html="printVal(summaryData.deposit, 'plain')"></td>
      <td class="right" v-html="printVal(summaryData.in.total, 'plain')"></td>
      <td class="right" v-html="printVal(summaryData.out.total * -1, 'plain')"></td>
      <td class="right bold" v-html="printVal(summaryData.excludeProceedsDeposit, 'plain')"></td>
      <td class="right" v-html="printVal(summaryData.in.principal, 'plain')"></td>
      <td class="right" v-html="printVal(summaryData.out.principal * -1, 'plain')"></td>
      <td class="right" v-html="printVal(summaryData.revenue.interest)"></td>
      <td class="right" v-html="printVal(summaryData.revenue.eval)"></td>
      <td class="right bold" v-html="printVal(summaryData.revenue.total)"></td>
      <td class="right bold" v-html="printVal(summaryData.revenueRate.excludeProceedsDiff)"></td>
      <td class="right" v-html="printVal(summaryData.revenueRate.excludeProceedsRate, 'percent')"></td>
      <td class="right bold" v-html="printVal(summaryData.revenueRate.diff)"></td>
      <td class="right" v-html="printVal(summaryData.revenueRate.rate, 'percent')"></td>
    </tr>
  </table>
</template>

<script>
import {computed} from "vue";
import {useStore} from 'vuex';
import {numberComma} from "@/libs/helper";

export default {
  setup() {
    const store = useStore();

    //set vars: summary data(vuex)
    const currentItemIdx = computed(() => store.getters["investHistory/getCurrentItemIdx"]);
    const summaryData = computed(() => store.getters['investHistory/getCurrentItemSummary']);

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
        retStr = `${numberComma(val)} ${summaryData.value.unit}`;
      } else if (valType == 'percent') {
        if (val < 0) retStr = `<span style="color: blue">${val}</span> %`;
        else if (val > 0) retStr = `<span style="color: red;">${val}</span> %`;
        else retStr = `${val} %`;
      } else {
        if (val < 0) retStr = `<span style="color: blue">${numberComma(val)}</span> ${summaryData.value.unit}`;
        else if (val > 0) retStr = `<span style="color: red;">${numberComma(val)}</span> ${summaryData.value.unit}`;
        else retStr = `${numberComma(val)} ${summaryData.value.unit}`;
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