<script setup>
import { ref, watch } from 'vue'
import SecaoView from './SecaoView.vue'
import { api } from '../api/client'
import ThOrdenavel from '../components/ThOrdenavel.vue'
import { useOrdenacao } from '../composables/ordenacao'
import { useAnalise } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarNumero, formatarPercentual } from '../lib/format'
import { t } from '../i18n'
import BiometriaUfPanel from '../components/BiometriaUfPanel.vue'
import BiometriaFaixasPanel from '../components/BiometriaFaixasPanel.vue'

const secaoModalId = ref(null)

const { store } = useSelecaoEleicao()
const ordUf = useOrdenacao()
const ordMunicipios = useOrdenacao()
const ordSecoes = useOrdenacao()
const analiseQuery = useAnalise(() => ({ _biometria_uf: ordUf.ordenacao.value }))

const ufSelecionada = ref(null)
const municipioSelecionado = ref(null)
const municipios = ref([])
const secoes = ref([])
const carregandoMunicipios = ref(false)
const carregandoSecoes = ref(false)
const paramsOrdem = (o) => (o ? { ordem: o.ordem, direcao: o.direcao } : {})

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
      ...paramsOrdem(ordMunicipios.ordenacao.value),
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
      ...paramsOrdem(ordSecoes.ordenacao.value),
    })
    secoes.value = r.secoes ?? []
  } catch (e) {
    secoes.value = []
  } finally {
    carregandoSecoes.value = false
  }
}

watch(ordMunicipios.ordenacao, () => {
  if (ufSelecionada.value) carregarMunicipios(ufSelecionada.value)
})
watch(ordSecoes.ordenacao, () => {
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
    :ordenacao="ordUf.ordenacao.value"
    @ordenar="ordUf.alternar"
    @select="carregarMunicipios"
  />

  <div class="mesa">
    <div class="card">
      <div class="card__cabecalho">
        <h2>{{ $t('biometriaView.municipios') }}</h2>
        <p v-if="ufSelecionada" class="card__meta">{{ ufSelecionada }}</p>
      </div>
      <div v-if="!ufSelecionada" class="vazio">{{ $t('biometriaView.cliqueEstado') }}</div>
      <div v-else-if="carregandoMunicipios" class="vazio">{{ $t('comum.carregando') }}</div>
      <div v-else-if="municipios.length === 0" class="vazio">{{ $t('comum.semDados') }}.</div>
      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <ThOrdenavel coluna="nm_municipio" :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">{{ $t('comum.municipio') }}</ThOrdenavel>
              <ThOrdenavel coluna="qt_nao_habilitada" numero :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">{{ $t('biometriaView.naoHabilitada') }}</ThOrdenavel>
              <ThOrdenavel coluna="percentual_nao_habilitada" numero :ordenacao="ordMunicipios.ordenacao.value" @ordenar="ordMunicipios.alternar">%</ThOrdenavel>
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
              <ThOrdenavel coluna="nr_zona" :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">{{ $t('comum.zona') }}</ThOrdenavel>
              <ThOrdenavel coluna="nr_secao" :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">{{ $t('comum.secao') }}</ThOrdenavel>
              <ThOrdenavel coluna="qt_nao_habilitada" numero :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">{{ $t('biometriaView.naoHabilitada') }}</ThOrdenavel>
              <ThOrdenavel coluna="percentual_nao_habilitada" numero :ordenacao="ordSecoes.ordenacao.value" @ordenar="ordSecoes.alternar">%</ThOrdenavel>
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