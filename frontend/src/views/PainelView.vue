<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AnaliseSection from '../components/AnaliseSection.vue'
import AvisoBanner from '../components/AvisoBanner.vue'
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
  useAnomalias,
  useMapa,
  useResumo,
  useSecoes,
  useTimeline,
} from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { candidatosNominais } from '../lib/agregacoes'

const router = useRouter()
const {
  store,
  eleicoesQuery,
  eleicoesDisponiveis,
  cargos,
  anos,
  turnos,
  filtros,
  aoCargo,
  aoAno,
  aoTurno,
  aoCandidato,
  aoCorte,
  aoUf,
  limparMunicipio,
  limpar,
} = useSelecaoEleicao()

const resumoQuery = useResumo()
const timelineQuery = useTimeline()
const analiseQuery = useAnalise()
const mapaQuery = useMapa()
const mapaUfQuery = useMapa('uf', {
  ignorarMunicipio: true,
  ignorarUf: true,
})
const secoesQuery = useSecoes()

const anomaliasRef = ref(null)
const anomaliasVisiveis = ref(false)
const anomaliasQuery = useAnomalias(anomaliasVisiveis)

onMounted(() => {
  if (!anomaliasRef.value || typeof IntersectionObserver === 'undefined') {
    anomaliasVisiveis.value = true
    return
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) {
        anomaliasVisiveis.value = true
        observador.disconnect()
      }
    },
    { rootMargin: '240px' },
  )

  observador.observe(anomaliasRef.value)
  onBeforeUnmount(() => observador.disconnect())
})

const candidatos = computed(() =>
  candidatosNominais(resumoQuery.data.value?.votos ?? []),
)
const candidatoSelecionado = computed(
  () =>
    candidatos.value.find(
      (candidato) => candidato.nr_votavel === store.candidato,
    ) ?? null,
)

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

      <section class="leituras" aria-label="Composição do recorte">
        <BiometriaPanel
          :dados="analiseQuery.data.value?.biometria ?? null"
          :votos-candidato="votosDoCandidato"
          :nome-candidato="candidatoSelecionado?.nm_votavel ?? ''"
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
        :zona="store.sectionZona"
        :secao="store.sectionSecao"
        :municipio-nome="store.sectionMunicipioNome"
        :page-size="store.sectionPageSize"
        :uf="store.uf"
        :municipio="store.municipio"
        @update:page="store.definirPagina"
        @update:page-size="store.definirTamanhoPagina"
        @update:status="store.definirStatusSecao"
        @update:zona="store.definirZonaSecao"
        @update:secao="store.definirNumeroSecao"
        @update:municipio-nome="store.definirMunicipioSecao"
        @select="abrirSecao"
        @retry="atualizarSecoes"
      />

      <div ref="anomaliasRef">
        <AnaliseSection
          :benford="analiseQuery.data.value?.benford ?? null"
          :anomalias="anomaliasQuery.data.value ?? null"
          :selecionado="store.candidato"
          :loading="anomaliasQuery.isLoading.value"
          :error="anomaliasQuery.error.value?.message ?? ''"
          @retry="anomaliasQuery.refetch()"
          @select="aoCandidato"
        />
      </div>
    </template>
  </div>
</template>
