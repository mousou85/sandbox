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
import {computed, reactive, watch} from "vue";
import {useStore} from 'vuex';
import {numberComma} from "@/libs/helper";
import {getItemSummary} from "@/modules/investHistory";

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
          const data = await getItemSummary(currentItemIdx.value);

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