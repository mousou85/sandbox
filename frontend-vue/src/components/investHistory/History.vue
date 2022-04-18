<template>
  <div>
    <div>
      <TreeSelect
          v-model="selectedItemIdx"
          :options="itemTreeSelect"
          selectionMode="single"
          placeholder="상품선택"
      >
        <template #value="value">
          {{value.value[0]?.data.label ?? value.placeholder}}
        </template>
      </TreeSelect>
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

import TreeSelect from 'primevue/treeselect';

export default {
  components: {
    HistoryAddForm,
    HistoryItemSummary,
    HistoryInOutList,
    HistoryRevenueList,
    TreeSelect,
  },
  setup() {
    //set vars: vuex
    const store = useStore();

    //set vars: 필요 변수
    const selectedItemIdx = ref();
    const itemUsableUnitList = ref([]);
    const thisMonth = reactive({value: dayjs()});
    const itemList = ref([]);
    const itemTreeSelect = ref([]);

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
        setItemTreeSelect();
      } catch (err) {
        console.log(err);
        itemList.value = [];
      }
    });

    /*
    watch variables
     */
    watch(selectedItemIdx, (newSelectedIdx, oldSelectedIdx) => {
      newSelectedIdx = Object.keys(newSelectedIdx);
      newSelectedIdx = newSelectedIdx.length > 0 ? newSelectedIdx[0] : 0;

      // console.log(itemList);
      for (const item of itemList.value) {
        if (item.item_idx == newSelectedIdx) {
          itemUsableUnitList.value = item.unit_set;
        }
      }

      store.commit('investHistory/setCurrentItemIdx', newSelectedIdx);
      store.commit('investHistory/setUpdateSummaryFlag', true);
      store.commit('investHistory/setUpdateInOutListFlag', true);
      store.commit('investHistory/setUpdateRevenueListFlag', true);
      store.commit('investHistory/setSelectedUnit', '');
    });

    /**
     * set item tree select list
     */
    const setItemTreeSelect = () => {
      const list = [];

      for (const _item of itemList.value) {
        let arrKey = null;
        for (const k in list) {
          if (list[k].key == _item.company_idx) {
            arrKey = k;
          }
        }

        if (arrKey === null) {
          list.push({
            key: _item.company_idx,
            label: _item.company_name,
            selectable: false,
            children: [
              {
                key: _item.item_idx,
                label: _item.item_name,
                data: Object.assign(_item, {label: `${_item.company_name} - ${_item.item_name}`}),
              }
            ]
          })
        } else {
          list[arrKey].children.push({
            key: _item.item_idx,
            label: _item.item_name,
            data: Object.assign(_item, {label: `${_item.company_name} - ${_item.item_name}`}),
          })
        }
      }

      itemTreeSelect.value = list;
    }

    /**
     * 상품 선택 이벤트
     * @param {Object} selected
     * @returns {Promise<void>}
     */
    const selectItem = async (selected) => {
      const selectedKeys = Object.keys(selected);
      const selectedValue = selectedKeys.length ? parseInt(selectedKeys[0]) : 0;

      for (const item of itemList.value) {
        if (item.item_idx == selectedValue) {
          itemUsableUnitList.value = item.unit_set;
        }
      }

      store.commit('investHistory/setCurrentItemIdx', selectedValue);
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
      selectedItemIdx,
      itemTreeSelect,
      selectItem,
      changeHistoryListMonth,
    }
  }
}
</script>

<style scoped>
</style>