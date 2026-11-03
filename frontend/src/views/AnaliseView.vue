<script setup>
import AnaliseSection from '../components/AnaliseSection.vue'
import EstatisticaPanel from '../components/EstatisticaPanel.vue'
import TempoVotoPanel from '../components/TempoVotoPanel.vue'
import IncidentesPanel from '../components/IncidentesPanel.vue'
import { computed, ref, watch } from 'vue'
import { useAnalise, useAnomalias } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'

const { store, aoCandidato, eleicoesDisponiveis } = useSelecaoEleicao()

const ordenacao = ref('if')
const analiseQuery = useAnalise()
const anomaliasQuery = useAnomalias(
  null,
  computed(() => ({ ordem: ordenacao.value === 'lof' ? 'score_lof' : 'score_if', direcao: 'desc' })),
)

watch(
  () => store.asOf,
  () => {
    analiseQuery.refetch()
    anomaliasQuery.refetch()
  },
)


</script>

<template>
  <EstatisticaPanel
    :eleicoes-disponiveis="eleicoesDisponiveis"
    :election-id="store.electionId"
  />

  <TempoVotoPanel />

  <IncidentesPanel />

  <AnaliseSection
    :benford="analiseQuery.data.value?.benford ?? null"
    :anomalias="anomaliasQuery.data.value ?? null"
    :selecionado="store.candidato"
    :loading="anomaliasQuery.isLoading.value"
    :error="anomaliasQuery.error.value?.message ?? ''"
    :ordenacao="ordenacao"
    @retry="anomaliasQuery.refetch()"
    @select="aoCandidato"
    @update:ordenacao="ordenacao = $event"
  />
</template>
