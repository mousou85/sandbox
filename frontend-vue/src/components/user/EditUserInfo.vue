<template>
  <Dialog
    header="Edit User Info"
    position="center"
    v-model:visible="dialogVisible"
    :dismissableMask="false"
    :closeOnEscape="false"
    :modal="true"
    :closable="true"
    :breakpoints="{'960px': '75vw', '640px': '95vw'}"
    class="md:w-3"
  >
    <form @submit.prevent="submitForm">
      <div class="field mt-5">
        <div class="p-normal-label">
          <InputText
            id="editUserInfo_name"
            v-model="formData.name"
            class="w-full"
            maxlength="50"
            :class="{'p-invalid': formData.invalid.name}"
          ></InputText>
          <label for="editUserInfo_name" :class="{'p-error': formData.invalid.name}">Name</label>
        </div>
        <small v-if="formData.invalid.name" class="p-error">{{formData.invalid.name}}</small>
      </div>

      <h4>Change Password</h4>
      <div class="field mt-5">
        <div class="p-normal-label">
          <Password
            id="editUserInfo_currentPassword"
            v-model="formData.currentPassword"
            class="w-full"
            inputClass="w-full"
            maxlength="30"
            :feedback="false"
            :class="{'p-invalid': formData.invalid.currentPassword}"
          ></Password>
          <label for="editUserInfo_currentPassword" :class="{'p-error': formData.invalid.currentPassword}">Current Password</label>
        </div>
        <small v-if="formData.invalid.currentPassword" class="p-error">{{formData.invalid.currentPassword}}</small>
      </div>
      <div class="field mt-5">
        <div class="p-normal-label">
          <Password
              id="editUserInfo_newPassword"
              v-model="formData.newPassword"
              class="w-full"
              inputClass="w-full"
              maxlength="30"
              :class="{'p-invalid': formData.invalid.newPassword}"
          ></Password>
          <label for="editUserInfo_newPassword" :class="{'p-error': formData.invalid.newPassword}">New Password</label>
        </div>
        <small v-if="formData.invalid.newPassword" class="p-error">{{formData.invalid.newPassword}}</small>
      </div>
      <div class="field">
        <Button label="Edit" type="submit" class="w-full"></Button>
      </div>
    </form>
  </Dialog>
  <Toast
      :breakpoints="{'960px': {width: '100%', right: '0', left: '0'}}"
  ></Toast>
</template>

<script>
import {computed, reactive, ref} from "vue";
import {useStore} from 'vuex';

import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Toast from 'primevue/toast';
import {useToast} from 'primevue/usetoast';

import {useUserApi} from '@/apis/user';

export default {
  components: {
    Dialog,
    InputText,
    Password,
    Button,
    Toast,
  },
  setup(props, {expose}) {
    //set vars: vuex, toast
    const store = useStore();
    const toast = useToast();

    //set vars: api
    const userApi = useUserApi();

    //set vars: dialog visible flag
    const dialogVisible = ref(false);

    //set vars: form data
    const formData = reactive({
      name: '',
      currentPassword: '',
      newPassword: '',
      invalid: {
        name: '',
        currentPassword: '',
        newPassword: '',
      }
    });

    /**
     * dialog 토글
     * @param {string} flag
     * @returns {Promise<boolean>}
     */
    const toggleDialog = async (flag) => {
      try {
        if (flag == 'show') {
          dialogVisible.value = true;

          const userInfo = await userApi.getUserInfo();
          formData.name = userInfo.name;
        } else {
          dialogVisible.value = false;
        }
      } catch (err) {
        toast.add({
          severity: 'error',
          detail: err,
          life: 3000,
        });
        return false;
      }
    }

    /**
     * form submit event
     * @returns {Promise<boolean>}
     */
    const submitForm = async () => {
      try {
        let isInvalid = false;
        formData.invalid.name = '';
        formData.invalid.currentPassword = '';
        formData.invalid.newPassword = '';

        if (!formData.name) {
          formData.invalid.name = '이름을 입력해주세요';
          isInvalid = true;
        }
        if (formData.currentPassword || formData.newPassword) {
          if (!formData.currentPassword) {
            formData.invalid.currentPassword = '현재 비밀번호를 입력해주세요';
            isInvalid = true;
          }
          if (!formData.newPassword) {
            formData.invalid.newPassword = '새 비밀번호를 입력해주세요';
            isInvalid = true;
          } else {
            if (formData.newPassword.length < 6) {
              formData.invalid.newPassword = '6자 이상 입력해주세요';
              isInvalid = true;
            }
          }
        }

        if (isInvalid) return false;

        //request edit user info api
        await userApi.editUserInfo({
          name: formData.name,
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
        });

        //update user info vuex
        const rsUserInfo = await userApi.getUserInfo();
        await store.dispatch('user/userInfo', {
          user_idx: rsUserInfo.user_idx,
          id: rsUserInfo.id,
          name: rsUserInfo.name,
          use_otp: rsUserInfo.use_otp,
        });

        await toggleDialog('hide');

        toast.add({
          severity: 'success',
          summary: 'User Info Update Success',
          life: 3000,
        });

        return true;
      } catch (err) {
        toast.add({
          severity: 'error',
          detail: err,
          life: 3000,
        });
        return false;
      }
    }

    //expose property
    expose({toggleDialog});

    return {
      dialogVisible,
      formData,
      submitForm,
    }
  }
}
</script>