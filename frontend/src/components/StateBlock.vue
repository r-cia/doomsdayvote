<script setup>
defineProps({
  estado: { type: String, default: 'info' },
  titulo: { type: String, required: true },
  descricao: { type: String, default: '' },
  acao: { type: String, default: '' },
})

defineEmits(['acao'])
</script>

<template>
  <div
    class="state"
    :class="`state--${estado}`"
    :role="estado === 'erro' ? 'alert' : 'status'"
  >
    <span class="state__icon" aria-hidden="true">
      <svg v-if="estado === 'carregando'" viewBox="0 0 24 24" width="22" height="22">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="42 14" />
      </svg>
      <svg v-else-if="estado === 'erro'" viewBox="0 0 24 24" width="22" height="22">
        <path d="M12 3 2.5 20h19L12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path d="M12 9v5M12 17.2v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <svg v-else-if="estado === 'vazio'" viewBox="0 0 24 24" width="22" height="22">
        <rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path d="M7 10h10M7 14h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="22" height="22">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path d="M12 10.5v6M12 7.4v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    </span>
    <div class="state__texto">
      <strong>{{ titulo }}</strong>
      <p v-if="descricao">{{ descricao }}</p>
      <slot />
    </div>
    <button v-if="acao" type="button" class="button button--secondary" @click="$emit('acao')">
      {{ acao }}
    </button>
  </div>
</template>
