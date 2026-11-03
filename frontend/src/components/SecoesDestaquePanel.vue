<script setup>
import { ref } from 'vue'
import ConcentracaoTabela from './ConcentracaoTabela.vue'
import ConsistenciaTabela from './ConsistenciaTabela.vue'
import OutliersPanel from './OutliersPanel.vue'

defineProps({
  outliers: { type: Object, default: null },
  ordenacao: { type: String, default: 'if' },
})
defineEmits(['update:ordenacao'])

const VISOES = [
  ['outliers', 'Outliers'],
  ['share', 'Participação do líder'],
  ['margem', 'Margem'],
  ['consistencia', 'Consistência aritmética'],
]
const visao = ref('outliers')
</script>

<template>
  <section class="painel" aria-labelledby="destaque-titulo">
    <header class="painel__cabecalho">
      <h2 id="destaque-titulo">Seções em destaque</h2>
      <div class="segmented" role="group" aria-label="Visão">
        <button
          v-for="[chave, rotulo] in VISOES"
          :key="chave"
          type="button"
          :aria-pressed="visao === chave"
          :class="{ ativo: visao === chave }"
          @click="visao = chave"
        >
          {{ rotulo }}
        </button>
      </div>
    </header>

    <OutliersPanel v-if="visao === 'outliers'" :dados="outliers" :ordenacao="ordenacao" @update:ordenacao="$emit('update:ordenacao', $event)" />
    <ConsistenciaTabela v-else-if="visao === 'consistencia'" />
    <ConcentracaoTabela v-else :visao="visao" />
  </section>
</template>
