<script setup>
import { computed } from 'vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { formatarDecimal, formatarNumero } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  atualizando: { type: Boolean, default: false },
  ordenacao: { type: Object, default: null },
})

defineEmits(['ordenar'])

const candidatos = computed(() => props.dados?.candidatos ?? [])
const NIVEIS = [
  ['secao', 'comum.secao'],
  ['zona', 'comum.zona'],
  ['municipio', 'comum.municipio'],
]

const mad = (nivel) => formatarDecimal(nivel?.mad, 4)
const pValor = (nivel) => formatarDecimal(nivel?.monte_carlo?.p_valor, 4)
</script>

<template>
  <section class="painel" aria-labelledby="benford-niveis-titulo" :aria-busy="atualizando">
    <header class="painel__cabecalho">
      <h2 id="benford-niveis-titulo">{{ $t('benford.niveisTitulo') }}</h2>
      <p class="painel__meta">
        <b>{{ formatarNumero(candidatos.length) }}</b> {{ $t('benford.niveisCandidatos') }}
      </p>
    </header>

    <div v-if="candidatos.length === 0" class="vazio">
      {{ $t('comum.semDados') }}
    </div>

    <div v-else class="tabela-scroll" :class="{ atualizando }">
      <span v-if="atualizando" class="sr-only" role="status">{{ $t('comum.carregando') }}</span>
      <table class="tabela-fixa">
        <caption class="sr-only">
          {{ $t('benford.niveisCaption') }}
        </caption>
        <colgroup>
          <col style="width: 19%" />
          <col style="width: 9%" />
          <col style="width: 9%" />
          <col style="width: 9%" />
          <col style="width: 9%" />
          <col style="width: 9%" />
          <col style="width: 9%" />
          <col style="width: 9%" />
          <col style="width: 9%" />
          <col style="width: 9%" />
        </colgroup>
        <thead>
          <tr>
            <ThOrdenavel coluna="nm_votavel" :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comum.candidato') }}</ThOrdenavel>
            <template v-for="[chave, rotulo] in NIVEIS" :key="chave">
              <ThOrdenavel :coluna="`${chave}_n`" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t(rotulo) }} n</ThOrdenavel>
              <ThOrdenavel :coluna="`${chave}_mad`" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t(rotulo) }} MAD</ThOrdenavel>
              <th scope="col" class="tabela__numero num">{{ $t(rotulo) }} p</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidato in candidatos" :key="candidato.nr_votavel">
            <td>{{ candidato.nm_votavel }}</td>
            <template v-for="[chave] in NIVEIS" :key="chave">
              <td class="num">{{ formatarNumero(candidato.niveis[chave].n) }}</td>
              <td class="num">{{ mad(candidato.niveis[chave]) }}</td>
              <td class="num">{{ pValor(candidato.niveis[chave]) }}</td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
