<template>
  <TreeSelect
      v-model="treeSelectedVal"
      :options="treeItemList"
      selectionMode="single"
      placeholder="상품선택"
      class="mt-3 min-w-full md:min-w-min md:w-4"
  >
    <template #value="{value: item, placeholder}">
      {{item.length ? item[0].selected_label : placeholder}}
    </template>
  </TreeSelect>

  <div class="field w-full md:w-2 mt-3">
    <Button type="button" @click="toggleFormOverlay($event, 'toggle')" label="기록 추가" icon="pi pi-plus-circle" class="w-full"></Button>
  </div>

  <Dialog
      v-if="isMobile"
      header="기록 추가"
      position="center"
      v-model:visible="formOverlayVisible"
      :dismissableMask="true"
      :closeOnEscape="true"
      :modal="true"
      :closable="true"
      :breakpoints="{'960px': '75vw', '640px': '95vw'}"
  >
    <HistoryAddForm
        :usable-unit-list="itemUsableUnitList"
    ></HistoryAddForm>
  </Dialog>
  <OverlayPanel
      v-else
      ref="htmlFormOverlay"
      :dismissable="true"
      :showCloseIcon="true"
      :breakpoints="{'960px': '75vw', '640px': '90vw'}"
      class="w-4"
      @hide="toggleFormOverlay($event, 'hide')"
  >
    <HistoryAddForm
        :usable-unit-list="itemUsableUnitList"
    ></HistoryAddForm>
  </OverlayPanel>

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
import {computed, onBeforeMount, reactive, ref, watch} from "vue";
import {useStore} from 'vuex';

import dayjs from 'dayjs';

import HistoryAddForm from '@/components/investHistory/HistoryAddForm.vue';
import HistoryItemSummary from '@/components/investHistory/HistoryItemSummary.vue';
import HistoryInOutList from '@/components/investHistory/HistoryInOutList.vue';
import HistoryRevenueList from '@/components/investHistory/HistoryRevenueList.vue';

import TreeSelect from 'primevue/treeselect';
import Button from 'primevue/button';
import OverlayPanel from "primevue/overlaypanel";
import Dialog from "primevue/dialog";

import {useInvestApi} from '@/apis/investHistory';

export default {
  components: {
    HistoryAddForm,
    HistoryItemSummary,
    HistoryInOutList,
    HistoryRevenueList,
    TreeSelect,
    Button,
    OverlayPanel,
    Dialog,
  },
  setup() {
    //set vars: vuex
    const store = useStore();
    const isMobile = computed(() => store.getters['isMobile']);

    //set vars: api module
    const investApi = useInvestApi();

    //set vars: 필요 변수
    const itemUsableUnitList = ref([]);
    const thisMonth = reactive({value: dayjs()});
    const groupList = ref([]);
    const treeItemList = ref([]);
    const treeSelectedVal = ref();
    const htmlFormOverlay = ref();
    const formOverlayVisible = ref(false);

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      try {
        groupList.value = await investApi.getGroupList();
        for (const group of groupList.value) {
          const _tmp = {
            key: group.group_idx,
            label: group.group_name,
            selectable: false,
            children: []
          };

          for (const item of group.item_list) {
            _tmp.children.push({
              key: `${group.group_idx}-${item.item_idx}`,
              label: item.item_name,
              selected_label: `${group.group_name} - ${item.item_name}`
            })
          }

          treeItemList.value.push(_tmp);
        }
      } catch (err) {
        groupList.value = [];
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
          for (const group of groupList.value) {
            if (group.group_idx != parseInt(newSelectedItem[0])) {
              continue;
            }

            for (const item of group.item_list) {
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
        itemUsableUnitList.value = selectedItem.unit_list;
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

    /**
     * toggle add item form overlay
     * @param $event
     * @param {string} eventType
     */
    const toggleFormOverlay = ($event, eventType) => {
      if (eventType == 'toggle') {
        if (!isMobile.value) {
          if (formOverlayVisible.value) {
            htmlFormOverlay.value.hide($event);
          } else {
            htmlFormOverlay.value.show($event);
          }
        }
        formOverlayVisible.value = !formOverlayVisible.value;
      } else if (eventType == 'show') {
        htmlFormOverlay.value.show($event);
        formOverlayVisible.value = true;
      } else if (eventType == 'hide') {
        htmlFormOverlay.value.hide($event);
        formOverlayVisible.value = false;
      }
    }

    return {
      isMobile,
      itemUsableUnitList,
      thisMonth,
      treeItemList,
      treeSelectedVal,
      formOverlayVisible,
      htmlFormOverlay,
      changeHistoryListMonth,
      toggleFormOverlay,
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