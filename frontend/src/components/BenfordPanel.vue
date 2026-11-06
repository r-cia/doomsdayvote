<script setup>
import { computed, ref } from 'vue'
import BenfordFaixa from './BenfordFaixa.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { formatarDecimal, formatarNumero } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  niveis: { type: Object, default: null },
  carregandoNiveis: { type: Boolean, default: false },
  selecionado: { type: Number, default: null },
  ordenacao: { type: Object, default: null },
})

const emit = defineEmits(['select', 'ordenar'])

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
</script>

<template>
  <section class="painel" aria-labelledby="benford-titulo">
    <header class="painel__cabecalho">
      <h2 id="benford-titulo">{{ $t('benford.titulo') }}</h2>
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
        <div class="benford__visual">
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
          <p v-if="aguardandoNivel" class="vazio">{{ $t('comum.carregando') }}</p>
          <p v-else-if="digitos.length === 0" class="vazio">{{ $t('comum.semDados') }}</p>
          <BenfordFaixa
            v-else
            :titulo="$t('benford.aria', { nome: ativo?.nm_votavel })"
            :digitos="digitos"
            :faixa="faixas"
          />
        </div>

        <div class="benford__tabela">
          <table>
            <caption class="sr-only">
              {{ $t('benford.caption') }}
            </caption>
            <thead>
              <tr>
                <ThOrdenavel coluna="nm_votavel" :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('comum.candidato') }}</ThOrdenavel>
                <ThOrdenavel coluna="n" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">n</ThOrdenavel>
                <ThOrdenavel coluna="mad" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">MAD</ThOrdenavel>
                <th scope="col" class="num">p</th>
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
                <td class="num">{{ formatarDecimal(candidato.mad, 4) }}</td>
                <td class="num">{{ formatarDecimal(candidato.monte_carlo?.p_valor, 4) }}</td>
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
