<template>
  <div class="field md:w-3 w-full mt-4">
    <div class="p-inputgroup">
      <div class="p-float-label">
        <InputText
          id="addGroupName"
          type="text"
          maxlength="20"
          v-model="addForm.group_name"
          :class="{'p-invalid': !addForm.validate.group_name}"
        ></InputText>
        <label for="addCompanyName" :class="{'p-error': !addForm.validate.group_name}">그룹추가</label>
      </div>
      <Button type="button" @click="addGroup"><i class="pi pi-plus"></i></Button>
    </div>
    <small v-if="!addForm.validate.group_name" class="p-error">기업명을 입력해주세요.</small>
  </div>

  <div class="md:w-3 w-full">
    <DataView
        :value="groupList"
        layout="list"
    >
      <template #list="{data: group}">
        <div class="w-full mb-1">
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">{{group.group_idx}}</span>
            <InputText
                type="text"
                maxlength="20"
                v-model="group.group_name"
                :class="{'p-invalid': !group.validate.group_name}"
                @blur="updateGroup(group)"
            ></InputText>
            <Button type="button" class="p-button-danger" @click="deleteGroup(group.group_idx)"><i class="pi pi-trash"></i></Button>
          </div>
          <small v-if="!group.validate.group_name" class="p-error">기업명을 입력해주세요.</small>
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

import {useInvestApi} from '@/apis/investHistory';

export default {
  components: {
    InputText,
    Button,
    DataView,
    ConfirmDialog,
    Toast,
  },
  setup() {
    //set vars: api module
    const investApi = useInvestApi();

    //set vars: 필요 변수
    const groupList = ref([]);
    const addForm = reactive({
      group_name: '',
      validate: {
        group_name: true,
      }
    });

    //set vars: confirm dialog
    const confirm = useConfirm();
    const toast = useToast();

    /*
     lifecycle hook
     */
    onBeforeMount(async () => {
      await getGroupList();
    });

    /**
     * 그룹 목록
     * @returns {Promise<void>}
     */
    const getGroupList = async () => {
      try {
        groupList.value = await investApi.getGroupList();

        for (const group of groupList.value) {
          group.original_group_name = group.group_name;
          group.validate = reactive({
            group_name: true
          });
        }
      } catch (err) {
        groupList.value = [];
      }
    }

    /**
     * 그룹 추가
     * @returns {Promise<boolean>}
     */
    const addGroup = async() => {
      if (!addForm.group_name) {
        addForm.validate.group_name = false;
        document.getElementById('addGroupName').focus();
        return false;
      }

      try {
        await investApi.addGroup(addForm.group_name);

        await getGroupList();

        addForm.group_name = '';
        addForm.validate.group_name = true;
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: '추가 실패',
          detail: err,
          life: 3000,
        });
        return false;
      }
    }

    /**
     * 그룹 수정
     * @param group
     * @returns {Promise<void>}
     */
    const updateGroup = async (group) => {
      try {
        if (group.group_name == '') {
          group.validate.group_name = false;
          return;
        } else {
          group.validate.group_name = true;
        }

        if (group.group_name != group.original_group_name) {
          await investApi.editGroup(group.group_idx, group.group_name);

          group.original_group_name = group.group_name;

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
     * 그룹 삭제
     * @param {number} groupIdx
     * @returns {Promise<void>}
     */
    const deleteGroup = async (groupIdx) => {
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
            await investApi.delGroup(groupIdx);

            await getGroupList();

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
      groupList,
      addForm,
      addGroup,
      updateGroup,
      deleteGroup,
    }
  }
}
</script>