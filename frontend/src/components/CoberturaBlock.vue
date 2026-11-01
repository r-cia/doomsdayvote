<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatarNumero } from '../lib/format'

const { t, te } = useI18n()

const ROTULOS_REGRA = {
  comparecimento_vs_votos: 'analiseUI.regraComparecimentoVotos',
  aptos_vs_comparecimento_abstencao: 'analiseUI.regraAptosComparecimento',
  comparecimento_vs_aptos: 'analiseUI.regraComparecimentoAptos',
  biometria_vs_comparecimento: 'analiseUI.regraBiometriaComparecimento',
}

function rotulo(campo) {
  if (ROTULOS_REGRA[campo]) return t(ROTULOS_REGRA[campo])
  const chave = `cobertura.campos.${campo}`
  return te(chave) ? t(chave) : campo
}

function formatarValor(valor) {
  if (valor === null || valor === undefined) return '—'
  if (typeof valor === 'number' || (typeof valor === 'string' && valor.trim() !== '' && Number.isFinite(Number(valor)))) {
    return formatarNumero(valor)
  }
  return String(valor)
}

const ehObjeto = (valor) => typeof valor === 'object' && valor !== null

const props = defineProps({
  cobertura: { type: Object, default: null },
  dados: { type: Object, default: null },
})

const coberturaEfetiva = computed(
  () => props.cobertura ?? props.dados?.cobertura ?? null,
)

const entradas = computed(() => {
  const valor = coberturaEfetiva.value
  if (!valor || typeof valor !== 'object') return []
  return Object.entries(valor)
})
</script>

<template>
  <div
    v-if="coberturaEfetiva"
    class="cobertura-block"
    data-test="cobertura-block"
  >
    <dl class="painel-resumo">
      <div
        v-for="[chave, valor] in entradas"
        :key="chave"
        class="cobertura-block__item painel-resumo__item"
      >
        <dt>{{ rotulo(chave) }}</dt>
        <dd v-if="ehObjeto(valor)">
          <dl class="cobertura-block__sub">
            <div v-for="[subchave, subvalor] in Object.entries(valor)" :key="subchave">
              <dt>{{ rotulo(subchave) }}</dt>
              <dd>{{ formatarValor(subvalor) }}</dd>
            </div>
          </dl>
        </dd>
        <dd v-else>{{ formatarValor(valor) }}</dd>
      </div>
    </dl>
  </div>
</template>
