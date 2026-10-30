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

const secoes = computed(() => props.dados?.secoes ?? [])
const parametros = computed(() => props.dados?.parametros ?? {})

function score(valor) {
  return formatarDecimal(valor, 3, 3)
}


</script>

<template>
  <section class="painel" aria-labelledby="outliers-titulo">
    <header class="painel__cabecalho">
      <h2 id="outliers-titulo">{{ $t('estatistica.isolamento') }}</h2>
      <p class="painel__meta">
        <b>{{ dados?.total_secoes ?? 0 }}</b> seções · amostra LOF {{ parametros.lof?.amostra ?? dados?.lof?.amostra ?? 0 }}
        <template v-if="parametros.lof?.limitado ?? dados?.lof?.limitado"> (limitada)</template>
      </p>
    </header>

    <div v-if="secoes.length === 0" class="vazio">
      {{ $t('comum.semSecoes') }}
    </div>

    <TabelaScroll v-else :atualizando="atualizando">
      <table>
        <caption class="sr-only">
          Seções com maior score de anomalia
        </caption>
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('sg_uf')"><button type="button" @click="alternar('sg_uf')">UF{{ seta('sg_uf') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_municipio')"><button type="button" @click="alternar('nm_municipio')">Município{{ seta('nm_municipio') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_zona')"><button type="button" @click="alternar('nr_zona')">Zona{{ seta('nr_zona') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_secao')"><button type="button" @click="alternar('nr_secao')">Seção{{ seta('nr_secao') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('score_if')"><button type="button" @click="alternar('score_if')">IF{{ seta('score_if') }}</button></th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('score_lof')"><button type="button" @click="alternar('score_lof')">LOF{{ seta('score_lof') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('candidato')"><button type="button" @click="alternar('candidato')">Candidato{{ seta('candidato') }}</button></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="secao in secoes" :key="secao.id">
            <td>{{ secao.sg_uf }}</td>
            <td>{{ secao.nm_municipio || secao.cd_municipio_tse }}</td>
            <td class="num">{{ secao.nr_zona }}</td>
            <td class="num">{{ secao.nr_secao }}</td>
            <td class="num">
              {{ score(secao.score_if) }}
            </td>
            <td class="num">
              {{ score(secao.score_lof) }}
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
    </TabelaScroll>
  </section>
</template>
