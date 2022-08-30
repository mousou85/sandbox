<template>
  <form id="itemAddForm" @submit.prevent="formSubmit">
    <div class="field mt-5">
      <div class="p-normal-label">
        <Dropdown
            v-model="formData.groupIdx"
            :options="groupList"
            :class="{'p-invalid': !formData.validate.groupIdx}"
            optionLabel="group_name"
            optionValue="group_idx"
            class="w-full"
            placeholder="그룹선택"
        ></Dropdown>
        <label :class="{'p-error': !formData.validate.groupIdx}">그룹</label>
      </div>
      <small v-if="!formData.validate.groupIdx" class="p-error">{{formData.validateMsg.groupIdx}}</small>
    </div>

    <div class="field mt-5">
      <div class="p-normal-label">
        <SelectButton
            v-model="formData.itemType"
            :options="itemTypeList"
            class="grid col-4"
            :class="{'p-invalid': !formData.validate.itemType}"
            optionLabel="text"
            optionValue="type"
        ></SelectButton>
        <label :class="{'p-error': !formData.validate.itemType}">상품타입</label>
      </div>
      <small v-if="!formData.validate.itemType" class="p-error">{{formData.validateMsg.itemType}}</small>
    </div>

    <div class="field mt-5">
      <div class="p-normal-label">
        <InputText
            v-model="formData.itemName"
            class="w-full"
            :class="{'p-invalid': !formData.validate.itemName}"
            maxlength="50"
        ></InputText>
        <label :class="{'p-error': !formData.validate.itemName}">상품명</label>
      </div>
      <small v-if="!formData.validate.itemName" class="p-error">{{formData.validateMsg.itemName}}</small>
    </div>

    <div class="field mt-5">
      <div class="p-normal-label flex flex-wrap">
        <div v-for="unit in unitList" class="field-checkbox mr-3 mb-3">
          <Checkbox
              :id="'unit_idx_' + unit.unit_idx"
              v-model="formData.units"
              :value="unit.unit_idx"
              name="unit"
              :class="{'p-invalid': !formData.validate.units}"
          ></Checkbox>
          <label :for="'unit_idx_' + unit.unit_idx" :class="{'p-error': !formData.validate.units}">{{unit.unit}}</label>
        </div>
        <label :class="{'p-error': !formData.validate.units}">단위</label>
      </div>
      <small v-if="!formData.validate.units" class="p-error">{{formData.validateMsg.units}}</small>
    </div>

    <div class="field mt-0 mb-0">
      <Button type="submit" class="w-full" label="등록" icon="pi pi-check" ></Button>
    </div>
  </form>
</template>

<script>
import {reactive} from "vue";
import {useStore} from "vuex";

import Dropdown from "primevue/dropdown";
import SelectButton from "primevue/selectbutton";
import InputText from "primevue/inputtext";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import {useToast} from "primevue/usetoast";

import {useInvestApi} from '@/apis/investHistory';

export default {
  components: {
    Dropdown,
    SelectButton,
    InputText,
    Checkbox,
    Button,
  },
  props: {
    groupList: {
      required: true,
      default: () => [],
    },
    itemTypeList: {
      required: true,
      default: () => [],
    },
    unitList: {
      required: true,
      default: () => [],
    }
  },
  setup(props, context) {
    //set vars: vuex, toast
    const store = useStore();
    const toast = useToast();

    //set vars: api module
    const investApi = useInvestApi();

    //set vars: form model
    const formData = reactive({
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

    /**
     * form validate 설정
     * @param {string} key
     * @param {boolean} value
     * @param {string} [msg]
     */
    const setFormValidate = (key, value, msg = '') => {
      formData.validate[key] = value;
      formData.validateMsg[key] = msg;
    }

    /**
     * add item
     * @returns {Promise<boolean>}
     */
    const formSubmit = async () => {
      let validateFlag = true;

      if (!formData.groupIdx) {
        setFormValidate('groupIdx', false, '그룹을 선택해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('groupIdx', true);
      }
      if (!formData.itemType) {
        setFormValidate('itemType', false, '상품타입을 선택해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('itemType', true);
      }
      if (!formData.itemName) {
        setFormValidate('itemName', false, '상품명을 입력해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('itemName', true);
      }
      if (!formData.units.length) {
        setFormValidate('units', false, '단위를 선택해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('units', true);
      }

      if (!validateFlag) return false;

      try {
        const itemIdx = await investApi.addItem({
          group_idx: formData.groupIdx,
          item_name: formData.itemName,
          item_type: formData.itemType
        });

        await investApi.addItemUnit(itemIdx, formData.units);

        toast.add({
          severity: 'success',
          summary: '추가 완료',
          life: 3000,
        });


        store.commit('investHistory/setUpdateItemListFlag', true);

        resetForm();
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
     * reset form
     */
    const resetForm = () => {
      for (let key of Object.keys(formData)) {
        if (key == 'units') {
          formData[key] = [];
        } else if (['validate', 'validateMsg'].includes(key)) {
          for (let key2 of Object.keys(formData[key])) {
            if (key == 'validate') {
              formData[key][key2] = true;
            } else {
              formData[key][key2] = '';
            }
          }
        } else {
          formData[key] = '';
        }
      }
    }

    return {
      formData,
      formSubmit,
    }
  }
}
</script>

<style scoped>

</style>