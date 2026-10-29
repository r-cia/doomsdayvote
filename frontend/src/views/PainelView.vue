<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AvisoBanner from '../components/AvisoBanner.vue'
import BenfordPanel from '../components/BenfordPanel.vue'
import BiometriaPanel from '../components/BiometriaPanel.vue'
import FilterBar from '../components/FilterBar.vue'
import KpiCards from '../components/KpiCards.vue'
import MapPanel from '../components/MapPanel.vue'
import PlacarRanking from '../components/PlacarRanking.vue'
import PlotDia from '../components/PlotDia.vue'
import SectionsTable from '../components/SectionsTable.vue'
import StateBlock from '../components/StateBlock.vue'
import UfPanel from '../components/UfPanel.vue'
import {
  useAnalise,
  useEleicoes,
  useMapa,
  useResumo,
  useSecoes,
  useTimeline,
} from '../composables/queries'
import { candidatosNominais } from '../lib/agregacoes'
import { useFiltersStore } from '../stores/filters'

const store = useFiltersStore()
const router = useRouter()

const eleicoesQuery = useEleicoes()
const resumoQuery = useResumo()
const timelineQuery = useTimeline()
const analiseQuery = useAnalise()
const mapaQuery = useMapa()
const mapaUfQuery = useMapa('uf', {
  ignorarMunicipio: true,
  ignorarUf: true,
})
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

const ORDEM_CARGOS = { Presidente: 0, Governador: 1 }

const cargos = computed(() => {
  const mapa = new Map()
  for (const eleicao of eleicoesDisponiveis.value) {
    for (const cargo of eleicao.cargos ?? []) {
      if (!(cargo.ds_cargo_pergunta in ORDEM_CARGOS)) continue
      mapa.set(cargo.cd_cargo_pergunta, cargo.ds_cargo_pergunta)
    }
  }
  return [...mapa.entries()]
    .map(([cd, ds]) => ({ cd_cargo_pergunta: cd, ds_cargo_pergunta: ds }))
    .sort(
      (a, b) =>
        (ORDEM_CARGOS[a.ds_cargo_pergunta] ?? 9) -
        (ORDEM_CARGOS[b.ds_cargo_pergunta] ?? 9),
    )
})

const eleicoesDoCargo = computed(() =>
  eleicoesDisponiveis.value.filter((eleicao) =>
    (eleicao.cargos ?? []).some(
      (cargo) => cargo.cd_cargo_pergunta === store.cargo,
    ),
  ),
)

const anos = computed(() =>
  [...new Set(eleicoesDoCargo.value.map((eleicao) => eleicao.ano_eleicao))].sort(
    (a, b) => b - a,
  ),
)

const turnos = computed(() =>
  [
    ...new Set(
      eleicoesDoCargo.value
        .filter((eleicao) => eleicao.ano_eleicao === eleicaoAtual.value?.ano_eleicao)
        .map((eleicao) => eleicao.nr_turno),
    ),
  ].sort((a, b) => a - b),
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
  ano: eleicaoAtual.value?.ano_eleicao ?? null,
  cargo: store.cargo,
  turno: store.turno,
  candidato: store.candidato,
  asOfInput: store.asOfInput,
  uf: store.uf,
  municipio: store.municipio,
}))

const votosDoCandidato = computed(() => {
  if (!candidatoSelecionado.value) return null
  const linha = (resumoQuery.data.value?.votos ?? []).find(
    (voto) =>
      voto.categoria === 'nominal' &&
      voto.nr_votavel === candidatoSelecionado.value.nr_votavel,
  )
  return linha ? Number(linha.qt_votos) : 0
})

const avisos = computed(() => {
  const vistos = new Set()
  const lista = []
  for (const aviso of [
    ...(resumoQuery.data.value?.avisos ?? []),
    ...(analiseQuery.data.value?.avisos ?? []),
    ...(mapaQuery.data.value?.avisos ?? []),
  ]) {
    if (vistos.has(aviso.codigo)) continue
    vistos.add(aviso.codigo)
    lista.push(aviso)
  }
  return lista
})

const timelineAvisos = computed(() => timelineQuery.data.value?.avisos ?? [])

function eleicaoPara(cargo, ano, turno) {
  const opcoes = eleicoesDisponiveis.value.filter((eleicao) =>
    (eleicao.cargos ?? []).some(
      (item) => item.cd_cargo_pergunta === cargo,
    ),
  )
  return (
    opcoes.find(
      (eleicao) => eleicao.ano_eleicao === ano && eleicao.nr_turno === turno,
    ) ??
    opcoes.find((eleicao) => eleicao.ano_eleicao === ano) ??
    opcoes[0] ??
    null
  )
}

