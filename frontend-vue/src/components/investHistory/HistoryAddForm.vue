<template>
  <form id="addForm" @submit.prevent="submitAddHistory">
    <input type="hidden" name="item_idx" :value="currentItemIdx">

    <h3>기록 추가</h3>

    <div class="formgroup-inline mt-5">
      <div class="field-radiobutton" v-for="unit in usableUnitList" :key="unit.unit_idx">
        <RadioButton
            v-bind:id="'unitIdx' + unit.unit_idx"
            name="unit_idx"
            :value="unit.unit_idx"
            v-model="formData.unitIdx"
            @change="setInputValUnitText(unit.unit)"
        ></RadioButton>
        <label :for="'unitIdx' + unit.unit_idx">{{ unit.unit }}</label>
      </div>
    </div>

    <div class="field mt-3">
      <div class="p-float-label">
        <!--<input type="date" id="addFormHistoryDate" name="history_date" v-model="formData.historyDate">-->
        <Calendar
            v-model="formData.historyDate"
            selectionMode="single"
            dateFormat="yy-mm-dd"
            :showIcon="true"
            class="min-w-full md:min-w-min"
        ></Calendar>
        <label for="addFormHistoryDate">일자</label>
      </div>
    </div>

    <div class="field mt-3">
      <SelectButton
          v-model="selectedHistoryType"
          :options="historyTypes"
          optionLabel="name"
      >
        <template #option="item">
          <i v-if="item.option.icon" :class="item.option.icon"></i>
          <span class="p-button-label">{{item.option.name}}</span>
        </template>
      </SelectButton>
    </div>

    <div class="formgroup-inline mt-3" v-if="formData.historyType == 'inout'">
      <div class="field-radiobutton">
        <RadioButton
            id="inoutTypePrincipal"
            name="inout_type"
            value="principal"
            v-model="formData.inoutType"
        ></RadioButton>
        <label for="inoutTypePrincipal">원금</label>
      </div>
      <div class="field-radiobutton">
        <RadioButton
            id="inoutTypeProceeds"
            name="inout_type"
            value="proceeds"
            v-model="formData.inoutType"
        ></RadioButton>
        <label for="inoutTypeProceeds">수익금재투자</label>
      </div>
    </div>

    <div class="formgroup-inline mt-3" v-if="formData.historyType == 'revenue'">
      <div class="field-radiobutton">
        <RadioButton
            id="revenueTypeInterest"
            name="revenue_type"
            value="interest"
            v-model="formData.revenueType"
        ></RadioButton>
        <label for="revenueTypeInterest">이자</label>
      </div>
      <div class="field-radiobutton">
        <RadioButton
            id="revenueTypeEval"
            name="revenue_type"
            value="eval"
            v-model="formData.revenueType"
        ></RadioButton>
        <label for="revenueTypeEval">평가금액</label>
      </div>
    </div>

    <div class="row">
      <label for="addFormVal">금액</label>
      <input type="text" id="addFormVal" name="val" class="val" v-model="formData.valText"><span id="valUnitText"></span>
    </div>

    <div class="row">
      <label for="addFormMemo">메모</label>
      <textarea id="addFormMemo" name="memo" cols="50" rows="5" v-model="formData.memo"></textarea>
    </div>

    <button type="submit">추가</button>
  </form>
</template>

<script>
import {reactive, ref, computed, watch} from "vue";
import {useStore} from 'vuex';

import RadioButton from 'primevue/radiobutton';
import Calendar from 'primevue/calendar';
import SelectButton from 'primevue/selectbutton';

import {addHistory} from '@/modules/investHistory';
import {numberComma, numberUncomma} from "@/libs/helper";

export default  {
  components: {
    RadioButton,
    Calendar,
    SelectButton,
  },
  props: [
      'usableUnitList'
  ],
  setup() {
    //set vars: vuex
    const store = useStore();

    //set vars: 필요 변수
    const currentItemIdx = computed(() => store.getters["investHistory/getCurrentItemIdx"]);
    const selectedHistoryType = ref();

    const historyTypes = [
      {name: '유입/유출', icon: 'pi pi-sort-alt', value: 'inout'},
      {name: '평가', icon: 'pi pi-percentage', value: 'revenue'},
    ];

    //set vars: form data
    const formData = reactive({
      unitIdx: 0,
      historyDate: '',
      historyType: '',
      inoutType: '',
      revenueType: '',
      val: 0.0,
      memo: '',
      valText: computed({
        get: () => {
          return numberComma(formData.val);
        },
        set: (val) => {
          val = numberUncomma(val);
          formData.val = val;
        }
      })
    });

    /*
    watch variables
     */
    watch(selectedHistoryType, (newSelectedHistoryType) => {
      formData.historyType = newSelectedHistoryType.value;
    });

    /**
     * 히스토리 추가
     * @param $event
     * @return {Promise<boolean>}
     */
    const submitAddHistory = async ($event) => {
      const $form = $event.target;

      if (currentItemIdx.value == 0) {
        alert('상품 선택');
        return false;
      }
      if (!formData.unitIdx) {
        alert('단위 선택');
        $form.elements.unit_idx.focus();
        return false;
      }
      if (!formData.historyDate) {
        alert('날짜 선택');
        $form.elements.history_date.focus();
        return false;
      }
      if (!formData.historyType) {
        alert('기록 타입 선택');
        return false;
      }
      if (formData.historyType == 'inout') {
        if (!formData.inoutType) {
          alert('유입/유출 타입 선택');
          return false;
        }
      } else {
        if (!formData.revenueType) {
          alert('평가 타입 선택');
          return false;
        }
      }
      if (!formData.val) {
        alert('금액 입력');
        return false;
      }

      try {
        await addHistory({
          item_idx: currentItemIdx.value,
          unit_idx: formData.unitIdx,
          history_type: formData.historyType,
          history_date: formData.historyDate,
          inout_type: formData.inoutType,
          revenue_type: formData.revenueType,
          val: formData.val,
          memo: formData.memo
        });

        formData.valText = '';
        formData.memo = '';

        store.commit('investHistory/setUpdateSummaryFlag', true);
        if (formData.historyType == 'inout') {
          store.commit('investHistory/setUpdateInOutListFlag', true);
        } else if (formData.historyType == 'revenue') {
          store.commit('investHistory/setUpdateRevenueListFlag', true);
        }
      } catch (err) {
        alert(err);
        return false;
      }
    }

    /**
     * @param {string} unitText
     */
    const setInputValUnitText = (unitText) => {
      document.getElementById('valUnitText').innerText = unitText;
      store.commit('investHistory/setSelectedUnit', unitText);
    }

    return {
      currentItemIdx,
      selectedHistoryType,
      historyTypes,
      formData,
      submitAddHistory,
      setInputValUnitText,
    }
  }
}
</script>

<style scoped>
.p-selectbutton :deep(.p-button) {
  width: 10rem;
  margin:auto;
}
</style>