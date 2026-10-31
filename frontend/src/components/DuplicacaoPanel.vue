<script setup>
import { computed } from 'vue'
import CoberturaBlock from './CoberturaBlock.vue'
import TabelaScroll from './TabelaScroll.vue'
import { useOrdenacao } from '../composables/ordenacao'

const props = defineProps({
  dados: { type: Object, default: null },
  atualizando: { type: Boolean, default: false },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const { alternar, ariaSort, seta } = props.ordenacao

const grupos = computed(() => props.dados?.grupos ?? [])

function zonas(grupo) {
  const valores = [...new Set(grupo.secoes.map((secao) => secao.nr_zona))].sort(
    (a, b) => a - b,
  )
  if (valores.length === 0) return '—'
  return valores.join(', ')
}

function numeros(grupo) {
  const valores = [...new Set(grupo.secoes.map((secao) => secao.nr_secao))].sort(
    (a, b) => a - b,
  )
  if (valores.length === 0) return '—'
  const visiveis = valores.slice(0, 12).join(', ')
  return valores.length > 12 ? `${visiveis}…` : visiveis
}
</script>

<template>
  <section class="painel" aria-labelledby="duplicacao-titulo">
    <header class="painel__cabecalho">
      <h2 id="duplicacao-titulo">{{ $t('estatistica.duplicacao') }}</h2>
      <p class="painel__meta">
        <b>{{ dados?.total_grupos ?? 0 }}</b> grupos ·
        {{ dados?.total_secoes ?? 0 }} seções ·
        escopo {{ dados?.total_secoes_escopo ?? 0 }}
      </p>
    </header>

    <div v-if="grupos.length === 0" class="vazio">
      {{ $t('comum.semDados') }}
    </div>

    <TabelaScroll v-else :atualizando="atualizando">
      <table>
        <caption class="sr-only">
          Grupos de seções com o mesmo vetor de votos
        </caption>
        <thead>
          <tr>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('secoes')"><button type="button" @click="alternar('secoes')">Seções{{ seta('secoes') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('sg_uf')"><button type="button" @click="alternar('sg_uf')">UF{{ seta('sg_uf') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_municipio')"><button type="button" @click="alternar('nm_municipio')">Município{{ seta('nm_municipio') }}</button></th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('nr_local_votacao')"><button type="button" @click="alternar('nr_local_votacao')">Local{{ seta('nr_local_votacao') }}</button></th>
            <th scope="col">Zonas</th>
            <th scope="col">Números</th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('votaveis')"><button type="button" @click="alternar('votaveis')">Votáveis{{ seta('votaveis') }}</button></th>
            <th scope="col" class="num">Aptos</th>
            <th scope="col">Sinalizadores</th>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('candidato')"><button type="button" @click="alternar('candidato')">Candidato{{ seta('candidato') }}</button></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="grupo in grupos" :key="grupo.assinatura">
            <td class="num">{{ grupo.secoes.length }}</td>
            <td>{{ grupo.secoes[0].sg_uf }}</td>
            <td>{{ grupo.secoes[0].nm_municipio || grupo.secoes[0].cd_municipio_tse }}</td>
            <td>{{ grupo.secoes[0].nr_local_votacao ?? '—' }}</td>
            <td>{{ zonas(grupo) }}</td>
            <td>{{ numeros(grupo) }}</td>
            <td class="num">{{ grupo.votaveis }}</td>
            <td class="num">
              {{ grupo.secoes.map((s) => s.qt_aptos ?? '—').join(', ') }}
            </td>
            <td>
              <span v-if="grupo.mesma_zona" class="chip chip--warn">mesma zona</span>
              <span v-if="grupo.secoes_consecutivas" class="chip chip--alert">
                consecutivas
              </span>
              <span v-if="grupo.mesmo_municipio" class="chip chip--warn">mesmo município</span>
              <span v-if="grupo.mesmo_local" class="chip chip--warn">mesmo local</span>
              <template v-if="!grupo.mesma_zona && !grupo.secoes_consecutivas && !grupo.mesmo_municipio">
                <span
                  v-if="
                    grupo.secoes.length === 2 &&
                    grupo.secoes[0].nm_municipio &&
                    grupo.secoes[1].nm_municipio &&
                    grupo.secoes[0].nm_municipio !== grupo.secoes[1].nm_municipio
                  "
                  class="chip chip--warn"
                >
                  {{ grupo.secoes[1].nm_municipio }}-{{ grupo.secoes[1].sg_uf }}
                </span>
                <span v-else>—</span>
              </template>
            </td>
            <td>
              <span v-if="grupo.vencedor_comum">
                {{ grupo.vencedor_comum.nm_votavel }} ({{ grupo.vencedor_comum.sg_partido }} {{ grupo.vencedor_comum.nr_votavel }})
              </span>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </TabelaScroll>
    <CoberturaBlock :dados="dados" />
  </section>
</template>
