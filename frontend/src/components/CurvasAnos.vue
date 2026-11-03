<script setup>
import { computed } from 'vue'
import { MINUTO_FINAL, MINUTO_INICIAL, rotuloMinuto } from '../lib/entre-anos'
import { formatarNumero } from '../lib/format'

const props = defineProps({
  titulo: { type: String, required: true },
  series: { type: Array, default: () => [] },
  escala: { type: String, default: 'linear' },
})

const L = 640
const A = 220
const topo = 10
const base = 24

const valores = computed(() => props.series.flatMap((s) => s.pontos.map((p) => p.y)).filter((v) => v !== null && v !== undefined && Number.isFinite(v)))
const logaritmica = computed(() => props.escala === 'log')
const validos = computed(() => (logaritmica.value ? valores.value.filter((v) => v > 0) : valores.value))
const minimo = computed(() => (logaritmica.value ? Math.log10(Math.min(...validos.value, 1)) : Math.min(0, ...validos.value, 0)))
const maximo = computed(() => {
  const m = Math.max(...validos.value, logaritmica.value ? 10 : 1)
  return logaritmica.value ? Math.log10(m) : m
})
const ticksY = computed(() => {
  if (logaritmica.value) {
    const fim = Math.ceil(maximo.value)
    return Array.from({ length: fim + 1 }, (_, i) => ({ valor: 10 ** i, pos: i }))
  }
  return [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = minimo.value + (maximo.value - minimo.value) * f
    return { valor: v, pos: v }
  })
})
const topoEscala = computed(() => (logaritmica.value ? Math.max(maximo.value, ticksY.value.at(-1)?.pos ?? 0) : maximo.value))
const margemEsq = computed(() => Math.max(36, 8 + Math.max(...ticksY.value.map((t) => formatarNumero(Math.round(t.valor)).length), 1) * 6))

const x = (minuto) => margemEsq.value + ((minuto - MINUTO_INICIAL) / (MINUTO_FINAL - MINUTO_INICIAL)) * (L - margemEsq.value - 8)
const y = (pos) => topo + (A - topo - base) * (1 - (pos - minimo.value) / ((topoEscala.value - minimo.value) || 1))

function caminho(serie) {
  let d = ''
  let aberto = false
  for (const ponto of serie.pontos) {
    const v = ponto.y
    const ok = v !== null && v !== undefined && Number.isFinite(v) && (!logaritmica.value || v > 0) && ponto.x >= MINUTO_INICIAL && ponto.x <= MINUTO_FINAL
    if (!ok) {
      aberto = false
      continue
    }
    d += `${aberto ? 'L' : 'M'}${x(ponto.x).toFixed(1)},${y(logaritmica.value ? Math.log10(v) : v).toFixed(1)} `
    aberto = true
  }
  return d
}

const ticksX = Array.from({ length: 7 }, (_, i) => MINUTO_INICIAL + i * 130).map((m) => Math.min(m, MINUTO_FINAL))
</script>

<template>
  <figure class="curvas">
    <figcaption>{{ titulo }}</figcaption>
    <svg class="curvas__svg" :viewBox="`0 0 ${L} ${A}`" role="img" :aria-label="$t('entreAnos.curvaAria', { titulo, escala: logaritmica ? $t('entreAnos.logaritmica') : $t('entreAnos.linear') })">
      <g v-for="t in ticksY" :key="t.pos">
        <line :x1="margemEsq" :x2="L - 8" :y1="y(t.pos)" :y2="y(t.pos)" class="curvas__grade" />
        <text :x="margemEsq - 4" :y="y(t.pos) + 3" text-anchor="end" class="curvas__rotulo">{{ formatarNumero(Math.round(t.valor * 100) / 100) }}</text>
      </g>
      <g v-for="m in ticksX" :key="m">
        <text :x="x(m)" :y="A - 8" text-anchor="middle" class="curvas__rotulo">{{ rotuloMinuto(m) }}</text>
      </g>
      <path v-for="s in series" :key="s.id" :d="caminho(s)" fill="none" :stroke="s.cor" stroke-width="1.6" :stroke-dasharray="s.traco || undefined" />
    </svg>
    <ul class="curvas__legenda">
      <li v-for="s in series" :key="s.id">
        <svg width="24" height="8" aria-hidden="true"><line x1="0" x2="24" y1="4" y2="4" :stroke="s.cor" stroke-width="2" :stroke-dasharray="s.traco || undefined" /></svg>
        {{ s.rotulo }}
      </li>
    </ul>
  </figure>
</template>
