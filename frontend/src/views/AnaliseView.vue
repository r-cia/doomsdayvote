<script setup>
import AnaliseBloco from '../components/AnaliseBloco.vue'
import EstatisticaPanel from '../components/EstatisticaPanel.vue'
import ExibirSobDemanda from '../components/ExibirSobDemanda.vue'
import IncidentesPanel from '../components/IncidentesPanel.vue'
import TempoVotoPanel from '../components/TempoVotoPanel.vue'
import { useSelecaoEleicao } from '../composables/selecao'

const { store, eleicoesDisponiveis } = useSelecaoEleicao()
</script>

<template>
  <EstatisticaPanel
    :eleicoes-disponiveis="eleicoesDisponiveis"
    :election-id="store.electionId"
  />

  <ExibirSobDemanda>
    <TempoVotoPanel />
  </ExibirSobDemanda>

  <IncidentesPanel />

  <ExibirSobDemanda alturaMinima="320px">
    <AnaliseBloco />
  </ExibirSobDemanda>
</template>
