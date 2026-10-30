<script setup>
import AnaliseSection from '../components/AnaliseSection.vue'
import StateBlock from '../components/StateBlock.vue'
import EstatisticaPanel from '../components/EstatisticaPanel.vue'
import ConsistenciaPanel from '../components/ConsistenciaPanel.vue'
import ComparacaoLocalPanel from '../components/ComparacaoLocalPanel.vue'
import ConcentracaoPanel from '../components/ConcentracaoPanel.vue'
import { ref, watch } from 'vue'
import { useAnalise, useAnomalias, useConsistencia, useComparacaoLocal, useConcentracao } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'

const { store, aoCandidato, eleicoesDisponiveis } = useSelecaoEleicao()

const ordenacao = ref('if')
const analiseQuery = useAnalise()
const anomaliasQuery = useAnomalias(null, ordenacao)
const consistenciaQuery = useConsistencia()
const comparacaoLocalQuery = useComparacaoLocal()
const concentracaoQuery = useConcentracao()

watch(
  () => store.asOf,
  () => {
    analiseQuery.refetch()
    anomaliasQuery.refetch()
    consistenciaQuery.refetch()
    comparacaoLocalQuery.refetch()
    concentracaoQuery.refetch()
  },
)


</script>

<template>
  <StateBlock
    v-if="store.governadorSemUf"
    estado="vazio"
    titulo="Selecione um estado"
    descricao="Resultados de governador são específicos por estado."
  />

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
    :ordenacao="ordenacao"
    @retry="anomaliasQuery.refetch()"
    @select="aoCandidato"
    @update:ordenacao="ordenacao = $event"
  />

  <ConsistenciaPanel
    :dados="consistenciaQuery.data.value ?? null"
    :loading="consistenciaQuery.isLoading.value"
    :error="consistenciaQuery.error.value?.message ?? ''"
    @retry="consistenciaQuery.refetch()"
  />

  <ComparacaoLocalPanel
    :dados="comparacaoLocalQuery.data.value ?? null"
    :loading="comparacaoLocalQuery.isLoading.value"
    :error="comparacaoLocalQuery.error.value?.message ?? ''"
    @retry="comparacaoLocalQuery.refetch()"
  />

  <ConcentracaoPanel
    :dados="concentracaoQuery.data.value ?? null"
    :loading="concentracaoQuery.isLoading.value"
    :error="concentracaoQuery.error.value?.message ?? ''"
    @retry="concentracaoQuery.refetch()"
  />
</template>
