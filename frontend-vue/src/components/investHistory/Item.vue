<template>
  <template v-if="isMobile">
    <Dialog
        header="상품 추가"
        position="center"
        v-model:visible="formOverlayVisible"
        :dismissableMask="true"
        :closeOnEscape="true"
        :modal="true"
        :closable="true"
        :breakpoints="{'960px': '75vw', '640px': '95vw'}"
    >
      <ItemAddForm
          :groupList="groupList"
          :itemTypeList="itemTypeList"
          :unitList="unitList"
      ></ItemAddForm>
    </Dialog>
  </template>
  <template v-else>
    <OverlayPanel
        ref="htmlFormOverlay"
        :dismissable="true"
        :showCloseIcon="true"
        :breakpoints="{'960px': '75vw', '640px': '90vw'}"
        class="w-4"
        @hide="toggleFormOverlay($event, 'hide')"
    >
      <ItemAddForm
          :groupList="groupList"
          :itemTypeList="itemTypeList"
          :unitList="unitList"
      ></ItemAddForm>
    </OverlayPanel>
  </template>

  <div class="field w-full md:w-2 mt-5">
    <Button type="button" @click="toggleFormOverlay($event, 'toggle')" label="상품 추가" icon="pi pi-plus-circle" class="w-full"></Button>
  </div>

  <!-- item list -->
  <DataTable
      :value="itemList"
      editMode="cell"
      dataKey="item_idx"
      @cell-edit-complete="editItem"
  >
    <ColumnGroup type="header">
      <Row>
        <Column header="IDX" class="text-center"></Column>
        <Column header="그룹" class="text-center"></Column>
        <Column header="상품명" class="text-center"></Column>
        <Column header="상품타입" class="text-center"></Column>
        <Column header="단위" class="text-center"></Column>
        <Column header="" class="text-center"></Column>
      </Row>
    </ColumnGroup>

    <Column
        header="IDX"
        field="item_idx"
        class="text-center"
    ></Column>
    <Column
        header="그룹"
        field="group_name"
        class="text-center"
    >
      <template #editor="{data, field}">
        <Dropdown
            v-model="data.group_idx"
            :options="groupList"
            optionLabel="group_name"
            optionValue="group_idx"
        ></Dropdown>
      </template>
    </Column>
    <Column
        header="상품명"
        field="item_name"
    >
      <template #editor="{data, field}">
        <InputText
            v-model="data.item_name"
            class="w-auto md:w-full"
            maxlength="50"
        ></InputText>
      </template>
    </Column>
    <Column
        header="상품타입"
        field="item_type_text"
        class="text-center"
    >
      <template #editor="{data, field}">
        <Dropdown
            v-model="data.item_type"
            :options="itemTypeList"
            optionLabel="text"
            optionValue="type"
        ></Dropdown>
      </template>
    </Column>
    <Column
        header="단위"
        field="unit_set"
    >
      <template #editor="{data, field}">
        <MultiSelect
            v-model="data.unit_idx_list"
            :options="unitList"
            optionLabel="unit"
            optionValue="unit_idx"
        ></MultiSelect>
      </template>
      <template #body="{data}">
        {{printUnitText(data.unit_list)}}
      </template>
    </Column>
    <Column
        header="삭제"
    >
      <template #body="{data}">
        <Button
            type="button"
            class="p-button-danger"
            @click="delItem(data.item_idx)"
        >
          <i class="pi pi-trash"></i>
        </Button>
      </template>
    </Column>
  </DataTable>
  <!-- //item list -->

  <ConfirmDialog
      :breakpoints="{'960px': '75vw', '640px': '100vw'}"
  ></ConfirmDialog>
  <Toast
      :breakpoints="{'960px': {width: '100%', right: '0', left: '0'}}"
  ></Toast>
</template>

<script>
import {onBeforeMount, reactive, ref, computed, watch} from "vue";
import {useStore} from "vuex";

import InputText from "primevue/inputtext";
import Dropdown from 'primevue/dropdown';
import SelectButton from "primevue/selectbutton";
import Checkbox from 'primevue/checkbox';
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import ColumnGroup from "primevue/columngroup";
import Row from "primevue/row";
import MultiSelect from 'primevue/multiselect';
import OverlayPanel from "primevue/overlaypanel";
import Dialog from "primevue/dialog";
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import {useConfirm} from 'primevue/useconfirm';
import {useToast} from 'primevue/usetoast';

import ItemAddForm from "@/components/investHistory/ItemAddForm.vue";

import {useInvestApi} from '@/apis/investHistory';

