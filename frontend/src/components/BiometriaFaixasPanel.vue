<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import { useTotalizacaoMetricas } from '../composables/queries'
import { formatarNumero } from '../lib/format'

const query = useTotalizacaoMetricas()
const faixas = computed(() => {
  const b = query.data.value?.biometria
  return b
    ? [
        ['Falhou 1 tentativa', b.falhou1],
        ['Falhou 2 tentativas', b.falhou2],
        ['Falhou 3 tentativas', b.falhou3],
        ['Falhou 4 ou mais tentativas', b.falhou4],
        ['Habilitação manual', b.manual],
      ]
    : []
})
const vazio = computed(() => !(query.data.value?.complementares?.secoes > 0))
</script>

<template>
  <section class="painel" aria-labelledby="biometria-faixas-titulo" :aria-busy="query.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Biometria</p>
        <h2 id="biometria-faixas-titulo">Biometria por faixa</h2>
      </div>
    </header>

    <StateBlock v-if="query.isLoading.value" estado="carregando" titulo="Carregando biometria por faixa" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      titulo="Não foi possível carregar a biometria por faixa"
      :descricao="query.error.value.message"
      acao="Tentar novamente"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="vazio" estado="vazio" titulo="Sem dados da totalização neste recorte" />

    <dl v-else class="leituras__valores" :class="{ 'atualizando': query.isFetching.value }">
      <div v-for="[rotulo, valor] in faixas" :key="rotulo">
        <dt>{{ rotulo }}</dt>
        <dd>{{ formatarNumero(valor) }}</dd>
      </div>
    </dl>
  </section>
</template>
