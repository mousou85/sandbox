<template>
  <template v-if="isMobile">
    <Dialog
        header="단위 추가"
        position="center"
        v-model:visible="formOverlayVisible"
        :dismissableMask="true"
        :closeOnEscape="true"
        :modal="true"
        :closable="true"
        :breakpoints="{'960px': '75vw', '640px': '95vw'}"
    >
      <UnitAddForm
          :unit-type-list="unitTypeList"
          @get-unit-list="getUnitList"
      ></UnitAddForm>
    </Dialog>
  </template>
  <template v-else>
    <OverlayPanel
        ref="htmlFormOverlay"
        :dismissable="true"
        :showCloseIcon="true"
        :breakpoints="{'960px': '75vw', '640px': '90vw'}"
        class="w-3"
        @hide="toggleFormOverlay($event, 'hide')"
    >
      <UnitAddForm
          :unit-type-list="unitTypeList"
          @get-unit-list="getUnitList"
      ></UnitAddForm>
    </OverlayPanel>
  </template>

  <div class="field w-full md:w-2 mt-5">
    <Button type="button" @click="toggleFormOverlay($event, 'toggle')" label="단위 추가" icon="pi pi-plus-circle" class="w-full"></Button>
  </div>

  <DataTable
      :value="unitList"
      editMode="cell"
      dataKey="unit_idx"
      class="w-full md:w-6"
      @cell-edit-complete="editUnit"
  >
    <ColumnGroup type="header">
      <Row>
        <Column header="IDX" class="text-center"></Column>
        <Column header="단위" class="text-center"></Column>
        <Column header="타입" class="text-center"></Column>
        <Column header="" class="text-center"></Column>
      </Row>
    </ColumnGroup>

    <Column
        header="IDX"
        field="unit_idx"
        class="text-center"
    ></Column>
    <Column
        header="단위"
        field="unit"
    >
      <template #editor="{data, field}">
        <InputText
            v-model="data.unit"
            maxlength="10"
        ></InputText>
      </template>
    </Column>
    <Column
        header="타입"
        field="unit_type"
        class="text-center"
    >
      <template #editor="{data, field}">
        <Dropdown
            v-model="data.unit_type"
            :options="unitTypeList"
            optionLabel="label"
            optionValue="value"
        ></Dropdown>
      </template>
    </Column>
    <Column
        header="삭제"
        class="text-center"
    >
      <template #body="{data}">
        <Button
            type="button"
            class="p-button-danger"
            @click="delUnit(data.unit_idx)"
        >
          <i class="pi pi-trash"></i>
        </Button>
      </template>
    </Column>
  </DataTable>

  <ConfirmDialog
      :breakpoints="{'960px': '75vw', '640px': '100vw'}"
  ></ConfirmDialog>
  <Toast
      :breakpoints="{'960px': {width: '100%', right: '0', left: '0'}}"
  ></Toast>
</template>

<script>
import {computed, onBeforeMount, ref} from "vue";
import {useStore} from "vuex";

import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import Button from "primevue/button";
import Dropdown from 'primevue/dropdown';
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import ColumnGroup from "primevue/columngroup";
import Row from "primevue/row";
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import OverlayPanel from 'primevue/overlaypanel';
import Dialog from 'primevue/dialog';
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";

import UnitAddForm from "@/components/investHistory/UnitAddForm.vue";

import {useInvestApi} from '@/apis/investHistory';

export default {
  components: {
    InputText,
    SelectButton,
    Button,
    Dropdown,
    DataTable,
    Column,
    ColumnGroup,
    Row,
    OverlayPanel,
    Dialog,
    ConfirmDialog,
    Toast,
    UnitAddForm,
  },
  setup() {
    //set vars: vuex
    const store = useStore();
    const isMobile = computed(() => store.getters['isMobile']);

    //set vars: confirm dialog
    const confirm = useConfirm();
    const toast = useToast();

    //set vars: api module
    const investApi = useInvestApi();

    //set vars: 필요 변수
    const htmlFormOverlay = ref();
    const formOverlayVisible = ref(false);
    const unitTypeList = ref([
      {label: 'INT', value: 'int'},
      {label: 'FLOAT', value: 'float'},
    ]);
    const unitList = ref([]);

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      await getUnitList();
    });

    /**
     * get all unit list
     * @returns {Promise<void>}
     */
    const getUnitList = async () => {
      try {
        unitList.value = await investApi.getUnitList();
      } catch (err) {
        unitList.value = [];
      }
    }

    /**
     * toggle add unit form overlay
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
     * edit unit
     * @return {Promise<boolean>}
     */
    const editUnit = async (event) => {
      let {data, newData, field} = event;

      try {
        switch (field) {
          case 'unit':
            if (data.unit == newData.unit) {
              return false;
            }
            if (data.unit.length == 0) {
              event.preventDefault();
              throw "단위를 입력해주세요.";
            }

            data.unit = newData.unit;
            break;
          case 'unit_type':
            if (data.unit_type == newData.unit_type) {
              return false;
            }

            data.unit_type = newData.unit_type;
            break;
        }

        await investApi.editUnit(data.unit_idx, data.unit, data.unit_type);

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
    }

    /**
     * delete unit
     * @param {number} unitIdx
     * @return {Promise<void>}
     */
    const delUnit = async (unitIdx) => {
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
            await investApi.delUnit(unitIdx);

            await getUnitList();

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
      unitTypeList,
      unitList,
      getUnitList,
      editUnit,
      delUnit,
      toggleFormOverlay,
    }
  }
}
</script>