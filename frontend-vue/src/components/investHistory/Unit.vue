<template>
  <form @submit.prevent="addUnit">
    <div class="w-full md:w-3">
      <div class="field w-full mt-5">
        <div class="p-normal-label">
          <InputText
              v-model="addForm.unit"
              class="w-full"
              :class="{'p-invalid': !addForm.validate.unit}"
              maxlength="10"
          ></InputText>
          <label :class="{'p-error': !addForm.validate.unit}">단위</label>
        </div>
        <small
            v-if="!addForm.validate.unit"
            :class="{'p-error': !addForm.validate.unit}"
        >{{addForm.validateMsg.unit}}</small>
      </div>

      <div class="field w-full mt-5">
        <div class="p-normal-label">
          <SelectButton
              v-model="addForm.unitType"
              :options="unitTypeList"
              :class="{'p-invalid': !addForm.validate.unitType}"
              optionLabel="label"
              optionValue="value"
          ></SelectButton>
          <label :class="{'p-error': !addForm.validate.unitType}">타입</label>
        </div>
        <small
            v-if="!addForm.validate.unitType"
            :class="{'p-error': !addForm.validate.unitType}"
        >{{addForm.validateMsg.unitType}}</small>
      </div>

      <div class="field w-full mt-5">
        <Button type="submit" label="등록" class="w-full md:w-6"></Button>
      </div>
    </div>
  </form>

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
import {onBeforeMount, reactive, ref} from "vue";

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
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";

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
    ConfirmDialog,
    Toast,
  },
  setup() {
    //set vars: confirm dialog
    const confirm = useConfirm();
    const toast = useToast();

    //set vars: api module
    const investApi = useInvestApi();

    //set vars: 필요 변수
    const unitTypeList = ref([
      {label: 'INT', value: 'int'},
      {label: 'FLOAT', value: 'float'},
    ]);
    const unitList = ref([]);
    const addForm = reactive({
      unit: '',
      unitType: '',
      validate: {
        unit: true,
        unitType: true,
      },
      validateMsg: {
        unit: '',
        unitType: ''
      }
    });

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
     * add unit
     * @return {Promise<boolean>}
     */
    const addUnit = async () => {
      let validateFlag = true;

      if (!addForm.unit) {
        setFormValidate('unit', false, '단위를 입력해주세요');
        validateFlag = false;
      } else {
        setFormValidate('unit', true);
      }
      if (!addForm.unitType) {
        setFormValidate('unitType', false, '타입을 선택해주세요');
        validateFlag = false;
      } else {
        setFormValidate('unitType', true);
      }

      if (!validateFlag) return false;

      try {
        await investApi.addUnit(addForm.unit, addForm.unitType);

        addForm.unit = '';
        addForm.unitType = '';

        toast.add({
          severity: 'success',
          summary: '추가 완료',
          life: 3000,
        });

        await getUnitList();
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: '추가 실패',
          detail: err,
          life: 3000,
        });
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

    /**
     * form validate 설정
     * @param {string} key
     * @param {boolean} value
     * @param {string} [msg]
     */
    const setFormValidate = (key, value, msg = '') => {
      addForm.validate[key] = value;
      addForm.validateMsg[key] = msg;
    }

    return {
      unitTypeList,
      unitList,
      addForm,
      addUnit,
      editUnit,
      delUnit,
    }
  }
}
</script>