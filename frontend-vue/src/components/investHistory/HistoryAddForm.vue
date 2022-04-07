<template>
  <form id="addForm" @submit.prevent="submitAddHistory">
    <input type="hidden" name="item_idx" :value="itemIdx">

    <fieldset>
      <legend>기록 추가</legend>

      <div class="row">
        <label>단위</label>
        <label class="short" v-for="unit in usableUnitList" :key="unit.unit_idx">
          <input type="radio" name="unit_idx" v-model="formData.unitIdx" :value="unit.unit_idx" @change="setInputValUnitText(unit.unit)">
          {{ unit.unit }}
        </label>
      </div>

      <div class="row">
        <label for="addFormHistoryDate">일자</label>
        <input type="date" id="addFormHistoryDate" name="history_date" v-model="formData.historyDate">
      </div>

      <div class="row">
        <label>기록 타입</label>
        <label class="short"><input type="radio" name="history_type" value="in" v-model="formData.historyType">유입</label>
        <label class="short"><input type="radio" name="history_type" value="out" v-model="formData.historyType">유출</label>
        <label class="short"><input type="radio" name="history_type" value="revenue" v-model="formData.historyType">평가</label>
      </div>

      <div class="row" v-if="['in', 'out'].includes(formData.historyType)">
        <label>유입/유출 타입</label>
        <label class="short"><input type="radio" name="inout_type" value="principal" v-model="formData.inoutType">원금</label>
        <label class="short"><input type="radio" name="inout_type" value="proceeds" v-model="formData.inoutType">수익금</label>
      </div>
      <div class="row" v-else-if="formData.historyType == 'revenue'">
        <label>평가 타입</label>
        <label class="short"><input type="radio" name="revenue_type" value="interest" v-model="formData.revenueType">이자</label>
        <label class="short"><input type="radio" name="revenue_type" value="eval" v-model="formData.revenueType">평가금액</label>
      </div>

      <div class="row">
        <label for="addFormVal">금액</label>
        <input type="text" id="addFormVal" name="val" class="val" v-model="formData.valText"><span id="valUnitText"></span>
      </div>

      <div class="row">
        <label for="addFormMemo">메모</label>
        <textarea id="addFormMemo" name="memo" cols="50" rows="5" v-model="formData.memo"></textarea>
      </div>
    </fieldset>

    <button type="submit">추가</button>
  </form>
</template>

<script>
import {watch, reactive, computed} from "vue";
import {addHistory} from '../../modules/investHistory';
import {numberComma, numberUncomma} from "../../libs/helper";

export default  {
  props: [
      'itemIdx',
      'usableUnitList'
  ],
  setup(props) {
    //set vars: form data
    const formData = reactive({
      itemIdx: props.itemIdx,
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

    /**
     * 히스토리 추가
     * @param $event
     * @return {Promise<boolean>}
     */
    const submitAddHistory = async ($event) => {
      const $form = $event.target;

      if (formData.itemIdx == '' || formData.itemIdx == 0) {
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
      if (['in', 'out'].includes(formData.historyType)) {
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
          item_idx: formData.itemIdx,
          unit_idx: formData.unitIdx,
          history_type: formData.historyType,
          history_date: formData.historyDate,
          inout_type: formData.inoutType,
          revenue_type: formData.revenueType,
          val: formData.val,
          memo: formData.memo
        });

        // if (['in', 'out'].includes(formData.history_type)) {
        //   for (const unit of unitList.value) {
        //     if (formData.unit_idx == unit.unit_idx) {
        //       selectedTab.inout = unit.unit;
        //     }
        //   }
        //   inoutList.value = await getHistoryList(formData.item_idx, 'inout', selectedTab.inout, thisMonth.value.format('YYYY-MM-DD'));
        // } else if (formData.history_type == 'revenue') {
        //   for (const unit of unitList.value) {
        //     if (formData.unit_idx == unit.unit_idx) {
        //       selectedTab.revenue = unit.unit;
        //     }
        //   }
        //   revenueList.value = await getHistoryList(formData.item_idx, 'revenue', selectedTab.revenue, thisMonth.value.format('YYYY-MM-DD'));
        // }

        formData.valText = '';
        formData.memo = '';

        // document.getElementById('valUnit').innerText = '';

        // await getSummaryData(formData.item_idx);
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
    }

    /**
     * watch vars
     */
    watch(() => props.itemIdx, (newValue, oldValue) => {
      if (newValue != oldValue) {
        formData.itemIdx = newValue;
        formData.unitIdx = 0;
        formData.historyDate = '';
        formData.historyType = '';
        formData.inoutType = '';
        formData.revenueType = '';
        formData.valText = 0;
        formData.memo = '';
      }
    });

    return {
      formData,
      submitAddHistory,
      setInputValUnitText
    }
  }
}
</script>

<style scoped>
#addForm {
  width: fit-content;
}
#addForm fieldset {
  width: available;
  border: none;
  border-top: 1px solid;
  margin-top: 10px;

}
#addForm .row {
  padding: 5px 0;
}
#addForm label {
  display: inline-block;
  width: 150px;
  vertical-align: top;
}
#addForm label.short {
  width: 100px;
}
#addForm select {
  width: 200px;
}
#addForm input.val {
  text-align: right;
  width: 10em;
}
</style>