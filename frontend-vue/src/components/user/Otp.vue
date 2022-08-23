<template>
  <Dialog
      header="OTP Setting"
      position="center"
      v-model:visible="dialogVisible"
      :dismissableMask="false"
      :closeOnEscape="false"
      :modal="true"
      :closable="true"
      :breakpoints="{'960px': '75vw', '640px': '95vw'}"
  >
    <template v-if="useOtp">
      <div class="max-w-max">OTP를 해제하시겠습니까?</div>
      <div class="p-normal-label mt-3">
        <InputText
          v-model="inputVerifyToken"
          class="block w-full text-center text-xl"
          placeholder="OTP 코드 입력"
          maxlength="6"
          :class="{'p-invalid': invalidVerifyToken}"
          @keyup.enter="OTPUnregister"
        ></InputText>
      </div>
      <small v-if="invalidVerifyToken" class="p-error">{{invalidVerifyToken}}</small>

      <Button
        label="해제하기"
        class="block w-full mt-3 p-button-danger"
        @click="OTPUnregister"
      ></Button>
    </template>
    <template v-else>
      <div class="max-w-max">아래 QR코드를 OTP 앱으로 촬영하여 등록하세요.</div>
      <img :src="qrCodeURL" alt="otp QR code" class="block mx-auto">

      <div class="p-normal-label">
        <InputText
          v-model="inputVerifyToken"
          class="block w-full text-center text-xl"
          placeholder="OTP 코드 입력"
          maxlength="6"
          :class="{'p-invalid': invalidVerifyToken}"
          @keyup.enter="OTPRegister"
        ></InputText>
      </div>
      <small v-if="invalidVerifyToken" class="p-error">{{invalidVerifyToken}}</small>

      <Button
        label="등록"
        class="block w-full mt-3"
        @click="OTPRegister"
      ></Button>
    </template>
  </Dialog>
  <Toast
      :breakpoints="{'960px': {width: '100%', right: '0', left: '0'}}"
  ></Toast>
</template>

<script>
import {computed, ref} from "vue";
import {useStore} from 'vuex';

import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Toast from 'primevue/toast';
import {useToast} from 'primevue/usetoast';

import {useUserApi} from '@/apis/user';

export default {
  components: {
    InputText,
    Button,
    Toast,
    Dialog,
  },
  props: [],
  setup(props, {expose}) {
    //set vars: vuex, toast
    const store = useStore();
    const toast = useToast();

    //set vars: api
    const userApi = useUserApi();

    //set vars: otp use flag
    const useOtp = computed(() => store.getters['user/getUserInfo'].use_otp);

    //set vars: dialog visible flag
    const dialogVisible = ref(false);

    //set vars: otp 관련
    const otpSecret = ref('');
    const qrCodeURL = ref('');
    const inputVerifyToken = ref('');
    const invalidVerifyToken = ref('');

    /**
     * OTP 설정 dialog 토글
     * @param {string} flag
     * @returns {Promise<boolean>}
     */
    const toggleDialog = async (flag) => {
      try {
        if (flag == 'show') {
          //OTP 사용여부에 따라 처리 분리
          if (useOtp.value) {

          } else {
            const rsOtpQRCode = await userApi.getOtpQRCode();
            otpSecret.value = rsOtpQRCode.secret;
            qrCodeURL.value = rsOtpQRCode.qrcode;
          }

          dialogVisible.value = true;
        } else {
          dialogVisible.value = false;
          inputVerifyToken.value = '';
          invalidVerifyToken.value = '';
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
     * OTP 등록 처리
     * @returns {Promise<boolean>}
     */
    const OTPRegister = async () => {
      invalidVerifyToken.value = '';

      if (!inputVerifyToken.value) {
        invalidVerifyToken.value = 'OTP 코드를 입력해주세요.';
        return false;
      }

      //OTP 등록
      try {
        await userApi.registerOTP(otpSecret.value, inputVerifyToken.value);
      } catch (err) {
        invalidVerifyToken.value = err.message;
        return false;
      }

      //회원 정보 갱신
      try {
        const rsUser = await userApi.getUserInfo();

        await store.dispatch('user/userInfo', {
          user_idx: rsUser.user_idx,
          id: rsUser.id,
          name: rsUser.name,
          use_otp: rsUser.use_otp
        });

        await toggleDialog('hide');

        toast.add({
          severity: 'success',
          summary: 'OTP 등록 완료',
          life: 3000,
        });
      } catch (err) {
        toast.add({
          severity: 'error',
          detail: err,
          life: 3000,
        });
      }
    };

    /**
     * OTP 해지 처리
     * @returns {Promise<boolean>}
     * @constructor
     */
    const OTPUnregister = async () => {
      invalidVerifyToken.value = '';

      if (!inputVerifyToken.value) {
        invalidVerifyToken.value = 'OTP 코드를 입력해주세요.';
        return false;
      }

      //OTP 해지
      try {
        await userApi.unregisterOTP(inputVerifyToken.value);
      } catch (err) {
        invalidVerifyToken.value = err.message;
        return false;
      }

      //회원 정보 갱신
      try {
        const rsUser = await userApi.getUserInfo();

        await store.dispatch('user/userInfo', {
          user_idx: rsUser.user_idx,
          id: rsUser.id,
          name: rsUser.name,
          use_otp: rsUser.use_otp
        });

        await toggleDialog('hide');

        toast.add({
          severity: 'success',
          summary: 'OTP 해지 완료',
          life: 3000,
        });
      } catch (err) {
        toast.add({
          severity: 'error',
          detail: err,
          life: 3000,
        });
      }
    };

    //expose property
    expose({toggleDialog});

    return {
      useOtp,
      dialogVisible,
      qrCodeURL,
      inputVerifyToken,
      invalidVerifyToken,
      OTPRegister,
      OTPUnregister,
    }
  }
}
</script>