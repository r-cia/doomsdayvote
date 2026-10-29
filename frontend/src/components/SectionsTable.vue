<script setup>
import { computed, ref, watch } from 'vue'
import StateBlock from './StateBlock.vue'
import {
  formatarData,
  formatarDataHora,
  formatarNumero,
} from '../lib/format'
import { motivoSecao, opcoesStatus, statusSecao } from '../lib/status'

const props = defineProps({
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  status: { type: String, default: '' },
  busca: { type: String, default: '' },
  pageSize: { type: Number, default: 25 },
  uf: { type: String, default: null },
  municipio: { type: Number, default: null },
})

const emit = defineEmits([
  'update:page',
  'update:page-size',
  'update:status',
  'update:busca',
  'select',
  'retry',
])

const busca = ref(props.busca)
let debounceBusca = null

watch(
  () => props.busca,
  (valor) => {
    busca.value = valor
  },
)

watch(busca, (valor) => {
  clearTimeout(debounceBusca)
  debounceBusca = setTimeout(() => emit('update:busca', valor), 300)
})
const tabela = ref(null)
const itens = computed(() => props.data?.items ?? [])
const total = computed(() => Number(props.data?.total ?? 0))
const pagina = computed(() => Number(props.data?.page ?? 1))
const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(total.value / Math.max(1, props.pageSize))),
)
const statusDisponiveis = opcoesStatus()

const itensFiltrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  if (!termo) return itens.value
  return itens.value.filter((item) =>
    [
      item.nm_municipio,
      item.sg_uf,
      item.nr_zona,
      item.nr_secao,
      item.nr_local_votacao,
      item.status,
      statusSecao(item.status).rotulo,
    ]
      .filter((valor) => valor !== null && valor !== undefined)
      .some((valor) => String(valor).toLowerCase().includes(termo)),
  )
})

const contexto = computed(() => {
  const partes = []
  if (props.uf) partes.push(props.uf)
  if (props.municipio) partes.push(`município ${props.municipio}`)
  return partes.join(' · ')
})

function recebimento(item) {
  if (!item.dt_bu_recebido) return '—'
  return item.precisao_dt_bu_recebido === 'DATA'
    ? formatarData(item.dt_bu_recebido)
    : formatarDataHora(item.dt_bu_recebido)
}

function irPara(paginaDestino) {
  const destino = Math.min(Math.max(1, paginaDestino), totalPaginas.value)
  if (destino !== pagina.value) emit('update:page', destino)
}

function irParaUltima() {
  irPara(totalPaginas.value)
}

watch(
  () => props.data?.page,
  () => {},
)

function navegarLinhas(evento) {
  const botoes = [...(tabela.value?.querySelectorAll('[data-secao-btn]') ?? [])]
  if (botoes.length === 0) return
  const atual = botoes.indexOf(document.activeElement)
  let destino = atual
  if (evento.key === 'ArrowDown') destino = Math.min(botoes.length - 1, atual + 1)
  else if (evento.key === 'ArrowUp') destino = Math.max(0, atual - 1)
  else if (evento.key === 'Home') destino = 0
  else if (evento.key === 'End') destino = botoes.length - 1
  else return
  evento.preventDefault()
  botoes[destino]?.focus()
}
</script>

<template>
  <section class="card secoes" aria-labelledby="secoes-titulo">
    <div class="card__cabecalho">
      <div>
        <h2 id="secoes-titulo">Seções eleitorais</h2>
        <p>
          {{ formatarNumero(total) }} seções no filtro.
          <template v-if="contexto">Escopo: {{ contexto }}.</template>
        </p>
      </div>
    </div>

    <div class="secoes__barra">
      <label class="campo campo--busca">
        <span>Buscar nesta página</span>
        <input
          v-model="busca"
          type="search"
          placeholder="Município, zona, seção ou local"
        />
      </label>

      <label class="campo campo--curto">
        <span>Status</span>
        <select
          :value="status"
          @change="$emit('update:status', $event.target.value)"
        >
          <option value="">Todos</option>
          <option
            v-for="opcao in statusDisponiveis"
            :key="opcao.valor"
            :value="opcao.valor"
          >
            {{ opcao.rotulo }}
          </option>
        </select>
      </label>

      <label class="campo campo--curto">
        <span>Por página</span>
        <select
          :value="pageSize"
          @change="$emit('update:page-size', Number($event.target.value))"
        >
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
          <option :value="200">200</option>
        </select>
      </label>
    </div>

    <StateBlock
      v-if="error"
      estado="erro"
      titulo="Não foi possível carregar as seções"
      :descricao="error"
      acao="Tentar novamente"
      @acao="$emit('retry')"
    />
    <StateBlock
      v-else-if="loading && itens.length === 0"
      estado="carregando"
      titulo="Carregando seções"
    />
    <p v-else-if="itens.length === 0" class="vazio">
      Nenhuma seção encontrada com os filtros atuais.
    </p>
    <p v-else-if="itensFiltrados.length === 0" class="vazio">
      Nenhum item desta página corresponde à busca.
    </p>

    <template v-else>
      <p v-if="loading" class="secoes__atualizando" role="status">
        Atualizando seções…
      </p>

      <div class="tabela-scroll">
        <table ref="tabela">
          <caption class="sr-only">
            Seções eleitorais, status do BU e acesso ao detalhe
          </caption>
          <thead>
            <tr>
              <th scope="col">UF</th>
              <th scope="col">Município</th>
              <th scope="col" class="num">Zona</th>
              <th scope="col" class="num">Seção</th>
              <th scope="col" class="num">Local</th>
              <th scope="col">Status</th>
              <th scope="col">BU recebido</th>
              <th scope="col"><span class="sr-only">Ação</span></th>
            </tr>
          </thead>
          <tbody @keydown="navegarLinhas">
            <tr v-for="item in itensFiltrados" :key="item.id">
              <td>{{ item.sg_uf }}</td>
              <th scope="row">{{ item.nm_municipio }}</th>
              <td class="num">{{ item.nr_zona }}</td>
              <td class="num">{{ item.nr_secao }}</td>
              <td class="num">{{ item.nr_local_votacao }}</td>
              <td>
                <span
                  class="status"
                  :class="`status--${statusSecao(item.status).tom}`"
                  :title="statusSecao(item.status).descricao"
                >
                  {{ statusSecao(item.status).rotulo }}
                </span>
                <small v-if="item.motivo" class="status__motivo">
                  {{ motivoSecao(item.motivo) }}
                </small>
              </td>
              <td>{{ recebimento(item) }}</td>
              <td>
                <button
                  type="button"
                  class="button button--ghost button--compacto"
                  :data-secao-btn="item.id"
                  :aria-label="`Ver detalhe da seção ${item.nr_secao} da zona ${item.nr_zona} de ${item.nm_municipio}`"
                  @click="$emit('select', item)"
                >
                  Detalhe
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav class="paginacao" aria-label="Paginação das seções">
        <span aria-live="polite">
          Página {{ pagina }} de {{ totalPaginas }}
        </span>
        <div class="paginacao__botoes">
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina <= 1"
            @click="irPara(1)"
          >
            Primeira
          </button>
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina <= 1"
            @click="irPara(pagina - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina >= totalPaginas"
            @click="irPara(pagina + 1)"
          >
            Próxima
          </button>
          <button
            type="button"
            class="button button--ghost button--compacto"
            :disabled="pagina >= totalPaginas"
            @click="irParaUltima"
          >
            Última
          </button>
        </div>
      </nav>
    </template>
  </section>
</template>
