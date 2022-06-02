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

  <div class="md:w-3 w-full">
    <DataView
        :value="companyList"
        layout="list"
    >
      <template #list="{data: company}">
        <div class="w-full mb-1">
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">{{company.company_idx}}</span>
            <InputText
              type="text"
              maxlength="20"
              v-model="company.company_name"
              :class="{'p-invalid': !company.validate.company_name}"
              @blur="updateCompany(company)"
            ></InputText>
            <Button type="button" class="p-button-danger" @click="deleteCompany(company.company_idx)"><i class="pi pi-trash"></i></Button>
          </div>
          <small
            v-if="!company.validate.company_name"
            :class="{'p-error': !company.validate.company_name}"
          >
            기업명을 입력해주세요.
          </small>
        </div>
      </template>
    </DataView>
  </div>

  <ConfirmDialog
    :breakpoints="{'960px': '75vw', '640px': '100vw'}"
  ></ConfirmDialog>
  <Toast
    :breakpoints="{'960px': {width: '100%', right: '0', left: '0'}}"
  ></Toast>
</template>

<script>
import {onBeforeMount, reactive, ref} from "vue";

import InputText from 'primevue/inputtext';
import Button from "primevue/button";
import DataView from 'primevue/dataview';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import {useConfirm} from 'primevue/useconfirm';
import {useToast} from 'primevue/usetoast';

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
    DataView,
    ConfirmDialog,
    Toast,
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

    //set vars: confirm dialog
    const confirm = useConfirm();
    const toast = useToast();

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
          company.validate = reactive({
            company_name: true
          });
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
        if (company.company_name == '') {
          company.validate.company_name = false;
          return;
        } else {
          company.validate.company_name = true;
        }

        if (company.company_name != company.original_company_name) {
          await requestEditCompany(company.company_idx, company.company_name);

          company.original_company_name = company.company_name;

          toast.add({
            severity: 'success',
            summary: '수정 완료',
            life: 3000,
          });
        }
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: '수정 실패',
          detail: err,
          life: 3000,
        });
      }
    }

    /**
     * 기업 삭제
     * @param companyIdx
     * @returns {Promise<void>}
     */
    const deleteCompany = async (companyIdx) => {
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
            await requestDelCompany(companyIdx);

            await getCompanyList();

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
</style>