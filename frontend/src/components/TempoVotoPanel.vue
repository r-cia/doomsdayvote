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
        <p class="painel__etiqueta">{{ $t('tempoVoto.titulo') }}</p>
        <h2 id="tempo-voto-titulo">{{ $t('tempoVoto.titulo') }}</h2>
      </div>
    </header>

    <StateBlock v-if="query.isLoading.value" estado="carregando" :titulo="$t('tempoVoto.carregando')" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      :titulo="$t('tempoVoto.erro')"
      :descricao="query.error.value.message"
      :acao="$t('comum.tentarNovamente')"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="vazio" estado="vazio" :titulo="$t('totalizacao.semDados')" />

    <dl v-else class="leituras__valores" :class="{ 'atualizando': query.isFetching.value }">
      <div>
        <dt>{{ $t('tempoVoto.media') }}</dt>
        <dd>{{ formatarDuracao(tempo.mediaMs) }}</dd>
      </div>
      <div>
        <dt>{{ $t('tempoVoto.mediana') }}</dt>
        <dd>{{ formatarDuracao(tempo.medianaMs) }}</dd>
      </div>
      <div>
        <dt>{{ $t('tempoVoto.maisRapido') }}</dt>
        <dd>{{ formatarDuracao(tempo.maisRapidoMs) }}</dd>
      </div>
      <div>
        <dt>{{ $t('tempoVoto.maisDemorado') }}</dt>
        <dd>{{ formatarDuracao(tempo.maisDemoradoMs) }}</dd>
      </div>
      <div>
        <dt>{{ $t('tempoVoto.quantidade') }}</dt>
        <dd>{{ formatarNumero(tempo.quantidade) }}</dd>
      </div>
    </dl>
  </section>
</template>