export default {
  components: {
    InputText,
    Dropdown,
    SelectButton,
    Checkbox,
    Button,
    DataTable,
    Column,
    ColumnGroup,
    Row,
    MultiSelect,
    OverlayPanel,
    Dialog,
    ConfirmDialog,
    Toast,
    ItemAddForm,
  },
  setup() {
    //set vars: vuex, dialog, toast
    const store = useStore();
    const isMobile = computed(() => store.getters['isMobile']);
    const confirm = useConfirm();
    const toast = useToast();

    //set vars: api module
    const investApi = useInvestApi();

    //set vars: 필요 변수
    const updateListFlag = computed(() => store.getters['investHistory/getUpdateItemListFlag']);
    const htmlFormOverlay = ref();
    const formOverlayVisible = ref(false);
    const groupList = ref([]);
    const itemTypeList = ref([]);
    const unitList = ref([]);
    const itemList = ref([]);
    const itemFormData = reactive({
      itemIdx: '',
      groupIdx: '',
      itemType: '',
      itemName: '',
      units: [],
      validate: {
        groupIdx: true,
        itemType: true,
        itemName: true,
        units: true,
      },
      validateMsg: {
        groupIdx: '',
        itemType: '',
        itemName: '',
        units: '',
      }
    });
    const btnFormSubmitLabel = ref('등록');

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      try {
        groupList.value = await investApi.getGroupList();

        itemTypeList.value = await investApi.getItemTypeList();

        unitList.value = await investApi.getUnitList();

        await getItemList();
      } catch (err) {
      }
    });

    /*
    watch variables
     */
    watch(updateListFlag, async (newUpdateListFlag, oldUpdateListFlag) => {
      if (newUpdateListFlag) {
        await getItemList();
      }
    });

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

    /**
     * print unit set list
     * @param {Object[]} unitSet
     * @returns {string}
     */
    const printUnitText = (unitSet) => {
      let list = [];
      for (const unit of unitSet) {
        list.push(unit.unit);
      }

      return list.join(',');
    }

    /**
     * get item list
     * @return {Promise<void>}
     */
    const getItemList = async () => {
      try {
        itemList.value = await investApi.getItemList();
        for (const item of itemList.value) {
          item.unit_idx_list = [];
          for (const unit of item.unit_list) {
            item.unit_idx_list.push(unit.unit_idx);
          }

          for (const group of groupList.value) {
            if (item.group_idx == group.group_idx) {
              item.group_name = group.group_name;
            }
          }
        }
      } catch (err) {
        itemList.value = [];
      } finally {
        store.commit('investHistory/setUpdateItemListFlag', false);
      }
    };

    /**
     * edit item
     * @param event
     * @returns {Promise<boolean>}
     */
    const editItem = async (event) => {
      let {data, newData, field} = event;

      const itemIdx = data.item_idx;
      let requestBody = {};

      try {
        switch (field) {
          //그룹
          case 'group_name':
            if (data.group_idx == newData.group_idx) {
              return false;
            }

            for (const group of groupList.value) {
              if (group.group_idx == newData.group_idx) {
                data.group_idx = group.group_idx;
                data.group_name = group.group_name;
              }
            }
            requestBody['group_idx'] = newData.group_idx;
            break;
          //상품명
          case 'item_name':
            if (data.item_name == newData.item_name) {
              return false;
            }
            if (newData.item_name.length == 0) {
              event.preventDefault();
              throw "상품명을 입력해주세요";
            }

            data.item_name = newData.item_name;
            requestBody['item_name'] = newData.item_name;
            break;
          //상품타입
          case 'item_type_text':
            if (data.item_type == newData.item_type) {
              return false;
            }

            for (const itemType of itemTypeList.value) {
              if (itemType.type == newData.item_type) {
                data.item_type = itemType.type;
                data.item_type_text = itemType.text;
              }
            }

            requestBody['item_type'] = newData.item_type;
            break;
          //단위
          case 'unit_set':
            if (newData.unit_idx_list.length == 0) {
              event.preventDefault();
              throw "단위를 선택해주세요";
            }

            const unitSetDiff = data.unit_idx_list.filter(v => !newData.unit_idx_list.includes(v))
                .concat(newData.unit_idx_list.filter(v => !data.unit_idx_list.includes(v)));
            if (unitSetDiff.length == 0) {
              return false;
            }

            data.unit_idx_list = newData.unit_idx_list;
            data.unit_set = [];
            for (const unit of unitList.value) {
              if (newData.unit_idx_list.includes(unit.unit_idx)) {
                data.unit_set.push(unit);
              }
            }

            requestBody['units'] = newData.unit_idx_list;
            break;
        }

        if (Object.keys(requestBody).length > 0) {
          await investApi.editItem(itemIdx, requestBody);
        }

        toast.add({
          severity: 'success',
          summary: '수정 완료',
          life: 3000,
        });
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: '수정 실패',
          detail: err,
          life: 3000,
        });
        return false;
      }
    };

    /**
     * delete item
     * @param {number} itemIdx
     * @returns {Promise<void>}
     */
    const delItem = async (itemIdx) => {
      confirm.require({
        message: '삭제 하시겠습니까?',
        header: '삭제 확인',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptIcon: 'pi pi-check',
        acceptLabel: '예',
        rejectClass: 'p-button-text p-button-plain',
        rejectLabel: '아니오',
        accept: async () => {
          try {
            await investApi.delItem(itemIdx);

            store.commit('investHistory/setUpdateItemListFlag', true);

            toast.add({
              severity: 'success',
              summary: '삭제 완료',
              life: 3000,
            });
          } catch (err) {
            toast.add({
              severity: 'error',
              summary: '삭제 실패',
              detail: err,
              life: 3000,
            });
          }
        },
        reject: () => {
        }
      });
    }

    return {
      isMobile,
      htmlFormOverlay,
      formOverlayVisible,
      groupList,
      itemTypeList,
      unitList,
      itemList,
      btnFormSubmitLabel,
      itemFormData,
      toggleFormOverlay,
      editItem,
      delItem,
      printUnitText,
    }
  }
}
</script>