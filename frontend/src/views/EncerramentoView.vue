<script setup>
import { computed, ref, watch } from 'vue'
import StateBlock from '../components/StateBlock.vue'
import ThOrdenavel from '../components/ThOrdenavel.vue'
import { useOrdenacao } from '../composables/ordenacao'
import {
  useEncerramentoMunicipios,
  useEncerramentoSecoes,
  useEncerramentoUrnas,
} from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarHora, formatarNumero, formatarPercentual } from '../lib/format'
import SecaoView from './SecaoView.vue'

const { store } = useSelecaoEleicao()

const ufSelecionada = ref(null)
const municipioSelecionado = ref(null)
const secaoModalId = ref(null)

const ordUrnas = useOrdenacao()
const ordMunicipios = useOrdenacao()
const ordSecoes = useOrdenacao()

const urnasQuery = useEncerramentoUrnas(ordUrnas.ordenacao)
const municipiosQuery = useEncerramentoMunicipios(
  { uf: ufSelecionada },
  ordMunicipios.ordenacao,
  () => Boolean(ufSelecionada.value),
)
const secoesQuery = useEncerramentoSecoes(
  { uf: ufSelecionada, municipio: municipioSelecionado },
  ordSecoes.ordenacao,
  () => Boolean(ufSelecionada.value && municipioSelecionado.value),
)

const urnas = computed(() => urnasQuery.data.value?.ufs ?? [])
const municipios = computed(() => municipiosQuery.data.value?.municipios ?? [])
const secoes = computed(() => secoesQuery.data.value?.secoes ?? [])

const nomeMunicipio = (m) => m.nm_municipio ?? `Município ${m.cd_municipio_tse}`
const nomeSelecionado = computed(() => {
  const m = municipios.value.find((item) => item.cd_municipio_tse === municipioSelecionado.value)
  return m ? nomeMunicipio(m) : ''
})

function escolherUf(uf) {
  ufSelecionada.value = uf
  municipioSelecionado.value = null
}

watch(
  () => [store.electionId, store.cargo],
  () => escolherUf(null),
)
</script>

