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

    <OutliersPanel v-if="visao === 'outliers'" :dados="outliers" :ordenacao="ordenacao" @update:ordenacao="$emit('update:ordenacao', $event)" />
    <ConsistenciaTabela v-else-if="visao === 'consistencia'" />
    <ConcentracaoTabela v-else :visao="visao" />
  </section>
</template>
