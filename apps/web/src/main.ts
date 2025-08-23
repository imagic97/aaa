import { createApp } from 'vue'

import 'ui/normal.scss'
import { register as registerTheme, ThemeNoraml } from 'ui'

import './assets/main.css'
import App from './App.vue'
import router from './router'

registerTheme(ThemeNoraml, true)

const app = createApp(App)

app.use(router)
app.mount('#app')
