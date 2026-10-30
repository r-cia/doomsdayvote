<script setup>
import { computed } from 'vue'
import { formatarDecimal } from '../lib/format'

const props = defineProps({
  dados: { type: Object, default: null },
  ordenacao: { type: String, default: 'if' },
})

const emit = defineEmits(['update:ordenacao'])

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
      <div class="estatistica-controle">
        <label class="campo campo--curto">
          <span class="campo__rotulo">Ordenar por</span>
          <select
            :value="ordenacao"
            @change="emit('update:ordenacao', $event.target.value)"
          >
            <option value="if">Maior IF</option>
            <option value="lof">Maior LOF</option>
          </select>
        </label>
      </div>
      <p class="painel__meta">
        <b>{{ dados?.total_secoes ?? 0 }}</b> seções · amostra LOF {{ parametros.lof?.amostra ?? dados?.lof?.amostra ?? 0 }}
        <template v-if="parametros.lof?.limitado ?? dados?.lof?.limitado"> (limitada)</template>
      </p>
      <p class="painel__meta">
        Features: {{ (dados?.features ?? []).join(', ') }}
      </p>
    </header>

    <div v-if="secoes.length === 0" class="vazio">
      {{ $t('comum.semSecoes') }}
    </div>

    <div v-else class="tabela-scroll">
      <table>
        <caption class="sr-only">
          Seções com maior score de anomalia
        </caption>
        <thead>
          <tr>
            <th scope="col">UF</th>
            <th scope="col">Município</th>
            <th scope="col" class="num">Zona</th>
            <th scope="col" class="num">Seção</th>
            <th scope="col" class="num">IF</th>
            <th scope="col" class="num">LOF</th>
            <th scope="col">Candidato</th>
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
    </div>
  </section>
</template>
