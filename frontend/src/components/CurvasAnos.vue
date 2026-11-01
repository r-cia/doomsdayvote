<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CORES_PADRAO, DOMINIO_X, dominioLog, margemDireita, margemEsquerda } from '../lib/entre-anos'
import { formatarDecimal, formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  titulo: { type: String, required: true },
  series: { type: Array, default: () => [] },
  formato: { type: String, default: 'numero' },
  escala: { type: String, default: 'linear' },
})

const ALTURA = 220
const MARGEM = { topo: 10, base: 26 }

const figura = ref(null)
const largura = ref(640)
let observador = null

onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !figura.value) return
  observador = new ResizeObserver(([entrada]) => {
    largura.value = Math.max(320, Math.round(entrada.contentRect.width))
  })
  observador.observe(figura.value)
})

onBeforeUnmount(() => observador?.disconnect())

const log = computed(() => props.escala === 'log')

const dentroDoDominio = (ponto) => ponto.minuto >= DOMINIO_X.min && ponto.minuto <= DOMINIO_X.max

const valores = computed(() =>
  props.series
    .flatMap((serie) => serie.pontos.filter(dentroDoDominio).map((ponto) => ponto.valor))
    .filter((valor) => valor !== null),
)

const dominioY = computed(() => {
  if (log.value) {
    const dominio = dominioLog(valores.value)
    return { min: dominio.min, max: dominio.max, marcas: dominio.marcas }
  }
  const minimo = Math.min(0, ...valores.value)
  const maximo = Math.max(minimo + 1, ...valores.value)
  return {
    min: minimo,
    max: maximo,
    marcas: [0, 1, 2, 3].map((i) => minimo + ((maximo - minimo) / 3) * i),
  }
})

function formatarY(valor) {
  if (props.formato === 'percentual') return formatarPercentual(valor, 0)
  if (props.formato === 'pontos') return formatarDecimal(valor, 2)
  return formatarNumero(Math.round(valor))
}

const margemEsq = computed(() => margemEsquerda(dominioY.value.marcas.map(formatarY)))

const limitesX = DOMINIO_X

const x = (minuto) =>
  margemEsq.value +
  ((minuto - limitesX.min) / (limitesX.max - limitesX.min)) *
    (largura.value - margemEsq.value - margemDir.value)

function y(valor) {
  const { min, max } = dominioY.value
  const fracao = log.value
    ? (Math.log10(valor) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))
    : (valor - min) / (max - min)
  return ALTURA - MARGEM.base - fracao * (ALTURA - MARGEM.topo - MARGEM.base)
}

const desenhavel = (valor) => valor !== null && (!log.value || valor > 0)

const horaDe = (minuto) => {
  const dia = ((minuto % 1440) + 1440) % 1440
  return `${String(Math.floor(dia / 60)).padStart(2, '0')}:${String(dia % 60).padStart(2, '0')}`
}

const marcasX = computed(() => {
  const marcas = []
  const passo = largura.value >= 520 ? 60 : 120
  for (let minuto = limitesX.min; minuto <= limitesX.max; minuto += passo) marcas.push(minuto)
  return marcas
})

const margemDir = computed(() => margemDireita(horaDe(marcasX.value.at(-1) ?? limitesX.max)))

const linhaZero = computed(
  () => !log.value && dominioY.value.min < 0 && dominioY.value.max > 0,
)

function caminhoDe(pontos) {
  let anterior = false
  return pontos
    .filter(dentroDoDominio)
    .map((ponto) => {
      if (!desenhavel(ponto.valor)) {
        anterior = false
        return ''
      }
      const comando = anterior ? 'L' : 'M'
      anterior = true
      return `${comando}${x(ponto.minuto).toFixed(1)} ${y(ponto.valor).toFixed(1)}`
    })
    .filter(Boolean)
    .join(' ')
}

const tracos = computed(() =>
  props.series.map((serie, indice) => ({
    chave: serie.chave,
    rotulo: serie.rotulo,
    cor: serie.cor ?? CORES_PADRAO[indice % CORES_PADRAO.length],
    tracejado: serie.tracejado ?? null,
    caminho: caminhoDe(serie.pontos),
  })),
)

const resumo = computed(() =>
  props.series
    .map((serie) => {
      const ultimo = [...serie.pontos].reverse().find((ponto) => ponto.valor !== null)
      return `${serie.rotulo}: ${formatarY(ultimo?.valor)}`
    })
    .join(' · '),
)
</script>

<template>
  <figure ref="figura" class="curvas">
    <figcaption class="curvas__titulo">{{ titulo }}</figcaption>
    <svg
      class="curvas__svg"
      :viewBox="`0 0 ${largura} ${ALTURA}`"
      role="img"
      :aria-label="`${titulo}. ${resumo}`"
    >
      <g class="curvas__grade">
        <template v-for="valor in dominioY.marcas" :key="`y${valor}`">
          <line :x1="margemEsq" :x2="largura - margemDir" :y1="y(valor)" :y2="y(valor)" />
          <text :x="margemEsq - 8" :y="y(valor)" text-anchor="end" dominant-baseline="middle">
            {{ formatarY(valor) }}
          </text>
        </template>
        <text
          v-for="minuto in marcasX"
          :key="`x${minuto}`"
          :x="x(minuto)"
          :y="ALTURA - 8"
          text-anchor="middle"
        >
          {{ horaDe(minuto) }}
        </text>
      </g>
      <line
        v-if="linhaZero"
        class="curvas__zero"
        :x1="margemEsq"
        :x2="largura - margemDir"
        :y1="y(0)"
        :y2="y(0)"
      />
      <path
        v-for="traco in tracos"
        :key="traco.chave"
        :d="traco.caminho"
        fill="none"
        :stroke="traco.cor"
        stroke-width="1.6"
        :stroke-dasharray="traco.tracejado"
      />
    </svg>
    <ul class="curvas__legenda">
      <li v-for="traco in tracos" :key="traco.chave">
        <svg width="28" height="8" aria-hidden="true">
          <line
            x1="0"
            x2="28"
            y1="4"
            y2="4"
            :stroke="traco.cor"
            stroke-width="2"
            :stroke-dasharray="traco.tracejado"
          />
        </svg>
        {{ traco.rotulo }}
      </li>
    </ul>
  </figure>
</template>
