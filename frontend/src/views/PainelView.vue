<script setup>
import { computed, ref, watch } from 'vue'
import AvisoBanner from '../components/AvisoBanner.vue'
import BiometriaPanel from '../components/BiometriaPanel.vue'
import KpiCards from '../components/KpiCards.vue'
import PlacarRanking from '../components/PlacarRanking.vue'
import PlotDia from '../components/PlotDia.vue'
import StateBlock from '../components/StateBlock.vue'
import VotosPorEstadoPanel from '../components/VotosPorEstadoPanel.vue'
import { useAnalise, useMapa, useResumo, useTimeline } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { candidatosNominais } from '../lib/agregacoes'

const {
  store,
  aoCandidato,
  aoCorte,
} = useSelecaoEleicao()

const resumoQuery = useResumo()
const timelineQuery = useTimeline()
const analiseQuery = useAnalise()
const mapaUfQuery = useMapa('uf', {
  ignorarMunicipio: true,
  ignorarUf: true,
  incluirTodosCandidatos: true,
  candidatos: computed(() => {
    const lista = candidatosNominais(resumoQuery.data.value?.votos ?? [])
      .map((c) => c.nr_votavel)
      .filter((n) => n !== null && n !== undefined)
    return lista.join(',')
  }),
})

const corteAnterior = computed(() => {
  const pontos = timelineQuery.data.value?.pontos ?? []
  if (pontos.length === 0) return null
  const alvo = store.asOf ? new Date(store.asOf).getTime() : Infinity
  // previous point: last point with t < alvo
  let anterior = null
  for (const p of pontos) {
    const t = new Date(p.t).getTime()
    if (t < alvo) anterior = p.t
    else break
  }
  if (!anterior && pontos.length > 1) anterior = pontos[pontos.length - 2]?.t
  return anterior
})

const mapaUfAnteriorQuery = useMapa('uf', {
  ignorarMunicipio: true,
  ignorarUf: true,
  incluirTodosCandidatos: true,
  asOfOverride: corteAnterior,
  candidatos: computed(() => {
    const lista = candidatosNominais(resumoQuery.data.value?.votos ?? [])
      .map((c) => c.nr_votavel)
      .filter((n) => n !== null && n !== undefined)
    return lista.join(',')
  }),
})

watch(
  () => store.asOf,
  () => {
    resumoQuery.refetch()
    analiseQuery.refetch()
    mapaUfQuery.refetch()
  },
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
  ]) {
    if (vistos.has(aviso.codigo)) continue
    vistos.add(aviso.codigo)
    lista.push(aviso)
  }
  return lista
})

const timelineAvisos = computed(() => timelineQuery.data.value?.avisos ?? [])
</script>

<template>
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

  <VotosPorEstadoPanel
    :key="`${store.asOf ?? 'final'}-${store.cargo}-${store.electionId}-${(candidatos || []).map(c=>c.nr_votavel).join(',')}`"
    :areas="mapaUfQuery.data.value?.areas ?? []"
    :areas-anteriores="mapaUfAnteriorQuery.data.value?.areas ?? []"
    :candidatos="resumoQuery.data.value?.votos ?? []"
  />
</template>
