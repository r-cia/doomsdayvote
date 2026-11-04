<script setup>
defineProps({
  itens: { type: Array, default: () => [] },
})
</script>

<template>
  <dl v-if="itens.length > 0" class="cobertura" :aria-label="$t('cobertura.titulo')">
    <div v-for="item in itens" :key="item.rotulo">
      <dt>{{ item.rotulo }}</dt>
      <dd>{{ item.valor }}</dd>
    </div>
  </dl>
</template>
