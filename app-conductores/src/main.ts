import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Capacitor } from '@capacitor/core'
import App from './App.vue'
import router from './router'

try {
  const app = createApp(App)

  // Captura errores de Vue y los muestra en pantalla en lugar de página en blanco
  app.config.errorHandler = (err, _instance, info) => {
    console.error('[Vue Error]', err, info)
    const el = document.getElementById('app')
    if (el) {
      el.innerHTML = `
        <div style="padding:32px;font-family:sans-serif;color:#c0392b;background:#fff5f5;
                    min-height:100vh;box-sizing:border-box;">
          <h2 style="margin:0 0 12px">Error al iniciar la aplicación</h2>
          <pre style="font-size:13px;white-space:pre-wrap;background:#fff;
                      padding:16px;border-radius:8px;border:1px solid #fecaca">
${String(err)}

Info: ${info}
          </pre>
          <p style="margin-top:16px;font-size:13px;color:#666">
            Abre la consola del navegador (F12 → Console) para más detalles.
          </p>
        </div>`
    }
  }

  app.use(createPinia())
  app.use(router)
  app.mount('#app')

} catch (err) {
  // Error en la inicialización — lo mostramos en pantalla en lugar de página en blanco
  document.getElementById('app')!.innerHTML = `
    <div style="padding:32px;font-family:sans-serif;color:#c0392b;background:#fff5f5;
                min-height:100vh;box-sizing:border-box;">
      <h2 style="margin:0 0 12px">Error de inicialización</h2>
      <pre style="font-size:13px;white-space:pre-wrap;background:#fff;
                  padding:16px;border-radius:8px;border:1px solid #fecaca">
${String(err)}
      </pre>
      <p style="margin-top:16px;font-size:13px;color:#666">
        Revisa la consola del navegador (F12 → Console) para el stack trace completo.
      </p>
    </div>`
  console.error('[Init Error]', err)
}
