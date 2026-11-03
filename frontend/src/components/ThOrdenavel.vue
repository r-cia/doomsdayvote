<script setup>
import { computed } from 'vue'

const props = defineProps({
  coluna: { type: String, required: true },
  ordenacao: { type: Object, default: null },
  numero: { type: Boolean, default: false },
})
defineEmits(['ordenar'])

const ativa = computed(() => props.ordenacao?.ordem === props.coluna)
const ariaSort = computed(() =>
  ativa.value ? (props.ordenacao.direcao === 'desc' ? 'descending' : 'ascending') : 'none',
)
</script>

<template>
  <th scope="col" :aria-sort="ariaSort" :class="{ tabela__numero: numero, num: numero }">
    <button type="button" class="ordenavel" @click="$emit('ordenar', coluna)">
      <slot />
      <span aria-hidden="true">{{ ativa ? (ordenacao.direcao === 'desc' ? ' ↓' : ' ↑') : '' }}</span>
    </button>
  </th>
</template>
