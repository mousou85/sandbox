<template>
  <div class="field md:w-3 w-full mt-4">
    <div class="p-inputgroup">
      <div class="p-float-label">
        <InputText
            id="addCompanyName"
            type="text"
            maxlength="20"
            v-model="addForm.company_name"
            :class="{'p-invalid': !addForm.validate.company_name}"
        ></InputText>
        <label for="addCompanyName" :class="{'p-error': !addForm.validate.company_name}">기업추가</label>
      </div>
      <Button type="button" @click="addCompany"><i class="pi pi-plus"></i></Button>
    </div>
    <small
      v-if="!addForm.validate.company_name"
      :class="{'p-error': !addForm.validate.company_name}"
    >
      기업명을 입력해주세요.
    </small>
  </div>

  <div>
    <table id="companyList">
      <thead>
        <tr>
          <th>IDX</th>
          <th>기업명</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="company in companyList" :key="company.company_idx">
          <td class="center">{{company.company_idx}}</td>
          <td>
            <input type="text" maxlength="20" v-model="company.company_name" @blur="updateCompany(company)">
            <button type="button" @click="deleteCompany(company.company_idx)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import {onBeforeMount, reactive, ref} from "vue";

import InputText from 'primevue/inputtext';
import Button from "primevue/button";

import {
  getCompanyList as requestCompanyList,
  addCompany as requestAddCompany,
  editCompany as requestEditCompany,
  delCompany as requestDelCompany
} from '@/modules/investHistory';

export default {
  components: {
    InputText,
    Button,
  },
  setup() {
    //set vars: 필요 변수
    const companyList = ref([]);
    const addForm = reactive({
      company_name: '',
      validate: {
        company_name: true,
      }
    });

    /*
    lifecycle hook
     */
    onBeforeMount(async () => {
      await getCompanyList();
    });

    /**
     * 기업 목록
     * @returns {Promise<void>}
     */
    const getCompanyList = async () => {
      try {
        companyList.value = await requestCompanyList();

        for (const company of companyList.value) {
          company.original_company_name = company.company_name;
        }
      } catch (err) {
        companyList.value = [];
      }
    }

    /**
     * 기업 추가
     * @returns {Promise<boolean>}
     */
    const addCompany = async() => {
      if (!addForm.company_name) {
        addForm.validate.company_name = false;
        document.getElementById('addCompanyName').focus();
        return false;
      }

      try {
        await requestAddCompany(addForm.company_name);

        await getCompanyList();

        addForm.company_name = '';
        addForm.validate.company_name = true;
      } catch (err) {
        alert(err);
        return false;
      }
    }

    /**
     * 기업 수정
     * @param company
     * @returns {Promise<void>}
     */
    const updateCompany = async (company) => {
      try {
        if (company.company_name != company.original_company_name) {
          await requestEditCompany(company.company_idx, company.company_name);

          company.original_company_name = company.company_name;
        }
      } catch (err) {
        alert(err);
      }
    }

    /**
     * 기업 삭제
     * @param companyIdx
     * @returns {Promise<void>}
     */
    const deleteCompany = async (companyIdx) => {
      try {
        await requestDelCompany(companyIdx);

        await getCompanyList();
      } catch (err) {
        alert(err);
      }
    }

    return {
      companyList,
      addForm,
      addCompany,
      updateCompany,
      deleteCompany,
    }
  }
}
</script>

<style scoped>
.p-error {
  color: #e24c4c;
}

#companyList {
  border: 1px solid;
  border-collapse: collapse;
}
#companyList th, #companyList td {
  border: 1px solid;
  padding: 5px;
}
#companyList .center {
  text-align: center;
}
</style>