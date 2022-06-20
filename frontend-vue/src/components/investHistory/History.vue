<template>
  <TreeSelect
      v-model="treeSelectedVal"
      :options="treeItemList"
      selectionMode="single"
      placeholder="상품선택"
      class="mt-3 min-w-full md:min-w-min"
  >
    <template #value="{value: item, placeholder}">
      {{item.length ? item[0].selected_label : placeholder}}
    </template>
  </TreeSelect>

  <HistoryAddForm
      :usable-unit-list="itemUsableUnitList"
  ></HistoryAddForm>

  <div>
    <HistoryItemSummary
        :this-month="thisMonth"
    ></HistoryItemSummary>

    <div class="p-buttonset text-center mt-4">
      <Button icon="pi pi-chevron-left" @click="changeHistoryListMonth('prev')"></Button>
      <span class="label">{{thisMonth.value.format('YYYY-MM')}}</span>
      <Button icon="pi pi-chevron-right" @click="changeHistoryListMonth('next')"></Button>
    </div>

    <div class="flex flex-column md:flex-row md:justify-content-between mt-4">
      <div class="flex w-full md:w-6 md:mr-5">
        <HistoryInOutList
            :this-month="thisMonth"
            :usable-unit-list="itemUsableUnitList"
        ></HistoryInOutList>
      </div>
      <div class="flex w-full mt-3 md:w-6 md:mt-0">
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

import dayjs from 'dayjs';
import {getItemList as requestItemList} from '@/apis/investHistory';

import HistoryAddForm from '@/components/investHistory/HistoryAddForm.vue';
import HistoryItemSummary from '@/components/investHistory/HistoryItemSummary.vue';
import HistoryInOutList from '@/components/investHistory/HistoryInOutList.vue';
import HistoryRevenueList from '@/components/investHistory/HistoryRevenueList.vue';

import TreeSelect from 'primevue/treeselect';
import Button from 'primevue/button';

export default {
  components: {
    HistoryAddForm,
    HistoryItemSummary,
    HistoryInOutList,
    HistoryRevenueList,
    TreeSelect,
    Button,
  },
  setup() {
    //set vars: vuex
    const store = useStore();

    //set vars: 필요 변수
    const itemUsableUnitList = ref([]);
    const thisMonth = reactive({value: dayjs()});
    const itemList = ref([]);
    const treeItemList = ref([]);
    const treeSelectedVal = ref();

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      try {
        itemList.value = await requestItemList('group');
        for (const company of itemList.value) {
          const _tmp = {
            key: company.company_idx,
            label: company.company_name,
            selectable: false,
            children: []
          };

          for (const item of company.item_list) {
            _tmp.children.push({
              key: `${company.company_idx}-${item.item_idx}`,
              label: item.item_name,
              selected_label: `${company.company_name} - ${item.item_name}`
            })
          }

          treeItemList.value.push(_tmp);
        }
      } catch (err) {
        itemList.value = [];
      }
    });

    /*
    watch variables
     */
    watch(treeSelectedVal, (newSelectedItem, oldSelectedItem) => {
      newSelectedItem = Object.keys(newSelectedItem)[0];
      oldSelectedItem = oldSelectedItem ? Object.keys(oldSelectedItem)[0] : '';

      let selectedItem = null;
      if (newSelectedItem != oldSelectedItem) {
        newSelectedItem = newSelectedItem.split('-');

        if (newSelectedItem.length == 2) {
          for (const company of itemList.value) {
            if (company.company_idx != parseInt(newSelectedItem[0])) {
              continue;
            }

            for (const item of company.item_list) {
              if (item.item_idx != parseInt(newSelectedItem[1])) {
                continue;
              }

              selectedItem = item;
              break;
            }
          }
        }
      }

      if (selectedItem) {
        store.commit('investHistory/setCurrentItemIdx', selectedItem.item_idx);
        store.commit('investHistory/setUpdateSummaryFlag', true);
        store.commit('investHistory/setUpdateInOutListFlag', true);
        store.commit('investHistory/setUpdateRevenueListFlag', true);
        store.commit('investHistory/setSelectedUnit', '');
        itemUsableUnitList.value = selectedItem.unit_set;
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
      treeItemList,
      treeSelectedVal,
      changeHistoryListMonth,
    }
  }
}
</script>

<style scoped>
.p-buttonset .label {
  display: inline-flex;
  padding: 0.75rem 1rem;
  font-weight: bold;
  margin-bottom: 1px;
}
</style>