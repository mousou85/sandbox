import { createApp } from 'vue'
// import App from './App.vue'
import App from '@/App2.vue';
import router from '@/router';
import store from '@/store/index';
import {setAPIBaseUrl} from '@/modules/investHistory';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

setAPIBaseUrl(API_BASE_URL);

const app = createApp(App);
app.use(router);
app.use(store);
app.mount('#app');
