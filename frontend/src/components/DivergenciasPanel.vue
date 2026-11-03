<script setup>
import { computed, ref, watch } from 'vue'
import Paginacao from './Paginacao.vue'
import StateBlock from './StateBlock.vue'
import { useTotalizacaoDivergencias } from '../composables/queries'
import { useFiltersStore } from '../stores/filters'
import { formatarNumero } from '../lib/format'

const TAMANHO = 25
const FONTES = ['rdv', 'log', 'bweb']
const store = useFiltersStore()
const fonte = ref('')
const pagina = ref(1)

const query = useTotalizacaoDivergencias({ fonte, pagina, tamanho: TAMANHO })
const itens = computed(() => query.data.value?.itens ?? [])

watch(
  () => [store.ano, store.turno, store.uf, store.municipio, fonte.value],
  () => {
    pagina.value = 1
  },
)

const nulo = (valor) => (valor === null || valor === undefined || valor === '' ? '—' : valor)
const localizacao = (d) =>
  [d.sg_uf, d.cd_municipio_tse, d.nr_zona && `zona ${d.nr_zona}`, d.nr_secao && `seção ${d.nr_secao}`]
    .filter((parte) => parte !== null && parte !== undefined && parte !== '')
    .join(' · ') || '—'
const votavel = (d) =>
  [d.cd_cargo_pergunta, d.nr_votavel].filter((parte) => parte !== null && parte !== undefined).join(' · ') || '—'
</script>

<template>
  <section class="painel" aria-labelledby="divergencias-titulo" :aria-busy="query.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Dupla conferência</p>
        <h2 id="divergencias-titulo">Divergências</h2>
        <p v-if="query.data.value" class="painel__meta">{{ formatarNumero(query.data.value.total) }} divergências</p>
      </div>
      <label class="campo campo--curto">
        <span class="campo__rotulo">Fonte</span>
        <select v-model="fonte">
          <option value="">Todas as fontes</option>
          <option v-for="f in FONTES" :key="f" :value="f">{{ f }}</option>
        </select>
      </label>
    </header>

    <StateBlock v-if="query.isLoading.value" estado="carregando" titulo="Carregando divergências" />
    <StateBlock
      v-else-if="query.error.value"
      estado="erro"
      titulo="Não foi possível carregar as divergências"
      :descricao="query.error.value.message"
      acao="Tentar novamente"
      @acao="query.refetch()"
    />
    <StateBlock v-else-if="itens.length === 0" estado="vazio" titulo="Nenhuma divergência de dupla conferência neste recorte." />
    <template v-else>
      <div class="tabela-scroll" :class="{ atualizando: query.isFetching.value }">
        <table class="tabela">
          <thead>
            <tr>
              <th scope="col">Fonte</th>
              <th scope="col">Localização</th>
              <th scope="col">Campo</th>
              <th scope="col">Cargo · votável</th>
              <th scope="col">Valor esperado</th>
              <th scope="col">Valor encontrado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in itens" :key="d.id">
              <td>{{ nulo(d.fonte) }}</td>
              <td>{{ localizacao(d) }}</td>
              <td>{{ nulo(d.campo) }}</td>
              <td>{{ votavel(d) }}</td>
              <td>{{ nulo(d.valor_esperado) }}</td>
              <td>{{ nulo(d.valor_encontrado) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Paginacao v-model:pagina="pagina" :total="query.data.value?.total ?? 0" :tamanho="TAMANHO" />
    </template>
  </section>
</template>
