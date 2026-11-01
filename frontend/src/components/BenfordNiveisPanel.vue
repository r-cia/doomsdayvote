<script setup>
import { computed } from 'vue'
import TabelaScroll from './TabelaScroll.vue'
import { formatarDecimal, formatarNumero } from '../lib/format'
import { useOrdenacao } from '../composables/ordenacao'

const props = defineProps({
  dados: { type: Object, default: null },
  atualizando: { type: Boolean, default: false },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const { alternar, ariaSort, seta } = props.ordenacao

const candidatos = computed(() => props.dados?.candidatos ?? [])

function mad(nivel) {
  return formatarDecimal(nivel?.mad, 4, 4)
}

function pValor(nivel) {
  return formatarDecimal(nivel?.monte_carlo?.p_valor, 4, 4)
}
</script>

<template>
  <section class="painel" aria-labelledby="benford-niveis-titulo">
    <header class="painel__cabecalho">
      <h2 id="benford-niveis-titulo">{{ $t('estatistica.benfordNiveis') }}</h2>
      <p class="painel__meta">
        <b>{{ candidatos.length }}</b> {{ $t('unidade.candidato', candidatos.length) }}
      </p>
    </header>

    <div v-if="candidatos.length === 0" class="vazio">
      {{ $t('comum.semDados') }}
    </div>

    <TabelaScroll v-else :atualizando="atualizando">
      <table>
        <caption class="sr-only">
          {{ $t('estatistica.aderenciaBenfordNiveis') }}
        </caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_votavel')"><button type="button" @click="alternar('nm_votavel')">{{ $t('tabela.candidato') }}{{ seta('nm_votavel') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('secao_n')"><button type="button" @click="alternar('secao_n')">{{ $t('tabela.secaoN') }}{{ seta('secao_n') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('secao_mad')"><button type="button" @click="alternar('secao_mad')">{{ $t('tabela.secaoMad') }}{{ seta('secao_mad') }}</button></th>
            <th scope="col" class="num">{{ $t('tabela.secaoP') }}</th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('zona_n')"><button type="button" @click="alternar('zona_n')">{{ $t('tabela.zonaN') }}{{ seta('zona_n') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('zona_mad')"><button type="button" @click="alternar('zona_mad')">{{ $t('tabela.zonaMad') }}{{ seta('zona_mad') }}</button></th>
            <th scope="col" class="num">{{ $t('tabela.zonaP') }}</th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('municipio_n')"><button type="button" @click="alternar('municipio_n')">{{ $t('tabela.municipioN') }}{{ seta('municipio_n') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('municipio_mad')"><button type="button" @click="alternar('municipio_mad')">{{ $t('tabela.municipioMad') }}{{ seta('municipio_mad') }}</button></th>
            <th scope="col" class="num">{{ $t('tabela.municipioP') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidato in candidatos" :key="candidato.nr_votavel">
            <td>{{ candidato.nm_votavel }}</td>
            <td class="num">{{ formatarNumero(candidato.niveis.secao.n) }}</td>
            <td class="num">
              {{ mad(candidato.niveis.secao) }}
            </td>
            <td class="num">{{ pValor(candidato.niveis.secao) }}</td>
            <td class="num">{{ formatarNumero(candidato.niveis.zona.n) }}</td>
            <td class="num">
              {{ mad(candidato.niveis.zona) }}
            </td>
            <td class="num">{{ pValor(candidato.niveis.zona) }}</td>
            <td class="num">{{ formatarNumero(candidato.niveis.municipio.n) }}</td>
            <td class="num">
              {{ mad(candidato.niveis.municipio) }}
            </td>
            <td class="num">{{ pValor(candidato.niveis.municipio) }}</td>
          </tr>
        </tbody>
      </table>
    </TabelaScroll>
    <p v-if="candidatos.length" class="nota">{{ $t('estatistica.monteCarloNota') }}</p>
  </section>
</template>
