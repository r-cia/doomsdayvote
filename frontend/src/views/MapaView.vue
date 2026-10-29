<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AvisoBanner from '../components/AvisoBanner.vue'
import FilterBar from '../components/FilterBar.vue'
import MapPanel from '../components/MapPanel.vue'
import StateBlock from '../components/StateBlock.vue'
import {
  useEleicoes,
  useMapa,
  useResumo,
} from '../composables/queries'
import { candidatosNominais } from '../lib/agregacoes'
import { formatarCorte } from '../lib/format'
import { useFiltersStore } from '../stores/filters'

const store = useFiltersStore()
const router = useRouter()

const eleicoesQuery = useEleicoes()
const resumoQuery = useResumo()
const mapaQuery = useMapa()

const eleicoes = computed(() => eleicoesQuery.data.value?.eleicoes ?? [])
const eleicoesDisponiveis = computed(() =>
  eleicoes.value.filter((eleicao) =>
    eleicao.cargos?.some((cargo) =>
      ['Presidente', 'Governador'].includes(cargo.ds_cargo_pergunta),
    ),
  ),
)
const eleicaoAtual = computed(() =>
  eleicoesDisponiveis.value.find((eleicao) => eleicao.id === store.electionId),
)
const cargos = computed(
  () =>
    eleicaoAtual.value?.cargos?.filter((cargo) =>
      ['Presidente', 'Governador'].includes(cargo.ds_cargo_pergunta),
    ) ?? [],
)
const turnos = computed(() =>
  [...new Set(eleicoesDisponiveis.value.map((eleicao) => eleicao.nr_turno))].sort(
    (a, b) => a - b,
  ),
)
const candidatos = computed(() =>
  candidatosNominais(resumoQuery.data.value?.votos ?? []),
)
const filtros = computed(() => ({
  electionId: store.electionId,
  cargo: store.cargo,
  turno: store.turno,
  candidato: store.candidato,
  asOfInput: store.asOfInput,
  uf: store.uf,
  municipio: store.municipio,
}))
const avisos = computed(() => [
  ...(resumoQuery.data.value?.avisos ?? []),
  ...(mapaQuery.data.value?.avisos ?? []),
])

function aoEleicao(id) {
  const eleicao = eleicoesDisponiveis.value.find((item) => item.id === id)
  if (eleicao) store.definirEleicao(eleicao)
}

function aoTurno(turno) {
  store.definirTurno(turno, eleicoesDisponiveis.value)
}

function aoCargo(cargo) {
  store.definirCargo(cargo)
}

function aoCandidato(candidato) {
  store.definirCandidato(candidato)
}

function aoCorte(valor) {
  store.definirCorte(valor)
}

function aoUf(uf) {
  store.definirUf(uf)
}

function limparMunicipio() {
  store.definirMunicipio(null)
}

function limpar() {
  store.limpar()
}

function selecionarNoMapa(selecao) {
  if (!selecao) return
  if (selecao.tipo === 'uf') {
    store.definirUf(selecao.valor)
    return
  }
  store.definirUf(selecao.uf)
  store.definirMunicipio(selecao.valor)
}

function verSecoes() {
  router.push({ name: 'painel' })
}
</script>

<template>
  <div class="page">
    <header class="page__cabecalho">
      <div>
        <p class="eyebrow">Mapa</p>
        <h1>Mapa por UF e município</h1>
        <p class="page__descricao">
          Modos líder e percentual, com dez faixas de dez pontos. A tabela
          alternativa traz os mesmos dados e navegação por teclado.
        </p>
      </div>
      <div class="page__acoes">
        <span class="page__corte">
          <span class="rotulo-menor">Corte atual</span>
          <strong>{{ formatarCorte(mapaQuery.data.value?.corte) }}</strong>
        </span>
        <button type="button" class="button button--secondary" @click="verSecoes">
          Ver painel e seções
        </button>
      </div>
    </header>

    <StateBlock
      v-if="eleicoesQuery.isLoading.value"
      estado="carregando"
      titulo="Carregando eleições"
    />
    <StateBlock
      v-else-if="eleicoesQuery.error.value"
      estado="erro"
      titulo="Não foi possível carregar as eleições"
      :descricao="eleicoesQuery.error.value.message"
      acao="Tentar novamente"
      @acao="eleicoesQuery.refetch()"
    />
    <StateBlock
      v-else-if="eleicoesDisponiveis.length === 0"
      estado="vazio"
      titulo="Nenhuma eleição disponível"
      descricao="Carregue os BUs pelo backend e recarregue esta página."
    />

    <template v-else>
      <FilterBar
        :eleicoes="eleicoesDisponiveis"
        :cargos="cargos"
        :turnos="turnos"
        :candidatos="candidatos"
        :filtros="filtros"
        @update:election="aoEleicao"
        @update:turno="aoTurno"
        @update:cargo="aoCargo"
        @update:candidato="aoCandidato"
        @update:asof="aoCorte"
        @update:uf="aoUf"
        @clear-municipio="limparMunicipio"
        @clear="limpar"
      />

      <div class="mapa-contexto">
        <span class="chip">UF: {{ store.uf ?? 'todas' }}</span>
        <span v-if="store.municipio" class="chip">
          Município: {{ store.municipio }}
          <button
            type="button"
            class="chip__remover"
            aria-label="Remover filtro de município"
            @click="limparMunicipio"
          >
            ×
          </button>
        </span>
        <button
          v-if="store.uf"
          type="button"
          class="button button--ghost button--compacto"
          @click="store.definirUf(null)"
        >
          Limpar UF
        </button>
      </div>

      <AvisoBanner :avisos="avisos" />

      <MapPanel
        :areas="mapaQuery.data.value?.areas ?? []"
        :nivel="store.mapLevel"
        :modo="store.mapMode"
        :candidato="store.candidato"
        :candidatos="candidatos"
        :uf="store.uf"
        :loading="mapaQuery.isLoading.value"
        :error="mapaQuery.error.value?.message ?? ''"
        altura="600px"
        @update:level="store.definirNivel"
        @update:mode="store.definirModo"
        @select="selecionarNoMapa"
        @retry="mapaQuery.refetch()"
      />
    </template>
  </div>
</template>
