<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import { useTotalizacaoMetricas } from '../composables/queries'
import { formatarDuracao, formatarNumero } from '../lib/format'

const query = useTotalizacaoMetricas()
const tempo = computed(() => query.data.value?.tempo ?? null)
const vazio = computed(() => !tempo.value || !(query.data.value?.complementares?.secoes > 0))
</script>

<template>
  <section class="painel" aria-labelledby="tempo-voto-titulo" :aria-busy="query.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Tempo de voto</p>
        <h2 id="tempo-voto-titulo">Tempo de voto</h2>
      </div>
    </header>

    <StateBlock v-if="query.isLoading.value" estado="carregando" titulo="Carregando tempo de voto" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      titulo="Não foi possível carregar o tempo de voto"
      :descricao="query.error.value.message"
      acao="Tentar novamente"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="vazio" estado="vazio" titulo="Sem dados da totalização neste recorte" />

    <dl v-else class="leituras__valores" :class="{ 'atualizando': query.isFetching.value }">
      <div>
        <dt>Tempo médio</dt>
        <dd>{{ formatarDuracao(tempo.mediaMs) }}</dd>
      </div>
      <div>
        <dt>Mediana</dt>
        <dd>{{ formatarDuracao(tempo.medianaMs) }}</dd>
      </div>
      <div>
        <dt>Voto mais rápido</dt>
        <dd>{{ formatarDuracao(tempo.maisRapidoMs) }}</dd>
      </div>
      <div>
        <dt>Voto mais demorado</dt>
        <dd>{{ formatarDuracao(tempo.maisDemoradoMs) }}</dd>
      </div>
      <div>
        <dt>Eleitores com duração registrada</dt>
        <dd>{{ formatarNumero(tempo.quantidade) }}</dd>
      </div>
    </dl>
  </section>
</template>
