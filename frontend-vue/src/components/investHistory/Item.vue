<template>
  <!-- item add form -->
  <form id="itemAddForm" @submit.prevent="formSubmit">
    <div class="w-full md:w-3">
      <div class="field w-full mt-5">
        <div class="relative">
          <Dropdown
              v-model="itemFormData.companyIdx"
              :options="companyList"
              :class="{'p-invalid': !itemFormData.validate.companyIdx}"
              optionLabel="company_name"
              optionValue="company_idx"
              class="w-full"
              placeholder="기업선택"
          ></Dropdown>
          <label
              class="normal-label"
              :class="{'p-error': !itemFormData.validate.companyIdx}"
          >기업</label>
        </div>
        <small
            v-if="!itemFormData.validate.companyIdx"
            :class="{'p-error': !itemFormData.validate.companyIdx}"
        >{{itemFormData.validateMsg.companyIdx}}</small>
      </div>

      <div class="field w-full mt-5">
        <div class="relative">
          <SelectButton
              v-model="itemFormData.itemType"
              :options="itemTypeList"
              :class="{'p-invalid': !itemFormData.validate.itemType}"
              optionLabel="text"
              optionValue="type"
          ></SelectButton>
          <label
              class="normal-label"
              :class="{'p-error': !itemFormData.validate.itemType}"
          >상품타입</label>
        </div>
        <small
            v-if="!itemFormData.validate.itemType"
            :class="{'p-error': !itemFormData.validate.itemType}"
        >{{itemFormData.validateMsg.itemType}}</small>
      </div>

      <div class="field w-full mt-5">
        <div class="relative">
          <InputText
              v-model="itemFormData.itemName"
              class="w-full"
              :class="{'p-invalid': !itemFormData.validate.itemName}"
              maxlength="50"
          ></InputText>
          <label
              class="normal-label"
              :class="{'p-error': !itemFormData.validate.itemName}"
          >상품명</label>
        </div>
        <small
            v-if="!itemFormData.validate.itemName"
            :class="{'p-error': !itemFormData.validate.itemName}"
        >{{itemFormData.validateMsg.itemName}}</small>
      </div>

      <div class="field w-full mt-5">
        <div class="relative flex flex-wrap relative">
          <div v-for="unit in unitList" class="field-checkbox">
            <label
                :class="{'p-error': !itemFormData.validate.units}"
            >
              <Checkbox
                  v-model="itemFormData.units"
                  :value="unit.unit_idx"
                  name="unit"
                  :class="{'p-invalid': !itemFormData.validate.units}"
              ></Checkbox>
              {{unit.unit}}
            </label>
          </div>
          <label
              class="normal-label"
              :class="{'p-error': !itemFormData.validate.units}"
          >단위</label>
        </div>
        <small
            v-if="!itemFormData.validate.units"
            :class="{'p-error': !itemFormData.validate.units}"
        >{{itemFormData.validateMsg.units}}</small>
      </div>

      <div class="field w-full mt-5">
        <Button type="submit" :label="btnFormSubmitLabel" class="w-full md:w-6"></Button>
      </div>
    </div>
  </form>
  <!-- //item add form -->

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
        <Column header="기업명" class="text-center"></Column>
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
        header="기업명"
        field="company_name"
        class="text-center"
    >
      <template #editor="{data, field}">
        <Dropdown
            v-model="data.company_idx"
            :options="companyList"
            optionLabel="company_name"
            optionValue="company_idx"
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
        {{printUnitText(data.unit_set)}}
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
import {onBeforeMount, reactive, ref} from "vue";

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
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';

import {useConfirm} from 'primevue/useconfirm';
import {useToast} from 'primevue/usetoast';

