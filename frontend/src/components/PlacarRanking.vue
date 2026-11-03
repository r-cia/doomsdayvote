<script setup>
import { computed } from 'vue'
import { candidatosNominais, votosValidos } from '../lib/agregacoes'
import { corPartido } from '../lib/colors'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  votos: { type: Array, default: () => [] },
  series: { type: Array, default: () => [] },
  corte: { type: String, default: null },
  selecionado: { type: Number, default: null },
})

const emit = defineEmits(['select'])

const candidatos = computed(() => candidatosNominais(props.votos))
const validos = computed(() => votosValidos(props.votos))

const validosAte1715 = computed(() =>
  (props.votos ?? [])
    .filter((v) => v.categoria === 'nominal' || v.categoria === 'legenda')
    .reduce((t, v) => t + Number(v.qt_votos_ate_1715 ?? 0), 0),
)

const validosTardios = computed(() =>
  (props.votos ?? [])
    .filter((v) => v.categoria === 'nominal' || v.categoria === 'legenda')
    .reduce((t, v) => t + Number(v.qt_votos_tardios ?? 0), 0),
)

const deltas = computed(() => {
  const mapa = new Map()
  const alvo = props.corte ? new Date(props.corte).getTime() : Infinity

  for (const serie of props.series) {
    let anterior = null
    let atual = null
    for (const ponto of serie.pontos ?? []) {
      const tempo = new Date(ponto.t).getTime()
      if (tempo <= alvo) {
        anterior = atual
        atual = ponto
      }
    }
    if (atual && anterior) {
      const delta = atual.votos_acumulados - anterior.votos_acumulados
      if (delta > 0) mapa.set(serie.nr_votavel, delta)
    }
  }

  return mapa
})

function escolher(candidato) {
  emit('select', candidato.nr_votavel)
}
</script>

<template>
  <section class="painel placar" aria-labelledby="placar-titulo">
    <header class="painel__cabecalho">
      <h2 id="placar-titulo">{{ $t('placar.titulo') }}</h2>
      <p class="painel__meta">
        <b>{{ candidatos.length }}</b> {{ $t('placar.candidatos') }}<br />
        {{ $t('placar.votosValidos', { n: formatarNumero(validos) }) }}
      </p>
    </header>

    <div class="placar__cabecalho" aria-hidden="true">
      <span>#</span>
      <span>{{ $t('comum.partido') }}</span>
      <span>{{ $t('comum.candidato') }}</span>
      <span class="num">{{ $t('placar.total') }}</span>
      <span class="num">{{ $t('placar.pctValidosTotal') }}</span>
      <span class="num">{{ $t('comum.votos') }}</span>
      <span class="num">{{ $t('placar.pctValidos') }}</span>
      <span class="num">{{ $t('placar.tardios') }}</span>
      <span class="num">{{ $t('placar.pctValidosTardios') }}</span>
      <span class="num">{{ $t('placar.deltaCorte') }}</span>
    </div>

    <TransitionGroup name="mover" tag="div" class="placar__lista">
      <button
        v-for="(candidato, indice) in candidatos"
        :key="candidato.nr_votavel"
        type="button"
        class="placar__linha"
        :aria-pressed="selecionado === candidato.nr_votavel"
        :aria-label="$t('placar.linhaAria', { nome: candidato.nm_votavel, partido: candidato.sg_partido ?? $t('placar.semPartido'), votos: formatarNumero(candidato.qt_votos), pct: formatarPercentual(candidato.percentual) })"
        @click="escolher(candidato)"
      >
        <span class="placar__pos">{{ String(indice + 1).padStart(2, '0') }}</span>
        <span class="placar__partido">
          <span
            class="placar__swatch"
            :style="{ backgroundColor: corPartido(candidato.sg_partido) }"
            aria-hidden="true"
          />
          {{ candidato.sg_partido ?? '—' }}
        </span>
        <span class="placar__nome">{{ candidato.nm_votavel }}</span>
        <span class="placar__votos">{{ formatarNumero(candidato.qt_votos) }}</span>
        <span class="placar__percentual">{{ formatarPercentual(candidato.percentual) }}</span>
        <span class="placar__votos">{{ formatarNumero(candidato.qt_votos_ate_1715) }}</span>
        <span class="placar__percentual">{{ formatarPercentual(validosAte1715 > 0 ? (Number(candidato.qt_votos_ate_1715) / validosAte1715) * 100 : null) }}</span>
        <span class="placar__votos">{{ formatarNumero(candidato.qt_votos_tardios) }}</span>
        <span class="placar__percentual">{{ formatarPercentual(validosTardios > 0 ? (Number(candidato.qt_votos_tardios) / validosTardios) * 100 : null) }}</span>
        <span
          class="placar__delta"
          :class="deltas.has(candidato.nr_votavel) ? 'placar__delta--novo' : ''"
        >
          {{ deltas.has(candidato.nr_votavel) ? `+${formatarNumero(deltas.get(candidato.nr_votavel))}` : '' }}
        </span>
      </button>
    </TransitionGroup>
  </section>
</template>
