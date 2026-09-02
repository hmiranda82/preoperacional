/**
 * useSearchStore
 *
 * Canal de comunicación entre el topbar de App.vue y las vistas.
 * App.vue escribe → la vista activa lee y filtra.
 *
 * Flujo:
 *   1. Usuario escribe en topbar → store.query se actualiza en tiempo real
 *   2. DashboardView observa store.query y lo sincroniza con fleetSearch
 *   3. Al cambiar de ruta, App.vue llama store.clear() automáticamente
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSearchStore = defineStore('search', () => {
  const query = ref('')

  function clear() {
    query.value = ''
  }

  return { query, clear }
})