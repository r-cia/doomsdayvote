<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'
import { useOrdenacao } from '../composables/ordenacao'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarHora, formatarNumero, formatarPercentual } from '../lib/format'
import TabelaScroll from '../components/TabelaScroll.vue'
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

const ordemUrnas = useOrdenacao()
const ordemMunicipios = useOrdenacao()
const ordemSecoes = useOrdenacao()

async function carregarUrnas() {
  carregandoUrnas.value = true
  try {
    const r = await api.encerramentoUrnas({
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf,
      ...ordemUrnas.params.value,
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
      ...ordemMunicipios.params.value,
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
      ...ordemSecoes.params.value,
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
watch(ordemUrnas.params, carregarUrnas)
watch(ordemMunicipios.params, () => {
  if (ufSelecionada.value) carregarMunicipios(ufSelecionada.value)
})
watch(ordemSecoes.params, () => {
  if (municipioSelecionado.value) carregarSecoes(municipioSelecionado.value)
})
</script>

<template>
  <section class="painel" aria-labelledby="urnas-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('encerramento.titulo') }}</p>
        <h2 id="urnas-titulo">{{ $t('encerramento.urnas') }}</h2>
      </div>
    </header>

    <div v-if="carregandoUrnas && urnas.length === 0" class="vazio">{{ $t('comum.carregando') }}</div>
    <div v-else-if="urnas.length === 0" class="vazio">{{ $t('comum.semDados') }}</div>

    <TabelaScroll v-else :atualizando="carregandoUrnas">
      <table class="tabela">
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ordemUrnas.ariaSort('sg_uf')"><button type="button" @click="ordemUrnas.alternar('sg_uf')">UF{{ ordemUrnas.seta('sg_uf') }}</button></th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ordemUrnas.ariaSort('total')"><button type="button" @click="ordemUrnas.alternar('total')">Nº de urnas{{ ordemUrnas.seta('total') }}</button></th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ordemUrnas.ariaSort('ate_1715')"><button type="button" @click="ordemUrnas.alternar('ate_1715')">Até 17:15{{ ordemUrnas.seta('ate_1715') }}</button></th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ordemUrnas.ariaSort('pct_1715')"><button type="button" @click="ordemUrnas.alternar('pct_1715')">% até 17:15{{ ordemUrnas.seta('pct_1715') }}</button></th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ordemUrnas.ariaSort('ate_1915')"><button type="button" @click="ordemUrnas.alternar('ate_1915')">Até 19:15{{ ordemUrnas.seta('ate_1915') }}</button></th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ordemUrnas.ariaSort('pct_1915')"><button type="button" @click="ordemUrnas.alternar('pct_1915')">% até 19:15{{ ordemUrnas.seta('pct_1915') }}</button></th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ordemUrnas.ariaSort('apos_1915')"><button type="button" @click="ordemUrnas.alternar('apos_1915')">Após 19:15{{ ordemUrnas.seta('apos_1915') }}</button></th>
            <th scope="col" class="tabela__numero ordenavel" :aria-sort="ordemUrnas.ariaSort('pct_apos_1915')"><button type="button" @click="ordemUrnas.alternar('pct_apos_1915')">% após 19:15{{ ordemUrnas.seta('pct_apos_1915') }}</button></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in urnas" :key="u.sg_uf" class="linha-clicavel" @click="carregarMunicipios(u.sg_uf)">
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
    </TabelaScroll>
  </section>

  <div class="mesa">
    <div class="card">
      <div class="card__cabecalho">
        <h2>Municípios com maior % após 17:15</h2>
        <p v-if="ufSelecionada" class="card__meta">{{ ufSelecionada }}</p>
      </div>
      <div v-if="!ufSelecionada" class="vazio">{{ $t('comum.cliqueEstado') }}</div>
      <div v-else-if="carregandoMunicipios && municipios.length === 0" class="vazio">{{ $t('comum.carregando') }}</div>
      <div v-else-if="municipios.length === 0" class="vazio">{{ $t('comum.semDados') }}</div>
      <TabelaScroll v-else :atualizando="carregandoMunicipios">
        <table>
          <thead>
            <tr>
              <th scope="col" class="ordenavel" :aria-sort="ordemMunicipios.ariaSort('nm_municipio')"><button type="button" @click="ordemMunicipios.alternar('nm_municipio')">Município{{ ordemMunicipios.seta('nm_municipio') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemMunicipios.ariaSort('total')"><button type="button" @click="ordemMunicipios.alternar('total')">Total{{ ordemMunicipios.seta('total') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemMunicipios.ariaSort('apos_1715')"><button type="button" @click="ordemMunicipios.alternar('apos_1715')">Após 17:15{{ ordemMunicipios.seta('apos_1715') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemMunicipios.ariaSort('pct_apos_1715')"><button type="button" @click="ordemMunicipios.alternar('pct_apos_1715')">%{{ ordemMunicipios.seta('pct_apos_1715') }}</button></th>
              <th scope="col" class="ordenavel" :aria-sort="ordemMunicipios.ariaSort('partido')"><button type="button" @click="ordemMunicipios.alternar('partido')">Partido{{ ordemMunicipios.seta('partido') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemMunicipios.ariaSort('votos')"><button type="button" @click="ordemMunicipios.alternar('votos')">Votos{{ ordemMunicipios.seta('votos') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemMunicipios.ariaSort('pct_votos')"><button type="button" @click="ordemMunicipios.alternar('pct_votos')">% Votos{{ ordemMunicipios.seta('pct_votos') }}</button></th>
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
      </TabelaScroll>
    </div>

    <div class="card">
      <div class="card__cabecalho">
        <h2>Seções com maior % após 17:15</h2>
        <p v-if="municipioSelecionado" class="card__meta">
          {{ (municipios.find((m) => m.cd_municipio_tse === municipioSelecionado) || {}).nm_municipio }}
        </p>
      </div>
      <div v-if="!municipioSelecionado" class="vazio">{{ $t('comum.cliqueMunicipio') }}</div>
      <div v-else-if="carregandoSecoes && secoes.length === 0" class="vazio">{{ $t('comum.carregando') }}</div>
      <div v-else-if="secoes.length === 0" class="vazio">{{ $t('comum.semDados') }}</div>
      <TabelaScroll v-else :atualizando="carregandoSecoes">
        <table>
          <thead>
            <tr>
              <th scope="col" class="ordenavel" :aria-sort="ordemSecoes.ariaSort('nr_zona')"><button type="button" @click="ordemSecoes.alternar('nr_zona')">Zona{{ ordemSecoes.seta('nr_zona') }}</button></th>
              <th scope="col" class="ordenavel" :aria-sort="ordemSecoes.ariaSort('nr_secao')"><button type="button" @click="ordemSecoes.alternar('nr_secao')">Seção{{ ordemSecoes.seta('nr_secao') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemSecoes.ariaSort('dt_encerramento')"><button type="button" @click="ordemSecoes.alternar('dt_encerramento')">Encerramento{{ ordemSecoes.seta('dt_encerramento') }}</button></th>
              <th scope="col" class="ordenavel" :aria-sort="ordemSecoes.ariaSort('partido')"><button type="button" @click="ordemSecoes.alternar('partido')">Partido{{ ordemSecoes.seta('partido') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemSecoes.ariaSort('votos')"><button type="button" @click="ordemSecoes.alternar('votos')">Votos{{ ordemSecoes.seta('votos') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemSecoes.ariaSort('pct_votos')"><button type="button" @click="ordemSecoes.alternar('pct_votos')">% Votos{{ ordemSecoes.seta('pct_votos') }}</button></th>
              <th scope="col"><span class="sr-only">{{ $t('comum.detalhe') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in secoes" :key="s.id">
              <td>{{ s.nr_zona }}</td>
              <td>{{ s.nr_secao }}</td>
              <td class="num">{{ formatarHora(s.dt_encerramento) }}</td>
              <td>{{ s.partido ?? '—' }}</td>
              <td class="num">{{ formatarNumero(s.votos) }}</td>
              <td class="num">{{ formatarPercentual(s.pct_votos) }}</td>
              <td>
                <button type="button" class="button button--ghost button--compacto" @click="abrirSecao(s)">{{ $t('comum.detalhe') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </TabelaScroll>
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
