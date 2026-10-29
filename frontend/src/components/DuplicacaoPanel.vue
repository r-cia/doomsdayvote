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
      <h2 id="duplicacao-titulo">Duplicação e proximidade</h2>
      <p class="painel__meta">
        vetor de votos idêntico<br />
        <b>{{ dados?.total_grupos ?? 0 }}</b> grupos ·
        {{ dados?.total_secoes ?? 0 }} seções
      </p>
    </header>

    <div v-if="grupos.length === 0" class="vazio">
      Nenhum vetor de votos repetido no recorte.
    </div>

    <div v-else class="tabela-scroll">
      <table>
        <caption class="sr-only">
          Grupos de seções com o mesmo vetor de votos
        </caption>
        <thead>
          <tr>
            <th scope="col" class="num">Seções</th>
            <th scope="col">UF</th>
            <th scope="col">Município</th>
            <th scope="col">Zonas</th>
            <th scope="col">Números</th>
            <th scope="col">Sinalizadores</th>
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
              <span v-if="grupo.mesma_zona" class="chip chip--warn">mesma zona</span>
              <span v-if="grupo.secoes_consecutivas" class="chip chip--alert">
                consecutivas
              </span>
              <span v-if="grupo.mesmo_municipio" class="chip chip--warn">mesmo município</span>
              <span v-if="!grupo.mesma_zona && !grupo.secoes_consecutivas && !grupo.mesmo_municipio">
                {{
                  grupo.secoes.length === 2 &&
                  grupo.secoes[0].nm_municipio &&
                  grupo.secoes[1].nm_municipio &&
                  grupo.secoes[0].nm_municipio !== grupo.secoes[1].nm_municipio
                    ? `idêntico a ${grupo.secoes[1].nm_municipio}`
                    : "—"
                }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
