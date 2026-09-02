<template>
  <div class="app-image-container" :style="{ maxWidth, maxHeight }">
    <v-img
      v-if="src"
      :src="src"
      :alt="alt"
      :max-width="maxWidth"
      :max-height="maxHeight"
      cover
      class="rounded-lg bg-grey-lighten-3"
      @error="handleError"
    >
      <template #placeholder>
        <div class="d-flex align-center justify-space-between fill-height bg-grey-lighten-4">
          <v-progress-circular indeterminate color="indigo" size="24" />
        </div>
      </template>
      
      <template #error>
        <div class="d-flex flex-column align-center justify-center fill-height bg-grey-lighten-4 pa-4 text-center">
          <v-icon color="grey-darken-1" size="32" class="mb-2">mdi-image-off</v-icon>
          <span class="text-caption text-grey-darken-1">Imagen no disponible</span>
        </div>
      </template>
      
      <!-- Overlay para ver en pantalla completa -->
      <div class="image-overlay d-flex align-center justify-center" @click="openLightbox">
        <v-icon color="white" size="24">mdi-magnify-plus</v-icon>
      </div>
    </v-img>
    
    <div v-else class="d-flex flex-column align-center justify-center fill-height bg-grey-lighten-4 pa-4 text-center rounded-lg border">
      <v-icon color="grey-lighten-1" size="32" class="mb-2">mdi-image-off-outline</v-icon>
      <span class="text-caption text-grey-lighten-2">Sin imagen adjunta</span>
    </div>

    <!-- Lightbox Simple -->
    <v-dialog v-model="lightbox" max-width="90vw">
      <v-card class="bg-black text-white" rounded="lg">
        <v-card-title class="d-flex justify-end pa-2">
          <v-btn icon="mdi-close" variant="text" color="white" @click="lightbox = false" />
        </v-card-title>
        <v-card-text class="pa-0 d-flex justify-center">
          <img :src="src" class="lightbox-img" alt="Vista ampliada" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  src: { type: String, default: null },
  alt: { type: String, default: 'Imagen' },
  maxWidth: { type: [String, Number], default: '100%' },
  maxHeight: { type: [String, Number], default: '200px' },
})

const lightbox = ref(false)
const error = ref(false)

function handleError() {
  error.value = true
}

function openLightbox() {
  if (props.src && !error.value) {
    lightbox.value = true
  }
}
</script>

<style scoped>
.app-image-container {
  position: relative;
  overflow: hidden;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.app-image-container:hover .image-overlay {
  opacity: 1;
}

.lightbox-img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
}
</style>
