import { createApp } from 'vue'
// import App from './App.vue'
import App from './App2.vue';
import router from './router';

const app = createApp(App);
app.use(router);
app.mount('#app');
