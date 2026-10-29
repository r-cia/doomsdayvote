<script setup>
import { computed } from 'vue'
import AvisoBanner from '../components/AvisoBanner.vue'
import BenfordNiveisPanel from '../components/BenfordNiveisPanel.vue'
import DuplicacaoPanel from '../components/DuplicacaoPanel.vue'
import FilterBar from '../components/FilterBar.vue'
import OutliersPanel from '../components/OutliersPanel.vue'
import StateBlock from '../components/StateBlock.vue'
import { useAnomalias } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'

const {
  store,
  eleicoesQuery,
  eleicoesDisponiveis,
  cargos,
  anos,
  turnos,
  filtros,
  aoCargo,
  aoAno,
  aoTurno,
  aoCandidato,
  aoCorte,
  aoUf,
  limparMunicipio,
  limpar,
} = useSelecaoEleicao()

const anomaliasQuery = useAnomalias()
const avisos = computed(() => anomaliasQuery.data.value?.avisos ?? [])
</script>

<template>
  <div class="sala">
    <h1 class="sr-only">Auditoria estatística</h1>

    <StateBlock
      v-if="eleicoesQuery.isLoading.value"
      estado="carregando"
      titulo="Abrindo a auditoria"
      descricao="Consultando a API local."
    />
    <StateBlock
      v-else-if="eleicoesQuery.error.value"
      estado="erro"
      titulo="Não foi possível carregar as eleições"
      :descricao="eleicoesQuery.error.value.message"
      acao="Tentar novamente"
      @acao="eleicoesQuery.refetch()"
    />
    <StateBlock
      v-else-if="eleicoesDisponiveis.length === 0"
      estado="vazio"
      titulo="Nenhuma eleição disponível"
    />

    <template v-else>
      <FilterBar
        :cargos="cargos"
        :anos="anos"
        :turnos="turnos"
        :candidatos="[]"
        :filtros="filtros"
        @update:cargo="aoCargo"
        @update:ano="aoAno"
        @update:turno="aoTurno"
        @update:candidato="aoCandidato"
        @update:asof="aoCorte"
        @update:uf="aoUf"
        @clear-municipio="limparMunicipio"
        @clear="limpar"
      />

      <AvisoBanner v-if="avisos.length > 0" :avisos="avisos" />

      <StateBlock
        v-if="anomaliasQuery.error.value"
        estado="erro"
        titulo="Não foi possível calcular as anomalias"
        :descricao="anomaliasQuery.error.value.message"
        acao="Tentar novamente"
        @acao="anomaliasQuery.refetch()"
      />
      <StateBlock
        v-else-if="anomaliasQuery.isLoading.value && !anomaliasQuery.data.value"
        estado="carregando"
        titulo="Calculando anomalias"
      />

      <template v-else-if="anomaliasQuery.data.value">
        <BenfordNiveisPanel :dados="anomaliasQuery.data.value.benford_niveis" />

        <div class="auditoria-grade">
          <DuplicacaoPanel :dados="anomaliasQuery.data.value.duplicacao" />
          <OutliersPanel :dados="anomaliasQuery.data.value.outliers" />
        </div>
      </template>
    </template>
  </div>
</template>
