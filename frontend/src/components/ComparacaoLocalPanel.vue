<script setup>
import { computed } from 'vue'
import ComparacaoLocalGrupo from './ComparacaoLocalGrupo.vue'
import StateBlock from './StateBlock.vue'
import { formatarNumero } from '../lib/format'
import { useOrdenacao } from '../composables/ordenacao'

const props = defineProps({
  dados: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const emit = defineEmits(['retry'])

const grupos = computed(() => props.dados?.grupos ?? [])
const cobertura = computed(() => props.dados?.cobertura ?? null)
</script>

<template>
  <section class="painel" aria-labelledby="comparacao-local-titulo">
    <header class="painel__cabecalho">
      <h2 id="comparacao-local-titulo">{{ $t('analiseUI.comparacaoLocal') }}</h2>
      <p v-if="!loading && dados" class="painel__meta">
        {{ formatarNumero(grupos.length) }} {{ $t('analiseUI.grupos') }}
      </p>
    </header>

    <StateBlock v-if="loading && !dados" estado="carregando" :titulo="$t('comum.carregando')" />
    <StateBlock v-else-if="error" estado="erro" :titulo="$t('comum.erro')" :descricao="error" :acao="$t('comum.tentarNovamente')" @acao="emit('retry')" />
    <div v-else-if="grupos.length === 0" class="vazio">
      {{ $t('comum.semGruposComparaveis') }}
    </div>
    <div v-else class="grupos">
      <ComparacaoLocalGrupo v-for="(grupo, indice) in grupos" :key="grupo.chave ?? indice" :grupo="grupo" :ordenacao="ordenacao" />
    </div>
    <dl v-if="cobertura" class="painel-resumo" :aria-label="$t('comum.resumoCobertura')">
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.secoesConsideradas') }}</dt>
        <dd>{{ formatarNumero(cobertura.consideradas) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.comGrupo') }}</dt>
        <dd>{{ formatarNumero(cobertura.com_grupo) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.semGrupo') }}</dt>
        <dd>{{ formatarNumero(cobertura.sem_grupo) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('analiseUI.gruposInsuficientes') }}</dt>
        <dd>{{ formatarNumero(cobertura.grupos_insuficientes) }}</dd>
      </div>
    </dl>
  </section>
</template>
