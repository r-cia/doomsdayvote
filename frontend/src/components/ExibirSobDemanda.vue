<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  alturaMinima: { type: String, default: '120px' },
})

const raiz = ref(null)
const visivel = ref(typeof IntersectionObserver === 'undefined')
let observador = null

onMounted(() => {
  if (visivel.value || !raiz.value) return
  observador = new IntersectionObserver(
    (entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) {
        visivel.value = true
        observador?.disconnect()
      }
    },
    { rootMargin: '200px' },
  )
  observador.observe(raiz.value)
})

onBeforeUnmount(() => observador?.disconnect())
</script>

<template>
  <slot v-if="visivel" />
  <div v-else ref="raiz" :style="{ minHeight: alturaMinima }" aria-hidden="true"></div>
</template>
