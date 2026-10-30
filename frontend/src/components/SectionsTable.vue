<script setup>
import { computed, ref } from 'vue'
import StateBlock from './StateBlock.vue'
import TabelaScroll from './TabelaScroll.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { formatarData, formatarDataHora, formatarNumero } from '../lib/format'
import { motivoSecao, opcoesStatus, statusSecao } from '../lib/status'

const props = defineProps({
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  status: { type: String, default: '' },
  zona: { type: Number, default: null },
  secao: { type: Number, default: null },
  municipioNome: { type: String, default: '' },
  pageSize: { type: Number, default: 25 },
  uf: { type: String, default: null },
  municipio: { type: Number, default: null },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const emit = defineEmits([
  'update:page',
  'update:page-size',
  'update:status',
  'update:zona',
  'update:secao',
  'update:municipio-nome',
  'select',
  'retry',
])

const tabela = ref(null)
const { ariaSort, seta } = props.ordenacao

function alternar(coluna) {
  props.ordenacao.alternar(coluna)
  emit('update:page', 1)
}

const itens = computed(() => props.data?.items ?? [])
const total = computed(() => Number(props.data?.total ?? 0))
const pagina = computed(() => Number(props.data?.page ?? 1))
const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(total.value / Math.max(1, props.pageSize))),
)
const statusDisponiveis = opcoesStatus()

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
        <p v-if="uf">
          {{ formatarNumero(total) }} seções no filtro.
          <template v-if="contexto">Escopo: {{ contexto }}.</template>
        </p>
      </div>
    </div>

    <p v-if="!uf" class="vazio">Selecione um estado.</p>

    <template v-else>
      <div class="secoes__barra">
        <label class="campo campo--busca">
          <span>Município</span>
          <input
            type="text"
            placeholder="Nome"
            :value="municipioNome"
            @change="emit('update:municipio-nome', $event.target.value)"
          />
        </label>

        <label class="campo campo--curto">
          <span>Zona</span>
          <input
            type="number"
            min="1"
            :value="zona ?? ''"
            @change="emit('update:zona', $event.target.value)"
          />
        </label>

        <label class="campo campo--curto">
          <span>Seção</span>
          <input
            type="number"
            min="1"
            :value="secao ?? ''"
            @change="emit('update:secao', $event.target.value)"
          />
        </label>

        <label class="campo campo--curto">
          <span>Status</span>
          <select
            :value="status"
            @change="emit('update:status', $event.target.value)"
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
            @change="emit('update:page-size', Number($event.target.value))"
          >
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>
      </div>

      <StateBlock
        v-if="error"
        estado="erro"
        :titulo="$t('comum.erro')"
        :descricao="error"
        :acao="$t('comum.tentarNovamente')"
        @acao="emit('retry')"
      />
      <StateBlock
        v-else-if="loading && !data"
        estado="carregando"
        :titulo="$t('comum.carregando')"
      />
      <p v-else-if="itens.length === 0" class="vazio">{{ $t('comum.semDados') }}</p>

      <template v-else>
        <TabelaScroll :atualizando="atualizando">
          <table ref="tabela" @keydown="navegarLinhas">
            <caption class="sr-only">
              Seções eleitorais com status e horário de recebimento do BU
            </caption>
            <thead>
              <tr>
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('sg_uf')"><button type="button" @click="alternar('sg_uf')">UF{{ seta('sg_uf') }}</button></th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_municipio')"><button type="button" @click="alternar('nm_municipio')">Município{{ seta('nm_municipio') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_zona')"><button type="button" @click="alternar('nr_zona')">Zona{{ seta('nr_zona') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_secao')"><button type="button" @click="alternar('nr_secao')">Seção{{ seta('nr_secao') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_local_votacao')"><button type="button" @click="alternar('nr_local_votacao')">Local{{ seta('nr_local_votacao') }}</button></th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('status')"><button type="button" @click="alternar('status')">Status{{ seta('status') }}</button></th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('bu_recebido')"><button type="button" @click="alternar('bu_recebido')">BU recebido{{ seta('bu_recebido') }}</button></th>
                <th scope="col"><span class="sr-only">Ação</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itens" :key="item.id">
                <td>{{ item.sg_uf }}</td>
                <td>{{ item.nm_municipio }}</td>
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
                    data-secao-btn
                    @click="emit('select', item)"
                  >
                    {{ $t('comum.detalhe') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </TabelaScroll>

        <nav class="paginacao" aria-label="Paginação das seções">
          <span>Página {{ pagina }} de {{ totalPaginas }}</span>
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
    </template>
  </section>
</template>
