<template>
  <form id="addForm" @submit.prevent="submitAddHistory">
    <input type="hidden" name="item_idx" :value="currentItemIdx">

    <div class="field mt-5" v-if="usableUnitList.length > 0">
      <div class="p-normal-label formgroup-inline">
        <div class="field-radiobutton mb-3 md:mb-0" v-for="unit in usableUnitList" :key="unit.unit_idx">
          <RadioButton
              v-bind:id="'unitIdx' + unit.unit_idx"
              name="unit_idx"
              :value="unit.unit_idx"
              v-model="formData.unitIdx"
              @change="changeUnit(unit)"
              :class="{'p-invalid': !formData.validate.unitIdx}"
          ></RadioButton>
          <label :for="'unitIdx' + unit.unit_idx" :class="{'p-error': !formData.validate.unitIdx}">{{ unit.unit }}</label>
        </div>
        <label :class="{'p-error': !formData.validate.unitIdx}">단위</label>
      </div>
      <small
          v-if="!formData.validate.unitIdx"
          :class="{'p-error': !formData.validate.unitIdx}"
      >{{formData.validateMsg.unitIdx}}</small>
    </div>

    <div class="field mt-5">
      <div class="p-normal-label">
        <Calendar
            id="addFormHistoryDate"
            name="history_date"
            v-model="formData.historyDate"
            selectionMode="single"
            :showIcon="true"
            class="min-w-full md:min-w-min"
            @date-select="selectCalendar"
            :class="{'p-invalid': !formData.validate.historyDate}"
            :touchUI="isMobile"
        >
        </Calendar>
        <label for="addFormHistoryDate" :class="{'p-error': !formData.validate.historyDate}">일자</label>
      </div>
      <small
          v-if="!formData.validate.historyDate"
          :class="{'p-error': !formData.validate.historyDate}"
      >{{formData.validateMsg.historyDate}}</small>
    </div>

    <div class="field mt-5">
      <div class="p-normal-label w-full md:w-10">
        <SelectButton
            id="addFormHistoryType"
            v-model="selectedHistoryType"
            :options="historyTypes"
            optionLabel="name"
            class="grid col-2"
            :class="{'p-invalid': !formData.validate.historyType}"
        >
          <template #option="item">
            <i v-if="item.option.icon" :class="item.option.icon"></i>
            <span class="p-button-label">{{item.option.name}}</span>
          </template>
        </SelectButton>
        <label for="addFormHistoryType" :class="{'p-error': !formData.validate.historyType}">기록 타입</label>
      </div>
      <small
          v-if="!formData.validate.historyType"
          :class="{'p-error': !formData.validate.historyType}"
      >{{formData.validateMsg.historyType}}</small>
    </div>

    <div class="field mt-5" v-if="formData.historyType == 'inout'">
      <div class="p-normal-label formgroup-inline">
        <div class="field-radiobutton mb-0">
          <RadioButton
              id="inoutTypePrincipal"
              name="inout_type"
              value="principal"
              v-model="formData.inoutType"
              :class="{'p-invalid': !formData.validate.inoutType}"
          ></RadioButton>
          <label for="inoutTypePrincipal">원금</label>
        </div>
        <div class="field-radiobutton mb-0">
          <RadioButton
              id="inoutTypeProceeds"
              name="inout_type"
              value="proceeds"
              v-model="formData.inoutType"
              :class="{'p-invalid': !formData.validate.inoutType}"
          ></RadioButton>
          <label for="inoutTypeProceeds">수익금재투자</label>
        </div>
        <label :class="{'p-error': !formData.validate.inoutType}">유입/유출 타입</label>
      </div>
      <small
          v-if="!formData.validate.inoutType"
          :class="{'p-error': !formData.validate.inoutType}"
      >{{formData.validateMsg.inoutType}}</small>
    </div>

    <div class="field mt-5" v-if="formData.historyType == 'revenue'">
      <div class="p-normal-label formgroup-inline">
        <div class="field-radiobutton mb-0">
          <RadioButton
              id="revenueTypeInterest"
              name="revenue_type"
              value="interest"
              v-model="formData.revenueType"
              :class="{'p-invalid': !formData.validate.revenueType}"
          ></RadioButton>
          <label for="revenueTypeInterest">이자</label>
        </div>
        <div class="field-radiobutton mb-0">
          <RadioButton
              id="revenueTypeEval"
              name="revenue_type"
              value="eval"
              v-model="formData.revenueType"
              :class="{'p-invalid': !formData.validate.revenueType}"
          ></RadioButton>
          <label for="revenueTypeEval">평가금액</label>
        </div>
        <label :class="{'p-error': !formData.validate.inoutType}">평가 타입</label>
      </div>
      <small
          v-if="!formData.validate.revenueType"
          :class="{'p-error': !formData.validate.revenueType}"
      >{{formData.validateMsg.revenueType}}</small>
    </div>

    <div class="field mt-5">
      <div class="p-normal-label">
        <InputNumber
            id="addFormInputVal"
            name="val"
            v-model="formData.val"
            mode="decimal"
            :format="true"
            :suffix="` ${selectedUnit.unit != '' ? selectedUnit.unit : 'KRW'}`"
            :minFractionDigits="selectedUnit.minPrecision"
            :maxFractionDigits="selectedUnit.maxPrecision"
            inputClass="text-right"
            class="w-full md:w-6"
            :class="{'p-invalid': !formData.validate.val}"
        ></InputNumber>
        <label for="addFormInputVal" :class="{'p-error': !formData.validate.val}">금액</label>
      </div>
      <small
          v-if="!formData.validate.val"
          :class="{'p-error': !formData.validate.val}"
      >{{formData.validateMsg.val}}</small>
    </div>

    <div class="field mt-5">
      <div class="p-normal-label">
        <Textarea
            id="addFormMemo"
            name="memo"
            v-model="formData.memo"
            :autoResize="true"
            rows="4"
            cols="40"
            class="w-full"
        ></Textarea>
        <label for="addFormMemo">메모</label>
      </div>
    </div>

    <div class="field mt-0 mb-0">
      <Button type="submit" label="등록" icon="pi pi-check" class="w-full"></Button>
    </div>
  </form>

  <Toast
      :breakpoints="{'960px': {width: '100%', right: '0', left: '0'}}"
  ></Toast>
