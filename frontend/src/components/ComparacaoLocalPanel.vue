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
const cobertura = computed(() => query.data.value?.cobertura ?? null)

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
      <div class="grupos" :class="{ atualizando: query.isFetching.value }" :aria-busy="query.isFetching.value">
        <article v-for="g in grupos" :key="g.chave" class="grupo">
          <header class="grupo__cabecalho">
            <h3>
              <button type="button" class="grupo__alternar" :aria-expanded="abertos.has(g.chave)" @click="alternarGrupo(g.chave)">
                <span aria-hidden="true">{{ abertos.has(g.chave) ? '▾' : '▸' }}</span>
                {{ $t(`comparacaoLocal.niveis.${g.nivel}`) }} · {{ identificacao(g) }} · {{ $t('duplicacao.nSecoes', { n: formatarNumero(g.tamanho) }) }}
              </button>
            </h3>
            <span v-if="g.dados_insuficientes" class="status status--warning">{{ $t('comparacaoLocal.insuficientes') }}</span>
          </header>
          <ComparacaoLocalGrupo
            v-if="abertos.has(g.chave)"
            :chave="g.chave"
            :ordenacao="ordenacao"
            @ordenar="alternar"
            @abrir-secao="secaoModalId = $event"
          />
        </article>
      </div>
      <Paginacao v-model:pagina="pagina" :total="query.data.value?.total ?? 0" :tamanho="query.data.value?.page_size ?? 50" />
    </template>
    <dl v-if="cobertura" class="painel-resumo" :aria-label="$t('cobertura.titulo')">
      <div class="painel-resumo__item">
        <dt>{{ $t('comparacaoLocal.consideradas') }}</dt>
        <dd>{{ formatarNumero(cobertura.consideradas) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('comparacaoLocal.comGrupo') }}</dt>
        <dd>{{ formatarNumero(cobertura.com_grupo) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('comparacaoLocal.semGrupo') }}</dt>
        <dd>{{ formatarNumero(cobertura.sem_grupo) }}</dd>
      </div>
      <div class="painel-resumo__item">
        <dt>{{ $t('comparacaoLocal.gruposInsuficientes') }}</dt>
        <dd>{{ formatarNumero(cobertura.grupos_insuficientes) }}</dd>
      </div>
    </dl>
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
