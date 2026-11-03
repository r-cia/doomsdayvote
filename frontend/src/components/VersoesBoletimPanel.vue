<script setup>
import { computed, ref } from 'vue'
import StateBlock from './StateBlock.vue'
import ThOrdenavel from './ThOrdenavel.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useSecaoVersoes } from '../composables/queries'
import { formatarDataHora, formatarNumero, formatarSha } from '../lib/format'

const props = defineProps({
  secaoId: { type: String, required: true },
})

const compararCom = ref('')
const campos = useOrdenacao()
const votaveis = useOrdenacao()

const query = useSecaoVersoes(
  () => props.secaoId,
  { comparar_com: compararCom },
  () => ({ _campos: campos.ordenacao.value, _votaveis: votaveis.ordenacao.value }),
)
const versoes = computed(() => query.data.value?.versoes ?? [])
const comparacao = computed(() => query.data.value?.comparacao ?? null)
const nulo = (valor) => (valor === null || valor === undefined || valor === '' ? '—' : valor)
</script>

<template>
  <section class="card" aria-labelledby="secao-versoes" :aria-busy="query.isFetching.value">
    <div class="card__cabecalho">
      <h2 id="secao-versoes">Versões do Boletim de Urna</h2>
      <label v-if="versoes.length > 1" class="campo campo--curto">
        <span class="campo__rotulo">Comparar com</span>
        <select v-model="compararCom">
          <option value="">Versão anterior</option>
          <option v-for="v in versoes.filter((item) => !item.ativo)" :key="v.id" :value="v.versao">Versão {{ v.versao }}</option>
        </select>
      </label>
    </div>

    <StateBlock v-if="query.isLoading.value" estado="carregando" titulo="Carregando versões" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      titulo="Não foi possível carregar as versões"
      :descricao="query.error.value.message"
      acao="Tentar novamente"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="versoes.length === 0" estado="vazio" titulo="Sem versões do Boletim de Urna" />
    <template v-else>
      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }">
        <table>
          <thead>
            <tr>
              <th scope="col" class="num">Versão</th>
              <th scope="col">Situação</th>
              <th scope="col">Abertura</th>
              <th scope="col">Encerramento</th>
              <th scope="col">Emissão</th>
              <th scope="col" class="num">Aptos</th>
              <th scope="col" class="num">Comparecimento</th>
              <th scope="col" class="num">Abstenções</th>
              <th scope="col">Lote</th>
              <th scope="col">Hash</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in versoes" :key="v.id">
              <td class="num">{{ v.versao }}</td>
              <td>{{ v.ativo ? 'Ativa' : 'Substituída' }}</td>
              <td>{{ formatarDataHora(v.dt_abertura) }}</td>
              <td>{{ formatarDataHora(v.dt_encerramento) }}</td>
              <td>{{ formatarDataHora(v.dt_emissao_bu) }}</td>
              <td class="num">{{ formatarNumero(v.qt_aptos) }}</td>
              <td class="num">{{ formatarNumero(v.qt_comparecimento) }}</td>
              <td class="num">{{ formatarNumero(v.qt_abstencoes) }}</td>
              <td>{{ nulo(v.lote?.nome_arquivo ?? v.lote_id) }}</td>
              <td class="mono" :title="v.conteudo_sha256">{{ formatarSha(v.conteudo_sha256, 12) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!comparacao" class="vazio">Não há versão anterior para comparar.</div>
      <template v-else>
        <h3>Campos alterados (versão {{ comparacao.anterior }} → {{ comparacao.atual }})</h3>
        <div v-if="comparacao.campos_alterados.length === 0" class="vazio">Nenhum campo alterado.</div>
        <div v-else class="tabela-scroll">
          <table>
            <thead>
              <tr>
                <ThOrdenavel coluna="campo" :ordenacao="campos.ordenacao.value" @ordenar="campos.alternar">Campo</ThOrdenavel>
                <ThOrdenavel coluna="anterior" :ordenacao="campos.ordenacao.value" @ordenar="campos.alternar">Anterior</ThOrdenavel>
                <ThOrdenavel coluna="atual" :ordenacao="campos.ordenacao.value" @ordenar="campos.alternar">Atual</ThOrdenavel>
                <ThOrdenavel coluna="diferenca" numero :ordenacao="campos.ordenacao.value" @ordenar="campos.alternar">Diferença</ThOrdenavel>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in comparacao.campos_alterados" :key="c.campo">
                <td>{{ c.campo }}</td>
                <td>{{ nulo(c.anterior) }}</td>
                <td>{{ nulo(c.atual) }}</td>
                <td class="num">{{ nulo(c.diferenca) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Votáveis alterados</h3>
        <div v-if="comparacao.votaveis_alterados.length === 0" class="vazio">Nenhum votável alterado.</div>
        <div v-else class="tabela-scroll">
          <table>
            <thead>
              <tr>
                <ThOrdenavel coluna="nr_votavel" numero :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">Número</ThOrdenavel>
                <ThOrdenavel coluna="nm_votavel" :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">Nome</ThOrdenavel>
                <ThOrdenavel coluna="anterior" numero :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">Anterior</ThOrdenavel>
                <ThOrdenavel coluna="atual" numero :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">Atual</ThOrdenavel>
                <ThOrdenavel coluna="diferenca" numero :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">Diferença</ThOrdenavel>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(v, indice) in comparacao.votaveis_alterados" :key="`${v.nr_votavel}-${indice}`">
                <td class="num">{{ nulo(v.nr_votavel) }}</td>
                <td>{{ nulo(v.nm_votavel) }}</td>
                <td class="num">{{ nulo(v.anterior) }}</td>
                <td class="num">{{ nulo(v.atual) }}</td>
                <td class="num">{{ nulo(v.diferenca) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </section>
</template>
