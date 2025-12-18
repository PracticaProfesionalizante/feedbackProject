import { createApp } from 'vue'
import 'vuetify/styles'
import './style.css'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { pinia } from './stores'
import router from './router'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from './composables/useQueryClient'

const app = createApp(App)

// Configurar plugins
app.use(vuetify)
app.use(pinia)
app.use(router)
app.use(VueQueryPlugin, {
  queryClient,
})

app.mount('#app')
