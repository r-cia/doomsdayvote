<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AvisoBanner from '../components/AvisoBanner.vue'
import FilterBar from '../components/FilterBar.vue'
import KpiCards from '../components/KpiCards.vue'
import MapPanel from '../components/MapPanel.vue'
import SectionsTable from '../components/SectionsTable.vue'
import StateBlock from '../components/StateBlock.vue'
import TimelinePanel from '../components/TimelinePanel.vue'
import UfPanel from '../components/UfPanel.vue'
import {
  useEleicoes,
  useMapa,
  useResumo,
  useSecoes,
  useTimeline,
} from '../composables/queries'
import { candidatosNominais } from '../lib/agregacoes'
import { formatarCorte } from '../lib/format'
import { useFiltersStore } from '../stores/filters'

const store = useFiltersStore()
const router = useRouter()

const eleicoesQuery = useEleicoes()
const resumoQuery = useResumo()
const mapaQuery = useMapa()
const mapaUfQuery = useMapa('uf', {
  ignorarMunicipio: true,
  ignorarUf: true,
})
const timelineQuery = useTimeline()
const secoesQuery = useSecoes()

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
const candidatoSelecionado = computed(
  () =>
    candidatos.value.find(
      (candidato) => candidato.nr_votavel === store.candidato,
    ) ?? null,
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

function selecionarUf(uf) {
  store.definirUf(uf)
}

function verMunicipios(uf) {
  store.definirUf(uf)
  store.definirNivel('municipio')
  document.querySelector('.mapa-card')?.scrollIntoView({ block: 'start' })
}

function abrirSecao(item) {
  router.push({
    name: 'secao',
    params: { id: item.id },
    query: {
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf ?? undefined,
      uf: store.uf ?? undefined,
      municipio: store.municipio ?? undefined,
    },
  })
}

function atualizarMapa() {
  mapaQuery.refetch()
  mapaUfQuery.refetch()
}

function atualizarSecoes() {
  secoesQuery.refetch()
}
</script>

<template>
  <div class="page">
    <header class="page__cabecalho">
      <div>
        <p class="eyebrow">Auditoria pós-eleição</p>
        <h1>Painel de auditoria</h1>
        <p class="page__descricao">
          Consulte votos, seções com BU, mapa por UF e detalhe de seções a partir
          dos BUs carregados manualmente.
        </p>
      </div>
      <div class="page__corte">
        <span class="rotulo-menor">Corte atual</span>
        <strong>{{ formatarCorte(resumoQuery.data.value?.corte) }}</strong>
      </div>
    </header>

    <StateBlock
      v-if="eleicoesQuery.isLoading.value"
      estado="carregando"
      titulo="Carregando eleições"
      descricao="Consultando a API local."
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

      <AvisoBanner :avisos="avisos" />

      <StateBlock
        v-if="resumoQuery.error.value"
        estado="erro"
        titulo="Não foi possível carregar o resumo"
        :descricao="resumoQuery.error.value.message"
        acao="Tentar novamente"
        @acao="resumoQuery.refetch()"
      />
      <StateBlock
        v-else-if="resumoQuery.isLoading.value && !resumoQuery.data.value"
        estado="carregando"
        titulo="Carregando indicadores"
      />
      <KpiCards
        v-else-if="resumoQuery.data.value"
        :resumo="resumoQuery.data.value"
        :candidato="candidatoSelecionado"
      />

      <div class="painel-grade">
        <MapPanel
          :areas="mapaQuery.data.value?.areas ?? []"
          :nivel="store.mapLevel"
          :modo="store.mapMode"
          :candidato="store.candidato"
          :candidatos="candidatos"
          :uf="store.uf"
          :loading="mapaQuery.isLoading.value"
          :error="mapaQuery.error.value?.message ?? ''"
          altura="420px"
          @update:level="store.definirNivel"
          @update:mode="store.definirModo"
          @select="selecionarNoMapa"
          @retry="atualizarMapa"
        />

        <UfPanel
          :areas="mapaUfQuery.data.value?.areas ?? []"
          :candidatos="candidatos"
          :loading="mapaUfQuery.isLoading.value"
          :error="mapaUfQuery.error.value?.message ?? ''"
          :uf-selecionada="store.uf"
          @select="selecionarUf"
          @municipios="verMunicipios"
          @retry="atualizarMapa"
        />
      </div>

      <TimelinePanel
        :data="timelineQuery.data.value"
        :loading="timelineQuery.isLoading.value"
        :error="timelineQuery.error.value?.message ?? ''"
        :granularity="store.timelineGranularity"
        @update:granularity="store.definirGranularidade"
        @retry="timelineQuery.refetch()"
      />

      <SectionsTable
        :data="secoesQuery.data.value"
        :loading="secoesQuery.isLoading.value"
        :error="secoesQuery.error.value?.message ?? ''"
        :status="store.sectionStatus"
        :busca="store.sectionBusca"
        :page-size="store.sectionPageSize"
        :uf="store.uf"
        :municipio="store.municipio"
        @update:page="store.definirPagina"
        @update:page-size="store.definirTamanhoPagina"
        @update:status="store.definirStatusSecao"
        @update:busca="store.definirBuscaSecao"
        @select="abrirSecao"
        @retry="atualizarSecoes"
      />
    </template>
  </div>
</template>
