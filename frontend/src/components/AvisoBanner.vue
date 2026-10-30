<script setup>
import { computed } from 'vue'
import { avisoInfo } from '../lib/status'

const props = defineProps({
  avisos: { type: Array, default: () => [] },
})

const lista = computed(() => {
  const vistos = new Set()
  return (props.avisos ?? []).filter((aviso) => {
    if (!aviso?.codigo || vistos.has(aviso.codigo)) return false
    vistos.add(aviso.codigo)
    return true
  })
})
</script>

<template>
  <div v-if="lista.length" class="avisos" role="status" :aria-label="$t('comum.avisos') || 'Avisos'">
    <article
      v-for="aviso in lista"
      :key="aviso.codigo"
      class="aviso"
      :class="`aviso--${avisoInfo(aviso.codigo).tom}`"
    >
      <strong>{{ avisoInfo(aviso.codigo).rotulo }}</strong>
      <p>{{ aviso.mensagem }}</p>
    </article>
  </div>
</template>
