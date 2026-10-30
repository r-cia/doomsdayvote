<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarNumero, formatarPercentual } from '../lib/format'
import SecaoView from './SecaoView.vue'

const { store } = useSelecaoEleicao()
const router = useRouter()

const urnas = ref([])
const carregandoUrnas = ref(false)

const ufSelecionada = ref(null)
const municipioSelecionado = ref(null)
const municipios = ref([])
const secoes = ref([])
const carregandoMunicipios = ref(false)
const carregandoSecoes = ref(false)

const ordenacao = ref({ coluna: 'sg_uf', direcao: 'asc' })

function alternar(coluna) {
  if (ordenacao.value.coluna === coluna) {
    ordenacao.value = { coluna, direcao: ordenacao.value.direcao === 'asc' ? 'desc' : 'asc' }
  } else {
    ordenacao.value = { coluna, direcao: 'asc' }
  }
}

function seta(coluna) {
  if (ordenacao.value.coluna !== coluna) return ''
  return ordenacao.value.direcao === 'asc' ? ' ↑' : ' ↓'
}

function valor(linha, coluna) {
  if (coluna === 'sg_uf') return linha.sg_uf ?? ''
  return Number(linha[coluna] ?? 0)
}

const linhas = computed(() => {
  const lista = [...urnas.value]
  const { coluna, direcao } = ordenacao.value
  lista.sort((a, b) => {
    const va = valor(a, coluna)
    const vb = valor(b, coluna)
    if (typeof va === 'string') return direcao === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return direcao === 'asc' ? va - vb : vb - va
  })
  return lista
})

async function carregarUrnas() {
  carregandoUrnas.value = true
  try {
    const r = await api.encerramentoUrnas({
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf,
    })
    urnas.value = r.ufs ?? []
  } catch (e) {
    urnas.value = []
  } finally {
    carregandoUrnas.value = false
  }
}

async function carregarMunicipios(uf) {
  ufSelecionada.value = uf
  municipioSelecionado.value = null
  secoes.value = []
  carregandoMunicipios.value = true
  try {
    const r = await api.encerramentoMunicipios({
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf,
      uf,
    })
    municipios.value = r.municipios ?? []
  } catch (e) {
    municipios.value = []
  } finally {
    carregandoMunicipios.value = false
  }
}

async function carregarSecoes(municipio) {
  municipioSelecionado.value = municipio
  carregandoSecoes.value = true
  try {
    const r = await api.encerramentoSecoes({
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf,
      uf: ufSelecionada.value,
      municipio,
    })
    secoes.value = r.secoes ?? []
  } catch (e) {
    secoes.value = []
  } finally {
    carregandoSecoes.value = false
  }
}

function nomeMunicipio(m) {
  return m.nm_municipio ?? `Município ${m.cd_municipio_tse}`
}

const secaoModalId = ref(null)
function abrirSecao(item) {
  secaoModalId.value = item.id
}

onMounted(carregarUrnas)
watch(() => store.asOf, carregarUrnas)
watch(() => store.electionId, carregarUrnas)
watch(() => store.cargo, carregarUrnas)
</script>

