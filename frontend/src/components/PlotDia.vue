<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Line } from 'vue-chartjs'
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import i18n from '../i18n'
import StateBlock from './StateBlock.vue'
import { COR_NEUTRA, corPartido } from '../lib/colors'
import { avisoMensagem } from '../lib/status'
import {
  formatarHora,
  formatarNumero,
  paraInputSaoPaulo,
} from '../lib/format'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps({
  series: { type: Array, default: () => [] },
  pontos: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  corte: { type: String, default: null },
  candidato: { type: Number, default: null },
  candidatos: { type: Array, default: () => [] },
  avisos: { type: Array, default: () => [] },
  error: { type: String, default: '' },
})

const { t: $t, locale } = useI18n()
const emit = defineEmits(['update:corte', 'retry'])

const modo = ref('votos')

const tempos = computed(() => props.pontos.map((ponto) => new Date(ponto.t).getTime()))

const indiceCorte = computed(() => {
  if (props.pontos.length === 0) return 0
  if (!props.corte) return props.pontos.length - 1
  const alvo = new Date(props.corte).getTime()
  if (Number.isNaN(alvo)) return props.pontos.length - 1
  let indice = 0
  for (let i = 0; i < tempos.value.length; i += 1) {
    if (tempos.value[i] <= alvo) indice = i
  }
  return indice
})

const pontoAtual = computed(() => props.pontos[indiceCorte.value] ?? null)

const tempoCorte = computed(() => {
  if (!props.corte) return tempos.value.at(-1) ?? 0
  const valor = new Date(props.corte).getTime()
  return Number.isNaN(valor) ? (tempos.value.at(-1) ?? 0) : valor
})

const partidoPorNumero = computed(() => {
  const mapa = new Map()
  for (const candidato of props.candidatos) {
    mapa.set(candidato.nr_votavel, candidato.sg_partido)
  }
  return mapa
})

const rotulo = computed(() => {
  if (props.loading) return $t('comum.carregando')
  if (props.pontos.length === 0) return $t('comum.semDados')
  const primeiro = props.pontos[0]
  const ultimo = props.pontos.at(-1)
  return `${formatarHora(primeiro.t)} → ${formatarHora(ultimo.t)} · ${formatarHora(new Date(tempoCorte.value).toISOString())} · ${formatarNumero(ultimo.votos_acumulados)} · ${formatarNumero(ultimo.secoes_com_bu_acumuladas)}`
})

const comData = computed(
  () =>
    props.pontos.length > 1 &&
    new Date(props.pontos[0].t).toDateString() !==
      new Date(props.pontos.at(-1).t).toDateString(),
)

function rotuloHora(iso, mostrarData) {
  const hora = formatarHora(iso)
  return mostrarData
    ? `${new Intl.DateTimeFormat(i18n.global.locale.value, { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(iso))} ${hora}`
    : hora
}

const labels = computed(() =>
  props.pontos.map((ponto) => rotuloHora(ponto.t, comData.value)),
)

function valoresDaSerie(serie) {
  const porTempo = new Map()
  for (const ponto of serie.pontos ?? []) {
    porTempo.set(new Date(ponto.t).getTime(), Number(ponto.votos_acumulados ?? 0))
  }
  let atual = 0
  return tempos.value.map((tempo) => {
    if (porTempo.has(tempo)) atual = porTempo.get(tempo)
    return atual
  })
}

const datasetsVotos = computed(() => {
  if (props.series.length === 0) {
    return [
      {
        label: $t('comum.votos'),
        data: props.pontos.map((ponto) => Number(ponto.votos_acumulados ?? 0)),
        borderColor: COR_NEUTRA,
        backgroundColor: COR_NEUTRA,
        borderWidth: 1.4,
        pointRadius: 0,
        tension: 0.2,
      },
    ]
  }

  return props.series.map((serie) => {
    const cor = corPartido(partidoPorNumero.value.get(serie.nr_votavel))
    return {
      label: serie.nm_votavel ?? $t('mapa.candidatoN', { n: serie.nr_votavel }),
      data: valoresDaSerie(serie),
      borderColor: cor,
      backgroundColor: cor,
      borderWidth: props.candidato === serie.nr_votavel ? 2.2 : 1.3,
      pointRadius: 0,
      tension: 0.2,
    }
  })
})

