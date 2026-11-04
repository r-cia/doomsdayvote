<script setup>
defineProps({
  itens: { type: Array, default: () => [] },
})
</script>

<template>
  <section v-if="itens.length > 0" class="painel" aria-labelledby="cobertura-titulo">
    <header class="painel__cabecalho">
      <div>
        <h2 id="cobertura-titulo">{{ $t('cobertura.titulo') }}</h2>
      </div>
    </header>
    <dl class="leituras__valores">
      <div v-for="item in itens" :key="item.rotulo">
        <dt>{{ item.rotulo }}</dt>
        <dd>{{ item.valor }}</dd>
      </div>
    </dl>
  </section>
</template>