import {
  getItemList as requestItemList,
  getCompanyList as requestCompanyList,
  getUnitList as requestUnitList,
  getItemTypeList as requestItemTypeList,
  addItem as requestAddItem,
  editItem as requestEditItem,
  delItem as requestDelItem,
} from '@/modules/investHistory';

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
    ConfirmDialog,
    Toast,
  },
  setup() {
    //set vars: confirm dialog
    const confirm = useConfirm();
    const toast = useToast();

    //set vars: 필요 변수
    const companyList = ref([]);
    const itemTypeList = ref([]);
    const unitList = ref([]);
    const itemList = ref([]);
    const itemFormData = reactive({
      itemIdx: '',
      companyIdx: '',
      itemType: '',
      itemName: '',
      units: [],
      validate: {
        companyIdx: true,
        itemType: true,
        itemName: true,
        units: true,
      },
      validateMsg: {
        companyIdx: '',
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
        companyList.value = await requestCompanyList();

        itemTypeList.value = await requestItemTypeList();

        unitList.value = await requestUnitList();

        await getItemList();
      } catch (err) {
      }
    });

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
     * reset form
     */
    const resetForm = () => {
      for (let key of Object.keys(itemFormData)) {
        if (key == 'units') {
          itemFormData[key] = [];
        } else if (['validate', 'validateMsg'].includes(key)) {
          for (let key2 of Object.keys(itemFormData[key])) {
            if (key == 'validate') {
              itemFormData[key][key2] = true;
            } else {
              itemFormData[key][key2] = '';
            }
          }
        } else {
          itemFormData[key] = '';
        }
      }

      btnFormSubmitLabel.value = '등록';
    }

    /**
     * get item list
     * @return {Promise<void>}
     */
    const getItemList = async () => {
      try {
        itemList.value = await requestItemList();
        for (const item of itemList.value) {
          item.unit_idx_list = [];
          for (const unit of item.unit_set) {
            item.unit_idx_list.push(unit.unit_idx);
          }
        }
      } catch (err) {
        itemList.value = [];
      }
    };

    /**
     * form validate 설정
     * @param {string} key
     * @param {boolean} value
     * @param {string} [msg]
     */
    const setFormValidate = (key, value, msg = '') => {
      itemFormData.validate[key] = value;
      itemFormData.validateMsg[key] = msg;
    }

    /**
     * add item
     * @returns {Promise<boolean>}
     */
    const formSubmit = async () => {
      let validateFlag = true;

      if (!itemFormData.companyIdx) {
        setFormValidate('companyIdx', false, '기업을 선택해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('companyIdx', true);
      }
      if (!itemFormData.itemType) {
        setFormValidate('itemType', false, '상품타입을 선택해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('itemType', true);
      }
      if (!itemFormData.itemName) {
        setFormValidate('itemName', false, '상품명을 입력해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('itemName', true);
      }
      if (!itemFormData.units.length) {
        setFormValidate('units', false, '단위를 선택해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('units', true);
      }

      if (!validateFlag) return false;

      try {
        await requestAddItem({
          company_idx: itemFormData.companyIdx,
          item_name: itemFormData.itemName,
          item_type: itemFormData.itemType,
          units: itemFormData.units
        });

        toast.add({
          severity: 'success',
          summary: itemFormData.itemIdx > 0 ? '수정 완료' : '추가 완료',
          life: 3000,
        });

        await getItemList();

        resetForm();
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: itemFormData.itemIdx > 0 ? '수정 실패' : '추가 실패',
          detail: err,
          life: 3000,
        });
      }
    }

    /**
     * edit item
     * @param event
     * @returns {Promise<boolean>}
     */
    const editItem = async (event) => {
      let {data, newData, field} = event;

      let requestBody = {
        item_idx: data.item_idx,
      };

      try {
        switch (field) {
          //기업
          case 'company_name':
            if (data.company_idx == newData.company_idx) {
              return false;
            }

            for (const company of companyList.value) {
              if (company.company_idx == newData.company_idx) {
                data.company_idx = company.company_idx;
                data.company_name = company.company_name;
              }
            }
            requestBody['company_idx'] = newData.company_idx;
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

        if (Object.keys(requestBody).length > 1) {
          await requestEditItem(requestBody);
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
            await requestDelItem(itemIdx);

            await getItemList();

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
      companyList,
      itemTypeList,
      unitList,
      itemList,
      btnFormSubmitLabel,
      itemFormData,
      formSubmit,
      editItem,
      delItem,
      printUnitText,
    }
  }
}
</script>

<style scoped>
.p-error {
  color: #e24c4c !important;
}
.normal-label {
  position: absolute;
  margin-top:-0.7rem;
  left:0.75rem;
  top:-0.75rem;
  font-size: 12px;
  color: #6c757d;
}
.field-checkbox {
  margin-bottom: 0.5rem;
}
.field-checkbox label {
  margin:0 0.5rem;
  line-height: 1.7;
}
.p-selectbutton {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap:0.4rem;
  column-gap: 0.4rem;
}
.p-selectbutton :deep(.p-button) {
  margin:0;
  border-radius: 6px !important;
  border-right: 1px solid #ced4da !important;
}
.p-selectbutton :deep(.p-button:first-of-type) {
  margin-left:0;
}
.p-selectbutton.p-invalid > :deep(.p-button) {
  border-color: #e24c4c !important;
}


.p-datatable :deep(th .p-column-title) {
  display: block;
  width: 100%;
  text-align: center;
}
.p-datatable :deep(td.p-cell-editing) {
  padding-top: 0;
  padding-bottom: 0;
}

@media screen and (max-width: 960px) {
  .p-datatable :deep(td.p-cell-editing) {
    padding-top: 0.2rem;
    padding-bottom:0.2rem;
  }
}
</style>