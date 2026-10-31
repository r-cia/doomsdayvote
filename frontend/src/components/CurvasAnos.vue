<script setup>
import { computed } from 'vue'
import { dominioLog, margemEsquerda } from '../lib/entre-anos'
import { formatarDecimal, formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  titulo: { type: String, required: true },
  series: { type: Array, default: () => [] },
  formato: { type: String, default: 'numero' },
  escala: { type: String, default: 'linear' },
})

const LARGURA = 640
const ALTURA = 220
const MARGEM = { dir: 12, topo: 10, base: 26 }

const CORES = ['#ffb52e', '#7ec8ff', '#74e08c', '#ff6b57', '#c79bff', '#e6e6a0']
const TRACOS = [null, '6 3', '2 3', '10 3 2 3', '4 4', '1 3']

const log = computed(() => props.escala === 'log')

const valores = computed(() =>
  props.series.flatMap((serie) => serie.pontos.map((ponto) => ponto.valor)).filter((valor) => valor !== null),
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

const limitesX = computed(() => {
  const minutos = props.series.flatMap((serie) => serie.pontos.map((ponto) => ponto.minuto))
  if (minutos.length === 0) return { min: 0, max: 1 }
  return { min: Math.min(...minutos), max: Math.max(...minutos) }
})

const x = (minuto) =>
  margemEsq.value +
  ((minuto - limitesX.value.min) / Math.max(1, limitesX.value.max - limitesX.value.min)) *
    (LARGURA - margemEsq.value - MARGEM.dir)

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
  const inicio = Math.ceil(limitesX.value.min / 60) * 60
  const passo = Math.ceil((limitesX.value.max - inicio) / 60 / 8) * 60 || 60
  for (let minuto = inicio; minuto <= limitesX.value.max; minuto += passo) marcas.push(minuto)
  return marcas
})

const linhaZero = computed(
  () => !log.value && dominioY.value.min < 0 && dominioY.value.max > 0,
)

function caminhoDe(pontos) {
  let anterior = false
  return pontos
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
    cor: CORES[indice % CORES.length],
    tracejado: TRACOS[indice % TRACOS.length],
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
  <figure class="curvas">
    <figcaption class="curvas__titulo">{{ titulo }}</figcaption>
    <svg
      class="curvas__svg"
      :viewBox="`0 0 ${LARGURA} ${ALTURA}`"
      role="img"
      :aria-label="`${titulo}. ${resumo}`"
    >
      <g class="curvas__grade">
        <template v-for="valor in dominioY.marcas" :key="`y${valor}`">
          <line :x1="margemEsq" :x2="LARGURA - MARGEM.dir" :y1="y(valor)" :y2="y(valor)" />
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
        :x2="LARGURA - MARGEM.dir"
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
