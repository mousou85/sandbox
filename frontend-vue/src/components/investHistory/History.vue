<template>
  <div>
    <div>
      <CascadeSelect
          v-model="selectedItem"
          :options="itemList"
          :optionGroupChildren="['item_list']"
          optionLabel="option_label"
          optionGroupLabel="company_name"
          placeholder="상품 선택"
          style="min-width: 20rem"
      >
        <template #option="item">
          <span v-if="item.option.company_idx">{{item.option.company_name}}</span>
          <span v-else :style="item.option.is_close ? 'text-decoration:line-through' : ''">
            {{item.option.item_name}}{{ item.option.is_close ? '(투자종료)' : '' }}
          </span>
        </template>
      </CascadeSelect>
    </div>

    <HistoryAddForm
        :usable-unit-list="itemUsableUnitList"
    ></HistoryAddForm>

    <div style="overflow: hidden;">
      <HistoryItemSummary
          :this-month="thisMonth"
      ></HistoryItemSummary>

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
import {onBeforeMount, reactive, ref, watch} from "vue";
import {useStore} from 'vuex';
import {investHistory} from "@/store/modules/investHistory";

import dayjs from 'dayjs';
import {getItemList as requestItemList} from '@/modules/investHistory';

import HistoryAddForm from '@/components/investHistory/HistoryAddForm.vue';
import HistoryItemSummary from '@/components/investHistory/HistoryItemSummary.vue';
import HistoryInOutList from '@/components/investHistory/HistoryInOutList.vue';
import HistoryRevenueList from '@/components/investHistory/HistoryRevenueList.vue';

import CascadeSelect from 'primevue/cascadeselect';

export default {
  components: {
    HistoryAddForm,
    HistoryItemSummary,
    HistoryInOutList,
    HistoryRevenueList,
    CascadeSelect,
  },
  setup() {
    //set vars: vuex
    const store = useStore();

    //set vars: 필요 변수
    const selectedItem = ref();
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
        for (const company of itemList.value) {
          const companyName = company.company_name;

          for (const item of company.item_list) {
            item.option_label = `${companyName} - ${item.item_name}`;
          }
        }
      } catch (err) {
        itemList.value = [];
      }
    });

    /*
    watch variables
     */
    watch(selectedItem, (newSelectedItem, oldSelectedItem) => {
      itemUsableUnitList.value = newSelectedItem.unit_set;

      let storeUpdateFlag = false;
      if (oldSelectedItem) {
        if (newSelectedItem.item_idx != oldSelectedItem.item_idx) {
          storeUpdateFlag = true;
        }
      } else {
        storeUpdateFlag = true;
      }

      if (storeUpdateFlag) {
        store.commit('investHistory/setCurrentItemIdx', newSelectedItem.item_idx);
        store.commit('investHistory/setUpdateSummaryFlag', true);
        store.commit('investHistory/setUpdateInOutListFlag', true);
        store.commit('investHistory/setUpdateRevenueListFlag', true);
        store.commit('investHistory/setSelectedUnit', '');
      }
    });

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
      selectedItem,
      itemList,
      changeHistoryListMonth,
    }
  }
}
</script>

<style scoped>
</style>