<script setup>
import { computed } from 'vue'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  dados: { type: Array, default: () => [] },
})

const linhas = computed(() =>
  [...(props.dados ?? [])].sort((a, b) =>
    (a.sg_uf ?? '').localeCompare(b.sg_uf ?? ''),
  ),
)
</script>

<template>
  <section class="painel" aria-labelledby="biometria-uf-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Biometria</p>
        <h2 id="biometria-uf-titulo">Biometria por estado</h2>
      </div>
    </header>

    <div v-if="linhas.length === 0" class="vazio">Sem dados de biometria.</div>

    <div v-else class="tabela-scroll">
      <table class="tabela">
        <thead>
          <tr>
            <th scope="col">UF</th>
            <th scope="col" class="tabela__numero">Votos com biometria</th>
            <th scope="col" class="tabela__numero">% com biometria</th>
            <th scope="col" class="tabela__numero">Votos biometria não habilitada</th>
            <th scope="col" class="tabela__numero">% não habilitada</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="linha in linhas" :key="linha.sg_uf">
            <td>{{ linha.sg_uf }}</td>
            <td class="tabela__numero">
              {{ formatarNumero(linha.qt_habilitados_por_biometria) }}
            </td>
            <td class="tabela__numero">
              {{ formatarPercentual(linha.percentual_habilitada) }}
            </td>
            <td class="tabela__numero">
              {{ formatarNumero(linha.qt_biometria_nao_habilitada) }}
            </td>
            <td class="tabela__numero">
              {{ formatarPercentual(linha.percentual_nao_habilitada) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>