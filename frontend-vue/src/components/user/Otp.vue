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
        ></InputText>
      </div>
      <small
        v-if="invalidVerifyToken"
        :class="{'p-error': invalidVerifyToken}"
      >{{invalidVerifyToken}}</small>

      <Button
        label="등록"
        class="block w-full mt-3"
        @click="submitOTPRegister"
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
     * @returns {Promise<boolean>}
     */
    const toggleDialog = async () => {
      try {
        if (dialogVisible.value) { //dialog 닫기
          dialogVisible.value = !dialogVisible.value;
        } else { //dialog 열기
          //OTP 사용여부에 따라 처리 분리
          if (useOtp.value) {

          } else {
            const rsOtpQRCode = await userApi.getOtpQRCode();
            otpSecret.value = rsOtpQRCode.secret;
            qrCodeURL.value = rsOtpQRCode.qrcode;
          }

          dialogVisible.value = !dialogVisible.value;
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
     * OTP 등록 submit
     * @returns {Promise<boolean>}
     */
    const submitOTPRegister = async () => {
      invalidVerifyToken.value = '';

      if (!inputVerifyToken.value) {
        invalidVerifyToken.value = 'OTP 코드를 입력해주세요.';
        return false;
      }

      try {
        await userApi.setOtp(otpSecret.value, inputVerifyToken.value);


      } catch (err) {
        invalidVerifyToken.value = err.message;
        return false;
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
      submitOTPRegister,
    }
  }
}
</script>