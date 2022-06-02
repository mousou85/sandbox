import { createApp } from 'vue'
// import App from './App.vue'
import App from '@/App2.vue';
import router from '@/router';
import store from '@/store/index';
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import {setAPIBaseUrl} from '@/modules/investHistory';


//set vars: 환경 변수
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SITE_NAME = import.meta.env.VITE_SITE_NAME;
store.commit('setSiteName', SITE_NAME);

setAPIBaseUrl(API_BASE_URL);

const app = createApp(App);
app.use(router);
app.use(store);
app.use(PrimeVue, {ripple: true});
app.use(ConfirmationService);
app.use(ToastService);
app.mount('#app');