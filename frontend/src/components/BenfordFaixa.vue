<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { margemEsquerda } from '../lib/entre-anos'
import { formatarDecimal } from '../lib/format'

const props = defineProps({
  titulo: { type: String, required: true },
  digitos: { type: Array, default: () => [] },
  faixa: { type: Array, default: null },
})

const { t } = useI18n()

const ALTURA = 200
const MARGEM = { dir: 8, topo: 10, base: 22 }
const LARGURA_TRACO = 28

const figura = ref(null)
const largura = ref(420)
let observador = null

onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !figura.value) return
  observador = new ResizeObserver(([entrada]) => {
    largura.value = Math.max(240, Math.round(entrada.contentRect.width))
  })
  observador.observe(figura.value)
})

onBeforeUnmount(() => observador?.disconnect())

const faixaDe = (digito) => props.faixa?.find((item) => item.digito === digito.digito) ?? null

const maximo = computed(() => {
  let valor = 1
  for (const digito of props.digitos) {
    valor = Math.max(valor, digito.observado_percentual, digito.esperado_percentual, faixaDe(digito)?.p975 ?? 0)
  }
  return valor
})

const marcasY = computed(() => [0, 1, 2, 3].map((i) => (maximo.value / 3) * i))
const rotuloY = (valor) => `${formatarDecimal(valor, 0)}%`
const margemEsq = computed(() => margemEsquerda(marcasY.value.map(rotuloY)))

const areaLargura = computed(() => largura.value - margemEsq.value - MARGEM.dir)
const passoX = computed(() => areaLargura.value / Math.max(1, props.digitos.length))
const centro = (indice) => margemEsq.value + passoX.value * (indice + 0.5)
const y = (valor) => ALTURA - MARGEM.base - (valor / maximo.value) * (ALTURA - MARGEM.topo - MARGEM.base)

const larguraBarra = computed(() => Math.max(4, passoX.value * 0.46))
const linhaEsperado = computed(() =>
  props.digitos
    .map((digito, indice) => `${indice === 0 ? 'M' : 'L'}${centro(indice).toFixed(1)} ${y(digito.esperado_percentual).toFixed(1)}`)
    .join(' '),
)

function descricao(digito) {
  const faixa = faixaDe(digito)
  const partes = [
    t('estatistica.observado', { valor: formatarDecimal(digito.observado_percentual, 2) }),
    t('estatistica.esperado', { valor: formatarDecimal(digito.esperado_percentual, 2) }),
  ]
  if (faixa) {
    partes.push(t('estatistica.faixaDigito', { min: formatarDecimal(faixa.p025, 2), max: formatarDecimal(faixa.p975, 2) }))
  }
  return `${digito.digito}: ${partes.join(' · ')}`
}
</script>

<template>
  <figure ref="figura" class="benford-faixa">
    <svg
      class="benford-faixa__svg"
      :viewBox="`0 0 ${largura} ${ALTURA}`"
      role="img"
      :aria-label="`${titulo}. ${digitos.map(descricao).join('; ')}`"
    >
      <g class="benford-faixa__grade">
        <template v-for="valor in marcasY" :key="`y${valor}`">
          <line :x1="margemEsq" :x2="largura - MARGEM.dir" :y1="y(valor)" :y2="y(valor)" />
          <text :x="margemEsq - 8" :y="y(valor)" text-anchor="end" dominant-baseline="middle">{{ rotuloY(valor) }}</text>
        </template>
        <text
          v-for="(digito, indice) in digitos"
          :key="`x${digito.digito}`"
          :x="centro(indice)"
          :y="ALTURA - 6"
          text-anchor="middle"
        >
          {{ digito.digito }}
        </text>
      </g>
      <g v-for="(digito, indice) in digitos" :key="digito.digito">
        <rect
          v-if="faixaDe(digito)"
          class="benford-faixa__faixa"
          :x="centro(indice) - passoX * 0.4"
          :width="passoX * 0.8"
          :y="y(faixaDe(digito).p975)"
          :height="Math.max(1, y(faixaDe(digito).p025) - y(faixaDe(digito).p975))"
        >
          <title>{{ descricao(digito) }}</title>
        </rect>
        <rect
          class="benford-faixa__barra"
          :x="centro(indice) - larguraBarra / 2"
          :width="larguraBarra"
          :y="y(digito.observado_percentual)"
          :height="Math.max(1, y(0) - y(digito.observado_percentual))"
        >
          <title>{{ descricao(digito) }}</title>
        </rect>
      </g>
      <path class="benford-faixa__esperado" :d="linhaEsperado" />
    </svg>
    <ul class="benford-faixa__legenda">
      <li>
        <svg width="12" height="10" aria-hidden="true"><rect class="benford-faixa__barra" width="12" height="10" /></svg>
        {{ t('estatistica.legendaObservado') }}
      </li>
      <li>
        <svg :width="LARGURA_TRACO" height="10" aria-hidden="true"><line class="benford-faixa__esperado" x1="0" x2="28" y1="5" y2="5" /></svg>
        {{ t('estatistica.legendaEsperado') }}
      </li>
      <li v-if="faixa">
        <svg width="12" height="10" aria-hidden="true"><rect class="benford-faixa__faixa" width="12" height="10" /></svg>
        {{ t('estatistica.legendaFaixa') }}
      </li>
    </ul>
  </figure>
</template>
