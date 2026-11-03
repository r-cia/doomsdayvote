<script setup>
import { ref, watch } from 'vue'
import SecaoView from './SecaoView.vue'
import { api } from '../api/client'
import { useAnalise } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarNumero, formatarPercentual } from '../lib/format'
import { t } from '../i18n'
import BiometriaUfPanel from '../components/BiometriaUfPanel.vue'
import BiometriaFaixasPanel from '../components/BiometriaFaixasPanel.vue'

const secaoModalId = ref(null)

const { store } = useSelecaoEleicao()
const analiseQuery = useAnalise()

const ufSelecionada = ref(null)
const municipioSelecionado = ref(null)
const municipios = ref([])
const secoes = ref([])
const carregandoMunicipios = ref(false)
const carregandoSecoes = ref(false)
const ordenarMunicipios = ref('nao_habilitada')
const ordenarSecoes = ref('percentual')

async function carregarMunicipios(uf) {
  ufSelecionada.value = uf
  municipioSelecionado.value = null
  secoes.value = []
  carregandoMunicipios.value = true
  try {
    const r = await api.biometriaMunicipios({
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf,
      uf,
      ordenar_por: ordenarMunicipios.value,
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
    const r = await api.biometriaSecoes({
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf,
      uf: ufSelecionada.value,
      municipio,
      ordenar_por: ordenarSecoes.value,
    })
    secoes.value = r.secoes ?? []
  } catch (e) {
    secoes.value = []
  } finally {
    carregandoSecoes.value = false
  }
}

watch(ordenarMunicipios, () => {
  if (ufSelecionada.value) carregarMunicipios(ufSelecionada.value)
})
watch(ordenarSecoes, () => {
  if (municipioSelecionado.value) carregarSecoes(municipioSelecionado.value)
})

function nomeMunicipio(m) {
  return m.nm_municipio ?? `${t('comum.municipio')} ${m.cd_municipio_tse}`
}

function abrirSecao(item) {
  secaoModalId.value = item.id
}
</script>

<template>
  <BiometriaFaixasPanel />

  <BiometriaUfPanel
    :dados="analiseQuery.data.value?.biometria_uf ?? []"
    @select="carregarMunicipios"
  />

  <div class="mesa">
    <div class="card">
      <div class="card__cabecalho">
        <h2>{{ $t('biometriaView.municipios') }}</h2>
        <div class="uf-painel__acoes">
          <select v-if="ufSelecionada" v-model="ordenarMunicipios" class="uf-ordenacao">
            <option value="nao_habilitada">{{ $t('biometriaView.naoHabilitada') }}</option>
            <option value="percentual">{{ $t('biometriaUf.pctNaoHabilitada') }}</option>
            <option value="comparecimento">{{ $t('kpis.comparecimento') }}</option>
          </select>
        </div>
        <p v-if="ufSelecionada" class="card__meta">{{ ufSelecionada }}</p>
      </div>
      <div v-if="!ufSelecionada" class="vazio">{{ $t('biometriaView.cliqueEstado') }}</div>
      <div v-else-if="carregandoMunicipios" class="vazio">{{ $t('comum.carregando') }}</div>
      <div v-else-if="municipios.length === 0" class="vazio">{{ $t('comum.semDados') }}.</div>
      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{{ $t('comum.municipio') }}</th>
              <th scope="col" class="num">{{ $t('biometriaView.naoHabilitada') }}</th>
              <th scope="col" class="num">%</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in municipios"
              :key="m.cd_municipio_tse"
              class="linha-clicavel"
              @click="carregarSecoes(m.cd_municipio_tse)"
            >
              <td>{{ nomeMunicipio(m) }}</td>
              <td class="num">{{ formatarNumero(m.qt_nao_habilitada) }}</td>
              <td class="num">{{ formatarPercentual(m.percentual_nao_habilitada) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card__cabecalho">
        <h2>{{ $t('biometriaView.secoes') }}</h2>
        <div class="uf-painel__acoes">
          <select v-if="municipioSelecionado" v-model="ordenarSecoes" class="uf-ordenacao">
            <option value="percentual">{{ $t('biometriaUf.pctNaoHabilitada') }}</option>
            <option value="nao_habilitada">{{ $t('biometriaView.naoHabilitada') }}</option>
            <option value="comparecimento">{{ $t('kpis.comparecimento') }}</option>
          </select>
        </div>
        <p v-if="municipioSelecionado" class="card__meta">
          {{ nomeMunicipio(municipios.find((m) => m.cd_municipio_tse === municipioSelecionado) || {}) }}
        </p>
      </div>
      <div v-if="!municipioSelecionado" class="vazio">{{ $t('biometriaView.cliqueMunicipio') }}</div>
      <div v-else-if="carregandoSecoes" class="vazio">{{ $t('comum.carregando') }}</div>
      <div v-else-if="secoes.length === 0" class="vazio">{{ $t('comum.semDados') }}.</div>
      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{{ $t('comum.zona') }}</th>
              <th scope="col">{{ $t('comum.secao') }}</th>
              <th scope="col" class="num">{{ $t('biometriaView.naoHabilitada') }}</th>
              <th scope="col" class="num">%</th>
              <th scope="col"><span class="sr-only">{{ $t('comum.detalhe') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in secoes" :key="s.id">
              <td>{{ s.nr_zona }}</td>
              <td>{{ s.nr_secao }}</td>
              <td class="num">{{ formatarNumero(s.qt_nao_habilitada) }}</td>
              <td class="num">{{ formatarPercentual(s.percentual_nao_habilitada) }}</td>
              <td>
                <button
                  type="button"
                  class="button button--ghost button--compacto"
                  @click="abrirSecao(s)"
                >
                  {{ $t('comum.detalhe') }}
                </button>
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