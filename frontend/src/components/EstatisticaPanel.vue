<script setup>
import { computed, ref } from 'vue'
import { formatarDecimal, formatarNumero } from '../lib/format'
import { useI18n } from 'vue-i18n'
import StateBlock from './StateBlock.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useEstatisticas } from '../composables/queries'

const props = defineProps({
  eleicoesDisponiveis: { type: Array, default: () => [] },
  electionId: { type: String, default: '' },
})

const { t } = useI18n()
const escopo = ref('turno')
const { ordenacao, alternar } = useOrdenacao()
const estatisticasQuery = useEstatisticas(escopo, ordenacao)

const temDoisTurnos = computed(
  () => (estatisticasQuery.data.value?.turnos_disponiveis?.length ?? 0) >= 2,
)

const blocos = computed(() => estatisticasQuery.data.value?.blocos ?? [])

function numero(valor) {
  return formatarDecimal(valor, 1)
}

function inteiro(valor) {
  if (valor === null || valor === undefined) return '—'
  return formatarNumero(valor)
}

function erroMensagem(erro) {
  if (!erro) return ''
  if (typeof erro === 'string') return erro
  return erro.message || t('estatistica.erroGenerico')
}
</script>

<template>
  <section class="painel" aria-labelledby="titulo-estatisticas">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('estatistica.etiqueta') }}</p>
        <h2 id="titulo-estatisticas">{{ $t('estatistica.titulo') }}</h2>
      </div>
      <div class="estatistica-controle">
        <label class="campo campo--curto">
          <span class="campo__rotulo">{{ $t('estatistica.escopo') }}</span>
          <select v-model="escopo">
            <option value="turno">{{ $t('estatistica.turnoAtual') }}</option>
            <option v-if="temDoisTurnos" value="ano">{{ $t('estatistica.ano') }}</option>
          </select>
        </label>
      </div>
    </header>

    <StateBlock
      v-if="estatisticasQuery.isLoading.value && blocos.length === 0"
      estado="carregando"
      :titulo="$t('estatistica.calculando')"
    />
    <StateBlock
      v-else-if="estatisticasQuery.error.value"
      estado="erro"
      :titulo="$t('estatistica.erro')"
      :descricao="erroMensagem(estatisticasQuery.error.value)"
      :acao="$t('comum.tentarNovamente')"
      @acao="estatisticasQuery.refetch()"
    />
    <StateBlock
      v-else-if="blocos.length === 0"
      estado="vazio"
      :titulo="$t('estatistica.semDados')"
      :descricao="$t('estatistica.selecioneCargo')"
    />

    <div v-else class="estatistica-lista">
      <article
        v-for="bloco in blocos"
        :key="bloco.eleicao_id"
        class="estatistica-bloco"
      >
        <header class="estatistica-bloco__cabecalho">
          <h3>{{ $t('estatistica.turnoAno', { turno: bloco.nr_turno, ano: bloco.ano_eleicao }) }}</h3>
          <p>{{ $t('duplicacao.nSecoes', { n: inteiro(bloco.comparecimento.secoes) }) }}</p>
        </header>

        <section class="estatistica-tabela-wrap" :aria-label="$t('estatistica.comparecimentoPorSecao')">
          <table class="tabela">
            <thead>
              <tr>
                <th>{{ $t('estatistica.variavel') }}</th>
                <th class="tabela__numero">{{ $t('duplicacao.secoes') }}</th>
                <th class="tabela__numero">{{ $t('estatistica.media') }}</th>
                <th class="tabela__numero">{{ $t('tempoVoto.mediana') }}</th>
                <th class="tabela__numero">{{ $t('estatistica.desvio') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ $t('kpis.comparecimento') }}</td>
                <td class="tabela__numero">{{ inteiro(bloco.comparecimento.secoes) }}</td>
                <td class="tabela__numero">{{ numero(bloco.comparecimento.media) }}</td>
                <td class="tabela__numero">{{ numero(bloco.comparecimento.mediana) }}</td>
                <td class="tabela__numero">{{ numero(bloco.comparecimento.desvio) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="estatistica-tabela-wrap" :aria-label="$t('estatistica.votosPorSecao')">
          <table class="tabela">
            <thead>
              <tr>
                <ThOrdenavel coluna="nm_votavel" :ordenacao="ordenacao" @ordenar="alternar">{{ $t('comum.candidato') }}</ThOrdenavel>
                <ThOrdenavel coluna="sg_partido" :ordenacao="ordenacao" @ordenar="alternar">{{ $t('comum.partido') }}</ThOrdenavel>
                <ThOrdenavel coluna="secoes" numero :ordenacao="ordenacao" @ordenar="alternar">{{ $t('duplicacao.secoes') }}</ThOrdenavel>
                <ThOrdenavel coluna="secoes_zero" numero :ordenacao="ordenacao" @ordenar="alternar">{{ $t('estatistica.secoesZero') }}</ThOrdenavel>
                <ThOrdenavel coluna="media" numero :ordenacao="ordenacao" @ordenar="alternar">{{ $t('estatistica.media') }}</ThOrdenavel>
                <ThOrdenavel coluna="mediana" numero :ordenacao="ordenacao" @ordenar="alternar">{{ $t('tempoVoto.mediana') }}</ThOrdenavel>
                <ThOrdenavel coluna="desvio" numero :ordenacao="ordenacao" @ordenar="alternar">{{ $t('estatistica.desvio') }}</ThOrdenavel>
              </tr>
            </thead>
            <tbody>
              <tr v-for="candidato in bloco.candidatos" :key="candidato.nr_votavel">
                <td>
                  <span class="estatistica-candidato">
                    <strong>{{ candidato.nm_votavel }}</strong>
                    <small>{{ candidato.nr_votavel }}</small>
                  </span>
                </td>
                <td>{{ candidato.sg_partido }}</td>
                <td class="tabela__numero">{{ inteiro(candidato.secoes) }}</td>
                <td class="tabela__numero">{{ inteiro(bloco.comparecimento.secoes - (candidato.secoes_com_voto ?? 0)) }}</td>
                <td class="tabela__numero">{{ numero(candidato.media) }}</td>
                <td class="tabela__numero">{{ numero(candidato.mediana) }}</td>
                <td class="tabela__numero">{{ numero(candidato.desvio) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </article>
    </div>
  </section>
</template>