const dadosGrafico = computed(() =>
  modo.value === 'secoes'
    ? {
        labels: labels.value,
        datasets: [
          {
            label: $t('mapa.secoes'),
            data: props.pontos.map((ponto) =>
              Number(ponto.secoes_com_bu_acumuladas ?? 0),
            ),
            borderColor: '#ffb52e',
            backgroundColor: '#ffb52e',
            borderWidth: 1.6,
            pointRadius: 0,
            tension: 0.2,
            fill: false,
          },
        ],
      }
    : { labels: labels.value, datasets: datasetsVotos.value },
)

const opcoes = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 0 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      display: modo.value === 'votos' && datasetsVotos.value.length > 1,
      labels: { color: '#c8d4c0', boxWidth: 8, font: { size: 10 } },
    },
    tooltip: {
      callbacks: {
        label: (item) => `${item.dataset.label}: ${formatarNumero(item.parsed.y)}`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#7e9275', maxTicksLimit: 6, font: { size: 9 } },
      grid: { color: 'rgba(255, 181, 46, 0.09)' },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#7e9275',
        font: { size: 9 },
        callback: (valor) => formatarNumero(valor),
      },
      grid: { color: 'rgba(255, 181, 46, 0.09)' },
    },
  },
}))

const avisosVisiveis = computed(() =>
  (props.avisos ?? []).filter((aviso) => Boolean(aviso?.codigo)),
)

function aoIndice(evento) {
  const indice = Number(evento.target.value)
  const ponto = props.pontos[indice]
  if (ponto) emit('update:corte', paraInputSaoPaulo(ponto.t))
}
</script>

<template>
  <section class="painel tracado" aria-labelledby="tracado-titulo">
    <header class="painel__cabecalho">
      <h2 id="tracado-titulo">{{ $t('painel.plotDia') }}</h2>
      <div class="tracado__modos segmented" role="group" :aria-label="$t('painel.plotDia')">
        <button
          type="button"
          :aria-pressed="modo === 'votos'"
          :class="{ ativo: modo === 'votos' }"
          @click="modo = 'votos'"
        >
          {{ $t('comum.votos') }}
        </button>
        <button
          type="button"
          :aria-pressed="modo === 'secoes'"
          :class="{ ativo: modo === 'secoes' }"
          @click="modo = 'secoes'"
        >
          {{ $t('mapa.secoes') }}
        </button>
      </div>
      <p v-if="!loading && !error && pontos.length > 0" class="painel__meta">
        <b>{{ formatarHora(pontoAtual?.t) }}</b> · {{ $t('filtros.corte') }}<br />
        {{ formatarNumero(pontoAtual?.secoes_com_bu_acumuladas) }} {{ $t('mapa.secoes') }} ·
        {{ formatarNumero(pontoAtual?.votos_acumulados) }} {{ $t('comum.votos') }}
      </p>
    </header>

    <StateBlock v-if="loading" estado="carregando" :titulo="$t('comum.carregando')" class="tracado__estado" />
    <StateBlock
      v-else-if="error"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="error"
      :acao="$t('comum.tentarNovamente')"
      class="tracado__estado"
      @acao="emit('retry')"
    />
    <div v-else-if="pontos.length === 0" class="tracado__vazio">
      <strong>{{ $t('comum.linhaTempoIndisponivel') }}</strong>
      <ul
        v-if="avisosVisiveis.length > 0"
        class="tracado__avisos"
        role="status"
        :aria-label="$t('comum.avisos')"
      >
        <li v-for="aviso in avisosVisiveis" :key="aviso.codigo">
          {{ avisoMensagem(aviso) }}
        </li>
      </ul>
    </div>

    <template v-else>
      <div class="tracado__area">
        <Line
          class="tracado__canvas"
          :data="dadosGrafico"
          :options="opcoes"
          role="img"
          :aria-label="rotulo"
        />
      </div>

      <div class="curso">
        <label class="sr-only" for="curso-corte">{{ $t('filtros.corte') }}</label>
        <input
          id="curso-corte"
          type="range"
          min="0"
          :max="Math.max(0, pontos.length - 1)"
          step="1"
          :value="indiceCorte"
          :aria-valuetext="$t('painel.corteAs', { time: formatarHora(pontoAtual?.t) })"
          @input="aoIndice"
        />
        <p class="curso__leitura">
          <span>{{ $t('filtros.corte') }} <b>{{ formatarHora(pontoAtual?.t) }}</b></span>
          <span>{{ $t('mapa.secoes') }} <b>{{ formatarNumero(pontoAtual?.secoes_com_bu_acumuladas) }}</b></span>
          <span>{{ $t('comum.votos') }} <b>{{ formatarNumero(pontoAtual?.votos_acumulados) }}</b></span>
        </p>
      </div>
    </template>
  </section>
</template>