<template>
  <section class="painel" aria-labelledby="urnas-titulo" :aria-busy="urnasQuery.isFetching.value">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Encerramento</p>
        <h2 id="urnas-titulo">Urnas</h2>
      </div>
    </header>

    <StateBlock v-if="urnasQuery.isLoading.value" estado="carregando" titulo="Carregando urnas" />
    <StateBlock
      v-else-if="urnasQuery.error.value"
      estado="erro"
      titulo="Não foi possível carregar as urnas"
      :descricao="urnasQuery.error.value.message"
      acao="Tentar novamente"
      @acao="urnasQuery.refetch()"
    />
    <StateBlock v-else-if="urnas.length === 0" estado="vazio" titulo="Sem dados" />

    <div v-else class="tabela-scroll" :class="{ atualizando: urnasQuery.isFetching.value }">
      <table class="tabela">
        <thead>
          <tr>
            <ThOrdenavel coluna="sg_uf" :ordenacao="ordUrnas.ordenacao.value" @ordenar="ordUrnas.alternar">UF</ThOrdenavel>
            <ThOrdenavel coluna="total" numero :ordenacao="ordUrnas.ordenacao.value" @ordenar="ordUrnas.alternar">Nº de urnas</ThOrdenavel>
            <ThOrdenavel coluna="ate_1715" numero :ordenacao="ordUrnas.ordenacao.value" @ordenar="ordUrnas.alternar">Até 17:15</ThOrdenavel>
            <ThOrdenavel coluna="pct_1715" numero :ordenacao="ordUrnas.ordenacao.value" @ordenar="ordUrnas.alternar">% até 17:15</ThOrdenavel>
            <ThOrdenavel coluna="ate_1915" numero :ordenacao="ordUrnas.ordenacao.value" @ordenar="ordUrnas.alternar">Até 19:15</ThOrdenavel>
            <ThOrdenavel coluna="pct_1915" numero :ordenacao="ordUrnas.ordenacao.value" @ordenar="ordUrnas.alternar">% até 19:15</ThOrdenavel>
            <ThOrdenavel coluna="apos_1915" numero :ordenacao="ordUrnas.ordenacao.value" @ordenar="ordUrnas.alternar">Após 19:15</ThOrdenavel>
            <ThOrdenavel coluna="pct_apos_1915" numero :ordenacao="ordUrnas.ordenacao.value" @ordenar="ordUrnas.alternar">% após 19:15</ThOrdenavel>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in urnas" :key="u.sg_uf" class="linha-clicavel" tabindex="0" @click="escolherUf(u.sg_uf)" @keydown.enter="escolherUf(u.sg_uf)">
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
      <StateBlock v-else-if="municipiosQuery.isLoading.value" estado="carregando" titulo="Carregando municípios" />
      <StateBlock
        v-else-if="municipiosQuery.error.value"
        estado="erro"
        titulo="Não foi possível carregar os municípios"
        :descricao="municipiosQuery.error.value.message"
        acao="Tentar novamente"
        @acao="municipiosQuery.refetch()"
      />
      <div v-else-if="municipios.length === 0" class="vazio">Sem dados.</div>
      <div v-else class="tabela-scroll" :class="{ atualizando: municipiosQuery.isFetching.value }">
        <table>
          <thead>
            <tr>
              <ThOrdenavel coluna="nm_municipio" :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">Município</ThOrdenavel>
              <ThOrdenavel coluna="total" numero :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">Total</ThOrdenavel>
              <ThOrdenavel coluna="apos_1715" numero :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">Após 17:15</ThOrdenavel>
              <ThOrdenavel coluna="pct_apos_1715" numero :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">%</ThOrdenavel>
              <ThOrdenavel coluna="partido" :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">Partido</ThOrdenavel>
              <ThOrdenavel coluna="votos" numero :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">Votos</ThOrdenavel>
              <ThOrdenavel coluna="pct_votos" numero :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">% Votos</ThOrdenavel>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in municipios"
              :key="m.cd_municipio_tse"
              class="linha-clicavel"
              tabindex="0"
              @click="municipioSelecionado = m.cd_municipio_tse"
              @keydown.enter="municipioSelecionado = m.cd_municipio_tse"
            >
              <td>{{ nomeMunicipio(m) }}</td>
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
        <p v-if="municipioSelecionado" class="card__meta">{{ nomeSelecionado }}</p>
      </div>
      <div v-if="!municipioSelecionado" class="vazio">Clique em um município.</div>
      <StateBlock v-else-if="secoesQuery.isLoading.value" estado="carregando" titulo="Carregando seções" />
      <StateBlock
        v-else-if="secoesQuery.error.value"
        estado="erro"
        titulo="Não foi possível carregar as seções"
        :descricao="secoesQuery.error.value.message"
        acao="Tentar novamente"
        @acao="secoesQuery.refetch()"
      />
      <div v-else-if="secoes.length === 0" class="vazio">Sem dados.</div>
      <div v-else class="tabela-scroll" :class="{ atualizando: secoesQuery.isFetching.value }">
        <table>
          <thead>
            <tr>
              <ThOrdenavel coluna="nr_zona" :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">Zona</ThOrdenavel>
              <ThOrdenavel coluna="nr_secao" :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">Seção</ThOrdenavel>
              <ThOrdenavel coluna="dt_encerramento" numero :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">Encerramento</ThOrdenavel>
              <th scope="col">Após 17:15</th>
              <ThOrdenavel coluna="partido" :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">Partido</ThOrdenavel>
              <ThOrdenavel coluna="votos" numero :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">Votos</ThOrdenavel>
              <ThOrdenavel coluna="pct_votos" numero :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">% Votos</ThOrdenavel>
              <th scope="col"><span class="sr-only">Detalhe</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in secoes" :key="s.id">
              <td>{{ s.nr_zona }}</td>
              <td>{{ s.nr_secao }}</td>
              <td class="num">{{ formatarHora(s.dt_encerramento) }}</td>
              <td>{{ s.apos_1715 ? 'Sim' : 'Não' }}</td>
              <td>{{ s.partido ?? '—' }}</td>
              <td class="num">{{ formatarNumero(s.votos) }}</td>
              <td class="num">{{ formatarPercentual(s.pct_votos) }}</td>
              <td>
                <button type="button" class="button button--ghost button--compacto" @click="secaoModalId = s.id">Detalhe</button>
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
