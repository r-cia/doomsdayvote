<script setup>
import { computed, ref, watch } from 'vue'
import ComparacaoLocalGrupo from './ComparacaoLocalGrupo.vue'
import Paginacao from './Paginacao.vue'
import StateBlock from './StateBlock.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useComparacaoLocal } from '../composables/queries'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero } from '../lib/format'

const NIVEIS = { local: 'Local de votação', zona: 'Zona', municipio: 'Município' }

const store = useFiltersStore()
const pagina = ref(1)
const abertos = ref(new Set())
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
    g.identificacao.nr_zona && `zona ${g.identificacao.nr_zona}`,
    g.identificacao.nr_local_votacao && `local ${g.identificacao.nr_local_votacao}`,
  ]
    .filter((parte) => parte !== null && parte !== undefined && parte !== '')
    .join(' · ')
</script>

<template>
  <section class="painel" aria-labelledby="comparacao-local-titulo" :aria-busy="query.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Comparação local</p>
        <h2 id="comparacao-local-titulo">Grupos comparáveis</h2>
        <p v-if="query.data.value?.cobertura" class="painel__meta">
          {{ formatarNumero(query.data.value.total) }} grupos
        </p>
      </div>
    </header>

    <StateBlock v-if="query.isLoading.value" estado="carregando" titulo="Carregando grupos" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      titulo="Não foi possível carregar os grupos"
      :descricao="query.error.value.message"
      acao="Tentar novamente"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="grupos.length === 0" estado="vazio" titulo="Sem grupos no recorte" />
    <template v-else>
      <ul class="lista-grupos" :class="{ atualizando: query.isFetching.value }">
        <li v-for="g in grupos" :key="g.chave">
          <button
            type="button"
            class="button button--secondary"
            :aria-expanded="abertos.has(g.chave)"
            @click="alternarGrupo(g.chave)"
          >
            {{ NIVEIS[g.nivel] ?? g.nivel }} · {{ identificacao(g) }} · {{ formatarNumero(g.tamanho) }} seções
          </button>
          <span v-if="g.dados_insuficientes" class="chip chip--alert">Dados insuficientes</span>
          <ComparacaoLocalGrupo
            v-if="abertos.has(g.chave)"
            :chave="g.chave"
            :ordenacao="ordenacao"
            @ordenar="alternar"
          />
        </li>
      </ul>
      <Paginacao v-model:pagina="pagina" :total="query.data.value?.total ?? 0" :tamanho="query.data.value?.page_size ?? 50" />
    </template>
  </section>
</template>
