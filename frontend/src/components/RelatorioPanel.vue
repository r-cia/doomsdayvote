<script setup>
import { computed } from 'vue'
import StateBlock from './StateBlock.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useRelatorio } from '../composables/queries'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero, formatarPercentual } from '../lib/format'

const CARGOS = { 1: 'Presidente', 3: 'Governador' }

const store = useFiltersStore()
const { ordenacao, alternar } = useOrdenacao()
const query = useRelatorio(ordenacao)

const alvo = computed(() => query.data.value?.alvo ?? null)
const linhas = computed(() => {
  if (!alvo.value) return []
  const referencias = query.data.value.comparacao_final_disponivel ? (query.data.value.referencias ?? []) : []
  return [{ ...alvo.value, ehAlvo: true }, ...referencias]
})
const rotulo = (r) => `${r.ano_eleicao} · ${r.nr_turno}º turno${r.ehAlvo ? ' (alvo)' : ''}`
const chave = (r) => `${r.ehAlvo ? 'alvo' : r.election_id}`
const col = (coluna, texto, numero = true) => ({ coluna, texto, numero })
const COLUNAS_PARTICIPACAO = [col('referencia', 'Eleição', false), col('bus', 'Boletins'), col('participacao_pct', 'Participação'), col('abstencao_pct', 'Abstenção')]
const COLUNAS_RECEBIMENTO = [
  col('referencia', 'Eleição', false),
  col('data_hora', 'Data e hora'),
  col('somente_data', 'Só data'),
  col('ausente', 'Ausente'),
  col('outra_precisao', 'Outra precisão'),
  col('sem_encerramento', 'Sem encerramento'),
  col('antes_encerramento', 'Antes do encerramento'),
  col('antes_emissao', 'Antes da emissão'),
  col('mediana_atraso_min', 'Mediana do atraso (min)'),
  col('p90_atraso_min', 'Percentil 90 do atraso (min)'),
]
</script>

<template>
  <section class="painel" aria-labelledby="relatorio-titulo" :aria-busy="query.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Relatório</p>
        <h2 id="relatorio-titulo">Relatório de consistência</h2>
        <p v-if="alvo" class="painel__meta">
          {{ alvo.ano_eleicao }} · {{ alvo.nr_turno }}º turno · {{ CARGOS[store.cargo] ?? store.cargo }}
          <template v-if="alvo.ds_eleicao"> · {{ alvo.ds_eleicao }}</template>
          <template v-if="store.uf"> · {{ store.uf }}</template>
          <template v-if="store.municipio"> · {{ store.municipio }}</template>
        </p>
      </div>
    </header>

    <StateBlock v-if="query.isLoading.value" estado="carregando" titulo="Carregando relatório" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      titulo="Não foi possível carregar o relatório"
      :descricao="query.error.value.message"
      acao="Tentar novamente"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="linhas.length === 0" estado="vazio" titulo="Sem dados para o recorte" />
    <template v-else>
      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }">
        <table>
          <caption class="sr-only">Participação e abstenção</caption>
          <thead>
            <tr>
              <ThOrdenavel v-for="c in COLUNAS_PARTICIPACAO" :key="c.coluna" :coluna="c.coluna" :numero="c.numero" :ordenacao="ordenacao" @ordenar="alternar">{{ c.texto }}</ThOrdenavel>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in linhas" :key="chave(r)">
              <td>{{ rotulo(r) }}</td>
              <td class="num">{{ formatarNumero(r.bus) }}</td>
              <td class="num">{{ formatarPercentual(r.participacao_pct) }}</td>
              <td class="num">{{ formatarPercentual(r.abstencao_pct) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }">
        <table>
          <caption class="sr-only">Recebimento do Boletim de Urna</caption>
          <thead>
            <tr>
              <ThOrdenavel v-for="c in COLUNAS_RECEBIMENTO" :key="c.coluna" :coluna="c.coluna" :numero="c.numero" :ordenacao="ordenacao" @ordenar="alternar">{{ c.texto }}</ThOrdenavel>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in linhas" :key="chave(r)">
              <td>{{ rotulo(r) }}</td>
              <td class="num">{{ formatarNumero(r.recebimento.data_hora) }}</td>
              <td class="num">{{ formatarNumero(r.recebimento.somente_data) }}</td>
              <td class="num">{{ formatarNumero(r.recebimento.ausente) }}</td>
              <td class="num">{{ formatarNumero(r.recebimento.outra_precisao) }}</td>
              <td class="num">{{ formatarNumero(r.recebimento.sem_encerramento) }}</td>
              <td class="num">{{ formatarNumero(r.recebimento.antes_encerramento) }}</td>
              <td class="num">{{ formatarNumero(r.recebimento.antes_emissao) }}</td>
              <td class="num">{{ formatarNumero(r.recebimento.mediana_atraso_min) }}</td>
              <td class="num">{{ formatarNumero(r.recebimento.p90_atraso_min) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
