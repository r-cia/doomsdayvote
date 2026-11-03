<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatarNumero, formatarPercentual } from '../lib/format'

const { t } = useI18n()
const props = defineProps({
  dados: { type: Object, default: null },
  niveis: { type: Object, default: null },
  carregandoNiveis: { type: Boolean, default: false },
  selecionado: { type: Number, default: null },
})

const emit = defineEmits(['select'])

const NIVEIS = [
  ['secao', 'comum.secao'],
  ['zona', 'comum.zona'],
  ['municipio', 'comum.municipio'],
]
const nivel = ref('secao')

const minimo = computed(() => props.dados?.minimo_votos ?? 10)
const candidatos = computed(() => props.dados?.candidatos ?? [])

const ativo = computed(() => {
  if (candidatos.value.length === 0) return null
  return (
    candidatos.value.find((candidato) => candidato.nr_votavel === props.selecionado) ??
    candidatos.value[0]
  )
})

const resultado = computed(() => {
  if (!ativo.value) return null
  if (nivel.value === 'secao') return ativo.value
  const doNivel = props.niveis?.candidatos?.find(
    (candidato) => candidato.nr_votavel === ativo.value.nr_votavel,
  )
  return doNivel?.niveis?.[nivel.value] ?? null
})

const aguardandoNivel = computed(() => nivel.value !== 'secao' && !props.niveis && props.carregandoNiveis)
const faixas = computed(() => resultado.value?.monte_carlo?.faixa_digitos ?? null)
const digitos = computed(() => (resultado.value?.n > 0 ? resultado.value.digitos ?? [] : []))

const L = 360
const A = 160
const MARGEM = { esq: 30, dir: 8, topo: 8, base: 22 }
const larguraUtil = L - MARGEM.esq - MARGEM.dir
const alturaUtil = A - MARGEM.topo - MARGEM.base

const maximo = computed(() => {
  const valores = digitos.value.flatMap((d) => [d.observado_percentual, d.esperado_percentual])
  for (const f of faixas.value ?? []) valores.push(f.p975)
  return Math.max(10, Math.ceil(Math.max(...valores, 0) / 5) * 5)
})

const passo = computed(() => larguraUtil / 9)
const x = (indice) => MARGEM.esq + passo.value * indice + passo.value / 2
const y = (valor) => MARGEM.topo + alturaUtil * (1 - valor / maximo.value)
const curvaEsperada = computed(() =>
  digitos.value.map((d, i) => `${x(i)},${y(d.esperado_percentual)}`).join(' '),
)
const faixaDe = (digito) => faixas.value?.find((f) => f.digito === digito) ?? null

function formatarMad(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

const pct = (valor) => formatarPercentual(valor)

function titulo(d) {
  const faixa = faixaDe(d.digito)
  return t('benford.digito', { d: d.digito, obs: pct(d.observado_percentual), esp: pct(d.esperado_percentual) }) +
    (faixa ? t('benford.faixaDe', { de: pct(faixa.p025), ate: pct(faixa.p975) }) : '')
}
</script>

<template>
  <section class="painel" aria-labelledby="benford-titulo">
    <header class="painel__cabecalho">
      <h2 id="benford-titulo">{{ $t('benford.titulo') }}</h2>
      <div class="segmented" role="group" :aria-label="$t('benford.nivel')">
        <button
          v-for="[chave, rotulo] in NIVEIS"
          :key="chave"
          type="button"
          :aria-pressed="nivel === chave"
          :class="{ ativo: nivel === chave }"
          @click="nivel = chave"
        >
          {{ $t(rotulo) }}
        </button>
      </div>
      <p class="painel__meta">
        {{ $t('benford.primeiroDigito') }}<br />
        <b>{{ formatarNumero(resultado?.n) }}</b> {{ nivel === 'secao' ? $t('benford.secoes') : $t('benford.unidades') }}
      </p>
    </header>

    <div v-if="!dados || candidatos.length === 0" class="vazio">
      {{ $t('benford.vazio', { minimo }) }}
    </div>

    <template v-else>
      <div class="benford">
        <div class="benford__grafico-wrap">
          <p v-if="aguardandoNivel" class="vazio">{{ $t('comum.carregando') }}</p>
          <p v-else-if="digitos.length === 0" class="vazio">{{ $t('comum.semDados') }}</p>
          <template v-else>
            <svg
              class="benford__svg"
              :viewBox="`0 0 ${L} ${A}`"
              role="img"
              :aria-label="$t('benford.aria', { nome: ativo?.nm_votavel })"
            >
              <g v-for="(d, i) in digitos" :key="d.digito">
                <rect
                  v-if="faixaDe(d.digito)"
                  class="benford__faixa"
                  :x="x(i) - passo / 2 + 2"
                  :y="y(faixaDe(d.digito).p975)"
                  :width="passo - 4"
                  :height="Math.max(1, y(faixaDe(d.digito).p025) - y(faixaDe(d.digito).p975))"
                />
                <rect
                  class="benford__barra"
                  :x="x(i) - passo / 4"
                  :y="y(d.observado_percentual)"
                  :width="passo / 2"
                  :height="Math.max(0, y(0) - y(d.observado_percentual))"
                >
                  <title>{{ titulo(d) }}</title>
                </rect>
                <text class="benford__rotulo" :x="x(i)" :y="A - 6" text-anchor="middle">{{ d.digito }}</text>
              </g>
              <polyline class="benford__curva" :points="curvaEsperada" fill="none" />
              <text class="benford__rotulo" :x="MARGEM.esq - 4" :y="y(maximo) + 8" text-anchor="end">{{ maximo }}%</text>
              <text class="benford__rotulo" :x="MARGEM.esq - 4" :y="y(0)" text-anchor="end">0%</text>
            </svg>
            <p class="benford__legenda">
              <span><i class="benford__chave benford__chave--obs" aria-hidden="true" /> {{ $t('benford.observado') }}</span>
              <span><i class="benford__chave benford__chave--esp" aria-hidden="true" /> {{ $t('benford.esperado') }}</span>
              <span v-if="faixas"><i class="benford__chave benford__chave--faixa" aria-hidden="true" /> {{ $t('benford.faixa') }}</span>
            </p>
          </template>
        </div>

        <div class="benford__tabela">
          <table>
            <caption class="sr-only">
              {{ $t('benford.caption') }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ $t('comum.candidato') }}</th>
                <th scope="col" class="num">n</th>
                <th scope="col" class="num">MAD</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="candidato in candidatos"
                :key="candidato.nr_votavel"
                :data-ativo="ativo?.nr_votavel === candidato.nr_votavel"
              >
                <td>
                  <button
                    type="button"
                    :aria-pressed="ativo?.nr_votavel === candidato.nr_votavel"
                    @click="emit('select', candidato.nr_votavel)"
                  >
                    {{ candidato.nm_votavel }}
                  </button>
                </td>
                <td class="num">{{ formatarNumero(candidato.n) }}</td>
                <td class="num">{{ formatarMad(candidato.mad) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="benford__rodape">
        <p class="nota">
          <b>{{ formatarNumero(ativo?.secoes_abaixo_minimo) }}</b> {{ $t('benford.abaixoMinimo') }}
        </p>
      </div>
    </template>
  </section>
</template>
