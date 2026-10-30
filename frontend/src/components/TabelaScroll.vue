<script setup>
defineProps({
  atualizando: { type: Boolean, default: false },
})
</script>

<template>
  <div class="tabela-carga">
    <div class="tabela-scroll" :aria-busy="atualizando ? 'true' : null">
      <slot />
    </div>
    <span v-if="atualizando" class="tabela-carga__spinner state--carregando" role="status">
      <span class="state__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="42 14" />
        </svg>
      </span>
      <span class="sr-only">{{ $t('comum.carregando') }}</span>
    </span>
  </div>
</template>
