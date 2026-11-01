<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import StateBlock from '../components/StateBlock.vue'
import TabelaScroll from '../components/TabelaScroll.vue'
import VersoesBuPanel from '../components/VersoesBuPanel.vue'

const props = defineProps({
  modal: { type: Boolean, default: false },
  idProp: { type: String, default: '' },
  electionIdProp: { type: String, default: '' },
  cargoProp: { type: [String, Number], default: '' },
  asOfProp: { type: String, default: '' },
  ufProp: { type: String, default: '' },
  municipioProp: { type: [String, Number], default: '' },
})

const emit = defineEmits(['close'])
import { useOrdenacao } from '../composables/ordenacao'
import { useSecao, useSecaoVersoes } from '../composables/queries'
import { corPartido, corTextoContraste } from '../lib/colors'
import {
  formatarData,
  formatarDataHora,
  formatarNumero,
  formatarPercentual,
  formatarSha,
  paraInputSaoPaulo,
} from '../lib/format'
import { motivoSecao, statusSecao } from '../lib/status'
import { useFiltersStore } from '../stores/filters'

const store = useFiltersStore()
const { t } = useI18n()
const rota = useRoute()
const router = useRouter()

if (props.modal) {
  if (props.electionIdProp) store.electionId = String(props.electionIdProp)
  if (props.cargoProp) store.cargo = Number(props.cargoProp)
  if (props.asOfProp) store.asOfInput = paraInputSaoPaulo(String(props.asOfProp))
  if (props.ufProp) store.uf = String(props.ufProp)
  if (props.municipioProp) store.municipio = Number(props.municipioProp)
} else {
  if (rota.query.election_id) store.electionId = String(rota.query.election_id)
  if (rota.query.cargo) store.cargo = Number(rota.query.cargo)
  if (rota.query.as_of) store.asOfInput = paraInputSaoPaulo(String(rota.query.as_of))
  if (rota.query.uf) store.uf = String(rota.query.uf)
  if (rota.query.municipio) store.municipio = Number(rota.query.municipio)
}

const id = computed(() => (props.modal ? String(props.idProp) : String(rota.params.id)))
const ordemResultados = useOrdenacao()
const ordemCampos = useOrdenacao('campos')
const ordemVotaveis = useOrdenacao('votaveis')
const { alternar, ariaSort, seta } = ordemResultados
const consulta = useSecao(id, ordemResultados.params)
const versoesConsulta = useSecaoVersoes(
  id,
  computed(() => ({ ...ordemCampos.params.value, ...ordemVotaveis.params.value })),
)
const versoesDados = computed(() => versoesConsulta.data.value ?? null)
const dados = computed(() => consulta.data.value ?? null)
const secao = computed(() => dados.value?.secao ?? null)
const boletim = computed(() => dados.value?.boletim ?? null)
const lote = computed(() => dados.value?.lote ?? null)
const resultados = computed(() => dados.value?.resultados ?? [])
const status = computed(() => dados.value?.status ?? null)
const statusInfo = computed(() => statusSecao(status.value?.status))
const motivo = computed(() => motivoSecao(status.value?.motivo))
const habilitado = computed(() => Boolean(store.electionId && store.cargo))

const totalValidos = computed(() =>
  resultados.value
    .filter(
      (item) => item.categoria === 'nominal' || item.categoria === 'legenda',
    )
    .reduce((total, item) => total + Number(item.qt_votos ?? 0), 0),
)

function percentualResultado(item) {
  if (item.categoria !== 'nominal' && item.categoria !== 'legenda') return null
  if (totalValidos.value <= 0) return null
  return (Number(item.qt_votos ?? 0) / totalValidos.value) * 100
}

function rotuloCategoria(categoria) {
  return (
    {
      nominal: t('secao.categoria.nominal'),
      legenda: t('secao.categoria.legenda'),
      branco: t('secao.categoria.branco'),
      nulo: t('secao.categoria.nulo'),
    }[categoria] ?? categoria ?? '—'
  )
}

function precisao(valor) {
  return (
    {
      DATA_HORA: t('relatorio.dataHora'),
      DATA: t('relatorio.somenteData'),
      AUSENTE: t('relatorio.ausente'),
    }[valor] ?? valor ?? '—'
  )
}

function recebimento() {
  if (!boletim.value) return '—'
  if (boletim.value.precisao_dt_bu_recebido === 'DATA') {
    return formatarData(boletim.value.dt_bu_recebido_data)
  }
  return formatarDataHora(boletim.value.dt_bu_recebido_ts)
}

function fechar() {
  if (props.modal) emit('close')
  else router.push({ name: 'painel' })
}
function voltar() { fechar() }
</script>

