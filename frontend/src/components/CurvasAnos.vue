<script setup>
import { computed } from 'vue'
import { formatarDecimal, formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  titulo: { type: String, required: true },
  series: { type: Array, default: () => [] },
  formato: { type: String, default: 'numero' },
})

const LARGURA = 640
const ALTURA = 220
const MARGEM = { esq: 56, dir: 12, topo: 10, base: 26 }

const CORES = ['#ffb52e', '#7ec8ff', '#74e08c', '#ff6b57', '#c79bff', '#e6e6a0']
const TRACOS = [null, '6 3', '2 3', '10 3 2 3', '4 4', '1 3']

const pontos = computed(() => props.series.flatMap((serie) => serie.pontos))

const limitesX = computed(() => {
  const minutos = pontos.value.map((ponto) => ponto.minuto)
  if (minutos.length === 0) return { min: 0, max: 1 }
  return { min: Math.min(...minutos), max: Math.max(...minutos) }
})

const maxY = computed(() => Math.max(1, ...pontos.value.map((ponto) => ponto.valor ?? 0)))

const x = (minuto) =>
  MARGEM.esq +
  ((minuto - limitesX.value.min) / Math.max(1, limitesX.value.max - limitesX.value.min)) *
    (LARGURA - MARGEM.esq - MARGEM.dir)
const y = (valor) =>
  ALTURA - MARGEM.base - (valor / maxY.value) * (ALTURA - MARGEM.topo - MARGEM.base)

const horaDe = (minuto) => {
  const dia = ((minuto % 1440) + 1440) % 1440
  return `${String(Math.floor(dia / 60)).padStart(2, '0')}:${String(dia % 60).padStart(2, '0')}`
}

const marcasX = computed(() => {
  const marcas = []
  const inicio = Math.ceil(limitesX.value.min / 60) * 60
  const passo = Math.ceil((limitesX.value.max - inicio) / 60 / 8) * 60 || 60
  for (let minuto = inicio; minuto <= limitesX.value.max; minuto += passo) marcas.push(minuto)
  return marcas
})

const marcasY = computed(() => [0, 1, 2, 3].map((i) => (maxY.value / 3) * i))

const formatarY = (valor) =>
  props.formato === 'percentual' ? formatarPercentual(valor, 0) : formatarNumero(Math.round(valor))

const tracos = computed(() =>
  props.series.map((serie, indice) => ({
    chave: serie.chave,
    rotulo: serie.rotulo,
    cor: CORES[indice % CORES.length],
    tracejado: TRACOS[indice % TRACOS.length],
    caminho: serie.pontos
      .filter((ponto) => ponto.valor !== null)
      .map((ponto, i) => `${i === 0 ? 'M' : 'L'}${x(ponto.minuto).toFixed(1)} ${y(ponto.valor).toFixed(1)}`)
      .join(' '),
  })),
)

const resumo = computed(() =>
  props.series
    .map((serie) => {
      const ultimo = [...serie.pontos].reverse().find((ponto) => ponto.valor !== null)
      const valor =
        props.formato === 'percentual' ? formatarPercentual(ultimo?.valor) : formatarDecimal(ultimo?.valor)
      return `${serie.rotulo}: ${valor}`
    })
    .join(' · '),
)
</script>

<template>
  <figure class="curvas">
    <figcaption class="curvas__titulo">{{ titulo }}</figcaption>
    <svg
      class="curvas__svg"
      :viewBox="`0 0 ${LARGURA} ${ALTURA}`"
      role="img"
      :aria-label="`${titulo}. ${resumo}`"
    >
      <g class="curvas__grade">
        <template v-for="valor in marcasY" :key="`y${valor}`">
          <line :x1="MARGEM.esq" :x2="LARGURA - MARGEM.dir" :y1="y(valor)" :y2="y(valor)" />
          <text :x="MARGEM.esq - 8" :y="y(valor)" text-anchor="end" dominant-baseline="middle">
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
