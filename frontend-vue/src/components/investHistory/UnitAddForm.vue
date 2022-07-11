<template>
  <form @submit.prevent="addUnit">
    <div class="field mt-5">
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

    <div class="field mt-5">
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

    <div class="field mt-0 mb-0">
      <Button type="submit" label="등록" class="w-full" icon="pi pi-check" ></Button>
    </div>
  </form>

  <Toast
      :breakpoints="{'960px': {width: '100%', right: '0', left: '0'}}"
  ></Toast>
</template>

<script>
import {reactive} from 'vue';

import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import Button from "primevue/button";
import Toast from 'primevue/toast';
import {useToast} from "primevue/usetoast";

import {useInvestApi} from '@/apis/investHistory';

export default {
  props: [
    'unitTypeList',
  ],
  emits: [
    'getUnitList',
  ],
  components: {
    InputText,
    SelectButton,
    Button,
    Toast,
  },
  setup(props, {emit}) {
    //set vars: toast
    const toast = useToast();

    //set vars: api module
    const investApi = useInvestApi();

    //set vars: 필요 변수
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

        emit('getUnitList');
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
      addForm,
      addUnit,
    }
  }
}
</script>