<template>
  <Teleport to="body" :disabled="!modal">
    <div :class="modal ? 'secao-modal__overlay' : 'page page--extrato'" @click.self="modal && fechar()">
      <div :class="modal ? 'secao-modal page--extrato' : ''">
      <div class="extrato-topo">
        <button
          v-if="!modal"
          type="button"
          class="button button--ghost"
          @click="voltar"
        >
          ← {{ $t('comum.voltar') }}
        </button>
        <button
          v-else
          type="button"
          class="button button--ghost secao-modal__fechar"
          :aria-label="$t('comum.fechar')"
          @click="fechar"
        >
          ✕
        </button>
        <p>{{ $t('secao.extrato') }}</p>
      </div>

    <StateBlock
      v-if="!habilitado"
      estado="vazio"
      :titulo="$t('comum.filtrosNaoInformados')"
      :acao="$t('secao.irAoPainel')"
      @acao="voltar"
    />
    <StateBlock
      v-else-if="consulta.isLoading.value"
      estado="carregando"
      :titulo="$t('comum.carregando')"
    />
    <StateBlock
      v-else-if="consulta.error.value"
      estado="erro"
      :titulo="$t('comum.erro')"
      :descricao="consulta.error.value.message"
      :acao="$t('comum.tentarNovamente')"
      @acao="consulta.refetch()"
    />

    <template v-else-if="dados">
      <header class="page__cabecalho detalhe-cabecalho">
        <div>
          <h1>
            {{ $t('tabela.secao') }} {{ secao?.nr_secao }} · {{ $t('tabela.zona') }} {{ secao?.nr_zona }}
          </h1>
          <p class="page__descricao">
            {{ secao?.nm_municipio }} · {{ secao?.sg_uf }} · {{ $t('tabela.local') }}
            {{ secao?.nr_local_votacao }}
          </p>
        </div>
        <div class="detalhe-status">
          <span
            class="status"
            :class="`status--${statusInfo.tom}`"
            :title="statusInfo.descricao"
          >
            {{ statusInfo.rotulo }}
          </span>
          <p v-if="motivo">{{ motivo }}</p>
          <p v-else>{{ statusInfo.descricao }}</p>
        </div>
      </header>

      <div class="detalhe-grade">
        <section class="card" aria-labelledby="secao-identificacao">
          <div class="card__cabecalho">
            <h2 id="secao-identificacao">{{ $t('secao.identificacao') }}</h2>
          </div>
          <dl class="dados">
            <div><dt>UF</dt><dd>{{ secao?.sg_uf }}</dd></div>
            <div><dt>{{ $t('tabela.municipio') }}</dt><dd>{{ secao?.nm_municipio }}</dd></div>
            <div><dt>{{ $t('secao.codigoMunicipio') }}</dt><dd>{{ secao?.cd_municipio_tse }}</dd></div>
            <div><dt>{{ $t('tabela.zona') }}</dt><dd>{{ secao?.nr_zona }}</dd></div>
            <div><dt>{{ $t('tabela.secao') }}</dt><dd>{{ secao?.nr_secao }}</dd></div>
            <div><dt>{{ $t('secao.localVotacao') }}</dt><dd>{{ secao?.nr_local_votacao }}</dd></div>
          </dl>
        </section>

        <section class="card" aria-labelledby="secao-boletim">
          <div class="card__cabecalho">
            <h2 id="secao-boletim">{{ $t('secao.boletim') }}</h2>
          </div>
          <StateBlock
            v-if="!boletim"
            estado="vazio"
            :titulo="$t('comum.semDados')"
          />
          <dl v-else class="dados">
            <div><dt>{{ $t('secao.tipoUrna') }}</dt><dd>{{ boletim.ds_tipo_urna ?? boletim.cd_tipo_urna ?? '—' }}</dd></div>
            <div><dt>{{ $t('secao.versao') }}</dt><dd>{{ boletim.versao ?? '—' }}</dd></div>
            <div><dt>{{ $t('relatorio.precisao') }}</dt><dd>{{ precisao(boletim.precisao_dt_bu_recebido) }}</dd></div>
            <div><dt>{{ $t('versoesBU.abertura') }}</dt><dd>{{ formatarDataHora(boletim.dt_abertura) }}</dd></div>
            <div><dt>{{ $t('versoesBU.encerramento') }}</dt><dd>{{ formatarDataHora(boletim.dt_encerramento) }}</dd></div>
            <div><dt>{{ $t('secao.emissaoBu') }}</dt><dd>{{ formatarDataHora(boletim.dt_emissao_bu) }}</dd></div>
            <div><dt>{{ $t('secao.recebimento') }}</dt><dd>{{ recebimento() }}</dd></div>
            <div><dt>{{ $t('versoesBU.aptos') }}</dt><dd>{{ formatarNumero(boletim.qt_aptos) }}</dd></div>
            <div><dt>{{ $t('versoesBU.comparecimento') }}</dt><dd>{{ formatarNumero(boletim.qt_comparecimento) }}</dd></div>
            <div><dt>{{ $t('secao.biometriaNaoHabilitada') }}</dt><dd>{{ formatarNumero(boletim.qt_elei_biom_sem_habilitacao) }}</dd></div>
            <div><dt>{{ $t('secao.versoesAnteriores') }}</dt><dd>{{ formatarNumero(dados.versoes_anteriores) }}</dd></div>
          </dl>
        </section>
      </div>

      <section v-if="lote" class="card" aria-labelledby="secao-lote">
        <div class="card__cabecalho">
          <div>
            <h2 id="secao-lote">{{ $t('secao.lote') }}</h2>
            <p>{{ $t('secao.loteOrigem') }}</p>
          </div>
        </div>
        <dl class="dados dados--linha">
          <div><dt>{{ $t('secao.arquivo') }}</dt><dd>{{ lote.nome_arquivo }}</dd></div>
          <div><dt>SHA-256</dt><dd class="mono" :title="lote.sha256">{{ formatarSha(lote.sha256, 20) }}</dd></div>
        </dl>
      </section>

      <section class="card" aria-labelledby="secao-resultados">
        <div class="card__cabecalho">
          <div>
            <h2 id="secao-resultados">{{ $t('secao.resultados') }}</h2>
            <p>{{ $t('secao.resultadosDescricao') }}</p>
          </div>
          <span class="contador">{{ resultados.length }} {{ $t('unidade.linha', resultados.length) }}</span>
        </div>

        <StateBlock
          v-if="resultados.length === 0"
          estado="vazio"
          :titulo="$t('comum.semDados')"
        />
        <TabelaScroll v-else :atualizando="consulta.isFetching.value">
          <table>
            <caption class="sr-only">{{ $t('secao.resultadosCaption') }}</caption>
            <thead>
              <tr>
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('cd_tipo_votavel')"><button type="button" @click="alternar('cd_tipo_votavel')">{{ $t('secao.tipo') }}{{ seta('cd_tipo_votavel') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('nr_votavel')"><button type="button" @click="alternar('nr_votavel')">{{ $t('versoesBU.numero') }}{{ seta('nr_votavel') }}</button></th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_votavel')"><button type="button" @click="alternar('nm_votavel')">{{ $t('versoesBU.votavel') }}{{ seta('nm_votavel') }}</button></th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('sg_partido')"><button type="button" @click="alternar('sg_partido')">{{ $t('tabela.partido') }}{{ seta('sg_partido') }}</button></th>
                <th scope="col" class="ordenavel" :aria-sort="ariaSort('categoria')"><button type="button" @click="alternar('categoria')">{{ $t('secao.categoriaCol') }}{{ seta('categoria') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('qt_votos')"><button type="button" @click="alternar('qt_votos')">{{ $t('tabela.votos') }}{{ seta('qt_votos') }}</button></th>
                <th scope="col" class="num ordenavel" :aria-sort="ariaSort('percentual')"><button type="button" @click="alternar('percentual')">{{ $t('tabela.pctValidos') }}{{ seta('percentual') }}</button></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, indice) in resultados" :key="`${item.cd_tipo_votavel}-${item.nr_votavel}-${indice}`">
                <td>{{ item.cd_tipo_votavel }}</td>
                <td class="num">{{ item.nr_votavel ?? '—' }}</td>
                <td>{{ item.nm_votavel ?? '—' }}</td>
                <td>
                  <span v-if="item.sg_partido" class="lider">
                    <span
                      class="party-dot party-dot--mini"
                      :style="{
                        backgroundColor: corPartido(item.sg_partido),
                        color: corTextoContraste(corPartido(item.sg_partido)),
                      }"
                    >{{ item.sg_partido }}</span>
                    {{ item.nm_partido }}
                  </span>
                  <span v-else>—</span>
                </td>
                <td>{{ rotuloCategoria(item.categoria) }}</td>
                <td class="num">{{ formatarNumero(item.qt_votos) }}</td>
                <td class="num">{{ formatarPercentual(percentualResultado(item)) }}</td>
              </tr>
            </tbody>
          </table>
        </TabelaScroll>
      </section>
    </template>

      <VersoesBuPanel
        :dados="versoesDados"
        :loading="versoesConsulta.isLoading.value"
        :atualizando="versoesConsulta.isFetching.value"
        :error="versoesConsulta.error.value?.message"
        :ordenacao-campos="ordemCampos"
        :ordenacao-votaveis="ordemVotaveis"
        @retry="versoesConsulta.refetch()"
      />
    </div>
  </div>
  </Teleport>
</template>
