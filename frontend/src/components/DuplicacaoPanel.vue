<script setup>
import { computed } from 'vue'

const props = defineProps({
  dados: { type: Object, default: null },
})

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
  const visiveis = valores.slice(0, 12).join(', ')
  return valores.length > 12 ? `${visiveis}…` : visiveis
}
</script>

<template>
  <section class="painel" aria-labelledby="duplicacao-titulo">
    <header class="painel__cabecalho">
      <h2 id="duplicacao-titulo">{{ $t('duplicacao.titulo') }}</h2>
      <p class="painel__meta">
        {{ $t('duplicacao.vetor') }}<br />
        <b>{{ dados?.total_grupos ?? 0 }}</b> {{ $t('duplicacao.grupos') }} ·
        {{ $t('duplicacao.nSecoes', { n: dados?.total_secoes ?? 0 }) }}
      </p>
    </header>

    <div v-if="grupos.length === 0" class="vazio">
      {{ $t('duplicacao.vazio') }}
    </div>

    <div v-else class="tabela-scroll">
      <table>
        <caption class="sr-only">
          {{ $t('duplicacao.caption') }}
        </caption>
        <thead>
          <tr>
            <th scope="col" class="num">{{ $t('duplicacao.secoes') }}</th>
            <th scope="col">{{ $t('comum.uf') }}</th>
            <th scope="col">{{ $t('comum.municipio') }}</th>
            <th scope="col">{{ $t('duplicacao.zonas') }}</th>
            <th scope="col">{{ $t('duplicacao.numeros') }}</th>
            <th scope="col">{{ $t('duplicacao.sinalizadores') }}</th>
            <th scope="col">{{ $t('comum.candidato') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="grupo in grupos" :key="grupo.assinatura">
            <td class="num">{{ grupo.secoes.length }}</td>
            <td>{{ grupo.secoes[0].sg_uf }}</td>
            <td>{{ grupo.secoes[0].nm_municipio || grupo.secoes[0].cd_municipio_tse }}</td>
            <td>{{ zonas(grupo) }}</td>
            <td>{{ numeros(grupo) }}</td>
            <td>
              <span v-if="grupo.mesma_zona" class="chip chip--warn">{{ $t('duplicacao.mesmaZona') }}</span>
              <span v-if="grupo.secoes_consecutivas" class="chip chip--alert">
                {{ $t('duplicacao.consecutivas') }}
              </span>
              <span v-if="grupo.mesmo_municipio" class="chip chip--warn">{{ $t('duplicacao.mesmoMunicipio') }}</span>
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
    </div>
  </section>
</template>
