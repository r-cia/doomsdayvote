<script setup>
import { computed } from 'vue'
import { formatarNumero } from '../lib/format'

const props = defineProps({
  pagina: { type: Number, required: true },
  total: { type: Number, default: 0 },
  tamanho: { type: Number, default: 25 },
})
const emit = defineEmits(['update:pagina'])

const ultima = computed(() => Math.max(1, Math.ceil(props.total / props.tamanho)))
const ir = (destino) => emit('update:pagina', Math.min(Math.max(1, destino), ultima.value))
</script>

<template>
  <nav class="paginacao" :aria-label="$t('paginacao.aria')">
    <button type="button" class="button button--ghost button--compacto" :aria-label="$t('paginacao.primeira')" :disabled="pagina <= 1" @click="ir(1)">«</button>
    <button type="button" class="button button--ghost button--compacto" :aria-label="$t('paginacao.anterior')" :disabled="pagina <= 1" @click="ir(pagina - 1)">‹</button>
    <span aria-live="polite">{{ $t('paginacao.pagina', { pagina, total: ultima, itens: formatarNumero(total) }) }}</span>
    <button type="button" class="button button--ghost button--compacto" :aria-label="$t('paginacao.proxima')" :disabled="pagina >= ultima" @click="ir(pagina + 1)">›</button>
    <button type="button" class="button button--ghost button--compacto" :aria-label="$t('paginacao.ultima')" :disabled="pagina >= ultima" @click="ir(ultima)">»</button>
  </nav>
</template>
