<script setup>
import { computed, ref, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import StateBlock from './StateBlock.vue'
import {
  formatarDataHora,
  formatarHora,
  formatarNumero,
} from '../lib/format'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
)

const props = defineProps({
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  granularity: { type: String, default: '5m' },
})

defineEmits(['update:granularity', 'retry'])

const indice = ref(0)
const pontos = computed(() => props.data?.pontos ?? [])
const selecionado = computed(() => pontos.value[indice.value] ?? null)
const aviso = computed(
  () => props.data?.avisos?.[0]?.mensagem ?? 'A fonte não permite linha do tempo por horário.',
)

watch(
  () => pontos.value.length,
  (tamanho) => {
    indice.value = Math.max(0, tamanho - 1)
  },
  { immediate: true },
)

const dadosGrafico = computed(() => {
  const visiveis = pontos.value.slice(0, indice.value + 1)
  return {
    labels: visiveis.map((ponto) => formatarHora(ponto.t)),
    datasets: [
      {
        label: 'Votos acumulados',
        data: visiveis.map((ponto) => ponto.votos_acumulados),
        borderColor: '#1E40AF',
        backgroundColor: 'rgba(30, 64, 175, 0.12)',
        fill: true,
        tension: 0.25,
        pointRadius: visiveis.length > 60 ? 0 : 2,
        pointHoverRadius: 4,
        pointBackgroundColor: '#1E40AF',
        borderWidth: 2,
      },
    ],
  }
})

const opcoesGrafico = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 0 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (contexto) => `Votos acumulados: ${formatarNumero(contexto.raw)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxTicksLimit: 8, maxRotation: 0 },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (valor) => formatarNumero(valor),
      },
    },
  },
}))

function mover(delta) {
  indice.value = Math.min(
    Math.max(0, indice.value + delta),
    Math.max(0, pontos.value.length - 1),
  )
}
</script>

<template>
  <section class="card linha-tempo" aria-labelledby="linha-tempo-titulo">
    <div class="card__cabecalho">
      <div>
        <h2 id="linha-tempo-titulo">Linha do tempo</h2>
        <p>
          Votos acumulados e seções com BU ao longo do recebimento. Não representa
          percentual de apuração.
        </p>
      </div>
      <div class="segmented" role="group" aria-label="Granularidade da linha do tempo">
        <button
          type="button"
          :aria-pressed="granularity === '5m'"
          :class="{ ativo: granularity === '5m' }"
          @click="$emit('update:granularity', '5m')"
        >
          5 min
        </button>
        <button
          type="button"
          :aria-pressed="granularity === '1m'"
          :class="{ ativo: granularity === '1m' }"
          @click="$emit('update:granularity', '1m')"
        >
          1 min
        </button>
      </div>
    </div>

    <StateBlock
      v-if="error"
      estado="erro"
      titulo="Não foi possível carregar a linha do tempo"
      :descricao="error"
      acao="Tentar novamente"
      @acao="$emit('retry')"
    />
    <StateBlock
      v-else-if="loading && pontos.length === 0"
      estado="carregando"
      titulo="Carregando linha do tempo"
    />
    <StateBlock
      v-else-if="pontos.length === 0"
      estado="vazio"
      titulo="Linha do tempo indisponível"
      :descricao="aviso"
    >
      <p class="linha-tempo__oculto">O gráfico não é exibido sem pontos.</p>
    </StateBlock>

    <template v-else>
      <div class="linha-tempo__grafico">
        <Line :data="dadosGrafico" :options="opcoesGrafico" />
      </div>

      <div class="linha-tempo__controle">
        <button
          type="button"
          class="button button--ghost button--compacto"
          :disabled="indice === 0"
          aria-label="Ponto anterior da linha do tempo"
          @click="mover(-1)"
        >
          Anterior
        </button>
        <label class="linha-tempo__slider">
          <span>Ponto selecionado</span>
          <input
            v-model.number="indice"
            type="range"
            min="0"
            :max="Math.max(0, pontos.length - 1)"
            step="1"
            :aria-valuetext="
              selecionado
                ? `${formatarHora(selecionado.t)}, ${formatarNumero(selecionado.votos_acumulados)} votos acumulados`
                : 'Sem ponto selecionado'
            "
          />
        </label>
        <button
          type="button"
          class="button button--ghost button--compacto"
          :disabled="indice >= pontos.length - 1"
          aria-label="Próximo ponto da linha do tempo"
          @click="mover(1)"
        >
          Próximo
        </button>
      </div>

      <dl v-if="selecionado" class="linha-tempo__metricas" aria-live="polite">
        <div>
          <dt>Horário</dt>
          <dd>{{ formatarDataHora(selecionado.t) }}</dd>
        </div>
        <div>
          <dt>Votos acumulados</dt>
          <dd>{{ formatarNumero(selecionado.votos_acumulados) }}</dd>
        </div>
        <div>
          <dt>Seções com BU</dt>
          <dd>{{ formatarNumero(selecionado.secoes_com_bu_acumuladas) }}</dd>
        </div>
      </dl>
    </template>
  </section>
</template>
