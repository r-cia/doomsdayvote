<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ComparacaoLocalGrupo from './ComparacaoLocalGrupo.vue'
import Paginacao from './Paginacao.vue'
import StateBlock from './StateBlock.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useComparacaoLocal } from '../composables/queries'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero } from '../lib/format'
import SecaoView from '../views/SecaoView.vue'

const { t } = useI18n()
const store = useFiltersStore()
const pagina = ref(1)
const abertos = ref(new Set())
const secaoModalId = ref(null)
const { ordenacao, alternar } = useOrdenacao()

const query = useComparacaoLocal({ page: pagina })
const grupos = computed(() => query.data.value?.grupos ?? [])

watch(
  () => [store.electionId, store.cargo, store.asOf, store.uf, store.municipio],
  () => {
    pagina.value = 1
    abertos.value = new Set()
  },
)
watch(pagina, () => {
  abertos.value = new Set()
})

function alternarGrupo(chave) {
  const proximo = new Set(abertos.value)
  if (!proximo.delete(chave)) proximo.add(chave)
  abertos.value = proximo
}

const identificacao = (g) =>
  [
    g.identificacao.sg_uf,
    g.identificacao.nm_municipio || g.identificacao.cd_municipio_tse,
    g.identificacao.nr_zona && `${t('comum.zona').toLowerCase()} ${g.identificacao.nr_zona}`,
    g.identificacao.nr_local_votacao && `${t('secoes.local').toLowerCase()} ${g.identificacao.nr_local_votacao}`,
  ]
    .filter((parte) => parte !== null && parte !== undefined && parte !== '')
    .join(' · ')
</script>

<template>
  <section class="painel" aria-labelledby="comparacao-local-titulo" :aria-busy="query.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('comparacaoLocal.etiqueta') }}</p>
        <h2 id="comparacao-local-titulo">{{ $t('comparacaoLocal.titulo') }}</h2>
        <p v-if="query.data.value?.cobertura" class="painel__meta">
          {{ $t('comparacaoLocal.nGrupos', { n: formatarNumero(query.data.value.total) }) }}
        </p>
      </div>
    </header>

    <StateBlock v-if="query.isLoading.value" estado="carregando" :titulo="$t('comparacaoLocal.carregando')" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      :titulo="$t('comparacaoLocal.erro')"
      :descricao="query.error.value.message"
      :acao="$t('comum.tentarNovamente')"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="grupos.length === 0" estado="vazio" :titulo="$t('comparacaoLocal.vazio')" />
    <template v-else>
      <ul class="lista-grupos" :class="{ atualizando: query.isFetching.value }" :aria-busy="query.isFetching.value">
        <li v-for="g in grupos" :key="g.chave">
          <button
            type="button"
            class="button button--ghost"
            :aria-expanded="abertos.has(g.chave)"
            @click="alternarGrupo(g.chave)"
          >
            {{ $t(`comparacaoLocal.niveis.${g.nivel}`) }} · {{ identificacao(g) }} · {{ $t('duplicacao.nSecoes', { n: formatarNumero(g.tamanho) }) }}
          </button>
          <span v-if="g.dados_insuficientes" class="chip chip--alert">{{ $t('comparacaoLocal.insuficientes') }}</span>
          <ComparacaoLocalGrupo
            v-if="abertos.has(g.chave)"
            :chave="g.chave"
            :ordenacao="ordenacao"
            @ordenar="alternar"
            @abrir-secao="secaoModalId = $event"
          />
        </li>
      </ul>
      <Paginacao v-model:pagina="pagina" :total="query.data.value?.total ?? 0" :tamanho="query.data.value?.page_size ?? 50" />
    </template>
  </section>

  <SecaoView
    v-if="secaoModalId"
    :id-prop="secaoModalId"
    :election-id-prop="store.electionId"
    :cargo-prop="store.cargo"
    :as-of-prop="store.asOf ?? ''"
    :uf-prop="store.uf ?? ''"
    :municipio-prop="store.municipio ?? ''"
    @close="secaoModalId = null"
  />
</template>
