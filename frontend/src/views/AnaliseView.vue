<script setup>
import AnaliseSection from '../components/AnaliseSection.vue'
import EstatisticaPanel from '../components/EstatisticaPanel.vue'
import TempoVotoPanel from '../components/TempoVotoPanel.vue'
import IncidentesPanel from '../components/IncidentesPanel.vue'
import { watch } from 'vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useAnalise, useAnomalias } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'

const { store, aoCandidato, eleicoesDisponiveis } = useSelecaoEleicao()

const ordBenford = useOrdenacao()
const ordOutliers = useOrdenacao()
const analiseQuery = useAnalise(ordBenford.ordenacao)
const anomaliasQuery = useAnomalias(null, ordOutliers.ordenacao)

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
    :ordenacao-outliers="ordOutliers.ordenacao.value"
    :ordenacao-benford="ordBenford.ordenacao.value"
    @retry="anomaliasQuery.refetch()"
    @select="aoCandidato"
    @ordenar-outliers="ordOutliers.alternar"
    @ordenar-benford="ordBenford.alternar"
  />
</template>
