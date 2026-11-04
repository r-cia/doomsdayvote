<script setup>
import { computed, ref } from 'vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { formatarDecimal, formatarNumero } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  atualizando: { type: Boolean, default: false },
  ordenacao: { type: Object, default: null },
})

defineEmits(['ordenar'])

const NIVEIS = [
  ['secao', 'comum.secao'],
  ['zona', 'comum.zona'],
  ['municipio', 'comum.municipio'],
]
const nivel = ref('secao')

const candidatos = computed(() => props.dados?.candidatos ?? [])

const mad = (valor) => formatarDecimal(valor?.mad, 4)
const pValor = (valor) => formatarDecimal(valor?.monte_carlo?.p_valor, 4)
</script>

<template>
  <section class="painel" aria-labelledby="benford-niveis-titulo" :aria-busy="atualizando">
    <header class="painel__cabecalho">
      <h2 id="benford-niveis-titulo">{{ $t('benford.niveisTitulo') }}</h2>
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
          <col style="width: 40%" />
          <col style="width: 20%" />
          <col style="width: 20%" />
          <col style="width: 20%" />
        </colgroup>
        <thead>
          <tr>
            <ThOrdenavel coluna="nm_votavel" :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">{{ $t('comum.candidato') }}</ThOrdenavel>
            <ThOrdenavel :coluna="`${nivel}_n`" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">n</ThOrdenavel>
            <ThOrdenavel :coluna="`${nivel}_mad`" numero :ordenacao="ordenacao" @ordenar="$emit('ordenar', $event)">MAD</ThOrdenavel>
            <th scope="col" class="tabela__numero num">p</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidato in candidatos" :key="candidato.nr_votavel">
            <td>{{ candidato.nm_votavel }}</td>
            <td class="num">{{ formatarNumero(candidato.niveis[nivel].n) }}</td>
            <td class="num">{{ mad(candidato.niveis[nivel]) }}</td>
            <td class="num">{{ pValor(candidato.niveis[nivel]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
