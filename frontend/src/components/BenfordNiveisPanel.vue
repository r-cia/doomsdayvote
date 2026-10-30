<script setup>
import { computed } from 'vue'
import TabelaScroll from './TabelaScroll.vue'
import { formatarDecimal } from '../lib/format'
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
</script>

<template>
  <section class="painel" aria-labelledby="benford-niveis-titulo">
    <header class="painel__cabecalho">
      <h2 id="benford-niveis-titulo">{{ $t('estatistica.benford') }}</h2>
      <p class="painel__meta">
        <b>{{ candidatos.length }}</b> candidatos
      </p>
    </header>

    <div v-if="candidatos.length === 0" class="vazio">
      {{ $t('comum.semDados') }}
    </div>

    <TabelaScroll v-else :atualizando="atualizando">
      <table>
        <caption class="sr-only">
          Aderência à lei de Benford por candidato em seção, zona e município
        </caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_votavel')"><button type="button" @click="alternar('nm_votavel')">Candidato{{ seta('nm_votavel') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('secao_n')"><button type="button" @click="alternar('secao_n')">Seção n{{ seta('secao_n') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('secao_mad')"><button type="button" @click="alternar('secao_mad')">Seção MAD{{ seta('secao_mad') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('zona_n')"><button type="button" @click="alternar('zona_n')">Zona n{{ seta('zona_n') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('zona_mad')"><button type="button" @click="alternar('zona_mad')">Zona MAD{{ seta('zona_mad') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('municipio_n')"><button type="button" @click="alternar('municipio_n')">Município n{{ seta('municipio_n') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('municipio_mad')"><button type="button" @click="alternar('municipio_mad')">Município MAD{{ seta('municipio_mad') }}</button></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidato in candidatos" :key="candidato.nr_votavel">
            <td>{{ candidato.nm_votavel }}</td>
            <td class="num">{{ candidato.niveis.secao.n }}</td>
            <td class="num">
              {{ mad(candidato.niveis.secao) }}
            </td>
            <td class="num">{{ candidato.niveis.zona.n }}</td>
            <td class="num">
              {{ mad(candidato.niveis.zona) }}
            </td>
            <td class="num">{{ candidato.niveis.municipio.n }}</td>
            <td class="num">
              {{ mad(candidato.niveis.municipio) }}
            </td>
          </tr>
        </tbody>
      </table>
    </TabelaScroll>
  </section>
</template>
