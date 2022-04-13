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

    <HistoryAddForm
        :usable-unit-list="itemUsableUnitList"
    ></HistoryAddForm>

    <div style="overflow: hidden;">
      <HistoryItemSummary></HistoryItemSummary>

      <h4 style="text-align: center;">
        <button type="button" @click="changeHistoryListMonth('prev')">◀</button>&nbsp;&nbsp;
        <span>{{thisMonth.value.format('YYYY-MM')}}</span>
        &nbsp;&nbsp;<button type="button" @click="changeHistoryListMonth('next')">▶</button>
      </h4>

      <div style="float: left;width: 45%;">
        <HistoryInOutList
          :this-month="thisMonth"
          :usable-unit-list="itemUsableUnitList"
        ></HistoryInOutList>
      </div>

      <div style="float: left;width: 45%;margin-left: 20px;">
        <HistoryRevenueList
            :this-month="thisMonth"
            :usable-unit-list="itemUsableUnitList"
        ></HistoryRevenueList>
      </div>
    </div>
  </div>
</template>

<script>
import {onBeforeMount, reactive, ref} from "vue";
import {useStore} from 'vuex';
import {investHistory} from "@/store/modules/investHistory";

import dayjs from 'dayjs';
import {getItemList as requestItemList} from '@/modules/investHistory';

import HistoryAddForm from '@/components/investHistory/HistoryAddForm.vue';
import HistoryItemSummary from '@/components/investHistory/HistoryItemSummary.vue';
import HistoryInOutList from '@/components/investHistory/HistoryInOutList.vue';
import HistoryRevenueList from '@/components/investHistory/HistoryRevenueList.vue';

export default {
  components: {
    HistoryAddForm,
    HistoryItemSummary,
    HistoryInOutList,
    HistoryRevenueList,
  },
  setup() {
    //set vars: vuex
    const store = useStore();

    //set vars: 필요 변수
    const itemUsableUnitList = ref([]);
    const thisMonth = reactive({value: dayjs()});
    const itemList = ref([]);

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      try {
        //load vuex module
        if (!store.hasModule('investHistory')) {
          store.registerModule('investHistory', investHistory);
        }

        itemList.value = await requestItemList();
      } catch (err) {
        itemList.value = [];
      }
    });

    /**
     * 상품 선택 이벤트
     * @param $event
     * @returns {Promise<void>}
     */
    const selectItem = async ($event) => {
      const selectedVal = $event.target.value;

      for (const item of itemList.value) {
        if (item.item_idx == selectedVal) {
          itemUsableUnitList.value = item.unit_set;
        }
      }

      store.commit('investHistory/setCurrentItemIdx', selectedVal);
      store.commit('investHistory/setUpdateSummaryFlag', true);
      store.commit('investHistory/setUpdateInOutListFlag', true);
      store.commit('investHistory/setUpdateRevenueListFlag', true);
      store.commit('investHistory/setSelectedUnit', '');
    }

    /**
     * 히스토리 리스트 날짜 변경
     * @param {string} type
     * @returns {Promise<void>}
     */
    const changeHistoryListMonth = async (type) => {
      if (type == 'prev') {
        thisMonth.value = thisMonth.value.subtract(1, 'month');
      } else if (type == 'next') {
        thisMonth.value = thisMonth.value.add(1, 'month');
      }

      store.commit('investHistory/setUpdateInOutListFlag', true);
      store.commit('investHistory/setUpdateRevenueListFlag', true);
    }

    return {
      itemUsableUnitList,
      thisMonth,
      itemList,
      selectItem,
      changeHistoryListMonth,
    }
  }
}
</script>

<style scoped>
</style>