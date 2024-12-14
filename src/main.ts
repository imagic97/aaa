import { createApp } from 'vue'

import router from '@/router'

import App from '@/App.vue'

import Components from '@/components'

const app = createApp(App)

app
  .use(router)

app
  .use(Components)

Promise.resolve()
  .then(() => {
    app.mount('#app')
  })
  .catch((error: Error) => {
    window.console.warn(error)
    window.alert(error.message)
  })