</template>

<script>
import {reactive, ref, computed, watch} from "vue";
import {useStore} from 'vuex';

import RadioButton from 'primevue/radiobutton';
import Calendar from 'primevue/calendar';
import SelectButton from 'primevue/selectbutton';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Toast from "primevue/toast";
import {useToast} from "primevue/usetoast";

import dayjs from "dayjs";

import {useInvestApi} from '@/apis/investHistory';

export default  {
  components: {
    RadioButton,
    Calendar,
    SelectButton,
    InputNumber,
    Textarea,
    Button,
    Toast,
  },
  props: [
      'usableUnitList'
  ],
  setup(props) {
    //set vars: vuex
    const store = useStore();
    const isMobile = computed(() => store.getters['isMobile']);

    //set vars: toast
    const toast = useToast();

    //set vars: api module
    const investApi = useInvestApi();

    //set vars: 현재 상품 IDX, 기록 타입 목록
    const currentItemIdx = computed(() => store.getters["investHistory/getCurrentItemIdx"]);
    const historyTypes = [
      {name: '유입/유출', icon: 'pi pi-sort-alt', value: 'inout'},
      {name: '평가', icon: 'pi pi-percentage', value: 'revenue'},
    ];

    //set vars: 현재 선택한 기록 타입, 현재 선택한 단위 정보
    const selectedHistoryType = ref();
    const selectedUnit = reactive({
      unit_idx: 0,
      unit: '',
      unit_type: '',
      minPrecision: computed(() => {
        return selectedUnit.unit_type == 'float' ? 1 : 0;
      }),
      maxPrecision: computed(() => {
        return selectedUnit.unit_type == 'float' ? 8 : 0;
      })
    });

    //set vars: form data
    const formData = reactive({
      unitIdx: 0,
      historyDate: '',
      historyType: '',
      inoutType: '',
      revenueType: '',
      val: 0.0,
      memo: '',
      validate: {
        unitIdx: true,
        historyDate: true,
        historyType: true,
        inoutType: true,
        revenueType: true,
        val: true,
      },
      validateMsg: {
        unitIdx: '',
        historyDate: '',
        historyType: '',
        inoutType: '',
        revenueType: '',
        val: '',
      }
    });

    /*
    watch variables
     */
    watch(selectedHistoryType, (newSelectedHistoryType) => {
      formData.historyType = newSelectedHistoryType.value;
    });

    /**
     * 히스토리 추가
     * @return {Promise<boolean>}
     */
    const submitAddHistory = async () => {
      let validateFlag = true;

      if (currentItemIdx.value == 0) {
        toast.add({
          severity: 'error',
          summary: '상품을 선택해주세요.',
          life: 3000,
        });
        validateFlag = false;
      }
      if (!formData.unitIdx) {
        setFormValidate('unitIdx', false, '단위를 선택해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('unitIdx', true);
      }
      if (!formData.historyDate) {
        setFormValidate('historyDate', false, '날짜를 선택해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('historyDate', true);
      }
      if (!formData.historyType) {
        setFormValidate('historyType', false, '기록 타입을 선택해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('historyType', true);
      }
      if (formData.historyType == 'inout') {
        if (!formData.inoutType) {
          setFormValidate('inoutType', false, '유입/유출 타입을 선택해주세요.');
          validateFlag = false;
        } else {
          setFormValidate('inoutType', true);
        }
      } else if(formData.historyType == 'revenue') {
        if (!formData.revenueType) {
          setFormValidate('revenueType', false, '평가 타입을 선택해주세요.');
          validateFlag = false;
        } else {
          setFormValidate('revenueType', true);
        }
      }
      if (!formData.val) {
        setFormValidate('val', false, '금액을 입력해주세요.');
        validateFlag = false;
      } else {
        setFormValidate('val', true);
      }

      if (!validateFlag) return false;

      try {
        await investApi.addHistory(currentItemIdx.value, {
          unit_idx: formData.unitIdx,
          history_type: formData.historyType,
          history_date: formData.historyDate,
          inout_type: formData.inoutType,
          revenue_type: formData.revenueType,
          val: formData.val,
          memo: formData.memo
        });

        formData.memo = '';

        store.commit('investHistory/setUpdateSummaryFlag', true);
        if (formData.historyType == 'inout') {
          store.commit('investHistory/setUpdateInOutListFlag', true);
        } else if (formData.historyType == 'revenue') {
          store.commit('investHistory/setUpdateRevenueListFlag', true);
        }

        toast.add({
          severity: 'success',
          summary: '추가 완료',
          life: 3000,
        });
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
     * 일자 선택 이벤트
     * @param {Date} value
     */
    const selectCalendar = (value) => {
      const date = dayjs(value);
      formData.historyDate = date.format('YYYY-MM-DD');
    }

    /**
     * 단위 선택 이벤트
     * @param unit
     */
    const changeUnit = (unit) => {
      selectedUnit.unit_idx = unit.unit_idx;
      selectedUnit.unit = unit.unit;
      selectedUnit.unit_type = unit.unit_type;
    }

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

    return {
      isMobile,
      currentItemIdx,
      selectedHistoryType,
      historyTypes,
      selectedUnit,
      formData,
      submitAddHistory,
      selectCalendar,
      changeUnit,
    }
  }
}
</script>

<style scoped>

</style>