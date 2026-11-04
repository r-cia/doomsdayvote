<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StateBlock from './StateBlock.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useRelatorio } from '../composables/queries'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero, formatarPercentual } from '../lib/format'

const { t } = useI18n()
const store = useFiltersStore()
const { ordenacao, alternar } = useOrdenacao()
const query = useRelatorio(ordenacao)

const alvo = computed(() => query.data.value?.alvo ?? null)
const linhas = computed(() => {
  if (!alvo.value) return []
  const referencias = query.data.value.comparacao_final_disponivel ? (query.data.value.referencias ?? []) : []
  return [{ ...alvo.value, ehAlvo: true }, ...referencias]
})
const rotulo = (r) => `${r.ano_eleicao} · ${t('relatorio.turno', { n: r.nr_turno })}${r.ehAlvo ? ` (${t('relatorio.alvo')})` : ''}`
const chave = (r) => `${r.ehAlvo ? 'alvo' : r.election_id}`
const col = (coluna, numero = true) => ({ coluna, numero })
const COLUNAS_PARTICIPACAO = [col('referencia', false), col('bus'), col('participacao_pct'), col('abstencao_pct')]
const COLUNAS_RECEBIMENTO = [
  col('referencia', false),
  col('data_hora'),
  col('somente_data'),
  col('ausente'),
  col('outra_precisao'),
  col('sem_encerramento'),
  col('antes_encerramento'),
  col('antes_emissao'),
  col('mediana_atraso_min'),
  col('p90_atraso_min'),
]
</script>

<template>
  <section class="painel" aria-labelledby="relatorio-titulo" :aria-busy="query.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('abas.relatorio') }}</p>
        <h2 id="relatorio-titulo">{{ $t('relatorio.titulo') }}</h2>
        <p v-if="alvo" class="painel__meta">
          {{ alvo.ano_eleicao }} · {{ $t('relatorio.turno', { n: alvo.nr_turno }) }} · {{ $t(`relatorio.cargos.${store.cargo}`) }}
          <template v-if="alvo.ds_eleicao"> · {{ alvo.ds_eleicao }}</template>
          <template v-if="store.uf"> · {{ store.uf }}</template>
          <template v-if="store.municipio"> · {{ store.municipio }}</template>
        </p>
      </div>
    </header>

    <StateBlock v-if="query.isLoading.value" estado="carregando" :titulo="$t('relatorio.carregando')" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      :titulo="$t('relatorio.erro')"
      :descricao="query.error.value.message"
      :acao="$t('comum.tentarNovamente')"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="linhas.length === 0" estado="vazio" :titulo="$t('relatorio.vazio')" />
    <template v-else>
      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }" :aria-busy="query.isFetching.value">
        <span v-if="query.isFetching.value" class="sr-only" role="status">{{ $t('comum.carregando') }}</span>
        <table>
          <caption class="sr-only">{{ $t('relatorio.captionParticipacao') }}</caption>
          <thead>
            <tr>
              <ThOrdenavel v-for="c in COLUNAS_PARTICIPACAO" :key="c.coluna" :coluna="c.coluna" :numero="c.numero" :ordenacao="ordenacao" @ordenar="alternar">{{ $t(`relatorio.colunas.${c.coluna}`) }}</ThOrdenavel>
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

      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }" :aria-busy="query.isFetching.value">
        <span v-if="query.isFetching.value" class="sr-only" role="status">{{ $t('comum.carregando') }}</span>
        <table>
          <caption class="sr-only">{{ $t('relatorio.captionRecebimento') }}</caption>
          <thead>
            <tr>
              <ThOrdenavel v-for="c in COLUNAS_RECEBIMENTO" :key="c.coluna" :coluna="c.coluna" :numero="c.numero" :ordenacao="ordenacao" @ordenar="alternar">{{ $t(`relatorio.colunas.${c.coluna}`) }}</ThOrdenavel>
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
