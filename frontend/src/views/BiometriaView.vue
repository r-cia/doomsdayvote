<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SecaoView from './SecaoView.vue'
import { api } from '../api/client'
import { useOrdenacao } from '../composables/ordenacao'
import { useAnalise } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarNumero, formatarPercentual } from '../lib/format'
import BiometriaUfPanel from '../components/BiometriaUfPanel.vue'
import StateBlock from '../components/StateBlock.vue'
import TabelaScroll from '../components/TabelaScroll.vue'

const secaoModalId = ref(null)

const { store } = useSelecaoEleicao()
const { t } = useI18n()
const ordemUf = useOrdenacao('biometria_uf')
const ordemMunicipios = useOrdenacao()
const ordemSecoes = useOrdenacao()
const analiseQuery = useAnalise(ordemUf.params)

const ufSelecionada = ref(null)
const municipioSelecionado = ref(null)
const municipios = ref([])
const secoes = ref([])
const carregandoMunicipios = ref(false)
const carregandoSecoes = ref(false)
const erroMunicipios = ref('')
const erroSecoes = ref('')

async function carregarMunicipios(uf) {
  ufSelecionada.value = uf
  municipioSelecionado.value = null
  secoes.value = []
  erroSecoes.value = ''
  erroMunicipios.value = ''
  carregandoMunicipios.value = true
  try {
    const r = await api.biometriaMunicipios({
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf,
      uf,
      ...ordemMunicipios.params.value,
    })
    municipios.value = r.municipios ?? []
  } catch (e) {
    municipios.value = []
    erroMunicipios.value = e.message
  } finally {
    carregandoMunicipios.value = false
  }
}

async function carregarSecoes(municipio) {
  municipioSelecionado.value = municipio
  erroSecoes.value = ''
  carregandoSecoes.value = true
  try {
    const r = await api.biometriaSecoes({
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
    erroSecoes.value = e.message
  } finally {
    carregandoSecoes.value = false
  }
}

watch(ordemMunicipios.params, () => {
  if (ufSelecionada.value) carregarMunicipios(ufSelecionada.value)
})
watch(ordemSecoes.params, () => {
  if (municipioSelecionado.value) carregarSecoes(municipioSelecionado.value)
})

function nomeMunicipio(m) {
  return m.nm_municipio ?? t('tabela.municipioCodigo', { codigo: m.cd_municipio_tse })
}

function abrirSecao(item) {
  secaoModalId.value = item.id
}
</script>

<template>
  <BiometriaUfPanel
    :dados="analiseQuery.data.value?.biometria_uf ?? []"
    :loading="analiseQuery.isLoading.value"
    :atualizando="analiseQuery.isFetching.value"
    :error="analiseQuery.error.value?.message ?? ''"
    :ordenacao="ordemUf"
    @select="carregarMunicipios"
    @retry="analiseQuery.refetch()"
  />

  <div class="mesa">
    <div class="card">
      <div class="card__cabecalho">
        <h2>{{ $t('biometria.municipios') }}</h2>
        <p v-if="ufSelecionada" class="card__meta">{{ ufSelecionada }}</p>
      </div>
      <div v-if="!ufSelecionada" class="vazio">{{ $t('comum.cliqueEstado') }}</div>
      <div v-else-if="carregandoMunicipios && municipios.length === 0" class="vazio">{{ $t('comum.carregando') }}</div>
      <StateBlock
        v-else-if="erroMunicipios"
        estado="erro"
        :titulo="$t('comum.erro')"
        :descricao="erroMunicipios"
        :acao="$t('comum.tentarNovamente')"
        @acao="carregarMunicipios(ufSelecionada)"
      />
      <div v-else-if="municipios.length === 0" class="vazio">{{ $t('comum.semDados') }}</div>
      <TabelaScroll v-else :atualizando="carregandoMunicipios">
        <table>
          <thead>
            <tr>
              <th scope="col" class="ordenavel" :aria-sort="ordemMunicipios.ariaSort('nm_municipio')"><button type="button" @click="ordemMunicipios.alternar('nm_municipio')">{{ $t('tabela.municipio') }}{{ ordemMunicipios.seta('nm_municipio') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemMunicipios.ariaSort('qt_nao_habilitada')"><button type="button" @click="ordemMunicipios.alternar('qt_nao_habilitada')">{{ $t('biometria.naoHabilitada') }}{{ ordemMunicipios.seta('qt_nao_habilitada') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemMunicipios.ariaSort('percentual_nao_habilitada')"><button type="button" @click="ordemMunicipios.alternar('percentual_nao_habilitada')">%{{ ordemMunicipios.seta('percentual_nao_habilitada') }}</button></th>
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
      </TabelaScroll>
    </div>

    <div class="card">
      <div class="card__cabecalho">
        <h2>{{ $t('biometria.secoes') }}</h2>
        <p v-if="municipioSelecionado" class="card__meta">
          {{ nomeMunicipio(municipios.find((m) => m.cd_municipio_tse === municipioSelecionado) || {}) }}
        </p>
      </div>
      <div v-if="!municipioSelecionado" class="vazio">{{ $t('comum.cliqueMunicipio') }}</div>
      <div v-else-if="carregandoSecoes && secoes.length === 0" class="vazio">{{ $t('comum.carregando') }}</div>
      <StateBlock
        v-else-if="erroSecoes"
        estado="erro"
        :titulo="$t('comum.erro')"
        :descricao="erroSecoes"
        :acao="$t('comum.tentarNovamente')"
        @acao="carregarSecoes(municipioSelecionado)"
      />
      <div v-else-if="secoes.length === 0" class="vazio">{{ $t('comum.semDados') }}</div>
      <TabelaScroll v-else :atualizando="carregandoSecoes">
        <table>
          <thead>
            <tr>
              <th scope="col" class="ordenavel" :aria-sort="ordemSecoes.ariaSort('nr_zona')"><button type="button" @click="ordemSecoes.alternar('nr_zona')">{{ $t('tabela.zona') }}{{ ordemSecoes.seta('nr_zona') }}</button></th>
              <th scope="col" class="ordenavel" :aria-sort="ordemSecoes.ariaSort('nr_secao')"><button type="button" @click="ordemSecoes.alternar('nr_secao')">{{ $t('tabela.secao') }}{{ ordemSecoes.seta('nr_secao') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemSecoes.ariaSort('qt_nao_habilitada')"><button type="button" @click="ordemSecoes.alternar('qt_nao_habilitada')">{{ $t('biometria.naoHabilitada') }}{{ ordemSecoes.seta('qt_nao_habilitada') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemSecoes.ariaSort('percentual_nao_habilitada')"><button type="button" @click="ordemSecoes.alternar('percentual_nao_habilitada')">%{{ ordemSecoes.seta('percentual_nao_habilitada') }}</button></th>
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
