<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StateBlock from '../components/StateBlock.vue'
import VersoesBoletimPanel from '../components/VersoesBoletimPanel.vue'

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
import { useSecao } from '../composables/queries'
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
import { t } from '../i18n'
import { useFiltersStore } from '../stores/filters'

const store = useFiltersStore()
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
const consulta = useSecao(id)
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
      nominal: t('secao.cat.nominal'),
      legenda: t('secao.cat.legenda'),
      branco: t('secao.cat.branco'),
      nulo: t('secao.cat.nulo'),
    }[categoria] ?? categoria ?? '—'
  )
}

function precisao(valor) {
  return (
    {
      DATA_HORA: t('secao.precisao.DATA_HORA'),
      DATA: t('secao.precisao.DATA'),
      AUSENTE: t('secao.precisao.AUSENTE'),
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
          {{ $t('secao.voltar') }}
        </button>
        <button
          v-else
          type="button"
          class="button button--ghost secao-modal__fechar"
          :aria-label="$t('secao.fechar')"
          @click="fechar"
        >
          ✕
        </button>
        <p>{{ $t('secao.extrato') }}</p>
      </div>

    <StateBlock
      v-if="!habilitado"
      estado="vazio"
      :titulo="$t('secao.semFiltros')"
      :descricao="$t('secao.semFiltrosDesc')"
      :acao="$t('secao.irPainel')"
      @acao="voltar"
    />
    <StateBlock
      v-else-if="consulta.isLoading.value"
      estado="carregando"
      :titulo="$t('secao.carregando')"
    />
    <StateBlock
      v-else-if="consulta.error.value"
      estado="erro"
      :titulo="$t('secao.erro')"
      :descricao="consulta.error.value.message"
      :acao="$t('secao.voltarPainel')"
      @acao="voltar"
    />

    <template v-else-if="dados">
      <header class="page__cabecalho detalhe-cabecalho">
        <div>
          <h1>
            {{ $t('secao.cabecalho', { secao: secao?.nr_secao, zona: secao?.nr_zona }) }}
          </h1>
          <p class="page__descricao">
            {{ secao?.nm_municipio }} · {{ secao?.sg_uf }} · {{ $t('secoes.local') }}
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
            <div><dt>{{ $t('comum.uf') }}</dt><dd>{{ secao?.sg_uf }}</dd></div>
            <div><dt>{{ $t('comum.municipio') }}</dt><dd>{{ secao?.nm_municipio }}</dd></div>
            <div><dt>{{ $t('secao.codigoMunicipio') }}</dt><dd>{{ secao?.cd_municipio_tse }}</dd></div>
            <div><dt>{{ $t('comum.zona') }}</dt><dd>{{ secao?.nr_zona }}</dd></div>
            <div><dt>{{ $t('comum.secao') }}</dt><dd>{{ secao?.nr_secao }}</dd></div>
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
            :titulo="$t('secao.semBu')"
            :descricao="$t('secao.semBuDesc')"
          />
          <dl v-else class="dados">
            <div><dt>{{ $t('secao.tipoUrna') }}</dt><dd>{{ boletim.ds_tipo_urna ?? boletim.cd_tipo_urna ?? '—' }}</dd></div>
            <div><dt>{{ $t('versoes.versao') }}</dt><dd>{{ boletim.versao ?? '—' }}</dd></div>
            <div><dt>{{ $t('secao.precisaoRecebimento') }}</dt><dd>{{ precisao(boletim.precisao_dt_bu_recebido) }}</dd></div>
            <div><dt>{{ $t('versoes.abertura') }}</dt><dd>{{ formatarDataHora(boletim.dt_abertura) }}</dd></div>
            <div><dt>{{ $t('versoes.encerramento') }}</dt><dd>{{ formatarDataHora(boletim.dt_encerramento) }}</dd></div>
            <div><dt>{{ $t('secao.emissaoBu') }}</dt><dd>{{ formatarDataHora(boletim.dt_emissao_bu) }}</dd></div>
            <div><dt>{{ $t('secao.recebimento') }}</dt><dd>{{ recebimento() }}</dd></div>
            <div><dt>{{ $t('versoes.aptos') }}</dt><dd>{{ formatarNumero(boletim.qt_aptos) }}</dd></div>
            <div><dt>{{ $t('kpis.comparecimento') }}</dt><dd>{{ formatarNumero(boletim.qt_comparecimento) }}</dd></div>
            <div><dt>{{ $t('secao.biometriaNaoHabilitada') }}</dt><dd>{{ formatarNumero(boletim.qt_elei_biom_sem_habilitacao) }}</dd></div>
            <div><dt>{{ $t('secao.versoesAnteriores') }}</dt><dd>{{ formatarNumero(dados.versoes_anteriores) }}</dd></div>
          </dl>
        </section>
      </div>

      <section v-if="lote" class="card" aria-labelledby="secao-lote">
        <div class="card__cabecalho">
          <div>
            <h2 id="secao-lote">{{ $t('secao.lote') }}</h2>
            <p>{{ $t('secao.loteDesc') }}</p>
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
            <p>{{ $t('secao.resultadosDesc') }}</p>
          </div>
          <span class="contador">{{ $t('secao.nLinhas', { n: resultados.length }) }}</span>
        </div>

        <StateBlock
          v-if="resultados.length === 0"
          estado="vazio"
          :titulo="$t('secao.semResultados')"
        />
        <div v-else class="tabela-scroll">
          <table>
            <caption class="sr-only">{{ $t('secao.captionResultados') }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ $t('incidentes.tipo') }}</th>
                <th scope="col" class="num">{{ $t('versoes.numero') }}</th>
                <th scope="col">{{ $t('secao.votavel') }}</th>
                <th scope="col">{{ $t('comum.partido') }}</th>
                <th scope="col">{{ $t('secao.categoria') }}</th>
                <th scope="col" class="num">{{ $t('comum.votos') }}</th>
                <th scope="col" class="num">{{ $t('ufPanel.pctValidos') }}</th>
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
        </div>
      </section>

      <VersoesBoletimPanel :secao-id="id" />
    </template>
    </div>
  </div>
  </Teleport>
</template>