<template>
  <section class="painel" aria-labelledby="urnas-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Encerramento</p>
        <h2 id="urnas-titulo">Urnas</h2>
      </div>
    </header>

    <div v-if="carregandoUrnas" class="vazio">Carregando…</div>
    <div v-else-if="urnas.length === 0" class="vazio">Sem dados.</div>

    <div v-else class="tabela-scroll">
      <table class="tabela">
        <thead>
          <tr>
            <th scope="col" class="ordenavel" @click="alternar('sg_uf')">UF{{ seta('sg_uf') }}</th>
            <th scope="col" class="tabela__numero ordenavel" @click="alternar('total')">Nº de urnas{{ seta('total') }}</th>
            <th scope="col" class="tabela__numero ordenavel" @click="alternar('ate_1715')">Até 17:15{{ seta('ate_1715') }}</th>
            <th scope="col" class="tabela__numero ordenavel" @click="alternar('pct_1715')">% até 17:15{{ seta('pct_1715') }}</th>
            <th scope="col" class="tabela__numero ordenavel" @click="alternar('ate_1915')">Até 19:15{{ seta('ate_1915') }}</th>
            <th scope="col" class="tabela__numero ordenavel" @click="alternar('pct_1915')">% até 19:15{{ seta('pct_1915') }}</th>
            <th scope="col" class="tabela__numero ordenavel" @click="alternar('apos_1915')">Após 19:15{{ seta('apos_1915') }}</th>
            <th scope="col" class="tabela__numero ordenavel" @click="alternar('pct_apos_1915')">% após 19:15{{ seta('pct_apos_1915') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in linhas" :key="u.sg_uf" class="linha-clicavel" @click="carregarMunicipios(u.sg_uf)">
            <td>{{ u.sg_uf }}</td>
            <td class="tabela__numero">{{ formatarNumero(u.total) }}</td>
            <td class="tabela__numero">{{ formatarNumero(u.ate_1715) }}</td>
            <td class="tabela__numero">{{ formatarPercentual(u.pct_1715) }}</td>
            <td class="tabela__numero">{{ formatarNumero(u.ate_1915) }}</td>
            <td class="tabela__numero">{{ formatarPercentual(u.pct_1915) }}</td>
            <td class="tabela__numero">{{ formatarNumero(u.apos_1915) }}</td>
            <td class="tabela__numero">{{ formatarPercentual(u.pct_apos_1915) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <div class="mesa">
    <div class="card">
      <div class="card__cabecalho">
        <h2>Municípios com maior % após 17:15</h2>
        <p v-if="ufSelecionada" class="card__meta">{{ ufSelecionada }}</p>
      </div>
      <div v-if="!ufSelecionada" class="vazio">Clique em um estado na tabela acima.</div>
      <div v-else-if="carregandoMunicipios" class="vazio">Carregando…</div>
      <div v-else-if="municipios.length === 0" class="vazio">Sem dados.</div>
      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Município</th>
              <th scope="col" class="num">Total</th>
              <th scope="col" class="num">Após 17:15</th>
              <th scope="col" class="num">%</th>
              <th scope="col">Partido</th>
              <th scope="col" class="num">Votos</th>
              <th scope="col" class="num">% Votos</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in municipios"
              :key="m.cd_municipio_tse"
              class="linha-clicavel"
              @click="carregarSecoes(m.cd_municipio_tse)"
            >
              <td>{{ m.nm_municipio ?? 'Município ' + m.cd_municipio_tse }}</td>
              <td class="num">{{ formatarNumero(m.total) }}</td>
              <td class="num">{{ formatarNumero(m.apos_1715) }}</td>
              <td class="num">{{ formatarPercentual(m.pct_apos_1715) }}</td>
              <td>{{ m.partido ?? '—' }}</td>
              <td class="num">{{ formatarNumero(m.votos) }}</td>
              <td class="num">{{ formatarPercentual(m.pct_votos) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card__cabecalho">
        <h2>Seções com maior % após 17:15</h2>
        <p v-if="municipioSelecionado" class="card__meta">
          {{ (municipios.find((m) => m.cd_municipio_tse === municipioSelecionado) || {}).nm_municipio }}
        </p>
      </div>
      <div v-if="!municipioSelecionado" class="vazio">Clique em um município.</div>
      <div v-else-if="carregandoSecoes" class="vazio">Carregando…</div>
      <div v-else-if="secoes.length === 0" class="vazio">Sem dados.</div>
      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Zona</th>
              <th scope="col">Seção</th>
              <th scope="col" class="num">Encerramento</th>
              <th scope="col">Partido</th>
              <th scope="col" class="num">Votos</th>
              <th scope="col" class="num">% Votos</th>
              <th scope="col"><span class="sr-only">Detalhe</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in secoes" :key="s.id">
              <td>{{ s.nr_zona }}</td>
              <td>{{ s.nr_secao }}</td>
              <td class="num">{{ s.dt_encerramento ? new Date(s.dt_encerramento).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—' }}</td>
              <td>{{ s.partido ?? '—' }}</td>
              <td class="num">{{ formatarNumero(s.votos) }}</td>
              <td class="num">{{ formatarPercentual(s.pct_votos) }}</td>
              <td>
                <button type="button" class="button button--ghost button--compacto" @click="abrirSecao(s)">Detalhe</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <SecaoView
    v-if="secaoModalId"
    :modal="true"
    :id-prop="secaoModalId"
    :election-id-prop="store.electionId"
    :cargo-prop="store.cargo"
    :as-of-prop="store.asOf ?? ''"
    :uf-prop="ufSelecionada ?? ''"
    :municipio-prop="municipioSelecionado ?? ''"
    @close="secaoModalId = null"
  />
</template>