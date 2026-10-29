<script setup>
import AnaliseSection from '../components/AnaliseSection.vue'
import EstatisticaPanel from '../components/EstatisticaPanel.vue'
import { useAnalise, useAnomalias } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'

const { store, aoCandidato, eleicoesDisponiveis } = useSelecaoEleicao()

const analiseQuery = useAnalise()
const anomaliasQuery = useAnomalias()
</script>

<template>
  <EstatisticaPanel
    :eleicoes-disponiveis="eleicoesDisponiveis"
    :election-id="store.electionId"
  />

  <AnaliseSection
    :benford="analiseQuery.data.value?.benford ?? null"
    :anomalias="anomaliasQuery.data.value ?? null"
    :selecionado="store.candidato"
    :loading="anomaliasQuery.isLoading.value"
    :error="anomaliasQuery.error.value?.message ?? ''"
    @retry="anomaliasQuery.refetch()"
    @select="aoCandidato"
  />
</template>
