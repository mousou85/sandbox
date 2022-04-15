<template>
  <div>
    <h5>평가</h5>
    <ul class="unitTab">
      <li v-for="unit in usableUnitList" :key="unit.unit_idx" :class="unit.unit == selectedTab ? 'on' : ''" @click="switchTab(unit.unit)">
        {{unit.unit}}
      </li>
    </ul>
    <table id="revenueList" class="list" style="width:100%;">
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
            {{history.revenue_type_text}}
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
            {{history.revenue_type_text}}
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
import {computed, onBeforeMount, ref, watch} from "vue";
import {
  getHistoryList as requestHistoryList,
  editHistory as requestEditHistory,
  delHistory as requestDelHistory
} from "@/modules/investHistory";
import {numberComma, numberUncomma} from "@/libs/helper";

export default {
  props: [
    'thisMonth',
    'usableUnitList',
  ],
  setup(props) {
    //set vars: vuex
    const store = useStore();

    //set vars: 필요 변수
    const itemIdx = computed(() => store.getters["investHistory/getCurrentItemIdx"]);
    const updateListFlag = computed(() => store.getters['investHistory/getUpdateRevenueListFlag']);
    const selectedUnit = computed(() => store.getters['investHistory/getSelectedUnit']);
    const selectedTab = ref('KRW');
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
    watch([itemIdx, updateListFlag, selectedUnit], async (
        [newItemIdx, newUpdateListFlag, newSelectedUnit],
        [oldItemIdx, oldUpdateListFlag, oldSelectedUnit]
    ) => {
      //선택한 상품 변경 여부 체크
      if (newItemIdx != oldItemIdx) {
        selectedTab.value = 'KRW';
        newUpdateListFlag = true;
      }

      //기록 추가 form에서 단위 변경 여부 체크
      if (newSelectedUnit != '' && newSelectedUnit != oldSelectedUnit) {
        selectedTab.value = newSelectedUnit;
        newUpdateListFlag = true;
      }

      //리스트 업데이트 필요 체크
      if (newUpdateListFlag === true) {
        await getHistoryList();
      }
    });

    /**
     * 히스토리 목록 반환
     * @returns {Promise<void>}
     */
    const getHistoryList = async() => {
      try {
        if (itemIdx.value > 0) {
          historyList.value = await requestHistoryList(
              itemIdx.value,
              'revenue',
              selectedTab.value,
              props.thisMonth.value.format('YYYY-MM-DD')
          );

          for (const history of historyList.value) {
            history.edit_flag = false;
            history.original_history_date = history.history_date;
            history.original_memo = history.memo;
            history.original_val = history.val;

            history.valText = computed({
              get: () => {
                return numberComma(history.val);
              },
              set: (val) => {
                val = numberUncomma(val);
                history.val = val;
              }
            })
          }
        } else {
          historyList.value = [];
        }
      } catch (err) {
        alert(err);
        historyList.value = [];
      } finally {
        store.commit('investHistory/setUpdateRevenueListFlag', false);
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
        store.commit('investHistory/setUpdateRevenueListFlag', true);
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
      try {
        await requestDelHistory(historyIdx);

        store.commit('investHistory/setUpdateSummaryFlag', true);
        store.commit('investHistory/setUpdateRevenueListFlag', true);
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

      store.commit('investHistory/setUpdateRevenueListFlag', true);
    }

    /**
     * 값 출력
     * @param {Object} history
     * @return {string}
     */
    const printVal = (history) => {
      let val = history.val;
      if (history.history_type == 'out') val = val * -1;
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
      historyList,
      switchTab,
      printVal,
      editHistory,
      cancelEditHistory,
      delHistory
    }
  }
}
</script>

<style scoped>

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