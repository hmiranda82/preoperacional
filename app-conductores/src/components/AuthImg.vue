<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { fetchUploadBlobUrl } from '../utils/uploadUrl'

// Descarga la imagen con header Authorization y la muestra como blob.
// Los atributos del padre (class, style, etc.) pasan al <img> interno.
defineOptions({ inheritAttrs: false })

const props = defineProps<{ src?: string | null; alt?: string }>()

const url = ref('')
let seq = 0

watch(
  () => props.src,
  async (src) => {
    const mySeq = ++seq
    if (url.value) {
      URL.revokeObjectURL(url.value)
      url.value = ''
    }
    const loaded = await fetchUploadBlobUrl(src)
    if (mySeq !== seq) {
      if (loaded) URL.revokeObjectURL(loaded)
      return
    }
    url.value = loaded
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (url.value) URL.revokeObjectURL(url.value)
})
</script>

<template>
  <img v-if="url" v-bind="$attrs" :src="url" :alt="alt ?? ''" loading="lazy" />
</template>
