<script setup>
import { ref } from 'vue'
import ConcentracaoTabela from './ConcentracaoTabela.vue'
import ConsistenciaTabela from './ConsistenciaTabela.vue'
import OutliersPanel from './OutliersPanel.vue'
import { useFiltersStore } from '../stores/filters'
import SecaoView from '../views/SecaoView.vue'

defineProps({
  outliers: { type: Object, default: null },
  ordenacao: { type: Object, default: null },
})
defineEmits(['ordenar'])

const store = useFiltersStore()
const secaoModalId = ref(null)

const VISOES = [
  ['outliers', 'destaque.outliers'],
  ['share', 'destaque.share'],
  ['margem', 'destaque.margem'],
  ['consistencia', 'destaque.consistencia'],
]
const visao = ref('outliers')
</script>

<template>
  <section class="painel" aria-labelledby="destaque-titulo">
    <header class="painel__cabecalho">
      <h2 id="destaque-titulo">{{ $t('destaque.titulo') }}</h2>
      <div class="segmented" role="group" :aria-label="$t('destaque.visao')">
        <button
          v-for="[chave, rotulo] in VISOES"
          :key="chave"
          type="button"
          :aria-pressed="visao === chave"
          :class="{ ativo: visao === chave }"
          @click="visao = chave"
        >
          {{ $t(rotulo) }}
        </button>
      </div>
    </header>

    <OutliersPanel v-if="visao === 'outliers'" :dados="outliers" :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)" />
    <ConsistenciaTabela v-else-if="visao === 'consistencia'" @abrir-secao="secaoModalId = $event" />
    <ConcentracaoTabela v-else :visao="visao" @abrir-secao="secaoModalId = $event" />
  </section>

  <SecaoView
    v-if="secaoModalId"
    :id-prop="secaoModalId"
    :election-id-prop="store.electionId"
    :cargo-prop="store.cargo"
    :as-of-prop="store.asOf ?? ''"
    :uf-prop="store.uf ?? ''"
    :municipio-prop="store.municipio ?? ''"
    @close="secaoModalId = null"
  />
</template>
