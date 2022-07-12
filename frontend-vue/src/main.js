import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store/index';
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";


//set vars: 환경 변수
const SITE_NAME = import.meta.env.VITE_SITE_NAME;
store.commit('setSiteName', SITE_NAME);

const app = createApp(App);
app.use(store);
app.use(router(store));
app.use(PrimeVue, {
  ripple: true,
  locale: {
    dateFormat: 'yy-mm-dd',
    dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
    dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
    dayNamesMin: ["일", "월", "화", "수", "목", "금", "토"],
    monthNames: ['1월', '2월', '3월', '4월' ,'5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthNamesShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    today: '오늘',
    weekHeader: '주',
  }
});
app.use(ConfirmationService);
app.use(ToastService);
app.mount('#app');