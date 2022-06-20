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
app.use(PrimeVue, {ripple: true});
app.use(ConfirmationService);
app.use(ToastService);
app.mount('#app');