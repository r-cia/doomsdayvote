<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AnaliseView from './AnaliseView.vue'
import ComparacoesView from './ComparacoesView.vue'
import BiometriaView from './BiometriaView.vue'
import EncerramentoView from './EncerramentoView.vue'
import StateBlock from '../components/StateBlock.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useConsistencia, useRelatorio } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarDecimal, formatarNumero, formatarPercentual } from '../lib/format'

const { t } = useI18n()
const { store, eleicaoAtual, cargos } = useSelecaoEleicao()
const { alternar, ariaSort, seta, params } = useOrdenacao()
const relatorio = useRelatorio(params)
const consistencia = useConsistencia()
const mostrarAnalises = ref(false)

const alvo = computed(() => relatorio.data.value?.alvo ?? null)
const referencias = computed(() => relatorio.data.value?.referencias ?? [])
const linhas = computed(() => (alvo.value ? [alvo.value, ...referencias.value] : []))
const cobertura = computed(() => consistencia.data.value?.cobertura ?? null)
const percentualCobertura = computed(() => {
  if (!cobertura.value?.consideradas) return null
  return (Number(cobertura.value.avaliadas) / Number(cobertura.value.consideradas)) * 100
})
const cargoSelecionado = computed(
  () => cargos.value.find((cargo) => cargo.cd_cargo_pergunta === store.cargo)?.ds_cargo_pergunta,
)

function diferenca(valor, base) {
  if (valor === null || base === null || valor === undefined || base === undefined) return '—'
  return `${formatarDecimal(Number(valor) - Number(base), 1, 1)} pp`
}

function identificador(linha) {
  return `${linha.ano_eleicao} · ${linha.nr_turno} · ${linha.cd_eleicao}`
}
</script>

