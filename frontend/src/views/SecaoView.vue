<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StateBlock from '../components/StateBlock.vue'

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
      nominal: 'Nominal',
      legenda: 'Legenda',
      branco: 'Branco',
      nulo: 'Nulo',
    }[categoria] ?? categoria ?? '—'
  )
}

function precisao(valor) {
  return (
    {
      DATA_HORA: 'Data e hora',
      DATA: 'Somente data',
      AUSENTE: 'Ausente',
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
          ← Voltar ao painel
        </button>
        <button
          v-else
          type="button"
          class="button button--ghost secao-modal__fechar"
          aria-label="Fechar"
          @click="fechar"
        >
          ✕
        </button>
        <p>{{ $t('secao.extrato') || 'Extrato de teletipo · boletim de urna' }}</p>
      </div>

    <StateBlock
      v-if="!habilitado"
      estado="vazio"
      titulo="Filtros não informados"
      descricao="Volte ao painel, selecione uma eleição e um cargo e abra o detalhe pela tabela de seções."
      acao="Ir ao painel"
      @acao="voltar"
    />
    <StateBlock
      v-else-if="consulta.isLoading.value"
      estado="carregando"
      titulo="Carregando detalhe da seção"
    />
    <StateBlock
      v-else-if="consulta.error.value"
      estado="erro"
      titulo="Não foi possível carregar a seção"
      :descricao="consulta.error.value.message"
      acao="Voltar ao painel"
      @acao="voltar"
    />

    <template v-else-if="dados">
      <header class="page__cabecalho detalhe-cabecalho">
        <div>
          <h1>
            Seção {{ secao?.nr_secao }} · Zona {{ secao?.nr_zona }}
          </h1>
          <p class="page__descricao">
            {{ secao?.nm_municipio }} · {{ secao?.sg_uf }} · Local
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
            <h2 id="secao-identificacao">Identificação</h2>
          </div>
          <dl class="dados">
            <div><dt>UF</dt><dd>{{ secao?.sg_uf }}</dd></div>
            <div><dt>Município</dt><dd>{{ secao?.nm_municipio }}</dd></div>
            <div><dt>Código do município</dt><dd>{{ secao?.cd_municipio_tse }}</dd></div>
            <div><dt>Zona</dt><dd>{{ secao?.nr_zona }}</dd></div>
            <div><dt>Seção</dt><dd>{{ secao?.nr_secao }}</dd></div>
            <div><dt>Local de votação</dt><dd>{{ secao?.nr_local_votacao }}</dd></div>
          </dl>
        </section>

        <section class="card" aria-labelledby="secao-boletim">
          <div class="card__cabecalho">
            <h2 id="secao-boletim">Boletim de urna</h2>
          </div>
          <StateBlock
            v-if="!boletim"
            estado="vazio"
            titulo="Sem BU no corte atual"
            descricao="Não há boletim de urna considerado para esta seção."
          />
          <dl v-else class="dados">
            <div><dt>Tipo de urna</dt><dd>{{ boletim.ds_tipo_urna ?? boletim.cd_tipo_urna ?? '—' }}</dd></div>
            <div><dt>Versão</dt><dd>{{ boletim.versao ?? '—' }}</dd></div>
            <div><dt>Precisão do recebimento</dt><dd>{{ precisao(boletim.precisao_dt_bu_recebido) }}</dd></div>
            <div><dt>Abertura</dt><dd>{{ formatarDataHora(boletim.dt_abertura) }}</dd></div>
            <div><dt>Encerramento</dt><dd>{{ formatarDataHora(boletim.dt_encerramento) }}</dd></div>
            <div><dt>Emissão do BU</dt><dd>{{ formatarDataHora(boletim.dt_emissao_bu) }}</dd></div>
            <div><dt>Recebimento</dt><dd>{{ recebimento() }}</dd></div>
            <div><dt>Aptos</dt><dd>{{ formatarNumero(boletim.qt_aptos) }}</dd></div>
            <div><dt>Comparecimento</dt><dd>{{ formatarNumero(boletim.qt_comparecimento) }}</dd></div>
            <div><dt>Biometria não habilitada</dt><dd>{{ formatarNumero(boletim.qt_elei_biom_sem_habilitacao) }}</dd></div>
            <div><dt>Versões anteriores</dt><dd>{{ formatarNumero(dados.versoes_anteriores) }}</dd></div>
          </dl>
        </section>
      </div>

      <section v-if="lote" class="card" aria-labelledby="secao-lote">
        <div class="card__cabecalho">
          <div>
            <h2 id="secao-lote">Lote de importação</h2>
            <p>Origem do BU considerado neste corte.</p>
          </div>
        </div>
        <dl class="dados dados--linha">
          <div><dt>Arquivo</dt><dd>{{ lote.nome_arquivo }}</dd></div>
          <div><dt>SHA-256</dt><dd class="mono" :title="lote.sha256">{{ formatarSha(lote.sha256, 20) }}</dd></div>
        </dl>
      </section>

      <section class="card" aria-labelledby="secao-resultados">
        <div class="card__cabecalho">
          <div>
            <h2 id="secao-resultados">Resultados da seção</h2>
            <p>Votos por tipo de votável no BU ativo.</p>
          </div>
          <span class="contador">{{ resultados.length }} linhas</span>
        </div>

        <StateBlock
          v-if="resultados.length === 0"
          estado="vazio"
          titulo="Sem resultados para esta seção"
        />
        <div v-else class="tabela-scroll">
          <table>
            <caption class="sr-only">Resultados por votável na seção</caption>
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col" class="num">Número</th>
                <th scope="col">Votável</th>
                <th scope="col">Partido</th>
                <th scope="col">Categoria</th>
                <th scope="col" class="num">Votos</th>
                <th scope="col" class="num">% válidos</th>
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
    </template>
    </div>
  </div>
  </Teleport>
</template>
