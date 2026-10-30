<script setup>
import { computed } from 'vue'

const props = defineProps({
  dados: { type: Object, default: null },
})

const candidatos = computed(() => props.dados?.candidatos ?? [])

function tom(classificacao) {
  if (!classificacao) return ''
  if (classificacao === 'conformidade próxima') return 'chip--ok'
  if (classificacao === 'conformidade marginal') return 'chip--warn'
  if (classificacao === 'não conformidade') return 'chip--alert'
  return ''
}

function mad(nivel) {
  if (nivel?.mad === null || nivel?.mad === undefined) return '—'
  return Number(nivel.mad).toLocaleString('pt-BR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}
</script>

<template>
  <section class="painel" aria-labelledby="benford-niveis-titulo">
    <header class="painel__cabecalho">
      <h2 id="benford-niveis-titulo">{{ $t('estatistica.benford') }}</h2>
      <p class="painel__meta">
        seção · zona · município<br />
        <b>{{ candidatos.length }}</b> candidatos
      </p>
    </header>

    <div v-if="candidatos.length === 0" class="vazio">
      {{ $t('comum.semDados') }}
    </div>

    <div v-else class="tabela-scroll">
      <table>
        <caption class="sr-only">
          Aderência à lei de Benford por candidato em seção, zona e município
        </caption>
        <thead>
          <tr>
            <th scope="col">Candidato</th>
            <th scope="col" class="num">Seção n</th>
            <th scope="col" class="num">Seção MAD</th>
            <th scope="col" class="num">Zona n</th>
            <th scope="col" class="num">Zona MAD</th>
            <th scope="col" class="num">Município n</th>
            <th scope="col" class="num">Município MAD</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidato in candidatos" :key="candidato.nr_votavel">
            <td>{{ candidato.nm_votavel }}</td>
            <td class="num">{{ candidato.niveis.secao.n }}</td>
            <td class="num">
              <span :class="tom(candidato.niveis.secao.classificacao)">
                {{ mad(candidato.niveis.secao) }}
              </span>
            </td>
            <td class="num">{{ candidato.niveis.zona.n }}</td>
            <td class="num">
              <span :class="tom(candidato.niveis.zona.classificacao)">
                {{ mad(candidato.niveis.zona) }}
              </span>
            </td>
            <td class="num">{{ candidato.niveis.municipio.n }}</td>
            <td class="num">
              <span :class="tom(candidato.niveis.municipio.classificacao)">
                {{ mad(candidato.niveis.municipio) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
