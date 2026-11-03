<script setup>
import { ref } from 'vue'
import ComparacaoLocalPanel from '../components/ComparacaoLocalPanel.vue'
import EntreAnosPanel from '../components/EntreAnosPanel.vue'

const MODOS = [
  ['locais', 'Locais'],
  ['anos', 'Anos'],
]
const modo = ref('locais')
</script>

<template>
  <div class="segmented" role="group" aria-label="Comparação">
    <button
      v-for="[chave, rotulo] in MODOS"
      :key="chave"
      type="button"
      :aria-pressed="modo === chave"
      :class="{ ativo: modo === chave }"
      @click="modo = chave"
    >
      {{ rotulo }}
    </button>
  </div>

  <ComparacaoLocalPanel v-if="modo === 'locais'" />
  <EntreAnosPanel v-else />
</template>
