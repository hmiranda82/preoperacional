import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components, directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary:   '#1a2540',
          secondary: '#4a5568',
          error:     '#e63d2f',
          warning:   '#f59e0b',
          success:   '#22c55e',
          info:      '#3b82f6',
        },
      },
    },
  },
})

const app = createApp(App)
app.config.errorHandler = (err, instance, info) => {
  console.error('Global Vue error:', err)
  if (info) console.warn('Error info:', info)
}
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