function aplicarEleicao(eleicao, cargo) {
  if (!eleicao) return
  store.definirEleicao(eleicao)
  store.definirCargo(cargo)
}

function aoCargo(cargo) {
  aplicarEleicao(
    eleicaoPara(cargo, eleicaoAtual.value?.ano_eleicao, eleicaoAtual.value?.nr_turno),
    cargo,
  )
}

function aoAno(ano) {
  aplicarEleicao(
    eleicaoPara(store.cargo, ano, eleicaoAtual.value?.nr_turno),
    store.cargo,
  )
}

function aoTurno(turno) {
  aplicarEleicao(
    eleicaoPara(store.cargo, eleicaoAtual.value?.ano_eleicao, turno),
    store.cargo,
  )
}

function aoCandidato(candidato) {
  const numero = candidato === null || candidato === undefined ? null : Number(candidato)
  store.definirCandidato(store.candidato === numero ? null : numero)
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
  <div class="sala">
    <h1 class="sr-only">Conferência de boletins de urna</h1>

    <StateBlock
      v-if="eleicoesQuery.isLoading.value"
      estado="carregando"
      titulo="Abrindo a sala"
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
        :cargos="cargos"
        :anos="anos"
        :turnos="turnos"
        :candidatos="candidatos"
        :filtros="filtros"
        @update:cargo="aoCargo"
        @update:ano="aoAno"
        @update:turno="aoTurno"
        @update:candidato="aoCandidato"
        @update:asof="aoCorte"
        @update:uf="aoUf"
        @clear-municipio="limparMunicipio"
        @clear="limpar"
      />

      <KpiCards
        v-if="resumoQuery.data.value"
        :resumo="resumoQuery.data.value"
        :candidato="candidatoSelecionado"
      />

      <AvisoBanner v-if="avisos.length > 0" :avisos="avisos" />

      <StateBlock
        v-if="resumoQuery.error.value"
        estado="erro"
        titulo="Não foi possível carregar o resumo"
        :descricao="resumoQuery.error.value.message"
        acao="Tentar novamente"
        @acao="resumoQuery.refetch()"
      />

      <section class="mesa" aria-label="Mesa de plotagem e placar">
        <PlotDia
          :series="timelineQuery.data.value?.series ?? []"
          :pontos="timelineQuery.data.value?.pontos ?? []"
          :corte="store.asOf"
          :candidato="store.candidato"
          :candidatos="candidatos"
          :avisos="timelineAvisos"
          @update:corte="aoCorte"
        />

        <PlacarRanking
          :votos="resumoQuery.data.value?.votos ?? []"
          :series="timelineQuery.data.value?.series ?? []"
          :corte="store.asOf"
          :selecionado="store.candidato"
          @select="aoCandidato"
        />
      </section>

      <section class="leituras" aria-label="Biometria e Benford">
        <BiometriaPanel
          :dados="analiseQuery.data.value?.biometria ?? null"
          :votos-candidato="votosDoCandidato"
          :nome-candidato="candidatoSelecionado?.nm_votavel ?? ''"
        />

        <BenfordPanel
          :dados="analiseQuery.data.value?.benford ?? null"
          :selecionado="store.candidato"
          @select="aoCandidato"
        />
      </section>

      <section id="mapa" class="malha" aria-label="Mapa e leitura por UF">
        <MapPanel
          :areas="mapaQuery.data.value?.areas ?? []"
          :nivel="store.mapLevel"
          :modo="store.mapMode"
          :candidato="store.candidato"
          :candidatos="candidatos"
          :uf="store.uf"
          :loading="mapaQuery.isLoading.value"
          :error="mapaQuery.error.value?.message ?? ''"
          altura="630px"
          @update:level="store.definirNivel"
          @update:mode="store.definirModo"
          @select="selecionarNoMapa"
          @retry="atualizarMapa"
        />

        <UfPanel
          :areas="mapaUfQuery.data.value?.areas ?? []"
          :candidatos="candidatos"
          :votos="resumoQuery.data.value?.votos ?? []"
          :loading="mapaUfQuery.isLoading.value"
          :error="mapaUfQuery.error.value?.message ?? ''"
          :uf-selecionada="store.uf"
          @select="selecionarUf"
          @municipios="verMunicipios"
          @retry="atualizarMapa"
          @limpar="store.definirUf(null)"
        />
      </section>

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
