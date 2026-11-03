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
      <h2 id="secao-versoes">{{ $t('versoes.titulo') }}</h2>
      <label v-if="versoes.length > 1" class="campo campo--curto">
        <span class="campo__rotulo">{{ $t('versoes.compararCom') }}</span>
        <select v-model="compararCom">
          <option value="">{{ $t('versoes.anterior') }}</option>
          <option v-for="v in versoes.filter((item) => !item.ativo)" :key="v.id" :value="v.versao">{{ $t('versoes.versaoN', { n: v.versao }) }}</option>
        </select>
      </label>
    </div>

    <StateBlock v-if="query.isLoading.value" estado="carregando" :titulo="$t('versoes.carregando')" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      :titulo="$t('versoes.erro')"
      :descricao="query.error.value.message"
      :acao="$t('comum.tentarNovamente')"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="versoes.length === 0" estado="vazio" :titulo="$t('versoes.vazio')" />
    <template v-else>
      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }">
        <table>
          <thead>
            <tr>
              <th scope="col" class="num">{{ $t('versoes.versao') }}</th>
              <th scope="col">{{ $t('versoes.situacao') }}</th>
              <th scope="col">{{ $t('versoes.abertura') }}</th>
              <th scope="col">{{ $t('versoes.encerramento') }}</th>
              <th scope="col">{{ $t('versoes.emissao') }}</th>
              <th scope="col" class="num">{{ $t('versoes.aptos') }}</th>
              <th scope="col" class="num">{{ $t('kpis.comparecimento') }}</th>
              <th scope="col" class="num">{{ $t('versoes.abstencoes') }}</th>
              <th scope="col">{{ $t('versoes.lote') }}</th>
              <th scope="col">{{ $t('versoes.hash') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in versoes" :key="v.id">
              <td class="num">{{ v.versao }}</td>
              <td>{{ v.ativo ? $t('versoes.ativa') : $t('versoes.substituida') }}</td>
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

      <div v-if="!comparacao" class="vazio">{{ $t('versoes.semAnterior') }}</div>
      <template v-else>
        <h3>{{ $t('versoes.camposAlterados', { de: comparacao.anterior, para: comparacao.atual }) }}</h3>
        <div v-if="comparacao.campos_alterados.length === 0" class="vazio">{{ $t('versoes.nenhumCampo') }}</div>
        <div v-else class="tabela-scroll">
          <table>
            <thead>
              <tr>
                <ThOrdenavel coluna="campo" :ordenacao="campos.ordenacao.value" @ordenar="campos.alternar">{{ $t('divergencias.campo') }}</ThOrdenavel>
                <ThOrdenavel coluna="anterior" :ordenacao="campos.ordenacao.value" @ordenar="campos.alternar">{{ $t('versoes.colAnterior') }}</ThOrdenavel>
                <ThOrdenavel coluna="atual" :ordenacao="campos.ordenacao.value" @ordenar="campos.alternar">{{ $t('versoes.colAtual') }}</ThOrdenavel>
                <ThOrdenavel coluna="diferenca" numero :ordenacao="campos.ordenacao.value" @ordenar="campos.alternar">{{ $t('consistencia.diferenca') }}</ThOrdenavel>
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

        <h3>{{ $t('versoes.votaveisAlterados') }}</h3>
        <div v-if="comparacao.votaveis_alterados.length === 0" class="vazio">{{ $t('versoes.nenhumVotavel') }}</div>
        <div v-else class="tabela-scroll">
          <table>
            <thead>
              <tr>
                <ThOrdenavel coluna="nr_votavel" numero :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">{{ $t('versoes.numero') }}</ThOrdenavel>
                <ThOrdenavel coluna="nm_votavel" :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">{{ $t('secoes.nome') }}</ThOrdenavel>
                <ThOrdenavel coluna="anterior" numero :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">{{ $t('versoes.colAnterior') }}</ThOrdenavel>
                <ThOrdenavel coluna="atual" numero :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">{{ $t('versoes.colAtual') }}</ThOrdenavel>
                <ThOrdenavel coluna="diferenca" numero :ordenacao="votaveis.ordenacao.value" @ordenar="votaveis.alternar">{{ $t('consistencia.diferenca') }}</ThOrdenavel>
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
