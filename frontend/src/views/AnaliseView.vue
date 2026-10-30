<script setup>
import AnaliseSection from '../components/AnaliseSection.vue'
import AnaliseCobertura from '../components/AnaliseCobertura.vue'
import StateBlock from '../components/StateBlock.vue'
import EstatisticaPanel from '../components/EstatisticaPanel.vue'
import ConsistenciaPanel from '../components/ConsistenciaPanel.vue'
import ConcentracaoPanel from '../components/ConcentracaoPanel.vue'
import { computed, watch } from 'vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useAnalise, useAnomalias, useConsistencia, useConcentracao } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'

const { store, aoCandidato, eleicoesDisponiveis } = useSelecaoEleicao()

const ordenacoes = {
  benford: useOrdenacao(),
  outliers: useOrdenacao(),
  duplicacao: useOrdenacao('duplicacao'),
  niveis: useOrdenacao('benford'),
}
const ordemConsistencia = useOrdenacao()
const ordemShare = useOrdenacao('share')
const ordemMargem = useOrdenacao('margem')

const analiseQuery = useAnalise(ordenacoes.benford.params)
const anomaliasQuery = useAnomalias(
  null,
  computed(() => ({
    ...ordenacoes.outliers.params.value,
    ...ordenacoes.duplicacao.params.value,
    ...ordenacoes.niveis.params.value,
  })),
)
const consistenciaQuery = useConsistencia(null, ordemConsistencia.params)
const concentracaoQuery = useConcentracao(
  computed(() => ({ ...ordemShare.params.value, ...ordemMargem.params.value })),
)

watch(
  () => store.asOf,
  () => {
    analiseQuery.refetch()
    anomaliasQuery.refetch()
    consistenciaQuery.refetch()
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
    :benford-loading="analiseQuery.isLoading.value"
    :anomalias="anomaliasQuery.data.value ?? null"
    :selecionado="store.candidato"
    :loading="anomaliasQuery.isLoading.value"
    :error="anomaliasQuery.error.value?.message ?? ''"
    :ordenacoes="ordenacoes"
    @retry="anomaliasQuery.refetch()"
    @select="aoCandidato"
  />

  <AnaliseCobertura
    :cobertura="analiseQuery.data.value?.cobertura ?? null"
    :minimo-benford="analiseQuery.data.value?.benford?.minimo_votos ?? 10"
  />

  <ConsistenciaPanel
    :dados="consistenciaQuery.data.value ?? null"
    :loading="consistenciaQuery.isLoading.value"
    :error="consistenciaQuery.error.value?.message ?? ''"
    :ordenacao="ordemConsistencia"
    @retry="consistenciaQuery.refetch()"
  />

  <ConcentracaoPanel
    :dados="concentracaoQuery.data.value ?? null"
    :loading="concentracaoQuery.isLoading.value"
    :error="concentracaoQuery.error.value?.message ?? ''"
    :ordenacao-share="ordemShare"
    :ordenacao-margem="ordemMargem"
    @retry="concentracaoQuery.refetch()"
  />
</template>
