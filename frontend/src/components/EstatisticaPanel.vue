<script setup>
import { computed, ref } from 'vue'
import StateBlock from './StateBlock.vue'
import { useEstatisticas } from '../composables/queries'

const props = defineProps({
  eleicoesDisponiveis: { type: Array, default: () => [] },
  electionId: { type: String, default: '' },
})

const escopo = ref('turno')
const estatisticasQuery = useEstatisticas(escopo)

const temDoisTurnos = computed(
  () => (estatisticasQuery.data.value?.turnos_disponiveis?.length ?? 0) >= 2,
)

const blocos = computed(() => estatisticasQuery.data.value?.blocos ?? [])

function numero(valor) {
  if (valor === null || valor === undefined) return '—'
  const convertido = Number(valor)
  if (Number.isNaN(convertido)) return '—'
  return convertido.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function inteiro(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR')
}

function erroMensagem(erro) {
  if (!erro) return ''
  if (typeof erro === 'string') return erro
  return erro.message || 'Erro ao carregar estatísticas'
}
</script>

<template>
  <section class="painel" aria-labelledby="titulo-estatisticas">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('estatistica.descritiva') }}</p>
        <h2 id="titulo-estatisticas">{{ $t('estatistica.subtitulo') }}</h2>
        <p class="painel__subtitulo">
          Votos por seção de cada candidato e comparecimento por seção. Desvio
          padrão populacional.
        </p>
      </div>
      <div class="estatistica-controle">
        <label class="campo campo--curto">
          <span class="campo__rotulo">Escopo</span>
          <select v-model="escopo">
            <option value="turno">Turno atual</option>
            <option v-if="temDoisTurnos" value="ano">Ano (1º e 2º)</option>
          </select>
        </label>
      </div>
    </header>

    <StateBlock
      v-if="estatisticasQuery.isLoading.value && blocos.length === 0"
      estado="carregando"
      titulo="Calculando estatísticas"
      descricao="Agregando por seção."
    />
    <StateBlock
      v-else-if="estatisticasQuery.error.value"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="erroMensagem(estatisticasQuery.error.value)"
      :acao="$t('comum.tentarNovamente')"
      @acao="estatisticasQuery.refetch()"
    />
    <StateBlock
      v-else-if="blocos.length === 0"
      estado="vazio"
      :titulo="$t('comum.semDados')"
      descricao="Selecione um cargo com seções ativas."
    />

    <div v-else class="estatistica-lista">
      <article
        v-for="bloco in blocos"
        :key="bloco.eleicao_id"
        class="estatistica-bloco"
      >
        <header class="estatistica-bloco__cabecalho">
          <h3>Turno {{ bloco.nr_turno }} · {{ bloco.ano_eleicao }}</h3>
          <p>{{ inteiro(bloco.comparecimento.secoes) }} seções</p>
        </header>

        <section class="estatistica-tabela-wrap" aria-label="Comparecimento por seção">
          <table class="tabela">
            <thead>
              <tr>
                <th>Variável</th>
                <th class="tabela__numero">Seções</th>
                <th class="tabela__numero">Média</th>
                <th class="tabela__numero">Mediana</th>
                <th class="tabela__numero">Desvio padrão (pop.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Comparecimento</td>
                <td class="tabela__numero">{{ inteiro(bloco.comparecimento.secoes) }}</td>
                <td class="tabela__numero">{{ numero(bloco.comparecimento.media) }}</td>
                <td class="tabela__numero">{{ numero(bloco.comparecimento.mediana) }}</td>
                <td class="tabela__numero">{{ numero(bloco.comparecimento.desvio) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="estatistica-tabela-wrap" aria-label="Votos por seção por candidato">
          <table class="tabela">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Partido</th>
                <th class="tabela__numero">Seções</th>
                <th class="tabela__numero">Seções Zero voto</th>
                <th class="tabela__numero">Média</th>
                <th class="tabela__numero">Mediana</th>
                <th class="tabela__numero">Desvio padrão (pop.)</th>
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