<template>
  <section class="relatorio" aria-labelledby="relatorio-titulo">
    <header class="relatorio__cabecalho">
      <h2 id="relatorio-titulo">{{ $t('relatorio.titulo') }}</h2>
      <p v-if="alvo">
        {{ alvo.ano_eleicao }} · {{ $t('relatorio.turno') }} {{ alvo.nr_turno }} ·
        {{ cargoSelecionado ?? `${$t('filtros.cargo')} ${store.cargo}` }}
        <template v-if="eleicaoAtual?.cd_eleicao"> · {{ $t('relatorio.eleicao') }} {{ eleicaoAtual.cd_eleicao }}</template>
        <template v-if="store.uf"> · {{ store.uf }}</template>
        <template v-if="store.municipio"> · {{ formatarNumero(store.municipio) }}</template>
      </p>
    </header>

    <StateBlock
      v-if="store.governadorSemUf"
      estado="vazio"
      :titulo="$t('relatorio.selecioneUf')"
      :descricao="$t('relatorio.selecioneUf')"
    />
    <StateBlock
      v-else-if="relatorio.isError.value"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="relatorio.error.value?.message ?? ''"
      :acao="$t('comum.tentarNovamente')"
      @acao="relatorio.refetch()"
    />
    <StateBlock
      v-else-if="relatorio.isLoading.value"
      estado="carregando"
      :titulo="$t('comum.carregandoDados')"
    />

    <template v-if="alvo">
      <section class="relatorio__indice" aria-labelledby="relatorio-nota">
        <div class="relatorio__nota">
          <h3 id="relatorio-nota">{{ $t('relatorio.nota') }}</h3>
          <strong v-if="consistencia.data.value?.indice_consistencia !== null && consistencia.data.value?.indice_consistencia !== undefined">
            {{ formatarPercentual(consistencia.data.value.indice_consistencia, 1) }}
          </strong>
          <strong v-else-if="consistencia.isLoading.value">{{ $t('comum.carregando') }}</strong>
          <strong v-else>{{ $t('relatorio.notaInconclusiva') }}</strong>
          <p>{{ $t('relatorio.descricaoNota') }}</p>
        </div>
        <dl v-if="cobertura" class="relatorio__medidas">
          <div>
            <dt>{{ $t('relatorio.avaliadas') }}</dt>
            <dd>{{ formatarNumero(cobertura.avaliadas) }}</dd>
          </div>
          <div>
            <dt>{{ $t('relatorio.consideradas') }}</dt>
            <dd>{{ formatarNumero(cobertura.consideradas) }}</dd>
          </div>
          <div>
            <dt>{{ $t('relatorio.cobertura') }}</dt>
            <dd>{{ formatarPercentual(percentualCobertura, 1) }}</dd>
          </div>
          <div>
            <dt>{{ $t('relatorio.comDivergencia') }}</dt>
            <dd>{{ formatarNumero(cobertura.com_divergencia) }}</dd>
          </div>
        </dl>
        <div class="relatorio__metodo">
          <h3>{{ $t('relatorio.metodoNota') }}</h3>
          <p>{{ $t('relatorio.metodoNotaDescricao') }}</p>
          <p>{{ $t('relatorio.limiteNota') }}</p>
        </div>
      </section>

      <section class="relatorio__historico painel" aria-labelledby="relatorio-historico">
        <header class="painel__cabecalho">
          <div>
            <h2 id="relatorio-historico">{{ $t('relatorio.historico') }}</h2>
            <p>{{ $t('relatorio.historicoDescricao') }}</p>
          </div>
        </header>
        <p v-if="!relatorio.data.value.comparacao_final_disponivel" class="vazio">
          {{ $t('relatorio.historicoIndisponivel') }}
        </p>
        <p v-else-if="referencias.length === 0" class="vazio">
          {{ $t('relatorio.semHistorico') }}
        </p>
        <template v-else>
          <div v-if="linhas.length" class="relatorio__tabelas">
            <div class="tabela-scroll">
              <table class="tabela relatorio__tabela">
                <caption class="sr-only">{{ $t('relatorio.historico') }}</caption>
                <thead>
                  <tr>
                    <th scope="col" class="ordenavel" :aria-sort="ariaSort('referencia')"><button type="button" @click="alternar('referencia')">{{ $t('relatorio.referencia') }}{{ seta('referencia') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('bus')"><button type="button" @click="alternar('bus')">{{ $t('relatorio.bus') }}{{ seta('bus') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('participacao_pct')"><button type="button" @click="alternar('participacao_pct')">{{ $t('relatorio.participacao') }}{{ seta('participacao_pct') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('diferenca_participacao')"><button type="button" @click="alternar('diferenca_participacao')">{{ $t('relatorio.diferenca') }}{{ seta('diferenca_participacao') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('abstencao_pct')"><button type="button" @click="alternar('abstencao_pct')">{{ $t('relatorio.abstencao') }}{{ seta('abstencao_pct') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('diferenca_abstencao')"><button type="button" @click="alternar('diferenca_abstencao')">{{ $t('relatorio.diferenca') }}{{ seta('diferenca_abstencao') }}</button></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(linha, index) in linhas" :key="linha.election_id" :class="{ 'relatorio__alvo': index === 0 }">
                    <th scope="row">{{ index === 0 ? $t('relatorio.alvo') : identificador(linha) }}</th>
                    <td class="tabela__numero">{{ formatarNumero(linha.bus) }}</td>
                    <td class="tabela__numero">{{ formatarPercentual(linha.participacao_pct, 1) }}</td>
                    <td class="tabela__numero">{{ index === 0 ? '—' : diferenca(linha.participacao_pct, alvo.participacao_pct) }}</td>
                    <td class="tabela__numero">{{ formatarPercentual(linha.abstencao_pct, 1) }}</td>
                    <td class="tabela__numero">{{ index === 0 ? '—' : diferenca(linha.abstencao_pct, alvo.abstencao_pct) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="tabela-scroll">
              <table class="tabela relatorio__tabela">
                <caption class="sr-only">{{ $t('relatorio.recebimento') }}</caption>
                <thead>
                  <tr>
                    <th scope="col" class="ordenavel" :aria-sort="ariaSort('referencia')"><button type="button" @click="alternar('referencia')">{{ $t('relatorio.referencia') }}{{ seta('referencia') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('data_hora')"><button type="button" @click="alternar('data_hora')">{{ $t('relatorio.dataHora') }}{{ seta('data_hora') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('somente_data')"><button type="button" @click="alternar('somente_data')">{{ $t('relatorio.somenteData') }}{{ seta('somente_data') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('ausente')"><button type="button" @click="alternar('ausente')">{{ $t('relatorio.ausente') }}{{ seta('ausente') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('outra_precisao')"><button type="button" @click="alternar('outra_precisao')">{{ $t('relatorio.outraPrecisao') }}{{ seta('outra_precisao') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('sem_encerramento')"><button type="button" @click="alternar('sem_encerramento')">{{ $t('relatorio.semEncerramento') }}{{ seta('sem_encerramento') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('antes_encerramento')"><button type="button" @click="alternar('antes_encerramento')">{{ $t('relatorio.antesEncerramento') }}{{ seta('antes_encerramento') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('antes_emissao')"><button type="button" @click="alternar('antes_emissao')">{{ $t('relatorio.antesEmissao') }}{{ seta('antes_emissao') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('mediana_atraso_min')"><button type="button" @click="alternar('mediana_atraso_min')">{{ $t('relatorio.medianaAtraso') }}{{ seta('mediana_atraso_min') }}</button></th>
                    <th scope="col" class="tabela__numero ordenavel" :aria-sort="ariaSort('p90_atraso_min')"><button type="button" @click="alternar('p90_atraso_min')">{{ $t('relatorio.p90Atraso') }}{{ seta('p90_atraso_min') }}</button></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(linha, index) in linhas" :key="linha.election_id" :class="{ 'relatorio__alvo': index === 0 }">
                    <th scope="row">{{ index === 0 ? $t('relatorio.alvo') : identificador(linha) }}</th>
                    <td class="tabela__numero">{{ formatarNumero(linha.recebimento.data_hora) }}</td>
                    <td class="tabela__numero">{{ formatarNumero(linha.recebimento.somente_data) }}</td>
                    <td class="tabela__numero">{{ formatarNumero(linha.recebimento.ausente) }}</td>
                    <td class="tabela__numero">{{ formatarNumero(linha.recebimento.outra_precisao) }}</td>
                    <td class="tabela__numero">{{ formatarNumero(linha.recebimento.sem_encerramento) }}</td>
                    <td class="tabela__numero">{{ formatarNumero(linha.recebimento.antes_encerramento) }}</td>
                    <td class="tabela__numero">{{ formatarNumero(linha.recebimento.antes_emissao) }}</td>
                    <td class="tabela__numero">{{ formatarDecimal(linha.recebimento.mediana_atraso_min, 1, 1) }}</td>
                    <td class="tabela__numero">{{ formatarDecimal(linha.recebimento.p90_atraso_min, 1, 1) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p v-if="linhas.length" class="relatorio__nota-metodo">
            {{ $t('relatorio.metodoRecebimento') }}
          </p>
        </template>
      </section>

      <section class="relatorio__analises" aria-labelledby="relatorio-analises">
        <header class="relatorio__analises-cabecalho">
          <h2 id="relatorio-analises">{{ $t('relatorio.analises') }}</h2>
          <button
            type="button"
            class="button button--ghost"
            :aria-expanded="mostrarAnalises"
            @click="mostrarAnalises = !mostrarAnalises"
          >
            {{ mostrarAnalises ? $t('relatorio.ocultarAnalises') : $t('relatorio.mostrarAnalises') }}
          </button>
        </header>
        <template v-if="mostrarAnalises">
          <AnaliseView />
          <ComparacoesView />
          <BiometriaView />
          <EncerramentoView />
        </template>
      </section>
    </template>
  </section>
</template>

<style scoped>
.relatorio {
  display: grid;
  gap: 20px;
  min-width: 0;
}

.relatorio__cabecalho {
  display: grid;
  gap: 6px;
  max-width: 72ch;
}

.relatorio__cabecalho p,
.relatorio__historico header p,
.relatorio__metodo p,
.relatorio__nota-metodo {
  color: var(--ink-dim);
  font-size: 12px;
}

.relatorio__indice {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(250px, 1.2fr);
  gap: 16px 24px;
  padding: 16px;
  background: var(--panel);
  border: 1px solid var(--line);
}

.relatorio__nota strong {
  display: block;
  margin: 8px 0;
  color: var(--amber);
  font-size: clamp(30px, 5vw, 54px);
  font-weight: 400;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.relatorio__nota p,
.relatorio__metodo p {
  max-width: 70ch;
}

.relatorio__medidas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
  margin: 0;
  align-content: center;
}

.relatorio__medidas div {
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 6px;
}

.relatorio__medidas dt {
  color: var(--ink-dim);
  font-size: 10px;
  text-transform: uppercase;
}

.relatorio__medidas dd {
  margin: 3px 0 0;
  font-size: 18px;
}

.relatorio__metodo {
  display: grid;
  grid-column: 1 / -1;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.relatorio__historico {
  min-width: 0;
}

.relatorio__tabelas {
  display: grid;
  gap: 12px;
}

.relatorio__tabela {
  min-width: 760px;
}

.relatorio__tabela th,
.relatorio__tabela td {
  padding: 7px 9px;
}

.relatorio__alvo {
  color: var(--amber);
  background: var(--amber-soft);
}

.relatorio__nota-metodo {
  margin-top: 12px;
  max-width: 85ch;
}

.relatorio__analises {
  display: grid;
  gap: 12px;
}

.relatorio__analises-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 760px) {
  .relatorio__indice {
    grid-template-columns: 1fr;
  }

  .relatorio__medidas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .relatorio__analises-cabecalho {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
