<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { corPartido } from '../lib/colors'
import {
  formatarHora,
  formatarNumero,
  paraInputSaoPaulo,
} from '../lib/format'

const props = defineProps({
  series: { type: Array, default: () => [] },
  pontos: { type: Array, default: () => [] },
  corte: { type: String, default: null },
  candidato: { type: Number, default: null },
  candidatos: { type: Array, default: () => [] },
  avisos: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:corte'])

const canvas = ref(null)
const area = ref(null)
let observador = null
let quadro = null

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

const pontoAtual = computed(
  () => props.pontos[indiceCorte.value] ?? null,
)

const tempoCorte = computed(() => {
  if (!props.corte) return tempos.value.at(-1) ?? 0
  const valor = new Date(props.corte).getTime()
  return Number.isNaN(valor) ? (tempos.value.at(-1) ?? 0) : valor
})

const maxVotos = computed(() => {
  let maximo = 0
  for (const serie of props.series) {
    for (const ponto of serie.pontos ?? []) {
      if (ponto.votos_acumulados > maximo) maximo = ponto.votos_acumulados
    }
  }
  if (maximo === 0) {
    for (const ponto of props.pontos) {
      if (ponto.votos_acumulados > maximo) maximo = ponto.votos_acumulados
    }
  }
  return maximo || 1
})

const partidoPorNumero = computed(() => {
  const mapa = new Map()
  for (const candidato of props.candidatos) {
    mapa.set(candidato.nr_votavel, candidato.sg_partido)
  }
  return mapa
})

const rotulo = computed(() => {
  if (props.pontos.length === 0) return 'Linha do tempo indisponível'
  const primeiro = props.pontos[0]
  const ultimo = props.pontos.at(-1)
  return `Traçado do dia de ${formatarHora(primeiro.t)} a ${formatarHora(ultimo.t)}, com o corte em ${formatarHora(new Date(tempoCorte.value).toISOString())}. ${formatarNumero(ultimo.votos_acumulados)} votos acumulados em ${formatarNumero(ultimo.secoes_com_bu_acumuladas)} seções com BU.`
})

function formatarEixo(valor, divisor, sufixo) {
  if (valor === 0) return '0'
  const numero = valor / divisor
  return `${numero.toLocaleString('pt-BR', {
    maximumFractionDigits: numero < 10 ? 1 : 0,
  })}${sufixo}`
}

const formatadorDia = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

function rotuloHora(iso, comData) {
  const hora = formatarHora(iso)
  return comData ? `${formatadorDia.format(new Date(iso))} ${hora}` : hora
}

function pontosDaSerie(serie) {
  const pontos = (serie.pontos ?? []).slice()
  if (pontos.length === 0) return pontos
  const ultimo = pontos.at(-1)
  const fim = tempos.value.at(-1)
  if (fim && new Date(ultimo.t).getTime() < fim) {
    pontos.push({
      t: new Date(fim).toISOString(),
      votos_acumulados: ultimo.votos_acumulados,
    })
  }
  return pontos
}

function desenhar(progresso = 1) {
  const elemento = canvas.value
  if (!elemento) return
  const larguraCss = elemento.clientWidth
  const alturaCss = elemento.clientHeight
  if (!larguraCss || !alturaCss) return

  const dpr = window.devicePixelRatio || 1
  elemento.width = Math.round(larguraCss * dpr)
  elemento.height = Math.round(alturaCss * dpr)

  const ctx = elemento.getContext?.('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, larguraCss, alturaCss)

  const pad = { esq: 40, dir: 10, topo: 12, base: 20 }
  const largura = larguraCss - pad.esq - pad.dir
  const altura = alturaCss - pad.topo - pad.base

  const inicio = tempos.value[0] ?? 0
  const fim = tempos.value.at(-1) ?? 1
  const intervalo = Math.max(1, fim - inicio)
  const x = (tempo) => pad.esq + ((tempo - inicio) / intervalo) * largura
  const y = (votos) => pad.topo + altura - (votos / maxVotos.value) * altura

  ctx.font = '10px "Fragment Mono", monospace'
  ctx.textBaseline = 'middle'

  const divisor =
    maxVotos.value >= 1_000_000 ? 1_000_000 : maxVotos.value >= 1_000 ? 1_000 : 1
  const sufixo = divisor === 1_000_000 ? 'M' : divisor === 1_000 ? 'k' : ''

  for (let i = 0; i <= 3; i += 1) {
    const valor = (maxVotos.value / 3) * i
    const linhaY = Math.round(y(valor)) + 0.5
    ctx.strokeStyle = 'rgba(255, 181, 46, 0.09)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad.esq, linhaY)
    ctx.lineTo(pad.esq + largura, linhaY)
    ctx.stroke()

    ctx.fillStyle = '#7e9275'
    ctx.textAlign = 'right'
    ctx.fillText(formatarEixo(Math.round(valor), divisor, sufixo), pad.esq - 8, linhaY)
  }

  const marcas = [inicio, inicio + intervalo / 2, fim]
  const comData = new Date(inicio).toDateString() !== new Date(fim).toDateString()
  ctx.fillStyle = '#7e9275'
  marcas.forEach((marca, indice) => {
    ctx.textAlign = indice === 0 ? 'left' : indice === 1 ? 'center' : 'right'
    ctx.fillText(
      rotuloHora(new Date(marca).toISOString(), comData),
      x(marca),
      alturaCss - 8,
    )
  })

  const corteX = x(tempoCorte.value)
  const larguraCorte = Math.max(0, (corteX - pad.esq) * progresso)

  for (const serie of props.series) {
    const pontos = pontosDaSerie(serie)
    if (pontos.length === 0) continue
    const cor = corPartido(partidoPorNumero.value.get(serie.nr_votavel))
    const selecionado = props.candidato === serie.nr_votavel

    ctx.globalAlpha = 0.22
    ctx.strokeStyle = cor
    ctx.lineWidth = 1
    ctx.beginPath()
    pontos.forEach((ponto, indice) => {
      const px = x(new Date(ponto.t).getTime())
      const py = y(ponto.votos_acumulados)
      if (indice === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.stroke()

    ctx.save()
    ctx.beginPath()
    ctx.rect(pad.esq, 0, larguraCorte, alturaCss)
    ctx.clip()
    ctx.globalAlpha = 1
    ctx.lineWidth = selecionado ? 2.2 : 1.3
    ctx.beginPath()
    pontos.forEach((ponto, indice) => {
      const px = x(new Date(ponto.t).getTime())
      const py = y(ponto.votos_acumulados)
      if (indice === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.stroke()
    ctx.restore()
  }

  ctx.globalAlpha = 1
  ctx.strokeStyle = '#ffb52e'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 3])
  ctx.beginPath()
  ctx.moveTo(corteX + 0.5, pad.topo)
  ctx.lineTo(corteX + 0.5, pad.topo + altura)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#ffb52e'
  ctx.beginPath()
  ctx.moveTo(corteX - 4, pad.topo - 6)
  ctx.lineTo(corteX + 4, pad.topo - 6)
  ctx.lineTo(corteX, pad.topo)
  ctx.closePath()
  ctx.fill()

  if (props.series.length > 0) {
    let lider = null
    for (const serie of props.series) {
      const pontos = serie.pontos ?? []
      let ultimo = null
      for (const ponto of pontos) {
        if (new Date(ponto.t).getTime() <= tempoCorte.value) ultimo = ponto
      }
      if (ultimo && (!lider || ultimo.votos_acumulados > lider.votos)) {
        lider = { votos: ultimo.votos_acumulados, cor: corPartido(partidoPorNumero.value.get(serie.nr_votavel)) }
      }
    }
    if (lider) {
      ctx.fillStyle = lider.cor
      ctx.beginPath()
      ctx.arc(corteX, y(lider.votos), 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#0a0d0a'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
}

function animar() {
  if (quadro) cancelAnimationFrame(quadro)
  const reduzido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduzido || props.pontos.length === 0) {
    desenhar(1)
    return
  }
  const inicio = performance.now()
  const duracao = 520
  const passo = (agora) => {
    const progresso = Math.min(1, (agora - inicio) / duracao)
    const suave = 1 - (1 - progresso) ** 3
    desenhar(suave)
    if (progresso < 1) quadro = requestAnimationFrame(passo)
  }
  quadro = requestAnimationFrame(passo)
}

function aoIndice(evento) {
  const indice = Number(evento.target.value)
  const ponto = props.pontos[indice]
  if (ponto) emit('update:corte', paraInputSaoPaulo(ponto.t))
}

let arrastando = false

function aoApontar(evento) {
  const elemento = canvas.value
  if (!elemento || props.pontos.length === 0) return
  const caixa = elemento.getBoundingClientRect()
  const pad = { esq: 40, dir: 10 }
  const largura = caixa.width - pad.esq - pad.dir
  const relativo = Math.min(1, Math.max(0, (evento.clientX - caixa.left - pad.esq) / largura))
  const inicio = tempos.value[0]
  const fim = tempos.value.at(-1)
  const alvo = inicio + relativo * (fim - inicio)

  let melhor = 0
  let distancia = Infinity
  tempos.value.forEach((tempo, indice) => {
    const diferenca = Math.abs(tempo - alvo)
    if (diferenca < distancia) {
      distancia = diferenca
      melhor = indice
    }
  })

  const ponto = props.pontos[melhor]
  if (ponto) emit('update:corte', paraInputSaoPaulo(ponto.t))
}

function aoPressionar(evento) {
  arrastando = true
  evento.currentTarget.setPointerCapture?.(evento.pointerId)
  aoApontar(evento)
}

function aoMover(evento) {
  if (!arrastando) return
  aoApontar(evento)
}

function aoSoltar() {
  arrastando = false
}

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(() => desenhar(1))
    if (area.value) observador.observe(area.value)
  }
  document.fonts?.ready?.then(() => desenhar(1))
  animar()
})

onBeforeUnmount(() => {
  observador?.disconnect()
  if (quadro) cancelAnimationFrame(quadro)
})

watch(
  () => [props.series, props.pontos, props.corte, props.candidato],
  () => animar(),
  { deep: true },
)
</script>

<template>
  <section class="painel tracado" aria-labelledby="tracado-titulo">
    <header class="painel__cabecalho">
      <h2 id="tracado-titulo">Traçado do dia</h2>
      <p class="painel__meta">
        <b>{{ formatarHora(pontoAtual?.t) }}</b> · corte<br />
        {{ formatarNumero(pontoAtual?.secoes_com_bu_acumuladas) }} seções ·
        {{ formatarNumero(pontoAtual?.votos_acumulados) }} votos
      </p>
    </header>

    <div v-if="pontos.length === 0" class="tracado__vazio">
      <strong>Linha do tempo indisponível</strong>
      <p>
        {{ avisos[0]?.mensagem ?? 'A fonte deste ano não permite linha do tempo por horário.' }}
      </p>
    </div>

    <template v-else>
      <div ref="area" class="tracado__area">
        <canvas
          ref="canvas"
          class="tracado__canvas"
          role="img"
          :aria-label="rotulo"
          @pointerdown="aoPressionar"
          @pointermove="aoMover"
          @pointerup="aoSoltar"
          @pointercancel="aoSoltar"
        />
      </div>

      <div class="curso">
        <label class="sr-only" for="curso-corte">Corte do dia</label>
        <input
          id="curso-corte"
          type="range"
          min="0"
          :max="Math.max(0, pontos.length - 1)"
          step="1"
          :value="indiceCorte"
          :aria-valuetext="`Corte às ${formatarHora(pontoAtual?.t)}`"
          @input="aoIndice"
        />
        <p class="curso__leitura">
          <span>corte <b>{{ formatarHora(pontoAtual?.t) }}</b></span>
          <span>seções <b>{{ formatarNumero(pontoAtual?.secoes_com_bu_acumuladas) }}</b></span>
          <span>votos <b>{{ formatarNumero(pontoAtual?.votos_acumulados) }}</b></span>
        </p>
      </div>
    </template>
  </section>
</template>
