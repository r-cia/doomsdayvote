<script setup>
import { computed } from 'vue'

const props = defineProps({
  dados: { type: Object, default: null },
})

const secoes = computed(() => props.dados?.secoes ?? [])
const limiarIf = computed(() => props.dados?.isolamento?.limiar ?? 0.6)
const limiarLof = computed(() => props.dados?.lof?.limiar ?? 2)

function score(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
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
      <h2 id="outliers-titulo">Isolamento e LOF</h2>
      <p class="painel__meta">
        <b>{{ dados?.total_secoes ?? 0 }}</b> seções · IF ≥ {{ limiarIf }}<br />
        LOF ≥ {{ limiarLof }} · amostra {{ dados?.lof?.amostra ?? 0 }}
        <template v-if="dados?.lof?.limitado"> (limitada)</template>
      </p>
    </header>

    <div v-if="secoes.length === 0" class="vazio">
      Sem seções suficientes para o cálculo no recorte.
    </div>

    <div v-else class="tabela-scroll">
      <table>
        <caption class="sr-only">
          Seções com maior score de anomalia
        </caption>
        <thead>
          <tr>
            <th scope="col">UF</th>
            <th scope="col" class="num">Município</th>
            <th scope="col" class="num">Zona</th>
            <th scope="col" class="num">Seção</th>
            <th scope="col" class="num">IF</th>
            <th scope="col" class="num">LOF</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="secao in secoes" :key="secao.id">
            <td>{{ secao.sg_uf }}</td>
            <td class="num">{{ secao.cd_municipio_tse }}</td>
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
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
