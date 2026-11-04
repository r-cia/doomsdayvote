<script setup>
import { computed } from 'vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { formatarDecimal } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  ordenacao: { type: Object, default: null },
})

const emit = defineEmits(['ordenar'])

const secoes = computed(() => props.dados?.secoes ?? [])
const limiarIf = computed(() => props.dados?.isolamento?.limiar ?? 0.6)
const limiarLof = computed(() => props.dados?.lof?.limiar ?? 2)

function score(valor) {
  if (valor === null || valor === undefined) return '—'
  return formatarDecimal(valor, 3)
}

function tomIf(valor) {
  return Number(valor) >= limiarIf.value ? 'chip--alert' : ''
}

function tomLof(valor) {
  if (valor === null || valor === undefined) return ''
  return Number(valor) >= limiarLof.value ? 'chip--alert' : ''
}
</script>

<template>
  <section class="painel" aria-labelledby="outliers-titulo">
    <header class="painel__cabecalho">
      <h2 id="outliers-titulo">{{ $t('outliers.titulo') }}</h2>
      <p class="painel__meta">
        <b>{{ dados?.total_secoes ?? 0 }}</b> {{ $t('outliers.secoesIf', { limiar: limiarIf }) }}<br />
        {{ $t('outliers.lofAmostra', { limiar: limiarLof, n: dados?.lof?.amostra ?? 0 }) }}
        <template v-if="dados?.lof?.limitado"> {{ $t('outliers.limitada') }}</template>
      </p>
    </header>

    <div v-if="secoes.length === 0" class="vazio">
      {{ $t('outliers.vazio') }}
    </div>

    <div v-else class="tabela-scroll">
      <table>
        <caption class="sr-only">
          {{ $t('outliers.caption') }}
        </caption>
        <thead>
          <tr>
            <ThOrdenavel coluna="sg_uf" :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('comum.uf') }}</ThOrdenavel>
            <ThOrdenavel coluna="nm_municipio" :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('comum.municipio') }}</ThOrdenavel>
            <ThOrdenavel coluna="nr_zona" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('comum.zona') }}</ThOrdenavel>
            <ThOrdenavel coluna="nr_secao" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('comum.secao') }}</ThOrdenavel>
            <ThOrdenavel coluna="score_if" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">IF</ThOrdenavel>
            <ThOrdenavel coluna="score_lof" numero :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">LOF</ThOrdenavel>
            <ThOrdenavel coluna="candidato" :ordenacao="ordenacao" @ordenar="emit('ordenar', $event)">{{ $t('comum.candidato') }}</ThOrdenavel>
          </tr>
        </thead>
        <tbody>
          <tr v-for="secao in secoes" :key="secao.id">
            <td>{{ secao.sg_uf }}</td>
            <td>{{ secao.nm_municipio || secao.cd_municipio_tse }}</td>
            <td class="num">{{ secao.nr_zona }}</td>
            <td class="num">{{ secao.nr_secao }}</td>
            <td class="num">
              <span class="chip" :class="tomIf(secao.score_if)">
                {{ score(secao.score_if) }}
              </span>
            </td>
            <td class="num">
              <span class="chip" :class="tomLof(secao.score_lof)">
                {{ score(secao.score_lof) }}
              </span>
            </td>
            <td>
              <span v-if="secao.vencedor">
                {{ secao.vencedor.nm_votavel }} ({{ secao.vencedor.sg_partido }} {{ secao.vencedor.nr_votavel }})
              </span>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
