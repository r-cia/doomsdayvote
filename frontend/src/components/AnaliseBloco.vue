<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AnaliseSection from './AnaliseSection.vue'
import Cobertura from './Cobertura.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useAnalise, useAnomalias } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarNumero } from '../lib/format'

const { t } = useI18n()
const { store, aoCandidato } = useSelecaoEleicao()

const ordBenford = useOrdenacao()
const ordOutliers = useOrdenacao()
const analiseQuery = useAnalise(ordBenford.ordenacao)
const ordNiveis = useOrdenacao()
const anomaliasQuery = useAnomalias(null, { '': ordOutliers.ordenacao, _benford: ordNiveis.ordenacao })

const itensCobertura = computed(() => {
  const a = analiseQuery.data.value?.cobertura
  const n = anomaliasQuery.data.value?.cobertura
  const lista = []
  if (a) {
    lista.push(
      { rotulo: t('cobertura.consideradas'), valor: formatarNumero(a.consideradas) },
      { rotulo: t('cobertura.busSemAptos'), valor: formatarNumero(a.bus_sem_aptos) },
      { rotulo: t('cobertura.busSemComparecimento'), valor: formatarNumero(a.bus_sem_comparecimento) },
      { rotulo: t('cobertura.busSemAbstencoes'), valor: formatarNumero(a.bus_sem_abstencoes) },
      { rotulo: t('cobertura.busSemBiometria'), valor: formatarNumero(a.bus_sem_biometria) },
      { rotulo: t('cobertura.abaixoMinimoBenford'), valor: formatarNumero(a.secoes_abaixo_minimo_benford) },
    )
  }
  if (n) {
    lista.push(
      { rotulo: t('cobertura.duplicacaoGrupos'), valor: formatarNumero(n.duplicacao_grupos) },
      { rotulo: t('cobertura.duplicacaoSecoes'), valor: formatarNumero(n.duplicacao_secoes) },
      { rotulo: t('cobertura.duplicacaoEscopo'), valor: formatarNumero(n.duplicacao_secoes_escopo) },
    )
  }
  return lista
})
</script>

<template>
  <AnaliseSection
    :benford="analiseQuery.data.value?.benford ?? null"
    :anomalias="anomaliasQuery.data.value ?? null"
    :selecionado="store.candidato"
    :loading="anomaliasQuery.isLoading.value"
    :error="analiseQuery.error.value?.message ?? anomaliasQuery.error.value?.message ?? ''"
    :ordenacao-outliers="ordOutliers.ordenacao.value"
    :ordenacao-benford="ordBenford.ordenacao.value"
    :ordenacao-niveis="ordNiveis.ordenacao.value"
    @retry="() => { analiseQuery.refetch(); anomaliasQuery.refetch() }"
    @select="aoCandidato"
    @ordenar-outliers="ordOutliers.alternar"
    @ordenar-benford="ordBenford.alternar"
    @ordenar-niveis="ordNiveis.alternar"
  />
  <Cobertura :itens="itensCobertura" />
</template>
