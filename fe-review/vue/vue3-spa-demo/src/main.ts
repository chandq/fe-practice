import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

let ff: boolean = false
ff = Boolean(1)

app.use(createPinia())
app.use(router)

app.mount('#app')
