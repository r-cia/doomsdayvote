<script setup>
import AnaliseSection from '../components/AnaliseSection.vue'
import StateBlock from '../components/StateBlock.vue'
import EstatisticaPanel from '../components/EstatisticaPanel.vue'
import { ref, watch } from 'vue'
import { useAnalise, useAnomalias } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'

const { store, aoCandidato, eleicoesDisponiveis } = useSelecaoEleicao()

const ordenacao = ref('if')
const analiseQuery = useAnalise()
const anomaliasQuery = useAnomalias(null, ordenacao)

watch(
  () => store.asOf,
  () => {
    analiseQuery.refetch()
    anomaliasQuery.refetch()
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
</template>
