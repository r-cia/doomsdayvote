<script setup>
import ComparacaoLocalPanel from '../components/ComparacaoLocalPanel.vue'
import StateBlock from '../components/StateBlock.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useComparacaoLocal } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'

const { store } = useSelecaoEleicao()
const ordenacao = useOrdenacao()
const comparacaoLocalQuery = useComparacaoLocal(ordenacao.params)
</script>

<template>
  <StateBlock
    v-if="store.governadorSemUf"
    estado="vazio"
    titulo="Selecione um estado"
    descricao="Resultados de governador são específicos por estado."
  />

  <ComparacaoLocalPanel
    :dados="comparacaoLocalQuery.data.value ?? null"
    :loading="comparacaoLocalQuery.isLoading.value"
    :atualizando="comparacaoLocalQuery.isFetching.value"
    :error="comparacaoLocalQuery.error.value?.message ?? ''"
    :ordenacao="ordenacao"
    @retry="comparacaoLocalQuery.refetch()"
  />
</template>
