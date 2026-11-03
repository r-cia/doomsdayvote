<script setup>
import { computed, ref, watch } from 'vue'
import IncidentesPanel from '../components/IncidentesPanel.vue'
import TempoBiometriaPanel from '../components/TempoBiometriaPanel.vue'
import { useTotalizacaoIncidentes, useTotalizacaoMetricas } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'

const TAMANHO_PAGINA = 25

const { filtros } = useSelecaoEleicao()

const recorte = computed(() => ({
  ano: filtros.value.ano,
  turno: filtros.value.turno,
  uf: filtros.value.uf,
  municipio: filtros.value.municipio,
}))

const paginaIncidentes = ref(1)

const metricasQuery = useTotalizacaoMetricas(recorte)
const incidentesQuery = useTotalizacaoIncidentes(recorte, {
  pagina: paginaIncidentes,
  tamanho: TAMANHO_PAGINA,
})

watch(
  recorte,
  () => {
    paginaIncidentes.value = 1
  },
  { deep: true },
)
</script>

<template>
  <TempoBiometriaPanel
    :metricas="metricasQuery.data.value ?? null"
    :loading="metricasQuery.isLoading.value"
    :atualizando="metricasQuery.isFetching.value"
    :error="metricasQuery.error.value?.message ?? ''"
    @retry="metricasQuery.refetch()"
  />

  <IncidentesPanel
    :dados="incidentesQuery.data.value ?? null"
    :loading="incidentesQuery.isLoading.value"
    :atualizando="incidentesQuery.isFetching.value"
    :error="incidentesQuery.error.value?.message ?? ''"
    :tamanho="TAMANHO_PAGINA"
    @retry="incidentesQuery.refetch()"
    @update:page="paginaIncidentes = $event"
  />
</template>
